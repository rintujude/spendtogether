package com.familybudget.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkspaceEvent(
        UUID workspaceId,
        String eventType,
        String entityType,
        UUID entityId,
        UUID changedBy,
        Instant occurredAt
) {
}
