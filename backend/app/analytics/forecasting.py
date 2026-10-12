from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Transaction, Budget, Category
from sklearn.linear_model import LinearRegression
import numpy as np

def generate_monthly_forecast(user_id: int, db: Session) -> Dict[str, Any]:
    """
    Analyzes historical monthly expense data using rolling average and linear regression.
    Requires at least 2 distinct months of historical data.
    """
    # Query monthly expenses aggregated by month
    tx_query = (
        db.query(
            func.strftime("%Y-%m", Transaction.transaction_date).label("month"),
            func.sum(Transaction.amount).label("total_expenses")
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense"
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    if len(tx_query) < 2:
        return {
            "has_sufficient_data": False,
            "data_points_count": len(tx_query),
            "forecasted_next_month": None,
            "lower_bound": None,
            "upper_bound": None,
            "confidence_score": None,
            "method": "insufficient_data",
            "explanation": "Not enough transaction history to generate a reliable forecast. At least 2 months of expenses are required.",
            "history": [{"month": t.month, "actual": float(t.total_expenses)} for t in tx_query],
            "budget_comparison": None
        }

    months = [t.month for t in tx_query]
    actual_values = [float(t.total_expenses) for t in tx_query]

    # Time series index (0, 1, 2, ...)
    X = np.arange(len(actual_values)).reshape(-1, 1)
    y = np.array(actual_values)

    # Train linear regression
    model = LinearRegression()
    model.fit(X, y)

    # Predict next month (X = len)
    next_x = np.array([[len(actual_values)]])
    linear_pred = float(model.predict(next_x)[0])

    # Rolling average (last 3 months or available)
    window = min(3, len(actual_values))
    rolling_avg = float(np.mean(actual_values[-window:]))

    # Weighted forecast: 60% rolling average, 40% trend
    forecast_val = max(0.0, round(0.6 * rolling_avg + 0.4 * linear_pred, 2))

    # Standard deviation of residuals for confidence band
    residuals = y - model.predict(X)
    std_err = float(np.std(residuals)) if len(residuals) > 1 else (forecast_val * 0.1)
    
    lower_bound = max(0.0, round(forecast_val - 1.28 * std_err, 2))  # ~80% prediction interval
    upper_bound = round(forecast_val + 1.28 * std_err, 2)
    confidence_score = round(min(0.95, max(0.50, 1.0 - (std_err / (rolling_avg + 1e-5)))), 2)

    # Calculate next month label
    last_year, last_month = map(int, months[-1].split("-"))
    if last_month == 12:
        next_month_str = f"{last_year + 1:04d}-01"
    else:
        next_month_str = f"{last_year:04d}-{last_month + 1:02d}"

    history_points = []
    for m, val in zip(months, actual_values):
        history_points.append({
            "month": m,
            "actual": val,
            "forecast": None,
            "lower_bound": None,
            "upper_bound": None
        })

    history_points.append({
        "month": next_month_str,
        "actual": None,
        "forecast": forecast_val,
        "lower_bound": lower_bound,
        "upper_bound": upper_bound
    })

    # Compare with current or next month's total budgets
    budget_sum = db.query(func.sum(Budget.amount)).filter(
        Budget.user_id == user_id,
        Budget.budget_month == months[-1]
    ).scalar() or 0.0
    budget_sum = float(budget_sum)

    budget_comparison = None
    if budget_sum > 0:
        utilization = round((forecast_val / budget_sum) * 100, 1)
        budget_comparison = {
            "total_budget": budget_sum,
            "forecasted_amount": forecast_val,
            "projected_utilization": utilization,
            "projected_over_budget": forecast_val > budget_sum,
            "projected_variance": round(forecast_val - budget_sum, 2)
        }

    return {
        "has_sufficient_data": True,
        "data_points_count": len(actual_values),
        "forecasted_next_month": forecast_val,
        "lower_bound": lower_bound,
        "upper_bound": upper_bound,
        "confidence_score": confidence_score,
        "method": "Hybrid Rolling-Average & OLS Linear Regression",
        "explanation": f"Based on {len(actual_values)} months of data, your predicted expenses for {next_month_str} are ₹{forecast_val:,.2f} (80% confidence interval: ₹{lower_bound:,.2f} – ₹{upper_bound:,.2f}).",
        "history": history_points,
        "budget_comparison": budget_comparison
    }


def generate_category_forecast(user_id: int, db: Session, target_month: Optional[str] = None) -> Dict[str, Any]:
    """
    Breaks down historical spending per category to forecast category trends and identify budget risk.
    """
    if not target_month:
        target_month = date.today().strftime("%Y-%m")

    # Get categories where user has expenses
    categories = (
        db.query(Category.id, Category.name)
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense"
        )
        .distinct()
        .all()
    )

    if not categories:
        return {
            "has_sufficient_data": False,
            "categories": [],
            "message": "No expense history found across categories."
        }

    results = []
    for cat_id, cat_name in categories:
        monthly_totals = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.user_id == user_id,
                Transaction.category_id == cat_id,
                Transaction.transaction_type == "expense"
            )
            .group_by(func.strftime("%Y-%m", Transaction.transaction_date))
            .all()
        )
        vals = [float(m[0]) for m in monthly_totals if m[0] is not None]
        if not vals:
            continue

        hist_avg = round(float(np.mean(vals)), 2)
        # Weighted estimate with recent momentum
        forecast_amt = round(vals[-1] * 0.4 + hist_avg * 0.6, 2) if len(vals) > 1 else vals[0]

        # Budget for current target month
        budget_record = (
            db.query(Budget)
            .filter(
                Budget.user_id == user_id,
                Budget.category_id == cat_id,
                Budget.budget_month == target_month
            )
            .first()
        )
        budget_val = float(budget_record.amount) if budget_record else None
        proj_util = round((forecast_amt / budget_val) * 100, 1) if budget_val and budget_val > 0 else None

        risk_level = "low"
        if proj_util:
            if proj_util >= 100:
                risk_level = "high"
            elif proj_util >= 80:
                risk_level = "moderate"

        results.append({
            "category_name": cat_name,
            "historical_average": hist_avg,
            "forecasted_amount": forecast_amt,
            "current_budget": budget_val,
            "projected_utilization": proj_util,
            "risk_level": risk_level
        })

    results.sort(key=lambda x: x["forecasted_amount"], reverse=True)
    return {
        "has_sufficient_data": len(results) > 0,
        "categories": results,
        "message": "Category-level expense forecast generated successfully."
    }
