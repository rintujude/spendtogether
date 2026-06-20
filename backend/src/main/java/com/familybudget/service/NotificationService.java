package com.familybudget.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.familybudget.dto.NotificationEvent;
import com.familybudget.entity.Notification;
import com.familybudget.entity.User;
import com.familybudget.entity.Workspace;
import com.familybudget.repository.NotificationRepository;
import com.familybudget.repository.UserRepository;
import com.familybudget.repository.WorkspaceRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public record CreateNotificationCommand(
            UUID recipientUserId,
            UUID workspaceId,
            String type,
            String title,
            String message,
            String actionType,
            String actionEntityType,
            UUID actionEntityId,
            Map<String, Object> metadata
    ) {
    }

    public record NotificationsResponse(long unreadCount, List<NotificationResponse> items) {
    }

    public record UnreadCountResponse(long unreadCount) {
    }

    public record NotificationResponse(
            UUID id,
            String type,
            String title,
            String message,
            UUID workspaceId,
            String actionType,
            String actionEntityType,
            UUID actionEntityId,
            Instant readAt,
            Instant clickedAt,
            Instant createdAt,
            Map<String, Object> metadata
    ) {
    }

    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final CurrentUserService currentUserService;
    private final SoftDeleteService softDeleteService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            CurrentUserService currentUserService,
            SoftDeleteService softDeleteService,
            SimpMessagingTemplate messagingTemplate,
            ObjectMapper objectMapper
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.currentUserService = currentUserService;
        this.softDeleteService = softDeleteService;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public NotificationResponse createNotification(CreateNotificationCommand command) {
        User recipient = userRepository.findById(command.recipientUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification recipient not found"));
        Workspace workspace = command.workspaceId() == null
                ? null
                : workspaceRepository.findById(command.workspaceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workspace not found"));

        Notification notification = new Notification();
        notification.setRecipientUser(recipient);
        notification.setWorkspace(workspace);
        notification.setType(command.type());
        notification.setTitle(command.title());
        notification.setMessage(command.message());
        notification.setActionType(command.actionType());
        notification.setActionEntityType(command.actionEntityType());
        notification.setActionEntityId(command.actionEntityId());
        notification.setMetadataJson(toJson(command.metadata()));
        notification.setDeliveredAt(Instant.now());

        Notification saved = notificationRepository.save(notification);
        publishNotificationEvent(saved, "NOTIFICATION_CREATED");
        log.info("Notification created notificationId={} recipientUserId={} workspaceId={} type={}", saved.getId(), recipient.getId(), command.workspaceId(), command.type());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public NotificationsResponse getNotificationsForCurrentUser(String status, int limit, int offset) {
        UUID userId = currentUserService.getCurrentUserId();
        int safeLimit = Math.max(1, Math.min(limit, 50));
        int safeOffset = Math.max(0, offset);
        PageRequest pageable = PageRequest.of(
                safeOffset / safeLimit,
                safeLimit,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        var page = switch (status == null ? "all" : status.toLowerCase()) {
            case "unread" -> notificationRepository.findByRecipientUserIdAndReadAtIsNull(userId, pageable);
            case "read" -> notificationRepository.findByRecipientUserIdAndReadAtIsNotNull(userId, pageable);
            case "all" -> notificationRepository.findByRecipientUserId(userId, pageable);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown notification status");
        };

        return new NotificationsResponse(
                getUnreadCountForCurrentUser(),
                page.getContent().stream().map(this::toResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public long getUnreadCountForCurrentUser() {
        return notificationRepository.countByRecipientUserIdAndReadAtIsNull(currentUserService.getCurrentUserId());
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId) {
        Notification notification = requireCurrentUserNotification(notificationId);
        notification.markRead(Instant.now());
        Notification saved = notificationRepository.save(notification);
        publishNotificationEvent(saved, "NOTIFICATION_UPDATED");
        return toResponse(saved);
    }

    @Transactional
    public void markAllAsRead() {
        UUID userId = currentUserService.getCurrentUserId();
        Instant now = Instant.now();
        List<Notification> notifications = notificationRepository.findByRecipientUserIdAndReadAtIsNull(userId);
        notifications.forEach(notification -> notification.markRead(now));
        notificationRepository.saveAll(notifications);
        messagingTemplate.convertAndSend(
                "/topic/users/" + userId + "/notifications",
                new NotificationEvent(null, "NOTIFICATIONS_READ", userId, null, now)
        );
    }

    @Transactional
    public NotificationResponse markAsClicked(UUID notificationId) {
        Notification notification = requireCurrentUserNotification(notificationId);
        Instant now = Instant.now();
        notification.markClicked(now);
        notification.markRead(now);
        Notification saved = notificationRepository.save(notification);
        publishNotificationEvent(saved, "NOTIFICATION_UPDATED");
        return toResponse(saved);
    }

    @Transactional
    public void markInvitationNotificationsAsRead(UUID userId, UUID invitationId) {
        Instant now = Instant.now();
        List<Notification> notifications = notificationRepository.findByRecipientUserIdAndActionEntityTypeAndActionEntityId(
                userId,
                "INVITATION",
                invitationId
        );
        notifications.forEach(notification -> {
            notification.markRead(now);
            notification.markClicked(now);
        });
        notificationRepository.saveAll(notifications);
        notifications.forEach(notification -> publishNotificationEvent(notification, "NOTIFICATION_UPDATED"));
    }

    @Transactional
    public void softDeleteNotification(UUID notificationId) {
        Notification notification = requireCurrentUserNotification(notificationId);
        softDeleteService.softDelete(notification);
        notificationRepository.save(notification);
        publishNotificationEvent(notification, "NOTIFICATION_DELETED");
    }

    private Notification requireCurrentUserNotification(UUID notificationId) {
        UUID userId = currentUserService.getCurrentUserId();
        return notificationRepository.findByIdAndRecipientUserId(notificationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
    }

    private void publishNotificationEvent(Notification notification, String eventType) {
        UUID recipientUserId = notification.getRecipientUser().getId();
        UUID workspaceId = notification.getWorkspace() == null ? null : notification.getWorkspace().getId();
        messagingTemplate.convertAndSend(
                "/topic/users/" + recipientUserId + "/notifications",
                new NotificationEvent(notification.getId(), eventType, recipientUserId, workspaceId, Instant.now())
        );
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getWorkspace() == null ? null : notification.getWorkspace().getId(),
                notification.getActionType(),
                notification.getActionEntityType(),
                notification.getActionEntityId(),
                notification.getReadAt(),
                notification.getClickedAt(),
                notification.getCreatedAt(),
                fromJson(notification.getMetadataJson())
        );
    }

    private String toJson(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid notification metadata");
        }
    }

    private Map<String, Object> fromJson(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(metadataJson, METADATA_TYPE);
        } catch (Exception ex) {
            return Map.of();
        }
    }
}
