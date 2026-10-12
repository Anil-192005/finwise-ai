from datetime import date, datetime
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.session import get_db
from app.models.models import Transaction, Budget, SavingsContribution, User, Category
from app.schemas.schemas import (
    DashboardSummary, IncomeExpenseTrendItem, CategoryBreakdownItem, TransactionOut
)
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not month:
        month = date.today().strftime("%Y-%m")

    # Sum income for month
    income_val = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "income",
        func.strftime("%Y-%m", Transaction.transaction_date) == month
    ).scalar() or 0.0

    # Sum expenses for month
    expense_val = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "expense",
        func.strftime("%Y-%m", Transaction.transaction_date) == month
    ).scalar() or 0.0

    # Total budget for month
    total_budget_val = db.query(func.sum(Budget.amount)).filter(
        Budget.user_id == current_user.id,
        Budget.budget_month == month
    ).scalar() or 0.0

    # Total savings contributions
    total_savings_val = db.query(func.sum(SavingsContribution.amount)).filter(
        SavingsContribution.user_id == current_user.id
    ).scalar() or 0.0

    income = float(income_val)
    expenses = float(expense_val)
    total_budget = float(total_budget_val)
    total_savings = float(total_savings_val)

    remaining_balance = round(income - expenses, 2)
    savings_rate = round((remaining_balance / income) * 100, 1) if income > 0 else 0.0
    budget_utilization = round((expenses / total_budget) * 100, 1) if total_budget > 0 else 0.0

    return {
        "total_income": round(income, 2),
        "total_expenses": round(expenses, 2),
        "remaining_balance": remaining_balance,
        "total_savings": round(total_savings, 2),
        "budget_utilization": budget_utilization,
        "savings_rate": savings_rate,
        "preferred_currency": current_user.preferred_currency,
        "selected_month": month,
        "total_budget": round(total_budget, 2)
    }


@router.get("/income-expenses", response_model=List[IncomeExpenseTrendItem])
def get_income_expense_trend(
    view: str = Query("monthly", pattern="^(monthly|yearly)$"),
    months_count: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns monthly or yearly aggregated income vs expense trends.
    """
    if view == "yearly":
        format_str = "%Y"
    else:
        format_str = "%Y-%m"

    rows = (
        db.query(
            func.strftime(format_str, Transaction.transaction_date).label("period"),
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total")
        )
        .filter(Transaction.user_id == current_user.id)
        .group_by("period", Transaction.transaction_type)
        .order_by("period")
        .all()
    )

    data_map: Dict[str, Dict[str, float]] = {}
    for r in rows:
        p = r.period
        if p not in data_map:
            data_map[p] = {"income": 0.0, "expense": 0.0}
        if r.transaction_type == "income":
            data_map[p]["income"] += float(r.total)
        else:
            data_map[p]["expense"] += float(r.total)

    # Sort periods and take last N
    sorted_periods = sorted(data_map.keys())[-months_count:]
    result = []
    for p in sorted_periods:
        inc = round(data_map[p]["income"], 2)
        exp = round(data_map[p]["expense"], 2)
        result.append(IncomeExpenseTrendItem(
            period=p,
            income=inc,
            expenses=exp,
            net=round(inc - exp, 2)
        ))

    return result


@router.get("/category-breakdown", response_model=List[CategoryBreakdownItem])
def get_category_breakdown(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    transaction_type: str = Query("expense", pattern="^(income|expense)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not month:
        month = date.today().strftime("%Y-%m")

    # Aggregate by category
    rows = (
        db.query(
            Transaction.category_id,
            Category.name.label("category_name"),
            func.sum(Transaction.amount).label("total_amount"),
            func.count(Transaction.id).label("tx_count")
        )
        .join(Category, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == transaction_type,
            func.strftime("%Y-%m", Transaction.transaction_date) == month
        )
        .group_by(Transaction.category_id, Category.name)
        .order_by(desc("total_amount"))
        .all()
    )

    total_sum = sum(float(r.total_amount) for r in rows)
    result = []
    for r in rows:
        amt = float(r.total_amount)
        pct = round((amt / total_sum) * 100, 1) if total_sum > 0 else 0.0
        result.append(CategoryBreakdownItem(
            category_id=r.category_id,
            category_name=r.category_name,
            amount=round(amt, 2),
            percentage=pct,
            count=r.tx_count
        ))

    return result


@router.get("/recent-transactions", response_model=List[TransactionOut])
def get_recent_transactions(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(desc(Transaction.transaction_date), desc(Transaction.id))
        .limit(limit)
        .all()
    )

    result = []
    for item in items:
        out = TransactionOut.model_validate(item)
        out.category_name = item.category.name if item.category else "Uncategorized"
        result.append(out)

    return result
