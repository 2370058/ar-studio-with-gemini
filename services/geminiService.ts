import { GoogleGenAI } from "@google/genai";

export const analyzeARScene = async (base64Image: string): Promise<string> => {
  // Access key inside function to ensure environment is ready
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Gemini API Key is missing");
    return "API Key is missing. Please configure process.env.API_KEY.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Remove header if present to get pure base64
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/png',
            },
          },
          {
            text: "You are an AR spatial computing assistant. Analyze this screenshot of an Augmented Reality session. Describe the 3D objects placed in the scene, their relationship to the real-world floor/environment, and the overall composition. Keep it concise and enthusiastic.",
          },
        ],
      },
    });

    return response.text || "No analysis could be generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to analyze the scene. Please try again.";
  }
};