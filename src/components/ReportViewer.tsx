import React, { useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  Award,
  AlertOctagon, 
  HelpCircle,
  PiggyBank,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Product, Sale, Expense } from '../types';
import { calculateFinancials, analyzeInventory } from '../utils/math';
import { triggerFileDownload } from '../utils/csv';

interface ReportViewerProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
}

export default function ReportViewer({ sales, expenses, products }: ReportViewerProps) {
  
  const stats = useMemo(() => {
    const financials = calculateFinancials(sales, expenses);
    const inventory = analyzeInventory(sales, products);
    const criticalStockouts = inventory.filter(i => i.reorder_required);
    
    return {
      financials,
      inventory,
      criticalStockouts
    };
  }, [sales, expenses, products]);

  const timestampString = useMemo(() => {
    return new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }, []);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);
  };

  const formatPercent = (val: number) => {
    return `${(val * 100).toFixed(1)}%`;
  };

  // Generate automated local expert audit findings based on metrics
  const auditInsights = useMemo(() => {
    const { financials, criticalStockouts } = stats;
    const insights: string[] = [];

    // Profitability check
    if (financials.net_profit > 0) {
      if (financials.net_margin_pct > 0.20) {
        insights.push("Outstanding operational health! Your net margins are currently above 20%, indicating high premium service pricing or highly streamlined overhead.");
      } else {
        insights.push("Your business is profitable, but operating with thin net margins. Review administrative costs and supplier pricing agreements.");
      }
    } else if (financials.net_profit < 0) {
      insights.push("Urgent attention needed! Operating expenses currently exceed net revenue margins, resulting in net negative liquidity loss.");
    }

    // Cost of goods sold checking
    const cogsShareOfRevenue = financials.net_revenue > 0 ? (financials.cogs / financials.net_revenue) : 0;
    if (cogsShareOfRevenue > 0.6) {
      insights.push(`Your acquisition costs are high (consuming ${formatPercent(cogsShareOfRevenue)} of revenue). Consider consolidation of supplier orders to negotiate bulk purchasing tiers.`);
    }

    // Inventory status out checks
    if (criticalStockouts.length > 0) {
      insights.push(`Identified ${criticalStockouts.length} stock bottlenecks at risk of immediate structural stockouts. Prioritize issuing purchase orders for lead times.`);
    } else {
      insights.push("Excellent catalog maintenance! There are currently no immediate stock reorder warnings on active SKU listings.");
    }

    // Marketing efficiency check
    const marketingExpenses = expenses
      .filter(e => e.expense_type.toLowerCase() === 'marketing')
      .reduce((sum, e) => sum + e.amount, 0);

    if (marketingExpenses > 0 && financials.net_revenue > 0) {
      const marketingRatio = financials.net_revenue / marketingExpenses;
      insights.push(`Marketing spends to income ratio sits at ${marketingRatio.toFixed(1)}x. Continue running present flyers/digital campaigns.`);
    }

    return insights;
  }, [stats, expenses]);

  // Packages entire styled HTML content to replicate outputs/lumina_report.html
  const handleExportHTMLFile = () => {
    const { financials, criticalStockouts } = stats;
    const criticalRowsHTML = criticalStockouts.length > 0 
      ? criticalStockouts.map(item => `
          <tr>
            <td>PRD-${item.product_id}</td>
            <td><strong>${item.product_name}</strong></td>
            <td>${item.category}</td>
            <td class="num">${item.current_stock}</td>
            <td class="num">${item.reorder_point}</td>
            <td>${item.supplier}</td>
            <td class="num font-bold text-amber">${item.recommended_reorder_qty} units</td>
          </tr>
        `).join('')
      : '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">No critical stock reorders flagged. All items are above reorder levels.</td></tr>';

    const fullHTMLResult = `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lumina Business Intelligence Report</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            color: #1e293b; 
            background: #f8fafc;
            line-height: 1.5;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
            border: 1px solid #e2e8f0;
        }
        .header {
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }
        .logo {
            font-size: 20px;
            font-weight: 800;
            color: #4f46e5;
            letter-spacing: -0.025em;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        h1 { 
            font-size: 28px; 
            font-weight: 800; 
            color: #0f172a; 
            margin: 0 0 4px 0; 
            letter-spacing: -0.025em;
        }
        .meta-stamp { 
            font-size: 11px; 
            color: #64748b; 
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            margin: 0;
        }
        .grid-kpis {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 36px;
        }
        .kpi-card { 
            border: 1px solid #e2e8f0; 
            padding: 24px; 
            border-radius: 8px; 
            background: #f8fafc;
        }
        .kpi-card p {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin: 0 0 8px 0;
        }
        .metric { 
            font-size: 30px; 
            font-weight: 800; 
            color: #0f172a; 
            letter-spacing: -0.03em;
        }
        .metric.negative {
            color: #e11d48;
        }
        .kpi-card .badge {
            display: inline-block;
            margin-top: 8px;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            background: #e0e7ff;
            color: #4338ca;
        }
        .kpi-card .badge.danger {
            background: #ffe4e6;
            color: #be123c;
        }
        h2 { 
            font-size: 16px; 
            font-weight: 700; 
            color: #0f172a; 
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin: 32px 0 16px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 16px; 
            font-size: 13px;
        }
        th, td { 
            border-bottom: 1px solid #f1f5f9; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #f8fafc; 
            color: #475569;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.05em;
        }
        tr:hover {
            background-color: #f8fafc;
        }
        .num {
            font-family: ui-monospace, SFMono-Regular, monospace;
            text-align: right;
        }
        td.num {
            font-weight: 500;
        }
        th.num {
            text-align: right;
        }
        .text-amber {
            color: #d97706;
        }
        .font-bold {
            font-weight: 700;
        }
        .insights-box {
            background: #e0f2fe;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
        }
        .insights-box h3 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 700;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .insights-box ul {
            margin: 0;
            padding-left: 20px;
            color: #0369a1;
            font-size: 13px;
        }
        .insights-box li {
            margin-bottom: 8px;
        }
        .insights-box li:last-child {
            margin-bottom: 0;
        }
        .footer {
            margin-top: 48px;
            border-top: 1px solid #f1f5f9;
            padding-top: 16px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .container { border: none; box-shadow: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="container animate-doc">
        <div class="header">
            <div class="logo">Lumina Retail Intelligence</div>
            <h1>Automated Financial & Stock Brief</h1>
            <p class="meta-stamp">PREPARED SECURELY ON OFF-GRID EMBEDDED THREAD &bull; ${timestampString}</p>
        </div>
        
        <div class="insights-box">
            <h3>Lumina Local Advisory Insights</h3>
            <ul>
                ${auditInsights.map(ins => `<li>${ins}</li>`).join('')}
            </ul>
        </div>

        <h2>Summary P&L Dashboard Statement</h2>
        <div class="grid-kpis">
            <div class="kpi-card">
                <p>Net Settled Revenue</p>
                <div class="metric">${formatCurrency(financials.net_revenue)}</div>
                <div class="badge">Gross sales: ${formatCurrency(financials.gross_revenue)}</div>
            </div>
            <div class="kpi-card">
                <p>Net Accrued Profit</p>
                <div class="metric ${financials.net_profit < 0 ? 'negative' : ''}">${formatCurrency(financials.net_profit)}</div>
                <div class="badge ${financials.net_profit < 0 ? 'danger' : ''}">Net Margin: ${formatPercent(financials.net_margin_pct)}</div>
            </div>
            <div class="kpi-card">
                <p>Expenses & Outflows</p>
                <div class="metric font-semibold">${formatCurrency(financials.operating_expenses + financials.cogs)}</div>
                <div class="badge">COGS: ${formatCurrency(financials.cogs)}</div>
            </div>
        </div>

        <h2>Critical Inventory Stock Reorders Alert</h2>
        <table>
            <thead>
                <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th class="num">Stock</th>
                    <th class="num">Threshold</th>
                    <th>Recommended Supplier</th>
                    <th class="num">Reorder Qty</th>
                </tr>
            </thead>
            <tbody>
                ${criticalRowsHTML}
            </tbody>
        </table>
        
        <div class="footer">
            <p>Lumina Local-First Retail Analytics &copy; 2026. Standalone offline HTML briefing document exported safely.</p>
        </div>
    </div>
</body>
</html>`;

    triggerFileDownload(fullHTMLResult, 'lumina_report.html', 'text/html');
  };

  const triggerPrintScreen = () => {
    // Standard triggers browser printing
    window.print();
  };

  const { financials, criticalStockouts } = stats;

  return (
    <div className="space-y-6">
      {/* Report Controls Banner */}
      <div className="bg-[#E4E3E0] p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#141414]">Automated Report Generator</h2>
          <p className="text-[10px] text-slate-600 font-mono">Stand-alone printable statement packaging computed locally</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto font-mono text-xs">
          {/* Download HTML Brief */}
          <button
            onClick={handleExportHTMLFile}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 text-white bg-[#141414] font-bold hover:bg-neutral-800 transition-colors rounded-none shadow-[2px_2px_0px_#888]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT Standalone HTML</span>
          </button>

          {/* Trigger Print brief */}
          <button
            onClick={triggerPrintScreen}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 text-[#141414] font-bold bg-white border border-[#141414] hover:bg-neutral-55 transition-colors rounded-none shadow-[2px_2px_0px_#141414]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT Executive Brief</span>
          </button>
        </div>
      </div>

      {/* Actual Statement visual canvas layout */}
      <div id="financial-executive-brief-container" className="bg-white p-6 md:p-10 rounded-none border-2 border-[#141414] shadow-[8px_8px_0px_#141414] space-y-8 max-w-4xl mx-auto font-mono">
        
        {/* Header Block */}
        <div className="border-b-2 border-[#141414] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-[#141414] tracking-wider font-mono">Lumina Retail Intelligence</span>
            <h1 className="text-xl font-serif italic text-slate-900 tracking-tight">Business Evaluation Statement</h1>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
              Prepared Securely on Locally Embedded Thread &bull; {timestampString}
            </p>
          </div>
          <div className="hidden sm:block text-right bg-neutral-100 p-2.5 border border-[#141414]">
            <span className="text-[9px] text-[#141414] font-bold uppercase tracking-wider block font-mono">Audit Certification</span>
            <span className="text-[10px] font-bold text-slate-700">Verified Local Engine</span>
          </div>
        </div>

        {/* Local Expert Advisor Box */}
        <div className="bg-amber-50 rounded-none p-5 border border-[#141414] space-y-2.5 shadow-[4px_4px_0px_#141414]">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider border-b border-amber-950/10 pb-1">
            <Award className="w-4 h-4 text-[#141414]" />
            <span>Lumina Strategy Recommendations</span>
          </div>
          <ul className="list-disc list-inside space-y-2 text-[11px] text-amber-950 pl-1 leading-relaxed">
            {auditInsights.map((insight, index) => (
              <li key={index} className="marker:text-[#141414]">{insight}</li>
            ))}
          </ul>
        </div>

        {/* P&L Grid */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">1. Statement of profit & loss</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-50 p-4 rounded-none border border-[#141414]">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Net Settled Revenue</span>
              <div className="text-xl font-bold text-[#141414] mt-1">
                {formatCurrency(financials.net_revenue)}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Gross Inflow Value: {formatCurrency(financials.gross_revenue)}
              </span>
            </div>

            <div className={`p-4 rounded-none border ${
              financials.net_profit >= 0 ? 'bg-neutral-50 border-[#141414]' : 'bg-rose-50 border-rose-600 shadow-[2px_2px_0px_#be123c]'
            }`}>
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Net Accrued Profit</span>
              <div className={`text-xl font-bold mt-1 ${
                financials.net_profit >= 0 ? 'text-[#141414]' : 'text-rose-700'
              }`}>
                {formatCurrency(financials.net_profit)}
              </div>
              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 border mt-1.5 ${
                financials.net_profit >= 0 ? 'bg-green-50 border-green-600 text-green-800' : 'bg-red-50 border-red-600 text-red-800'
              }`}>
                Margin: {formatPercent(financials.net_margin_pct)}
              </span>
            </div>

            <div className="bg-neutral-50 p-4 rounded-none border border-[#141414]">
              <span className="text-[9px] text-slate-500 font-bold uppercase block">Administrative Outflows</span>
              <div className="text-xl font-bold text-[#141414] mt-1">
                {formatCurrency(financials.operating_expenses + financials.cogs)}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Operating direct COGS: {formatCurrency(financials.cogs)}
              </span>
            </div>
          </div>
        </div>

        {/* Critical stockoutsalerts */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">2. Inventory Stock Bottlenecks Alert</h2>
          
          <div className="border border-[#141414] rounded-none overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px] text-[#141414]">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] uppercase tracking-wider text-[9px] font-bold border-b border-[#141414]">
                  <th className="p-2.5">Product ID</th>
                  <th className="p-2.5">Product Name</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5 text-center">Remaining Stock</th>
                  <th className="p-2.5 text-center">Threshold</th>
                  <th className="p-2.5">Supplier</th>
                  <th className="p-2.5 text-right">Recommended Fill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10">
                {criticalStockouts.length > 0 ? (
                  criticalStockouts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold text-slate-500">PRD-{item.product_id}</td>
                      <td className="p-2.5 font-bold text-[#141414]">{item.product_name}</td>
                      <td className="p-2.5 text-slate-600 uppercase font-bold text-[9px]">{item.category}</td>
                      <td className="p-2.5 text-center font-bold text-red-700 bg-red-50/20">{item.current_stock}</td>
                      <td className="p-2.5 text-center text-slate-500">{item.reorder_point}</td>
                      <td className="p-2.5 text-slate-500">{item.supplier}</td>
                      <td className="p-2.5 text-right font-black text-amber-700">{item.recommended_reorder_qty} units</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-bold uppercase text-[10px]">
                      No critical stock boundaries breached. All items healthy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Disclaimer footer */}
        <div className="border-t border-[#141414]/10 pt-6 text-center text-[9px] text-slate-400 font-mono">
          <p>Lumina stand-alone browser generated document. Rendered via client-side SVG vectors and locally parsed matrix buffers.</p>
        </div>

      </div>
    </div>
  );
}
