import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe, ItemCategory, Batch } from '../types';
import { RECIPES, MAX_PRODUCTION_SLOTS } from '../constants';
import { Beaker, ChevronRight, CheckCircle2, XCircle, Play, Calculator, Timer, PackageCheck, Loader2 } from 'lucide-react';

interface ProductionViewProps {
  inventory: InventoryItem[];
  activeBatches: Batch[];
  onStartProduction: (recipe: Recipe, quantity: number, estimatedCost: number) => { success: boolean; message: string };
  onFinishBatch: (batchId: string) => void;
}

export const ProductionView: React.FC<ProductionViewProps> = ({ inventory, activeBatches, onStartProduction, onFinishBatch }) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [produceQty, setProduceQty] = useState<number>(10);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const products = inventory.filter(i => i.category === ItemCategory.PRODUCT);

  const handleProduce = () => {
    if (!selectedProduct) return;
    const recipe = RECIPES.find(r => r.productId === selectedProduct);
    if (!recipe) return;
    
    const cost = calculateBatchCost(recipe, produceQty);

    const result = onStartProduction(recipe, produceQty, cost);
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    
    if (result.success) {
        setTimeout(() => setFeedback(null), 3000);
    }
  };

  const calculateBatchCost = (recipe: Recipe, qty: number) => {
    let totalCost = 0;
    recipe.ingredients.forEach(ing => {
        const item = inventory.find(i => i.id === ing.rawMaterialId);
        if (item) {
            totalCost += (ing.quantity * qty) * item.costPerUnit;
        }
    });
    return totalCost;
  };

  const getRecipeDetails = (productId: string) => {
    const recipe = RECIPES.find(r => r.productId === productId);
    if (!recipe) return { ingredients: [], processTime: 0 };
    
    const ingredients = recipe.ingredients.map(ing => {
        const item = inventory.find(i => i.id === ing.rawMaterialId);
        return {
            name: item?.name || 'Unknown',
            needed: ing.quantity,
            current: item?.quantity || 0,
            unit: item?.unit,
            costPerUnit: item?.costPerUnit || 0,
            hasEnough: (item?.quantity || 0) >= (ing.quantity * produceQty)
        };
    });
    return { ingredients, processTime: recipe.processTimeMinutes };
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const { ingredients: ingredientsStatus, processTime } = selectedProduct ? getRecipeDetails(selectedProduct) : { ingredients: [], processTime: 0 };
  const canProduce = ingredientsStatus.every(i => i.hasEnough) && activeBatches.length < MAX_PRODUCTION_SLOTS;
  const batchCost = selectedProduct && selectedProductData ? calculateBatchCost(RECIPES.find(r => r.productId === selectedProduct)!, produceQty) : 0;
  const unitCost = batchCost / produceQty;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* LEFT: Product Selection */}
      <div className="w-full lg:w-1/4 space-y-3 sm:space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">1. Select Product</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 max-h-[300px] sm:max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => { setSelectedProduct(product.id); setFeedback(null); }}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group relative ${
                selectedProduct === product.id
                  ? 'bg-candy-50 border-candy-300 ring-2 ring-candy-200'
                  : 'bg-white border-gray-200 hover:border-candy-200 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`font-bold text-sm ${selectedProduct === product.id ? 'text-candy-800' : 'text-gray-800'}`}>
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500">Current Stock: {product.quantity}</p>
                </div>
                <ChevronRight size={16} className={`text-gray-300 group-hover:text-candy-400 ${selectedProduct === product.id ? 'text-candy-500' : ''}`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CENTER: Configuration & Costing */}
      <div className="w-full lg:w-2/4 flex flex-col gap-4 sm:gap-6">
        {selectedProduct && selectedProductData ? (
            <>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">2. Configure Batch</h2>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-mono font-bold text-base sm:text-lg">
                        {produceQty} Units
                    </div>
                </div>

                {/* Quantity Slider */}
                <div className="mb-6 sm:mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size</label>
                    <input 
                        type="range" 
                        min="5" 
                        max="200" 
                        step="5"
                        value={produceQty}
                        onChange={(e) => setProduceQty(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-candy-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>5 units</span>
                        <span>200 units</span>
                    </div>
                </div>

                {/* Cost & Material Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                             <Calculator size={14} /> Cost Analysis
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                                <span className="text-sm text-gray-600">Raw Materials</span>
                                <span className="font-mono font-medium">{batchCost.toFixed(2)} ETB</span>
                            </div>
                             <div className="flex justify-between items-end">
                                <span className="text-sm text-gray-600">Est. Cost / Unit</span>
                                <span className="font-mono font-bold text-candy-600">{unitCost.toFixed(2)} ETB</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                             <Timer size={14} /> Workflow
                        </h4>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Estimated Time:</span>
                            <span className="font-medium text-gray-900">{processTime} mins</span>
                        </div>
                         <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                            <span>Ingredients Check:</span>
                            <span className={ingredientsStatus.every(i => i.hasEnough) ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {ingredientsStatus.every(i => i.hasEnough) ? "Ready" : "Missing Items"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ingredient List */}
                <div className="mt-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Required Ingredients</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {ingredientsStatus.map((ing, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                    {ing.hasEnough ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                                    <span className="text-gray-700">{ing.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-400">{(ing.needed * produceQty * ing.costPerUnit).toFixed(2)} ETB</span>
                                    <span className="font-mono text-gray-600 w-24 text-right">
                                        {(ing.needed * produceQty).toFixed(1)} / {ing.current}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                     {feedback && (
                        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {feedback.message}
                        </div>
                    )}
                    <button
                        onClick={handleProduce}
                        disabled={!canProduce}
                        className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
                            canProduce 
                            ? 'bg-candy-600 text-white hover:bg-candy-700 shadow-lg shadow-candy-200' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {activeBatches.length >= MAX_PRODUCTION_SLOTS ? (
                            <>Slots Full</>
                        ) : (
                            <><Play size={20} fill="currentColor" /> Start Production</>
                        )}
                    </button>
                </div>
            </div>
            </>
        ) : (
             <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <Beaker size={48} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-400">Select a Product</h3>
                <p className="text-gray-400">Configure your batch and costs.</p>
            </div>
        )}
      </div>

      {/* RIGHT: Production Slots / Visualization */}
      <div className="w-full lg:w-1/4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">3. Production Slots</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            {Array.from({ length: MAX_PRODUCTION_SLOTS }).map((_, index) => {
                const batch = activeBatches[index];
                const product = batch ? inventory.find(i => i.id === batch.productId) : null;
                
                return (
                    <div key={index} className={`relative rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 transition-all ${
                        batch 
                        ? 'bg-white border-candy-200 shadow-sm' 
                        : 'bg-gray-50 border-dashed border-gray-200'
                    }`}>
                        <div className="absolute top-3 right-3 text-xs font-bold text-gray-300">
                            SLOT {index + 1}
                        </div>

                        {batch && product ? (
                            <div className="pt-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-candy-100 flex items-center justify-center text-candy-600">
                                        <Loader2 size={20} className="animate-spin" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">{product.name}</h4>
                                        <p className="text-xs text-gray-500">Batch #{batch.id.slice(-4)} • {batch.quantity} units</p>
                                    </div>
                                </div>
                                
                                {/* Workflow Visualization */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs font-medium text-gray-500">
                                        <span>Processing</span>
                                        <span>Mixing...</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-candy-500 h-full rounded-full animate-pulse w-2/3"></div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-2">
                                    <span className="text-xs font-mono text-gray-400">
                                        Cost: {batch.estimatedCost.toFixed(2)} ETB
                                    </span>
                                    <button 
                                        onClick={() => onFinishBatch(batch.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                                    >
                                        <PackageCheck size={14} /> Finish
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 flex flex-col items-center justify-center text-gray-300">
                                <span className="text-sm font-medium">Empty Slot</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};