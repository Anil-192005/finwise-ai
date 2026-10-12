export interface User {
  id: number;
  full_name: string;
  email: string;
  preferred_currency: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  transaction_type: 'income' | 'expense';
  is_system_category: boolean;
  user_id?: number | null;
}

export interface Transaction {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  amount: number;
  transaction_type: 'income' | 'expense';
  category_id: number;
  category_name?: string | null;
  transaction_date: string;
  payment_method: string;
  tags?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id?: number | null;
  category_name?: string | null;
  amount: number;
  budget_month: string;
  actual_spent: number;
  remaining_budget: number;
  utilization_percentage: number;
  status: 'within_budget' | 'approaching_limit' | 'budget_exceeded';
  created_at: string;
}

export interface SavingsContribution {
  id: number;
  goal_id: number;
  amount: number;
  contribution_date: string;
  description?: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  target_date?: string | null;
  status: 'active' | 'completed' | 'paused';
  current_saved: number;
  remaining_target: number;
  progress_percentage: number;
  estimated_completion_date?: string | null;
  contributions: SavingsContribution[];
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  category_id: number;
  category_name?: string | null;
  transaction_type: 'income' | 'expense';
  recurrence_frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  next_scheduled_date: string;
  is_active: boolean;
  created_at: string;
}

export interface UserPreference {
  id: number;
  user_id: number;
  preferred_currency: string;
  budget_warning_threshold: number;
  notification_preferences: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  remaining_balance: number;
  total_savings: number;
  budget_utilization: number;
  savings_rate: number;
  preferred_currency: string;
  selected_month: string;
  total_budget: number;
}

export interface IncomeExpenseTrend {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface InsightItem {
  type: 'trend' | 'unusual' | 'recommendation' | 'opportunity' | 'summary';
  title: string;
  description: string;
  badge: string;
  impact_level: 'info' | 'warning' | 'positive';
}

export interface InsightsResponse {
  selected_month: string;
  monthly_summary: string;
  insights: InsightItem[];
  generated_at: string;
}

export interface QuestionResponse {
  question: string;
  answer: string;
  data_points: Record<string, any>;
}

export interface ForecastPoint {
  month: string;
  actual?: number | null;
  forecast?: number | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

export interface MonthlyForecastResponse {
  has_sufficient_data: boolean;
  data_points_count: number;
  forecasted_next_month?: number | null;
  lower_bound?: number | null;
  upper_bound?: number | null;
  confidence_score?: number | null;
  method: string;
  explanation: string;
  history: ForecastPoint[];
  budget_comparison?: {
    total_budget: number;
    forecasted_amount: number;
    projected_utilization: number;
    projected_over_budget: boolean;
    projected_variance: number;
  } | null;
}

export interface CategoryForecastItem {
  category_name: string;
  historical_average: number;
  forecasted_amount: number;
  current_budget?: number | null;
  projected_utilization?: number | null;
  risk_level: 'low' | 'moderate' | 'high';
}

export interface CategoryForecastResponse {
  has_sufficient_data: boolean;
  categories: CategoryForecastItem[];
  message: string;
}
