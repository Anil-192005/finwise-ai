from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator, ConfigDict
import re

# Auth & User schemas
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str
    preferred_currency: str = Field(default="INR")

    @field_validator("preferred_currency")
    def validate_currency(cls, v: str) -> str:
        valid_currencies = ["INR", "USD", "EUR", "GBP"]
        if v.upper() not in valid_currencies:
            raise ValueError(f"Currency must be one of {valid_currencies}")
        return v.upper()

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("New passwords do not match")
        return self


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    preferred_currency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# Category schemas
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    transaction_type: str = Field(..., pattern="^(income|expense)$")


class CategoryOut(BaseModel):
    id: int
    name: str
    transaction_type: str
    is_system_category: bool
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# Transaction schemas
class TransactionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    amount: float = Field(..., gt=0, description="Amount must be greater than zero")
    transaction_type: str = Field(..., pattern="^(income|expense)$")
    category_id: int
    transaction_date: date
    payment_method: str = Field(default="Other", max_length=50)
    tags: Optional[str] = Field(default=None, max_length=255)


class TransactionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    amount: Optional[float] = Field(default=None, gt=0)
    transaction_type: Optional[str] = Field(default=None, pattern="^(income|expense)$")
    category_id: Optional[int] = None
    transaction_date: Optional[date] = None
    payment_method: Optional[str] = Field(default=None, max_length=50)
    tags: Optional[str] = None


class TransactionOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    amount: float
    transaction_type: str
    category_id: int
    category_name: Optional[str] = None
    transaction_date: date
    payment_method: str
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionListResponse(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# Budget schemas
class BudgetCreate(BaseModel):
    category_id: Optional[int] = None
    amount: float = Field(..., gt=0)
    budget_month: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$")  # YYYY-MM


class BudgetUpdate(BaseModel):
    amount: float = Field(..., gt=0)


class BudgetOut(BaseModel):
    id: int
    user_id: int
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    amount: float
    budget_month: str
    actual_spent: float
    remaining_budget: float
    utilization_percentage: float
    status: str  # 'within_budget', 'approaching_limit', 'budget_exceeded'
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Savings schemas
class SavingsContributionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    contribution_date: date
    description: Optional[str] = Field(default=None, max_length=500)


class SavingsContributionOut(BaseModel):
    id: int
    goal_id: int
    amount: float
    contribution_date: date
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SavingsGoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_amount: float = Field(..., gt=0)
    target_date: Optional[date] = None


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    target_amount: Optional[float] = Field(default=None, gt=0)
    target_date: Optional[date] = None
    status: Optional[str] = Field(default=None, pattern="^(active|completed|paused)$")


class SavingsGoalOut(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    target_date: Optional[date] = None
    status: str
    current_saved: float
    remaining_target: float
    progress_percentage: float
    estimated_completion_date: Optional[str] = None
    contributions: List[SavingsContributionOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Recurring Transaction schemas
class RecurringTransactionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    category_id: int
    transaction_type: str = Field(..., pattern="^(income|expense)$")
    recurrence_frequency: str = Field(..., pattern="^(weekly|monthly|quarterly|yearly)$")
    start_date: date
    end_date: Optional[date] = None
    next_scheduled_date: date
    is_active: bool = True


class RecurringTransactionUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    category_id: Optional[int] = None
    recurrence_frequency: Optional[str] = Field(default=None, pattern="^(weekly|monthly|quarterly|yearly)$")
    end_date: Optional[date] = None
    next_scheduled_date: Optional[date] = None
    is_active: Optional[bool] = None


class RecurringTransactionOut(BaseModel):
    id: int
    user_id: int
    title: str
    amount: float
    category_id: int
    category_name: Optional[str] = None
    transaction_type: str
    recurrence_frequency: str
    start_date: date
    end_date: Optional[date] = None
    next_scheduled_date: date
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# User Preference schemas
class UserPreferenceUpdate(BaseModel):
    preferred_currency: Optional[str] = None
    budget_warning_threshold: Optional[float] = Field(default=None, ge=10, le=100)
    notification_preferences: Optional[str] = None


class UserPreferenceOut(BaseModel):
    id: int
    user_id: int
    preferred_currency: str
    budget_warning_threshold: float
    notification_preferences: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Dashboard schemas
class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    remaining_balance: float
    total_savings: float
    budget_utilization: float
    savings_rate: float
    preferred_currency: str
    selected_month: str
    total_budget: float


class IncomeExpenseTrendItem(BaseModel):
    period: str
    income: float
    expenses: float
    net: float


class CategoryBreakdownItem(BaseModel):
    category_id: int
    category_name: str
    amount: float
    percentage: float
    count: int


# AI & Insights schemas
class InsightItem(BaseModel):
    type: str  # 'trend' | 'unusual' | 'recommendation' | 'opportunity' | 'summary'
    title: str
    description: str
    badge: str
    impact_level: str  # 'info' | 'warning' | 'positive'


class InsightsResponse(BaseModel):
    selected_month: str
    monthly_summary: str
    insights: List[InsightItem]
    generated_at: datetime


class QuestionRequest(BaseModel):
    question: str
    month: Optional[str] = None


class QuestionResponse(BaseModel):
    question: str
    answer: str
    data_points: Dict[str, Any] = {}


# Forecasting schemas
class ForecastPoint(BaseModel):
    month: str
    actual: Optional[float] = None
    forecast: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class MonthlyForecastResponse(BaseModel):
    has_sufficient_data: bool
    data_points_count: int
    forecasted_next_month: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    confidence_score: Optional[float] = None
    method: str
    explanation: str
    history: List[ForecastPoint] = []
    budget_comparison: Optional[Dict[str, Any]] = None


class CategoryForecastItem(BaseModel):
    category_name: str
    historical_average: float
    forecasted_amount: float
    current_budget: Optional[float] = None
    projected_utilization: Optional[float] = None
    risk_level: str  # 'low' | 'moderate' | 'high'


class CategoryForecastResponse(BaseModel):
    has_sufficient_data: bool
    categories: List[CategoryForecastItem] = []
    message: str


# ML Categorization schemas
class CategorizationRequest(BaseModel):
    title: str
    description: Optional[str] = None


class CategorizationResponse(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    confidence_score: float
    method: str  # 'keyword' | 'ml_classifier' | 'fallback'
    needs_confirmation: bool
