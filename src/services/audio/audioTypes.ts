// Upload response types
export interface AudioUploadResponse {
  media_id: string
  status: 'video_uploaded' | 'audio_uploaded' | 'transcript_uploaded'
  file_name: string
  message: string
}

export interface AudioS3UploadResponse {
  s3_url: string
}

// Analysis types
export interface AudioAnalysisStartResponse {
  media_id: string
  status: 'transcribing' | 'generating_captions' | 'generating_summary'
  message: string
}

export interface AudioAnalysisStatusResponse {
  analysis: {
    caption_summary?: string[]
    transcript?: string[]
    visual_captions?: string[][]
  }
  errors: Array<Record<string, unknown>>
  file_info: {
    name: string
    path: string
    upload_time: string
  }
  media_id: string
  process_status: {
    caption_summary: 'not_started' | 'in_progress' | 'completed' | 'failed'
    transcript: 'not_started' | 'in_progress' | 'completed' | 'failed'
    visual_captions: 'not_started' | 'in_progress' | 'completed' | 'failed'
  }
  timing: {
    caption_summary?: number[]
    transcript?: number[]
    upload: number
    visual_captions?: number[]
  }
  type: 'video' | 'audio' | 'transcript'
}

// Vibe generation types
export interface AudioVibeGenerateRequest {
  model?: 'gemma-3-4b-it' | 'gpt-4'
  media_id?: string
  video_description?: string
  num_outputs?: number
}

export interface AudioVibeGenerateResponse {
  vibes: string[]
}

// Music prompt types
export interface AudioMusicPromptRequest {
  model?: 'gemma-3-4b-it' | 'gpt-4'
  media_id?: string
  video_description?: string
  vibe?: string
  num_outputs?: number
  structure_output?: boolean
}

export interface AudioStructuredPrompt {
  music_genre: string
  music_instruments: string
  mood: string
  theme: string
  energy: string
}

export interface AudioMusicPromptResponse {
  prompts: AudioStructuredPrompt[]
  vibe: string
}

// Music generation types
export interface AudioMusicGenerationParameters {
  duration?: number
  intro?: boolean
  outro?: boolean
  loop?: boolean
  bpm?: number
  seed?: number
  audio?: string
}

export interface AudioMusicGenerateRequest {
  model?: 'gemma-3-4b-it' | 'gpt-4'
  media_id?: string
  video_description?: string
  vibe?: string
  prompt?: string | AudioStructuredPrompt
  prompts?: (string | AudioStructuredPrompt)[]
  num_outputs?: number
  parameters?: AudioMusicGenerationParameters
  generate_title?: boolean
}

export interface AudioMusicGenerateResponse {
  job_id: string
  model_release_date: string
  model_version: string
  wait_time_in_seconds: number
  vibe?: string
  prompt?: string
  prompts?: string
  song_title?: string
  song_titles?: string[]
}

// Music extension and variation types
export interface AudioMusicExtensionRequest {
  prompt?: string | AudioStructuredPrompt
  prompts?: (string | AudioStructuredPrompt)[]
  num_outputs?: number
  parameters: AudioMusicGenerationParameters & {
    audio: string
  }
}

export interface AudioMusicVariationRequest {
  prompt?: string | AudioStructuredPrompt
  prompts?: (string | AudioStructuredPrompt)[]
  num_outputs?: number
  parameters: AudioMusicGenerationParameters & {
    audio: string
  }
}

// Music status types
export interface AudioMusicStatusResponse {
  status: 'pending' | 'completed' | 'failed'
  captions?: string[]
  model_release_date: string
  model_version: string
  urls?: string[]
}

// Beat detection types
export interface AudioBeatDetectionRequest {
  audio: string
}

export interface AudioBeatEvent {
  time: number
  type: 0 | 1 | 2 // 0 for downbeat, 1 for beat, 2 for onset
}

export interface AudioBeatDetectionResponse {
  bpm: number
  time_signature: string
  version: string
  events: AudioBeatEvent[]
}

// Duration types
export interface AudioDurationResponse {
  media_id: string
  duration: number
  duration_formatted: string
}

// Analysis request options
export interface AudioCaptionAnalysisOptions {
  segment_scenes?: boolean
}

export interface AudioCaptionSummaryOptions {
  model?: 'gemma-3-4b-it' | 'gpt-4'
}

// Error response type
export interface AudioErrorResponse {
  error: string
} 