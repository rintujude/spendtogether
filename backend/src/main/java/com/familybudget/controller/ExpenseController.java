package com.familybudget.controller;

import com.familybudget.dto.AppDtos.CreateExpenseRequest;
import com.familybudget.entity.Expense;
import com.familybudget.repository.BudgetCategoryRepository;
import com.familybudget.repository.ExpenseRepository;
import com.familybudget.repository.PaymentSourceRepository;
import com.familybudget.service.PeriodFilter;
import com.familybudget.service.WorkspaceAccessService;
import com.familybudget.service.WorkspaceEventPublisher;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/expenses")
public class ExpenseController {

    private static final Logger log = LoggerFactory.getLogger(ExpenseController.class);

    private final ExpenseRepository expenseRepository;
    private final BudgetCategoryRepository categoryRepository;
    private final PaymentSourceRepository paymentSourceRepository;
    private final WorkspaceAccessService accessService;
    private final WorkspaceEventPublisher eventPublisher;

    public ExpenseController(
            ExpenseRepository expenseRepository,
            BudgetCategoryRepository categoryRepository,
            PaymentSourceRepository paymentSourceRepository,
            WorkspaceAccessService accessService,
            WorkspaceEventPublisher eventPublisher
    ) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.paymentSourceRepository = paymentSourceRepository;
        this.accessService = accessService;
        this.eventPublisher = eventPublisher;
    }

    @GetMapping
    public List<ExpenseResponse> list(
            @PathVariable UUID workspaceId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) String periodPreset,
            @RequestParam(required = false) String periodType,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID paymentSourceId,
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) UUID userId,
            Principal principal
    ) {
        accessService.requireWorkspaceMember(workspaceId, principal);
        PeriodFilter period = from != null && to != null
                ? PeriodFilter.from("CUSTOM_RANGE", null, null, from, to, null)
                : periodPreset != null
                ? PeriodFilter.fromPreset(periodPreset, startDate, endDate)
                : PeriodFilter.from(periodType, month, year, startDate, endDate, date);
        UUID resolvedUserId = memberId == null ? userId : memberId;

        return expenseRepository.findFiltered(
                        workspaceId,
                        period.startDate(),
                        period.endDate(),
                        categoryId,
                        paymentSourceId,
                        resolvedUserId
                )
                .stream()
                .map(ExpenseResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateExpenseRequest request,
            Principal principal
    ) {
        var workspace = accessService.requireExpenseContributor(workspaceId, principal);
        var user = accessService.requireCurrentUser(principal);
        var category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        var paymentSource = paymentSourceRepository.findById(request.paymentSourceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment source not found"));
        if (!category.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to this workspace");
        }
        if (!paymentSource.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment source does not belong to this workspace");
        }
        if (!category.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is not active");
        }
        if (!paymentSource.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment source is not active");
        }

        Expense expense = new Expense();
        expense.setWorkspace(workspace);
        expense.setCategory(category);
        expense.setPaymentSource(paymentSource);
        expense.setAddedBy(user);
        expense.setAmount(request.amount());
        expense.setExpenseDate(request.expenseDate());
        expense.setDescription(request.description());

        Expense saved = expenseRepository.save(expense);
        eventPublisher.publish(workspaceId, "EXPENSE_CREATED", "EXPENSE", saved.getId());
        log.info("Expense created workspaceId={} expenseId={} amount={} userId={}", workspaceId, saved.getId(), saved.getAmount(), user.getId());
        return ExpenseResponse.from(saved);
    }

    public record ExpenseResponse(
            UUID id,
            BigDecimal amount,
            LocalDate expenseDate,
            String categoryName,
            String paymentSourceName,
            String addedBy,
            String description
    ) {
        static ExpenseResponse from(Expense expense) {
            return new ExpenseResponse(
                    expense.getId(),
                    expense.getAmount(),
                    expense.getExpenseDate(),
                    expense.getCategory().getName(),
                    expense.getPaymentSource().getName(),
                    expense.getAddedBy().getFullName(),
                    expense.getDescription()
            );
        }
    }
}
