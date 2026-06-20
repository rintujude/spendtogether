package com.familybudget.service;

import com.familybudget.dto.WorkspaceEvent;
import java.time.Instant;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceEventPublisher.class);

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
        log.info("Workspace event published workspaceId={} eventType={} entityType={} entityId={} changedBy={}", workspaceId, eventType, entityType, entityId, event.changedBy());
    }
}
