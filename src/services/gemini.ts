import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIResponse(prompt: string, systemInstruction: string = "You are a helpful AI tutor.") {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
    },
  });
  const response = await model;
  return response.text;
}

export async function generateQuiz(subject: string, className: string, count: number = 10) {
  const prompt = `Generate ${count} multiple-choice quiz questions for ${className} on the subject ${subject}. 
  Provide four options and one correct answer.
  Return as a JSON array of objects with:
  - 'question': string
  - 'options': array of 4 strings
  - 'correctIndex': number (0-3)
  - 'topic': string (specific sub-topic)
  
  Ensure difficulty is appropriate for ${className}.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });
  return JSON.parse(response.text);
}

export async function getQuestionExplanation(question: string, correctAnswer: string, className: string) {
  const prompt = `Explain why the answer "${correctAnswer}" to this question is correct in a simple way for a ${className} student:
  Question: ${question}`;
  
  return getAIResponse(prompt, "You are a friendly teacher explaining concepts simply.");
}

export async function getMotivationalFeedback(score: number, total: number, subject: string, className: string) {
  const prompt = `Encourage a ${className} student who scored ${score}/${total} in a quiz on ${subject} and suggest 3 specific topics to improve.`;
  
  return getAIResponse(prompt, "You are a motivational academic coach.");
}

export async function getCodeExplanation(code: string) {
  const prompt = `Explain this code line by line for a beginner: \n\n${code}`;
  return getAIResponse(prompt, "You are a friendly coding tutor for beginners.");
}
