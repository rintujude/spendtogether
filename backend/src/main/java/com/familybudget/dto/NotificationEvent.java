package com.familybudget.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationEvent(
        UUID notificationId,
        String eventType,
        UUID recipientUserId,
        UUID workspaceId,
        Instant occurredAt
) {
}
