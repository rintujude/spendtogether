package com.familybudget.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "expenses")
@SQLRestriction("deleted_at IS NULL")
public class Expense extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private BudgetCategory category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_source_id")
    private PaymentSource paymentSource;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "added_by_user_id")
    private User addedBy;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false)
    private int expenseYear;

    @Column(nullable = false)
    private int expenseMonth;

    @Column
    private String description;

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

    public PaymentSource getPaymentSource() {
        return paymentSource;
    }

    public void setPaymentSource(PaymentSource paymentSource) {
        this.paymentSource = paymentSource;
    }

    public User getAddedBy() {
        return addedBy;
    }

    public void setAddedBy(User addedBy) {
        this.addedBy = addedBy;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getExpenseDate() {
        return expenseDate;
    }

    public void setExpenseDate(LocalDate expenseDate) {
        this.expenseDate = expenseDate;
        if (expenseDate != null) {
            this.expenseYear = expenseDate.getYear();
            this.expenseMonth = expenseDate.getMonthValue();
        }
    }

    public int getExpenseYear() {
        return expenseYear;
    }

    public int getExpenseMonth() {
        return expenseMonth;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
