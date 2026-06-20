package com.familybudget.controller;

import com.familybudget.entity.WorkspaceInvitation;
import com.familybudget.entity.WorkspaceMember;
import com.familybudget.repository.WorkspaceInvitationRepository;
import com.familybudget.repository.WorkspaceMemberRepository;
import com.familybudget.service.NotificationService;
import com.familybudget.service.WorkspaceAccessService;
import com.familybudget.service.WorkspaceEventPublisher;
import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private static final Logger log = LoggerFactory.getLogger(InvitationController.class);

    private final WorkspaceInvitationRepository invitationRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceAccessService accessService;
    private final NotificationService notificationService;
    private final WorkspaceEventPublisher eventPublisher;

    public InvitationController(
            WorkspaceInvitationRepository invitationRepository,
            WorkspaceMemberRepository memberRepository,
            WorkspaceAccessService accessService,
            NotificationService notificationService,
            WorkspaceEventPublisher eventPublisher
    ) {
        this.invitationRepository = invitationRepository;
        this.memberRepository = memberRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
    }

    @GetMapping("/pending")
    @Transactional
    public List<PendingInvitationResponse> pendingInvitations(Principal principal) {
        var user = accessService.requireCurrentUser(principal);
        return invitationRepository
                .findByEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(user.getEmail(), WorkspaceInvitation.Status.PENDING)
                .stream()
                .filter(invitation -> !expireIfNeeded(invitation))
                .map(PendingInvitationResponse::from)
                .toList();
    }

    @PostMapping("/{invitationId}/accept")
    @Transactional
    public AcceptInvitationResponse acceptInvitation(@PathVariable UUID invitationId, Principal principal) {
        var user = accessService.requireCurrentUser(principal);
        WorkspaceInvitation invitation = requirePendingInvitationForUser(invitationId, user.getEmail());
        Instant now = Instant.now();

        WorkspaceMember membership = memberRepository
                .findByWorkspaceIdAndUserIdAndStatus(
                        invitation.getWorkspace().getId(),
                        user.getId(),
                        WorkspaceMember.Status.ACTIVE
                )
                .orElseGet(() -> {
                    WorkspaceMember member = new WorkspaceMember();
                    member.setWorkspace(invitation.getWorkspace());
                    member.setUser(user);
                    member.setRole(invitation.getRole());
                    member.setStatus(WorkspaceMember.Status.ACTIVE);
                    return memberRepository.save(member);
                });

        invitation.setStatus(WorkspaceInvitation.Status.ACCEPTED);
        invitation.setAcceptedAt(now);
        invitation.setAcceptedBy(user.getId());
        invitationRepository.save(invitation);
        notificationService.markInvitationNotificationsAsRead(user.getId(), invitation.getId());
        eventPublisher.publish(invitation.getWorkspace().getId(), "MEMBER_JOINED", "WORKSPACE_MEMBER", membership.getId());
        log.info("Invitation accepted workspaceId={} invitationId={} memberId={} userId={}", invitation.getWorkspace().getId(), invitation.getId(), membership.getId(), user.getId());

        return new AcceptInvitationResponse(
                invitation.getWorkspace().getId(),
                invitation.getWorkspace().getName(),
                membership.getRole(),
                membership.getStatus(),
                now
        );
    }

    @PostMapping("/{invitationId}/decline")
    @Transactional
    public DeclineInvitationResponse declineInvitation(@PathVariable UUID invitationId, Principal principal) {
        var user = accessService.requireCurrentUser(principal);
        WorkspaceInvitation invitation = requirePendingInvitationForUser(invitationId, user.getEmail());

        invitation.setStatus(WorkspaceInvitation.Status.DECLINED);
        invitationRepository.save(invitation);
        notificationService.markInvitationNotificationsAsRead(user.getId(), invitation.getId());
        eventPublisher.publish(invitation.getWorkspace().getId(), "INVITATION_DECLINED", "WORKSPACE_INVITATION", invitation.getId());
        log.info("Invitation declined workspaceId={} invitationId={} userId={}", invitation.getWorkspace().getId(), invitation.getId(), user.getId());

        return new DeclineInvitationResponse(invitation.getId(), invitation.getStatus());
    }

    private WorkspaceInvitation requirePendingInvitationForUser(UUID invitationId, String email) {
        WorkspaceInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));
        if (!invitation.getEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invitation belongs to another user");
        }
        if (invitation.getStatus() != WorkspaceInvitation.Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation is no longer pending");
        }
        if (expireIfNeeded(invitation)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invitation has expired");
        }
        return invitation;
    }

    private boolean expireIfNeeded(WorkspaceInvitation invitation) {
        if (invitation.getExpiresAt() != null
                && invitation.getStatus() == WorkspaceInvitation.Status.PENDING
                && invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus(WorkspaceInvitation.Status.EXPIRED);
            invitationRepository.save(invitation);
            return true;
        }
        return false;
    }

    public record PendingInvitationResponse(
            UUID id,
            UUID workspaceId,
            String workspaceName,
            String invitedEmail,
            WorkspaceMember.Role role,
            String invitedByName,
            Instant expiresAt,
            WorkspaceInvitation.Status status
    ) {
        static PendingInvitationResponse from(WorkspaceInvitation invitation) {
            return new PendingInvitationResponse(
                    invitation.getId(),
                    invitation.getWorkspace().getId(),
                    invitation.getWorkspace().getName(),
                    invitation.getEmail(),
                    invitation.getRole(),
                    invitation.getInvitedByUser().getFullName(),
                    invitation.getExpiresAt(),
                    invitation.getStatus()
            );
        }
    }

    public record AcceptInvitationResponse(
            UUID workspaceId,
            String workspaceName,
            WorkspaceMember.Role role,
            WorkspaceMember.Status status,
            Instant acceptedAt
    ) {
    }

    public record DeclineInvitationResponse(UUID invitationId, WorkspaceInvitation.Status status) {
    }
}
