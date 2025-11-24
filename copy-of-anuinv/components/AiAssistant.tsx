import React, { useState } from 'react';
import { analyzeInventoryWithGemini, askAssistant } from '../services/geminiService';
import { InventoryItem, Transaction } from '../types';
import { Sparkles, Bot, Send, RefreshCw } from 'lucide-react';

interface AiAssistantProps {
  inventory: InventoryItem[];
  transactions: Transaction[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ inventory, transactions }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeInventoryWithGemini(inventory, transactions);
    setAnalysis(result || "No analysis available.");
    setLoadingAnalysis(false);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    const inventoryContext = JSON.stringify(inventory.map(i => ({ name: i.name, qty: i.quantity })));
    const response = await askAssistant(userMsg, inventoryContext);

    setChatHistory(prev => [...prev, { role: 'ai', text: response || "I couldn't understand that." }]);
    setChatLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-[calc(100vh-8rem)]">
      {/* Insights Panel */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-candy-50 to-purple-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles className="text-candy-500" size={18} />
                    Factory Insights
                </h2>
                <button 
                    onClick={handleAnalyze}
                    disabled={loadingAnalysis}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-candy-600 rounded-lg text-xs sm:text-sm font-medium shadow-sm hover:bg-candy-50 disabled:opacity-50 w-full sm:w-auto"
                >
                    <RefreshCw size={14} className={loadingAnalysis ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">{loadingAnalysis ? 'Analyzing...' : 'Refresh Analysis'}</span>
                    <span className="sm:hidden">{loadingAnalysis ? 'Analyzing...' : 'Refresh'}</span>
                </button>
            </div>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {analysis ? (
                <div className="prose prose-sm prose-candy max-w-none text-gray-600">
                    <div className="whitespace-pre-line leading-relaxed">{analysis}</div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <Sparkles size={40} className="mb-4 text-gray-200" />
                    <p>Click "Refresh Analysis" to get an AI-generated report on your stock levels.</p>
                </div>
            )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
         <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Bot className="text-gray-500" size={18} />
            <h3 className="font-semibold text-sm sm:text-base text-gray-700">Assistant</h3>
         </div>
         
         <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50">
            {chatHistory.length === 0 && (
                <div className="text-center text-xs text-gray-400 mt-10">
                    Ask me anything about your candy inventory!
                </div>
            )}
            {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-candy-500 text-white rounded-br-none' 
                        : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {chatLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white text-gray-400 border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2 text-sm shadow-sm">
                        Thinking...
                    </div>
                </div>
            )}
         </div>

         <div className="p-3 sm:p-4 bg-white border-t border-gray-100">
            <form onSubmit={handleChat} className="flex gap-2">
                <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a question..."
                    className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-candy-300"
                />
                <button 
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2 bg-candy-500 text-white rounded-lg sm:rounded-xl hover:bg-candy-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </form>
         </div>
      </div>
    </div>
  );
};
