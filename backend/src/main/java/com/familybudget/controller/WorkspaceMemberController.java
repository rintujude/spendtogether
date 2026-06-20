package com.familybudget.controller;

import com.familybudget.dto.AppDtos.InviteMemberRequest;
import com.familybudget.dto.AppDtos.UpdateMemberRoleRequest;
import com.familybudget.entity.WorkspaceInvitation;
import com.familybudget.entity.WorkspaceMember;
import com.familybudget.repository.WorkspaceInvitationRepository;
import com.familybudget.repository.WorkspaceMemberRepository;
import com.familybudget.repository.UserRepository;
import com.familybudget.service.NotificationService;
import com.familybudget.service.SoftDeleteService;
import com.familybudget.service.WorkspaceAccessService;
import com.familybudget.service.WorkspaceEventPublisher;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}")
public class WorkspaceMemberController {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceMemberController.class);

    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceInvitationRepository invitationRepository;
    private final WorkspaceAccessService accessService;
    private final WorkspaceEventPublisher eventPublisher;
    private final SoftDeleteService softDeleteService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public WorkspaceMemberController(
            WorkspaceMemberRepository memberRepository,
            WorkspaceInvitationRepository invitationRepository,
            WorkspaceAccessService accessService,
            WorkspaceEventPublisher eventPublisher,
            SoftDeleteService softDeleteService,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this.memberRepository = memberRepository;
        this.invitationRepository = invitationRepository;
        this.accessService = accessService;
        this.eventPublisher = eventPublisher;
        this.softDeleteService = softDeleteService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @GetMapping("/members")
    public WorkspaceMembersResponse listMembers(@PathVariable UUID workspaceId, Principal principal) {
        accessService.requireWorkspaceMember(workspaceId, principal);

        List<MemberResponse> members = memberRepository
                .findByWorkspaceIdAndStatusOrderByJoinedAtDesc(workspaceId, WorkspaceMember.Status.ACTIVE)
                .stream()
                .map(MemberResponse::from)
                .toList();

        List<InvitationResponse> invitations = invitationRepository
                .findByWorkspaceIdAndStatusOrderByCreatedAtDesc(workspaceId, WorkspaceInvitation.Status.PENDING)
                .stream()
                .map(InvitationResponse::from)
                .toList();

        return new WorkspaceMembersResponse(members, invitations);
    }

    @PostMapping("/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public InvitationResponse inviteMember(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody InviteMemberRequest request,
            Principal principal
    ) {
        var workspace = accessService.requireWorkspaceOwner(workspaceId, principal);
        var user = accessService.requireCurrentUser(principal);

        if (request.role() == WorkspaceMember.Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invite role must be CONTRIBUTOR or VIEWER");
        }
        if (invitationRepository.existsByWorkspaceIdAndEmailIgnoreCaseAndStatus(
                workspaceId,
                request.email(),
                WorkspaceInvitation.Status.PENDING
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A pending invitation already exists for this email");
        }

        WorkspaceInvitation invitation = new WorkspaceInvitation();
        invitation.setWorkspace(workspace);
        invitation.setEmail(request.email().toLowerCase());
        invitation.setRole(request.role());
        invitation.setMessage(request.message());
        invitation.setInvitedByUser(user);
        invitation.setExpiresAt(Instant.now().plusSeconds(7 * 24 * 60 * 60));

        WorkspaceInvitation saved = invitationRepository.save(invitation);
        userRepository.findByEmail(request.email().toLowerCase()).ifPresent(recipient ->
                notificationService.createNotification(new NotificationService.CreateNotificationCommand(
                        recipient.getId(),
                        workspaceId,
                        "WORKSPACE_INVITATION_RECEIVED",
                        "Workspace invitation",
                        user.getFullName() + " invited you to join " + workspace.getName(),
                        "ACCEPT_DECLINE_INVITATION",
                        "INVITATION",
                        saved.getId(),
                        Map.of(
                                "workspaceName", workspace.getName(),
                                "invitedByName", user.getFullName(),
                                "role", saved.getRole().name(),
                                "expiresAt", saved.getExpiresAt().toString()
                        )
                ))
        );
        eventPublisher.publish(workspaceId, "WORKSPACE_UPDATED", "WORKSPACE_INVITATION", saved.getId());
        log.info("Member invited workspaceId={} invitationId={} invitedByUserId={} role={}", workspaceId, saved.getId(), user.getId(), saved.getRole());
        return InvitationResponse.from(saved);
    }

    @PatchMapping("/members/{memberId}/role")
    public MemberResponse updateRole(
            @PathVariable UUID workspaceId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            Principal principal
    ) {
        accessService.requireWorkspaceOwner(workspaceId, principal);
        WorkspaceMember member = requireWorkspaceMemberRecord(workspaceId, memberId);
        if (member.getRole() == WorkspaceMember.Role.OWNER && request.role() != WorkspaceMember.Role.OWNER) {
            ensureAnotherActiveOwner(workspaceId, member.getUser().getId());
        }

        member.setRole(request.role());
        WorkspaceMember saved = memberRepository.save(member);
        eventPublisher.publish(workspaceId, "WORKSPACE_UPDATED", "WORKSPACE_MEMBER", saved.getId());
        log.info("Member role updated workspaceId={} memberId={} role={}", workspaceId, saved.getId(), saved.getRole());
        return MemberResponse.from(saved);
    }

    @PatchMapping("/members/{memberId}/remove")
    public MemberResponse removeMember(
            @PathVariable UUID workspaceId,
            @PathVariable UUID memberId,
            Principal principal
    ) {
        var currentUser = accessService.requireCurrentUser(principal);
        accessService.requireWorkspaceOwner(workspaceId, principal);
        WorkspaceMember member = requireWorkspaceMemberRecord(workspaceId, memberId);
        if (member.getRole() == WorkspaceMember.Role.OWNER) {
            ensureAnotherActiveOwner(workspaceId, member.getUser().getId());
        }
        if (member.getUser().getId().equals(currentUser.getId())
                && memberRepository.countByWorkspaceIdAndRoleAndStatus(
                workspaceId,
                WorkspaceMember.Role.OWNER,
                WorkspaceMember.Status.ACTIVE
        ) <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The only owner cannot remove themselves");
        }

        member.setStatus(WorkspaceMember.Status.REMOVED);
        softDeleteService.softDelete(member);
        WorkspaceMember saved = memberRepository.save(member);
        eventPublisher.publish(workspaceId, "WORKSPACE_UPDATED", "WORKSPACE_MEMBER", saved.getId());
        log.info("Member removed workspaceId={} memberId={} removedByUserId={}", workspaceId, saved.getId(), currentUser.getId());
        return MemberResponse.from(saved);
    }

    private WorkspaceMember requireWorkspaceMemberRecord(UUID workspaceId, UUID memberId) {
        WorkspaceMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        if (!member.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member does not belong to this workspace");
        }
        return member;
    }

    private void ensureAnotherActiveOwner(UUID workspaceId, UUID userId) {
        long ownerCount = memberRepository.countByWorkspaceIdAndRoleAndStatus(
                workspaceId,
                WorkspaceMember.Role.OWNER,
                WorkspaceMember.Status.ACTIVE
        );
        if (ownerCount <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A workspace must have at least one active owner");
        }
    }

    public record WorkspaceMembersResponse(List<MemberResponse> members, List<InvitationResponse> pendingInvitations) {
    }

    public record MemberResponse(UUID id, UUID userId, String fullName, String email, WorkspaceMember.Role role, WorkspaceMember.Status status) {
        static MemberResponse from(WorkspaceMember member) {
            return new MemberResponse(
                    member.getId(),
                    member.getUser().getId(),
                    member.getUser().getFullName(),
                    member.getUser().getEmail(),
                    member.getRole(),
                    member.getStatus()
            );
        }
    }

    public record InvitationResponse(
            UUID id,
            String email,
            WorkspaceMember.Role role,
            WorkspaceInvitation.Status status,
            String message,
            String invitedBy,
            Instant expiresAt,
            Instant createdAt
    ) {
        static InvitationResponse from(WorkspaceInvitation invitation) {
            return new InvitationResponse(
                    invitation.getId(),
                    invitation.getEmail(),
                    invitation.getRole(),
                    invitation.getStatus(),
                    invitation.getMessage(),
                    invitation.getInvitedByUser().getFullName(),
                    invitation.getExpiresAt(),
                    invitation.getCreatedAt()
            );
        }
    }
}
