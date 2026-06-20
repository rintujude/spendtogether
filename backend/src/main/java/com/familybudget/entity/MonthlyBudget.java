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
@Table(name = "monthly_budgets")
@SQLRestriction("deleted_at IS NULL")
public class MonthlyBudget extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private BudgetCategory category;

    @Column(nullable = false)
    private int budgetYear;

    @Column(nullable = false)
    private int budgetMonth;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal limitAmount;

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public BudgetCategory getCategory() {
        return category;
    }

    public void setCategory(BudgetCategory category) {
        this.category = category;
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

    public BigDecimal getLimitAmount() {
        return limitAmount;
    }

    public void setLimitAmount(BigDecimal limitAmount) {
        this.limitAmount = limitAmount;
    }
}
