import { GoogleGenAI, Type } from "@google/genai";
import { GameType, Question } from "../types";

// Initialize Gemini AI using the process.env.API_KEY polyfilled by Vite
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Cache for audio contexts to avoid recreating them
let audioContext: AudioContext | null = null;

export const generateQuestions = async (topic: string, count: number = 5): Promise<Question[]> => {
  if (!apiKey) {
    console.error("API Key is missing! Please check .env file.");
    return fallbackQuestions;
  }

  console.log("Generating questions for topic:", topic);

  const model = "gemini-2.5-flash";
  
  const systemInstruction = `You are a Thai Language Teacher for Grade 2 students (Prathom 2). 
  Create engaging quiz questions based on the Thai Core Curriculum. 
  Focus on the topic provided. 
  Ensure the language is simple and appropriate for 7-8 year olds.
  Return strictly JSON.`;

  const prompt = `Create ${count} distinct multiple-choice questions about "${topic}".
  For 'type', strictly use 'MULTIPLE_CHOICE'.
  Provide a 'prompt' (the question), 4 'choices', the 'correctAnswer', and a short simple 'explanation' in Thai.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              prompt: { type: Type.STRING },
              choices: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              audioText: { type: Type.STRING }
            },
            required: ["prompt", "choices", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return fallbackQuestions;
    
    const data = JSON.parse(text);
    return data.map((q: any, index: number) => ({
      ...q,
      id: `q-${Date.now()}-${index}`,
      type: GameType.MULTIPLE_CHOICE // Enforce type
    }));

  } catch (error) {
    console.error("Error generating questions:", error);
    return fallbackQuestions;
  }
};

export const playTextToSpeech = async (text: string) => {
  if (!apiKey) {
    console.error("API Key missing for TTS");
    return;
  }

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: {
            parts: [{ text }]
        },
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Puck" } // Adjust voice if needed
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data");

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Decode base64
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

  } catch (error) {
    console.error("TTS Error:", error);
  }
};

// Fallback data in case API fails or key is missing
const fallbackQuestions: Question[] = [
  {
    id: 'f1',
    type: GameType.MULTIPLE_CHOICE,
    prompt: "คำว่า 'มด' อยู่ในมาตราตัวสะกดใด?",
    choices: ["แม่ กก", "แม่ กด", "แม่ กบ", "แม่ กง"],
    correctAnswer: "แม่ กด",
    explanation: "เพราะ มด อ่านออกเสียงเหมือนมี ด เป็นตัวสะกด",
    audioText: "มด"
  },
  {
    id: 'f2',
    type: GameType.MULTIPLE_CHOICE,
    prompt: "คำใดเขียนถูกต้อง?",
    choices: ["บันได", "บรรได", "บันไดย", "บานได"],
    correctAnswer: "บันได",
    explanation: "บันได ใช้ บัน ไม้หันอากาศ น หนู",
    audioText: "บันได"
  }
];