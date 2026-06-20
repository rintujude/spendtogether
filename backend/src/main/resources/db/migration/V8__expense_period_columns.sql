ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS expense_year INTEGER,
    ADD COLUMN IF NOT EXISTS expense_month INTEGER;

UPDATE expenses
SET expense_year = EXTRACT(YEAR FROM expense_date)::INTEGER,
    expense_month = EXTRACT(MONTH FROM expense_date)::INTEGER
WHERE expense_year IS NULL OR expense_month IS NULL;

ALTER TABLE expenses
    ALTER COLUMN expense_year SET NOT NULL,
    ALTER COLUMN expense_month SET NOT NULL;

ALTER TABLE expenses
    DROP CONSTRAINT IF EXISTS expenses_expense_year_check,
    DROP CONSTRAINT IF EXISTS expenses_expense_month_check;

ALTER TABLE expenses
    ADD CONSTRAINT expenses_expense_year_check CHECK (expense_year BETWEEN 2000 AND 2100),
    ADD CONSTRAINT expenses_expense_month_check CHECK (expense_month BETWEEN 1 AND 12);

CREATE INDEX IF NOT EXISTS idx_expenses_workspace_year_month
    ON expenses(workspace_id, expense_year, expense_month)
    WHERE deleted_at IS NULL;
