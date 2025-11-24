import { GoogleGenAI } from "@google/genai";
import { InventoryItem, Transaction } from "../types";

const getAiClient = () => {
    if (!process.env.API_KEY) {
        console.warn("API Key not found. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeInventoryWithGemini = async (inventory: InventoryItem[], recentTransactions: Transaction[]) => {
  const ai = getAiClient();
  if (!ai) return "API Key missing. Cannot generate insights.";

  const inventorySummary = inventory.map(i => `${i.name}: ${i.quantity} ${i.unit} (Min: ${i.minStock})`).join('\n');
  const transactionSummary = recentTransactions.slice(0, 10).map(t => `${t.type}: ${t.details}`).join('\n');

  const prompt = `
    You are an expert Factory Manager AI for a candy factory.
    
    Here is the current inventory status:
    ${inventorySummary}

    Here are recent transactions:
    ${transactionSummary}

    Please provide a concise, 3-point executive summary of the factory status.
    1. Identify critical low stock items.
    2. Suggest a production focus based on available raw materials.
    3. Point out any potential supply chain risks or anomalies.

    Keep the tone professional but sweet.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Sorry, I couldn't analyze the inventory at this moment.";
  }
};

export const askAssistant = async (message: string, context: string) => {
    const ai = getAiClient();
    if (!ai) return "API Key missing.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
            Context: You are a helper for a candy factory inventory app.
            Current Data Context: ${context}
            
            User Question: ${message}
            
            Answer concisely and helpfully.
            `
        });
        return response.text;
    } catch (error) {
        return "I'm having trouble connecting to the candy cloud right now.";
    }
}
