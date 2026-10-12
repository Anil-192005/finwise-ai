# FinWise AI — Relational Database Schema Design

## 1. Schema Overview

The database is designed with normalized tables, relational foreign keys, cascade deletion rules, and indexing on frequent query filters (`user_id`, `transaction_date`, `budget_month`, `category_id`).

```mermaid
erDiagram
    users ||--o{ transactions : "owns"
    users ||--o{ budgets : "defines"
    users ||--o{ savings_goals : "sets"
    users ||--o{ savings_contributions : "deposits"
    users ||--o{ recurring_transactions : "schedules"
    users ||--o| user_preferences : "configures"
    categories ||--o{ transactions : "classifies"
    categories ||--o{ budgets : "allocates"
    savings_goals ||--o{ savings_contributions : "receives"

    users {
        int id PK
        string full_name
        string email UK
        string password_hash
        string preferred_currency
        datetime created_at
        datetime updated_at
    }

    categories {
        int id PK
        string name
        string transaction_type
        bool is_system_category
        int user_id FK
        datetime created_at
    }

    transactions {
        int id PK
        int user_id FK
        string title
        text description
        numeric amount
        string transaction_type
        int category_id FK
        date transaction_date
        string payment_method
        string tags
        datetime created_at
        datetime updated_at
    }

    budgets {
        int id PK
        int user_id FK
        int category_id FK
        numeric amount
        string budget_month
        datetime created_at
        datetime updated_at
    }

    savings_goals {
        int id PK
        int user_id FK
        string name
        numeric target_amount
        date target_date
        string status
        datetime created_at
        datetime updated_at
    }

    savings_contributions {
        int id PK
        int user_id FK
        int goal_id FK
        numeric amount
        date contribution_date
        text description
        datetime created_at
    }

    recurring_transactions {
        int id PK
        int user_id FK
        string title
        numeric amount
        int category_id FK
        string transaction_type
        string recurrence_frequency
        date start_date
        date end_date
        date next_scheduled_date
        bool is_active
        datetime created_at
        datetime updated_at
    }

    user_preferences {
        int id PK
        int user_id FK
        string preferred_currency
        float budget_warning_threshold
        string notification_preferences
        datetime created_at
        datetime updated_at
    }
```

---

## 2. Table Specifications

### 2.1 `users`
- Stores registered identities.
- `password_hash` stores salted Argon2 hashes. Plaintext passwords are never saved.

### 2.2 `categories`
- Pre-populated with system categories (`is_system_category = True`).
- Supports user-defined custom categories where `user_id` matches the creator.

### 2.3 `transactions`
- The core financial ledger.
- `amount` is stored with precision `Numeric(12, 2)` to avoid IEEE-754 floating-point inaccuracies.
- Enforces relational consistency: category must match transaction type.

### 2.4 `budgets`
- Sets monthly spending caps per category or globally.
- Unique constraint on `(user_id, category_id, budget_month)` prevents duplicate envelope allocations.

### 2.5 `savings_goals` & `savings_contributions`
- Tracks milestone funds independently from monthly operational cash flow to ensure zero double-counting.

### 2.6 `recurring_transactions`
- Holds scheduled recurring templates for rent, bills, subscriptions, and salaries.
