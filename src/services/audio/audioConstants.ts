export const AUDIO_API = {
  BASE_URL: 'https://pluto-prod-fraser-firefly-music-0-8000.colligo.dev',
  INTERNAL_BASE_URL: 'http://pluto-prod-fraser-firefly-music-0:8000',
  DEFAULT_TIMEOUT: 120000, // 2 minutes for longer music generation operations
  DEFAULT_RETRIES: 3,
  COMMON_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const

export const AUDIO_STATUS = {
  VIDEO_UPLOADED: 'video_uploaded',
  AUDIO_UPLOADED: 'audio_uploaded',
  TRANSCRIPT_UPLOADED: 'transcript_uploaded',
  TRANSCRIBING: 'transcribing',
  GENERATING_CAPTIONS: 'generating_captions',
  GENERATING_SUMMARY: 'generating_summary',
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress'
} as const

export const ANALYSIS_MODELS = {
  GEMMA_3_4B_IT: 'gemma-3-4b-it',
  GPT_4: 'gpt-4'
} as const

export const MUSIC_GENERATION_PARAMETERS = {
  MAX_DURATION: 300, // 5 minutes in seconds
  MIN_DURATION: 0,
  DEFAULT_NUM_OUTPUTS: 4,
  DEFAULT_PNG_SCALE: 2
} as const

export const BEAT_DETECTION_EVENTS = {
  DOWNBEAT: 0,
  BEAT: 1,
  ONSET: 2
} as const
