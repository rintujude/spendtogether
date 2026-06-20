package com.familybudget.service;

import com.familybudget.entity.Expense;
import com.familybudget.entity.MonthlyBudget;
import com.familybudget.repository.ExpenseRepository;
import com.familybudget.repository.WorkspaceRepository;
import com.familybudget.repository.MonthlyBudgetRepository;
import com.familybudget.repository.WorkspaceMonthlyTotalBudgetRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DashboardService {

    private final MonthlyBudgetRepository monthlyBudgetRepository;
    private final ExpenseRepository expenseRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMonthlyTotalBudgetRepository totalBudgetRepository;

    public DashboardService(
            MonthlyBudgetRepository monthlyBudgetRepository,
            ExpenseRepository expenseRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceMonthlyTotalBudgetRepository totalBudgetRepository
    ) {
        this.monthlyBudgetRepository = monthlyBudgetRepository;
        this.expenseRepository = expenseRepository;
        this.workspaceRepository = workspaceRepository;
        this.totalBudgetRepository = totalBudgetRepository;
    }

    public DashboardSummary getSummary(UUID workspaceId, PeriodFilter period) {
        String currencyCode = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"))
                .getCurrencyCode();
        int budgetYear = period.year();
        int budgetMonth = period.month();

        List<MonthlyBudget> budgets = monthlyBudgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(
                workspaceId,
                budgetYear,
                budgetMonth
        );
        List<Expense> expenses = expenseRepository.findFiltered(
                workspaceId,
                period.startDate(),
                period.endDate(),
                null,
                null,
                null
        );

        BigDecimal categoryBudgetTotal = budgets.stream()
                .map(MonthlyBudget::getLimitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBudget = totalBudgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(workspaceId, budgetYear, budgetMonth)
                .map(total -> total.getAmount())
                .orElse(categoryBudgetTotal);
        BigDecimal totalSpent = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> categorySpend = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        Map<String, BigDecimal> accountSpend = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getPaymentSource().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        Map<UUID, BigDecimal> categorySpendById = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getCategory().getId(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        Map<LocalDate, BigDecimal> dailySpending = expenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getExpenseDate,
                        TreeMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        List<CategoryBudgetStatus> categories = budgets.stream()
                .filter(budget -> budget.getCategory().isActive())
                .map(budget -> {
                    BigDecimal budgetAmount = budget.getLimitAmount();
                    BigDecimal spentAmount = categorySpendById.getOrDefault(budget.getCategory().getId(), BigDecimal.ZERO);
                    BigDecimal remainingAmount = budgetAmount.subtract(spentAmount);
                    BigDecimal percentageUsed = budgetAmount.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : spentAmount
                                    .multiply(BigDecimal.valueOf(100))
                                    .divide(budgetAmount, 2, RoundingMode.HALF_UP);

                    return new CategoryBudgetStatus(
                            budget.getCategory().getId(),
                            budget.getCategory().getName(),
                            budgetAmount,
                            spentAmount,
                            remainingAmount,
                            percentageUsed,
                            remainingAmount.compareTo(BigDecimal.ZERO) < 0
                    );
                })
                .sorted(Comparator
                        .comparing(CategoryBudgetStatus::overBudget).reversed()
                        .thenComparing(CategoryBudgetStatus::remainingAmount)
                        .thenComparing(CategoryBudgetStatus::categoryName))
                .toList();

        return new DashboardSummary(
                period.periodType(),
                budgetMonth,
                budgetYear,
                period.startDate(),
                period.endDate(),
                currencyCode,
                currencySymbol(currencyCode),
                totalBudget,
                totalSpent,
                totalBudget.subtract(totalSpent),
                categorySpend,
                accountSpend,
                dailySpending,
                categories
        );
    }

    private String currencySymbol(String currencyCode) {
        return switch (currencyCode) {
            case "GBP" -> "£";
            case "INR" -> "₹";
            case "USD", "CAD", "AUD" -> "$";
            case "EUR" -> "€";
            case "AED" -> "د.إ";
            default -> currencyCode;
        };
    }

    public record DashboardSummary(
            PeriodFilter.PeriodType periodType,
            int month,
            int year,
            LocalDate startDate,
            LocalDate endDate,
            String currencyCode,
            String currencySymbol,
            BigDecimal totalBudget,
            BigDecimal totalSpent,
            BigDecimal remainingAmount,
            Map<String, BigDecimal> categoryWiseSpending,
            Map<String, BigDecimal> accountWiseSpending,
            Map<LocalDate, BigDecimal> dailySpending,
            List<CategoryBudgetStatus> categories
    ) {
    }

    public record CategoryBudgetStatus(
            UUID categoryId,
            String categoryName,
            BigDecimal budgetAmount,
            BigDecimal spentAmount,
            BigDecimal remainingAmount,
            BigDecimal percentageUsed,
            boolean overBudget
    ) {
    }
}
