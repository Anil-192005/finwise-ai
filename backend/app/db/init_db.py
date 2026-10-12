from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal, Base
from app.models.models import Category, User, UserPreference, Transaction, Budget, SavingsGoal, SavingsContribution
from app.core.security import get_password_hash
from datetime import datetime, date, timedelta
import random

SYSTEM_CATEGORIES = [
    # Income categories
    ("Salary", "income"),
    ("Freelancing", "income"),
    ("Business", "income"),
    ("Scholarship", "income"),
    ("Investment Income", "income"),
    ("Other Income", "income"),
    # Expense categories
    ("Food", "expense"),
    ("Groceries", "expense"),
    ("Transportation", "expense"),
    ("Education", "expense"),
    ("Housing", "expense"),
    ("Rent", "expense"),
    ("Utilities", "expense"),
    ("Shopping", "expense"),
    ("Healthcare", "expense"),
    ("Entertainment", "expense"),
    ("Subscriptions", "expense"),
    ("Travel", "expense"),
    ("Personal Care", "expense"),
    ("Other Expenses", "expense"),
]

def init_db(db: Session = None) -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Check if system categories already exist
        existing_categories = {c.name.lower(): c for c in db.query(Category).filter(Category.is_system_category == True).all()}
        
        for name, trans_type in SYSTEM_CATEGORIES:
            if name.lower() not in existing_categories:
                category = Category(
                    name=name,
                    transaction_type=trans_type,
                    is_system_category=True,
                    user_id=None
                )
                db.add(category)
        db.commit()
    finally:
        if close_db:
            db.close()


def seed_demo_data(db: Session = None) -> dict:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Check if demo user exists
        demo_email = "demo@finwise.ai"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            user = User(
                full_name="Alex Morgan",
                email=demo_email,
                password_hash=get_password_hash("DemoPass123!"),
                preferred_currency="INR"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            pref = UserPreference(
                user_id=user.id,
                preferred_currency="INR",
                budget_warning_threshold=75.0,
                notification_preferences="{}"
            )
            db.add(pref)
            db.commit()

        # Load categories
        cats = {c.name: c.id for c in db.query(Category).all()}
        
        # Check if user already has transactions
        existing_tx = db.query(Transaction).filter(Transaction.user_id == user.id).count()
        if existing_tx == 0:
            today = date.today()
            # Generate 3 months of realistic transactions
            records = []
            
            # Month -2, Month -1, Month 0
            for month_offset in [2, 1, 0]:
                month_date = today.replace(day=1) - timedelta(days=month_offset * 30)
                year = month_date.year
                month = month_date.month
                month_str = f"{year:04d}-{month:02d}"

                # Incomes
                salary_date = date(year, month, 1)
                records.append(Transaction(
                    user_id=user.id,
                    title="Monthly Salary Credit",
                    description="Tech Innovations Corp - Monthly Payroll",
                    amount=85000.00,
                    transaction_type="income",
                    category_id=cats.get("Salary", 1),
                    transaction_date=salary_date,
                    payment_method="Net Banking",
                    tags="salary,primary"
                ))

                if month_offset in [0, 1]:
                    records.append(Transaction(
                        user_id=user.id,
                        title="UI/UX Consulting Project",
                        description="Client freelance milestone payout",
                        amount=15000.00,
                        transaction_type="income",
                        category_id=cats.get("Freelancing", 2),
                        transaction_date=date(year, month, 14),
                        payment_method="UPI",
                        tags="freelance"
                    ))

                # Expenses
                records.append(Transaction(
                    user_id=user.id,
                    title="Apartment Rent",
                    description="Monthly apartment lease payment",
                    amount=22000.00,
                    transaction_type="expense",
                    category_id=cats.get("Rent", 12),
                    transaction_date=date(year, month, 3),
                    payment_method="Net Banking",
                    tags="fixed,housing"
                ))

                records.append(Transaction(
                    user_id=user.id,
                    title="Electricity & Water Utility Bill",
                    description="City power board monthly bill",
                    amount=3450.00 if month_offset != 0 else 3200.00,
                    transaction_type="expense",
                    category_id=cats.get("Utilities", 13),
                    transaction_date=date(year, month, 5),
                    payment_method="UPI",
                    tags="utilities"
                ))

                records.append(Transaction(
                    user_id=user.id,
                    title="Grocery Supermarket Haul",
                    description="Nature's Basket bi-weekly groceries",
                    amount=4200.00,
                    transaction_type="expense",
                    category_id=cats.get("Groceries", 8),
                    transaction_date=date(year, month, 7),
                    payment_method="Credit Card",
                    tags="essentials"
                ))

                records.append(Transaction(
                    user_id=user.id,
                    title="Swiggy Gourmet Dinner",
                    description="Weekend takeout with colleagues",
                    amount=1250.00,
                    transaction_type="expense",
                    category_id=cats.get("Food", 7),
                    transaction_date=date(year, month, 10),
                    payment_method="UPI",
                    tags="food,weekend"
                ))

                records.append(Transaction(
                    user_id=user.id,
                    title="Uber City Commute",
                    description="Rides to client tech park office",
                    amount=1850.00,
                    transaction_type="expense",
                    category_id=cats.get("Transportation", 9),
                    transaction_date=date(year, month, 12),
                    payment_method="UPI",
                    tags="commute"
                ))

                records.append(Transaction(
                    user_id=user.id,
                    title="Amazon Electronics & Essentials",
                    description="Keyboard accessories and cables",
                    amount=2600.00,
                    transaction_type="expense",
                    category_id=cats.get("Shopping", 14),
                    transaction_date=date(year, month, 16),
                    payment_method="Credit Card",
                    tags="online"
                ))

                records.append(Transaction(
                    user_id=user.id,
                    title="Netflix & Spotify Subscriptions",
                    description="Monthly recurring media streaming bundle",
                    amount=799.00,
                    transaction_type="expense",
                    category_id=cats.get("Subscriptions", 17),
                    transaction_date=date(year, month, 18),
                    payment_method="Credit Card",
                    tags="digital,subscriptions"
                ))

                # Add extra food & coffee
                records.append(Transaction(
                    user_id=user.id,
                    title="Starbucks Artisan Roast",
                    description="Team strategy session coffee",
                    amount=680.00,
                    transaction_type="expense",
                    category_id=cats.get("Food", 7),
                    transaction_date=date(year, month, 22),
                    payment_method="UPI",
                    tags="coffee"
                ))

                # Month budgets
                if cats.get("Food"):
                    db.add(Budget(user_id=user.id, category_id=cats["Food"], amount=6000.00, budget_month=month_str))
                if cats.get("Groceries"):
                    db.add(Budget(user_id=user.id, category_id=cats["Groceries"], amount=8000.00, budget_month=month_str))
                if cats.get("Transportation"):
                    db.add(Budget(user_id=user.id, category_id=cats["Transportation"], amount=4000.00, budget_month=month_str))
                if cats.get("Shopping"):
                    db.add(Budget(user_id=user.id, category_id=cats["Shopping"], amount=5000.00, budget_month=month_str))

            for r in records:
                db.add(r)

            # Savings Goals
            goal1 = SavingsGoal(
                user_id=user.id,
                name="Emergency Safety Fund",
                target_amount=150000.00,
                target_date=today + timedelta(days=180),
                status="active"
            )
            goal2 = SavingsGoal(
                user_id=user.id,
                name="M3 MacBook Pro Upgrade",
                target_amount=180000.00,
                target_date=today + timedelta(days=120),
                status="active"
            )
            db.add(goal1)
            db.add(goal2)
            db.commit()
            db.refresh(goal1)
            db.refresh(goal2)

            # Savings contributions
            db.add(SavingsContribution(
                user_id=user.id,
                goal_id=goal1.id,
                amount=35000.00,
                contribution_date=today - timedelta(days=45),
                description="Initial fund allocation from bonuses"
            ))
            db.add(SavingsContribution(
                user_id=user.id,
                goal_id=goal1.id,
                amount=25000.00,
                contribution_date=today - timedelta(days=15),
                description="Monthly emergency fund contribution"
            ))
            db.add(SavingsContribution(
                user_id=user.id,
                goal_id=goal2.id,
                amount=40000.00,
                contribution_date=today - timedelta(days=20),
                description="Freelance earnings saved for laptop"
            ))
            db.commit()

        return {"user": demo_email, "password": "DemoPass123!"}
    finally:
        if close_db:
            db.close()
