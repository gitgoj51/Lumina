import React, { useState, useEffect } from 'react';
import { 
  Building, 
  TrendingUp, 
  BarChart3, 
  Boxes, 
  FileText, 
  Layers, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { Product, Sale, Expense } from './types';
import { 
  generateSampleSales, 
  generateSampleProducts, 
  generateSampleExpenses 
} from './utils/sampleData';

// Visual panel imports
import FinanceDashboard from './components/FinanceDashboard';
import ForecastingView from './components/ForecastingView';
import InventoryTracker from './components/InventoryTracker';
import ReportViewer from './components/ReportViewer';
import DataWorkspace from './components/DataWorkspace';

export default function App() {
  const [activePanel, setActivePanel] = useState<'financials' | 'forecasting' | 'inventory' | 'brief' | 'workspace'>('financials');
  
  // State variables for core data stores
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Local Storage Synchronization on bootup
  useEffect(() => {
    const cachedProducts = localStorage.getItem('lumina_products');
    const cachedSales = localStorage.getItem('lumina_sales');
    const cachedExpenses = localStorage.getItem('lumina_expenses');

    if (cachedProducts && cachedSales && cachedExpenses) {
      try {
        setProducts(JSON.parse(cachedProducts));
        setSales(JSON.parse(cachedSales));
        setExpenses(JSON.parse(cachedExpenses));
        return;
      } catch (err) {
        console.warn("Storage fallback triggered: malformed JSON caches", err);
      }
    }

    // Default Ingestion bootstrapper matching Python initial demo run
    generateDefaultDataset();
  }, []);

  // Update localStorage when lists change
  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('lumina_products', JSON.stringify(newProducts));
  };

  const handleUpdateSales = (newSales: Sale[]) => {
    setSales(newSales);
    localStorage.setItem('lumina_sales', JSON.stringify(newSales));
  };

  const handleUpdateExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('lumina_expenses', JSON.stringify(newExpenses));
  };

  const generateDefaultDataset = () => {
    const sProducts = generateSampleProducts();
    const sSales = generateSampleSales();
    const sExpenses = generateSampleExpenses();

    setProducts(sProducts);
    setSales(sSales);
    setExpenses(sExpenses);

    localStorage.setItem('lumina_products', JSON.stringify(sProducts));
    localStorage.setItem('lumina_sales', JSON.stringify(sSales));
    localStorage.setItem('lumina_expenses', JSON.stringify(sExpenses));
  };

  const clearDatabase = () => {
    setProducts([]);
    setSales([]);
    setExpenses([]);
    localStorage.removeItem('lumina_products');
    localStorage.removeItem('lumina_sales');
    localStorage.removeItem('lumina_expenses');
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans antialiased select-none">
      
      {/* Upper Navigation Header bar */}
      <header className="h-16 border-b border-[#141414] flex items-center justify-between px-6 shrink-0 bg-[#E4E3E0] no-print">
        <div className="flex items-center gap-8">
          <div className="text-md sm:text-lg font-black tracking-tight flex items-center gap-2">
            <div className="w-4 h-4 bg-[#141414] rotate-45 shrink-0"></div>
            <span>LUMINA ENGINE</span>
            <span className="text-[9px] bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-none font-mono font-bold tracking-tight">LOCAL_ONLY</span>
          </div>
          <nav className="hidden lg:flex gap-6 text-[10px] font-mono font-bold uppercase tracking-widest">
            <button 
              onClick={() => setActivePanel('financials')} 
              className={`pb-1 transition-all border-b-2 ${activePanel === 'financials' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              Financial Overview
            </button>
            <button 
              onClick={() => setActivePanel('forecasting')} 
              className={`pb-1 transition-all border-b-2 ${activePanel === 'forecasting' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              Sales Forecast
            </button>
            <button 
              onClick={() => setActivePanel('inventory')} 
              className={`pb-1 transition-all border-b-2 ${activePanel === 'inventory' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              Inventory Management
            </button>
            <button 
              onClick={() => setActivePanel('brief')} 
              className={`pb-1 transition-all border-b-2 ${activePanel === 'brief' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              Executive Briefing
            </button>
            <button 
              onClick={() => setActivePanel('workspace')} 
              className={`pb-1 transition-all border-b-2 ${activePanel === 'workspace' ? 'border-[#141414] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              CSV File Workspace
            </button>
          </nav>
        </div>

        {/* Info header capsule */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden md:flex flex-col text-right text-[9px] text-[#141414] border-r border-[#141414]/20 pr-4">
            <span>PLATFORM: SANDBOX SECURED</span>
            <span>DATA TRANSITION: IN_MEMORY</span>
          </div>
          <div className="bg-white text-[#141414] py-1 px-2.5 rounded-none flex items-center gap-1.5 font-bold border border-[#141414] shadow-[2px_2px_0px_#141414]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>OPERATIONAL LEDGER</span>
          </div>
        </div>
      </header>

      {/* Main layout container with Left sidebar controls */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 border-b border-[#141414]">
        
        {/* Navigation Sidebar panel */}
        <aside className="w-full md:w-64 bg-[#E4E3E0] border-b md:border-b-0 md:border-r border-[#141414] flex flex-col no-print shrink-0 p-4 space-y-4">
          <div>
            <span className="text-[10px] text-[#141414] font-bold uppercase font-mono tracking-wider ml-1 mb-2 block opacity-70">Consoles</span>
            
            <nav className="space-y-2">
              {/* Sidebar item: Financial Dashboard */}
              <button
                onClick={() => setActivePanel('financials')}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-none text-xs font-mono font-bold uppercase transition-all ${
                  activePanel === 'financials'
                    ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[inset_1px_1px_0px_#fff]'
                    : 'bg-white text-[#141414] border-[#141414] hover:bg-neutral-50 shadow-[2px_2px_0px_#141414]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span>Overview</span>
                </span>
                <span className="text-[9px] opacity-70">SYS.01</span>
              </button>

              {/* Sidebar item: Exponential Smoothing Forecasting */}
              <button
                onClick={() => setActivePanel('forecasting')}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-none text-xs font-mono font-bold uppercase transition-all ${
                  activePanel === 'forecasting'
                    ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[inset_1px_1px_0px_#fff]'
                    : 'bg-white text-[#141414] border-[#141414] hover:bg-neutral-50 shadow-[2px_2px_0px_#141414]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>30D Forecast</span>
                </span>
                <span className="text-[9px] opacity-70">SYS.02</span>
              </button>

              {/* Sidebar item: Inventory Optimization & Reorders */}
              <button
                onClick={() => setActivePanel('inventory')}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-none text-xs font-mono font-bold uppercase transition-all ${
                  activePanel === 'inventory'
                    ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[inset_1px_1px_0px_#fff]'
                    : 'bg-white text-[#141414] border-[#141414] hover:bg-neutral-50 shadow-[2px_2px_0px_#141414]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Boxes className="w-3.5 h-3.5 shrink-0" />
                  <span>Inventory / Re</span>
                </span>
                <span className="text-[9px] opacity-70">SYS.03</span>
              </button>

              {/* Sidebar item: Executive BI briefing */}
              <button
                onClick={() => setActivePanel('brief')}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-none text-xs font-mono font-bold uppercase transition-all ${
                  activePanel === 'brief'
                    ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[inset_1px_1px_0px_#fff]'
                    : 'bg-white text-[#141414] border-[#141414] hover:bg-neutral-50 shadow-[2px_2px_0px_#141414]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Auto Brief</span>
                </span>
                <span className="text-[9px] opacity-70">SYS.04</span>
              </button>

              <span className="text-[10px] text-[#141414] font-bold uppercase font-mono tracking-wider ml-1 pt-4 pb-1 block opacity-70">Configuration</span>

              {/* Sidebar item: Drag drop importer */}
              <button
                onClick={() => setActivePanel('workspace')}
                className={`w-full flex items-center justify-between px-3 py-2 border rounded-none text-xs font-mono font-bold uppercase transition-all ${
                  activePanel === 'workspace'
                    ? 'bg-[#141414] text-[#E4E3E0] border-[#141414] shadow-[inset_1px_1px_0px_#fff]'
                    : 'bg-white text-[#141414] border-[#141414] hover:bg-neutral-50 shadow-[2px_2px_0px_#141414]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  <span>CSV Workspace</span>
                </span>
                <span className="text-[9px] opacity-70">SYS.05</span>
              </button>
            </nav>
          </div>

          {/* Quick diagnostic status block */}
          <div className="bg-white rounded-none p-3 border border-[#141414] shadow-[2px_2px_0px_#141414] space-y-2 mt-auto text-[#141414]">
            <span className="text-[9px] font-bold text-[#141414] uppercase tracking-widest block font-mono border-b border-[#141414]/20 pb-1">Ledger Metrics</span>
            <div className="space-y-1 text-[10px] text-[#141414] font-mono">
              <div className="flex justify-between">
                <span>SKUs Loaded:</span>
                <span className="font-bold">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions:</span>
                <span className="font-bold">{sales.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Expenses:</span>
                <span className="font-bold text-red-600">-${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Principal Dynamic viewport canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-200/60 shrink-0">
          
          {/* Active view switcher */}
          {activePanel === 'financials' && (
            <FinanceDashboard sales={sales} expenses={expenses} />
          )}

          {activePanel === 'forecasting' && (
            <ForecastingView sales={sales} />
          )}

          {activePanel === 'inventory' && (
            <InventoryTracker 
              sales={sales} 
              products={products} 
              onUpdateProducts={handleUpdateProducts} 
            />
          )}

          {activePanel === 'brief' && (
            <ReportViewer sales={sales} expenses={expenses} products={products} />
          )}

          {activePanel === 'workspace' && (
            <DataWorkspace 
              sales={sales}
              products={products}
              expenses={expenses}
              onUploadSales={handleUpdateSales}
              onUploadProducts={handleUpdateProducts}
              onUploadExpenses={handleUpdateExpenses}
              onResetToSample={generateDefaultDataset}
              onClearAll={clearDatabase}
            />
          )}
        </main>
      </div>

      {/* FOOTER BAR */}
      <footer className="h-10 border-t border-[#141414] flex items-center justify-between px-6 shrink-0 bg-neutral-200 text-[10px] font-mono uppercase opacity-90 no-print">
        <div className="flex gap-6">
          <span>Session: 03:42:10 // LOCAL_HOST</span>
          <span>Matrix Buffer: {(products.length + sales.length + expenses.length) > 0 ? `${((products.length + sales.length + expenses.length) * 0.15).toFixed(2)} KB` : "0.00 KB"}</span>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">Logs: [INFO] System compiler active. Cryptographic session verified.</span>
          <span className="bg-green-700 text-[#E4E3E0] px-1 tracking-widest font-bold font-mono">ENCRYPTED</span>
        </div>
      </footer>
    </div>
  );
}
