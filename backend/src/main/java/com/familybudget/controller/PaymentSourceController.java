package com.familybudget.controller;

import com.familybudget.dto.AppDtos.CreatePaymentSourceRequest;
import com.familybudget.dto.AppDtos.UpdatePaymentSourceRequest;
import com.familybudget.entity.PaymentSource;
import com.familybudget.repository.PaymentSourceRepository;
import com.familybudget.service.SoftDeleteService;
import com.familybudget.service.WorkspaceAccessService;
import com.familybudget.service.WorkspaceEventPublisher;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
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
@RequestMapping("/api/workspaces/{workspaceId}/payment-sources")
public class PaymentSourceController {

    private final PaymentSourceRepository paymentSourceRepository;
    private final WorkspaceAccessService accessService;
    private final SoftDeleteService softDeleteService;
    private final WorkspaceEventPublisher eventPublisher;

    public PaymentSourceController(
            PaymentSourceRepository paymentSourceRepository,
            WorkspaceAccessService accessService,
            SoftDeleteService softDeleteService,
            WorkspaceEventPublisher eventPublisher
    ) {
        this.paymentSourceRepository = paymentSourceRepository;
        this.accessService = accessService;
        this.softDeleteService = softDeleteService;
        this.eventPublisher = eventPublisher;
    }

    @GetMapping
    public List<PaymentSourceResponse> list(@PathVariable UUID workspaceId, Principal principal) {
        accessService.requireWorkspaceMember(workspaceId, principal);
        return paymentSourceRepository.findByWorkspaceIdAndActiveTrueOrderByName(workspaceId)
                .stream()
                .map(PaymentSourceResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentSourceResponse create(
            @PathVariable UUID workspaceId,
            @Valid @RequestBody CreatePaymentSourceRequest request,
            Principal principal
    ) {
        var workspace = accessService.requireWorkspaceContributor(workspaceId, principal);
        if (paymentSourceRepository.existsByWorkspaceIdAndNameIgnoreCaseAndActiveTrue(workspaceId, request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment source name already exists");
        }

        PaymentSource source = new PaymentSource();
        source.setWorkspace(workspace);
        source.setName(request.name());
        source.setType(request.type());

        PaymentSource saved = paymentSourceRepository.save(source);
        eventPublisher.publish(workspaceId, "ACCOUNT_CREATED", "ACCOUNT", saved.getId());
        return PaymentSourceResponse.from(saved);
    }

    @PutMapping("/{sourceId}")
    public PaymentSourceResponse update(
            @PathVariable UUID workspaceId,
            @PathVariable UUID sourceId,
            @Valid @RequestBody UpdatePaymentSourceRequest request,
            Principal principal
    ) {
        accessService.requireWorkspaceContributor(workspaceId, principal);
        PaymentSource source = paymentSourceRepository.findById(sourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment source not found"));
        if (!source.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment source does not belong to this workspace");
        }
        boolean duplicate = paymentSourceRepository.existsByWorkspaceIdAndNameIgnoreCaseAndActiveTrue(workspaceId, request.name())
                && !source.getName().equalsIgnoreCase(request.name());
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment source name already exists");
        }
        source.setName(request.name());
        source.setType(request.type());
        PaymentSource saved = paymentSourceRepository.save(source);
        eventPublisher.publish(workspaceId, "ACCOUNT_UPDATED", "ACCOUNT", saved.getId());
        return PaymentSourceResponse.from(saved);
    }

    @PatchMapping("/{sourceId}/deactivate")
    public PaymentSourceResponse deactivate(
            @PathVariable UUID workspaceId,
            @PathVariable UUID sourceId,
            Principal principal
    ) {
        accessService.requireWorkspaceContributor(workspaceId, principal);
        PaymentSource source = paymentSourceRepository.findById(sourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment source not found"));
        if (!source.getWorkspace().getId().equals(workspaceId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment source does not belong to this workspace");
        }
        source.setActive(false);
        softDeleteService.softDelete(source);
        PaymentSource saved = paymentSourceRepository.save(source);
        eventPublisher.publish(workspaceId, "ACCOUNT_DELETED", "ACCOUNT", saved.getId());
        return PaymentSourceResponse.from(saved);
    }

    public record PaymentSourceResponse(UUID id, String name, PaymentSource.SourceType type) {
        static PaymentSourceResponse from(PaymentSource source) {
            return new PaymentSourceResponse(source.getId(), source.getName(), source.getType());
        }
    }
}
