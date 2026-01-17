
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseReminderText(input: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following text and extract a reminder task and a specific date/time. 
    Current time is: ${new Date().toLocaleString()}.
    Text: "${input}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING, description: 'The description of the reminder' },
          timestamp: { type: Type.NUMBER, description: 'The absolute unix timestamp in milliseconds for when the reminder should trigger' },
          confidence: { type: Type.NUMBER, description: 'Confidence score from 0 to 1' }
        },
        required: ["task", "timestamp"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim());
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return null;
  }
}

export async function getVoicePrompt(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Voice generation failed", error);
    return null;
  }
}
