import { GoogleGenAI } from "@google/genai";
import { Member } from '../types';

export const askGemini = async (question: string, members: Member[]): Promise<string> => {
  try {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      return "API key not configured. Please add your Gemini API key to .env.local";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare a simplified dataset for context
    const contextData = members.map(m => {
      const totalPaid = m.payments.reduce((acc, p) => acc + p.amount, 0);
      const remaining = m.committedAmount - totalPaid;
      return `${m.name} (Phone: ${m.phone || 'N/A'}): Committed $${m.committedAmount}, Paid $${totalPaid}, Remaining $${remaining}, Freq: ${m.frequency}`;
    }).join('\n');

    const prompt = `
      You are an intelligent assistant for 'Markaz Masjid' contribution tracker.
      Here is the current data of community members and their contributions:

      --- START DATA ---
      ${contextData}
      --- END DATA ---

      User Question: "${question}"

      Instructions:
      1. Answer based ONLY on the provided data.
      2. If asked to draft a message, keep it polite, Islamic (start with Bismillah or Salam), and professional.
      3. If analyzing finances, provide exact numbers.
      4. Be concise and helpful.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || "I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error: ${error.message || "Failed to connect to Gemini API"}`;
  }
};