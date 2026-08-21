import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    colorShade: {
      type: Type.STRING,
      description: "A Tailwind CSS background gradient suitable for this crop (e.g., 'from-amber-600 to-amber-800').",
    },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          days_count: { type: Type.INTEGER },
          description: { type: Type.STRING },
        },
        required: ["name", "days_count", "description"],
      },
      description: "Sequential growth phases for this crop from planting to harvest.",
    },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase_name: { type: Type.STRING },
          title: { type: Type.STRING },
          day_offset: { type: Type.INTEGER, description: "Number of days after the phase starts to perform this task." },
          type: { type: Type.STRING, description: "Type of task, e.g. 'water', 'scan', 'general'" }
        },
        required: ["phase_name", "title", "day_offset", "type"],
      },
    },
  },
  required: ["colorShade", "phases", "tasks"],
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { cropType, startDate, landArea } = await req.json();

    if (!cropType || !startDate) {
      return NextResponse.json({ error: 'cropType and startDate are required.' }, { status: 400 });
    }

    const landAreaContext = landArea ? `The total area of land for cultivation is ${landArea} acres.` : '';

    const prompt = `
      You are an expert agricultural AI. I am starting to grow ${cropType}.
      The crop cultivation started on ${startDate}.
      ${landAreaContext}
      Please generate the sequential growth phases for this crop, the typical duration (days_count) for each phase, and some suggested key tasks tied to these phases.
      If land area is provided, scale the tasks appropriately (e.g., mention the estimated amount of seeds, fertilizers, or manpower needed for the given acres in the task descriptions).
      Provide a suitable UI color gradient shade in Tailwind classes for this crop (e.g., "from-green-500 to-green-700").
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
