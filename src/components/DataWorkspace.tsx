import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle, 
  FileWarning, 
  Database,
  Trash2,
  Info 
} from 'lucide-react';
import { Product, Sale, Expense } from '../types';
import { csvToProducts, csvToSales, csvToExpenses, arrayToCSV, triggerFileDownload } from '../utils/csv';

interface DataWorkspaceProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  onUploadSales: (sales: Sale[]) => void;
  onUploadProducts: (products: Product[]) => void;
  onUploadExpenses: (expenses: Expense[]) => void;
  onResetToSample: () => void;
  onClearAll: () => void;
}

export default function DataWorkspace({
  sales,
  products,
  expenses,
  onUploadSales,
  onUploadProducts,
  onUploadExpenses,
  onResetToSample,
  onClearAll
}: DataWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'expenses'>('sales');
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ status: 'success' | 'error' | null; text: string }>({ status: null, text: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger downloads for sample mock CSVs
  const handleDownloadTemplate = (type: 'sales' | 'products' | 'expenses') => {
    let dummyData: any[] = [];
    let filename = '';

    if (type === 'products') {
      dummyData = [
        { product_id: 101, product_name: 'Widget A', category: 'Electronics', current_stock: 50, reorder_point: 20, supplier: 'Alpha Inc', lead_time_days: 5 },
        { product_id: 102, product_name: 'Gadget B', category: 'Electronics', current_stock: 5, reorder_point: 15, supplier: 'Beta Corp', lead_time_days: 10 },
        { product_id: 103, product_name: 'Tool C', category: 'Hardware', current_stock: 100, reorder_point: 30, supplier: 'Alpha Inc', lead_time_days: 3 }
      ];
      filename = 'sample_products.csv';
    } else if (type === 'sales') {
      dummyData = [
        { date: '2026-06-01', order_id: 4001, product_id: 101, category: 'Electronics', units_sold: 4, unit_price: 120.0, unit_cost: 72.0, discount: 0.0, channel: 'Online' },
        { date: '2026-06-02', order_id: 4002, product_id: 103, category: 'Hardware', units_sold: 2, unit_price: 45.0, unit_cost: 27.0, discount: 5.0, channel: 'In-Store' }
      ];
      filename = 'sample_sales.csv';
    } else {
      dummyData = [
        { date: '2026-06-01', expense_type: 'Rent', amount: 2200.0, notes: 'Monthly lease' },
        { date: '2026-06-01', expense_type: 'Utilities', amount: 450.0, notes: 'Electricity bill' }
      ];
      filename = 'sample_expenses.csv';
    }

    const csvContent = arrayToCSV(dummyData);
    triggerFileDownload(csvContent, filename);
  };

  // Drag and drop events handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setMessage({ status: 'error', text: 'Unsupported format. Lumina Ingestor only supports standard CSV files.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        if (activeTab === 'products') {
          const parsed = csvToProducts(text);
          if (parsed.length === 0) throw new Error("Parsed dataset empty");
          onUploadProducts(parsed);
          setMessage({ status: 'success', text: `Successfully ingested product database. Logged ${parsed.length} SKUs.` });
        } else if (activeTab === 'sales') {
          const parsed = csvToSales(text);
          if (parsed.length === 0) throw new Error("Parsed dataset empty");
          onUploadSales(parsed);
          setMessage({ status: 'success', text: `Successfully ingested transactions ledger. Logged ${parsed.length} items.` });
        } else if (activeTab === 'expenses') {
          const parsed = csvToExpenses(text);
          if (parsed.length === 0) throw new Error("Parsed dataset empty");
          onUploadExpenses(parsed);
          setMessage({ status: 'success', text: `Successfully ingested expenses ledger. Logged ${parsed.length} rows.` });
        }
      } catch (err: any) {
        setMessage({ status: 'error', text: `Failed to read CSV format structure: ${err.message || 'Malformed headers'}` });
      }
    };
    reader.readAsText(file);
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Workspace Headline Panel */}
      <div className="bg-[#E4E3E0] p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#141414]">CSV Data Ingestion & Security Workspace</h2>
          <p className="text-[10px] text-slate-600 font-mono">Drag, validate, and store custom tables locally inside the secure sandbox</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Quick reset backup to default mock metrics */}
          <button
            onClick={() => {
              onResetToSample();
              setMessage({ status: 'success', text: 'SUCCESS: Default sandbox stores restored to standard 90-day base dataset.' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[#141414] font-bold bg-white border border-[#141414] rounded-none hover:bg-neutral-50 shadow-[2px_2px_0px_#141414] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>GEN_SAMPLE_DATASET</span>
          </button>

          {/* Quick clear memory */}
          <button
            onClick={() => {
              onClearAll();
              setMessage({ status: 'success', text: 'CLEARED: Sandbox database memory dropped.' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-red-700 font-bold bg-white border border-red-700 rounded-none hover:bg-red-50 shadow-[2px_2px_0px_#be123c] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>NUK_CORE_FILES</span>
          </button>
        </div>
      </div>

      {/* Security alert block */}
      <div className="bg-[#141414] text-[#E4E3E0] p-4 rounded-none border border-[#141414] text-xs font-mono leading-relaxed flex items-start gap-3 shadow-[4px_4px_0px_#888]">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[#E4E3E0] uppercase tracking-wider text-[11px]">Lumina Local-First Isolation Standard</h4>
          <p className="text-slate-300 text-[10px] mt-1">
            In compliance with strict security specifications, all uploaded CSV files are parsed on-the-fly, within compiling browser memory buffer. No values or customer identifiers ever exit the container network stack.
          </p>
        </div>
      </div>

      {/* Ingestion Panel Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload portal & schema guides column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] space-y-4">
            <h3 className="font-mono font-bold text-xs uppercase text-[#141414] border-b border-[#141414]/10 pb-1">File Ingestion Hub</h3>
            
            {/* Tab selection */}
            <div className="flex gap-1 bg-[#E4E3E0] p-1 rounded-none border border-[#141414]">
              {(['sales', 'products', 'expenses'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setMessage({ status: null, text: '' });
                  }}
                  className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider transition-all rounded-none ${
                    activeTab === tab
                      ? 'bg-[#141414] text-white font-black'
                      : 'text-[#141414] hover:bg-neutral-250'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Ingestion drag-drop zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerUploadClick}
              className={`p-6 border-2 border-dashed rounded-none flex flex-col justify-center items-center text-center cursor-pointer min-h-48 transition-all font-mono ${
                dragActive 
                  ? 'border-neutral-800 bg-neutral-150' 
                  : 'border-[#141414] hover:bg-neutral-50 bg-neutral-50/50'
              }`}
            >
              <Upload className={`w-6 h-6 mb-2 text-[#141414]`} />
              <p className="text-xs font-bold uppercase tracking-widest text-[#141414]">DRAG & DROP CSV</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase">OR SEARCH LOCAL SHELF DIRECTORY</p>
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv"
                onChange={handleFileChange}
                className="hidden" 
              />
            </div>

            {/* Template Downloader */}
            <button
              onClick={() => handleDownloadTemplate(activeTab)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold text-[#141414] bg-white border border-[#141414] rounded-none hover:bg-neutral-50 shadow-[2px_2px_0px_#141414] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD SCHEMA TEMPLATE</span>
            </button>
          </div>

          {/* User Messages */}
          {message.status && (
            <div className={`p-4 rounded-none border flex items-start gap-2.5 text-xs font-mono shadow-[2px_2px_0px_#141414] ${
              message.status === 'success' 
                ? 'bg-green-50 text-green-900 border-green-600' 
                : 'bg-red-50 text-red-950 border-red-600'
            }`}>
              {message.status === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
              ) : (
                <FileWarning className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <span className="font-bold">{message.text}</span>
            </div>
          )}
        </div>

        {/* Database grid preview listing */}
        <div className="lg:col-span-2 bg-white p-4 rounded-none border border-[#141414] shadow-[4px_4px_0px_#141414] space-y-4">
          <div className="flex justify-between items-center border-b border-[#141414]/10 pb-1.5 font-mono">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#141414]" />
              <h3 className="font-bold text-xs uppercase text-[#141414]">Target Memory Table</h3>
            </div>
            <span className="font-mono text-[9px] font-bold text-white bg-[#141414] px-2 py-0.5 rounded-none">
              {activeTab === 'sales' ? `${sales.length} ROW INDEXES` : activeTab === 'products' ? `${products.length} SKU KEYS` : `${expenses.length} ACCTS`}
            </span>
          </div>

          <div className="overflow-x-auto max-h-96 border border-[#141414]">
            {activeTab === 'sales' && sales.length > 0 && (
              <table className="w-full text-left border-collapse font-mono text-[11px] text-[#141414]">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-wider font-bold text-[9px]">
                    <th className="p-2">Date</th>
                    <th className="p-2">Order ID</th>
                    <th className="p-2">Product ID</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-center">Units</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Cost</th>
                    <th className="p-2 text-right">Discount</th>
                    <th className="p-2">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {sales.slice(0, 100).map((sale, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-2 text-slate-500">{sale.date}</td>
                      <td className="p-2 font-bold text-[#141414]">#{sale.order_id}</td>
                      <td className="p-2 font-bold">PRD-{sale.product_id}</td>
                      <td className="p-2 text-slate-500 uppercase font-bold text-[9px]">{sale.category}</td>
                      <td className="p-2 text-center font-bold">{sale.units_sold}</td>
                      <td className="p-2 text-right font-semibold">${sale.unit_price}</td>
                      <td className="p-2 text-right text-slate-600">${sale.unit_cost}</td>
                      <td className="p-2 text-right text-red-600 font-bold">{sale.discount > 0 ? `-$${sale.discount}` : '—'}</td>
                      <td className="p-2 text-slate-500 uppercase">{sale.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'products' && products.length > 0 && (
              <table className="w-full text-left border-collapse font-mono text-[11px] text-[#141414]">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-wider font-bold text-[9px]">
                    <th className="p-2">ID</th>
                    <th className="p-2">Product Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-center">Stock</th>
                    <th className="p-2 text-center">Threshold</th>
                    <th className="p-2">Supplier</th>
                    <th className="p-2 text-center">Lead Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  {products.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 font-mono">
                      <td className="p-2 font-bold text-slate-600">PRD-{item.product_id}</td>
                      <td className="p-2 font-bold text-[#141414]">{item.product_name}</td>
                      <td className="p-2 text-slate-500 uppercase text-[9px] font-bold">{item.category}</td>
                      <td className="p-2 text-center text-indigo-800 font-bold">{item.current_stock}</td>
                      <td className="p-2 text-center text-slate-400">{item.reorder_point}</td>
                      <td className="p-2 text-slate-500 font-serif italic">{item.supplier}</td>
                      <td className="p-2 text-center font-bold">{item.lead_time_days} DAYS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'expenses' && expenses.length > 0 && (
              <table className="w-full text-left border-collapse font-mono text-[11px] text-[#141414]">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-wider font-bold text-[9px]">
                    <th className="p-2">Date</th>
                    <th className="p-2">Expense Category</th>
                    <th className="p-2 text-right">Debit Amt</th>
                    <th className="p-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15 font-mono">
                  {expenses.map((expense, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-2 text-slate-500">{expense.date}</td>
                      <td className="p-2 font-bold text-[#141414] uppercase">{expense.expense_type}</td>
                      <td className="p-2 text-right text-red-700 font-black">${expense.amount.toFixed(2)}</td>
                      <td className="p-2 text-slate-500 font-serif italic">{expense.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {((activeTab === 'sales' && sales.length === 0) ||
              (activeTab === 'products' && products.length === 0) ||
              (activeTab === 'expenses' && expenses.length === 0)) && (
              <div className="p-12 text-center bg-neutral-50 text-slate-500 text-xs font-mono uppercase">
                NO REGISTERED DATABASE MATRIX FOUND IN MEMORY CORRIDORS.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
