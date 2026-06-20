package com.familybudget.controller;

import com.familybudget.dto.AppDtos.UpdateTotalBudgetRequest;
import com.familybudget.entity.WorkspaceMonthlyTotalBudget;
import com.familybudget.repository.WorkspaceMonthlyTotalBudgetRepository;
import com.familybudget.service.WorkspaceAccessService;
import com.familybudget.service.WorkspaceEventPublisher;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/budgets")
public class TotalBudgetController {

    private static final Logger log = LoggerFactory.getLogger(TotalBudgetController.class);

    private final WorkspaceMonthlyTotalBudgetRepository totalBudgetRepository;
    private final WorkspaceAccessService accessService;
    private final WorkspaceEventPublisher eventPublisher;

    public TotalBudgetController(
            WorkspaceMonthlyTotalBudgetRepository totalBudgetRepository,
            WorkspaceAccessService accessService,
            WorkspaceEventPublisher eventPublisher
    ) {
        this.totalBudgetRepository = totalBudgetRepository;
        this.accessService = accessService;
        this.eventPublisher = eventPublisher;
    }

    @PutMapping("/current-month/total")
    public TotalBudgetResponse updateCurrentMonthTotalBudget(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @Valid @RequestBody UpdateTotalBudgetRequest request,
            Principal principal
    ) {
        var workspace = accessService.requireWorkspaceOwner(workspaceId, principal);
        var user = accessService.requireCurrentUser(principal);
        LocalDate now = LocalDate.now();
        int budgetYear = year == null ? now.getYear() : year;
        int budgetMonth = month == null ? now.getMonthValue() : month;

        WorkspaceMonthlyTotalBudget totalBudget = totalBudgetRepository
                .findByWorkspaceIdAndBudgetYearAndBudgetMonth(workspaceId, budgetYear, budgetMonth)
                .orElseGet(() -> {
                    WorkspaceMonthlyTotalBudget created = new WorkspaceMonthlyTotalBudget();
                    created.setWorkspace(workspace);
                    created.setBudgetYear(budgetYear);
                    created.setBudgetMonth(budgetMonth);
                    return created;
                });

        totalBudget.setAmount(request.amount());
        totalBudget.setUpdatedByUser(user);
        WorkspaceMonthlyTotalBudget saved = totalBudgetRepository.save(totalBudget);
        eventPublisher.publish(workspaceId, "MONTHLY_BUDGET_UPDATED", "BUDGET", saved.getId());
        log.info("Total budget updated workspaceId={} budgetId={} year={} month={} amount={} userId={}", workspaceId, saved.getId(), saved.getBudgetYear(), saved.getBudgetMonth(), saved.getAmount(), user.getId());

        return new TotalBudgetResponse(
                saved.getBudgetMonth(),
                saved.getBudgetYear(),
                saved.getAmount(),
                saved.getUpdatedAt() == null ? Instant.now() : saved.getUpdatedAt()
        );
    }

    public record TotalBudgetResponse(
            int month,
            int year,
            java.math.BigDecimal totalBudget,
            Instant updatedAt
    ) {
    }
}
