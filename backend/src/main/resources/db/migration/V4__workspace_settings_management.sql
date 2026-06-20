ALTER TABLE budget_categories
    ADD COLUMN IF NOT EXISTS category_type VARCHAR(16) NOT NULL DEFAULT 'EXPENSE';

ALTER TABLE budget_categories
    DROP CONSTRAINT IF EXISTS budget_categories_category_type_check;

ALTER TABLE budget_categories
    ADD CONSTRAINT budget_categories_category_type_check
    CHECK (category_type IN ('INCOME', 'EXPENSE'));

ALTER TABLE payment_sources
    DROP CONSTRAINT IF EXISTS payment_sources_type_check;

ALTER TABLE payment_sources
    ADD CONSTRAINT payment_sources_type_check
    CHECK (type IN ('CURRENT_ACCOUNT', 'BANK_ACCOUNT', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'SAVINGS', 'UPI_WALLET', 'OTHER'));
