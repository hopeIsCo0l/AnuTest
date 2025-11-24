import React, { useState } from 'react';
import { InventoryItem, ItemCategory, Unit } from '../types';
import { Plus, Search, AlertCircle } from 'lucide-react';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onRestock: (itemId: string, amount: number) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ inventory, onRestock }) => {
  const [filter, setFilter] = useState<'ALL' | ItemCategory>('ALL');
  const [search, setSearch] = useState('');
  const [restockModal, setRestockModal] = useState<{ open: boolean; itemId: string | null }>({ open: false, itemId: null });
  const [restockAmount, setRestockAmount] = useState(0);

  const filteredInventory = inventory.filter(item => {
    const matchesFilter = filter === 'ALL' || item.category === filter;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restockModal.itemId && restockAmount > 0) {
      onRestock(restockModal.itemId, restockAmount);
      setRestockModal({ open: false, itemId: null });
      setRestockAmount(0);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Inventory Management</h2>
        
        <div className="flex gap-1 sm:gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter(ItemCategory.RAW_MATERIAL)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === ItemCategory.RAW_MATERIAL ? 'bg-candy-50 text-candy-700' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Raw Materials
          </button>
          <button 
            onClick={() => setFilter(ItemCategory.PRODUCT)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === ItemCategory.PRODUCT ? 'bg-purple-50 text-purple-700' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Finished Goods
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex gap-3 sm:gap-4 items-center">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text" 
                placeholder="Search items..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-candy-300 focus:border-transparent text-sm"
             />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4">Item Name</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">Category</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">Quantity</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">Unit</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="sm:hidden text-xs text-gray-500 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            item.category === ItemCategory.RAW_MATERIAL 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {item.category === ItemCategory.RAW_MATERIAL ? 'Raw Material' : 'Product'}
                          </span>
                          <span className="ml-2 text-gray-400">{item.unit}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.category === ItemCategory.RAW_MATERIAL 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {item.category === ItemCategory.RAW_MATERIAL ? 'Raw Material' : 'Product'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono">{item.quantity}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 hidden md:table-cell">{item.unit}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-red-600 font-medium text-xs">
                          <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Low Stock</span>
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium text-xs"><span className="hidden sm:inline">Healthy</span><span className="sm:hidden">✓</span></span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <button 
                        onClick={() => setRestockModal({ open: true, itemId: item.id })}
                        className="text-candy-600 hover:bg-candy-50 p-1.5 sm:p-2 rounded-lg transition-colors"
                        title="Restock / Adjust"
                      >
                        <Plus size={16} className="sm:w-4 sm:h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredInventory.length === 0 && (
            <div className="p-12 text-center text-gray-400">
                No items found matching your criteria.
            </div>
        )}
      </div>

      {/* Simple Restock Modal */}
      {restockModal.open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                Restock {inventory.find(i => i.id === restockModal.itemId)?.name}
            </h3>
            <p className="text-gray-500 text-sm mb-4 sm:mb-6">Add new inventory arrival.</p>
            
            <form onSubmit={handleRestockSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Add</label>
                    <input 
                        type="number" 
                        min="1"
                        required
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-candy-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-3 justify-end">
                    <button 
                        type="button"
                        onClick={() => setRestockModal({ open: false, itemId: null })}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-candy-600 text-white hover:bg-candy-700 rounded-lg font-medium"
                    >
                        Confirm Restock
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
