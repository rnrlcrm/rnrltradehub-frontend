
import { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import {
  mockSalesContracts,
  mockBusinessPartners,
  mockInvoices,
  mockPayments,
  mockDisputes,
} from '../data/mockData';

// The API key MUST be obtained exclusively from the environment variable `process.env.API_KEY`.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY, vertexai: true });
} else {
  console.error("API_KEY environment variable not set. AI features will be disabled.");
}

type GeminiStatus = 'idle' | 'loading' | 'success' | 'error';

export const useGemini = () => {
  const [status, setStatus] = useState<GeminiStatus>('idle');
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generateContent = async (userQuery: string) => {
    if (!ai) {
      setStatus('error');
      setError("AI client is not initialized. Please configure the API_KEY.");
      return;
    }

    setStatus('loading');
    setResponse('');
    setError(null);

    // For demonstration, we serialize a subset of mock data to provide context.
    // In a real application, this would be dynamic based on the query.
    const dataContext = `
      Here is a JSON representation of the current ERP data. Use this data to answer the user's question.
      - Sales Contracts: ${JSON.stringify(mockSalesContracts)}
      - Business Partners: ${JSON.stringify(mockBusinessPartners)}
      - Invoices: ${JSON.stringify(mockInvoices)}
      - Payments: ${JSON.stringify(mockPayments)}
      - Disputes: ${JSON.stringify(mockDisputes)}
    `;

    const systemInstruction = `You are an expert data analyst for a cotton trading ERP system. Your name is "Gemini Analyst".
    Analyze the provided JSON data context to answer the user's question.
    Provide clear, concise, and data-driven answers.
    Format your response using markdown (e.g., bullet points, bold text for emphasis).
    If the data doesn't contain the answer, state that the information is not available in the provided data.
    Do not mention that you are working with mock or sample data. Treat it as real-time data.
    Always be helpful and professional. Start your response with a brief, friendly greeting.`;

    try {
      const result: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          role: 'user',
          parts: [{ text: `Context:\n${dataContext}\n\nUser Question: ${userQuery}` }]
        },
        config: {
          systemInstruction: systemInstruction,
        }
      });
      
      const text = result.text;
      setResponse(text);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`An error occurred while communicating with the AI: ${errorMessage}. Please check the console for details.`);
    }
  };

  return { status, response, error, generateContent };
};
