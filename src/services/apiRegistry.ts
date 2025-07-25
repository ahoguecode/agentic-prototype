import { createApiClient } from './apiClient';

// Store for API configurations
interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

// Storage for API configs and clients
const apiConfigs: Record<string, ApiConfig> = {};
const apiClients: Record<string, ReturnType<typeof createApiClient>> = {};

/**
 * Register a new API configuration
 */
export function registerApi(name: string, config: ApiConfig): void {
  apiConfigs[name] = config;
  // Clear existing client if we're updating the config
  if (apiClients[name]) {
    delete apiClients[name];
  }
}

/**
 * Get an API client by name
 */
export function getApiClient(name: string): ReturnType<typeof createApiClient> {
  // Create the client if it doesn't exist yet
  if (!apiClients[name]) {
    const config = apiConfigs[name];
    if (!config) {
      throw new Error(`API with name "${name}" is not registered`);
    }
    
    apiClients[name] = createApiClient(config);
  }
  
  return apiClients[name];
}

/**
 * Check if an API is registered
 */
export function hasApi(name: string): boolean {
  return !!apiConfigs[name];
}

/**
 * Get all registered API names
 */
export function getApiNames(): string[] {
  return Object.keys(apiConfigs);
}

/**
 * Remove an API configuration and its client
 */
export function removeApi(name: string): void {
  delete apiConfigs[name];
  delete apiClients[name];
} 