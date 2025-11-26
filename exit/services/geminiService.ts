import { GoogleGenAI, Type } from "@google/genai";
import { Question, ExamConfig } from '../types';

const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '') as string;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateExamQuestions = async (config: ExamConfig): Promise<Question[]> => {
  const prompt = `
    You are an expert academic examiner for Ethiopian Higher Education Institutions.
    Create a simulated Exit Exam for the department of "${config.department}" for the year ${config.year}, ${config.session}.
    
    Generate 100 challenging multiple-choice questions that reflect the standard curriculum for this field.
    The questions should cover various key topics within the department.
    
    Return the response strictly in JSON format.
  `;

  try {
    if (!ai) {
      throw new Error("API key not configured");
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              text: { type: Type.STRING, description: "The question text" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of 4 possible answers"
              },
              correctOptionIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" },
              explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct" },
              topic: { type: Type.STRING, description: "The sub-topic this question belongs to (e.g., 'Data Structures')" }
            },
            required: ["id", "text", "options", "correctOptionIndex", "explanation", "topic"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Question[];
    }
    throw new Error("No data received from Gemini");
  } catch (error) {
    console.error("Failed to generate exam:", error);
    // Fallback mock data in case of API failure to prevent app crash
    return [
      {
        id: 1,
        text: "The Gemini API call failed. This is a fallback question. Which of the following is a primary color?",
        options: ["Green", "Purple", "Red", "Orange"],
        correctOptionIndex: 2,
        explanation: "Red is a primary color along with Blue and Yellow.",
        topic: "General Knowledge"
      }
    ];
  }
};

export const getPersonalizedStudyTip = async (score: number, department: string): Promise<string> => {
  try {
    if (!ai) {
      return "Consistency is key. Review your weak areas and try again!";
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Give a short, encouraging, and specific study tip for a ${department} student who just scored ${score}% on a practice exit exam. Keep it under 50 words.`,
    });
    return response.text || "Keep practicing to improve your score!";
  } catch (e) {
    return "Consistency is key. Review your weak areas and try again!";
  }
};
