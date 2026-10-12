from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.db.session import get_db
from app.models.models import Budget, Category, Transaction, User, UserPreference
from app.schemas.schemas import BudgetCreate, BudgetUpdate, BudgetOut
from app.api.deps import get_current_user

router = APIRouter()

def calculate_budget_status(spent: float, budget_amount: float, threshold: float = 75.0) -> tuple:
    if budget_amount <= 0:
        return 0.0, 0.0, "within_budget"
    utilization = round((spent / budget_amount) * 100, 1)
    remaining = round(budget_amount - spent, 2)
    if utilization >= 100.0:
        status_str = "budget_exceeded"
    elif utilization >= threshold:
        status_str = "approaching_limit"
    else:
        status_str = "within_budget"
    return utilization, remaining, status_str


@router.get("", response_model=List[BudgetOut])
def list_budgets(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not month:
        month = date.today().strftime("%Y-%m")

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    warning_threshold = pref.budget_warning_threshold if pref else 75.0

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.budget_month == month
        )
        .all()
    )

    result = []
    for b in budgets:
        # Calculate actual spent for this category and month
        spent_query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense",
            func.strftime("%Y-%m", Transaction.transaction_date) == month
        )
        if b.category_id:
            spent_query = spent_query.filter(Transaction.category_id == b.category_id)
        
        actual_spent = float(spent_query.scalar() or 0.0)
        budget_amt = float(b.amount)
        utilization, remaining, status_str = calculate_budget_status(actual_spent, budget_amt, warning_threshold)

        out = BudgetOut(
            id=b.id,
            user_id=b.user_id,
            category_id=b.category_id,
            category_name=b.category.name if b.category else "Overall Monthly Budget",
            amount=budget_amt,
            budget_month=b.budget_month,
            actual_spent=actual_spent,
            remaining_budget=remaining,
            utilization_percentage=utilization,
            status=status_str,
            created_at=b.created_at
        )
        result.append(out)

    return result


@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    b_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check duplicate
    dup_query = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.budget_month == b_in.budget_month,
        Budget.category_id == b_in.category_id
    )
    if dup_query.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A budget for this category and month already exists."
        )

    if b_in.category_id:
        cat = db.query(Category).filter(
            Category.id == b_in.category_id,
            Category.transaction_type == "expense",
            or_(Category.is_system_category == True, Category.user_id == current_user.id)
        ).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid expense category")

    budget = Budget(
        user_id=current_user.id,
        category_id=b_in.category_id,
        amount=round(b_in.amount, 2),
        budget_month=b_in.budget_month
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)

    # Compute actual spent
    spent_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "expense",
        func.strftime("%Y-%m", Transaction.transaction_date) == b_in.budget_month
    )
    if budget.category_id:
        spent_query = spent_query.filter(Transaction.category_id == budget.category_id)
    actual_spent = float(spent_query.scalar() or 0.0)

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    warning_threshold = pref.budget_warning_threshold if pref else 75.0
    utilization, remaining, status_str = calculate_budget_status(actual_spent, float(budget.amount), warning_threshold)

    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        category_id=budget.category_id,
        category_name=budget.category.name if budget.category else "Overall Monthly Budget",
        amount=float(budget.amount),
        budget_month=budget.budget_month,
        actual_spent=actual_spent,
        remaining_budget=remaining,
        utilization_percentage=utilization,
        status=status_str,
        created_at=budget.created_at
    )


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    b_in: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    budget.amount = round(b_in.amount, 2)
    db.commit()
    db.refresh(budget)

    spent_query = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == "expense",
        func.strftime("%Y-%m", Transaction.transaction_date) == budget.budget_month
    )
    if budget.category_id:
        spent_query = spent_query.filter(Transaction.category_id == budget.category_id)
    actual_spent = float(spent_query.scalar() or 0.0)

    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    warning_threshold = pref.budget_warning_threshold if pref else 75.0
    utilization, remaining, status_str = calculate_budget_status(actual_spent, float(budget.amount), warning_threshold)

    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        category_id=budget.category_id,
        category_name=budget.category.name if budget.category else "Overall Monthly Budget",
        amount=float(budget.amount),
        budget_month=budget.budget_month,
        actual_spent=actual_spent,
        remaining_budget=remaining,
        utilization_percentage=utilization,
        status=status_str,
        created_at=budget.created_at
    )


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return None
