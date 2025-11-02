
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the "data:mime/type;base64," part
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const editImage = async (file: File, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const base64Data = await fileToBase64(file);
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const editedImagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (editedImagePart && editedImagePart.inlineData) {
      const mimeType = editedImagePart.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${editedImagePart.inlineData.data}`;
    } else {
      throw new Error("No edited image found in the API response.");
    }
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw new Error("Failed to process image with AI. Please try again.");
  }
};
