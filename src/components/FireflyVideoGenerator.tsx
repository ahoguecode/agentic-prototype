import React, { useState, useEffect } from 'react'
import { apis } from '../services'
import {
  Button,
  TextField,
  View,
  Heading,
  Flex,
  Text,
  ComboBox,
  Item,
  ProgressCircle,
  NumberField,
  Picker,
  Well,
  ActionButton,
  FileTrigger,
  TooltipTrigger,
  Tooltip,
  StatusLight
} from '@adobe/react-spectrum'
import { IMS } from '../utils/IMS'
import { FireflyVideoOutput, FireflyVideoGenerateStatusResponse, FireflyVideoResult, VideoSettings, FireflyVideoGenerateResponse } from '../services/firefly/fireflyTypes'

interface GeneratedVideo {
  url: string
  seed: number
}

interface UploadedImage {
  id: string
  file: File
  preview: string
}

const VIDEO_DIMENSIONS = {
  'HD (1080p)': { width: 1920, height: 1080 },
  'HD (720p)': { width: 1280, height: 720 },
  'SD (480p)': { width: 854, height: 480 },
  'Portrait Mobile': { width: 540, height: 960 }
} as const

const CAMERA_MOTION_OPTIONS = [
  'camera pan left',
  'camera pan right', 
  'camera zoom in', 
  'camera zoom out', 
  'camera tilt up', 
  'camera tilt down', 
  'camera locked down', 
  'camera handheld'
] as const

const SHOT_ANGLE_OPTIONS = [
  'aerial shot',
  'eye_level shot',
  'high angle shot',
  'low angle shot',
  'top-down shot'
] as const

const PROMPT_STYLE_OPTIONS = [
  'anime',
  '3d',
  'fantasy',
  'cinematic',
  'claymation',
  'line art',
  'stop motion',
  '2d',
  'vector art',
  'black and white'
] as const

const SHOT_SIZE_OPTIONS = [
  'close-up shot',
  'extreme close-up',
  'medium shot',
  'long shot',
  'extreme long shot'
] as const

const IMAGE_PLACEMENT_OPTIONS = [
  { id: '0', name: 'Start Frame (0%)', value: 0 },
  { id: '0.5', name: 'Middle Frame (50%)', value: 0.5 },
  { id: '1', name: 'End Frame (100%)', value: 1 }
] as const

const FireflyVideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('deep zoom into owl\'s eyes revealing infinity')
  const [negativePrompt, setNegativePrompt] = useState('cartoon, vector art, & bad aesthetics & poor aesthetic')
  const [videos, setVideos] = useState<GeneratedVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState('Portrait Mobile')
  const [numFrames, setNumFrames] = useState(128)
  
  // Video settings
  const [cameraMotion, setCameraMotion] = useState<typeof CAMERA_MOTION_OPTIONS[number]>('camera locked down')
  const [shotAngle, setShotAngle] = useState<typeof SHOT_ANGLE_OPTIONS[number]>('aerial shot')
  const [promptStyle, setPromptStyle] = useState<typeof PROMPT_STYLE_OPTIONS[number]>('cinematic')
  const [shotSize, setShotSize] = useState<typeof SHOT_SIZE_OPTIONS[number]>('close-up shot')
  
  // Image upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [imagePlacement, setImagePlacement] = useState<string>('0')

  // Check IMS authentication on component mount
  useEffect(() => {
    if (!IMS.tokenData) {
      IMS.adobeIMS.signIn()
    }
  }, [])

  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    setSelectedFile(file)
    setUploadSuccess(false)
    
    // Automatically start upload
    uploadImage(file)
  }
  
  const uploadImage = async (file: File) => {
    if (!IMS.tokenData) return
    
    setIsUploading(true)
    setError(null)
    
    try {
      console.log('Starting image upload to video service:', file.type, file.size)
      
      // Create preview
      const preview = URL.createObjectURL(file)
      
      // Upload to Firefly Video service using XMLHttpRequest method
      const response = await apis.firefly.uploadVideoImage(file, IMS.tokenData.token, IMS.adobeid.client_id)
      
      console.log('Image upload response:', response)
      
      if (response.images && response.images.length > 0) {
        const newImage: UploadedImage = {
          id: response.images[0].id,
          file: file,
          preview
        }
        
        console.log('Successfully uploaded image with ID:', newImage.id)
        
        setUploadedImages(prev => [...prev, newImage])
        setSelectedFile(null)
        setUploadSuccess(true)
        
        // Reset success status after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Image upload error details:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }
  
  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      // Revoke object URLs to avoid memory leaks
      const removed = prev.find(img => img.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.preview)
      }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !IMS.tokenData) return

    setLoading(true)
    setError(null)
    setProgress(0)

    try {
      const response = await initiateVideoGeneration()
      await monitorGenerationProgress(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const initiateVideoGeneration = async () => {
    // Prepare video settings
    const videoSettings: VideoSettings = {
      cameraMotion,
      shotAngle,
      promptStyle,
      shotSize
    }
    
    // Prepare image conditions if uploaded
    const imageOption = uploadedImages.length > 0 ? {
      image: {
        conditions: uploadedImages.map(img => ({
          placement: { start: parseFloat(imagePlacement) },
          source: { id: img.id }
        }))
      }
    } : {}
    
    console.log('Video generation request details:', {
      prompt,
      videoSettings,
      size: VIDEO_DIMENSIONS[selectedSize as keyof typeof VIDEO_DIMENSIONS],
      numFrames,
      imageOption
    })

    // Initial request to start generation
    const requestOptions = {
      sizes: [{
        ...VIDEO_DIMENSIONS[selectedSize as keyof typeof VIDEO_DIMENSIONS],
        numFrames
      }],
      videoSettings,
      locale: 'en-US',
      negativePrompt,
      output: {
        storeInputs: false
      },
      ...imageOption
    }

    const response = await apis.firefly.generateVideo(
      prompt, 
      IMS.tokenData!.token, 
      IMS.adobeid.client_id, 
      requestOptions
    )
    
    console.log('Video generation initial response:', response)
    return response
  }

  const monitorGenerationProgress = async (initialResponse: FireflyVideoGenerateResponse) => {
    // Poll for status
    let status: FireflyVideoGenerateStatusResponse | FireflyVideoResult = await apis.firefly.checkVideoStatus(
      initialResponse.links.result.href,
      IMS.tokenData!.token,
      IMS.adobeid.client_id
    )
    
    // Track the current result URL
    let currentResultUrl = initialResponse.links.result.href

    // Wait until generation is complete
    while ('progress' in status && status.progress < 100) {
      setProgress(status.progress)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update the URL if the response contains a new one
      if ('links' in status && status.links?.result?.href) {
        currentResultUrl = status.links.result.href
      }
      
      // Use the latest URL for the next status check
      status = await apis.firefly.checkVideoStatus(
        currentResultUrl,
        IMS.tokenData!.token,
        IMS.adobeid.client_id
      )
    }

    // Process completed generation
    if ('outputs' in status) {
      const newVideos = status.outputs.map((output: FireflyVideoOutput) => ({
        url: output.video?.presignedUrl || '',
        seed: output.seed
      }))

      setVideos(prevVideos => [...newVideos, ...prevVideos])
      setPrompt('')
    }
  }

  // If not authenticated, show sign-in message
  if (!IMS.tokenData) {
    return (
      <View padding="size-200">
        <Heading level={2}>Firefly Video Generator</Heading>
        <Text>Please sign in with your Adobe ID to use the Firefly Video Generator.</Text>
      </View>
    )
  }

  return (
    <View padding="size-200">
      <Heading level={2}>Firefly Video Generator</Heading>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="size-100">
          <TextField
            label="Prompt"
            value={prompt}
            onChange={setPrompt}
            width="100%"
            isRequired
          />
          
          <TextField
            label="Negative Prompt"
            value={negativePrompt}
            onChange={setNegativePrompt}
            width="100%"
          />
          
          <Heading level={3}>Video Settings</Heading>
          
          <Flex gap="size-100" wrap>
            <ComboBox
              label="Video Size"
              defaultSelectedKey={selectedSize}
              onSelectionChange={selected => setSelectedSize(selected as string)}
            >
              {Object.keys(VIDEO_DIMENSIONS).map(size => (
                <Item key={size}>{size}</Item>
              ))}
            </ComboBox>
            
            <NumberField
              label="Number of Frames"
              value={numFrames}
              onChange={setNumFrames}
              minValue={1}
              maxValue={256}
            />
          </Flex>

          <Flex direction="column" gap="size-100">
            <Heading level={4}>Style Settings</Heading>
            <Flex gap="size-100" wrap>
              <Picker 
                label="Camera Motion" 
                items={CAMERA_MOTION_OPTIONS.map(option => ({id: option, name: option}))}
                selectedKey={cameraMotion}
                onSelectionChange={selected => setCameraMotion(selected as typeof CAMERA_MOTION_OPTIONS[number])}
              >
                {item => <Item key={item.id}>{item.name}</Item>}
              </Picker>

              <Picker 
                label="Shot Angle" 
                items={SHOT_ANGLE_OPTIONS.map(option => ({id: option, name: option}))}
                selectedKey={shotAngle}
                onSelectionChange={selected => setShotAngle(selected as typeof SHOT_ANGLE_OPTIONS[number])}
              >
                {item => <Item key={item.id}>{item.name}</Item>}
              </Picker>

              <Picker 
                label="Visual Style" 
                items={PROMPT_STYLE_OPTIONS.map(option => ({id: option, name: option}))}
                selectedKey={promptStyle}
                onSelectionChange={selected => setPromptStyle(selected as typeof PROMPT_STYLE_OPTIONS[number])}
              >
                {item => <Item key={item.id}>{item.name}</Item>}
              </Picker>

              <Picker 
                label="Shot Size" 
                items={SHOT_SIZE_OPTIONS.map(option => ({id: option, name: option}))}
                selectedKey={shotSize}
                onSelectionChange={selected => setShotSize(selected as typeof SHOT_SIZE_OPTIONS[number])}
              >
                {item => <Item key={item.id}>{item.name}</Item>}
              </Picker>
            </Flex>
          </Flex>

          <Heading level={4}>Reference Images</Heading>
          <Text>Upload images to use as reference frames in your video</Text>
          
          <Flex direction="column" gap="size-100">
            <Flex gap="size-100" alignItems="end" wrap>
              <View>
                <FileTrigger
                  acceptedFileTypes={['image/jpeg', 'image/png']}
                  onSelect={handleFileSelection}
                >
                  <Button variant="secondary" isDisabled={loading || isUploading}>Select Image {isUploading && '(Uploading...)'}</Button>
                </FileTrigger>
                {selectedFile && !isUploading && !uploadSuccess && (
                  <Text marginTop="size-50">
                    Selected: {selectedFile.name}
                  </Text>
                )}
                {isUploading && (
                  <Flex marginTop="size-50" alignItems="center" gap="size-100">
                    <ProgressCircle size="S" aria-label="Uploading..." isIndeterminate />
                    <Text>Uploading...</Text>
                  </Flex>
                )}
                {uploadSuccess && (
                  <StatusLight marginTop="size-50" variant="positive">Upload successful</StatusLight>
                )}
                {error && (
                  <StatusLight marginTop="size-50" variant="negative">Upload failed: {error}</StatusLight>
                )}
              </View>
            </Flex>
            
            <Picker 
              label="Image Placement in Video" 
              items={IMAGE_PLACEMENT_OPTIONS}
              selectedKey={imagePlacement}
              onSelectionChange={selected => setImagePlacement(selected as string)}
              width="size-3000"
              marginTop="size-100"
              isDisabled={uploadedImages.length === 0}
            >
              {item => <Item key={item.id}>{item.name}</Item>}
            </Picker>
            
            {uploadedImages.length > 0 && (
              <Well marginTop="size-100">
                <Flex direction="column" gap="size-100">
                  <Text>Uploaded Images</Text>
                  <Flex gap="size-100" wrap>
                    {uploadedImages.map(img => (
                      <TooltipTrigger key={img.id}>
                        <View UNSAFE_style={{ position: 'relative' }}>
                          <img 
                            src={img.preview} 
                            alt="Uploaded reference" 
                            style={{ 
                              width: 100, 
                              height: 100, 
                              objectFit: 'cover',
                              borderRadius: 'var(--spectrum-alias-border-radius-regular)'
                            }} 
                          />
                          <ActionButton
                            isQuiet
                            UNSAFE_style={{ 
                              position: 'absolute', 
                              top: 0, 
                              right: 0 
                            }}
                            onPress={() => removeImage(img.id)}
                          >
                            ✕
                          </ActionButton>
                        </View>
                        <Tooltip>
                          {img.file.name} - Will be placed at {IMAGE_PLACEMENT_OPTIONS.find(opt => opt.id === imagePlacement)?.name}
                        </Tooltip>
                      </TooltipTrigger>
                    ))}
                  </Flex>
                </Flex>
              </Well>
            )}
          </Flex>
          
          <Button
            type="submit"
            variant="primary"
            isDisabled={loading || !prompt.trim()}
            marginTop="size-100"
          >
            Generate Video
          </Button>
        </Flex>
      </form>

      {loading && (
        <Flex direction="column" gap="size-100" marginTop="size-200" alignItems="center">
          <ProgressCircle
            aria-label="Loading..."
            value={progress}
            size="L"
          />
          <Text>Generating video... {progress}%</Text>
        </Flex>
      )}

      {error && (
        <Text marginTop="size-200" UNSAFE_style={{ color: 'var(--spectrum-semantic-negative-color-text)' }}>
          Error: {error}
        </Text>
      )}

      {videos.length > 0 && (
        <View marginTop="size-200">
          <Heading level={3}>Generated Videos</Heading>
          <Flex direction="column" gap="size-200">
            {videos.map((video, index) => (
              <View key={`${video.seed}-${index}`}>
                <video
                  controls
                  width="100%"
                  src={video.url}
                  style={{ maxWidth: '100%', borderRadius: 'var(--spectrum-alias-border-radius-regular)' }}
                >
                  Your browser does not support the video tag.
                </video>
                <Text>Seed: {video.seed}</Text>
              </View>
            ))}
          </Flex>
        </View>
      )}
    </View>
  )
}

export default FireflyVideoGenerator 