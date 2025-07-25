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

/**
 * Adobe Stock API Constants
 * Centralized location for all Stock API configurations
 */

export const STOCK_API = {
  BASE_URL: 'https://stock.adobe.io/Rest',
  SEARCH_ENDPOINT: '/Media/1/Search/Files',
  DEFAULT_CLIENT_ID: 'f96fcdb1a3694a5a8fbaceff70dc921f', // Default client ID (can be overridden)
  DEFAULT_PRODUCT_NAME: 'Stock Search with Firefly',
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_RETRIES: 3,
  COMMON_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const; 