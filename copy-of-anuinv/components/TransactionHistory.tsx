import React, { useState } from 'react';
import { Transaction } from '../types';
import { Search, Filter, Download, FileSpreadsheet, FileText, Printer, ArrowUpDown, Calendar, DollarSign, User } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // --- Filtering & Sorting Logic ---
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = 
        t.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.performedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm);
      const matchesType = filterType === 'ALL' || t.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

  const totalCost = filteredTransactions.reduce((acc, t) => acc + (t.cost || 0), 0);

  // --- Export Functions ---
  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Details', 'Performed By', 'Amount', 'Cost (ETB)'];
    const rows = filteredTransactions.map(t => [
      t.id,
      new Date(t.timestamp).toLocaleDateString() + ' ' + new Date(t.timestamp).toLocaleTimeString(),
      t.type,
      `"${t.details.replace(/"/g, '""')}"`, // Escape quotes
      t.performedBy || 'System',
      t.amount || 0,
      t.cost || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `anuinv_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const exportToDoc = () => {
    const tableHtml = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #fce7f3;">
            <th>Date</th>
            <th>Type</th>
            <th>Details</th>
            <th>User</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTransactions.map(t => `
            <tr>
              <td>${new Date(t.timestamp).toLocaleString()}</td>
              <td>${t.type}</td>
              <td>${t.details}</td>
              <td>${t.performedBy || 'System'}</td>
              <td>${t.cost ? 'ETB ' + t.cost.toFixed(2) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Transaction History</title></head>
      <body>
        <h1>AnuInv - Transaction Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        ${tableHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anuinv_report_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  // --- Render Helpers ---
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RESTOCK': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'PRODUCTION_START': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'PRODUCTION_FINISH': return 'bg-green-50 text-green-700 border-green-100';
      case 'ADJUSTMENT': return 'bg-gray-50 text-gray-700 border-gray-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
          <p className="text-gray-500 text-sm">Audit logs and financial records.</p>
        </div>
        
        {/* Summary Stats */}
        <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Calendar size={16} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Records</p>
                    <p className="font-bold text-gray-800">{filteredTransactions.length}</p>
                </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <DollarSign size={16} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Total Cost</p>
                    <p className="font-bold text-gray-800">ETB {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-candy-300 text-sm"
                />
            </div>
            <div className="relative">
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-candy-300 appearance-none cursor-pointer hover:bg-gray-50"
                >
                    <option value="ALL">All Types</option>
                    <option value="RESTOCK">Restock</option>
                    <option value="PRODUCTION_START">Production Start</option>
                    <option value="PRODUCTION_FINISH">Production Finish</option>
                    <option value="ADJUSTMENT">Adjustments</option>
                </select>
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
            >
                <ArrowUpDown size={16} />
                {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>

            <div className="relative">
                <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="px-4 py-2 bg-candy-600 text-white rounded-lg hover:bg-candy-700 shadow-sm flex items-center gap-2 text-sm font-bold transition-colors"
                >
                    <Download size={16} />
                    Export
                </button>
                
                {isExportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <button onClick={exportToCSV} className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                            <FileSpreadsheet size={16} className="text-green-600" /> Excel (CSV)
                        </button>
                        <button onClick={exportToDoc} className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                            <FileText size={16} className="text-blue-600" /> Word (Doc)
                        </button>
                        <button onClick={handlePrint} className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                            <Printer size={16} className="text-gray-600" /> Print / PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Transaction Type</th>
                        <th className="px-6 py-4 w-1/3">Details</th>
                        <th className="px-6 py-4">Performed By</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-right">Cost Impact</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                    <div className="font-mono text-xs">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-gray-400">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(tx.type)}`}>
                                        {tx.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-900 font-medium">{tx.details}</div>
                                    {tx.batchId && (
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">Ref: {tx.batchId}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                                            {tx.performedBy ? tx.performedBy[0] : <User size={12} />}
                                        </div>
                                        <span className="text-gray-700">{tx.performedBy || 'System'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-gray-600">
                                    {tx.amount ? tx.amount.toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-medium">
                                    {tx.cost ? (
                                        <span className="text-gray-800">ETB {tx.cost.toLocaleString()}</span>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <Search size={32} className="opacity-20" />
                                    <p>No transactions found matching your criteria.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center print:hidden">
            <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
            <span>AnuInv v2.0 - Secure Audit Log</span>
        </div>
      </div>
    </div>
  );
};