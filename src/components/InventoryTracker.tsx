import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Truck, 
  RotateCcw, 
  ArrowRight,
  TrendingDown,
  ChevronRight,
  Search,
  Plus,
  Minus
} from 'lucide-react';
import { Product, Sale, InventoryAnalysis } from '../types';
import { analyzeInventory } from '../utils/math';

interface InventoryTrackerProps {
  sales: Sale[];
  products: Product[];
  onUpdateProducts: (newProducts: Product[]) => void;
}

export default function InventoryTracker({ sales, products, onUpdateProducts }: InventoryTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Compute stock levels dynamically
  const inventoryData = useMemo(() => {
    return analyzeInventory(sales, products);
  }, [sales, products]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // Run searches and filters
  const filteredInventory = useMemo(() => {
    return inventoryData.filter(item => {
      const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            String(item.product_id).includes(searchTerm);
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesCritical = !showCriticalOnly || item.reorder_required;
      
      return matchesSearch && matchesCategory && matchesCritical;
    });
  }, [inventoryData, searchTerm, categoryFilter, showCriticalOnly]);

  // Inventory KPI aggregators
  const kpis = useMemo(() => {
    const totalItems = products.length;
    const criticalProductsCount = inventoryData.filter(i => i.reorder_required).length;
    const stockoutCount = products.filter(p => p.current_stock === 0).length;
    const pendingOrdersVal = inventoryData
      .filter(i => i.reorder_required)
      .reduce((sum, item) => sum + item.recommended_reorder_qty, 0);

    return {
      totalItems,
      criticalProductsCount,
      stockoutCount,
      pendingOrdersVal
    };
  }, [inventoryData, products]);

  // Handle local inventory restock click
  const adjustStock = (productId: number, delta: number) => {
    const updated = products.map(p => {
      if (p.product_id === productId) {
        return {
          ...p,
          current_stock: Math.max(0, p.current_stock + delta)
        };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  const formatNumber = (num: number) => {
    return parseFloat(num.toFixed(2));
  };

  return (
    <div className="space-y-6">
      {/* Tracker Header */}
      <div className="bg-[#E4E3E0] p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#141414]">Inventory Status & Velocity Analytics</h2>
          <p className="text-[10px] text-slate-600 font-mono">Dynamic sales-velocity metrics synchronized locally in real-time</p>
        </div>
        
        {/* Simple quick stats badge */}
        {kpis.criticalProductsCount > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-bold px-3 py-1 bg-red-100 text-red-800 rounded-none animate-pulse font-mono border border-[#141414] shadow-[2px_2px_0px_#141414]">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>CRITICAL REQUIRED: {kpis.criticalProductsCount} STOCKS LOW</span>
          </div>
        )}
      </div>

      {/* Inventory KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total SKU Count */}
        <div className="bg-white p-4 rounded-none border border-[#141414] flex items-center justify-between shadow-[4px_4px_0px_#141414]">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider">Tracked SKU Codes</span>
            <h3 className="text-xl font-mono font-black text-[#141414]">{kpis.totalItems} Items</h3>
          </div>
          <span className="p-2 bg-neutral-100 border border-[#141414] text-slate-800">
            <Boxes className="w-4 h-4" />
          </span>
        </div>

        {/* KPI: Critical Stock Reorders */}
        <div className={`p-4 rounded-none border flex items-center justify-between transition-all shadow-[4px_4px_0px_#141414] ${
          kpis.criticalProductsCount > 0 ? 'bg-amber-100 border-[#141414]' : 'bg-white border-[#141414]'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider">Reorder Level Alerts</span>
            <h3 className={`text-xl font-mono font-black ${kpis.criticalProductsCount > 0 ? 'text-amber-800' : 'text-[#141414]'}`}>
              {kpis.criticalProductsCount} Alerts
            </h3>
          </div>
          <span className={`p-2 border border-[#141414] ${kpis.criticalProductsCount > 0 ? 'bg-white text-amber-700' : 'bg-neutral-100 text-slate-800'}`}>
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>

        {/* KPI: Empty Stocks */}
        <div className={`p-4 rounded-none border flex items-center justify-between transition-all shadow-[4px_4px_0px_#141414] ${
          kpis.stockoutCount > 0 ? 'bg-red-50 border-[#141414]' : 'bg-white border-[#141414]'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider">Empty Stockouts</span>
            <h3 className={`text-xl font-mono font-black ${kpis.stockoutCount > 0 ? 'text-red-700 font-extrabold' : 'text-[#141414]'}`}>
              {kpis.stockoutCount} SKUs
            </h3>
          </div>
          <span className={`p-2 border border-[#141414] ${kpis.stockoutCount > 0 ? 'bg-white text-red-700' : 'bg-neutral-100 text-slate-800'}`}>
            <ShieldAlert className="w-4 h-4" />
          </span>
        </div>

        {/* KPI: Suggested Orders Pool */}
        <div className="bg-white p-4 rounded-none border border-[#141414] flex items-center justify-between shadow-[4px_4px_0px_#141414]">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase font-mono tracking-wider">Suggested Restock</span>
            <h3 className="text-xl font-mono font-black text-[#141414]">{kpis.pendingOrdersVal} units</h3>
          </div>
          <span className="p-2 bg-neutral-100 border border-[#141414] text-[#141414]">
            <Truck className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Control and filter board */}
      <div className="bg-[#E4E3E0] p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col md:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-sm font-mono text-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#141414] pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="FIND SKU BY ID OR NAME..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 font-bold rounded-none border border-[#141414] bg-white focus:outline-none text-[#141414] placeholder-slate-400 font-mono tracking-wider"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold">
          <div className="flex items-center gap-2">
            <span className="text-slate-700">DEPT:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-[#141414] rounded-none py-1.5 px-3 bg-white focus:outline-none text-[#141414] font-mono"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 select-none cursor-pointer border border-[#141414] px-3 py-1.5 bg-white text-xs">
            <input
              type="checkbox"
              checked={showCriticalOnly}
              onChange={(e) => setShowCriticalOnly(e.target.checked)}
              className="rounded-none text-[#141414] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 border-2 border-[#141414]"
            />
            <span className="text-red-700">LOW_STOCK_ONLY</span>
          </label>
        </div>
      </div>

      {/* Inventory item grid/cards table */}
      <div className="bg-white border border-[#141414] rounded-none shadow-[4px_4px_0px_#141414] overflow-hidden">
        <div className="overflow-x-auto">
          {filteredInventory.length > 0 ? (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] text-[9px] font-bold uppercase tracking-wider font-mono border-b border-[#141414]">
                  <th className="p-3 font-serif italic px-4">Name Segment</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-center">Remaining Stock</th>
                  <th className="p-3 text-center">Reorder Threshold</th>
                  <th className="p-3 text-right">Lead Time</th>
                  <th className="p-3 text-right">Daily Velocity</th>
                  <th className="p-3 text-right">Est. Days Left</th>
                  <th className="p-3 text-center">Recommendation</th>
                  <th className="p-3 text-center">In-App Stock Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10 text-[11px] text-[#141414]">
                {filteredInventory.map((item, idx) => {
                  // Determine status category
                  let statusText = "IN_STOCK";
                  let badgeColors = "bg-green-50 text-green-800 border-green-600";
                  if (item.current_stock === 0) {
                    statusText = "STOCKOUT_ALERT";
                    badgeColors = "bg-red-50 text-red-800 border-red-600 animate-pulse font-bold";
                  } else if (item.reorder_required) {
                    statusText = "REORDER_ALERT";
                    badgeColors = "bg-amber-50 text-amber-800 border-amber-600 font-semibold";
                  } else if (item.days_of_stock_left < 10) {
                    statusText = "RUNNING_LOW";
                    badgeColors = "bg-rose-50 text-rose-800 border-rose-600 font-semibold";
                  }

                  return (
                    <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                      {/* Name & ID */}
                      <td className="p-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#141414]">{item.product_name}</p>
                          <p className="text-[9px] text-slate-500">ID: PRD-{item.product_id}</p>
                        </div>
                      </td>

                      {/* Department category */}
                      <td className="p-3 text-slate-500 font-bold uppercase">
                        {item.category}
                      </td>

                      {/* Stock units */}
                      <td className="p-3 text-center font-bold font-mono">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs">{item.current_stock} units</span>
                          <span className={`text-[8px] px-1 py-0.5 border ${badgeColors}`}>
                            {statusText}
                          </span>
                        </div>
                      </td>

                      {/* Reorder point */}
                      <td className="p-3 text-center text-[#141414] font-bold font-mono">
                        {item.reorder_point} LMT
                      </td>

                      {/* Lead times */}
                      <td className="p-3 text-right">
                        <span className="font-bold">{item.lead_time_days}</span> days
                      </td>

                      {/* Daily Sales velocity (units/day) */}
                      <td className="p-3 text-right font-mono text-slate-600">
                        {item.daily_velocity > 0 ? (
                          <span className="font-bold text-[#141414]">{item.daily_velocity} /day</span>
                        ) : (
                          <span className="text-slate-400">0.0 /day</span>
                        )}
                      </td>

                      {/* Days of stock left */}
                      <td className={`p-3 text-right font-bold ${
                        item.days_of_stock_left < 7 ? 'text-red-600 font-extrabold' : 'text-[#141414]'
                      }`}>
                        {item.days_of_stock_left === 999 ? (
                          <span className="text-slate-400">999+ DAYS</span>
                        ) : (
                          <span>{item.days_of_stock_left} DAYS</span>
                        )}
                      </td>

                      {/* Reorder recommendation status */}
                      <td className="p-3">
                        <div className="flex flex-col items-center justify-center space-y-0.5 text-center">
                          {item.reorder_required ? (
                            <>
                              <span className="inline-flex items-center gap-0.5 py-0.5 px-2 bg-indigo-50 border border-indigo-600 text-indigo-800 font-bold text-[9px]">
                                ADD {item.recommended_reorder_qty} UNITS
                              </span>
                              <span className="text-[8px] uppercase tracking-wider text-slate-500 mt-1">{item.supplier}</span>
                            </>
                          ) : (
                            <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">Stock Healthy</span>
                          )}
                        </div>
                      </td>

                      {/* Controls increment decrement */}
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5 select-none">
                          <button
                            onClick={() => adjustStock(item.product_id, -1)}
                            className="p-1 border border-[#141414] bg-white text-[#141414] hover:bg-neutral-100 transition-colors"
                            title="Decrement stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={() => adjustStock(item.product_id, 1)}
                            className="p-1 border border-[#141414] bg-white text-[#141414] hover:bg-neutral-100 transition-colors"
                            title="Increment stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => adjustStock(item.product_id, item.reorder_point*2 || 25)}
                            className="px-2 py-1 text-[8px] font-black uppercase bg-[#141414] text-[#E4E3E0] hover:bg-neutral-800 transition-colors"
                            title="Order supplier batch"
                          >
                            FILL
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center bg-neutral-50 rounded-none border-t border-[#141414] font-mono text-[10px] uppercase">
              <Boxes className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-[#141414] font-bold">No inventory items match active filter conditions</p>
              <p className="text-slate-500 text-[9px] mt-1">Refine your search term or load default database configuration</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
