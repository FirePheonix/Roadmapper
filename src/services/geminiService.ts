import { GoogleGenAI } from "@google/genai";
import { RoadmapBlock } from "../types/roadmap";

const genAI = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});


export const generateRoadmap = async (query: string): Promise<RoadmapBlock[]> => {
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
You are an expert learning assistant. Based on the user's query, create a structured learning roadmap broken down into connected, modular blocks that represent distinct stages or topics in the skill development process.

For each stage, generate a JSON object with the following structure:
{
  "isCompletedByUser": false,
  "blockID": <unique number starting from 1>,
  "title": "<concise name of the topic being learned in this block>",
  "time": "<estimated time duration like '10th August to 17th August'>",
  "description": "<a short explanation of what this block covers and why it's important>",
  "connectivity": [<blockIDs that come after this, representing dependencies. I want to specify that 1 can be connected to 2, 3, and then 2,3 can be connected to 4, then 4 can be connected to 5, and so on. But it's not like 1 can be connected with direct 7. It's to create a visual of tree going down..>]
}

The response should be a JSON array (wrapped inside [ ]) of multiple blocks. These blocks should be logically connected using the connectivity field. Ensure that the order of blocks makes sense and represents a proper skill progression. The time estimate should reflect realistic learning durations for each block.

Only return the JSON array and nothing else. No introductions, no explanations — just clean, copy-pasteable JSON output.

User's query: "${query}"
              `.trim()
            }
          ]
        }
      ]
    });

    if (!result || !result.text) {
      throw new Error("Invalid API response format");
    }

    const cleanedJson = result.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    try {
      const roadmapBlocks: RoadmapBlock[] = JSON.parse(cleanedJson);
      if (!Array.isArray(roadmapBlocks)) {
        throw new Error("Response is not an array");
      }
      return roadmapBlocks;
    } catch (e) {
      console.error("JSON parsing error:", e);
      throw new Error("Failed to parse API response");
    }
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw new Error("Failed to generate roadmap. Please try again.");
  }
};