package com.familybudget.service;

import com.familybudget.entity.Workspace;
import com.familybudget.entity.WorkspaceMember;
import com.familybudget.entity.User;
import com.familybudget.repository.WorkspaceMemberRepository;
import com.familybudget.repository.WorkspaceRepository;
import com.familybudget.repository.UserRepository;
import java.security.Principal;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorkspaceAccessService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final CurrentUserService currentUserService;

    public WorkspaceAccessService(
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository memberRepository,
            CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.currentUserService = currentUserService;
    }

    public User requireCurrentUser(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }

        return userRepository.findById(currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public Workspace requireWorkspaceMember(UUID workspaceId, Principal principal) {
        requireActiveMembership(workspaceId, principal);
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));
    }

    public WorkspaceMember requireActiveMembership(UUID workspaceId, Principal principal) {
        User user = requireCurrentUser(principal);

        return memberRepository.findByWorkspaceIdAndUserIdAndStatus(
                        workspaceId,
                        user.getId(),
                        WorkspaceMember.Status.ACTIVE
                )
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not an active member of this workspace"));
    }

    public Workspace requireWorkspaceOwner(UUID workspaceId, Principal principal) {
        WorkspaceMember member = requireActiveMembership(workspaceId, principal);
        if (member.getRole() != WorkspaceMember.Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workspace owners can manage this resource");
        }

        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));
    }

    public Workspace requireExpenseContributor(UUID workspaceId, Principal principal) {
        WorkspaceMember member = requireActiveMembership(workspaceId, principal);
        if (member.getRole() == WorkspaceMember.Role.VIEWER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Viewers cannot modify expenses");
        }

        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));
    }

    public Workspace requireWorkspaceContributor(UUID workspaceId, Principal principal) {
        WorkspaceMember member = requireActiveMembership(workspaceId, principal);
        if (member.getRole() == WorkspaceMember.Role.VIEWER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Viewers can only view workspace data");
        }

        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));
    }
}
