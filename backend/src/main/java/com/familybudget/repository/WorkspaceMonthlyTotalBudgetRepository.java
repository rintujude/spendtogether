package com.familybudget.repository;

import com.familybudget.entity.WorkspaceMonthlyTotalBudget;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceMonthlyTotalBudgetRepository extends JpaRepository<WorkspaceMonthlyTotalBudget, UUID> {
    Optional<WorkspaceMonthlyTotalBudget> findByWorkspaceIdAndBudgetYearAndBudgetMonth(
            UUID workspaceId,
            int budgetYear,
            int budgetMonth
    );
}
