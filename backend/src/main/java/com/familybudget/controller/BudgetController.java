package com.familybudget.controller;

import com.familybudget.dto.AppDtos.UpsertMonthlyBudgetRequest;
import com.familybudget.dto.AppDtos.RolloverBudgetRequest;
import com.familybudget.entity.MonthlyBudget;
import com.familybudget.entity.WorkspaceMonthlyTotalBudget;
import com.familybudget.repository.BudgetCategoryRepository;
import com.familybudget.repository.MonthlyBudgetRepository;
import com.familybudget.repository.WorkspaceMonthlyTotalBudgetRepository;
import com.familybudget.service.SoftDeleteService;
import com.familybudget.service.WorkspaceAccessService;
import com.familybudget.service.WorkspaceEventPublisher;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/budgets")
public class BudgetController {

    private static final Logger log = LoggerFactory.getLogger(BudgetController.class);

    private final MonthlyBudgetRepository budgetRepository;
    private final BudgetCategoryRepository categoryRepository;
    private final WorkspaceAccessService accessService;
    private final SoftDeleteService softDeleteService;
    private final WorkspaceEventPublisher eventPublisher;
    private final WorkspaceMonthlyTotalBudgetRepository totalBudgetRepository;

    public BudgetController(
            MonthlyBudgetRepository budgetRepository,
            BudgetCategoryRepository categoryRepository,
            WorkspaceAccessService accessService,
            SoftDeleteService softDeleteService,
            WorkspaceEventPublisher eventPublisher,
            WorkspaceMonthlyTotalBudgetRepository totalBudgetRepository
    ) {
        this.budgetRepository = budgetRepository;
        this.categoryRepository = categoryRepository;
        this.accessService = accessService;
        this.softDeleteService = softDeleteService;
        this.eventPublisher = eventPublisher;
        this.totalBudgetRepository = totalBudgetRepository;
    }

    @PostMapping("/rollover")
    public RolloverBudgetResponse rollover(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody RolloverBudgetRequest request,
            Principal principal
    ) {
        var workspace = accessService.requireWorkspaceOwner(workspaceId, principal);
        int copiedCategoryBudgets = 0;
        boolean copiedTotalBudget = false;

        if (request.copyCategoryBudgets()) {
            List<MonthlyBudget> sourceBudgets = budgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(
                    workspaceId,
                    request.fromYear(),
                    request.fromMonth()
            );
            for (MonthlyBudget source : sourceBudgets) {
                boolean exists = budgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(
                                workspaceId,
                                request.toYear(),
                                request.toMonth()
                        )
                        .stream()
                        .anyMatch(existing -> existing.getCategory().getId().equals(source.getCategory().getId()));
                if (!exists && source.getCategory().isActive()) {
                    MonthlyBudget target = new MonthlyBudget();
                    target.setWorkspace(workspace);
                    target.setCategory(source.getCategory());
                    target.setBudgetYear(request.toYear());
                    target.setBudgetMonth(request.toMonth());
                    target.setLimitAmount(source.getLimitAmount());
                    budgetRepository.save(target);
                    copiedCategoryBudgets++;
                }
            }
        }

        if (request.copyTotalBudget()) {
            boolean targetExists = totalBudgetRepository
                    .findByWorkspaceIdAndBudgetYearAndBudgetMonth(workspaceId, request.toYear(), request.toMonth())
                    .isPresent();
            if (!targetExists) {
                totalBudgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(
                        workspaceId,
                        request.fromYear(),
                        request.fromMonth()
                ).ifPresent(source -> {
                    WorkspaceMonthlyTotalBudget target = new WorkspaceMonthlyTotalBudget();
                    target.setWorkspace(workspace);
                    target.setBudgetYear(request.toYear());
                    target.setBudgetMonth(request.toMonth());
                    target.setAmount(source.getAmount());
                    target.setUpdatedByUser(accessService.requireCurrentUser(principal));
                    totalBudgetRepository.save(target);
                });
                copiedTotalBudget = totalBudgetRepository
                        .findByWorkspaceIdAndBudgetYearAndBudgetMonth(workspaceId, request.toYear(), request.toMonth())
                        .isPresent();
            }
        }

        eventPublisher.publish(workspaceId, "MONTHLY_BUDGET_UPDATED", "BUDGET", workspaceId);
        return new RolloverBudgetResponse(copiedCategoryBudgets, copiedTotalBudget);
    }

    @GetMapping
    public List<BudgetResponse> list(
            @PathVariable UUID workspaceId,
            @RequestParam int year,
            @RequestParam int month,
            Principal principal
    ) {
        accessService.requireWorkspaceMember(workspaceId, principal);
        return budgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(workspaceId, year, month)
                .stream()
                .map(BudgetResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse create(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody UpsertMonthlyBudgetRequest request,
            Principal principal
    ) {
        var workspace = accessService.requireWorkspaceOwner(workspaceId, principal);
        var category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to this workspace");
        }
        boolean duplicate = budgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(
                        workspaceId,
                        request.budgetYear(),
                        request.budgetMonth()
                )
                .stream()
                .anyMatch(existing -> existing.getDeletedAt() == null
                        && existing.getCategory().getId().equals(request.categoryId()));
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Budget already exists for this category and month");
        }

        MonthlyBudget budget = new MonthlyBudget();
        budget.setWorkspace(workspace);
        budget.setCategory(category);
        budget.setBudgetYear(request.budgetYear());
        budget.setBudgetMonth(request.budgetMonth());
        budget.setLimitAmount(request.limitAmount());

        MonthlyBudget saved = budgetRepository.save(budget);
        eventPublisher.publish(workspaceId, "MONTHLY_BUDGET_UPDATED", "BUDGET", saved.getId());
        log.info("Budget created workspaceId={} budgetId={} categoryId={} year={} month={} amount={}", workspaceId, saved.getId(), category.getId(), saved.getBudgetYear(), saved.getBudgetMonth(), saved.getLimitAmount());
        return BudgetResponse.from(saved);
    }

    @PutMapping("/{budgetId}")
    public BudgetResponse update(
            @PathVariable UUID workspaceId,
            @PathVariable UUID budgetId,
            @Valid @RequestBody UpsertMonthlyBudgetRequest request,
            Principal principal
    ) {
        accessService.requireWorkspaceOwner(workspaceId, principal);
        MonthlyBudget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Budget not found"));
        if (!budget.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Budget does not belong to this workspace");
        }
        var category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to this workspace");
        }
        budget.setCategory(category);
        budget.setBudgetYear(request.budgetYear());
        budget.setBudgetMonth(request.budgetMonth());
        budget.setLimitAmount(request.limitAmount());
        MonthlyBudget saved = budgetRepository.save(budget);
        eventPublisher.publish(workspaceId, "MONTHLY_BUDGET_UPDATED", "BUDGET", saved.getId());
        log.info("Budget updated workspaceId={} budgetId={} categoryId={} year={} month={} amount={}", workspaceId, saved.getId(), category.getId(), saved.getBudgetYear(), saved.getBudgetMonth(), saved.getLimitAmount());
        return BudgetResponse.from(saved);
    }

    @PatchMapping("/{budgetId}/deactivate")
    public BudgetResponse deactivate(
            @PathVariable UUID workspaceId,
            @PathVariable UUID budgetId,
            Principal principal
    ) {
        accessService.requireWorkspaceOwner(workspaceId, principal);
        MonthlyBudget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Budget not found"));
        if (!budget.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Budget does not belong to this workspace");
        }
        softDeleteService.softDelete(budget);
        MonthlyBudget saved = budgetRepository.save(budget);
        eventPublisher.publish(workspaceId, "MONTHLY_BUDGET_UPDATED", "BUDGET", saved.getId());
        log.info("Budget soft deleted workspaceId={} budgetId={}", workspaceId, saved.getId());
        return BudgetResponse.from(saved);
    }

    public record BudgetResponse(UUID id, UUID categoryId, String categoryName, int year, int month, BigDecimal limitAmount) {
        static BudgetResponse from(MonthlyBudget budget) {
            return new BudgetResponse(
                    budget.getId(),
                    budget.getCategory().getId(),
                    budget.getCategory().getName(),
                    budget.getBudgetYear(),
                    budget.getBudgetMonth(),
                    budget.getLimitAmount()
            );
        }
    }

    public record RolloverBudgetResponse(int copiedCategoryBudgets, boolean copiedTotalBudget) {
    }
}
