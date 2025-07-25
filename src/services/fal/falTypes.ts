/**
 * Types for Fal AI service
 */

/**
 * Image generation request options
 */
export interface FalGenerateOptions {
  /**
   * The Fal AI model to use, defaults to 'fal-ai/imagen3/fast'
   */
  model?: string;
  
  /**
   * The text prompt for image generation (required)
   */
  prompt: string;
  
  /**
   * Optional URL to an input image for image-to-image models
   */
  image_url?: string;
  
  /**
   * Optional duration parameter for certain models
   */
  duration?: number;
  
  /**
   * Optional subject parameter for certain models
   */
  subject?: string;
  
  /**
   * Additional model-specific parameters
   */
  [key: string]: string | number | boolean | undefined;
}

/**
 * Image URL response type
 */
export interface FalImageUrl {
  /**
   * URL to the generated image
   */
  url: string;

  /**
   * Content type of the image
   */
  content_type: string;

  /**
   * File name of the image
   */
  file_name: string;

  /**
   * File size in bytes
   */
  file_size: number;
}

/**
 * Inner data structure in the response
 */
export interface FalGenerateResponseData {
  /**
   * Array of generated images
   */
  images: FalImageUrl[];
  
  /**
   * Seed used for generation
   */
  seed: number;
}

/**
 * Response from Fal AI image generation
 */
export interface FalGenerateResponse {
  /**
   * Response data
   */
  data: FalGenerateResponseData;
  
  /**
   * Request ID
   */
  requestId: string;
} 