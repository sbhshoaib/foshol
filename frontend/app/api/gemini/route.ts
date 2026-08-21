import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    error: {
      type: Type.STRING,
      description: "If the user provided an invalid or unrecognized crop name, provide a brief error message here (e.g., 'Please enter a valid crop.')."
    },
    colorShade: {
      type: Type.STRING,
      description: "A single base color name suitable for this crop's light background theme (e.g., 'emerald', 'teal', 'amber', 'orange', 'yellow', 'cyan', 'indigo', 'violet').",
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
      First, verify if "${cropType}" is a valid crop or agricultural plant. If it is NOT a valid crop, return an error field with the message "Please enter a valid crop." and return empty arrays for phases/tasks.
      If it IS a valid crop:
      The crop cultivation started on ${startDate}.
      ${landAreaContext}
      Please generate the sequential growth phases for this crop, the typical duration (days_count) for each phase, and some suggested key tasks tied to these phases.
      Keep the phase names extremely short and concise, ideally a single word (e.g. "Germination", "Vegetative", "Flowering", "Harvest"). Do not use long phrases like "Germination & Establishment".
      If land area is provided, scale the tasks appropriately (e.g., mention the estimated amount of seeds, fertilizers, or manpower needed for the given acres in the task descriptions).
      Provide a suitable professional base color name for a light UI theme for this crop (e.g., "emerald", "amber", "teal", "orange", "yellow").
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
