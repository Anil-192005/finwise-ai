from datetime import date, timedelta

def test_auth_registration_and_login(client):
    email = "tester@finwise.ai"
    reg_res = client.post("/api/v1/auth/register", json={
        "full_name": "Test Tester",
        "email": email,
        "password": "ValidPassword99!",
        "confirm_password": "ValidPassword99!",
        "preferred_currency": "INR"
    })
    assert reg_res.status_code == 201
    assert "access_token" in reg_res.json()
    assert reg_res.json()["user"]["email"] == email

    # Test duplicate registration
    dup_res = client.post("/api/v1/auth/register", json={
        "full_name": "Test Duplicate",
        "email": email,
        "password": "ValidPassword99!",
        "confirm_password": "ValidPassword99!",
        "preferred_currency": "INR"
    })
    assert dup_res.status_code == 400

    # Test invalid login
    bad_login = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401

    # Test valid login
    good_login = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "ValidPassword99!"
    })
    assert good_login.status_code == 200
    assert "access_token" in good_login.json()


def test_protected_endpoints_require_token(client):
    res = client.get("/api/v1/transactions")
    assert res.status_code == 401


def test_transactions_crud_and_validation(client, auth_headers_user1):
    # Fetch categories
    cat_res = client.get("/api/v1/categories", headers=auth_headers_user1)
    assert cat_res.status_code == 200
    categories = cat_res.json()
    food_cat = next(c for c in categories if c["name"] == "Food")
    salary_cat = next(c for c in categories if c["name"] == "Salary")

    # Invalid amount (zero or negative)
    bad_tx = client.post("/api/v1/transactions", json={
        "title": "Invalid tx",
        "amount": -50.0,
        "transaction_type": "expense",
        "category_id": food_cat["id"],
        "transaction_date": "2026-03-01"
    }, headers=auth_headers_user1)
    assert bad_tx.status_code == 422

    # Mismatched category type (income category on expense transaction)
    mismatch_tx = client.post("/api/v1/transactions", json={
        "title": "Invalid category match",
        "amount": 100.0,
        "transaction_type": "expense",
        "category_id": salary_cat["id"],
        "transaction_date": "2026-03-01"
    }, headers=auth_headers_user1)
    assert mismatch_tx.status_code == 400

    # Valid transaction creation
    create_res = client.post("/api/v1/transactions", json={
        "title": "Lunch at Bistro",
        "description": "Lunch meeting",
        "amount": 450.50,
        "transaction_type": "expense",
        "category_id": food_cat["id"],
        "transaction_date": "2026-03-15",
        "payment_method": "UPI"
    }, headers=auth_headers_user1)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # Read transaction
    get_res = client.get(f"/api/v1/transactions/{created_id}", headers=auth_headers_user1)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Lunch at Bistro"

    # Edit transaction
    update_res = client.put(f"/api/v1/transactions/{created_id}", json={
        "amount": 500.00
    }, headers=auth_headers_user1)
    assert update_res.status_code == 200
    assert update_res.json()["amount"] == 500.00

    # Delete transaction
    del_res = client.delete(f"/api/v1/transactions/{created_id}", headers=auth_headers_user1)
    assert del_res.status_code == 204


def test_user_isolation_security(client, auth_headers_user1, auth_headers_user2):
    # User 1 creates transaction
    cat_res = client.get("/api/v1/categories", headers=auth_headers_user1)
    food_cat = next(c for c in cat_res.json() if c["name"] == "Food")
    
    u1_tx = client.post("/api/v1/transactions", json={
        "title": "User1 Private Lunch",
        "amount": 300.0,
        "transaction_type": "expense",
        "category_id": food_cat["id"],
        "transaction_date": "2026-03-10"
    }, headers=auth_headers_user1).json()
    u1_tx_id = u1_tx["id"]

    # User 2 attempts to read User 1's transaction
    u2_get = client.get(f"/api/v1/transactions/{u1_tx_id}", headers=auth_headers_user2)
    assert u2_get.status_code == 404

    # User 2 attempts to delete User 1's transaction
    u2_del = client.delete(f"/api/v1/transactions/{u1_tx_id}", headers=auth_headers_user2)
    assert u2_del.status_code == 404


def test_budgets_and_warning_thresholds(client, auth_headers_user1):
    cat_res = client.get("/api/v1/categories", headers=auth_headers_user1)
    groceries_cat = next(c for c in cat_res.json() if c["name"] == "Groceries")
    test_month = "2026-05"

    # Create budget of 1000
    b_res = client.post("/api/v1/budgets", json={
        "category_id": groceries_cat["id"],
        "amount": 1000.0,
        "budget_month": test_month
    }, headers=auth_headers_user1)
    assert b_res.status_code == 201

    # Duplicate budget in same month should fail
    dup_b = client.post("/api/v1/budgets", json={
        "category_id": groceries_cat["id"],
        "amount": 1200.0,
        "budget_month": test_month
    }, headers=auth_headers_user1)
    assert dup_b.status_code == 400

    # Add expense under budget (600 = 60%, within_budget)
    client.post("/api/v1/transactions", json={
        "title": "Groceries part 1",
        "amount": 600.0,
        "transaction_type": "expense",
        "category_id": groceries_cat["id"],
        "transaction_date": f"{test_month}-05"
    }, headers=auth_headers_user1)

    budgets_list = client.get(f"/api/v1/budgets?month={test_month}", headers=auth_headers_user1).json()
    b_item = next(b for b in budgets_list if b["category_id"] == groceries_cat["id"])
    assert b_item["status"] == "within_budget"
    assert b_item["actual_spent"] == 600.0

    # Add expense pushing it to 850 (85%, approaching_limit)
    client.post("/api/v1/transactions", json={
        "title": "Groceries part 2",
        "amount": 250.0,
        "transaction_type": "expense",
        "category_id": groceries_cat["id"],
        "transaction_date": f"{test_month}-10"
    }, headers=auth_headers_user1)

    budgets_list2 = client.get(f"/api/v1/budgets?month={test_month}", headers=auth_headers_user1).json()
    b_item2 = next(b for b in budgets_list2 if b["category_id"] == groceries_cat["id"])
    assert b_item2["status"] == "approaching_limit"

    # Add expense pushing it to 1100 (110%, budget_exceeded)
    client.post("/api/v1/transactions", json={
        "title": "Groceries part 3",
        "amount": 250.0,
        "transaction_type": "expense",
        "category_id": groceries_cat["id"],
        "transaction_date": f"{test_month}-15"
    }, headers=auth_headers_user1)

    budgets_list3 = client.get(f"/api/v1/budgets?month={test_month}", headers=auth_headers_user1).json()
    b_item3 = next(b for b in budgets_list3 if b["category_id"] == groceries_cat["id"])
    assert b_item3["status"] == "budget_exceeded"


def test_savings_goals_and_contributions(client, auth_headers_user1):
    goal_res = client.post("/api/v1/savings/goals", json={
        "name": "Trip to Japan",
        "target_amount": 100000.0,
        "target_date": "2026-12-31"
    }, headers=auth_headers_user1)
    assert goal_res.status_code == 201
    goal_id = goal_res.json()["id"]

    # Record contribution
    contrib_res = client.post(f"/api/v1/savings/goals/{goal_id}/contributions", json={
        "amount": 25000.0,
        "contribution_date": "2026-03-20",
        "description": "Quarterly bonus deposit"
    }, headers=auth_headers_user1)
    assert contrib_res.status_code == 201
    assert contrib_res.json()["current_saved"] == 25000.0
    assert contrib_res.json()["progress_percentage"] == 25.0


def test_auto_categorization_and_ml(client, auth_headers_user1):
    # Test Swiggy
    res_swiggy = client.post("/api/v1/categories/categorize", json={
        "title": "Swiggy order biryani delivery"
    }, headers=auth_headers_user1)
    assert res_swiggy.status_code == 200
    assert res_swiggy.json()["category_name"] == "Food"

    # Test Uber
    res_uber = client.post("/api/v1/categories/categorize", json={
        "title": "Uber ride to terminal"
    }, headers=auth_headers_user1)
    assert res_uber.status_code == 200
    assert res_uber.json()["category_name"] == "Transportation"


def test_forecasting_handling(client, auth_headers_user2):
    # User 2 has no transactions yet, forecasting should gracefully return insufficient data
    fc_res = client.get("/api/v1/forecast/monthly-expenses", headers=auth_headers_user2)
    assert fc_res.status_code == 200
    assert fc_res.json()["has_sufficient_data"] is False
    assert "Not enough transaction history" in fc_res.json()["explanation"]
