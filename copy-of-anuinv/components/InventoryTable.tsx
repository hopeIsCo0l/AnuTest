import React, { useState } from 'react';
import { InventoryItem, ItemCategory, Unit } from '../types';
import { Plus, Search, AlertCircle, PackagePlus, X, Image as ImageIcon } from 'lucide-react';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onRestock: (itemId: string, amount: number) => void;
  isAdmin: boolean;
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ inventory, onRestock, isAdmin, onAddItem }) => {
  const [filter, setFilter] = useState<'ALL' | ItemCategory>('ALL');
  const [search, setSearch] = useState('');
  
  // Restock Modal State
  const [restockModal, setRestockModal] = useState<{ open: boolean; itemId: string | null }>({ open: false, itemId: null });
  const [restockAmount, setRestockAmount] = useState(0);

  // Add Item Modal State
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
      name: '',
      category: ItemCategory.RAW_MATERIAL,
      quantity: 0,
      unit: Unit.KG,
      minStock: 10,
      costPerUnit: 0,
      image: ''
  });

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

  const handleAddItemSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newItem.name && newItem.category && newItem.unit) {
          onAddItem({
              name: newItem.name,
              category: newItem.category,
              quantity: Number(newItem.quantity) || 0,
              unit: newItem.unit,
              minStock: Number(newItem.minStock) || 0,
              costPerUnit: Number(newItem.costPerUnit) || 0,
              image: newItem.image
          });
          setAddItemModalOpen(false);
          // Reset form
          setNewItem({
            name: '',
            category: ItemCategory.RAW_MATERIAL,
            quantity: 0,
            unit: Unit.KG,
            minStock: 10,
            costPerUnit: 0,
            image: ''
          });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        
        <div className="flex items-center gap-3">
             {isAdmin && (
                <button 
                    onClick={() => setAddItemModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-candy-600 text-white rounded-lg shadow-sm hover:bg-candy-700 transition-colors font-bold text-sm"
                >
                    <PackagePlus size={18} />
                    Add Item
                </button>
            )}

            <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 items-center">
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
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded-md object-cover bg-gray-100" />}
                        {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.category === ItemCategory.RAW_MATERIAL 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {item.category === ItemCategory.RAW_MATERIAL ? 'Raw Material' : 'Product'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-red-600 font-medium text-xs">
                          <AlertCircle size={14} /> Low Stock
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium text-xs">Healthy</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setRestockModal({ open: true, itemId: item.id })}
                        className="text-candy-600 hover:bg-candy-50 p-2 rounded-lg transition-colors"
                        title="Restock / Adjust"
                      >
                        <Plus size={18} />
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
                Restock {inventory.find(i => i.id === restockModal.itemId)?.name}
            </h3>
            <p className="text-gray-500 text-sm mb-6">Add new inventory arrival.</p>
            
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

      {/* Add New Item Modal (Admin Only) */}
      {addItemModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-center mb-6">
                   <div>
                        <h3 className="text-2xl font-bold text-gray-800">Add New Item</h3>
                        <p className="text-gray-500 text-sm">Create a new inventory record or product line.</p>
                   </div>
                   <button onClick={() => setAddItemModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                       <X size={24} />
                   </button>
               </div>

               <form onSubmit={handleAddItemSubmit} className="overflow-y-auto pr-2 custom-scrollbar space-y-6 flex-1">
                   {/* Category Selection */}
                   <div className="grid grid-cols-2 gap-4">
                       <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${newItem.category === ItemCategory.RAW_MATERIAL ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}>
                           <input 
                                type="radio" 
                                name="category" 
                                className="hidden" 
                                checked={newItem.category === ItemCategory.RAW_MATERIAL}
                                onChange={() => setNewItem({...newItem, category: ItemCategory.RAW_MATERIAL})} 
                           />
                           <span className="font-bold">Raw Material</span>
                           <span className="text-xs opacity-70">Ingredient for production</span>
                       </label>
                       <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${newItem.category === ItemCategory.PRODUCT ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200'}`}>
                           <input 
                                type="radio" 
                                name="category" 
                                className="hidden" 
                                checked={newItem.category === ItemCategory.PRODUCT}
                                onChange={() => setNewItem({...newItem, category: ItemCategory.PRODUCT})} 
                           />
                           <span className="font-bold">Finished Product</span>
                           <span className="text-xs opacity-70">Item for sale</span>
                       </label>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="md:col-span-2">
                           <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                           <input 
                                type="text" 
                                required
                                value={newItem.name}
                                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                placeholder={newItem.category === ItemCategory.PRODUCT ? "e.g. AnuPop" : "e.g. Hilwit"}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Unit of Measure</label>
                           <select 
                                value={newItem.unit}
                                onChange={(e) => setNewItem({...newItem, unit: e.target.value as Unit})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500 bg-gray-50 focus:bg-white"
                           >
                               <option value={Unit.KG}>Kilograms (kg)</option>
                               <option value={Unit.LITER}>Liters (L)</option>
                               <option value={Unit.UNIT}>Units (pcs)</option>
                           </select>
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Initial Stock</label>
                           <input 
                                type="number" 
                                min="0"
                                value={newItem.quantity}
                                onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500 bg-gray-50 focus:bg-white"
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Stock Alert</label>
                           <input 
                                type="number" 
                                min="0"
                                value={newItem.minStock}
                                onChange={(e) => setNewItem({...newItem, minStock: Number(e.target.value)})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500 bg-gray-50 focus:bg-white"
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">
                               {newItem.category === ItemCategory.PRODUCT ? 'Selling Price (ETB)' : 'Cost per Unit (ETB)'}
                           </label>
                           <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">ETB</span>
                               <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    value={newItem.costPerUnit}
                                    onChange={(e) => setNewItem({...newItem, costPerUnit: Number(e.target.value)})}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500 bg-gray-50 focus:bg-white"
                               />
                           </div>
                       </div>
                       
                        <div className="md:col-span-2">
                           <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (Optional)</label>
                           <div className="relative">
                               <ImageIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                               <input 
                                    type="url" 
                                    value={newItem.image}
                                    onChange={(e) => setNewItem({...newItem, image: e.target.value})}
                                    placeholder="https://..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500 bg-gray-50 focus:bg-white"
                               />
                           </div>
                       </div>
                   </div>

                   <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                        <button 
                            type="button"
                            onClick={() => setAddItemModalOpen(false)}
                            className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-3 bg-candy-600 text-white hover:bg-candy-700 rounded-xl font-bold shadow-lg shadow-candy-200 transition-colors"
                        >
                            Create Item
                        </button>
                   </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
};