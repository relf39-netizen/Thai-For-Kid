import { GoogleGenAI, Type } from "@google/genai";
import { GameType, Question } from "../types";

// Helper to safely get the API key with priority:
// 1. Local Storage (User entered in UI)
// 2. Vite Environment Variable (VITE_API_KEY)
// 3. Process Environment Polyfill (API_KEY)
const getApiKey = () => {
  try {
    const localKey = localStorage.getItem('THAIQUEST_GEMINI_KEY');
    if (localKey && localKey.trim().length > 0) return localKey.trim();
    
    // Check standard Vite env
    // Fix: Cast import.meta to any to avoid TS error about env missing
    const meta = import.meta as any;
    if (meta && meta.env && meta.env.VITE_API_KEY) {
      return meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore errors accessing localStorage/import.meta in restricted environments
  }
  
  // Fix: Safe access to process for TypeScript without @types/node
  try {
    if (typeof process !== 'undefined') {
        return (process as any).env?.API_KEY;
    }
  } catch (e) {}
  
  return undefined;
};

// Cache for audio contexts to avoid recreating them
let audioContext: AudioContext | null = null;

export const generateQuestions = async (topic: string, count: number = 5): Promise<Question[]> => {
  const apiKey = getApiKey();
  
  // Basic validation
  if (!apiKey || apiKey === "undefined" || apiKey.includes("API_KEY") || apiKey.length < 10) {
    console.error("❌ Critical: API Key is missing or invalid.");
    return fallbackQuestions;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Using gemini-2.5-flash for speed and JSON capability
    const model = "gemini-2.5-flash";
    
    const systemInstruction = `You are a creative Thai Language Teacher for Grade 2 students. 
    Create engaging quiz questions based on the Thai Core Curriculum. 
    Focus on the topic provided. 
    Ensure the language is simple and appropriate for 7-8 year olds.`;

    const prompt = `Create ${count} distinct multiple-choice questions about "${topic}".
    Format the output as a valid JSON Array.
    Each object must have: prompt, choices (array of 4 strings), correctAnswer, and explanation.
    Explanation must be short and encouraging in Thai.
    IMPORTANT: Return ONLY the JSON array. Do not wrap in markdown blocks.`;

    console.log(`🤖 Generating questions for topic: ${topic}... (Model: ${model})`);

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
              prompt: { type: Type.STRING },
              choices: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["prompt", "choices", "correctAnswer", "explanation"]
          }
        }
      }
    });

    let text = response.text;
    
    if (!text) {
        console.warn("⚠️ AI returned empty text.");
        return fallbackQuestions;
    }

    // --- SMART JSON PARSING ---
    // 1. Remove markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // 2. Find the JSON array brackets (handling cases where AI adds preamble text)
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1) {
        text = text.substring(firstBracket, lastBracket + 1);
    }

    try {
        const data = JSON.parse(text);
        
        if (!Array.isArray(data)) {
            console.error("❌ AI returned JSON but it is not an array:", data);
            return fallbackQuestions;
        }

        console.log("✅ Questions generated successfully:", data.length);

        return data.map((q: any, index: number) => ({
            ...q,
            id: `q-${Date.now()}-${index}`,
            type: GameType.MULTIPLE_CHOICE
        }));

    } catch (parseError) {
        console.error("❌ JSON Parse Error. Raw text from AI:", text);
        return fallbackQuestions;
    }

  } catch (error: any) {
    console.error("❌ API Request Error:", error);
    return fallbackQuestions;
  }
};

export const playTextToSpeech = async (text: string) => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.length < 10) return;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: {
            parts: [{ text }]
        },
        config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Puck" }
                }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data");

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
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

const fallbackQuestions: Question[] = [
  {
    id: 'f1',
    type: GameType.MULTIPLE_CHOICE,
    prompt: "ข้อใดคือคำในแม่ ก กา? (ระบบใช้โจทย์สำรอง โปรดตรวจสอบ API Key)",
    choices: ["นก", "ปลา", "มด", "แมว"],
    correctAnswer: "ปลา",
    explanation: "เพราะ ปลา ไม่มีตัวสะกด จึงอยู่ในแม่ ก กา",
    audioText: "ปลา"
  },
  {
    id: 'f2',
    type: GameType.MULTIPLE_CHOICE,
    prompt: "คำว่า 'สนุก' อ่านอย่างไร? (ระบบใช้โจทย์สำรอง โปรดตรวจสอบ API Key)",
    choices: ["สะ-นุก", "สะ-หนุก", "สนุก", "ส-นุก"],
    correctAnswer: "สะ-หนุก",
    explanation: "สนุก เป็นอักษรนำ อ่านออกเสียงเหมือนมี ห นำ",
    audioText: "สนุก"
  }
];