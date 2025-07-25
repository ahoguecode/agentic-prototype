/**
 * Constants for Fal AI service
 */

export const FAL_API = {
  /**
   * Base URL for Fal AI API
   */
  BASE_URL: 'https://k63rd722e3.execute-api.us-east-1.amazonaws.com',
  
  /**
   * Default timeout in milliseconds
   */
  DEFAULT_TIMEOUT: 60000, // 60 seconds
  
  /**
   * Default number of retries for failed requests
   */
  DEFAULT_RETRIES: 2,
  
  /**
   * Default model to use when none is specified
   */
  DEFAULT_MODEL: 'fal-ai/imagen3/fast',
  
  /**
   * Common headers for all requests
   */
  COMMON_HEADERS: {
    'Content-Type': 'application/json'
  }
};

/**
 * Environment variable name for Fal API key
 */
export const FAL_API_KEY_ENV = 'FAL_KEY'; 