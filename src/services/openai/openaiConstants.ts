/**
 * OpenAI API Constants
 * Centralized location for all OpenAI API configurations
 */

// OpenAI API
export const OPENAI_API = {
  BASE_URL: 'https://zs1smmmclh.execute-api.us-east-1.amazonaws.com',
  COMPLETIONS_ENDPOINT: '/completions',
  DEFAULT_DEPLOYMENT: 'o4-mini',
  DEFAULT_API_VERSION: '2024-12-01-preview',
  DEFAULT_RETRIES: 3,
  DEFAULT_TIMEOUT: 30000,
}; 

export const OPENAI_IMAGE_GENERATION_API = {
  BASE_URL: 'https://t436qa2399.execute-api.us-east-1.amazonaws.com',
  DEFAULT_DEPLOYMENT: 'gpt-image-1',
  DEFAULT_API_VERSION: '2025-04-01-preview',
  DEFAULT_RETRIES: 3,
  DEFAULT_TIMEOUT: 30000,
};