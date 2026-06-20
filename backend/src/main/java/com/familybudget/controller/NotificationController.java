package com.familybudget.controller;

import com.familybudget.service.NotificationService;
import com.familybudget.service.NotificationService.NotificationResponse;
import com.familybudget.service.NotificationService.NotificationsResponse;
import com.familybudget.service.NotificationService.UnreadCountResponse;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationsResponse listNotifications(
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        return notificationService.getNotificationsForCurrentUser(status, limit, offset);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount() {
        return new UnreadCountResponse(notificationService.getUnreadCountForCurrentUser());
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markRead(@PathVariable UUID notificationId) {
        return notificationService.markAsRead(notificationId);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead() {
        notificationService.markAllAsRead();
    }

    @PatchMapping("/{notificationId}/clicked")
    public NotificationResponse markClicked(@PathVariable UUID notificationId) {
        return notificationService.markAsClicked(notificationId);
    }

    @DeleteMapping("/{notificationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(@PathVariable UUID notificationId) {
        notificationService.softDeleteNotification(notificationId);
    }
}
