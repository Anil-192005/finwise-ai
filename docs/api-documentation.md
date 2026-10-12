# FinWise AI — Versioned API Documentation (`/api/v1`)

## 1. Base URL & Authentication

- **Base URL**: `http://localhost:8000/api/v1` (Production: configurable via `VITE_API_URL`)
- **Authentication**: Bearer Token in HTTP header:
  ```http
  Authorization: Bearer <access_token>
  ```
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 2. API Endpoints Reference

### 2.1 Authentication (`/auth`)
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user account | `UserRegister` |
| `POST` | `/api/v1/auth/login` | Login and receive JWT access token | `UserLogin` |
| `POST` | `/api/v1/auth/logout` | Client token revocation | Header only |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Header only |
| `POST` | `/api/v1/auth/change-password` | Update account password | `PasswordChange` |

### 2.2 Dashboard (`/dashboard`)
| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/summary` | 6 Core financial metrics (Income, Expenses, Net Flow, Savings, Budget %, Savings Rate) | `month` (YYYY-MM) |
| `GET` | `/api/v1/dashboard/income-expenses` | Aggregated periodic trend comparison | `view` (monthly/yearly), `months_count` |
| `GET` | `/api/v1/dashboard/category-breakdown` | Category distribution for donut chart | `month`, `transaction_type` |
| `GET` | `/api/v1/dashboard/recent-transactions` | Latest recorded transactions | `limit` (default: 5) |

### 2.3 Transactions (`/transactions`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/transactions` | Paginated, filtered, and sorted transactions | `page`, `page_size`, `search`, `category_id`, `transaction_type`, `start_date`, `end_date`, `sort_by`, `sort_order` |
| `POST` | `/api/v1/transactions` | Record new transaction | `TransactionCreate` |
| `GET` | `/api/v1/transactions/{id}` | Read transaction details | None |
| `PUT` | `/api/v1/transactions/{id}` | Update transaction | `TransactionUpdate` |
| `DELETE`| `/api/v1/transactions/{id}` | Delete transaction | None |
| `GET` | `/api/v1/transactions/export` | Formula-sanitized CSV export | Date and category filter parameters |

### 2.4 Categories (`/categories`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/categories` | List system and custom categories | `transaction_type` |
| `POST` | `/api/v1/categories` | Create user custom category | `CategoryCreate` |
| `DELETE`| `/api/v1/categories/{id}` | Delete custom category | None |
| `POST` | `/api/v1/categories/categorize`| AI Keyword & TF-IDF ML auto-categorizer | `CategorizationRequest` |

### 2.5 Budgets (`/budgets`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/budgets` | List budgets with live utilization & status | `month` |
| `POST` | `/api/v1/budgets` | Set monthly category budget | `BudgetCreate` |
| `PUT` | `/api/v1/budgets/{id}` | Adjust budget limit | `BudgetUpdate` |
| `DELETE`| `/api/v1/budgets/{id}` | Remove budget limit | None |

### 2.6 Savings Goals (`/savings`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/savings/goals` | List goals with velocity projections | None |
| `POST` | `/api/v1/savings/goals` | Create savings goal target | `SavingsGoalCreate` |
| `PUT` | `/api/v1/savings/goals/{id}` | Update savings goal | `SavingsGoalUpdate` |
| `DELETE`| `/api/v1/savings/goals/{id}` | Delete savings goal | None |
| `POST` | `/api/v1/savings/goals/{id}/contributions` | Record savings deposit | `SavingsContributionCreate` |

### 2.7 AI Insights & QA (`/insights`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/insights` | Diagnostics, anomalies, savings advice | `month` |
| `POST` | `/api/v1/insights/ask` | Deterministic natural language QA | `QuestionRequest` |

### 2.8 Expense Forecasting (`/forecast`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/forecast/monthly-expenses` | Time-series regression & 80% confidence interval | None |
| `GET` | `/api/v1/forecast/category-expenses`| Category-level momentum and budget risk scoring | `month` |

### 2.9 Recurring Transactions (`/recurring-transactions`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/recurring-transactions` | List scheduled templates | None |
| `POST` | `/api/v1/recurring-transactions` | Create recurring schedule | `RecurringTransactionCreate` |
| `POST` | `/api/v1/recurring-transactions/{id}/process` | Idempotently record transaction and advance next date | None |

### 2.10 Reports (`/reports`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/reports/monthly` | Full monthly statement summary | `month` |
| `GET` | `/api/v1/reports/yearly` | Annual month-by-month trajectory | `year` |
| `GET` | `/api/v1/reports/category` | Category totals breakdown | `start_date`, `end_date` |

### 2.11 Preferences (`/preferences`)
| Method | Endpoint | Description | Query / Body |
|---|---|---|---|
| `GET` | `/api/v1/preferences` | Get user preferences | None |
| `PUT` | `/api/v1/preferences` | Update preferred currency & warning threshold | `UserPreferenceUpdate` |
| `DELETE`| `/api/v1/preferences/account` | Permanent account deletion | None |
