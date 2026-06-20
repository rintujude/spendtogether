package com.familybudget.controller;

import com.familybudget.dto.AppDtos.CreateCategoryRequest;
import com.familybudget.dto.AppDtos.UpdateCategoryRequest;
import com.familybudget.entity.BudgetCategory;
import com.familybudget.entity.MonthlyBudget;
import com.familybudget.repository.BudgetCategoryRepository;
import com.familybudget.repository.MonthlyBudgetRepository;
import com.familybudget.service.SoftDeleteService;
import com.familybudget.service.WorkspaceAccessService;
import com.familybudget.service.WorkspaceEventPublisher;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/categories")
public class CategoryController {

    private final BudgetCategoryRepository categoryRepository;
    private final MonthlyBudgetRepository budgetRepository;
    private final WorkspaceAccessService accessService;
    private final SoftDeleteService softDeleteService;
    private final WorkspaceEventPublisher eventPublisher;

    public CategoryController(
            BudgetCategoryRepository categoryRepository,
            MonthlyBudgetRepository budgetRepository,
            WorkspaceAccessService accessService,
            SoftDeleteService softDeleteService,
            WorkspaceEventPublisher eventPublisher
    ) {
        this.categoryRepository = categoryRepository;
        this.budgetRepository = budgetRepository;
        this.accessService = accessService;
        this.softDeleteService = softDeleteService;
        this.eventPublisher = eventPublisher;
    }

    @GetMapping
    public List<CategoryResponse> list(@PathVariable UUID workspaceId, Principal principal) {
        accessService.requireWorkspaceMember(workspaceId, principal);
        LocalDate now = LocalDate.now();
        return categoryRepository.findByWorkspaceIdAndActiveTrueOrderByName(workspaceId)
                .stream()
                .map(category -> CategoryResponse.from(category, findCurrentMonthBudgetAmount(workspaceId, category.getId(), now)))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CategoryResponse create(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreateCategoryRequest request,
            Principal principal
    ) {
        var workspace = accessService.requireWorkspaceOwner(workspaceId, principal);
        if (categoryRepository.existsByWorkspaceIdAndNameIgnoreCaseAndActiveTrue(workspaceId, request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
        }

        BudgetCategory category = new BudgetCategory();
        category.setWorkspace(workspace);
        category.setName(request.name());
        category.setCategoryType(request.categoryType());
        BudgetCategory savedCategory = categoryRepository.save(category);
        MonthlyBudget budget = upsertCurrentMonthBudget(workspaceId, savedCategory, request.monthlyBudgetAmount());
        eventPublisher.publish(workspaceId, "CATEGORY_CREATED", "CATEGORY", savedCategory.getId());
        eventPublisher.publish(workspaceId, "CATEGORY_BUDGET_UPDATED", "BUDGET", budget.getId());

        return CategoryResponse.from(savedCategory, budget.getLimitAmount());
    }

    @PutMapping("/{categoryId}")
    @Transactional
    public CategoryResponse update(
            @PathVariable UUID workspaceId,
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateCategoryRequest request,
            Principal principal
    ) {
        accessService.requireWorkspaceOwner(workspaceId, principal);
        BudgetCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to this workspace");
        }
        boolean duplicate = categoryRepository.existsByWorkspaceIdAndNameIgnoreCaseAndActiveTrue(workspaceId, request.name())
                && !category.getName().equalsIgnoreCase(request.name());
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
        }
        category.setName(request.name());
        category.setCategoryType(request.categoryType());
        BudgetCategory savedCategory = categoryRepository.save(category);
        MonthlyBudget budget = upsertCurrentMonthBudget(workspaceId, savedCategory, request.monthlyBudgetAmount());
        eventPublisher.publish(workspaceId, "CATEGORY_UPDATED", "CATEGORY", savedCategory.getId());
        eventPublisher.publish(workspaceId, "CATEGORY_BUDGET_UPDATED", "BUDGET", budget.getId());
        return CategoryResponse.from(savedCategory, budget.getLimitAmount());
    }

    @PatchMapping("/{categoryId}/deactivate")
    public CategoryResponse deactivate(
            @PathVariable UUID workspaceId,
            @PathVariable UUID categoryId,
            Principal principal
    ) {
        accessService.requireWorkspaceOwner(workspaceId, principal);
        BudgetCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category does not belong to this workspace");
        }
        category.setActive(false);
        softDeleteService.softDelete(category);
        BudgetCategory saved = categoryRepository.save(category);
        eventPublisher.publish(workspaceId, "CATEGORY_DELETED", "CATEGORY", saved.getId());
        return CategoryResponse.from(saved, BigDecimal.ZERO);
    }

    private MonthlyBudget upsertCurrentMonthBudget(UUID workspaceId, BudgetCategory category, BigDecimal amount) {
        LocalDate now = LocalDate.now();
        MonthlyBudget budget = budgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(
                        workspaceId,
                        now.getYear(),
                        now.getMonthValue()
                )
                .stream()
                .filter(existing -> existing.getCategory().getId().equals(category.getId()))
                .findFirst()
                .orElseGet(() -> {
                    MonthlyBudget created = new MonthlyBudget();
                    created.setWorkspace(category.getWorkspace());
                    created.setCategory(category);
                    created.setBudgetYear(now.getYear());
                    created.setBudgetMonth(now.getMonthValue());
                    return created;
                });

        budget.setLimitAmount(amount);
        return budgetRepository.save(budget);
    }

    private BigDecimal findCurrentMonthBudgetAmount(UUID workspaceId, UUID categoryId, LocalDate now) {
        return budgetRepository.findByWorkspaceIdAndBudgetYearAndBudgetMonth(
                        workspaceId,
                        now.getYear(),
                        now.getMonthValue()
                )
                .stream()
                .filter(budget -> budget.getCategory().getId().equals(categoryId))
                .map(MonthlyBudget::getLimitAmount)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    public record CategoryResponse(UUID id, String name, BudgetCategory.CategoryType categoryType, BigDecimal monthlyBudgetAmount) {
        static CategoryResponse from(BudgetCategory category, BigDecimal monthlyBudgetAmount) {
            return new CategoryResponse(
                    category.getId(),
                    category.getName(),
                    category.getCategoryType(),
                    monthlyBudgetAmount
            );
        }
    }
}
