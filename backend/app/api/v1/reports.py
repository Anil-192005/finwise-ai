from datetime import date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.session import get_db
from app.models.models import Transaction, Category, Budget, User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/monthly")
def get_monthly_report(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not month:
        month = date.today().strftime("%Y-%m")

    txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            func.strftime("%Y-%m", Transaction.transaction_date) == month
        )
        .all()
    )

    income_total = sum(float(t.amount) for t in txs if t.transaction_type == "income")
    expense_total = sum(float(t.amount) for t in txs if t.transaction_type == "expense")
    net_flow = income_total - expense_total
    savings_rate = round((net_flow / income_total) * 100, 1) if income_total > 0 else 0.0

    # Category breakdown
    cat_expenses: Dict[str, float] = {}
    for t in txs:
        if t.transaction_type == "expense":
            c_name = t.category.name if t.category else "Other"
            cat_expenses[c_name] = cat_expenses.get(c_name, 0.0) + float(t.amount)

    cat_breakdown = [
        {"category": k, "amount": round(v, 2), "percentage": round((v / expense_total) * 100, 1) if expense_total > 0 else 0}
        for k, v in sorted(cat_expenses.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "month": month,
        "total_income": round(income_total, 2),
        "total_expenses": round(expense_total, 2),
        "net_cash_flow": round(net_flow, 2),
        "savings_rate": savings_rate,
        "transaction_count": len(txs),
        "categories": cat_breakdown,
        "currency": current_user.preferred_currency
    }


@router.get("/yearly")
def get_yearly_report(
    year: Optional[int] = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not year:
        year = date.today().year

    year_str = str(year)
    rows = (
        db.query(
            func.strftime("%Y-%m", Transaction.transaction_date).label("month"),
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.user_id == current_user.id,
            func.strftime("%Y", Transaction.transaction_date) == year_str
        )
        .group_by("month", Transaction.transaction_type)
        .order_by("month")
        .all()
    )

    monthly_data: Dict[str, Dict[str, float]] = {}
    for r in rows:
        m = r.month
        if m not in monthly_data:
            monthly_data[m] = {"income": 0.0, "expense": 0.0}
        if r.transaction_type == "income":
            monthly_data[m]["income"] += float(r.total)
        else:
            monthly_data[m]["expense"] += float(r.total)

    breakdown = []
    tot_inc = 0.0
    tot_exp = 0.0
    for m in sorted(monthly_data.keys()):
        inc = monthly_data[m]["income"]
        exp = monthly_data[m]["expense"]
        tot_inc += inc
        tot_exp += exp
        breakdown.append({
            "month": m,
            "income": round(inc, 2),
            "expense": round(exp, 2),
            "net": round(inc - exp, 2)
        })

    return {
        "year": year,
        "total_income": round(tot_inc, 2),
        "total_expenses": round(tot_exp, 2),
        "net_savings": round(tot_inc - tot_exp, 2),
        "savings_rate": round(((tot_inc - tot_exp) / tot_inc) * 100, 1) if tot_inc > 0 else 0.0,
        "months": breakdown,
        "currency": current_user.preferred_currency
    }


@router.get("/category")
def get_category_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(
        Category.name.label("category_name"),
        Transaction.transaction_type,
        func.sum(Transaction.amount).label("total"),
        func.count(Transaction.id).label("count")
    ).join(Category, Category.id == Transaction.category_id).filter(
        Transaction.user_id == current_user.id
    )

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    rows = query.group_by(Category.name, Transaction.transaction_type).order_by(desc("total")).all()

    expenses = [
        {"category": r.category_name, "total": round(float(r.total), 2), "count": r.count}
        for r in rows if r.transaction_type == "expense"
    ]
    income = [
        {"category": r.category_name, "total": round(float(r.total), 2), "count": r.count}
        for r in rows if r.transaction_type == "income"
    ]

    return {
        "start_date": start_date,
        "end_date": end_date,
        "expenses": expenses,
        "income": income,
        "currency": current_user.preferred_currency
    }
