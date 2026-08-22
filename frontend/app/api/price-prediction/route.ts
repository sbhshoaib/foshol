import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief, 2-3 sentence analysis of why prices are trending this way during this period in Bangladesh."
    },
    unit: {
      type: Type.STRING,
      description: "The local wholesale measurement unit in Bangladesh for this specific crop (e.g., 'Mond (40 kg)' for Rice, 'Kg' for Tomatoes, 'Ton' for large quantities)."
    },
    data: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          period: { type: Type.STRING, description: "E.g., 'Week 1', 'Week 2' OR 'January', 'February', depending on the report type." },
          price: { type: Type.NUMBER, description: "The predicted average wholesale price (in BDT per the specified local measurement unit) for this period." }
        },
        required: ["period", "price"]
      }
    },
    news: {
      type: Type.ARRAY,
      description: "Recent news headlines related to this crop's market price. Provide only if reportType is yearly.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The headline or summary of the news" },
          source: { type: Type.STRING, description: "The source or publication name" },
          date: { type: Type.STRING, description: "The date of the news publication (e.g., 'August 15, 2026', 'Recently')" }
        },
        required: ["title", "source", "date"]
      }
    }
  },
  required: ["summary", "unit", "data"]
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { crop, month, year, location, reportType = 'monthly' } = await req.json();

    if (!crop || typeof crop !== 'string') {
      return NextResponse.json({ error: 'crop name is required and must be a string.' }, { status: 400 });
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const targetMonth = monthNames[month] || month;
    const loc = location || 'Bangladesh';

    let prompt = `You are an expert agricultural market analyst for Bangladesh.
I need a realistic wholesale price prediction for the following crop: ${crop}.
The market location context is ${loc}.

Crucially, you must use the standard local wholesale measurement unit for this crop (e.g., 'Mond (40 kg)' for Rice, 'Kg' for vegetables, etc.). Provide this unit in the 'unit' string.
The prices you provide must be in BDT per that specific measurement unit.
`;

    if (reportType === 'yearly') {
      prompt += `
The prediction is for the entire year of ${year}.
Consider the typical seasonality, supply/demand dynamics, and harvest times in Bangladesh for this specific crop throughout ${year}.
Return the predicted prices for each month: January, February, March, April, May, June, July, August, September, October, November, and December. The 'period' field must contain the month name.
Also provide a short summary analyzing the yearly trend.
Analyze recent news about the market price for this crop and provide a summary of the news in the 'news' array (including title and source).
`;
    } else {
      prompt += `
The prediction is for the month of ${targetMonth} in the year ${year}.
Consider the typical seasonality, supply/demand dynamics, and harvest times in Bangladesh for this specific crop during ${targetMonth}.
Return the predicted prices for Week 1, Week 2, Week 3, and Week 4 of that month. The 'period' field must contain the week name.
Also provide a short summary analyzing the monthly trend. Do not include news.
`;
    }

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
