import { Product, Sale, Expense } from '../types';

/**
 * Generates standard initial sample products exactly like the Python mock generator.
 */
export function generateSampleProducts(): Product[] {
  return [
    {
      product_id: 101,
      product_name: 'Widget A',
      category: 'Electronics',
      current_stock: 50,
      reorder_point: 20,
      supplier: 'Alpha Inc',
      lead_time_days: 5
    },
    {
      product_id: 102,
      product_name: 'Gadget B',
      category: 'Electronics',
      current_stock: 5,
      reorder_point: 15,
      supplier: 'Beta Corp',
      lead_time_days: 10
    },
    {
      product_id: 103,
      product_name: 'Tool C',
      category: 'Hardware',
      current_stock: 100,
      reorder_point: 30,
      supplier: 'Alpha Inc',
      lead_time_days: 3
    },
    {
      product_id: 104,
      product_name: 'Device D',
      category: 'Hardware',
      current_stock: 12,
      reorder_point: 20,
      supplier: 'Gamma Ltd',
      lead_time_days: 7
    },
    {
      product_id: 105,
      product_name: 'Component E',
      category: 'Electronics',
      current_stock: 75,
      reorder_point: 40,
      supplier: 'Delta Tech',
      lead_time_days: 14
    },
    {
      product_id: 106,
      product_name: 'Plumbing F',
      category: 'Hardware',
      current_stock: 8,
      reorder_point: 12,
      supplier: 'Omega Utilities',
      lead_time_days: 4
    }
  ];
}

/**
 * Generates 90 days of synthetic historical sales transactions with organic seasonal patterns.
 */
export function generateSampleSales(): Sale[] {
  const sales: Sale[] = [];
  const startDaysAgo = 90;
  const products = generateSampleProducts();

  // Create transactions day by day
  for (let i = startDaysAgo; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat

    // Organic weekend rush multiplier
    const transactionCount = Math.floor(Math.random() * 3) + ((dayOfWeek === 0 || dayOfWeek === 6) ? 3 : 1);

    for (let t = 0; t < transactionCount; t++) {
      const p = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 8) + 1; // 1 to 8 units
      
      const price = p.product_id === 101 ? 120.0 
                  : p.product_id === 102 ? 150.0 
                  : p.product_id === 103 ? 45.0 
                  : p.product_id === 104 ? 85.0 
                  : p.product_id === 105 ? 60.0
                  : 32.0;

      const cost = price * 0.6; // 40% margin
      
      // 15% chance of holiday/clearance discount
      const discount = Math.random() > 0.85 ? parseFloat((qty * (price * 0.1)).toFixed(2)) : 0;
      
      sales.push({
        date: dateStr,
        order_id: 40000 + Math.floor(Math.random() * 9000),
        product_id: p.product_id,
        category: p.category,
        units_sold: qty,
        unit_price: price,
        unit_cost: cost,
        discount: discount,
        channel: Math.random() > 0.4 ? 'Online' : 'In-Store'
      });
    }
  }

  // Ensure items are sorted chronologically
  return sales.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generates monthly operating expenses matching the user's template data.
 */
export function generateSampleExpenses(): Expense[] {
  const expenses: Expense[] = [];
  const startDaysAgo = 120; // Generate up to 4 months of monthly operating costs
  
  // Backdate month boundaries
  const now = new Date();
  
  for (let m = 4; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const dateStr = d.toISOString().split('T')[0];

    expenses.push(
      {
        date: dateStr,
        expense_type: 'Rent',
        amount: 2200.00,
        notes: 'Warehouse & physical storefront lease payment'
      },
      {
        date: dateStr,
        expense_type: 'Utilities',
        amount: 450.00,
        notes: 'Electric, gas, sewage and broadband'
      },
      {
        date: dateStr,
        expense_type: 'Marketing',
        amount: 600.00,
        notes: 'Online search ads & printed neighborhood mailers'
      },
      {
        date: dateStr,
        expense_type: 'Payroll',
        amount: 3500.00,
        notes: 'Biweekly store associate & supervisor compensation'
      }
    );
  }

  return expenses;
}
