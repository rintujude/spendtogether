package com.familybudget.dto;

import com.familybudget.entity.PaymentSource;
import com.familybudget.entity.BudgetCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public final class AppDtos {
    private AppDtos() {
    }

    public record CreateWorkspaceRequest(
            @NotBlank @Size(max = 100) String name,
            @Pattern(regexp = "^[A-Z]{3}$") String currencyCode
    ) {
    }

    public record UpdateWorkspaceRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(min = 3, max = 3) @Pattern(regexp = "^[A-Z]{3}$") String currencyCode
    ) {
    }

    public record CreatePaymentSourceRequest(
            @NotBlank String name,
            @NotNull PaymentSource.SourceType type
    ) {
    }

    public record CreateCategoryRequest(
            @NotBlank String name,
            @NotNull BudgetCategory.CategoryType categoryType,
            @NotNull @DecimalMin("0.00") BigDecimal monthlyBudgetAmount
    ) {
    }

    public record UpdateCategoryRequest(
            @NotBlank String name,
            @NotNull BudgetCategory.CategoryType categoryType,
            @NotNull @DecimalMin("0.00") BigDecimal monthlyBudgetAmount
    ) {
    }

    public record UpdatePaymentSourceRequest(
            @NotBlank String name,
            @NotNull PaymentSource.SourceType type
    ) {
    }

    public record UpsertMonthlyBudgetRequest(
            @NotNull UUID categoryId,
            @Min(2000) int budgetYear,
            @Min(1) @Max(12) int budgetMonth,
            @NotNull @DecimalMin("0.01") BigDecimal limitAmount
    ) {
    }

    public record CreateExpenseRequest(
            @NotNull UUID categoryId,
            @NotNull UUID paymentSourceId,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @NotNull LocalDate expenseDate,
            String description
    ) {
    }

    public record UpdateTotalBudgetRequest(
            @NotNull @DecimalMin("0.01") BigDecimal amount
    ) {
    }

    public record RolloverBudgetRequest(
            @Min(1) @Max(12) int fromMonth,
            @Min(2000) @Max(2100) int fromYear,
            @Min(1) @Max(12) int toMonth,
            @Min(2000) @Max(2100) int toYear,
            boolean copyCategoryBudgets,
            boolean copyTotalBudget
    ) {
    }

    public record InviteMemberRequest(
            @NotBlank @jakarta.validation.constraints.Email String email,
            @NotNull com.familybudget.entity.WorkspaceMember.Role role,
            @Size(max = 500) String message
    ) {
    }

    public record UpdateMemberRoleRequest(
            @NotNull com.familybudget.entity.WorkspaceMember.Role role
    ) {
    }
}
