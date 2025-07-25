// Export base API client
export { createApiClient } from './apiClient';

// Export API registry functions
export * from './apiRegistry';

// Export OpenAI API service
export * as openai from './openai/openaiService';

// Export constants
export * from './openai/openaiConstants';

// Export Claude API service
export * as claude from './claude/claudeService';
export * from './claude/claudeConstants';

// Export Gemini API service
export * as gemini from './gemini/geminiService';
export * from './gemini/geminiConstants';

// Export Firefly API service
export * from './firefly/fireflyService';
export * from './firefly/fireflyConstants';
export * from './firefly/fireflyTypes';

// Export Stock API service
export * from './stock/stockService';
export * from './stock/stockConstants';
export * from './stock/stockTypes';

// Export Fal AI API service
export * from './fal/falService';
export * from './fal/falConstants';
export * from './fal/falTypes';

// Export Audio API service
export * from './audio/audioService';
export * from './audio/audioConstants';
export * from './audio/audioTypes';

// Also export a pre-configured set of APIs
import { openaiClient, createCompletion, sendMessage, prepareImageForOpenAI, createImageContent, createTextContent } from './openai/openaiService';
import { claudeClient, createCompletion as createClaudeCompletion, sendMessage as sendClaudeMessage, sendTextMessage } from './claude/claudeService';
import { geminiClient, createCompletion as createGeminiCompletion, sendMessage as sendGeminiMessage, sendTextMessage as sendGeminiTextMessage, createTextContent as createGeminiTextContent, createImageContent as createGeminiImageContent } from './gemini/geminiService';
import { fireflyClient, generate, generateV3, generateV4, generateBatch, uploadImage, uploadImageV3, uploadImageV4, uploadImageBatch, uploadVideoImage, generateSimilar, genfill, generateVideo, checkVideoStatus } from './firefly/fireflyService';
import { stockClient, searchStock, quickSearch } from './stock/stockService';
import { getFalClient, generateImage, generateImageWithImagen3, checkApiAvailability } from './fal/falService';
import { uploadVideo, uploadAudio, generateMusic, generateMusicFromVideo, getMusicStatus, detectBeats, generateVibe, generateMusicPrompt } from './audio/audioService';
import { registerApi } from './apiRegistry';
import { OPENAI_API } from './openai/openaiConstants';
import { CLAUDE_API } from './claude/claudeConstants';
import { GEMINI_API } from './gemini/geminiConstants';

// Register OpenAI API with the registry
registerApi('openai', {
  baseUrl: OPENAI_API.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: OPENAI_API.DEFAULT_TIMEOUT,
  retries: OPENAI_API.DEFAULT_RETRIES
});

// Register Claude API with the registry
registerApi('claude', {
  baseUrl: CLAUDE_API.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: CLAUDE_API.DEFAULT_TIMEOUT,
  retries: CLAUDE_API.DEFAULT_RETRIES
});

// Register Gemini API with the registry
registerApi('gemini', {
  baseUrl: GEMINI_API.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: GEMINI_API.DEFAULT_TIMEOUT,
  retries: GEMINI_API.DEFAULT_RETRIES
});

// Export convenience functions
export const apis = {
  openai: {
    client: openaiClient,
    createCompletion,
    sendMessage,
    prepareImageForOpenAI,
    createImageContent,
    createTextContent
  },
  claude: {
    client: claudeClient,
    createCompletion: createClaudeCompletion,
    sendMessage: sendClaudeMessage,
    sendTextMessage
  },
  gemini: {
    client: geminiClient,
    createCompletion: createGeminiCompletion,
    sendMessage: sendGeminiMessage,
    sendTextMessage: sendGeminiTextMessage,
    createTextContent: createGeminiTextContent,
    createImageContent: createGeminiImageContent
  },
  firefly: {
    client: fireflyClient,
    generate,
    generateV3,
    generateV4,
    generateBatch,
    uploadImage,
    uploadImageV3,
    uploadImageV4,
    uploadImageBatch,
    uploadVideoImage,
    generateSimilar,
    genfill,
    generateVideo,
    checkVideoStatus
  },
  stock: {
    client: stockClient,
    searchStock,
    quickSearch
  },
  fal: {
    client: getFalClient(),
    generateImage,
    generateImageWithImagen3,
    checkApiAvailability
  },
  audio: {
    uploadVideo,
    uploadAudio,
    generateMusic,
    generateMusicFromVideo,
    getMusicStatus,
    detectBeats,
    generateVibe,
    generateMusicPrompt
  }
}; 