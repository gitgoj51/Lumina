import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  HelpCircle, 
  Settings, 
  Sliders, 
  Info, 
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { DailyTrendElement, ForecastPoint } from '../types';
import { runHoltWinters, getDailyTrends } from '../utils/math';
import { Sale } from '../types';

interface ForecastingViewProps {
  sales: Sale[];
}

export default function ForecastingView({ sales }: ForecastingViewProps) {
  const [alpha, setAlpha] = useState(0.2);
  const [beta, setBeta] = useState(0.1);
  const [gamma, setGamma] = useState(0.3);
  const [horizon, setHorizon] = useState(30);
  const [showHelp, setShowHelp] = useState(false);

  // Group daily trends from sales
  const dailyTrends = useMemo(() => {
    return getDailyTrends(sales);
  }, [sales]);

  // Compute forecast dynamically when trends or slider variables shift
  const chartData = useMemo(() => {
    if (dailyTrends.length === 0) return [];

    // Precalculate Holt-Winters forecast values
    const forecastPoints = runHoltWinters(dailyTrends, horizon, alpha, beta, gamma);
    
    // Create combined data coordinates for Recharts ComposedChart
    // Historical points hold "net_revenue" as "actual", force forecast variables to null
    // Forecast points hold "forecast_value", "lower_bound", "upper_bound", force actual to null
    const merged: any[] = [];
    
    // 1. Add historical trends
    dailyTrends.forEach(d => {
      merged.push({
        date: d.date,
        actual: d.net_revenue,
        forecast: null,
        lower_bound: d.net_revenue, // so confidence area doesn't render historical offset
        upper_bound: d.net_revenue,
        isForecast: false
      });
    });

    // 2. Add forecasting line
    // To make the transition line seamless in Recharts, we duplicate the last historical point with forecast value
    const lastHist = dailyTrends[dailyTrends.length - 1];
    if (lastHist && forecastPoints.length > 0) {
      // Find the first forecasted index to align
      const forecastsOnly = forecastPoints.filter(f => f.isForecast === true);
      
      forecastsOnly.forEach(f => {
        merged.push({
          date: f.date,
          actual: null,
          forecast: f.forecast,
          lower_bound: f.lower_bound,
          upper_bound: f.upper_bound,
          isForecast: true
        });
      });
    }

    return merged;
  }, [dailyTrends, horizon, alpha, beta, gamma]);

  // Calculate visual aggregate insights of the forecasted line
  const forecastInsights = useMemo(() => {
    const forecasts = chartData.filter(pt => pt.isForecast);
    if (forecasts.length === 0) return { meanSales: 0, growthTrend: 'Stable', peakDay: 'N/A' };

    const total = forecasts.reduce((sum, pt) => sum + pt.forecast, 0);
    const meanSales = total / forecasts.length;

    // Detect general trend slope direction
    const firstFVal = forecasts[0].forecast;
    const lastFVal = forecasts[forecasts.length - 1].forecast;
    const difference = lastFVal - firstFVal;
    
    let growthTrend = 'Stable';
    if (difference > (meanSales * 0.05)) growthTrend = 'Upward Vector';
    else if (difference < -(meanSales * 0.05)) growthTrend = 'Downward Vector';

    let maxVal = -1;
    let maxDate = '';
    forecasts.forEach(f => {
      if (f.forecast > maxVal) {
        maxVal = f.forecast;
        maxDate = f.date;
      }
    });

    return {
      meanSales,
      growthTrend,
      peakDay: maxDate
    };
  }, [chartData]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);
  };

  return (
    <div className="space-y-6">
      {/* Forecasting Core Panel Header */}
      <div className="bg-[#E4E3E0] p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#141414]">Holt-Winters Double/Triple Smoothing</h2>
            <span className="px-1.5 py-0.5 rounded-none text-[8px] uppercase tracking-wider font-extrabold bg-[#141414] text-[#E4E3E0] font-mono animate-pulse">
              LIVE NATIVE TS
            </span>
          </div>
          <p className="text-[10px] text-slate-600 font-mono">Modelling seasonality anomalies on local-first compiler thread</p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#141414] font-mono font-bold bg-white border border-[#141414] rounded-none hover:bg-neutral-50 shadow-[2px_2px_0px_#141414]"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHelp ? "HIDE_HELP" : "HOW_PARAMETERS_WORK"}</span>
        </button>
      </div>

      {/* Model Math explanation helper */}
      {showHelp && (
        <div className="bg-[#141414] text-[#E4E3E0] p-5 rounded-none border border-[#141414] text-xs space-y-3 font-mono leading-relaxed animate-in fade-in duration-200 shadow-[4px_4px_0px_#888]">
          <div className="flex items-center gap-2 border-b border-[#E4E3E0]/20 pb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-[#E4E3E0] text-xs uppercase">Under the hood of Holt-Winters Additive Seasonality</h4>
          </div>
          <p>
            The engine models consumer sales by breaking daily trends down into three distinct coefficients updated exponentially:
          </p>
          <ol className="list-decimal list-inside pl-1 space-y-1.5 text-[11px] text-slate-300">
            <li>
              <strong className="text-white">Level (Alpha &alpha;):</strong> Dampens/amplifies reactions to volatile daily sales spikes. Near 1.0 triggers high volatility; near 0.0 is smoothed.
            </li>
            <li>
              <strong className="text-white">Trend (Beta &beta;):</strong> Captures trajectory velocity directions. Higher beta locks onto short-term changes.
            </li>
            <li>
              <strong className="text-white">Seasonality (Gamma &gamma;):</strong> Modulates weekly recurring spikes. It expects a 7-day cyclical observation loop.
            </li>
          </ol>
          <p className="text-[10px] text-zinc-400 border-t border-[#E4E3E0]/10 pt-2 font-mono uppercase">
            Confidence bounds are computed using root-mean-squared deviation of the residuals, scaling with &radic;m where m is forecasting intervals.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sliders Configuration Frame */}
        <div id="multiplier-sliders-panel" className="bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#141414]/10 pb-2">
            <Sliders className="w-4 h-4 text-[#141414]" />
            <h3 className="font-mono font-bold text-[#141414] text-xs uppercase">Smoothing Factors</h3>
          </div>

          <div className="space-y-4 font-mono">
            {/* Slider: Alpha */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#141414]">Level Alpha (&alpha;)</span>
                <span className="font-mono bg-[#141414] text-white px-1.5 py-0.5 rounded-none text-[10px] font-bold">{alpha.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0.01" 
                max="1.00" 
                step="0.01" 
                value={alpha} 
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-100 border border-[#141414] appearance-none cursor-pointer accent-[#141414]"
              />
              <p className="text-[10px] text-slate-500 leading-snug">Weights recent periods against historical data.</p>
            </div>

            {/* Slider: Beta */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#141414]">Trend Beta (&beta;)</span>
                <span className="font-mono bg-[#141414] text-white px-1.5 py-0.5 rounded-none text-[10px] font-bold">{beta.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0.01" 
                max="1.00" 
                step="0.01" 
                value={beta} 
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-100 border border-[#141414] appearance-none cursor-pointer accent-[#141414]"
              />
              <p className="text-[10px] text-slate-500 leading-snug">Smooths out current trajectory direction.</p>
            </div>

            {/* Slider: Gamma */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#141414]">Seasonal Gamma (&gamma;)</span>
                <span className="font-mono bg-[#141414] text-white px-1.5 py-0.5 rounded-none text-[10px] font-bold">{gamma.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="0.01" 
                max="1.00" 
                step="0.01" 
                value={gamma} 
                onChange={(e) => setGamma(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-100 border border-[#141414] appearance-none cursor-pointer accent-[#141414]"
              />
              <p className="text-[10px] text-slate-500 leading-snug">Underpins 7-day cyclical shopping recurrence.</p>
            </div>

            {/* Slider: Horizon */}
            <div className="border-t border-[#141414]/10 pt-3 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#141414]">Horizon Days</span>
                <span className="font-mono bg-[#141414] text-white px-1.5 py-0.5 rounded-none text-[10px] font-bold">{horizon} Days</span>
              </div>
              <input 
                type="range" 
                min="7" 
                max="90" 
                step="1" 
                value={horizon} 
                onChange={(e) => setHorizon(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-100 border border-[#141414] appearance-none cursor-pointer accent-[#141414]"
              />
              <p className="text-[10px] text-slate-500 leading-snug">Specifies quantity of projected period days.</p>
            </div>
          </div>
        </div>

        {/* Prediction Chart Area */}
        <div id="composed-forecast-chart" className="lg:col-span-3 bg-white p-5 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2 border-b border-[#141414]/10 pb-2">
            <div>
              <h3 className="text-[#141414] font-bold text-xs uppercase tracking-wider font-mono">30-Day Revenue Forecasting Modeling</h3>
              <p className="text-[10px] text-slate-500 font-mono">Comparing historical baseline against exponential confidence intervals</p>
            </div>
            
            {/* Brief Insights badges */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-neutral-100 border border-[#141414] text-[#141414]">
                AVG_FC: {formatCurrency(forecastInsights.meanSales)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none border ${
                forecastInsights.growthTrend === 'Upward Vector' 
                  ? 'bg-green-50 border-green-600 text-green-700' 
                  : forecastInsights.growthTrend === 'Downward Vector' 
                  ? 'bg-rose-50 border-rose-600 text-rose-700' 
                  : 'bg-slate-50 border-slate-600 text-slate-600'
              }`}>
                VECTOR: {forecastInsights.growthTrend.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="h-80 w-full font-mono text-[9px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    tickLine={true} 
                    axisLine={true}
                    stroke="#141414"
                    tick={{ fill: '#141414', fontSize: 9 }}
                  />
                  <YAxis 
                    tickLine={true} 
                    axisLine={true}
                    stroke="#141414"
                    tick={{ fill: '#141414', fontSize: 9 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  
                  {/* Confidence Interval shaded Area tool */}
                  <Area
                    name="CONFIDENCE_BOUNDS (95%)"
                    type="monotone"
                    dataKey="upper_bound"
                    stroke="none"
                    fill="#141414"
                    fillOpacity={0.08}
                    legendType="none"
                  />
                  {/* Workaround for bottom clipping area shading bounds */}
                  <Area
                    type="monotone"
                    dataKey="lower_bound"
                    stroke="none"
                    fill="#ffffff"
                    fillOpacity={1.0}
                    legendType="none"
                  />

                  {/* Standard Tooltip */}
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #141414', borderRadius: '0px', color: '#E4E3E0', fontFamily: 'monospace', fontSize: '10px' }}
                    labelFormatter={(label) => `DATE COORDINATE: ${label}`}
                    formatter={(val: any, name: any) => {
                      if (val === null) return ['—', name];
                      return [`$${parseFloat(val).toFixed(2)}`, name];
                    }}
                  />
                  
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold', paddingTop: '10px' }}
                  />

                  {/* Historical Revenue */}
                  <Line 
                    name="HISTORICAL_ACTUAL"
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#141414" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                  />

                  {/* Forecast Line */}
                  <Line 
                    name="PROJECTED_HW_FORECAST"
                    type="monotone" 
                    dataKey="forecast" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    strokeDasharray="4 4" 
                    dot={false}
                  />

                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col justify-center items-center bg-[#E4E3E0]/30 rounded-none p-6 border border-dashed border-[#141414]/30">
                <CalendarDays className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-[#141414] font-bold text-xs uppercase font-mono">Insufficient data periods to compute forecast</p>
                <p className="text-slate-500 text-[10px] mt-1 font-mono uppercase">Please import historical transactions (requires 14+ sequential days)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Validation & Performance Diagnostics */}
      <div className="bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] font-mono">
        <h4 className="text-[10px] font-bold text-[#141414] uppercase tracking-wider mb-2 border-b border-[#141414]/10 pb-1">Statistical Engine Diagnostics</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-neutral-50 p-2.5 border border-[#141414]">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Mathematical Basis</span>
            <p className="text-[11px] font-bold text-[#141414] mt-1 uppercase">Holt-Winters (Additive Seasonality)</p>
          </div>
          <div className="bg-neutral-50 p-2.5 border border-[#141414]">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Season Period Cycle</span>
            <p className="text-[11px] font-bold text-[#141414] mt-1 uppercase">L=7 Observations (Weekly recurring cadence)</p>
          </div>
          <div className="bg-neutral-50 p-2.5 border border-[#141414]">
            <span className="text-[9px] font-bold text-slate-500 uppercase">Forecast Peak Demand Index</span>
            <p className="text-[11px] font-bold text-[#141414] mt-1">{forecastInsights.peakDay || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
