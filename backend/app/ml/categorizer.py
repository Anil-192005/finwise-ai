import re
from typing import Tuple, Optional, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np

# Comprehensive keyword lookup table for quick deterministic categorization
KEYWORD_MAPPINGS = {
    "Food": [
        "swiggy", "zomato", "restaurant", "cafe", "coffee", "starbucks", "mcdonalds",
        "burger", "pizza", "dining", "lunch", "dinner", "breakfast", "barbeque",
        "dominos", "subway", "kfc", "bakery", "snack", "tea", "chai"
    ],
    "Groceries": [
        "grocery", "supermarket", "blinkit", "zepto", "instamart", "bigbasket",
        "vegetables", "fruits", "milk", "dairy", "provisions", "walmart", "dmart",
        "target", "trader joe"
    ],
    "Transportation": [
        "uber", "ola", "rapido", "metro", "bus", "train", "flight", "fuel",
        "petrol", "diesel", "gas station", "parking", "toll", "cab", "taxi",
        "auto", "railway", "irctc"
    ],
    "Housing": [
        "furniture", "maintenance", "repairs", "home loan", "mortgage", "property tax",
        "society maintenance"
    ],
    "Rent": [
        "rent", "lease", "landlord", "flat rent", "apartment rent", "house rent"
    ],
    "Utilities": [
        "electricity", "water", "gas bill", "wifi", "broadband", "mobile recharge",
        "airtel", "jio", "vi bill", "power", "utility"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "zara", "h&m", "clothing", "shoes", "electronics",
        "apparel", "retail", "mall", "purchase"
    ],
    "Education": [
        "tuition", "course", "udemy", "coursera", "college", "school fee", "university",
        "books", "stationery", "exam fee", "certification"
    ],
    "Healthcare": [
        "pharmacy", "medicine", "doctor", "hospital", "clinic", "dental", "apollo",
        "chemist", "blood test", "diagnostic", "therapy", "health insurance"
    ],
    "Entertainment": [
        "movie", "cinema", "pvr", "inox", "concert", "game", "gaming", "steam",
        "playstation", "amusement", "bowling", "event ticket"
    ],
    "Subscriptions": [
        "netflix", "spotify", "prime", "youtube premium", "disney", "hotstar",
        "icloud", "chatgpt", "github", "subscription", "apple music"
    ],
    "Travel": [
        "hotel", "airbnb", "resort", "makemytrip", "booking.com", "vacation",
        "tour", "trip", "holiday", "luggage"
    ],
    "Personal Care": [
        "salon", "spa", "haircut", "cosmetics", "grooming", "gym", "fitness",
        "cult.fit", "skincare"
    ],
    "Salary": [
        "salary", "payroll", "stipend", "bonus", "compensation", "employer"
    ],
    "Freelancing": [
        "upwork", "fiverr", "freelance", "consulting", "client payout", "invoice paid"
    ],
    "Investment Income": [
        "dividend", "interest", "capital gain", "mutual fund payout", "fixed deposit",
        "stock profit", "crypto"
    ]
}

# Labeled training corpus to train a Scikit-learn TF-IDF + MultinomialNB classifier
INITIAL_TRAINING_DATA = [
    # Food
    ("Zomato food order from pizza place", "Food"),
    ("Swiggy delivery for lunch at office", "Food"),
    ("Starbucks coffee latte with croissant", "Food"),
    ("Dinner at Barbeque Nation with family", "Food"),
    ("McDonalds burger meal drive-thru", "Food"),
    ("Chai point tea and snacks", "Food"),
    ("Domino's pizza party", "Food"),
    ("Subway sandwich combo", "Food"),
    
    # Groceries
    ("Blinkit 10 minute grocery delivery milk vegetables", "Groceries"),
    ("Zepto groceries fresh eggs and bread", "Groceries"),
    ("BigBasket weekly grocery shopping", "Groceries"),
    ("DMart monthly household provisions", "Groceries"),
    ("Fresh fruit market fruits and apples", "Groceries"),
    ("Instamart snacks butter and cheese", "Groceries"),
    
    # Transportation
    ("Uber cab ride to office tech park", "Transportation"),
    ("Ola auto ride to railway station", "Transportation"),
    ("Shell petrol pump fuel tank refill", "Transportation"),
    ("Metro rail monthly travel card recharge", "Transportation"),
    ("Fastag highway toll deduction", "Transportation"),
    ("Rapido bike taxi trip", "Transportation"),
    
    # Rent & Utilities
    ("Monthly house rent transfer to landlord", "Rent"),
    ("Apartment lease monthly payment", "Rent"),
    ("Electricity power supply monthly bill", "Utilities"),
    ("Airtel Xstream broadband internet bill", "Utilities"),
    ("Jio prepaid mobile phone recharge", "Utilities"),
    ("Piped natural gas bill payment", "Utilities"),
    
    # Shopping
    ("Amazon order wireless noise cancelling headphones", "Shopping"),
    ("Flipkart shopping sale clothes and shoes", "Shopping"),
    ("Myntra casual shirts and denim jeans", "Shopping"),
    ("Zara jacket autumn fashion haul", "Shopping"),
    ("IKEA desk lamp and room organizer", "Shopping"),
    
    # Subscriptions & Entertainment
    ("Netflix 4K ultra hd monthly plan", "Subscriptions"),
    ("Spotify premium individual music plan", "Subscriptions"),
    ("ChatGPT Plus OpenAI subscription", "Subscriptions"),
    ("YouTube Premium family subscription", "Subscriptions"),
    ("PVR Cinemas movie tickets for two with popcorn", "Entertainment"),
    ("Steam summer sale video games purchase", "Entertainment"),
    
    # Education
    ("Udemy fullstack python web development course", "Education"),
    ("Coursera deep learning specialization", "Education"),
    ("University semester tuition exam fees", "Education"),
    ("Textbooks and reference engineering manuals", "Education"),
    
    # Healthcare
    ("Apollo pharmacy prescription medicines", "Healthcare"),
    ("Consultation fee for specialist physician clinic", "Healthcare"),
    ("Dental cleaning and root canal procedure", "Healthcare"),
    ("Diagnostic lab full body health checkup", "Healthcare"),
    
    # Income
    ("Monthly salary credit from employer payroll", "Salary"),
    ("Company performance bonus quarterly", "Salary"),
    ("Upwork freelance client payment for software design", "Freelancing"),
    ("Freelance web development milestone payout", "Freelancing"),
    ("Bank savings account interest credit quarterly", "Investment Income"),
    ("Stock dividend payout deposited to account", "Investment Income"),
]

class ExpenseCategorizer:
    def __init__(self):
        self.model = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, stop_words="english")),
            ("clf", MultinomialNB(alpha=0.1))
        ])
        self.is_trained = False
        self._train_initial_model()

    def _train_initial_model(self):
        X = [item[0] for item in INITIAL_TRAINING_DATA]
        y = [item[1] for item in INITIAL_TRAINING_DATA]
        self.model.fit(X, y)
        self.is_trained = True

    def predict(self, text: str) -> Tuple[str, float, str]:
        """
        Returns: (predicted_category, confidence_score, method)
        """
        cleaned = text.strip().lower()
        if not cleaned:
            return ("Other Expenses", 0.0, "fallback")

        # 1. High-precision rule-based keyword match
        for category, keywords in KEYWORD_MAPPINGS.items():
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', cleaned):
                    return (category, 0.95, "keyword")

        # 2. Machine Learning TF-IDF Classifier
        if self.is_trained:
            try:
                probs = self.model.predict_proba([cleaned])[0]
                classes = self.model.classes_
                max_idx = np.argmax(probs)
                best_class = classes[max_idx]
                confidence = float(probs[max_idx])

                if confidence >= 0.40:
                    return (best_class, round(confidence, 2), "ml_classifier")
            except Exception:
                pass

        return ("Other Expenses", 0.30, "fallback")

categorizer = ExpenseCategorizer()
