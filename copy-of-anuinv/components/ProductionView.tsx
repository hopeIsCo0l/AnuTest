import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe, ItemCategory, Batch } from '../types';
import { MAX_PRODUCTION_SLOTS } from '../constants';
import { Beaker, ChevronRight, CheckCircle2, XCircle, Play, Calculator, Timer, PackageCheck, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProductionViewProps {
  inventory: InventoryItem[];
  activeBatches: Batch[];
  recipes: Recipe[];
  onStartProduction: (recipe: Recipe, quantity: number, estimatedCost: number) => { success: boolean; message: string };
  onFinishBatch: (batchId: string) => void;
}

export const ProductionView: React.FC<ProductionViewProps> = ({ inventory, activeBatches, recipes, onStartProduction, onFinishBatch }) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [produceQty, setProduceQty] = useState<number>(10);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const products = inventory.filter(i => i.category === ItemCategory.PRODUCT);

  const handleProduce = () => {
    if (!selectedProduct) return;
    const recipe = recipes.find(r => r.productId === selectedProduct);
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        setFeedback({ type: 'error', message: 'No valid recipe found for this product.' });
        return;
    }
    
    const cost = calculateBatchCost(recipe, produceQty);

    const result = onStartProduction(recipe, produceQty, cost);
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    
    if (result.success) {
        setTimeout(() => setFeedback(null), 3000);
    }
  };

  const calculateBatchCost = (recipe: Recipe | undefined, qty: number) => {
    if (!recipe || !recipe.ingredients) return 0;
    
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
    const recipe = recipes.find(r => r.productId === productId);
    if (!recipe || !recipe.ingredients) return { ingredients: [], processTime: 0, hasRecipe: false };
    
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
    return { ingredients, processTime: recipe.processTimeMinutes, hasRecipe: true };
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);
  const { ingredients: ingredientsStatus, processTime, hasRecipe } = selectedProduct ? getRecipeDetails(selectedProduct) : { ingredients: [], processTime: 0, hasRecipe: false };
  
  const canProduce = hasRecipe && ingredientsStatus.length > 0 && ingredientsStatus.every(i => i.hasEnough) && activeBatches.length < MAX_PRODUCTION_SLOTS;
  
  const currentRecipe = selectedProduct ? recipes.find(r => r.productId === selectedProduct) : undefined;
  const batchCost = calculateBatchCost(currentRecipe, produceQty);
  const unitCost = produceQty > 0 ? batchCost / produceQty : 0;

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6">
      {/* LEFT: Product Selection */}
      <div className="w-full xl:w-1/4 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">1. Select Product</h2>
        <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
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

        {/* Active Batches Mini View (for context) */}
        <div className="mt-8 pt-6 border-t border-gray-200">
           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Active Lines ({activeBatches.length}/{MAX_PRODUCTION_SLOTS})</h3>
           <div className="space-y-3">
             {activeBatches.map(batch => {
               const p = inventory.find(i => i.id === batch.productId);
               return (
                 <div key={batch.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800">{p?.name}</span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Running</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Batch #{batch.id.slice(-4)}</span>
                        <span>{batch.quantity} units</span>
                    </div>
                    <button 
                        onClick={() => onFinishBatch(batch.id)}
                        className="mt-2 w-full py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-bold transition-colors"
                    >
                        Mark Complete
                    </button>
                 </div>
               )
             })}
             {activeBatches.length === 0 && (
                 <p className="text-xs text-gray-400 italic">No active production lines.</p>
             )}
           </div>
        </div>
      </div>

      {/* CENTER: Configuration & Costing */}
      <div className="w-full xl:w-2/4 flex flex-col gap-6">
        {selectedProduct && selectedProductData ? (
            <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">2. Configure Batch</h2>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-mono font-bold text-lg">
                        {produceQty} Units
                    </div>
                </div>

                {hasRecipe ? (
                    <>
                        {/* Quantity Slider */}
                        <div className="mb-8">
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
                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden mb-6">
                            <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                                    <Calculator size={14} /> Batch Cost Breakdown
                                </h4>
                                <span className="text-xs font-mono text-gray-500">Ref: {currentRecipe?.productId}</span>
                            </div>
                            
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 font-medium border-b border-gray-200 bg-gray-50/50">
                                    <tr>
                                        <th className="px-4 py-2">Ingredient</th>
                                        <th className="px-4 py-2 text-right">Qty Used</th>
                                        <th className="px-4 py-2 text-right">Rate</th>
                                        <th className="px-4 py-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {ingredientsStatus.map((ing, idx) => {
                                        const subtotal = ing.needed * produceQty * ing.costPerUnit;
                                        return (
                                            <tr key={idx} className={!ing.hasEnough ? "bg-red-50" : ""}>
                                                <td className="px-4 py-2 font-medium text-gray-700 flex items-center gap-2">
                                                     {!ing.hasEnough && <AlertTriangle size={12} className="text-red-500" />}
                                                     {ing.name}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono text-gray-600">
                                                    {(ing.needed * produceQty).toFixed(2)} {ing.unit}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono text-gray-400 text-xs">
                                                    {ing.costPerUnit.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono font-medium text-gray-800">
                                                    {subtotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-100 border-t border-gray-200 font-bold">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right text-gray-600">Total Est. Cost</td>
                                        <td className="px-4 py-3 text-right text-candy-600 font-mono text-base">
                                            ETB {batchCost.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Workflow Status */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Production Time</h4>
                                <p className="text-gray-800 font-medium flex items-center gap-2">
                                    <Timer size={16} className="text-candy-500" /> 
                                    {processTime} Minutes / Batch
                                </p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stock Status</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ingredientsStatus.every(i => i.hasEnough) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                    {ingredientsStatus.every(i => i.hasEnough) ? "Ready to Produce" : "Insufficient Materials"}
                                </span>
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
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <AlertTriangle size={32} className="text-yellow-400 mb-2" />
                        <h4 className="font-bold text-gray-700">No Recipe Defined</h4>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">This product has no ingredients configured. Please ask an Admin to set up the recipe in the Admin Console.</p>
                    </div>
                )}
            </div>
            </>
        ) : (
             <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <Beaker size={48} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">Ready to Produce?</h3>
                <p className="text-gray-500 max-w-sm mt-2">Select a product from the list on the left to configure a production batch.</p>
             </div>
        )}
      </div>
      
      {/* RIGHT: Slot Visualization */}
      <div className="w-full xl:w-1/4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Production Floor</h2>
        <div className="space-y-4">
             {[...Array(MAX_PRODUCTION_SLOTS)].map((_, idx) => {
                 const batch = activeBatches[idx];
                 return (
                     <div key={idx} className={`relative p-6 rounded-2xl border-2 transition-all ${batch ? 'bg-white border-candy-500 shadow-lg' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                         <div className="absolute top-4 right-4 text-xs font-bold text-gray-400">
                             SLOT {idx + 1}
                         </div>
                         
                         {batch ? (
                             <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-candy-100 flex items-center justify-center text-candy-600">
                                        <Loader2 size={20} className="animate-spin" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{inventory.find(i => i.id === batch.productId)?.name}</h4>
                                        <p className="text-xs text-gray-500">Batch #{batch.id.slice(-4)}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Output</span>
                                        <span className="font-bold">{batch.quantity} Units</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-candy-500 w-2/3 animate-pulse"></div>
                                    </div>
                                    <button 
                                        onClick={() => onFinishBatch(batch.id)}
                                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <PackageCheck size={16} /> Finish Batch
                                    </button>
                                </div>
                             </>
                         ) : (
                             <div className="h-24 flex items-center justify-center text-gray-300 font-bold">
                                 EMPTY SLOT
                             </div>
                         )}
                     </div>
                 )
             })}
        </div>
      </div>
    </div>
  );
};