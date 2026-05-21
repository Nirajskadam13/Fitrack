import { GoogleGenerativeAI } from "@google/generative-ai";

export async function callGemini(userPrompt, systemInstruction) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest",
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    });
    const result = await model.generateContent([systemInstruction, userPrompt]);
    const text = result.response.text();
    return text.replace(/```json|```/gi, "").trim();
  } catch (error) {
    console.error("Gemini call failed", error);
    return null;
  }
}

export function parseGeminiJson(rawText) {
  if (!rawText) return null;
  const cleaned = rawText.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Attempt to extract a JSON object/array from the response.
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    if (firstBrace === -1 && firstBracket === -1) return null;

    const useBracket =
      firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
    const start = useBracket ? firstBracket : firstBrace;
    const endChar = useBracket ? "]" : "}";
    const end = cleaned.lastIndexOf(endChar);
    if (end === -1) return null;

    const candidate = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (innerError) {
      return null;
    }
  }
}
