import io
import csv
from datetime import date, datetime
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from app.db.session import get_db
from app.models.models import Transaction, Category, User
from app.schemas.schemas import (
    TransactionCreate, TransactionUpdate, TransactionOut, TransactionListResponse
)
from app.api.deps import get_current_user

router = APIRouter()

def sanitize_csv_cell(val: Any) -> str:
    """Protects against CSV Formula Injection (CWE-1236)."""
    if val is None:
        return ""
    s = str(val)
    if s.startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{s}"
    return s

@router.get("", response_model=TransactionListResponse)
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    transaction_type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: str = Query("transaction_date", pattern="^(transaction_date|amount|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.title.ilike(search_filter),
                Transaction.description.ilike(search_filter),
                Transaction.tags.ilike(search_filter)
            )
        )

    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)

    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    total = query.count()

    # Sorting
    sort_col = getattr(Transaction, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_col), desc(Transaction.id))
    else:
        query = query.order_by(asc(sort_col), asc(Transaction.id))

    # Pagination
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    # Attach category names
    res_items = []
    for item in items:
        out = TransactionOut.model_validate(item)
        out.category_name = item.category.name if item.category else "Uncategorized"
        res_items.append(out)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": res_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate category exists and matches transaction_type
    cat = db.query(Category).filter(
        Category.id == tx_in.category_id,
        or_(Category.is_system_category == True, Category.user_id == current_user.id)
    ).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found or not accessible."
        )

    if cat.transaction_type != tx_in.transaction_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{cat.name}' is of type '{cat.transaction_type}', but transaction is '{tx_in.transaction_type}'."
        )

    tx = Transaction(
        user_id=current_user.id,
        title=tx_in.title.strip(),
        description=tx_in.description.strip() if tx_in.description else None,
        amount=round(tx_in.amount, 2),
        transaction_type=tx_in.transaction_type,
        category_id=tx_in.category_id,
        transaction_date=tx_in.transaction_date,
        payment_method=tx_in.payment_method,
        tags=tx_in.tags.strip() if tx_in.tags else None
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    out = TransactionOut.model_validate(tx)
    out.category_name = cat.name
    return out


@router.get("/export")
def export_transactions_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)

    transactions = query.order_by(desc(Transaction.transaction_date)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "Date", "Title", "Type", "Category", "Amount", "Currency", "Payment Method", "Description", "Tags"
    ])

    for t in transactions:
        writer.writerow([
            sanitize_csv_cell(t.id),
            sanitize_csv_cell(t.transaction_date),
            sanitize_csv_cell(t.title),
            sanitize_csv_cell(t.transaction_type),
            sanitize_csv_cell(t.category.name if t.category else ""),
            sanitize_csv_cell(f"{float(t.amount):.2f}"),
            sanitize_csv_cell(current_user.preferred_currency),
            sanitize_csv_cell(t.payment_method),
            sanitize_csv_cell(t.description),
            sanitize_csv_cell(t.tags)
        ])

    output.seek(0)
    filename = f"finwise_transactions_{current_user.id}_{date.today().isoformat()}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    out = TransactionOut.model_validate(tx)
    out.category_name = tx.category.name if tx.category else None
    return out


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int,
    tx_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    update_type = tx_in.transaction_type or tx.transaction_type
    target_cat_id = tx_in.category_id or tx.category_id

    # If category or type changed, re-verify
    if tx_in.category_id or tx_in.transaction_type:
        cat = db.query(Category).filter(
            Category.id == target_cat_id,
            or_(Category.is_system_category == True, Category.user_id == current_user.id)
        ).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category")
        if cat.transaction_type != update_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{cat.name}' does not match type '{update_type}'"
            )

    if tx_in.title is not None:
        tx.title = tx_in.title.strip()
    if tx_in.description is not None:
        tx.description = tx_in.description.strip() if tx_in.description else None
    if tx_in.amount is not None:
        tx.amount = round(tx_in.amount, 2)
    if tx_in.transaction_type is not None:
        tx.transaction_type = tx_in.transaction_type
    if tx_in.category_id is not None:
        tx.category_id = tx_in.category_id
    if tx_in.transaction_date is not None:
        tx.transaction_date = tx_in.transaction_date
    if tx_in.payment_method is not None:
        tx.payment_method = tx_in.payment_method
    if tx_in.tags is not None:
        tx.tags = tx_in.tags.strip() if tx_in.tags else None

    db.commit()
    db.refresh(tx)

    out = TransactionOut.model_validate(tx)
    out.category_name = tx.category.name if tx.category else None
    return out


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    db.delete(tx)
    db.commit()
    return None
