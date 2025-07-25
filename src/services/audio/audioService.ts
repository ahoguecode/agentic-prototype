import { createApiClient } from '../apiClient'
import { registerApi } from '../apiRegistry'
import { AUDIO_API } from './audioConstants'
import {
  AudioUploadResponse,
  AudioS3UploadResponse,
  AudioAnalysisStartResponse,
  AudioAnalysisStatusResponse,
  AudioVibeGenerateRequest,
  AudioVibeGenerateResponse,
  AudioMusicPromptRequest,
  AudioMusicPromptResponse,
  AudioMusicGenerateRequest,
  AudioMusicGenerateResponse,
  AudioMusicExtensionRequest,
  AudioMusicVariationRequest,
  AudioMusicStatusResponse,
  AudioBeatDetectionRequest,
  AudioBeatDetectionResponse,
  AudioDurationResponse,
  AudioCaptionAnalysisOptions,
  AudioCaptionSummaryOptions
} from './audioTypes'

// Common API configuration
const commonConfig = {
  headers: AUDIO_API.COMMON_HEADERS,
  timeout: AUDIO_API.DEFAULT_TIMEOUT,
  retries: AUDIO_API.DEFAULT_RETRIES
}

// Register Audio API with the registry
registerApi('audio', {
  baseUrl: AUDIO_API.BASE_URL,
  ...commonConfig
})

// Create API client
const audioClient = createApiClient({
  baseUrl: AUDIO_API.BASE_URL,
  ...commonConfig
})

// Upload Functions
export async function uploadVideo(videoFile: File): Promise<AudioUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('video', videoFile)

    const response = await audioClient.post<AudioUploadResponse>('/upload/video', formData, {
      'Content-Type': 'multipart/form-data'
    })
    return response
  } catch (error) {
    console.error('Error uploading video:', error)
    throw error
  }
}

export async function uploadAudio(audioFile: File): Promise<AudioUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('audio', audioFile)

    const response = await audioClient.post<AudioUploadResponse>('/upload/audio', formData, {
      'Content-Type': 'multipart/form-data'
    })
    return response
  } catch (error) {
    console.error('Error uploading audio:', error)
    throw error
  }
}

export async function uploadTranscript(transcriptFile: File): Promise<AudioUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('transcript', transcriptFile)

    const response = await audioClient.post<AudioUploadResponse>('/upload/transcript', formData, {
      'Content-Type': 'multipart/form-data'
    })
    return response
  } catch (error) {
    console.error('Error uploading transcript:', error)
    throw error
  }
}

export async function uploadMediaToS3(ldap: string, mediaFile: File): Promise<AudioS3UploadResponse> {
  try {
    const formData = new FormData()
    formData.append('ldap', ldap)
    formData.append('file', mediaFile)

    const response = await audioClient.post<AudioS3UploadResponse>('/upload/media-to-s3', formData, {
      'Content-Type': 'multipart/form-data'
    })
    return response
  } catch (error) {
    console.error('Error uploading media to S3:', error)
    throw error
  }
}

// Analysis Functions
export async function startTranscriptGeneration(mediaId: string): Promise<AudioAnalysisStartResponse> {
  try {
    const response = await audioClient.post<AudioAnalysisStartResponse>(`/analyze/transcript/${mediaId}`, {})
    return response
  } catch (error) {
    console.error('Error starting transcript generation:', error)
    throw error
  }
}

export async function startCaptionGeneration(
  mediaId: string, 
  options: AudioCaptionAnalysisOptions = {}
): Promise<AudioAnalysisStartResponse> {
  try {
    const response = await audioClient.post<AudioAnalysisStartResponse>(
      `/analyze/captions/${mediaId}`, 
      options
    )
    return response
  } catch (error) {
    console.error('Error starting caption generation:', error)
    throw error
  }
}

export async function startCaptionSummary(
  mediaId: string, 
  options: AudioCaptionSummaryOptions = {}
): Promise<AudioAnalysisStartResponse> {
  try {
    const response = await audioClient.post<AudioAnalysisStartResponse>(
      `/analyze/caption-summary/${mediaId}`, 
      options
    )
    return response
  } catch (error) {
    console.error('Error starting caption summary:', error)
    throw error
  }
}

export async function getAnalysisStatus(mediaId: string): Promise<AudioAnalysisStatusResponse> {
  try {
    const response = await audioClient.get<AudioAnalysisStatusResponse>(`/analysis-status/${mediaId}`)
    return response
  } catch (error) {
    console.error('Error getting analysis status:', error)
    throw error
  }
}

// Vibe and Prompt Generation Functions
export async function generateVibe(request: AudioVibeGenerateRequest): Promise<AudioVibeGenerateResponse> {
  try {
    const response = await audioClient.post<AudioVibeGenerateResponse>('/generate/vibe', request)
    return response
  } catch (error) {
    console.error('Error generating vibe:', error)
    throw error
  }
}

export async function generateMusicPrompt(request: AudioMusicPromptRequest): Promise<AudioMusicPromptResponse> {
  try {
    const response = await audioClient.post<AudioMusicPromptResponse>('/generate/music-prompt', request)
    return response
  } catch (error) {
    console.error('Error generating music prompt:', error)
    throw error
  }
}

// Music Generation Functions
export async function generateMusic(request: AudioMusicGenerateRequest): Promise<AudioMusicGenerateResponse> {
  try {
    const response = await audioClient.post<AudioMusicGenerateResponse>('/generate/music', request)
    return response
  } catch (error) {
    console.error('Error generating music:', error)
    throw error
  }
}

export async function generateMusicExtension(request: AudioMusicExtensionRequest): Promise<AudioMusicGenerateResponse> {
  try {
    const response = await audioClient.post<AudioMusicGenerateResponse>('/generate/music-extension', request)
    return response
  } catch (error) {
    console.error('Error generating music extension:', error)
    throw error
  }
}

export async function generateMusicVariation(request: AudioMusicVariationRequest): Promise<AudioMusicGenerateResponse> {
  try {
    const response = await audioClient.post<AudioMusicGenerateResponse>('/generate/music-variation', request)
    return response
  } catch (error) {
    console.error('Error generating music variation:', error)
    throw error
  }
}

export async function getMusicStatus(jobId: string): Promise<AudioMusicStatusResponse> {
  try {
    const response = await audioClient.get<AudioMusicStatusResponse>(`/music-status/${jobId}`)
    return response
  } catch (error) {
    console.error('Error getting music status:', error)
    throw error
  }
}

// Utility Functions
export async function detectBeats(request: AudioBeatDetectionRequest): Promise<AudioBeatDetectionResponse> {
  try {
    const response = await audioClient.post<AudioBeatDetectionResponse>('/detect-beats', request)
    return response
  } catch (error) {
    console.error('Error detecting beats:', error)
    throw error
  }
}

export async function getMediaDuration(mediaId: string): Promise<AudioDurationResponse> {
  try {
    const response = await audioClient.get<AudioDurationResponse>(`/get-duration/${mediaId}`)
    return response
  } catch (error) {
    console.error('Error getting media duration:', error)
    throw error
  }
}

// Convenience Functions for common workflows
export async function uploadAndAnalyzeVideo(
  videoFile: File,
  options: { 
    generateTranscript?: boolean
    generateCaptions?: boolean
    generateSummary?: boolean
    captionOptions?: AudioCaptionAnalysisOptions
    summaryOptions?: AudioCaptionSummaryOptions
  } = {}
): Promise<{
  uploadResponse: AudioUploadResponse
  transcriptResponse?: AudioAnalysisStartResponse
  captionResponse?: AudioAnalysisStartResponse
  summaryResponse?: AudioAnalysisStartResponse
}> {
  const uploadResponse = await uploadVideo(videoFile)
  const result: {
    uploadResponse: AudioUploadResponse
    transcriptResponse?: AudioAnalysisStartResponse
    captionResponse?: AudioAnalysisStartResponse
    summaryResponse?: AudioAnalysisStartResponse
  } = { uploadResponse }

  if (options.generateTranscript) {
    result.transcriptResponse = await startTranscriptGeneration(uploadResponse.media_id)
  }

  if (options.generateCaptions) {
    result.captionResponse = await startCaptionGeneration(uploadResponse.media_id, options.captionOptions)
  }

  if (options.generateSummary && options.generateCaptions) {
    // Wait a bit for captions to start before generating summary
    setTimeout(async () => {
      result.summaryResponse = await startCaptionSummary(uploadResponse.media_id, options.summaryOptions)
    }, 2000)
  }

  return result
}

export async function generateMusicFromVideo(
  videoFile: File,
  musicRequest: Omit<AudioMusicGenerateRequest, 'media_id'>,
  options: {
    generateTranscript?: boolean
    generateCaptions?: boolean
    generateSummary?: boolean
  } = { generateTranscript: true, generateCaptions: true, generateSummary: true }
): Promise<{
  uploadResponse: AudioUploadResponse
  musicResponse: AudioMusicGenerateResponse
}> {
  // Upload and analyze video
  const { uploadResponse } = await uploadAndAnalyzeVideo(videoFile, options)

  // Generate music using the media_id
  const musicResponse = await generateMusic({
    ...musicRequest,
    media_id: uploadResponse.media_id
  })

  return { uploadResponse, musicResponse }
}
