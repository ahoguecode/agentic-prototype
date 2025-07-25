/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2023 Adobe
 *  All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/

import { createApiClient } from '../apiClient';
import { registerApi } from '../apiRegistry';
import { STOCK_API } from './stockConstants';
import { 
  AdobeStockSearchParameters, 
  AdobeStockSearchResponseNative,
  DefaultAdobeStockResultColumns
} from './stockTypes';

// Common API configuration
const commonConfig = {
  headers: STOCK_API.COMMON_HEADERS,
  timeout: STOCK_API.DEFAULT_TIMEOUT,
  retries: STOCK_API.DEFAULT_RETRIES
};

// Register Stock API with the registry
registerApi('stock', {
  baseUrl: STOCK_API.BASE_URL,
  ...commonConfig
});

// Create API client
export const stockClient = createApiClient({
  baseUrl: STOCK_API.BASE_URL,
  ...commonConfig
});

/**
 * Process Stock filters into URL parameters
 */
function processStockFilters(
  filters: AdobeStockSearchParameters["filters"]
): Array<string> {
  if (filters) {
    return Object.entries(filters).map(([key, value]) => {
      if (key === "3d_type_id" || key === "template_type_id") {
        return value
          .map((id: number) => `search_parameters[filters][${key}][]=${id}`)
          .join("&");
      } else {
        return `search_parameters[filters][${key}]=${value}`;
      }
    });
  }

  return [];
}

/**
 * Process result columns into URL parameters
 */
function processResultColumns(
  columns: AdobeStockSearchParameters["result_columns"]
): Array<string> {
  if (columns) {
    return columns.map((c) => `result_columns[]=${c}`);
  }

  return [];
}

/**
 * Search for assets in Adobe Stock
 */
export async function searchStock(
  apiKey: string,
  parameters: AdobeStockSearchParameters,
  productName: string = STOCK_API.DEFAULT_PRODUCT_NAME
): Promise<AdobeStockSearchResponseNative> {
  const params = Object.entries(parameters)
    .map(([key, value]) => {
      if (key === "filters" && value != null) {
        return processStockFilters(
          value as AdobeStockSearchParameters["filters"]
        );
      } else if (key === "result_columns") {
        return processResultColumns(
          value as AdobeStockSearchParameters["result_columns"]
        );
      } else if (key === "thumbnailSize") {
        return `search_parameters[thumbnail_size]=${value}`;
      } else {
        return `search_parameters[${key}]=${value}`;
      }
    })
    .flat();

  const url = `${STOCK_API.SEARCH_ENDPOINT}?${params.join("&")}`;

  try {
    const headers = {
      'x-Product': productName,
      'x-api-key': apiKey
    };

    const response = await stockClient.get<AdobeStockSearchResponseNative>(url, {}, headers);
    return response;
  } catch (error) {
    console.error('Failed to query Adobe Stock:', error);
    throw error;
  }
}

/**
 * Create a simple stock search with just a query string
 */
export async function quickSearch(
  apiKey: string,
  query: string,
  limit: number = 20,
  options: Partial<AdobeStockSearchParameters> = {}
): Promise<AdobeStockSearchResponseNative> {
  return searchStock(apiKey, {
    words: query,
    limit,
    result_columns: options.result_columns || DefaultAdobeStockResultColumns,
    ...options
  });
}

// Export convenience functions and client
export const stockService = {
  client: stockClient,
  searchStock,
  quickSearch
}; 