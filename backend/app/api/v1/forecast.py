from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import MonthlyForecastResponse, CategoryForecastResponse
from app.api.deps import get_current_user
from app.analytics.forecasting import generate_monthly_forecast, generate_category_forecast

router = APIRouter()

@router.get("/monthly-expenses", response_model=MonthlyForecastResponse)
def get_monthly_expense_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return generate_monthly_forecast(current_user.id, db)


@router.get("/category-expenses", response_model=CategoryForecastResponse)
def get_category_expense_forecast(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return generate_category_forecast(current_user.id, db, month)
