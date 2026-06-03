import React, { useState } from 'react';
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  Legend
} from 'recharts';
import { Product, Sale, Expense, PNLSummary, CategoryRevenue, DailyTrendElement } from '../types';
import { calculateFinancials, getCategoryRevenue, getDailyTrends } from '../utils/math';

interface FinanceDashboardProps {
  sales: Sale[];
  expenses: Expense[];
}

export default function FinanceDashboard({ sales, expenses }: FinanceDashboardProps) {
  const [timeWindow, setTimeWindow] = useState<30 | 60 | 90>(90);

  // Filter sales and expenses based on selected time window
  const getFilteredData = () => {
    if (sales.length === 0) return { filteredSales: [], filteredExpenses: [] };
    
    const maxDateStr = sales.reduce((max, s) => s.date > max ? s.date : max, sales[0].date);
    const maxDate = new Date(maxDateStr + "T00:00:00");
    const cutoffDate = new Date(maxDate);
    cutoffDate.setDate(maxDate.getDate() - timeWindow);

    const filteredSales = sales.filter(s => new Date(s.date + "T00:00:00") >= cutoffDate);
    const filteredExpenses = expenses.filter(e => new Date(e.date + "T00:00:00") >= cutoffDate);
    
    return { filteredSales, filteredExpenses };
  };

  const { filteredSales, filteredExpenses } = getFilteredData();
  const financials = calculateFinancials(filteredSales, filteredExpenses);
  const categoryStats = getCategoryRevenue(filteredSales);
  const dailyTrends = getDailyTrends(filteredSales);

  // Color palette for charts matching brutalist high-contrast grid theme
  const COLORS = ['#141414', '#2d2d2d', '#4d4d4d', '#727272', '#10b981', '#f59e0b'];

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);
  };

  const formatPercent = (val: number) => {
    return `${(val * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Time Window Select Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#E4E3E0] p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414]">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#141414]">Financial Performance P&L</h2>
          <p className="text-[10px] text-slate-600 font-mono">Calculated locally on client sandboxed thread // SYS.LEDGER</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-700">Analysis Horizon:</span>
          <div className="inline-flex rounded-none p-0.5 bg-neutral-200 border border-[#141414]">
            {([30, 60, 90] as const).map((days) => (
              <button
                key={days}
                onClick={() => setTimeWindow(days)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-none transition-all ${
                  timeWindow === days
                    ? 'bg-[#141414] text-[#E4E3E0] shadow-none font-bold'
                    : 'text-[#141414] hover:bg-neutral-300'
                }`}
              >
                LAST {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card: Net Revenue */}
        <div id="card-net-revenue" className="bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] relative transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase opacity-50 font-serif italic text-[#141414]">Net Revenue</span>
            <span className="p-1 bg-neutral-100 border border-[#141414] text-[#141414] rounded-none">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-mono tracking-tighter text-[#141414] font-black">
              {formatCurrency(financials.net_revenue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Gross: {formatCurrency(financials.gross_revenue)}</span>
            </div>
          </div>
        </div>

        {/* Metric Card: Gross Profit */}
        <div id="card-gross-profit" className="bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] relative transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase opacity-50 font-serif italic text-[#141414]">Gross Profit</span>
            <span className="p-1 bg-neutral-100 border border-[#141414] text-[#141414] rounded-none">
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-mono tracking-tighter text-[#141414] font-black">
              {formatCurrency(financials.gross_profit)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-mono font-bold bg-neutral-100 border border-[#141414] text-slate-700">
                GP MARGIN: {formatPercent(financials.gross_margin_pct)}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Card: OPEX */}
        <div id="card-opex" className="bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] relative transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase opacity-50 font-serif italic text-[#141414]">Operating Expenses</span>
            <span className="p-1 bg-neutral-100 border border-[#141414] text-[#141414] rounded-none">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-mono tracking-tighter text-[#141414] font-black">
              {formatCurrency(financials.operating_expenses)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">COGS: {formatCurrency(financials.cogs)}</span>
            </div>
          </div>
        </div>

        {/* Metric Card: Net Profit */}
        <div id="card-net-profit" className="bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] relative transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase opacity-50 font-serif italic text-[#141414]">Net Profit / Earnings</span>
            <span className="p-1 bg-neutral-100 border border-[#141414] text-[#141414] rounded-none">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className={`text-3xl font-mono tracking-tighter text-green-700 font-bold ${financials.net_profit >= 0 ? '' : 'text-red-700'}`}>
              {formatCurrency(financials.net_profit)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-bold border ${financials.net_profit >= 0 ? 'bg-green-50 border-green-600 text-green-700' : 'bg-red-50 border-red-600 text-red-700'}`}>
                NET MARGIN: {formatPercent(financials.net_margin_pct)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Revenue Trend Line Area Chart */}
        <div id="revenue-trend-chart-panel" className="lg:col-span-2 bg-white p-5 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] space-y-4">
          <div className="flex justify-between items-baseline border-b border-[#141414]/10 pb-2">
            <div>
              <h3 className="text-[#141414] font-bold text-xs uppercase tracking-wider font-mono">Revenue Velocity // Daily Flow</h3>
              <p className="text-[10px] text-slate-500 font-mono">Historical transaction data stream</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono bg-neutral-100 p-1 border border-[#141414]">
              <div className="flex items-center gap-1.5 px-1">
                <span className="w-2 h-2 rounded-none bg-[#141414] inline-block" />
                <span>DAILY_REV</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full font-mono text-[9px]">
            {dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrends} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    tickLine={true} 
                    axisLine={true} 
                    stroke="#141414"
                    tick={{ fill: '#141414', fontSize: 9, fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    tickLine={true} 
                    axisLine={true} 
                    stroke="#141414"
                    tick={{ fill: '#141414', fontSize: 9, fontFamily: 'monospace' }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #141414', borderRadius: '0px', color: '#E4E3E0', fontFamily: 'monospace', fontSize: '10px' }}
                    labelFormatter={(label) => `DATE: ${label}`}
                    formatter={(val: any) => [`$${parseFloat(val).toLocaleString()}`, 'NET_REV']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="net_revenue" 
                    stroke="#141414" 
                    strokeWidth={2} 
                    fillOpacity={0.15} 
                    fill="#141414" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center items-center bg-neutral-50 rounded-none p-6 border border-dashed border-[#141414]/30">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-[#141414] font-bold text-xs uppercase font-mono">No historical transactions available</p>
                <p className="text-slate-500 text-[10px] mt-1 uppercase font-mono">Upload sales to map trend flow velocity</p>
              </div>
            )}
          </div>
        </div>

        {/* Categories Revenue Distribution Chart */}
        <div id="category-distribution-panel" className="bg-white p-5 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] space-y-4">
          <div className="border-b border-[#141414]/10 pb-2">
            <h3 className="text-[#141414] font-bold text-xs uppercase tracking-wider font-mono">Revenue by Department</h3>
            <p className="text-[10px] text-slate-500 font-mono">Total net revenue contribution share</p>
          </div>

          <div className="h-72 w-full flex flex-col justify-between">
            {categoryStats.length > 0 ? (
              <>
                <div className="h-44 w-full font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="category" 
                        tickLine={false} 
                        axisLine={false} 
                        width={70}
                        tick={{ fill: '#141414', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#141414', border: '1px solid #141414', borderRadius: '0px', color: '#E4E3E0', fontFamily: 'monospace', fontSize: '10px' }}
                        formatter={(val: any) => [`$${parseFloat(val).toLocaleString()}`, 'NET_REV']}
                      />
                      <Bar dataKey="net_revenue" fill="#141414" radius={0}>
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom category list detailing shares */}
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {categoryStats.map((entry, idx) => {
                    const totalRevenue = categoryStats.reduce((sum, item) => sum + item.net_revenue, 0);
                    const percent = totalRevenue > 0 ? entry.net_revenue / totalRevenue : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between text-[11px] border-b border-[#141414]/10 pb-1 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-none inline-block border border-[#141414]" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="font-bold text-[#141414] uppercase">{entry.category}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[#141414] font-bold">{formatCurrency(entry.net_revenue)}</span>
                          <span className="text-slate-500 text-[10px]">({(percent * 100).toFixed(0)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col justify-center items-center bg-[#E4E3E0]/30 rounded-none p-6 border border-dashed border-[#141414]/30">
                <Layers className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-[#141414] font-bold text-xs uppercase font-mono">No categories loaded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Insights Ledger Section */}
      <div className="bg-white p-5 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 mb-4 border-b border-[#141414]/10 pb-2">
          <div>
            <h3 className="text-[#141414] font-bold text-xs uppercase tracking-wider font-mono">Recent Transactions Ledger</h3>
            <p className="text-[10px] text-slate-500 font-mono">Real-time ledger updates // STREAMING_AUDIT</p>
          </div>
          <div className="text-[10px] font-mono font-bold text-[#141414] bg-neutral-100 border border-[#141414] px-2 py-0.5">
            LOGS_COUNT: {filteredSales.length}
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 border border-[#141414]">
          {filteredSales.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] text-[9px] font-bold uppercase tracking-wider font-mono border-b border-[#141414]">
                  <th className="p-2.5 font-serif italic px-3">Date ID</th>
                  <th className="p-2.5">Order ID</th>
                  <th className="p-2.5">Product ID</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-center">Units</th>
                  <th className="p-2.5 text-right">Price</th>
                  <th className="p-2.5 text-right">Discount</th>
                  <th className="p-2.5 text-right pr-4">Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/20 font-mono text-[11px] text-[#141414]">
                {filteredSales.slice(-20).reverse().map((sale, idx) => {
                  const gross = sale.units_sold * sale.unit_price;
                  const net = gross - sale.discount;
                  return (
                    <tr key={idx} className="hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer group">
                      <td className="p-2.5 text-slate-500 group-hover:text-[#E4E3E0]/70 font-semibold px-3">{sale.date}</td>
                      <td className="p-2.5 font-bold">#{sale.order_id}</td>
                      <td className="p-2.5 text-slate-500 group-hover:text-[#E4E3E0]/70">PRD-{sale.product_id}</td>
                      <td className="p-2.5">
                        <span className="px-1 py-0.5 rounded-none text-[8px] uppercase font-bold tracking-tight bg-slate-100 text-[#141414] border border-[#141414] group-hover:bg-[#E4E3E0]/20 group-hover:text-[#E4E3E0] group-hover:border-[#E4E3E0]">
                          {sale.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-bold">{sale.units_sold}</td>
                      <td className="p-2.5 text-right">{formatCurrency(sale.unit_price)}</td>
                      <td className="p-2.5 text-right text-red-600 group-hover:text-red-300 font-bold">
                        {sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : '—'}
                      </td>
                      <td className="p-2.5 text-right font-bold pr-4">{formatCurrency(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center bg-neutral-50 text-slate-400 font-mono text-[10px] uppercase">
              No recent sale transaction rows present. Load data inside CSV workspace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
