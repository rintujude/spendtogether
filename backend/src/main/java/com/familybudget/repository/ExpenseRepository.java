package com.familybudget.repository;

import com.familybudget.entity.Expense;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    @EntityGraph(attributePaths = {"category", "paymentSource", "addedBy"})
    List<Expense> findByWorkspaceIdAndExpenseDateBetweenOrderByExpenseDateDesc(
            UUID workspaceId,
            LocalDate startDate,
            LocalDate endDate
    );

    @EntityGraph(attributePaths = {"category", "paymentSource", "addedBy"})
    @Query("""
            select e from Expense e
            where e.workspace.id = :workspaceId
              and e.expenseDate between :startDate and :endDate
              and (:categoryId is null or e.category.id = :categoryId)
              and (:paymentSourceId is null or e.paymentSource.id = :paymentSourceId)
              and (:userId is null or e.addedBy.id = :userId)
            order by e.expenseDate desc, e.createdAt desc
            """)
    List<Expense> findFiltered(
            @Param("workspaceId") UUID workspaceId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("categoryId") UUID categoryId,
            @Param("paymentSourceId") UUID paymentSourceId,
            @Param("userId") UUID userId
    );

    boolean existsByCategoryId(UUID categoryId);
    boolean existsByPaymentSourceId(UUID paymentSourceId);
}
