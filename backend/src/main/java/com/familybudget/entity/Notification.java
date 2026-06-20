package com.familybudget.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "notifications")
@SQLRestriction("deleted_at IS NULL")
public class Notification extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id")
    private User recipientUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(nullable = false, length = 80)
    private String type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false)
    private String message;

    @Column(length = 80)
    private String actionType;

    @Column(length = 80)
    private String actionEntityType;

    @Column
    private UUID actionEntityId;

    @Column
    private String metadataJson;

    @Column
    private Instant readAt;

    @Column
    private Instant clickedAt;

    @Column
    private Instant deliveredAt;

    public User getRecipientUser() {
        return recipientUser;
    }

    public void setRecipientUser(User recipientUser) {
        this.recipientUser = recipientUser;
    }

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getActionEntityType() {
        return actionEntityType;
    }

    public void setActionEntityType(String actionEntityType) {
        this.actionEntityType = actionEntityType;
    }

    public UUID getActionEntityId() {
        return actionEntityId;
    }

    public void setActionEntityId(UUID actionEntityId) {
        this.actionEntityId = actionEntityId;
    }

    public String getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void markRead(Instant readAt) {
        if (this.readAt == null) {
            this.readAt = readAt;
        }
    }

    public Instant getClickedAt() {
        return clickedAt;
    }

    public void markClicked(Instant clickedAt) {
        if (this.clickedAt == null) {
            this.clickedAt = clickedAt;
        }
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(Instant deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}
