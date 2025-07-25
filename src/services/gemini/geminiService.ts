import { createApiClient } from '../apiClient';
import { GEMINI_API } from './geminiConstants';

// Gemini API types
export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiMessage {
  role: 'user' | 'assistant' | 'system';
  parts: GeminiPart[];
}

export interface GeminiCompletionRequest {
  model?: string;
  contents: GeminiMessage[];
  maxRetries?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  candidateCount?: number;
}

export interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

export interface GeminiCompletionResponse {
  candidates: GeminiCandidate[];
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

// Create the Gemini API client
export const geminiClient = createApiClient({
  baseUrl: GEMINI_API.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: GEMINI_API.DEFAULT_TIMEOUT,
  retries: GEMINI_API.DEFAULT_RETRIES
});

/**
 * Send a completion request to the Gemini API
 */
export async function createCompletion(
  request: GeminiCompletionRequest
): Promise<GeminiCompletionResponse> {
  const fullRequest = {
    model: request.model || GEMINI_API.DEFAULT_MODEL,
    maxRetries: request.maxRetries || GEMINI_API.DEFAULT_RETRIES,
    temperature: request.temperature ?? GEMINI_API.DEFAULT_TEMPERATURE,
    ...request
  };
  
  return geminiClient.post<GeminiCompletionResponse>(GEMINI_API.ENDPOINT, fullRequest);
}

/**
 * Send a message to the Gemini API and receive a response
 */
export async function sendMessage(
  messages: GeminiMessage[],
  options: Partial<Omit<GeminiCompletionRequest, 'contents'>> = {}
): Promise<GeminiPart[]> {
  const response = await createCompletion({
    model: options.model || GEMINI_API.DEFAULT_MODEL,
    contents: messages,
    ...options
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No response generated from Gemini API');
  }
  
  return response.candidates[0].content.parts;
}

/**
 * Send a simple text message to Gemini and get a text response
 */
export async function sendTextMessage(
  userMessage: string,
  systemPrompt?: string,
  options: Partial<Omit<GeminiCompletionRequest, 'contents'>> = {}
): Promise<string> {
  const messages: GeminiMessage[] = [];
  
  // Add system message if provided
  if (systemPrompt) {
    messages.push({
      role: 'system',
      parts: [{ text: systemPrompt }]
    });
  }
  
  // Add user message
  messages.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });
  
  const responseParts = await sendMessage(messages, options);
  
  // Combine all text content from the response
  return responseParts
    .filter(part => part.text !== undefined)
    .map(part => part.text || '')
    .join('');
}

/**
 * Create a text content part for Gemini messages
 */
export function createTextContent(text: string): GeminiPart {
  return { text };
}

/**
 * Create an image content part for Gemini messages (base64 encoded)
 */
export function createImageContent(mimeType: string, base64Data: string): GeminiPart {
  return {
    inlineData: {
      mimeType,
      data: base64Data
    }
  };
} 