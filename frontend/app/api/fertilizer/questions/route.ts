import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Provide exactly 3 to 4 multiple-choice options."
          }
        },
        required: ["id", "question", "options"],
      },
      description: "A list of 3-4 diagnostic multiple-choice questions.",
    }
  },
  required: ["questions"]
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { cropName, cropType, landArea } = await req.json();

    if (!cropType) {
      return NextResponse.json({ error: 'Crop Type is required.' }, { status: 400 });
    }

    const prompt = `
You are an expert agricultural AI diagnostician.
The farmer is growing a crop: ${cropName || cropType} (Type: ${cropType}) on a land area of ${landArea ? landArea + ' acres' : 'unknown size'}.

Your task is to generate EXACTLY 3 or 4 multiple-choice questions to ask the farmer in order to accurately diagnose the crop's current health and determine if it needs any fertilizer, and if so, what kind.

Focus the questions on visual symptoms (e.g., leaf color, spots, wilting) and environmental context (e.g., soil moisture, recent growth speed).
Do NOT ask open-ended questions. Provide exactly 3 to 4 distinct options for each question.
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
