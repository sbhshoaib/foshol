import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A short, 2-sentence actionable insight based on the weather and the farmer's crops."
    }
  },
  required: ["summary"]
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { weatherData, crops } = await req.json();

    if (!weatherData) {
      return NextResponse.json({ error: 'Weather data is required.' }, { status: 400 });
    }

    const cropContext = crops && crops.length > 0 
      ? crops.map((c: any) => `${c.type} on ${c.land?.name || 'a field'} (${c.land?.area ? c.land.area + ' acres' : 'unknown size'})`).join(', ')
      : 'No active crops currently';

    const prompt = `
You are an expert AI agronomist providing a quick daily briefing to a farmer on their dashboard.

Current Weather Context:
- Temperature: ${weatherData.temp}°C
- Condition: ${weatherData.condition}
- Rain Chance (Today): ${weatherData.rainChanceToday}%
- Rain Chance (Next 3 Hours): ${weatherData.rainChance3Hr}%

Farmer's Active Crops:
${cropContext}

Task:
Write a short, sharp, 2-sentence actionable insight for the farmer. 
Relate the weather strictly to their crops if they have any. 
For example, if rain is coming and they have tomatoes, tell them to avoid watering or applying fertilizer today. If it's hot and dry, remind them about irrigation.
Keep it encouraging, highly relevant, and professional. Do NOT use markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
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
