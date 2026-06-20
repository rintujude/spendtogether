package com.familybudget.repository;

import com.familybudget.entity.Workspace;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {
}
