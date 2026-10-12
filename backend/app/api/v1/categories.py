from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.models import Category, User
from app.schemas.schemas import (
    CategoryCreate, CategoryOut, CategorizationRequest, CategorizationResponse
)
from app.api.deps import get_current_user
from app.ml.categorizer import categorizer

router = APIRouter()

@router.get("", response_model=List[CategoryOut])
def list_categories(
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Category).filter(
        or_(
            Category.is_system_category == True,
            Category.user_id == current_user.id
        )
    )
    if transaction_type:
        query = query.filter(Category.transaction_type == transaction_type)
    return query.order_by(Category.name).all()


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_custom_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if duplicate exists for this user or system
    existing = db.query(Category).filter(
        Category.name.ilike(cat_in.name.strip()),
        Category.transaction_type == cat_in.transaction_type,
        or_(Category.is_system_category == True, Category.user_id == current_user.id)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this name already exists."
        )

    cat = Category(
        name=cat_in.name.strip(),
        transaction_type=cat_in.transaction_type,
        is_system_category=False,
        user_id=current_user.id
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{category_id}", response_model=CategoryOut)
def update_custom_category(
    category_id: int,
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if cat.is_system_category or cat.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit system or other users' categories")

    cat.name = cat_in.name.strip()
    cat.transaction_type = cat_in.transaction_type
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if cat.is_system_category or cat.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete system or other users' categories")

    db.delete(cat)
    db.commit()
    return None


@router.post("/categorize", response_model=CategorizationResponse)
def auto_categorize(
    payload: CategorizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text_to_analyze = f"{payload.title} {payload.description or ''}"
    cat_name, confidence, method = categorizer.predict(text_to_analyze)

    # Find matching category ID in DB
    category = db.query(Category).filter(
        Category.name.ilike(cat_name),
        or_(Category.is_system_category == True, Category.user_id == current_user.id)
    ).first()

    return {
        "category_id": category.id if category else None,
        "category_name": category.name if category else cat_name,
        "confidence_score": confidence,
        "method": method,
        "needs_confirmation": confidence < 0.60
    }
