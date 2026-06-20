package com.familybudget.repository;

import com.familybudget.entity.WorkspaceInvitation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceInvitationRepository extends JpaRepository<WorkspaceInvitation, UUID> {
    @EntityGraph(attributePaths = "invitedByUser")
    List<WorkspaceInvitation> findByWorkspaceIdAndStatusOrderByCreatedAtDesc(
            UUID workspaceId,
            WorkspaceInvitation.Status status
    );

    boolean existsByWorkspaceIdAndEmailIgnoreCaseAndStatus(
            UUID workspaceId,
            String email,
            WorkspaceInvitation.Status status
    );

    @EntityGraph(attributePaths = {"workspace", "invitedByUser"})
    List<WorkspaceInvitation> findByEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String email,
            WorkspaceInvitation.Status status
    );

    @Override
    @EntityGraph(attributePaths = {"workspace", "invitedByUser"})
    Optional<WorkspaceInvitation> findById(UUID id);
}
