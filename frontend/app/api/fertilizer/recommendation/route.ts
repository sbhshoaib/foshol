import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    needs_fertilizer: {
      type: Type.BOOLEAN,
      description: "True if fertilizer is needed, False if the crop is perfectly healthy and doesn't need intervention."
    },
    no_fertilizer_reason: {
      type: Type.STRING,
      description: "If needs_fertilizer is false, briefly explain why they are doing great."
    },
    fertilizers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the fertilizer (e.g., Urea, NPK, Potash)" },
          amount: { type: Type.STRING, description: "Recommended amount, scaled to their land area if known (e.g., 50 kg for 2 acres)" },
          guideline: { type: Type.STRING, description: "Specific instructions on how to apply it." },
          outcome: { type: Type.STRING, description: "Expected result after application." }
        },
        required: ["name", "amount", "guideline", "outcome"],
      },
      description: "List of recommended fertilizers if needed.",
    }
  },
  required: ["needs_fertilizer", "fertilizers"]
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { cropName, cropType, landArea, qaPairs } = await req.json();

    if (!cropType || !qaPairs) {
      return NextResponse.json({ error: 'Crop Type and QA Pairs are required.' }, { status: 400 });
    }

    const prompt = `
You are an expert agricultural AI.
The farmer is growing a crop: ${cropName || cropType} (Type: ${cropType}) on a land area of ${landArea ? landArea + ' acres' : 'unknown size'}.

The farmer has answered the following diagnostic questions about their crop:
${JSON.stringify(qaPairs, null, 2)}

Analyze these answers. 
1. Determine if the crop is healthy or if it requires fertilizers (macro/micronutrients or organic manure).
2. If it requires fertilizer, prescribe the specific fertilizers needed.
3. Calculate the recommended amount based on the provided land area (${landArea ? landArea + ' acres' : 'standard per acre basis'}).
4. Provide a brief guideline on application.
5. Provide the expected outcome.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    if (response.text) {
      return NextResponse.json(JSON.parse(response.text));
    }

    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
