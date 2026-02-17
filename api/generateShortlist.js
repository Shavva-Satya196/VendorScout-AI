import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing' });
    return;
  }

  const { need, requirements, budget, region } = req.body || {};
  if (!need || !Array.isArray(requirements)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const requirementsList = requirements.map(r => `- ${r}`).join('\n');
  const userPrompt = `
    I need a vendor shortlist for: "${need}".
    Target Region: ${region || 'Global'}.
    Budget Constraints: ${budget || 'Not specified'}.
    
    My Key Requirements:
    ${requirementsList}

    Please:
    1. Search for at least 3 leading vendors that meet these criteria.
    2. Analyze their pricing, key features matching my requirements, and potential downsides.
    3. Return the data in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || '';

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || [null, text];
    let jsonStr = jsonMatch[1] || text;
    jsonStr = jsonStr.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse JSON response from Gemini:', jsonStr);
      res.status(502).json({ error: 'AI did not return valid JSON' });
      return;
    }

    res.status(200).json({ vendors: parsedData.vendors || [], summary: parsedData.summary || '', sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] });
  } catch (err) {
    console.error('Gemini API Error (server):', err);
    res.status(502).json({ error: err.message || 'AI request failed' });
  }
}
