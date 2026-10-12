from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import InsightsResponse, QuestionRequest, QuestionResponse
from app.api.deps import get_current_user
from app.analytics.insights import generate_insights_report, answer_financial_question

router = APIRouter()

@router.get("", response_model=InsightsResponse)
def get_financial_insights(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not month:
        month = date.today().strftime("%Y-%m")
    return generate_insights_report(current_user.id, db, month)


@router.post("/ask", response_model=QuestionResponse)
def ask_financial_question(
    req: QuestionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return answer_financial_question(current_user.id, db, req.question, req.month)
