package com.familybudget.controller;

import com.familybudget.service.DashboardService;
import com.familybudget.service.DashboardService.DashboardSummary;
import com.familybudget.service.PeriodFilter;
import com.familybudget.service.WorkspaceAccessService;
import java.security.Principal;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final WorkspaceAccessService accessService;

    public DashboardController(DashboardService dashboardService, WorkspaceAccessService accessService) {
        this.dashboardService = dashboardService;
        this.accessService = accessService;
    }

    @GetMapping
    public DashboardSummary getDashboard(
            @PathVariable UUID workspaceId,
            @RequestParam(required = false) String periodPreset,
            @RequestParam(required = false) String periodType,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) LocalDate date,
            Principal principal
    ) {
        accessService.requireWorkspaceMember(workspaceId, principal);
        PeriodFilter period = periodPreset == null
                ? PeriodFilter.from(periodType, month, year, startDate, endDate, date)
                : PeriodFilter.fromPreset(periodPreset, startDate, endDate);
        return dashboardService.getSummary(workspaceId, period);
    }

    @GetMapping({"/summary", "/remaining-by-category", "/spending-by-category", "/daily-spending-trend", "/account-spending"})
    public DashboardSummary getDashboardCard(
            @PathVariable UUID workspaceId,
            @RequestParam(required = false) String periodPreset,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Principal principal
    ) {
        accessService.requireWorkspaceMember(workspaceId, principal);
        return dashboardService.getSummary(workspaceId, PeriodFilter.fromPreset(periodPreset, startDate, endDate));
    }
}
