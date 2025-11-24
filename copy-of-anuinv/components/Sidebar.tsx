import React from 'react';
import { LayoutDashboard, Package, Factory, History, Sparkles } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'transactions', label: 'History', icon: History },
    { id: 'ai-assistant', label: 'AI Insights', icon: Sparkles },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col shadow-sm sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-candy-500 rounded-full flex items-center justify-center text-white font-bold">
          A
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">AnuInv</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-candy-50 text-candy-600 font-semibold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-candy-500' : 'text-gray-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-100">
        <div className="bg-gradient-to-br from-candy-100 to-purple-100 rounded-xl p-4 text-center">
          <p className="text-xs text-candy-800 font-medium mb-2">Running Low?</p>
          <button onClick={() => setView('inventory')} className="text-xs bg-white text-candy-600 px-3 py-1.5 rounded-lg shadow-sm font-semibold hover:bg-candy-50 w-full">
            Check Stock
          </button>
        </div>
      </div>
    </div>
  );
};