from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.categories import router as categories_router
from app.api.v1.budgets import router as budgets_router
from app.api.v1.savings import router as savings_router
from app.api.v1.recurring import router as recurring_router
from app.api.v1.insights import router as insights_router
from app.api.v1.forecast import router as forecast_router
from app.api.v1.reports import router as reports_router
from app.api.v1.preferences import router as preferences_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])
api_router.include_router(categories_router, prefix="/categories", tags=["Categories"])
api_router.include_router(budgets_router, prefix="/budgets", tags=["Budgets"])
api_router.include_router(savings_router, prefix="/savings", tags=["Savings Goals"])
api_router.include_router(recurring_router, prefix="/recurring-transactions", tags=["Recurring Transactions"])
api_router.include_router(insights_router, prefix="/insights", tags=["AI Insights"])
api_router.include_router(forecast_router, prefix="/forecast", tags=["Expense Forecasting"])
api_router.include_router(reports_router, prefix="/reports", tags=["Reports"])
api_router.include_router(preferences_router, prefix="/preferences", tags=["Preferences"])
