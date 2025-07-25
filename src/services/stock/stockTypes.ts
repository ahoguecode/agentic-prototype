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

export interface AdobeStockSearchFilters {
  area_m_pixels?: string;
  image_width?: string;
  image_height?: string;
  premium?: "false" | "true" | "all";
  "3d_type_id"?: Array<1 | 2 | 3>;
  template_type_id?: Array<1 | 2 | 3 | 4 | 5>;
  has_releases?: "true" | "false" | "all";
  "content_type:photo"?: 0 | 1;
  "content_type:illustration"?: 0 | 1;
  "content_type:vector"?: 0 | 1;
  "content_type:video"?: 0 | 1;
  "content_type:template"?: 0 | 1;
  "content_type:3d"?: 0 | 1;
  "offensive:2"?: 0 | 1;
  "isolated:on"?: 0 | 1;
  "panoramic:on"?: 0 | 1;
  orientation?: "horizontal" | "vertical" | "square" | "all";
  video_duration?: "10" | "20" | "30" | "30-" | "all";
  colors?: string;
  copy_space?: "all" | "1";
  is_loop?: "1" | "true" | "all";
  transparent?: "1" | "true" | "all";
  gentech?: "all" | "true" | "false";
}

export interface AdobeStockSearchParameters {
  locale?: string;
  words?: string;
  limit?: number;
  offset?: number;
  order?: "relevance" | "creation" | "featured" | "nb_downloads" | "undiscovered";
  creator_id?: number;
  media_id?: number;
  model_id?: number;
  series_id?: number;
  similar?: number;
  similar_url?: string;
  similar_image?: 0 | 1;
  similar_image_data?: Blob;
  search_parameters?: number;
  thumbnailSize?: 110 | 160 | 220 | 240 | 500 | 1000;
  filters?: AdobeStockSearchFilters;
  gallery_id?: string;
  result_columns?: Array<AdobeStockResultColumn>;
}

export interface AdobeStockResult {
  nb_results: number;
  id: number;
  title: string;
  creator_name: string;
  creator_id: number;
  country_name: string;
  width: number;
  height: number;
  thumbnail_url: string;
  thumbnail_html_tag: string;
  thumbnail_width: number;
  thumbnail_height: number;
  thumbnail_110_url: number;
  thumbnail_110_width: number;
  thumbnail_110_height: number;
  thumbnail_160_url: number;
  thumbnail_160_width: number;
  thumbnail_160_height: number;
  thumbnail_220_url: number;
  thumbnail_220_width: number;
  thumbnail_220_height: number;
  thumbnail_240_url: number;
  thumbnail_240_width: number;
  thumbnail_240_height: number;
  thumbnail_500_url: number;
  thumbnail_500_width: number;
  thumbnail_500_height: number;
  thumbnail_1000_url: number;
  thumbnail_1000_width: number;
  thumbnail_1000_height: number;
  media_type_id: 1 | 2 | 3 | 4 | 6 | 7;
  category: { id: number; name: string };
  keywords: Array<string>;
  comp_url: string;
  comp_width: number;
  comp_height: number;
  is_licensed: "Standard" | "Extended" | "Video_HD" | "Video_4K" | "Standard_M" | "";
  vector_type: "svg" | "zip";
  content_type: string;
  framerate: number;
  duration: number;
  details_url: string;
  template_type_id: 1 | 2 | 3 | 4 | 5;
  marketing_text: string;
  description: string;
  size_bytes: number;
  premium_level_id: 0 | 1 | 2 | 3 | 4;
  is_loop: boolean;
  is_transparent: boolean;
  licenses: boolean;
  is_gentech: boolean;
}

export type AdobeStockResultColumn = keyof AdobeStockResult;

export const DefaultAdobeStockResultColumns: Array<AdobeStockResultColumn> = [
  "nb_results",
  "id",
  "title",
  "creator_name",
  "creator_id",
  "width",
  "height",
  "thumbnail_url",
  "thumbnail_html_tag",
  "thumbnail_width",
  "thumbnail_height",
  "category",
  "media_type_id",
  "vector_type",
  "content_type",
  "premium_level_id",
];

export type AdobeStockSearchResponse = {
  nbResults: number;
  files: Array<Partial<AdobeStockResult>>;
};

export type AdobeStockSearchResponseNative = {
  nb_results: number;
  files: Array<AdobeStockResult>;
}; 