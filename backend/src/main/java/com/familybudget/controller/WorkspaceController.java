package com.familybudget.controller;

import com.familybudget.dto.AppDtos.CreateWorkspaceRequest;
import com.familybudget.dto.AppDtos.UpdateWorkspaceRequest;
import com.familybudget.entity.WorkspaceMember;
import com.familybudget.entity.Workspace;
import com.familybudget.repository.WorkspaceMemberRepository;
import com.familybudget.repository.WorkspaceRepository;
import com.familybudget.service.WorkspaceEventPublisher;
import com.familybudget.service.WorkspaceAccessService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceController.class);

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceAccessService accessService;
    private final WorkspaceEventPublisher eventPublisher;

    public WorkspaceController(
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository memberRepository,
            WorkspaceAccessService accessService,
            WorkspaceEventPublisher eventPublisher
    ) {
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.accessService = accessService;
        this.eventPublisher = eventPublisher;
    }

    @GetMapping
    public List<WorkspaceResponse> listWorkspaces(Principal principal) {
        var user = accessService.requireCurrentUser(principal);

        return memberRepository.findByUserIdAndStatusOrderByJoinedAtDesc(user.getId(), WorkspaceMember.Status.ACTIVE)
                .stream()
                .map(member -> WorkspaceResponse.from(member.getWorkspace()))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceResponse createWorkspace(@Valid @RequestBody CreateWorkspaceRequest request, Principal principal) {
        var user = accessService.requireCurrentUser(principal);

        Workspace workspace = new Workspace();
        workspace.setName(request.name());
        workspace.setCurrencyCode(request.currencyCode() == null || request.currencyCode().isBlank()
                ? "GBP"
                : request.currencyCode().toUpperCase());
        workspace.setCreatedByUser(user);
        workspaceRepository.save(workspace);

        WorkspaceMember member = new WorkspaceMember();
        member.setWorkspace(workspace);
        member.setUser(user);
        member.setRole(WorkspaceMember.Role.OWNER);
        member.setStatus(WorkspaceMember.Status.ACTIVE);
        memberRepository.save(member);
        log.info("Workspace created workspaceId={} ownerUserId={} currencyCode={}", workspace.getId(), user.getId(), workspace.getCurrencyCode());

        return WorkspaceResponse.from(workspace);
    }

    @PutMapping("/current")
    public WorkspaceResponse updateCurrentWorkspace(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @Valid @RequestBody UpdateWorkspaceRequest request,
            Principal principal
    ) {
        Workspace workspace = accessService.requireWorkspaceContributor(workspaceId, principal);
        workspace.setName(request.name());
        workspace.setCurrencyCode(request.currencyCode().toUpperCase());

        Workspace saved = workspaceRepository.save(workspace);
        eventPublisher.publish(workspaceId, "WORKSPACE_UPDATED", "WORKSPACE", saved.getId());
        log.info("Workspace updated workspaceId={} userId={}", workspaceId, accessService.requireCurrentUser(principal).getId());
        return WorkspaceResponse.from(saved);
    }

    public record WorkspaceResponse(UUID id, String name, String currencyCode, java.time.Instant updatedAt) {
        static WorkspaceResponse from(Workspace workspace) {
            return new WorkspaceResponse(
                    workspace.getId(),
                    workspace.getName(),
                    workspace.getCurrencyCode(),
                    workspace.getUpdatedAt()
            );
        }
    }
}
