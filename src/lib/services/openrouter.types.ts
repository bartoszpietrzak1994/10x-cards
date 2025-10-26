/**
 * OpenRouter Service Type Definitions
 * 
 * Type definitions for the OpenRouter service that manages interactions
 * with the OpenRouter API for LLM-based chat functionalities.
 */

/**
 * JSON Schema definition for response format
 */
export interface JsonSchema {
  name: string;
  strict: boolean;
  schema: Record<string, any>;
}

/**
 * Response format configuration
 */
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: JsonSchema;
}

/**
 * Model parameters for API requests
 */
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: any;
}

/**
 * Complete service configuration
 */
export interface OpenRouterConfig {
  apiEndpoint: string;
  apiKey: string;
  defaultModelName: string;
  defaultModelParams?: ModelParameters;
  responseFormat?: ResponseFormat;
}

/**
 * Message structure for API requests
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * API request payload
 */
export interface RequestPayload {
  model: string;
  messages: Message[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: any;
}

/**
 * Parsed API response
 */
export interface ParsedResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
  [key: string]: any;
}

/**
 * Override options for sendChat method
 */
export interface ChatOverrides {
  modelName?: string;
  modelParams?: ModelParameters;
  responseFormat?: ResponseFormat;
}

