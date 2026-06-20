package com.familybudget.repository;

import com.familybudget.entity.WorkspaceMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, UUID> {
    @EntityGraph(attributePaths = {"workspace", "user"})
    List<WorkspaceMember> findByUserIdAndStatusOrderByJoinedAtDesc(UUID userId, WorkspaceMember.Status status);

    @EntityGraph(attributePaths = "user")
    List<WorkspaceMember> findByWorkspaceIdAndStatusOrderByJoinedAtDesc(UUID workspaceId, WorkspaceMember.Status status);

    Optional<WorkspaceMember> findByWorkspaceIdAndUserIdAndStatus(UUID workspaceId, UUID userId, WorkspaceMember.Status status);

    boolean existsByWorkspaceIdAndUserIdAndStatus(UUID workspaceId, UUID userId, WorkspaceMember.Status status);

    long countByWorkspaceIdAndRoleAndStatus(UUID workspaceId, WorkspaceMember.Role role, WorkspaceMember.Status status);
}
