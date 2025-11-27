export enum BIMOperation {
  ISOLATE = 'ISOLATE',
  HIDE = 'HIDE',
  COLOR_CODE = 'COLOR_CODE',
  SELECT = 'SELECT',
  RESET = 'RESET',
  UNKNOWN = 'UNKNOWN',
  ROTATE_LEFT = 'ROTATE_LEFT',
  ROTATE_RIGHT = 'ROTATE_RIGHT'
}

export interface BIMActionPayload {
  operation: BIMOperation;
  category: string | null;
  level: string | null;
  material: string | null;
}

export interface BIMSuggestion {
  label: string;
  payload: BIMActionPayload;
}

export interface BIMQueryResponse extends BIMActionPayload {
  keywords: string[];
  reasoning: string;
  suggestions?: BIMSuggestion[];
}

export interface MockBIMElement {
  id: string;
  category: string;
  level: string;
  name: string;
  material: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  suggestions?: BIMSuggestion[];
}

export type GestureType = 'NONE' | 'ROTATE_LEFT' | 'ROTATE_RIGHT' | 'WAVE';
