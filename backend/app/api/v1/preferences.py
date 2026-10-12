from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, UserPreference
from app.schemas.schemas import UserPreferenceUpdate, UserPreferenceOut
from app.api.deps import get_current_user

router = APIRouter()

@router.get("", response_model=UserPreferenceOut)
def get_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            preferred_currency=current_user.preferred_currency,
            budget_warning_threshold=75.0,
            notification_preferences="{}"
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("", response_model=UserPreferenceOut)
def update_preferences(
    pref_in: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pref = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        db.add(pref)

    if pref_in.preferred_currency:
        valid_currencies = ["INR", "USD", "EUR", "GBP"]
        if pref_in.preferred_currency.upper() not in valid_currencies:
            raise HTTPException(status_code=400, detail="Invalid currency")
        pref.preferred_currency = pref_in.preferred_currency.upper()
        current_user.preferred_currency = pref.preferred_currency

    if pref_in.budget_warning_threshold is not None:
        pref.budget_warning_threshold = pref_in.budget_warning_threshold

    if pref_in.notification_preferences is not None:
        pref.notification_preferences = pref_in.notification_preferences

    db.commit()
    db.refresh(pref)
    return pref


@router.delete("/account", status_code=status.HTTP_200_OK)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permanently deletes user account and all cascaded transactions, budgets, goals, and recurring items.
    """
    db.delete(current_user)
    db.commit()
    return {"message": "Account and all associated personal financial data have been permanently deleted."}
