import { GoogleGenAI } from "@google/genai";
import { NoteType } from '../types';

const getSystemInstruction = (type: NoteType): string => {
  switch (type) {
    case NoteType.SUMMARY:
      return "You are an expert summarizer. Analyze the following transcript and provide a concise title and a bulleted summary of the key points.";
    case NoteType.ACTION_ITEMS:
      return "You are a project manager. Extract actionable tasks from the transcript. Output a title summarizing the context, followed by a checklist of action items.";
    case NoteType.JOURNAL:
      return "You are a reflective journal assistant. Format the transcript into a thoughtful journal entry with a mood-appropriate title. Fix grammar slightly but keep the personal tone.";
    case NoteType.IDEA:
      return "You are a creative partner. The user is brainstorming. Organize the messy thoughts into structured concepts. Give it a catchy title.";
    case NoteType.RAW:
    default:
      return "You are a formatter. Simply fix the grammar and punctuation of the transcript slightly to make it readable, and generate a short relevant title. Do not change the meaning.";
  }
};

export const processNoteContent = async (text: string, type: NoteType): Promise<{ title: string; content: string }> => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing, returning raw text.");
    return { title: "New Note", content: text };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const systemInstruction = getSystemInstruction(type);
    
    // We ask for JSON to easily separate title and content
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Transcript: "${text}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            content: { type: "STRING" }
          },
          required: ["title", "content"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    const parsed = JSON.parse(jsonText);
    return {
      title: parsed.title || "Untitled Note",
      content: parsed.content || text
    };

  } catch (error) {
    console.error("Gemini processing error:", error);
    // Fallback if Gemini fails
    return { title: "New Note (Raw)", content: text };
  }
};
