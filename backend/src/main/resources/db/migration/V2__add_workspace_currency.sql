ALTER TABLE family_workspaces
    ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) NOT NULL DEFAULT 'GBP';

ALTER TABLE family_workspaces
    ADD CONSTRAINT chk_family_workspaces_currency_code
    CHECK (currency_code ~ '^[A-Z]{3}$');
