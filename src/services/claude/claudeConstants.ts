/**
 * Claude API Constants
 * Centralized location for all Claude API configurations
 */

// Claude API
export const CLAUDE_API = {
  BASE_URL: 'https://h42svy5s89.execute-api.us-east-1.amazonaws.com',
  ENDPOINT: '/claude',
  //DEFAULT_MODEL: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  DEFAULT_MODEL: 'arn:aws:bedrock:us-east-1:329556597816:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  DEFAULT_MAX_TOKENS: 1024,
  DEFAULT_RETRIES: 3,
  DEFAULT_TIMEOUT: 60000, // Increased to 60 seconds for complex AI generation tasks
}; 