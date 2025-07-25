import { createApiClient } from '../apiClient';
import { CLAUDE_API } from './claudeConstants';

// Claude API types
export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeCompletionRequest {
  model?: string;
  messages: ClaudeMessage[];
  max_tokens?: number;
  temperature?: number;
  system?: string;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  stream?: boolean;
}

export interface ClaudeContent {
  type: string;
  text: string;
}

export interface ClaudeCompletionResponse {
  id: string;
  type: string;
  role: string;
  content: ClaudeContent[];
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Create the Claude API client
export const claudeClient = createApiClient({
  baseUrl: CLAUDE_API.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: CLAUDE_API.DEFAULT_TIMEOUT,
  retries: CLAUDE_API.DEFAULT_RETRIES
});

/**
 * Send a completion request to the Claude API
 */
export async function createCompletion(
  request: ClaudeCompletionRequest
): Promise<ClaudeCompletionResponse> {
  return claudeClient.post<ClaudeCompletionResponse>(CLAUDE_API.ENDPOINT, request);
}

/**
 * Send a message to the Claude API and receive a response
 */
export async function sendMessage(
  messages: ClaudeMessage[],
  options: Partial<Omit<ClaudeCompletionRequest, 'messages'>> = {}
): Promise<ClaudeContent[]> {
  const response = await createCompletion({
    model: options.model || CLAUDE_API.DEFAULT_MODEL,
    messages,
    max_tokens: options.max_tokens || CLAUDE_API.DEFAULT_MAX_TOKENS,
    ...options
  });

  return response.content;
}

/**
 * Send a simple text message to Claude and get a text response
 */
export async function sendTextMessage(
  userMessage: string,
  systemPrompt?: string,
  options: Partial<Omit<ClaudeCompletionRequest, 'messages' | 'system'>> = {}
): Promise<string> {
  const messages: ClaudeMessage[] = [
    { role: 'user', content: userMessage }
  ];
  
  const requestOptions: Partial<Omit<ClaudeCompletionRequest, 'messages'>> = {
    ...options
  };
  
  if (systemPrompt) {
    requestOptions.system = systemPrompt;
  }
  
  const response = await sendMessage(messages, requestOptions);
  
  // Combine all text content from the response
  return response.filter(content => content.type === 'text')
    .map(content => content.text)
    .join('');
}
