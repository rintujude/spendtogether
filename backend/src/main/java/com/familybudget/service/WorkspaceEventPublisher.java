package com.familybudget.service;

import com.familybudget.dto.WorkspaceEvent;
import java.time.Instant;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final CurrentUserService currentUserService;

    public WorkspaceEventPublisher(SimpMessagingTemplate messagingTemplate, CurrentUserService currentUserService) {
        this.messagingTemplate = messagingTemplate;
        this.currentUserService = currentUserService;
    }

    public void publish(UUID workspaceId, String eventType, String entityType, UUID entityId) {
        WorkspaceEvent event = new WorkspaceEvent(
                workspaceId,
                eventType,
                entityType,
                entityId,
                currentUserService.getCurrentUserId(),
                Instant.now()
        );

        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId, event);
    }
}
