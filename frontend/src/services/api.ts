import {
  AuthResponse,
  Category,
  Transaction,
  TransactionListResponse,
  Budget,
  SavingsGoal,
  RecurringTransaction,
  UserPreference,
  DashboardSummary,
  IncomeExpenseTrend,
  CategoryBreakdown,
  InsightsResponse,
  QuestionResponse,
  MonthlyForecastResponse,
  CategoryForecastResponse,
  User
} from '../types';

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('finwise_token');
  }

  public setToken(token: string | null) {
    if (token) {
      localStorage.setItem('finwise_token', token);
    } else {
      localStorage.removeItem('finwise_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null as unknown as T;
    }

    if (!response.ok) {
      let errorMessage = 'An unexpected error occurred';
      try {
        const errorData = await response.json();
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((d: any) => d.msg).join(', ');
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth
  async login(data: any): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(data: any): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async changePassword(data: any): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardSummary(month?: string): Promise<DashboardSummary> {
    const query = month ? `?month=${month}` : '';
    return this.request<DashboardSummary>(`/dashboard/summary${query}`);
  }

  async getIncomeExpenseTrends(view: 'monthly' | 'yearly' = 'monthly', monthsCount: number = 6): Promise<IncomeExpenseTrend[]> {
    return this.request<IncomeExpenseTrend[]>(`/dashboard/income-expenses?view=${view}&months_count=${monthsCount}`);
  }

  async getCategoryBreakdown(month?: string, type: 'expense' | 'income' = 'expense'): Promise<CategoryBreakdown[]> {
    const query = month ? `?month=${month}&transaction_type=${type}` : `?transaction_type=${type}`;
    return this.request<CategoryBreakdown[]>(`/dashboard/category-breakdown${query}`);
  }

  async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/dashboard/recent-transactions?limit=${limit}`);
  }

  // Transactions
  async getTransactions(params: Record<string, any> = {}): Promise<TransactionListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return this.request<TransactionListResponse>(`/transactions?${query.toString()}`);
  }

  async createTransaction(data: any): Promise<Transaction> {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTransaction(id: number): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`);
  }

  async updateTransaction(id: number, data: any): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: number): Promise<void> {
    return this.request<void>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  getExportTransactionsUrl(params: Record<string, any> = {}): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return `${API_BASE_URL}/transactions/export?${query.toString()}`;
  }

  // Categories
  async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    const query = type ? `?transaction_type=${type}` : '';
    return this.request<Category[]>(`/categories${query}`);
  }

  async createCategory(data: { name: string; transaction_type: 'income' | 'expense' }): Promise<Category> {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    return this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async autoCategorize(title: string, description?: string): Promise<{
    category_id?: number | null;
    category_name: string;
    confidence_score: number;
    method: string;
    needs_confirmation: boolean;
  }> {
    return this.request('/categories/categorize', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  // Budgets
  async getBudgets(month?: string): Promise<Budget[]> {
    const query = month ? `?month=${month}` : '';
    return this.request<Budget[]>(`/budgets${query}`);
  }

  async createBudget(data: { category_id?: number | null; amount: number; budget_month: string }): Promise<Budget> {
    return this.request<Budget>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: number, amount: number): Promise<Budget> {
    return this.request<Budget>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });
  }

  async deleteBudget(id: number): Promise<void> {
    return this.request<void>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Savings Goals
  async getSavingsGoals(): Promise<SavingsGoal[]> {
    return this.request<SavingsGoal[]>('/savings/goals');
  }

  async createSavingsGoal(data: { name: string; target_amount: number; target_date?: string | null }): Promise<SavingsGoal> {
    return this.request<SavingsGoal>('/savings/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSavingsGoal(id: number, data: any): Promise<SavingsGoal> {
    return this.request<SavingsGoal>(`/savings/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSavingsGoal(id: number): Promise<void> {
    return this.request<void>(`/savings/goals/${id}`, {
      method: 'DELETE',
    });
  }

  async addSavingsContribution(goalId: number, data: { amount: number; contribution_date: string; description?: string }): Promise<SavingsGoal> {
    return this.request<SavingsGoal>(`/savings/goals/${goalId}/contributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Recurring Transactions
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    return this.request<RecurringTransaction[]>('/recurring-transactions');
  }

  async createRecurringTransaction(data: any): Promise<RecurringTransaction> {
    return this.request<RecurringTransaction>('/recurring-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecurringTransaction(id: number, data: any): Promise<RecurringTransaction> {
    return this.request<RecurringTransaction>(`/recurring-transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecurringTransaction(id: number): Promise<void> {
    return this.request<void>(`/recurring-transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async processRecurringTransaction(id: number): Promise<Transaction> {
    return this.request<Transaction>(`/recurring-transactions/${id}/process`, {
      method: 'POST',
    });
  }

  // Insights
  async getInsights(month?: string): Promise<InsightsResponse> {
    const query = month ? `?month=${month}` : '';
    return this.request<InsightsResponse>(`/insights${query}`);
  }

  async askFinancialQuestion(question: string, month?: string): Promise<QuestionResponse> {
    return this.request<QuestionResponse>('/insights/ask', {
      method: 'POST',
      body: JSON.stringify({ question, month }),
    });
  }

  // Forecasting
  async getMonthlyForecast(): Promise<MonthlyForecastResponse> {
    return this.request<MonthlyForecastResponse>('/forecast/monthly-expenses');
  }

  async getCategoryForecast(month?: string): Promise<CategoryForecastResponse> {
    const query = month ? `?month=${month}` : '';
    return this.request<CategoryForecastResponse>(`/forecast/category-expenses${query}`);
  }

  // Reports
  async getMonthlyReport(month?: string): Promise<any> {
    const query = month ? `?month=${month}` : '';
    return this.request<any>(`/reports/monthly${query}`);
  }

  async getYearlyReport(year?: number): Promise<any> {
    const query = year ? `?year=${year}` : '';
    return this.request<any>(`/reports/yearly${query}`);
  }

  async getCategoryReport(startDate?: string, endDate?: string): Promise<any> {
    const query = new URLSearchParams();
    if (startDate) query.append('start_date', startDate);
    if (endDate) query.append('end_date', endDate);
    return this.request<any>(`/reports/category?${query.toString()}`);
  }

  // Preferences
  async getPreferences(): Promise<UserPreference> {
    return this.request<UserPreference>('/preferences');
  }

  async updatePreferences(data: Partial<UserPreference>): Promise<UserPreference> {
    return this.request<UserPreference>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/preferences/account', {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
