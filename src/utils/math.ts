import { 
  Sale, 
  Expense, 
  PNLSummary, 
  CategoryRevenue, 
  DailyTrendElement, 
  ForecastPoint, 
  Product, 
  InventoryAnalysis 
} from '../types';

/**
 * Calculates a complete P&L financial summary from raw lists of sales and expenses.
 */
export function calculateFinancials(sales: Sale[], expenses: Expense[]): PNLSummary {
  let gross_revenue = 0;
  let discounts = 0;
  let net_revenue = 0;
  let cogs = 0;
  let operating_expenses = 0;

  sales.forEach(sale => {
    const gross = sale.units_sold * sale.unit_price;
    const net = gross - sale.discount;
    const cost = sale.units_sold * sale.unit_cost;

    gross_revenue += gross;
    discounts += sale.discount;
    net_revenue += net;
    cogs += cost;
  });

  expenses.forEach(exp => {
    operating_expenses += exp.amount;
  });

  const gross_profit = net_revenue - cogs;
  const net_profit = gross_profit - operating_expenses;

  const gross_margin_pct = net_revenue > 0 ? gross_profit / net_revenue : 0;
  const net_margin_pct = net_revenue > 0 ? net_profit / net_revenue : 0;

  return {
    gross_revenue,
    discounts,
    net_revenue,
    cogs,
    gross_profit,
    gross_margin_pct,
    operating_expenses,
    net_profit,
    net_margin_pct
  };
}

/**
 * Groups net revenue, gross revenue, and units sold by category.
 */
export function getCategoryRevenue(sales: Sale[]): CategoryRevenue[] {
  const categories: { [key: string]: { net: number; gross: number; units: number } } = {};

  sales.forEach(sale => {
    const cat = sale.category || 'Uncategorized';
    const gross = sale.units_sold * sale.unit_price;
    const net = gross - sale.discount;
    
    if (!categories[cat]) {
      categories[cat] = { net: 0, gross: 0, units: 0 };
    }
    categories[cat].net += net;
    categories[cat].gross += gross;
    categories[cat].units += sale.units_sold;
  });

  return Object.keys(categories).map(catName => ({
    category: catName,
    net_revenue: parseFloat(categories[catName].net.toFixed(2)),
    gross_revenue: parseFloat(categories[catName].gross.toFixed(2)),
    units_sold: categories[catName].units
  })).sort((a, b) => b.net_revenue - a.net_revenue);
}

/**
 * Aggregates sales into daily trend timestamps.
 */
export function getDailyTrends(sales: Sale[]): DailyTrendElement[] {
  const dailyMap: { [date: string]: { rev: number; units: number } } = {};

  sales.forEach(sale => {
    const dateStr = sale.date;
    const gross = sale.units_sold * sale.unit_price;
    const net = gross - sale.discount;

    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { rev: 0, units: 0 };
    }
    dailyMap[dateStr].rev += net;
    dailyMap[dateStr].units += sale.units_sold;
  });

  // Sort chronologically
  return Object.keys(dailyMap)
    .map(date => ({
      date,
      net_revenue: parseFloat(dailyMap[date].rev.toFixed(2)),
      units_sold: dailyMap[date].units
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Holt-Winters additive triple exponential smoothing (with fallback)
 * For retail, seasonality of 7 days handles regular weekly trends beautifully.
 */
export function runHoltWinters(
  dailyTrends: DailyTrendElement[],
  forecastDays: number = 30,
  alpha: number = 0.2, // level smoothing
  beta: number = 0.1,  // trend smoothing
  gamma: number = 0.3  // seasonal smoothing
): ForecastPoint[] {
  const result: ForecastPoint[] = [];
  
  // Format history as map and array
  if (dailyTrends.length === 0) {
    return [];
  }

  const series = dailyTrends.map(d => d.net_revenue);
  const dates = dailyTrends.map(d => d.date);

  // Pad existing historical values to the output
  dailyTrends.forEach(d => {
    result.push({
      date: d.date,
      forecast: d.net_revenue,
      lower_bound: d.net_revenue,
      upper_bound: d.net_revenue,
      isForecast: false,
      actual: d.net_revenue
    });
  });

  const lastDateStr = dates[dates.length - 1];
  const lastDate = new Date(lastDateStr + "T00:00:00");

  const seasonLength = 7;
  const n = series.length;

  // If there isn't enough historical data, fall back to Moving Average
  if (n < seasonLength * 2) {
    const avgSales = series.length > 0 ? series.reduce((sum, v) => sum + v, 0) / series.length : 100;
    const trailing7 = series.slice(-Math.min(7, series.length));
    const recentAvg = trailing7.length > 0 ? trailing7.reduce((sum, v) => sum + v, 0) / trailing7.length : avgSales;
    const stdDev = series.length > 1 
      ? Math.sqrt(series.reduce((sq, v) => sq + Math.pow(v - avgSales, 2), 0) / (series.length - 1)) 
      : recentAvg * 0.2;

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];
      
      // Gradually decay/increase confidence interval size
      const scale = Math.sqrt(i);
      const fVal = Math.max(0, recentAvg);
      
      result.push({
        date: dateStr,
        forecast: parseFloat(fVal.toFixed(2)),
        lower_bound: parseFloat(Math.max(0, fVal - 1.96 * stdDev * scale).toFixed(2)),
        upper_bound: parseFloat((fVal + 1.96 * stdDev * scale).toFixed(2)),
        isForecast: true
      });
    }
    return result;
  }

  // --- Holt-Winters Initialization ---
  let level = 0;
  for (let i = 0; i < seasonLength; i++) {
    level += series[i];
  }
  level = level / seasonLength;

  // Initial Trend
  let trend = 0;
  for (let i = 0; i < seasonLength; i++) {
    trend += (series[i + seasonLength] - series[i]) / seasonLength;
  }
  trend = trend / seasonLength;

  // Initial Seasonals
  const seasonal: number[] = [];
  const seasonAvgs: number[] = [];
  
  // We need average of first few seasons
  const numSeasons = Math.floor(n / seasonLength);
  for (let s = 0; s < numSeasons; s++) {
    let sum = 0;
    for (let i = 0; i < seasonLength; i++) {
      sum += series[s * seasonLength + i];
    }
    seasonAvgs.push(sum / seasonLength);
  }

  for (let i = 0; i < seasonLength; i++) {
    let devSum = 0;
    for (let s = 0; s < numSeasons; s++) {
      devSum += (series[s * seasonLength + i] - seasonAvgs[s]);
    }
    seasonal.push(devSum / numSeasons);
  }

  // --- Run Holt-Winters smoothing loop through historical observations ---
  const smoothedLevel: number[] = [];
  const smoothedTrend: number[] = [];
  const smoothedSeasonal = [...seasonal]; // keep updating in place

  for (let i = 0; i < n; i++) {
    const yVal = series[i];
    const sIdx = i % seasonLength;
    const oldLevel = level;

    // Smooth level
    level = alpha * (yVal - smoothedSeasonal[sIdx]) + (1 - alpha) * (level + trend);
    // Smooth trend
    trend = beta * (level - oldLevel) + (1 - beta) * trend;
    // Smooth seasonal indices
    smoothedSeasonal[sIdx] = gamma * (yVal - level) + (1 - gamma) * smoothedSeasonal[sIdx];

    smoothedLevel.push(level);
    smoothedTrend.push(trend);
  }

  // Calculate high-quality historical standard deviation of residuals for confidence bounds
  let diffSqSum = 0;
  for (let i = seasonLength; i < n; i++) {
    const sIdx = i % seasonLength;
    const fitted = smoothedLevel[i - 1] + smoothedTrend[i - 1] + smoothedSeasonal[sIdx];
    diffSqSum += Math.pow(series[i] - fitted, 2);
  }
  const stdDev = Math.sqrt(diffSqSum / (n - seasonLength));

  // --- Project future forecasts ---
  for (let m = 1; m <= forecastDays; m++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(lastDate.getDate() + m);
    const dateStr = forecastDate.toISOString().split('T')[0];

    const sIdx = (n + m - 1) % seasonLength;
    
    // Additive Holt-Winters Forecast: Level + m*Trend + Seasonal
    let fVal = level + m * trend + smoothedSeasonal[sIdx];
    fVal = Math.max(0, fVal); // Sales can't be negative

    // Confidence intervals expand with sqrt(m) to capture compounding variance
    const scale = Math.sqrt(m);
    const halfWidth = 1.96 * stdDev * scale;

    result.push({
      date: dateStr,
      forecast: parseFloat(fVal.toFixed(2)),
      lower_bound: parseFloat(Math.max(0, fVal - halfWidth).toFixed(2)),
      upper_bound: parseFloat((fVal + halfWidth).toFixed(2)),
      isForecast: true
    });
  }

  return result;
}

/**
 * Perform inventory status checks and velocity calculations
 */
export function analyzeInventory(sales: Sale[], products: Product[]): InventoryAnalysis[] {
  // If there are no sales, velocity is 0
  if (sales.length === 0) {
    return products.map(p => ({
      ...p,
      daily_velocity: 0,
      days_of_stock_left: 999,
      reorder_required: p.current_stock <= p.reorder_point,
      recommended_reorder_qty: Math.ceil(0 * p.lead_time_days * 1.5) || 25
    }));
  }

  // Core Velocity Logic: daily sales velocity per product (last 30 days)
  const maxDateStr = sales.reduce((max, s) => s.date > max ? s.date : max, sales[0].date);
  const maxDate = new Date(maxDateStr + "T00:00:00");
  const thirtyDaysAgo = new Date(maxDate);
  thirtyDaysAgo.setDate(maxDate.getDate() - 30);

  // Group by Product ID
  const salesMap: { [productId: number]: number } = {};
  
  sales.forEach(sale => {
    const sDate = new Date(sale.date + "T00:00:00");
    if (sDate >= thirtyDaysAgo) {
      if (!salesMap[sale.product_id]) {
        salesMap[sale.product_id] = 0;
      }
      salesMap[sale.product_id] += sale.units_sold;
    }
  });

  return products.map(p => {
    const recentUnits = salesMap[p.product_id] || 0;
    const daily_velocity = parseFloat((recentUnits / 30.0).toFixed(4));
    
    const days_of_stock_left = daily_velocity > 0 
      ? parseFloat((p.current_stock / daily_velocity).toFixed(1)) 
      : 999;

    const reorder_required = p.current_stock <= p.reorder_point;

    // Recommended reorder: (Velocity * Lead Time) * Safety Factor (1.5)
    // If velocity is extremely low/zero, provide a logical default based on reorder_point
    const recQty = daily_velocity > 0 
      ? Math.ceil((daily_velocity * p.lead_time_days) * 1.5)
      : Math.max(10, p.reorder_point * 2);

    return {
      product_id: p.product_id,
      product_name: p.product_name,
      category: p.category,
      current_stock: p.current_stock,
      reorder_point: p.reorder_point,
      supplier: p.supplier,
      lead_time_days: p.lead_time_days,
      daily_velocity,
      days_of_stock_left,
      reorder_required,
      recommended_reorder_qty: recQty
    };
  });
}
