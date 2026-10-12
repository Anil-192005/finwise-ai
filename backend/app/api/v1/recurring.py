from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.db.session import get_db
from app.models.models import RecurringTransaction, Category, Transaction, User
from app.schemas.schemas import (
    RecurringTransactionCreate, RecurringTransactionUpdate, RecurringTransactionOut, TransactionOut
)
from app.api.deps import get_current_user

router = APIRouter()

def advance_scheduled_date(current_scheduled: date, frequency: str) -> date:
    if frequency == "weekly":
        return current_scheduled + timedelta(days=7)
    elif frequency == "monthly":
        # Advance by 1 month safely
        year = current_scheduled.year + (current_scheduled.month // 12)
        month = (current_scheduled.month % 12) + 1
        day = min(current_scheduled.day, 28)
        return date(year, month, day)
    elif frequency == "quarterly":
        year = current_scheduled.year + ((current_scheduled.month + 2) // 12)
        month = ((current_scheduled.month + 2) % 12) + 1
        day = min(current_scheduled.day, 28)
        return date(year, month, day)
    elif frequency == "yearly":
        return date(current_scheduled.year + 1, current_scheduled.month, current_scheduled.day)
    return current_scheduled + timedelta(days=30)


@router.get("", response_model=List[RecurringTransactionOut])
def list_recurring_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = (
        db.query(RecurringTransaction)
        .filter(RecurringTransaction.user_id == current_user.id)
        .order_by(desc(RecurringTransaction.created_at))
        .all()
    )
    result = []
    for item in items:
        out = RecurringTransactionOut.model_validate(item)
        out.category_name = item.category.name if item.category else None
        result.append(out)
    return result


@router.post("", response_model=RecurringTransactionOut, status_code=status.HTTP_201_CREATED)
def create_recurring_transaction(
    rec_in: RecurringTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cat = db.query(Category).filter(
        Category.id == rec_in.category_id,
        or_(Category.is_system_category == True, Category.user_id == current_user.id)
    ).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")
    if cat.transaction_type != rec_in.transaction_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{cat.name}' does not match transaction type '{rec_in.transaction_type}'"
        )

    rec = RecurringTransaction(
        user_id=current_user.id,
        title=rec_in.title.strip(),
        amount=round(rec_in.amount, 2),
        category_id=rec_in.category_id,
        transaction_type=rec_in.transaction_type,
        recurrence_frequency=rec_in.recurrence_frequency,
        start_date=rec_in.start_date,
        end_date=rec_in.end_date,
        next_scheduled_date=rec_in.next_scheduled_date,
        is_active=rec_in.is_active
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    out = RecurringTransactionOut.model_validate(rec)
    out.category_name = cat.name
    return out


@router.put("/{recurring_id}", response_model=RecurringTransactionOut)
def update_recurring_transaction(
    recurring_id: int,
    rec_in: RecurringTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")

    if rec_in.title is not None:
        rec.title = rec_in.title.strip()
    if rec_in.amount is not None:
        rec.amount = round(rec_in.amount, 2)
    if rec_in.category_id is not None:
        rec.category_id = rec_in.category_id
    if rec_in.recurrence_frequency is not None:
        rec.recurrence_frequency = rec_in.recurrence_frequency
    if rec_in.end_date is not None:
        rec.end_date = rec_in.end_date
    if rec_in.next_scheduled_date is not None:
        rec.next_scheduled_date = rec_in.next_scheduled_date
    if rec_in.is_active is not None:
        rec.is_active = rec_in.is_active

    db.commit()
    db.refresh(rec)

    out = RecurringTransactionOut.model_validate(rec)
    out.category_name = rec.category.name if rec.category else None
    return out


@router.delete("/{recurring_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")

    db.delete(rec)
    db.commit()
    return None


@router.post("/{recurring_id}/process", response_model=TransactionOut)
def process_recurring_transaction(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Idempotently creates a confirmed transaction from this recurring template and advances the next scheduled date.
    """
    rec = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == recurring_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring transaction not found")

    tx_date = rec.next_scheduled_date
    # Create the concrete transaction
    tx = Transaction(
        user_id=current_user.id,
        title=f"{rec.title} (Auto-Scheduled)",
        description=f"Generated from recurring schedule ({rec.recurrence_frequency})",
        amount=rec.amount,
        transaction_type=rec.transaction_type,
        category_id=rec.category_id,
        transaction_date=tx_date,
        payment_method="Auto-Debit",
        tags="recurring,auto"
    )
    db.add(tx)

    # Advance next scheduled date
    rec.next_scheduled_date = advance_scheduled_date(tx_date, rec.recurrence_frequency)
    db.commit()
    db.refresh(tx)

    out = TransactionOut.model_validate(tx)
    out.category_name = tx.category.name if tx.category else None
    return out
