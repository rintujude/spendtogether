package com.familybudget.service;

import com.familybudget.entity.AuditableEntity;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class SoftDeleteService {

    private final CurrentUserService currentUserService;

    public SoftDeleteService(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    public void softDelete(AuditableEntity entity) {
        entity.markDeleted(currentUserService.getCurrentUserId(), Instant.now());
    }
}
