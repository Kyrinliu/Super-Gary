import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, EntityType } from "../types";
import { TILE_SIZE, SCREEN_HEIGHT } from "../constants";

export const generateLevel = async (difficulty: string, theme: string): Promise<LevelData> => {
  // 1. Try to get key from Vite's standard import.meta.env (Best practice)
  const viteKey = import.meta.env.VITE_API_KEY;
  
  // 2. Try to get key from process.env (Polyfilled by vite.config.ts)
  const processKey = process.env.API_KEY;

  const finalKey = viteKey || processKey;

  // Debugging logs to help you see what's happening in the browser console (F12)
  console.log("--- API Key Debug ---");
  console.log("import.meta.env.VITE_API_KEY exists:", !!viteKey);
  console.log("process.env.API_KEY exists:", !!processKey);
  
  if (!finalKey) {
    console.error("CRITICAL ERROR: No API Key found. Please set VITE_API_KEY in Vercel Environment Variables.");
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: finalKey });

  const prompt = `Design a 2D platformer level similar to Super Mario. 
  Difficulty: ${difficulty}. 
  Theme: ${theme}. 
  The level should be about 3000px wide. 
  The floor is usually at y=${SCREEN_HEIGHT - 100}.
  Coordinate system: x=0 is start, y=0 is top, y=${SCREEN_HEIGHT} is bottom.
  Include a variety of platforms at different heights, some enemies patrolling platforms, coins to collect, and a goal post at the end.
  Be creative with platform placement. Ensure the level is playable and beatable.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior game level designer.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A creative name for the level" },
            width: { type: Type.NUMBER, description: "Total width of level in pixels (approx 2000-4000)" },
            theme: { type: Type.STRING, enum: ["day", "night", "cave"] },
            platforms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER }
                },
                required: ["x", "y", "width", "height"]
              }
            },
            enemies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  range: { type: Type.NUMBER, description: "Patrol distance in pixels" }
                },
                required: ["x", "y", "range"]
              }
            },
            coins: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER }
                },
                required: ["x", "y"]
              }
            },
            goalX: { type: Type.NUMBER, description: "X position of the finish line" },
            goalY: { type: Type.NUMBER, description: "Y position of the bottom of the finish flag" }
          },
          required: ["name", "width", "platforms", "enemies", "coins", "goalX", "goalY", "theme"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Map the raw JSON to our internal LevelData structure
    const level: LevelData = {
      id: crypto.randomUUID(),
      name: data.name || "AI Generated Level",
      theme: (data.theme as any) || "day",
      width: data.width || 3000,
      startPos: { x: 50, y: SCREEN_HEIGHT - 200 },
      platforms: (data.platforms || []).map((p: any) => ({
        ...p,
        type: EntityType.PLATFORM
      })),
      enemies: (data.enemies || []).map((e: any) => ({
        x: e.x,
        y: e.y,
        width: TILE_SIZE,
        height: TILE_SIZE,
        type: EntityType.ENEMY,
        vx: 2,
        range: e.range || 100,
        originX: e.x
      })),
      coins: (data.coins || []).map((c: any) => ({
        x: c.x,
        y: c.y,
        width: TILE_SIZE * 0.75,
        height: TILE_SIZE * 0.75,
        type: EntityType.COIN
      })),
      goal: {
        x: data.goalX || 2800,
        y: (data.goalY || 500) - 300,
        width: 20,
        height: 300,
        type: EntityType.GOAL
      }
    };

    // Ensure there is a floor if the AI forgot one or made it too sparse
    level.platforms.push({
      x: -100,
      y: SCREEN_HEIGHT - 50,
      width: level.width + 500,
      height: 200,
      type: EntityType.PLATFORM
    });

    return level;
  } catch (error) {
    console.error("GenAI Level Generation Error:", error);
    throw error;
  }
};