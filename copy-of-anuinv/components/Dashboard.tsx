import React from 'react';
import { InventoryItem, ItemCategory, Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, Package } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, transactions }) => {
  const rawMaterials = inventory.filter(i => i.category === ItemCategory.RAW_MATERIAL);
  const products = inventory.filter(i => i.category === ItemCategory.PRODUCT);

  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);
  const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * (item.costPerUnit || 0)), 0);
  // Use 'PRODUCTION_FINISH' to match the Transaction type definition instead of 'PRODUCTION'
  const totalProduction = transactions.filter(t => t.type === 'PRODUCTION_FINISH').length;

  const chartData = products.map(p => ({
    name: p.name.split('(')[0].trim(),
    Stock: p.quantity,
    Min: p.minStock
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Factory Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{lowStockItems.length}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-500">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Items below threshold</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Est. Inventory Value</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalValue.toLocaleString()} ETB</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-500">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Raw + Finished Goods</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Production Runs</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalProduction}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Total batches made</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Products</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{products.length}</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
              <Package size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Varieties of candy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Finished Goods Levels</h3>
            <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={12} tickMargin={10} stroke="#9ca3af" />
                        <YAxis fontSize={12} stroke="#9ca3af" />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#fdf2f8' }}
                        />
                        <Bar dataKey="Stock" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Min" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Low Stock List */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Critical Low Stock</h3>
            <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-64 sm:max-h-80 pr-2">
                {lowStockItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">All stock levels healthy!</div>
                ) : (
                    lowStockItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                            <div>
                                <p className="font-medium text-gray-800">{item.name}</p>
                                <p className="text-xs text-red-600 font-medium">Current: {item.quantity} {item.unit}</p>
                            </div>
                            <div className="text-xs bg-white text-red-600 px-2 py-1 rounded border border-red-100 font-bold">
                                Min: {item.minStock}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};