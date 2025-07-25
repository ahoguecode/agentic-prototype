import React, { useState, useEffect } from 'react'
import { apis, FireflyDimensions } from '../services'
import {
  Button,
  TextField,
  View,
  Heading,
  Flex,
  Text,
  Image,
  ComboBox,
  Item,
  ProgressCircle
} from '@adobe/react-spectrum'
import { IMS } from '../utils/IMS'

interface GeneratedImage {
  url: string
  seed: number
}

const FireflyImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState('square')

  // Check IMS authentication on component mount
  useEffect(() => {
    if (!IMS.tokenData) {
      IMS.adobeIMS.signIn()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || !IMS.tokenData) return

    setLoading(true)
    setError(null)

    try {
      const response = await apis.firefly.generate(prompt, IMS.tokenData.token, IMS.adobeid.client_id, {
        size: FireflyDimensions[selectedSize as keyof typeof FireflyDimensions]
      })

      // Convert the response to our internal format
      const newImages = response.outputs.map(output => ({
        url: output.image.presignedUrl || '',
        seed: output.seed
      }))

      setImages(prevImages => [...newImages, ...prevImages])
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // If not authenticated, show sign-in message
  if (!IMS.tokenData) {
    return (
      <View padding="size-200">
        <Heading level={2}>Firefly Image Generator</Heading>
        <Text>Please sign in with your Adobe ID to use the Firefly Image Generator.</Text>
      </View>
    )
  }

  return (
    <View padding="size-200">
      <Heading level={2}>Firefly Image Generator</Heading>

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="size-100">
          <Flex gap="size-100" alignItems="end">
            <TextField
              width="100%"
              value={prompt}
              onChange={setPrompt}
              label="Enter your prompt"
              placeholder="A serene landscape with mountains and a lake..."
              isDisabled={loading}
            />
            <ComboBox
              width="size-2400"
              label="Size"
              defaultSelectedKey="square"
              onSelectionChange={selected => setSelectedSize(selected?.toString() || 'square')}
              isDisabled={loading}
            >
              <Item key="square">Square</Item>
              <Item key="landscape">Landscape</Item>
              <Item key="portrait">Portrait</Item>
              <Item key="widescreen">Widescreen</Item>
            </ComboBox>
            <Button
              type="submit"
              variant="primary"
              isDisabled={loading || !prompt.trim()}
            >
              Generate
            </Button>
          </Flex>

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
            <Flex alignItems="center" gap="size-100" justifyContent="center" marginY="size-200">
              <ProgressCircle size="S" aria-label="Generating image..." isIndeterminate />
              <Text>Generating your image...</Text>
            </Flex>
          )}
        </Flex>
      </form>

      {images.length > 0 && (
        <Flex direction="column" gap="size-200" marginTop="size-400">
          <Heading level={3}>Generated Images</Heading>
          <Flex wrap gap="size-200">
            {images.map((image, index) => (
              <View
                key={`${image.seed}-${index}`}
                padding="size-100"
                UNSAFE_style={{
                  backgroundColor: 'var(--spectrum-global-color-gray-100)',
                  borderRadius: 'var(--spectrum-global-dimension-size-100)'
                }}
              >
                <Image
                  src={image.url}
                  alt={`Generated image ${index + 1}`}
                  UNSAFE_style={{
                    maxWidth: '300px',
                    height: 'auto',
                    borderRadius: 'var(--spectrum-global-dimension-size-50)'
                  }}
                />
                <Text UNSAFE_style={{ fontSize: 'var(--spectrum-global-dimension-size-150)' }}>
                  Seed: {image.seed}
                </Text>
              </View>
            ))}
          </Flex>
        </Flex>
      )}
    </View>
  )
}

export default FireflyImageGenerator 