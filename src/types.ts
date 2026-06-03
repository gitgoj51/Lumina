/**
 * Types defining data structures for Lumina Retail Analytics
 */

export interface Product {
  product_id: number;
  product_name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  supplier: string;
  lead_time_days: number;
}

export interface Sale {
  date: string; // YYYY-MM-DD
  order_id: number;
  product_id: number;
  category: string;
  units_sold: number;
  unit_price: number;
  unit_cost: number;
  discount: number;
  channel: 'Online' | 'In-Store';
}

export interface Expense {
  date: string; // YYYY-MM-DD
  expense_type: string; // Rent, Utilities, Marketing, Payroll, etc.
  amount: number;
  notes: string;
}

// Normalized/calculated records
export interface EnhancedSale extends Sale {
  gross_revenue: number;
  net_revenue: number;
  total_cost: number;
}

export interface PNLSummary {
  gross_revenue: number;
  discounts: number;
  net_revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  operating_expenses: number;
  net_profit: number;
  net_margin_pct: number;
}

export interface CategoryRevenue {
  category: string;
  net_revenue: number;
  gross_revenue: number;
  units_sold: number;
}

export interface DailyTrendElement {
  date: string;
  net_revenue: number;
  units_sold: number;
}

export interface ForecastPoint {
  date: string;
  forecast: number;
  lower_bound: number;
  upper_bound: number;
  isForecast: boolean;
  actual?: number;
}

export interface InventoryAnalysis {
  product_id: number;
  product_name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  supplier: string;
  lead_time_days: number;
  daily_velocity: number;
  days_of_stock_left: number;
  reorder_required: boolean;
  recommended_reorder_qty: number;
}
