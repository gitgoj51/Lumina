import { Product, Sale, Expense } from '../types';

/**
 * Standard RFC-4180 compliant CSV Parser written in TypeScript
 * Handles quotes, commas, escapes, and blank lines perfectly.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [''];
  let isInsideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (isInsideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // Skip next quote
        } else {
          isInsideQuote = false; // Quote closed
        }
      } else {
        row[row.length - 1] += char;
      }
    } else {
      if (char === '"') {
        isInsideQuote = true;
      } else if (char === ',') {
        row.push('');
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip LF
        }
        if (row.length > 1 || row[0] !== '') {
          result.push(row);
        }
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
  }

  if (row.length > 1 || row[0] !== '') {
    result.push(row);
  }

  return result.filter(r => r.some(cell => cell.trim().length > 0));
}

/**
 * Parses and maps CSV matrix into structured Product objects
 */
export function csvToProducts(csvText: string): Product[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  const list: Product[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item: any = {};
    
    headers.forEach((header, idx) => {
      const val = row[idx] ? row[idx].trim() : '';
      if (header === 'productid' || header === 'id') {
        item.product_id = parseInt(val) || 0;
      } else if (header === 'productname' || header === 'name') {
        item.product_name = val || `Product ${i}`;
      } else if (header === 'category') {
        item.category = val || 'Uncategorized';
      } else if (header === 'currentstock' || header === 'stock') {
        item.current_stock = parseInt(val) || 0;
      } else if (header === 'reorderpoint' || header === 'reorder') {
        item.reorder_point = parseInt(val) || 0;
      } else if (header === 'supplier') {
        item.supplier = val || 'Default Supplier';
      } else if (header === 'leadtimedays' || header === 'leadtime') {
        item.lead_time_days = parseInt(val) || 5;
      }
    });

    // Fill defaults if some columns missing
    if (item.product_id === undefined) item.product_id = 200 + i;
    if (item.product_name === undefined) item.product_name = `Product ${i}`;
    if (item.category === undefined) item.category = 'Hardware';
    if (item.current_stock === undefined) item.current_stock = 0;
    if (item.reorder_point === undefined) item.reorder_point = 0;
    if (item.supplier === undefined) item.supplier = 'Unknown';
    if (item.lead_time_days === undefined) item.lead_time_days = 5;

    list.push(item as Product);
  }

  return list;
}

/**
 * Parses and maps CSV matrix into structured Sales objects
 */
export function csvToSales(csvText: string): Sale[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  const list: Sale[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item: any = {};
    
    headers.forEach((header, idx) => {
      const val = row[idx] ? row[idx].trim() : '';
      if (header === 'date') {
        item.date = val;
      } else if (header === 'orderid' || header === 'id') {
        item.order_id = parseInt(val) || 0;
      } else if (header === 'productid') {
        item.product_id = parseInt(val) || 0;
      } else if (header === 'category') {
        item.category = val || 'Hardware';
      } else if (header === 'unitssold' || header === 'quantity' || header === 'qty') {
        item.units_sold = parseInt(val) || 0;
      } else if (header === 'unitprice' || header === 'price') {
        item.unit_price = parseFloat(val) || 0.0;
      } else if (header === 'unitcost' || header === 'cost') {
        item.unit_cost = parseFloat(val) || 0.0;
      } else if (header === 'discount') {
        item.discount = parseFloat(val) || 0.0;
      } else if (header === 'channel') {
        item.channel = (val.toLowerCase() === 'online') ? 'Online' : 'In-Store';
      }
    });

    // Sanitize and date validate
    if (!item.date || isNaN(Date.parse(item.date))) {
      // Pick dynamic recent date if missing
      const d = new Date();
      d.setDate(d.getDate() - (i % 90));
      item.date = d.toISOString().split('T')[0];
    }
    if (item.order_id === undefined) item.order_id = 5000 + i;
    if (item.product_id === undefined) item.product_id = 101;
    if (item.category === undefined) item.category = 'Hardware';
    if (item.units_sold === undefined) item.units_sold = 1;
    if (item.unit_price === undefined) item.unit_price = 10.0;
    if (item.unit_cost === undefined) item.unit_cost = 5.0;
    if (item.discount === undefined) item.discount = 0;
    if (item.channel === undefined) item.channel = 'In-Store';

    list.push(item as Sale);
  }

  return list;
}

/**
 * Parses and maps CSV matrix into structured Expense objects
 */
export function csvToExpenses(csvText: string): Expense[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  const list: Expense[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const item: any = {};
    
    headers.forEach((header, idx) => {
      const val = row[idx] ? row[idx].trim() : '';
      if (header === 'date') {
        item.date = val;
      } else if (header === 'expensetype' || header === 'type' || header === 'category') {
        item.expense_type = val || 'Operating';
      } else if (header === 'amount') {
        item.amount = parseFloat(val) || 0.0;
      } else if (header === 'notes' || header === 'description') {
        item.notes = val || '';
      }
    });

    if (!item.date || isNaN(Date.parse(item.date))) {
      item.date = new Date().toISOString().split('T')[0];
    }
    if (item.expense_type === undefined) item.expense_type = 'Utilities';
    if (item.amount === undefined) item.amount = 0.0;
    if (item.notes === undefined) item.notes = '';

    list.push(item as Expense);
  }

  return list;
}

/**
 * Helper to serialize objects array to structured CSV file text
 */
export function arrayToCSV(arr: any[]): string {
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]);
  
  const csvRows = [
    headers.join(','),
    ...arr.map(row => 
      headers.map(header => {
        let val = row[header];
        if (val === undefined || val === null) {
          return '';
        }
        val = String(val);
        // Escape quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Downloads a text string as a standard browser file
 */
export function triggerFileDownload(content: string, filename: string, type: string = 'text/csv') {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
