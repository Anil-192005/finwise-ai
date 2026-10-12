from datetime import date, datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Transaction, Budget, Category, SavingsGoal, SavingsContribution
import re

def generate_insights_report(user_id: int, db: Session, month_str: Optional[str] = None) -> Dict[str, Any]:
    if not month_str:
        month_str = date.today().strftime("%Y-%m")

    year, month = map(int, month_str.split("-"))
    # Previous month string
    prev_date = date(year, month, 1) - timedelta(days=1)
    prev_month_str = prev_date.strftime("%Y-%m")

    # Current month income & expenses
    current_txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            func.strftime("%Y-%m", Transaction.transaction_date) == month_str
        )
        .all()
    )

    prev_txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            func.strftime("%Y-%m", Transaction.transaction_date) == prev_month_str
        )
        .all()
    )

    curr_income = sum(float(t.amount) for t in current_txs if t.transaction_type == "income")
    curr_expense = sum(float(t.amount) for t in current_txs if t.transaction_type == "expense")
    prev_income = sum(float(t.amount) for t in prev_txs if t.transaction_type == "income")
    prev_expense = sum(float(t.amount) for t in prev_txs if t.transaction_type == "expense")
    net_cash_flow = curr_income - curr_expense

    # Category breakdown for current and previous month
    curr_cat_expenses: Dict[str, float] = {}
    prev_cat_expenses: Dict[str, float] = {}

    for t in current_txs:
        if t.transaction_type == "expense":
            cat_name = t.category.name if t.category else "Other"
            curr_cat_expenses[cat_name] = curr_cat_expenses.get(cat_name, 0.0) + float(t.amount)

    for t in prev_txs:
        if t.transaction_type == "expense":
            cat_name = t.category.name if t.category else "Other"
            prev_cat_expenses[cat_name] = prev_cat_expenses.get(cat_name, 0.0) + float(t.amount)

    # Budgets for current month
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.budget_month == month_str
        )
        .all()
    )

    # Savings goals
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id, SavingsGoal.status == "active").all()
    total_goals_target = sum(float(g.target_amount) for g in goals)
    total_savings_contributed = 0.0
    for g in goals:
        total_savings_contributed += sum(float(c.amount) for c in g.contributions)

    insights: List[Dict[str, Any]] = []

    # 1. Overall Spending Trend
    if prev_expense > 0:
        pct_change = round(((curr_expense - prev_expense) / prev_expense) * 100, 1)
        if pct_change > 0:
            insights.append({
                "type": "trend",
                "title": "Monthly Expense Increase",
                "description": f"You have spent ₹{curr_expense:,.2f} this month, which is {pct_change}% higher than last month (₹{prev_expense:,.2f}).",
                "badge": f"+{pct_change}%",
                "impact_level": "warning" if pct_change > 15 else "info"
            })
        else:
            insights.append({
                "type": "trend",
                "title": "Expense Reduction",
                "description": f"Great job! Your spending is down by {abs(pct_change)}% compared to last month (₹{prev_expense:,.2f}).",
                "badge": f"{pct_change}%",
                "impact_level": "positive"
            })

    # 2. Category-Specific Trends & Unusual Spending
    for cat_name, curr_amt in curr_cat_expenses.items():
        prev_amt = prev_cat_expenses.get(cat_name, 0.0)
        if prev_amt > 0:
            diff_pct = round(((curr_amt - prev_amt) / prev_amt) * 100, 1)
            if diff_pct >= 25 and curr_amt > 1000:
                insights.append({
                    "type": "unusual",
                    "title": f"Spike in {cat_name} Spending",
                    "description": f"Your spending in {cat_name} is up {diff_pct}% compared to last month (₹{curr_amt:,.2f} vs ₹{prev_amt:,.2f}).",
                    "badge": f"+{diff_pct}% Spike",
                    "impact_level": "warning"
                })

    # 3. Budget Recommendations
    over_budget_cats = []
    approaching_cats = []
    for b in budgets:
        cat_name = b.category.name if b.category else "Overall"
        spent = curr_cat_expenses.get(cat_name, 0.0)
        b_amt = float(b.amount)
        utilization = (spent / b_amt) * 100 if b_amt > 0 else 0
        if utilization >= 100:
            over_budget_cats.append((cat_name, spent, b_amt, round(utilization, 1)))
        elif utilization >= 75:
            approaching_cats.append((cat_name, spent, b_amt, round(utilization, 1)))

    if over_budget_cats:
        cat_names = ", ".join([c[0] for c in over_budget_cats])
        insights.append({
            "type": "recommendation",
            "title": "Budget Limit Exceeded",
            "description": f"Spending in {cat_names} has exceeded your assigned budget threshold. Consider curbing discretionary spending or adjusting limits.",
            "badge": "Exceeded",
            "impact_level": "warning"
        })
    elif approaching_cats:
        cat_names = ", ".join([c[0] for c in approaching_cats])
        insights.append({
            "type": "recommendation",
            "title": "Budgets Nearing Capacity",
            "description": f"Categories {cat_names} have reached over 75% of their allocation.",
            "badge": "Approaching Limit",
            "impact_level": "info"
        })

    # 4. Savings Opportunities
    discretionary_categories = ["Shopping", "Entertainment", "Food", "Subscriptions"]
    discretionary_total = sum(curr_cat_expenses.get(c, 0.0) for c in discretionary_categories)
    if discretionary_total > 2000 and goals:
        potential_save = round(discretionary_total * 0.15, 2)
        top_goal = goals[0].name
        insights.append({
            "type": "opportunity",
            "title": "Accelerate Goal Progress",
            "description": f"Trimming 15% (₹{potential_save:,.2f}) across dining, entertainment, and shopping could directly fund your '{top_goal}' target.",
            "badge": f"Save ₹{potential_save:,.0f}",
            "impact_level": "positive"
        })

    # 5. Monthly Financial Summary
    top_cat = max(curr_cat_expenses.items(), key=lambda x: x[1])[0] if curr_cat_expenses else "N/A"
    savings_rate = round((net_cash_flow / curr_income) * 100, 1) if curr_income > 0 else 0.0

    summary_text = (
        f"For {month_str}, you recorded ₹{curr_income:,.2f} in income and ₹{curr_expense:,.2f} in expenses, "
        f"yielding a net cash flow of ₹{net_cash_flow:,.2f} ({savings_rate}% savings rate). "
        f"Your highest spending category this month is {top_cat}. "
    )
    if net_cash_flow >= 0:
        summary_text += "You are cash-flow positive, positioning you well for your financial goals."
    else:
        summary_text += "Your expenses exceeded your income this month. Review non-essential expenses to restore balance."

    return {
        "selected_month": month_str,
        "monthly_summary": summary_text,
        "insights": insights,
        "generated_at": datetime.utcnow()
    }


def answer_financial_question(user_id: int, db: Session, question: str, month_str: Optional[str] = None) -> Dict[str, Any]:
    """
    Answers natural language queries about the authenticated user's records deterministically.
    """
    if not month_str:
        month_str = date.today().strftime("%Y-%m")

    q = question.lower().strip()

    # Query current month transactions
    txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            func.strftime("%Y-%m", Transaction.transaction_date) == month_str
        )
        .all()
    )

    income = sum(float(t.amount) for t in txs if t.transaction_type == "income")
    expenses = sum(float(t.amount) for t in txs if t.transaction_type == "expense")
    net = income - expenses

    # Category totals
    cat_totals: Dict[str, float] = {}
    for t in txs:
        if t.transaction_type == "expense":
            c_name = t.category.name if t.category else "Other"
            cat_totals[c_name] = cat_totals.get(c_name, 0.0) + float(t.amount)

    # Budgets
    budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.budget_month == month_str).all()
    total_budget = sum(float(b.amount) for b in budgets)

    # 1. Category specific questions: "how much did i spend on [food|shopping|etc]?"
    for cat_name, amt in cat_totals.items():
        if cat_name.lower() in q:
            # Check if there was a budget
            cat_b = next((b for b in budgets if b.category and b.category.name.lower() == cat_name.lower()), None)
            budget_info = ""
            if cat_b:
                b_amt = float(cat_b.amount)
                util = round((amt / b_amt) * 100, 1)
                budget_info = f" (Your budget is ₹{b_amt:,.2f}, utilization: {util}%)."
            return {
                "question": question,
                "answer": f"You spent ₹{amt:,.2f} on {cat_name} in {month_str}{budget_info}.",
                "data_points": {"category": cat_name, "spent": amt, "month": month_str}
            }

    # 2. "Which category increased the most" or "highest expense"
    if "highest" in q or "most" in q or "top" in q:
        if cat_totals:
            top_cat, top_amt = max(cat_totals.items(), key=lambda x: x[1])
            share = round((top_amt / expenses) * 100, 1) if expenses > 0 else 0
            return {
                "question": question,
                "answer": f"Your highest expense category in {month_str} is {top_cat} with ₹{top_amt:,.2f}, representing {share}% of your total expenses.",
                "data_points": {"top_category": top_cat, "amount": top_amt, "share_pct": share}
            }
        else:
            return {
                "question": question,
                "answer": f"No expense transactions recorded yet for {month_str}.",
                "data_points": {}
            }

    # 3. "Am I within my monthly budget" or "budget status"
    if "within" in q or "budget" in q:
        if total_budget > 0:
            rem = total_budget - expenses
            util = round((expenses / total_budget) * 100, 1)
            if expenses <= total_budget:
                return {
                    "question": question,
                    "answer": f"Yes, you are within your overall budget! You have spent ₹{expenses:,.2f} out of ₹{total_budget:,.2f} ({util}% utilized), leaving ₹{rem:,.2f} remaining.",
                    "data_points": {"spent": expenses, "budget": total_budget, "remaining": rem, "utilization": util}
                }
            else:
                over = expenses - total_budget
                return {
                    "question": question,
                    "answer": f"You have exceeded your total budget by ₹{over:,.2f}. Current spending is ₹{expenses:,.2f} against a budget of ₹{total_budget:,.2f} ({util}% utilized).",
                    "data_points": {"spent": expenses, "budget": total_budget, "over_by": over, "utilization": util}
                }
        else:
            return {
                "question": question,
                "answer": f"You haven't set an overall budget for {month_str}. You have spent ₹{expenses:,.2f} so far.",
                "data_points": {"expenses": expenses}
            }

    # 4. "How much could I save if I reduce..."
    if "reduce" in q or "save" in q:
        # Check target category
        found_cat = None
        for c in cat_totals:
            if c.lower() in q:
                found_cat = c
                break
        if found_cat:
            c_amt = cat_totals[found_cat]
            saved_20 = round(c_amt * 0.20, 2)
            saved_30 = round(c_amt * 0.30, 2)
            return {
                "question": question,
                "answer": f"You spent ₹{c_amt:,.2f} on {found_cat}. A 20% reduction would save you ₹{saved_20:,.2f}/month, and a 30% reduction would save ₹{saved_30:,.2f}/month.",
                "data_points": {"category": found_cat, "spent": c_amt, "save_20_pct": saved_20, "save_30_pct": saved_30}
            }
        else:
            save_10 = round(expenses * 0.10, 2)
            return {
                "question": question,
                "answer": f"Your total expenses for {month_str} are ₹{expenses:,.2f}. A 10% cut across your discretionary spending would save ₹{save_10:,.2f}.",
                "data_points": {"total_expenses": expenses, "potential_savings_10_pct": save_10}
            }

    # 5. Default financial summary response
    return {
        "question": question,
        "answer": f"In {month_str}, your total income is ₹{income:,.2f}, total expenses are ₹{expenses:,.2f}, and net cash flow is ₹{net:,.2f}.",
        "data_points": {"income": income, "expenses": expenses, "net": net}
    }
