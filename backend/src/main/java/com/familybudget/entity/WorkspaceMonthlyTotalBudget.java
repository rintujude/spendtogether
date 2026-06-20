package com.familybudget.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "workspace_monthly_total_budgets")
@SQLRestriction("deleted_at IS NULL")
public class WorkspaceMonthlyTotalBudget extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(nullable = false)
    private int budgetYear;

    @Column(nullable = false)
    private int budgetMonth;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "updated_by_user_id")
    private User updatedByUser;

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public int getBudgetYear() {
        return budgetYear;
    }

    public void setBudgetYear(int budgetYear) {
        this.budgetYear = budgetYear;
    }

    public int getBudgetMonth() {
        return budgetMonth;
    }

    public void setBudgetMonth(int budgetMonth) {
        this.budgetMonth = budgetMonth;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public User getUpdatedByUser() {
        return updatedByUser;
    }

    public void setUpdatedByUser(User updatedByUser) {
        this.updatedByUser = updatedByUser;
    }
}
