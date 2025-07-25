import { createApiClient } from '../apiClient';
import { OPENAI_API } from './openaiConstants';

// OpenAI API types
export interface OpenAIImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

export interface OpenAITextContent {
  type: 'text';
  text: string;
}

export type OpenAIMessageContent = OpenAITextContent | OpenAIImageContent | (OpenAITextContent | OpenAIImageContent)[];

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string | OpenAIMessageContent;
  name?: string;
}

export type OpenAIDeployment = 'o4-mini' | 'gpt-4o' | 'gpt-4o-mini';
export type OpenAIApiVersion = '2024-12-01-preview';

export interface OpenAICompletionRequest {
  deployment: OpenAIDeployment;
  apiVersion: OpenAIApiVersion;
  messages: OpenAIMessage[];
  maxRetries?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Create the OpenAI API client
export const openaiClient = createApiClient({
  baseUrl: OPENAI_API.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: OPENAI_API.DEFAULT_TIMEOUT,
  retries: OPENAI_API.DEFAULT_RETRIES
});

/**
 * Convert base64 image data to a data URL for use in OpenAI API
 */
export function convertBase64ToDataURL(base64Data: string, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Create an image content object for OpenAI API
 */
export function createImageContent(imageUrl: string, detail: 'auto' | 'low' | 'high' = 'auto'): OpenAIImageContent {
  return {
    type: 'image_url',
    image_url: {
      url: imageUrl,
      detail
    }
  };
}

/**
 * Create a text content object for OpenAI API
 */
export function createTextContent(text: string): OpenAITextContent {
  return {
    type: 'text',
    text
  };
}

/**
 * Send a completion request to the OpenAI API
 */
export async function createCompletion(
  request: OpenAICompletionRequest
): Promise<OpenAICompletionResponse> {
  return openaiClient.post<OpenAICompletionResponse>(OPENAI_API.COMPLETIONS_ENDPOINT, request);
}

/**
 * Send a message to the OpenAI API and receive a response
 */
export async function sendMessage(
  messages: OpenAIMessage[],
  options: Partial<Omit<OpenAICompletionRequest, 'messages'>> = {}
): Promise<OpenAIMessage> {
  const response = await createCompletion({
    deployment: options.deployment || OPENAI_API.DEFAULT_DEPLOYMENT as OpenAIDeployment,
    apiVersion: options.apiVersion || OPENAI_API.DEFAULT_API_VERSION as OpenAIApiVersion,
    messages,
    ...options
  });

  return response.choices[0].message;
}

/**
 * Prepare an image for sending to OpenAI API
 * @param file The image file to process
 * @returns A promise that resolves to a base64 data URL
 */
export function prepareImageForOpenAI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
} 