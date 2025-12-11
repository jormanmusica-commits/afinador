
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const prompt = `
Eres un experto productor musical e ingeniero de audio. Analiza el archivo de audio vocal proporcionado.
Tu tarea es devolver un JSON con:
1. "transcription": La letra.
2. "analysis": Crítica constructiva de la interpretación.
3. "correctedLyrics": Sugerencias de letra.
4. "mixingRecommendations": Valores recomendados (0-100) para una cadena de efectos que mejore esta voz específica. 
   - eq: low (graves), mid (medios), high (agudos). (-20 a 20 para EQ, representando dB).
   - compressor, reverb, delay, deEsser, autoTune, saturation, distortion, gate, expander, exciter, chorus, doubler, limiter, hpf, lpf, noiseReduction, harmonizer, flanger, phaser.
   - explanation: Breve explicación de por qué elegiste estos ajustes.

Asegúrate de que la respuesta sea un JSON válido.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    transcription: { type: Type.STRING },
    analysis: { type: Type.STRING },
    correctedLyrics: { type: Type.STRING },
    mixingRecommendations: {
      type: Type.OBJECT,
      properties: {
        eq: {
          type: Type.OBJECT,
          properties: {
            low: { type: Type.NUMBER },
            mid: { type: Type.NUMBER },
            high: { type: Type.NUMBER },
          },
        },
        compressor: { type: Type.NUMBER },
        reverb: { type: Type.NUMBER },
        delay: { type: Type.NUMBER },
        deEsser: { type: Type.NUMBER },
        autoTune: { type: Type.NUMBER },
        saturation: { type: Type.NUMBER },
        distortion: { type: Type.NUMBER },
        gate: { type: Type.NUMBER },
        expander: { type: Type.NUMBER },
        exciter: { type: Type.NUMBER },
        chorus: { type: Type.NUMBER },
        doubler: { type: Type.NUMBER },
        limiter: { type: Type.NUMBER },
        hpf: { type: Type.NUMBER },
        lpf: { type: Type.NUMBER },
        noiseReduction: { type: Type.NUMBER },
        harmonizer: { type: Type.NUMBER },
        flanger: { type: Type.NUMBER },
        phaser: { type: Type.NUMBER },
        explanation: { type: Type.STRING },
      },
    },
  },
  required: ["transcription", "analysis", "correctedLyrics", "mixingRecommendations"],
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
};

export const analyzeAudio = async (file: File): Promise<AnalysisResult> => {
  try {
    let contentPart;

    if (file.size < 9 * 1024 * 1024) {
        const base64Audio = await fileToBase64(file);
        contentPart = {
            inlineData: {
                data: base64Audio,
                mimeType: file.type || 'audio/wav',
            },
        };
    } else {
        const uploadResult = await ai.files.upload({
            file: file,
            config: { 
                mimeType: file.type || 'audio/wav',
                displayName: file.name
            }
        });

        contentPart = {
            fileData: {
                mimeType: uploadResult.file.mimeType,
                fileUri: uploadResult.file.uri
            }
        };
    }
    
    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, contentPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
    });

    const jsonString = response.text.trim();
    const result: AnalysisResult = JSON.parse(jsonString);
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if(error.message.includes('API key not valid')) {
            throw new Error('La clave de API de Gemini no es válida. Por favor, verifica la configuración.');
        }
    }
    throw new Error("No se pudo analizar el audio. Asegúrate de que el archivo sea válido y la clave API tenga permisos.");
  }
};
