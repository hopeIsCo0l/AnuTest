import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryTable } from './components/InventoryTable';
import { ProductionView } from './components/ProductionView';
import { AiAssistant } from './components/AiAssistant';
import { INITIAL_INVENTORY, MAX_PRODUCTION_SLOTS } from './constants';
import { InventoryItem, Transaction, Recipe, Batch } from './types';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeBatches, setActiveBatches] = useState<Batch[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRestock = (itemId: string, amount: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: item.quantity + amount };
      }
      return item;
    }));

    const item = inventory.find(i => i.id === itemId);
    addTransaction({
        type: 'RESTOCK',
        details: `Restocked ${amount} ${item?.unit} of ${item?.name}`,
        amount
    });
  };

  // Step 1: Start Production (Deduct Raw Materials, Create Batch)
  const handleStartProduction = (recipe: Recipe, quantity: number, estimatedCost: number) => {
    if (activeBatches.length >= MAX_PRODUCTION_SLOTS) {
        return { success: false, message: 'No production slots available!' };
    }

    // 1. Check availability
    for (const ing of recipe.ingredients) {
        const item = inventory.find(i => i.id === ing.rawMaterialId);
        if (!item || item.quantity < (ing.quantity * quantity)) {
            return { success: false, message: `Not enough ${item?.name || 'material'}!` };
        }
    }

    // 2. Deduct Materials
    setInventory(prev => {
        const newInv = [...prev];
        recipe.ingredients.forEach(ing => {
            const idx = newInv.findIndex(i => i.id === ing.rawMaterialId);
            if (idx > -1) {
                newInv[idx] = { ...newInv[idx], quantity: newInv[idx].quantity - (ing.quantity * quantity) };
            }
        });
        return newInv;
    });

    // 3. Create Batch
    const newBatch: Batch = {
        id: `BATCH-${Date.now()}`,
        productId: recipe.productId,
        quantity,
        startTime: Date.now(),
        estimatedCost,
        status: 'PROCESSING'
    };
    setActiveBatches(prev => [...prev, newBatch]);

    const product = inventory.find(i => i.id === recipe.productId);
    addTransaction({
        type: 'PRODUCTION_START',
        details: `Started batch of ${quantity} ${product?.name}`,
        amount: quantity,
        batchId: newBatch.id
    });

    return { success: true, message: 'Production started successfully!' };
  };

  // Step 2: Finish Production (Add Product to Inventory, Clear Batch)
  const handleFinishBatch = (batchId: string) => {
    const batch = activeBatches.find(b => b.id === batchId);
    if (!batch) return;

    setInventory(prev => {
        const newInv = [...prev];
        const prodIdx = newInv.findIndex(i => i.id === batch.productId);
        if (prodIdx > -1) {
            newInv[prodIdx] = { ...newInv[prodIdx], quantity: newInv[prodIdx].quantity + batch.quantity };
        }
        return newInv;
    });

    setActiveBatches(prev => prev.filter(b => b.id !== batchId));

    const product = inventory.find(i => i.id === batch.productId);
    addTransaction({
        type: 'PRODUCTION_FINISH',
        details: `Completed batch ${batch.id}: ${batch.quantity} units of ${product?.name}`,
        amount: batch.quantity,
        batchId: batch.id,
        cost: batch.estimatedCost
    });
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...tx
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard inventory={inventory} transactions={transactions} />;
      case 'inventory':
        return <InventoryTable inventory={inventory} onRestock={handleRestock} />;
      case 'production':
        return (
            <ProductionView 
                inventory={inventory} 
                activeBatches={activeBatches}
                onStartProduction={handleStartProduction}
                onFinishBatch={handleFinishBatch}
            />
        );
      case 'ai-assistant':
        return <AiAssistant inventory={inventory} transactions={transactions} />;
      case 'transactions':
        return (
            <div className="space-y-3 sm:space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Transaction History</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {transactions.length === 0 && <li className="p-4 sm:p-6 text-gray-400 text-center text-sm sm:text-base">No activity recorded yet.</li>}
                        {transactions.map(tx => (
                            <li key={tx.id} className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 hover:bg-gray-50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            tx.type === 'RESTOCK' ? 'bg-blue-100 text-blue-700' : 
                                            tx.type === 'PRODUCTION_START' ? 'bg-yellow-100 text-yellow-700' :
                                            tx.type === 'PRODUCTION_FINISH' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {tx.type.replace('_', ' ')}
                                        </span>
                                        {tx.batchId && <span className="text-xs font-mono text-gray-400">#{tx.batchId.slice(-4)}</span>}
                                    </div>
                                    <span className="text-gray-700 font-medium text-sm">{tx.details}</span>
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto">
                                    <span className="block text-gray-400 text-xs">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                    {tx.cost && <span className="block text-xs font-mono text-gray-500 mt-1">Est. Cost: {tx.cost.toFixed(2)} ETB</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
      default:
        return <Dashboard inventory={inventory} transactions={transactions} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar currentView={currentView} setView={(view) => { setCurrentView(view); setSidebarOpen(false); }} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto h-screen w-full lg:w-auto">
        <div className="max-w-[1600px] mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;