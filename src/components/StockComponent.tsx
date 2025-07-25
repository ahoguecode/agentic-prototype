import React, { useState, useEffect } from 'react'
import { apis } from '../services'
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
  ProgressCircle,
  Grid
} from '@adobe/react-spectrum'
import { IMS } from '../utils/IMS'
import { STOCK_API } from '../services/stock/stockConstants'
import { AdobeStockResult } from '../services/stock/stockTypes'

interface StockImage {
  id: number
  title: string
  thumbnailUrl: string
  width: number
  height: number
  creatorName: string
}

const StockComponent: React.FC = () => {
  const [query, setQuery] = useState('')
  const [images, setImages] = useState<StockImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentType, setContentType] = useState('photo')

  // Check IMS authentication on component mount
  useEffect(() => {
    if (!IMS.tokenData) {
      IMS.adobeIMS.signIn()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || !IMS.tokenData) return

    setLoading(true)
    setError(null)

    try {
      // Prepare filters based on content type selection
      const filters: Record<string, 0 | 1> = {}
      
      if (contentType !== 'all') {
        filters[`content_type:${contentType}`] = 1
      }

      // Use the quickSearch function to search Adobe Stock
      const response = await apis.stock.quickSearch(
        STOCK_API.DEFAULT_CLIENT_ID, 
        query, 
        20, 
        {
          filters
        }
      )

      // Convert the response to our internal format
      const stockImages = response.files.map((file: AdobeStockResult) => ({
        id: file.id,
        title: file.title || 'Untitled',
        thumbnailUrl: file.thumbnail_url || '',
        width: file.width || 0,
        height: file.height || 0,
        creatorName: file.creator_name || 'Unknown'
      }))

      setImages(stockImages)
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
        <Heading level={2}>Adobe Stock Search</Heading>
        <Text>Please sign in with your Adobe ID to use the Stock Image Search.</Text>
      </View>
    )
  }

  return (
    <View padding="size-200">
      <Heading level={2}>Adobe Stock Search</Heading>

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="size-100">
          <Flex gap="size-100" alignItems="end">
            <TextField
              width="100%"
              value={query}
              onChange={setQuery}
              label="Search for images"
              placeholder="landscape, business, technology..."
              isDisabled={loading}
            />
            <ComboBox
              width="size-2400"
              label="Content Type"
              defaultSelectedKey="photo"
              onSelectionChange={selected => setContentType(selected?.toString() || 'photo')}
              isDisabled={loading}
            >
              <Item key="photo">Photos</Item>
              <Item key="illustration">Illustrations</Item>
              <Item key="vector">Vectors</Item>
              <Item key="video">Videos</Item>
              <Item key="all">All</Item>
            </ComboBox>
            <Button
              type="submit"
              variant="primary"
              isDisabled={loading || !query.trim()}
            >
              Search
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
              <ProgressCircle size="S" aria-label="Searching Stock..." isIndeterminate />
              <Text>Searching Adobe Stock...</Text>
            </Flex>
          )}
        </Flex>
      </form>

      {images.length > 0 && (
        <Flex direction="column" gap="size-200" marginTop="size-400">
          <Heading level={3}>Stock Images</Heading>
          <Grid
            columns="repeat(auto-fill, minmax(250px, 1fr))"
            gap="size-200"
            UNSAFE_style={{
              width: '100%'
            }}
          >
            {images.map((image) => (
              <View
                key={image.id}
                padding="size-100"
                UNSAFE_style={{
                  backgroundColor: 'var(--spectrum-global-color-gray-100)',
                  borderRadius: 'var(--spectrum-global-dimension-size-100)'
                }}
              >
                <Image
                  src={image.thumbnailUrl}
                  alt={image.title}
                  UNSAFE_style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 'var(--spectrum-global-dimension-size-50)',
                    objectFit: 'cover',
                    aspectRatio: '16/9'
                  }}
                />
                <Flex direction="column" gap="size-50" marginTop="size-100">
                  <Text UNSAFE_style={{ 
                    fontSize: 'var(--spectrum-global-dimension-size-150)',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {image.title}
                  </Text>
                  <Text UNSAFE_style={{ 
                    fontSize: 'var(--spectrum-global-dimension-size-125)',
                    color: 'var(--spectrum-global-color-gray-700)'
                  }}>
                    By: {image.creatorName}
                  </Text>
                </Flex>
              </View>
            ))}
          </Grid>
        </Flex>
      )}
    </View>
  )
}

export default StockComponent 