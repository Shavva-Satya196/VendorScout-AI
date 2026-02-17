import { GoogleGenAI } from "@google/genai";
import { ShortlistResult, Vendor, GroundingChunk } from '../types';

const GEMINI_API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Procurement Consultant and Tech Analyst. 
Your goal is to build comprehensive vendor shortlists based on user needs.
You MUST use the 'googleSearch' tool to find real-time, up-to-date information about pricing, features, and limitations.
Do not invent features or prices. If pricing is not public, estimate based on similar competitors or state "Contact Sales".
Prioritize sources like official pricing pages, documentation, and reputable software review sites (G2, Capterra) found via search.

Output Format:
You must output a VALID JSON object inside a code block. 
The JSON must have the following structure:
{
  "summary": "A brief executive summary of the market landscape for this request (approx 2-3 sentences).",
  "vendors": [
    {
      "name": "Vendor Name",
      "priceRange": "e.g., $10-50/mo or Enterprise Custom",
      "matchedFeatures": ["Feature 1", "Feature 2"],
      "risksLimits": ["Risk 1", "Limitation 1"],
      "verdict": "A short 1-sentence opinion on who this is best for."
    }
  ]
}
`;

export const generateShortlist = async (
  need: string,
  requirements: string[],
  budget: string,
  region: string
): Promise<Partial<ShortlistResult>> => {
  
  if (!GEMINI_API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const requirementsList = requirements.map(r => `- ${r}`).join('\n');
  const userPrompt = `
    I need a vendor shortlist for: "${need}".
    Target Region: ${region || "Global"}.
    Budget Constraints: ${budget || "Not specified"}.
    
    My Key Requirements:
    ${requirementsList}

    Please:
    1. Search for at least 3 leading vendors that meet these criteria.
    2. Analyze their pricing, key features matching my requirements, and potential downsides.
    3. Return the data in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using pro for better reasoning and search capabilities
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        // We do NOT use responseMimeType: 'application/json' here because we want to ensure 
        // the model uses the Search tool effectively, which sometimes conflicts with JSON mode 
        // in preview models. We will parse the JSON manually from the text.
      }
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    // Extract JSON from code block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
    let jsonStr = jsonMatch[1] || text;
    
    // Clean up any markdown debris if the regex missed it
    jsonStr = jsonStr.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON response:", jsonStr);
      throw new Error("The AI analysis did not return a valid format. Please try again.");
    }

    return {
      vendors: parsedData.vendors as Vendor[],
      summary: parsedData.summary as string,
      sources: groundingChunks
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
