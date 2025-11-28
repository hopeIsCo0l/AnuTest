import React, { useState } from 'react';
import { InventoryItem, ItemCategory, Recipe, Unit } from '../types';
import { Save, RotateCcw, Trash2, ShieldCheck, DollarSign, Users, MoreHorizontal, Package, Edit, Plus, X, ChevronsRight, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  inventory: InventoryItem[];
  recipes: Recipe[];
  onUpdateCost: (id: string, newCost: number) => void;
  onUpdateProduct: (item: InventoryItem) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onResetSystem: () => void;
  onClearHistory: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  inventory, 
  recipes,
  onUpdateCost, 
  onUpdateProduct,
  onDeleteProduct,
  onUpdateRecipe,
  onResetSystem, 
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PRODUCTS'>('GENERAL');
  const [editingCosts, setEditingCosts] = useState<{ [key: string]: string }>({});
  
  // Product Editor State
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const rawMaterials = inventory.filter(i => i.category === ItemCategory.RAW_MATERIAL);
  const products = inventory.filter(i => i.category === ItemCategory.PRODUCT);

  // Mock Staff Data
  const [staff] = useState([
    { id: 1, name: 'Admin User', role: 'Administrator', email: 'admin@anuinv.com', lastActive: 'Now' },
    { id: 2, name: 'Factory Supervisor', role: 'Manager', email: 'user@anuinv.com', lastActive: '2m ago' },
    { id: 3, name: 'John Doe', role: 'Operator', email: 'john@anuinv.com', lastActive: '1d ago' },
  ]);

  const handleCostChange = (id: string, value: string) => {
    setEditingCosts(prev => ({ ...prev, [id]: value }));
  };

  const saveCost = (id: string) => {
    const val = parseFloat(editingCosts[id]);
    if (!isNaN(val) && val >= 0) {
      onUpdateCost(id, val);
      const newEdits = { ...editingCosts };
      delete newEdits[id];
      setEditingCosts(newEdits);
    }
  };

  const startEditProduct = (product: InventoryItem) => {
      setEditingProduct({...product});
      const existingRecipe = recipes.find(r => r.productId === product.id);
      setEditingRecipe(existingRecipe ? JSON.parse(JSON.stringify(existingRecipe)) : {
          productId: product.id,
          processTimeMinutes: 30,
          ingredients: []
      });
  };

  const handleSaveProduct = () => {
      if (editingProduct) {
          onUpdateProduct(editingProduct);
      }
      if (editingRecipe) {
          onUpdateRecipe(editingRecipe);
      }
      setEditingProduct(null);
      setEditingRecipe(null);
  };

  const toggleIngredient = (rawMatId: string) => {
      if (!editingRecipe) return;
      const exists = editingRecipe.ingredients.find(i => i.rawMaterialId === rawMatId);
      if (exists) {
          setEditingRecipe({
              ...editingRecipe,
              ingredients: editingRecipe.ingredients.filter(i => i.rawMaterialId !== rawMatId)
          });
      } else {
          setEditingRecipe({
              ...editingRecipe,
              ingredients: [...editingRecipe.ingredients, { rawMaterialId: rawMatId, quantity: 1 }]
          });
      }
  };

  const updateIngredientQty = (rawMatId: string, qty: number) => {
      if (!editingRecipe) return;
      setEditingRecipe({
          ...editingRecipe,
          ingredients: editingRecipe.ingredients.map(i => 
            i.rawMaterialId === rawMatId ? { ...i, quantity: qty } : i
          )
      });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
            <ShieldCheck size={40} className="text-candy-300" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Admin Console</h2>
            <p className="text-gray-400 mt-1">System Configuration & Master Data Management</p>
          </div>
        </div>
        <div className="flex gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
            <button 
                onClick={() => setActiveTab('GENERAL')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'GENERAL' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-300 hover:text-white'}`}
            >
                General
            </button>
            <button 
                onClick={() => setActiveTab('PRODUCTS')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'PRODUCTS' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-300 hover:text-white'}`}
            >
                Product Management
            </button>
        </div>
      </div>

      {activeTab === 'GENERAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Financials */}
            <div className="lg:col-span-2 space-y-8">
                {/* Market Rates Editor */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <DollarSign size={20} className="text-green-600" />
                                Material Cost Configuration
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Base costs in ETB. Updates reflect in production immediately.</p>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                            <tr>
                            <th className="px-6 py-4">Material Name</th>
                            <th className="px-6 py-4">Current Rate (ETB)</th>
                            <th className="px-6 py-4">Update Rate</th>
                            <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rawMaterials.map(item => {
                            const isEditing = editingCosts[item.id] !== undefined;
                            return (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-700">{item.name}</td>
                                <td className="px-6 py-4 text-gray-500 font-mono">ETB {item.costPerUnit.toFixed(2)}</td>
                                <td className="px-6 py-2">
                                    <input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    placeholder={item.costPerUnit.toString()}
                                    value={isEditing ? editingCosts[item.id] : ''}
                                    onChange={(e) => handleCostChange(item.id, e.target.value)}
                                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-candy-500 font-mono text-sm bg-gray-50 focus:bg-white"
                                    />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                    onClick={() => saveCost(item.id)}
                                    disabled={!isEditing}
                                    className={`p-2 rounded-lg transition-all ${
                                        isEditing 
                                        ? 'bg-candy-600 text-white hover:bg-candy-700 shadow-md' 
                                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    }`}
                                    >
                                    <Save size={18} />
                                    </button>
                                </td>
                                </tr>
                            );
                            })}
                        </tbody>
                        </table>
                    </div>
                </div>

                {/* Staff Management (Visual Only) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Users size={20} className="text-blue-600" />
                                Authorized Personnel
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Manage access control and roles.</p>
                        </div>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {staff.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{s.name}</div>
                                        <div className="text-xs text-gray-500">{s.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${s.role === 'Administrator' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {s.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{s.lastActive}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Column - System Actions */}
            <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <RotateCcw size={20} className="text-orange-600" />
                    Danger Zone
                </h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Actions here are irreversible. Please proceed with caution during production hours.
                </p>

                <div className="space-y-4">
                    <button 
                    onClick={() => {
                        if(window.confirm('Are you sure? This will delete all transaction history.')) {
                            onClearHistory();
                        }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-yellow-50 text-gray-700 hover:text-yellow-700 rounded-xl transition-all border border-gray-200 hover:border-yellow-200 group shadow-sm"
                    >
                    <div className="flex flex-col items-start">
                        <span className="font-bold">Clear History</span>
                        <span className="text-xs opacity-70">Wipe transaction logs</span>
                    </div>
                    <Trash2 size={18} className="text-gray-400 group-hover:text-yellow-600" />
                    </button>

                    <button 
                    onClick={() => {
                        if(window.confirm('WARNING: This will reset all inventory levels and history to default. Continue?')) {
                            onResetSystem();
                        }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors border border-red-200 group shadow-sm"
                    >
                    <div className="flex flex-col items-start">
                        <span className="font-bold">Factory Reset</span>
                        <span className="text-xs opacity-70">Restore default state</span>
                    </div>
                    <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>
            
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
                <h4 className="font-bold text-blue-800 mb-2">System Status</h4>
                <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex justify-between">
                        <span>Database</span>
                        <span className="font-bold text-green-600">Connected</span>
                    </div>
                    <div className="flex justify-between">
                        <span>API Latency</span>
                        <span className="font-mono">24ms</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Version</span>
                        <span className="font-mono">2.0.1</span>
                    </div>
                </div>
            </div>
            </div>
        </div>
      )}

      {activeTab === 'PRODUCTS' && (
          <div className="grid grid-cols-1 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Package size={20} className="text-purple-600" />
                                Product Catalog & Recipes
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Manage product details and formulation.</p>
                        </div>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Product Name</th>
                            <th className="px-6 py-4">Selling Price (ETB)</th>
                            <th className="px-6 py-4">Stock / Min</th>
                            <th className="px-6 py-4">Recipe Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => {
                            const recipe = recipes.find(r => r.productId === product.id);
                            const hasRecipe = recipe && recipe.ingredients.length > 0;
                            return (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-800">{product.name}</td>
                                    <td className="px-6 py-4 font-mono">ETB {product.costPerUnit.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-gray-500">{product.quantity} / {product.minStock}</td>
                                    <td className="px-6 py-4">
                                        {hasRecipe ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">No Ingredients</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => startEditProduct(product)}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="Edit Product & Recipe"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm(`Delete ${product.name}? This cannot be undone.`)) {
                                                    onDeleteProduct(product.id);
                                                }
                                            }}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* PRODUCT & RECIPE EDIT MODAL */}
      {editingProduct && editingRecipe && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <div>
                         <h3 className="text-2xl font-bold text-gray-800">Edit Product: {editingProduct.name}</h3>
                         <p className="text-gray-500 text-sm">Update product details and production recipe.</p>
                     </div>
                     <button onClick={() => { setEditingProduct(null); setEditingRecipe(null); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                         <X size={24} className="text-gray-500" />
                     </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* LEFT: Product Details */}
                         <div className="space-y-6">
                             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Product Settings</h4>
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                                 <input 
                                    type="text" 
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500"
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Selling Price (ETB)</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.costPerUnit}
                                        onChange={(e) => setEditingProduct({...editingProduct, costPerUnit: parseFloat(e.target.value)})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500"
                                    />
                                 </div>
                                 <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Min Stock Level</label>
                                    <input 
                                        type="number" 
                                        value={editingProduct.minStock}
                                        onChange={(e) => setEditingProduct({...editingProduct, minStock: parseFloat(e.target.value)})}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500"
                                    />
                                 </div>
                             </div>
                         </div>

                         {/* RIGHT: Recipe Editor */}
                         <div className="space-y-6">
                             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Production Recipe</h4>
                             
                             <div>
                                 <label className="block text-sm font-bold text-gray-700 mb-2">Processing Time (Minutes)</label>
                                 <input 
                                    type="number" 
                                    value={editingRecipe.processTimeMinutes}
                                    onChange={(e) => setEditingRecipe({...editingRecipe, processTimeMinutes: parseInt(e.target.value)})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-candy-500"
                                 />
                             </div>

                             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                 <h5 className="text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                                     <span>Ingredients Configuration</span>
                                     <span className="text-xs font-normal text-gray-500">Select raw materials needed</span>
                                 </h5>
                                 <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                     {rawMaterials.map(rm => {
                                         const ing = editingRecipe.ingredients.find(i => i.rawMaterialId === rm.id);
                                         const isSelected = !!ing;
                                         return (
                                             <div key={rm.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSelected ? 'bg-white border-candy-200 shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                                                 <div className="flex items-center gap-3 flex-1">
                                                     <input 
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleIngredient(rm.id)}
                                                        className="w-5 h-5 text-candy-600 rounded focus:ring-candy-500 cursor-pointer"
                                                     />
                                                     <div>
                                                         <span className={`text-sm block ${isSelected ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{rm.name}</span>
                                                         <span className="text-xs text-gray-400">In Stock: {rm.quantity} {rm.unit}</span>
                                                     </div>
                                                 </div>
                                                 {isSelected && (
                                                     <div className="flex items-center gap-2">
                                                         <label className="text-xs font-bold text-gray-500 uppercase mr-1">Qty:</label>
                                                         <div className="relative">
                                                            <input 
                                                                type="number"
                                                                step="0.001"
                                                                min="0.001"
                                                                value={ing.quantity}
                                                                onChange={(e) => updateIngredientQty(rm.id, parseFloat(e.target.value))}
                                                                className="w-24 px-3 py-1.5 text-right border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-candy-500 focus:outline-none"
                                                            />
                                                         </div>
                                                         <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1.5 rounded-md min-w-[2.5rem] text-center">
                                                             {rm.unit}
                                                         </span>
                                                     </div>
                                                 )}
                                             </div>
                                         );
                                     })}
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                     <button 
                        onClick={() => { setEditingProduct(null); setEditingRecipe(null); }}
                        className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                     >
                         Cancel
                     </button>
                     <button 
                        onClick={handleSaveProduct}
                        className="px-6 py-3 bg-candy-600 text-white font-bold rounded-xl hover:bg-candy-700 shadow-lg shadow-candy-200 transition-colors"
                     >
                         Save Changes
                     </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};