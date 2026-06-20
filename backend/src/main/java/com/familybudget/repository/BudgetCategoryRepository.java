package com.familybudget.repository;

import com.familybudget.entity.BudgetCategory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetCategoryRepository extends JpaRepository<BudgetCategory, UUID> {
    List<BudgetCategory> findByWorkspaceIdAndActiveTrueOrderByName(UUID workspaceId);
    boolean existsByWorkspaceIdAndNameIgnoreCaseAndActiveTrue(UUID workspaceId, String name);
}
