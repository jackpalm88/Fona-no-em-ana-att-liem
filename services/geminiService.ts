
import { GoogleGenAI, Modality, Part } from '@google/genai';

const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  const base64EncodedData = await base64EncodedDataPromise;
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const processImage = async (
  prompt: string,
  originalImage: File,
  backgroundImage?: File
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const originalImagePart = await fileToGenerativePart(originalImage);
  const parts: Part[] = [originalImagePart];

  if (backgroundImage) {
    const backgroundImagePart = await fileToGenerativePart(backgroundImage);
    parts.push(backgroundImagePart);
  }

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("API neatgrieza attēlu. Lūdzu, mēģiniet vēlreiz ar citu attēlu vai uzvedni.");
};
