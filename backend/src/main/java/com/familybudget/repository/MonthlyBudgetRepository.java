package com.familybudget.repository;

import com.familybudget.entity.MonthlyBudget;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudget, UUID> {
    @EntityGraph(attributePaths = "category")
    List<MonthlyBudget> findByWorkspaceIdAndBudgetYearAndBudgetMonth(UUID workspaceId, int budgetYear, int budgetMonth);
}
