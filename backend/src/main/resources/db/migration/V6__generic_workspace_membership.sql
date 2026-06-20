ALTER TABLE IF EXISTS family_workspaces RENAME TO workspaces;
ALTER TABLE IF EXISTS family_members RENAME TO workspace_members;

ALTER TABLE workspace_members
    ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';

UPDATE workspace_members
SET role = 'CONTRIBUTOR'
WHERE role = 'MEMBER';

ALTER TABLE workspace_members
    DROP CONSTRAINT IF EXISTS family_members_role_check,
    DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_role_check
    CHECK (role IN ('OWNER', 'CONTRIBUTOR', 'VIEWER'));

ALTER TABLE workspace_members
    DROP CONSTRAINT IF EXISTS workspace_members_status_check;

ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_status_check
    CHECK (status IN ('ACTIVE', 'PENDING', 'REMOVED', 'LEFT'));

CREATE TABLE IF NOT EXISTS workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('CONTRIBUTOR', 'VIEWER')),
    message TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED', 'DECLINED')),
    invited_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_workspace_invitations_pending_email
    ON workspace_invitations (workspace_id, lower(email))
    WHERE deleted_at IS NULL AND status = 'PENDING';
