package com.familybudget.repository;

import com.familybudget.entity.PaymentSource;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentSourceRepository extends JpaRepository<PaymentSource, UUID> {
    List<PaymentSource> findByWorkspaceIdAndActiveTrueOrderByName(UUID workspaceId);
    boolean existsByWorkspaceIdAndNameIgnoreCaseAndActiveTrue(UUID workspaceId, String name);
}
