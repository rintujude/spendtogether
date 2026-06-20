ALTER TABLE workspace_invitations
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS accepted_by UUID;

UPDATE workspace_invitations
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES users(id),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    type VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    action_type VARCHAR(80),
    action_entity_type VARCHAR(80),
    action_entity_id UUID,
    metadata_json TEXT,
    read_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
    ON notifications (recipient_user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications (recipient_user_id)
    WHERE deleted_at IS NULL AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_action_entity
    ON notifications (action_entity_type, action_entity_id)
    WHERE deleted_at IS NULL;
