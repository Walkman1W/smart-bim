import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BIMQueryResponse, BIMOperation } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const bimResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    operation: {
      type: Type.STRING,
      enum: [
        BIMOperation.ISOLATE,
        BIMOperation.HIDE,
        BIMOperation.COLOR_CODE,
        BIMOperation.SELECT,
        BIMOperation.RESET,
        BIMOperation.UNKNOWN
      ],
      description: "The primary action to perform immediately based on the user's input.",
    },
    category: {
      type: Type.STRING,
      description: "The building element category (e.g., Walls, Columns, Windows, HVAC). Null if not specified.",
      nullable: true,
    },
    level: {
      type: Type.STRING,
      description: "The specific floor or level (e.g., Level 1, Ground Floor). Null if not specified.",
      nullable: true,
    },
    material: {
      type: Type.STRING,
      description: "Specific material mentioned (e.g., Concrete, Glass). Null if not specified.",
      nullable: true,
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Key terms extracted from the query for searching.",
    },
    reasoning: {
      type: Type.STRING,
      description: "A short, friendly confirmation message to the user explaining what is being done.",
    },
    suggestions: {
      type: Type.ARRAY,
      description: "A list of 3-5 smart action buttons to display to the user. These should be relevant follow-up actions or alternative filters based on the context.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: "The label text for the button (e.g., 'Isolate Columns', 'Show Level 2')."
          },
          payload: {
            type: Type.OBJECT,
            properties: {
              operation: {
                type: Type.STRING,
                enum: [
                  BIMOperation.ISOLATE,
                  BIMOperation.HIDE,
                  BIMOperation.COLOR_CODE,
                  BIMOperation.SELECT,
                  BIMOperation.RESET
                ]
              },
              category: { type: Type.STRING, nullable: true },
              level: { type: Type.STRING, nullable: true },
              material: { type: Type.STRING, nullable: true }
            },
            required: ["operation"]
          }
        },
        required: ["label", "payload"]
      }
    }
  },
  required: ["operation", "keywords", "reasoning"],
};

export const parseBIMQuery = async (query: string): Promise<BIMQueryResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: `You are an intelligent BIM (Building Information Modeling) Assistant. 
        Your job is to interpret natural language commands from architects and construction workers and translate them into structured commands for a Speckle 3D viewer.
        
        Analyze the user's intent:
        - "Show me only the columns" -> ISOLATE, Category: Columns.
        - "Hide the roof" -> HIDE, Category: Roof.
        - "Highlight the glass elements" -> COLOR_CODE, Material: Glass.
        - "Select the walls on Level 2" -> SELECT, Category: Walls, Level: Level 2.
        - "Reset the view" -> RESET.
        
        CRITICAL: Dynamic Button Generation ('suggestions')
        The user relies on you to create temporary controls. Always generate 'suggestions' which act as buttons in the UI.
        
        Example Scenario:
        If user says "Analyze Structure" or "Check Structural Integrity":
        1. Reasoning: "I've focused on the structural elements. Use the buttons below to drill down."
        2. Suggestions (Buttons):
           - [Label: "Isolate Columns", Payload: ISOLATE Columns]
           - [Label: "Isolate Beams", Payload: ISOLATE Beams]
           - [Label: "Color Code Concrete", Payload: COLOR_CODE Concrete]
           - [Label: "Hide Slabs", Payload: HIDE Slabs]
           - [Label: "Show All Structure", Payload: ISOLATE Structure]
           
        If the user asks about a specific level (e.g., "Level 2"):
        - Suggest: "Isolate Level 2", "Hide Level 2", "Show Walls on L2".

        Make the buttons diverse (Isolate, Hide, Color) to give the user full control options immediately.
        
        Return a JSON object matching the defined schema.`,
        responseMimeType: "application/json",
        responseSchema: bimResponseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as BIMQueryResponse;
    }
    
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      operation: BIMOperation.UNKNOWN,
      category: null,
      level: null,
      material: null,
      keywords: [],
      reasoning: "I'm sorry, I had trouble processing that request. Could you try asking differently?",
      suggestions: []
    };
  }
};