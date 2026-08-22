import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    response: {
      type: Type.STRING,
      description: "The AI's conversational response to the user's message."
    },
    summary: {
      type: Type.STRING,
      description: "A comprehensive rolling summary of the entire conversation up to this point. This must capture all important context, user intent, previous advice given, and the latest interaction."
    }
  },
  required: ["response", "summary"]
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { message, previousSummary, contextData } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const prompt = `
You are Foshol AI, an expert agricultural chatbot helping farmers manage their crops, lands, and tasks.

### CONTEXT MANAGEMENT INSTRUCTIONS (CRITICAL)
You operate in a stateless environment to save tokens and improve speed. Instead of receiving the entire chat history, you receive a "Rolling Summary" of the conversation so far. 
Your job is to provide the next conversational response AND generate a new updated "Rolling Summary". 
Why is the summary needed? Because this summary is the ONLY memory you will have in the next turn! If you omit important details from the summary, you will forget them in the next message.

### USER'S BACKGROUND CONTEXT
Below is the user's current agricultural data (crops, tasks, lands). Use this to provide personalized, highly relevant advice:
${JSON.stringify(contextData, null, 2)}

### CONVERSATION SO FAR (ROLLING SUMMARY)
${previousSummary ? previousSummary : "This is the very first message in the conversation."}

### LATEST USER MESSAGE
"${message}"

### YOUR TASK
1. "response": Reply to the user's latest message naturally and helpfully, using the background context and the rolling summary to maintain continuity.
2. "summary": Write a new, concise rolling summary that combines the previous summary with the essence of this latest interaction. Ensure any ongoing problems, questions, or established context are preserved in this summary.
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
