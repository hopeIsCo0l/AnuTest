import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryTable } from './components/InventoryTable';
import { ProductionView } from './components/ProductionView';
import { AdminDashboard } from './components/AdminDashboard';
import { TransactionHistory } from './components/TransactionHistory'; // Import
import { LoginPage } from './components/LoginPage';
import { INITIAL_INVENTORY, MAX_PRODUCTION_SLOTS, RECIPES } from './constants';
import { InventoryItem, Transaction, Recipe, Batch, User, ItemCategory } from './types';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [currentView, setCurrentView] = useState('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [recipes, setRecipes] = useState<Recipe[]>(RECIPES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeBatches, setActiveBatches] = useState<Batch[]>([]);

  // --- AUTH HANDLERS ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  // --- CORE LOGIC ---
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

  const handleAddItem = (newItem: Omit<InventoryItem, 'id'>) => {
      const prefix = newItem.category === ItemCategory.RAW_MATERIAL ? 'rm' : 'p';
      const id = `${prefix}_${Date.now()}`;
      
      const itemWithId: InventoryItem = { ...newItem, id };
      
      setInventory(prev => [...prev, itemWithId]);
      
      // If it's a product, we initialize an empty recipe placeholder if one doesn't exist
      if (newItem.category === ItemCategory.PRODUCT) {
          const hasRecipe = recipes.some(r => r.productId === id);
          if (!hasRecipe) {
             setRecipes(prev => [...prev, { productId: id, processTimeMinutes: 30, ingredients: [] }]);
          }
      }

      addTransaction({
          type: 'ADJUSTMENT',
          details: `Created new item: ${newItem.name} (${newItem.category})`,
          amount: newItem.quantity
      });
  };

  const handleStartProduction = (recipe: Recipe, quantity: number, estimatedCost: number) => {
    if (!recipe || !recipe.ingredients) {
        return { success: false, message: 'Invalid recipe data.' };
    }

    if (activeBatches.length >= MAX_PRODUCTION_SLOTS) {
        return { success: false, message: 'No production slots available!' };
    }

    for (const ing of recipe.ingredients) {
        const item = inventory.find(i => i.id === ing.rawMaterialId);
        if (!item || item.quantity < (ing.quantity * quantity)) {
            return { success: false, message: `Not enough ${item?.name || 'material'}!` };
        }
    }

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
        details: `Completed batch ${batch.quantity} units of ${product?.name}`,
        amount: batch.quantity,
        batchId: batch.id,
        cost: batch.estimatedCost
    });
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp' | 'performedBy'>) => {
    const newTx: Transaction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        performedBy: currentUser?.name || 'System',
        ...tx
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // --- ADMIN FUNCTIONS ---
  const handleUpdateCost = (id: string, newCost: number) => {
      setInventory(prev => prev.map(item => 
          item.id === id ? { ...item, costPerUnit: newCost } : item
      ));
      addTransaction({
          type: 'ADJUSTMENT',
          details: `Updated cost for item ${id} to ETB ${newCost}`,
      });
  };

  const handleUpdateProduct = (updatedItem: InventoryItem) => {
      setInventory(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
      ));
      addTransaction({ type: 'ADJUSTMENT', details: `Updated details for ${updatedItem.name}` });
  };

  const handleDeleteProduct = (id: string) => {
      setInventory(prev => prev.filter(item => item.id !== id));
      setRecipes(prev => prev.filter(r => r.productId !== id));
      addTransaction({ type: 'ADJUSTMENT', details: `Deleted product ${id}` });
  };

  const handleUpdateRecipe = (updatedRecipe: Recipe) => {
      setRecipes(prev => {
          const existingIndex = prev.findIndex(r => r.productId === updatedRecipe.productId);
          if (existingIndex > -1) {
              const newRecipes = [...prev];
              newRecipes[existingIndex] = updatedRecipe;
              return newRecipes;
          } else {
              return [...prev, updatedRecipe];
          }
      });
      addTransaction({ type: 'ADJUSTMENT', details: `Updated recipe configuration for product ${updatedRecipe.productId}` });
  };

  const handleResetSystem = () => {
      setInventory(INITIAL_INVENTORY);
      setTransactions([]);
      setActiveBatches([]);
      setRecipes(RECIPES);
      addTransaction({ type: 'ADJUSTMENT', details: 'System reset to factory defaults.' });
  };

  const handleClearHistory = () => {
      setTransactions([]);
  };

  // --- RENDER VIEW LOGIC ---
  const renderContent = () => {
    if (!currentUser) return <LoginPage onLogin={handleLogin} />;

    switch (currentView) {
      case 'dashboard':
        return (
            <Dashboard 
                inventory={inventory} 
                transactions={transactions} 
                isAdmin={currentUser.role === 'ADMIN'}
            />
        );
      case 'inventory':
        return (
            <InventoryTable 
                inventory={inventory} 
                onRestock={handleRestock} 
                isAdmin={currentUser.role === 'ADMIN'}
                onAddItem={handleAddItem}
            />
        );
      case 'production':
        return (
          <ProductionView 
            inventory={inventory}
            activeBatches={activeBatches}
            recipes={recipes}
            onStartProduction={handleStartProduction}
            onFinishBatch={handleFinishBatch}
          />
        );
      case 'transactions':
          return (
             <TransactionHistory transactions={transactions} />
          );
      case 'admin':
        return currentUser.role === 'ADMIN' ? (
          <AdminDashboard 
            inventory={inventory}
            recipes={recipes}
            onUpdateCost={handleUpdateCost}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateRecipe={handleUpdateRecipe}
            onResetSystem={handleResetSystem}
            onClearHistory={handleClearHistory}
          />
        ) : (
          <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>
        );
      default:
        return <div>View Not Found</div>;
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
      {currentUser && (
        <Sidebar 
            currentView={currentView} 
            setView={setCurrentView} 
            currentUser={currentUser}
            onLogout={handleLogout}
        />
      )}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
