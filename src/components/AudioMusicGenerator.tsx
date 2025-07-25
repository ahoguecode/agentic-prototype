import React, { useState } from 'react'
import { generateMusic, getMusicStatus, MUSIC_GENERATION_PARAMETERS, AudioMusicGenerateRequest } from '../services'
import {
  Button,
  TextField,
  View,
  Heading,
  Flex,
  Text,
  ProgressCircle,
  NumberField,
  Checkbox
} from '@adobe/react-spectrum'

interface GeneratedMusic {
  url: string
  title?: string
}

const AudioMusicGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [jobId, setJobId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [music, setMusic] = useState<GeneratedMusic[]>([])
  const [progress, setProgress] = useState<string>('pending')
  
  // Music parameters
  const [duration, setDuration] = useState(60)
  const [includeIntro, setIncludeIntro] = useState(true)
  const [includeOutro, setIncludeOutro] = useState(true)
  const [numOutputs, setNumOutputs] = useState(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    setJobId('')
    setProgress('pending')

    try {
      const response = await initiateMusicGeneration()
      await monitorGenerationProgress(response.job_id, response.wait_time_in_seconds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
      setProgress('pending')
    }
  }

  const initiateMusicGeneration = async () => {
    const request: AudioMusicGenerateRequest = {
      prompt: prompt.trim(),
      num_outputs: numOutputs,
      parameters: {
        duration,
        intro: includeIntro,
        outro: includeOutro
      }
    }

    const response = await generateMusic(request)
    setJobId(response.job_id)
    console.log('Music generation initial response:', response)
    return response
  }

  const monitorGenerationProgress = async (jobId: string, waitTime?: number) => {
    // Wait for the initial wait time if provided
    if (waitTime && waitTime > 0) {
      setProgress('processing')
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
    }
    
    // Poll for status
    let status
    try {
      status = await getMusicStatus(jobId)
         } catch (error) {
       // If we get an error, wait a bit more and try again
       console.log('Initial status check failed, waiting longer...', error)
       setProgress('waiting for processing to start')
       await new Promise(resolve => setTimeout(resolve, 5000))
       status = await getMusicStatus(jobId)
     }
    
    // Wait until generation is complete
    while (status.status === 'pending') {
      setProgress(status.status)
      await new Promise(resolve => setTimeout(resolve, 3000)) // Check every 3 seconds
      try {
        status = await getMusicStatus(jobId)
      } catch (error) {
        // If we get an error during polling, wait a bit and try again
        console.log('Status check failed, retrying...', error)
        await new Promise(resolve => setTimeout(resolve, 2000))
        continue
      }
    }

    // Process completed generation
    if (status.status === 'completed' && status.urls) {
      const newMusic = status.urls.map((url, index) => ({
        url,
        title: status.captions?.[index] || `Generated Music ${index + 1}`
      }))

      setMusic(prevMusic => [...newMusic, ...prevMusic])
      setPrompt('')
    } else if (status.status === 'failed') {
      throw new Error('Music generation failed')
    }
  }

  return (
    <View padding="size-200">
      <Heading level={2}>Audio Music Generator</Heading>
      <Text>Generate music using AI from text prompts.</Text>

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="size-200" marginTop="size-200">
          
          <TextField
            width="100%"
            value={prompt}
            onChange={setPrompt}
            label="Music Prompt"
            placeholder="Energetic rock song with powerful electric guitars and driving drums..."
            isDisabled={loading}
          />

          <Heading level={4}>Music Parameters</Heading>
          <Flex gap="size-200" wrap>
            <NumberField
              label="Duration (seconds)"
              value={duration}
              onChange={setDuration}
              minValue={MUSIC_GENERATION_PARAMETERS.MIN_DURATION}
              maxValue={MUSIC_GENERATION_PARAMETERS.MAX_DURATION}
              width="size-1600"
            />
            <NumberField
              label="Number of Outputs"
              value={numOutputs}
              onChange={setNumOutputs}
              minValue={1}
              maxValue={8}
              width="size-1200"
            />
          </Flex>
          
          <Flex gap="size-200" wrap>
            <Checkbox
              isSelected={includeIntro}
              onChange={setIncludeIntro}
            >
              Include Intro
            </Checkbox>
            <Checkbox
              isSelected={includeOutro}
              onChange={setIncludeOutro}
            >
              Include Outro
            </Checkbox>
          </Flex>

          <Button
            type="submit"
            variant="primary"
            isDisabled={loading || !prompt.trim()}
          >
            {loading ? 'Generating...' : 'Generate Music'}
          </Button>

          {error && (
            <View
              padding="size-100"
              UNSAFE_style={{
                backgroundColor: 'var(--spectrum-semantic-negative-color-background)',
                borderRadius: 'var(--spectrum-global-dimension-size-50)'
              }}
            >
              <Text><strong>Error:</strong> {error}</Text>
            </View>
          )}

          {loading && (
            <Flex direction="column" gap="size-100" marginTop="size-200" alignItems="center">
              <ProgressCircle
                aria-label="Generating music..."
                size="L"
                isIndeterminate
              />
              <Text>Generating your music... Status: {progress}</Text>
              {jobId && <Text>Job ID: {jobId}</Text>}
            </Flex>
          )}

          {music.length > 0 && (
            <View marginTop="size-200">
              <Heading level={3}>Generated Music</Heading>
              <Flex direction="column" gap="size-200">
                {music.map((track, index) => (
                  <View key={`${track.url}-${index}`}>
                    <audio
                      controls
                      src={track.url}
                      style={{ width: '100%' }}
                    >
                      Your browser does not support the audio tag.
                    </audio>
                    <Text>{track.title}</Text>
                  </View>
                ))}
              </Flex>
            </View>
          )}
        </Flex>
      </form>
    </View>
  )
}

export default AudioMusicGenerator 