package com.familybudget.repository;

import com.familybudget.entity.Notification;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    @EntityGraph(attributePaths = {"workspace"})
    Page<Notification> findByRecipientUserId(UUID recipientUserId, Pageable pageable);

    @EntityGraph(attributePaths = {"workspace"})
    Page<Notification> findByRecipientUserIdAndReadAtIsNull(UUID recipientUserId, Pageable pageable);

    @EntityGraph(attributePaths = {"workspace"})
    Page<Notification> findByRecipientUserIdAndReadAtIsNotNull(UUID recipientUserId, Pageable pageable);

    Optional<Notification> findByIdAndRecipientUserId(UUID id, UUID recipientUserId);

    long countByRecipientUserIdAndReadAtIsNull(UUID recipientUserId);

    List<Notification> findByRecipientUserIdAndReadAtIsNull(UUID recipientUserId);

    List<Notification> findByRecipientUserIdAndActionEntityTypeAndActionEntityId(
            UUID recipientUserId,
            String actionEntityType,
            UUID actionEntityId
    );
}
