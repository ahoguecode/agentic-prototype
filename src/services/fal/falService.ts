import { createApiClient } from '../apiClient';
import { registerApi } from '../apiRegistry';
import { FAL_API } from './falConstants';
import { FalGenerateOptions, FalGenerateResponse } from './falTypes';

// Register Fal API with the registry
registerApi('fal', {
  baseUrl: FAL_API.BASE_URL,
  headers: FAL_API.COMMON_HEADERS,
  timeout: FAL_API.DEFAULT_TIMEOUT,
  retries: FAL_API.DEFAULT_RETRIES
});

// Create API client
const falClient = createApiClient({
  baseUrl: FAL_API.BASE_URL,
  headers: FAL_API.COMMON_HEADERS,
  timeout: FAL_API.DEFAULT_TIMEOUT,
  retries: FAL_API.DEFAULT_RETRIES
});

/**
 * Generate an image with Fal AI
 * 
 * @param options Options for image generation including prompt, model, etc.
 * @returns Generated image data
 */
export async function generateImage(
  options: FalGenerateOptions
): Promise<FalGenerateResponse> {
  // Ensure prompt is provided
  if (!options.prompt) {
    throw new Error('Prompt is required for image generation');
  }

  // Use default model if not specified
  const requestBody = {
    model: options.model || FAL_API.DEFAULT_MODEL,
    ...options
  };

  try {
    const response = await falClient.post<FalGenerateResponse>(
      '/fal', 
      requestBody
    );
    
    console.log('Raw Fal API response:', response);
    
    // Validate response
    if (!response || !response.data || !response.data.images) {
      console.error('Invalid Fal API response format:', response);
      throw new Error('Invalid response format from Fal API');
    }
    
    return response;
  } catch (e) {
    console.error('Error generating image with Fal AI:', e);
    throw e;
  }
}

/**
 * Generate an image using Imagen 3 model
 * 
 * @param prompt Text prompt for image generation
 * @param options Additional options
 * @returns Generated image data
 */
export async function generateImageWithImagen3(
  prompt: string,
  options: Omit<FalGenerateOptions, 'prompt' | 'model'> = {}
): Promise<FalGenerateResponse> {
  return generateImage({
    model: 'fal-ai/imagen3/fast',
    prompt,
    ...options
  });
}

/**
 * Check if the Fal AI API is available
 * 
 * @returns True if the API is available
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    // Simple ping with minimal prompt to check if API is responding
    await generateImage({
      prompt: 'test',
      model: FAL_API.DEFAULT_MODEL
    });
    return true;
  } catch (e) {
    console.error('Fal AI API not available:', e);
    return false;
  }
}

/**
 * Get client for direct API access
 * 
 * This allows for more flexible API usage beyond the provided helper functions
 */
export function getFalClient() {
  return falClient;
}
