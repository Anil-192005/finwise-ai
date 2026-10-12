from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.models.models import SavingsGoal, SavingsContribution, User
from app.schemas.schemas import (
    SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalOut,
    SavingsContributionCreate, SavingsContributionOut
)
from app.api.deps import get_current_user

router = APIRouter()

def build_goal_out(goal: SavingsGoal) -> SavingsGoalOut:
    contributions = sorted(goal.contributions, key=lambda c: c.contribution_date, reverse=True)
    current_saved = sum(float(c.amount) for c in contributions)
    target = float(goal.target_amount)
    remaining = max(0.0, round(target - current_saved, 2))
    progress = min(100.0, round((current_saved / target) * 100, 1)) if target > 0 else 0.0

    # Auto-update status to completed if target achieved
    estimated_completion = None
    if current_saved >= target:
        status_val = "completed"
    else:
        status_val = goal.status
        # Estimate completion date if we have >= 2 contributions over time
        if len(contributions) >= 2 and remaining > 0:
            first_c = min(contributions, key=lambda c: c.contribution_date)
            last_c = max(contributions, key=lambda c: c.contribution_date)
            days_span = (last_c.contribution_date - first_c.contribution_date).days
            if days_span >= 14:
                daily_rate = current_saved / days_span
                if daily_rate > 0:
                    days_needed = int(remaining / daily_rate)
                    est_date = date.today() + timedelta(days=days_needed)
                    estimated_completion = est_date.isoformat()

    contrib_outs = [
        SavingsContributionOut(
            id=c.id,
            goal_id=c.goal_id,
            amount=float(c.amount),
            contribution_date=c.contribution_date,
            description=c.description,
            created_at=c.created_at
        )
        for c in contributions
    ]

    return SavingsGoalOut(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        target_amount=target,
        target_date=goal.target_date,
        status=status_val,
        current_saved=current_saved,
        remaining_target=remaining,
        progress_percentage=progress,
        estimated_completion_date=estimated_completion,
        contributions=contrib_outs,
        created_at=goal.created_at,
        updated_at=goal.updated_at
    )


@router.get("/goals", response_model=List[SavingsGoalOut])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).order_by(desc(SavingsGoal.created_at)).all()
    return [build_goal_out(g) for g in goals]


@router.post("/goals", response_model=SavingsGoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = SavingsGoal(
        user_id=current_user.id,
        name=goal_in.name.strip(),
        target_amount=round(goal_in.target_amount, 2),
        target_date=goal_in.target_date,
        status="active"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return build_goal_out(goal)


@router.put("/goals/{goal_id}", response_model=SavingsGoalOut)
def update_goal(
    goal_id: int,
    goal_in: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    if goal_in.name is not None:
        goal.name = goal_in.name.strip()
    if goal_in.target_amount is not None:
        goal.target_amount = round(goal_in.target_amount, 2)
    if goal_in.target_date is not None:
        goal.target_date = goal_in.target_date
    if goal_in.status is not None:
        goal.status = goal_in.status

    db.commit()
    db.refresh(goal)
    return build_goal_out(goal)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    db.delete(goal)
    db.commit()
    return None


@router.post("/goals/{goal_id}/contributions", response_model=SavingsGoalOut, status_code=status.HTTP_201_CREATED)
def add_contribution(
    goal_id: int,
    contrib_in: SavingsContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(SavingsGoal).filter(
        SavingsGoal.id == goal_id,
        SavingsGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found")

    contrib = SavingsContribution(
        user_id=current_user.id,
        goal_id=goal.id,
        amount=round(contrib_in.amount, 2),
        contribution_date=contrib_in.contribution_date,
        description=contrib_in.description.strip() if contrib_in.description else None
    )
    db.add(contrib)
    db.commit()
    db.refresh(goal)
    return build_goal_out(goal)
