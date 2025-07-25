import React, { useState } from 'react';
import { apis } from '../services';
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
} from '@adobe/react-spectrum';

interface GeneratedImage {
  url: string;
  model: string;
}

const FalImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('fal-ai/imagen3/fast');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apis.fal.generateImage({
        prompt,
        model: selectedModel
      });

      // Add new images to our collection
      if (response.data?.images) {
        const newImages = response.data.images.map(image => ({
          url: image.url,
          model: selectedModel
        }));
        
        setImages(prevImages => [...newImages, ...prevImages]);
        setPrompt('');
      } else {
        throw new Error('No images were generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View padding="size-200">
      <Heading level={2}>Fal AI Image Generator</Heading>

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="size-100">
          <Flex gap="size-100" alignItems="end">
            <TextField
              width="100%"
              value={prompt}
              onChange={setPrompt}
              label="Enter your prompt"
              placeholder="A photo of an astronaut riding a horse on mars..."
              isDisabled={loading}
            />
            <ComboBox
              width="size-2400"
              label="Model"
              defaultSelectedKey="fal-ai/imagen3/fast"
              onSelectionChange={selected => setSelectedModel(selected?.toString() || 'fal-ai/imagen3/fast')}
              isDisabled={loading}
            >
              <Item key="fal-ai/imagen3/fast">Imagen 3 (Fast)</Item>
              <Item key="fal-ai/imagen3/text-to-image">Imagen 3 (Standard)</Item>
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
              <Text>Generating your image with Fal AI...</Text>
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
                key={`${image.url}-${index}`}
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
                  Model: {image.model.split('/').pop()}
                </Text>
              </View>
            ))}
          </Flex>
        </Flex>
      )}
    </View>
  );
};

export default FalImageGenerator; 