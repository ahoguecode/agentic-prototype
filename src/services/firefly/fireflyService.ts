import { createApiClient } from '../apiClient'
import { registerApi } from '../apiRegistry'
import { FIREFLY_API } from './fireflyConstants'
import {
  FireflyGenerateOptions,
  FireflyGenerateOptionsV3,
  FireflyGenerateOptionsV4,
  FireflyBatchGenerateImageRequest,
  FireflyBatchGenerateImagesBatchRequestOptions,
  FireflyGenerateResponse,
  FireflyGenerateSimilarOptions,
  FireflyGenerateSimilarResponse,
  FireflyImageResponse,
  FireflyFillOptions,
  FireflyGenerateVideoOptions,
  FireflyVideoGenerateResponse,
  FireflyVideoGenerateStatusResponse,
  FireflyVideoResult
} from './fireflyTypes'

/**
 * Redefining this to avoid importing dreamboard recursively
 * @param width Original width
 * @param height Original Height
 * @param targetSize Square bounding box to scale to
 */
function scaleToFit(width: number, height: number, targetSize: number) {
  const scaleX = targetSize / width
  const scaleY = targetSize / height
  const scale = Math.min(scaleX, scaleY)
  return {
    width: width * scale,
    height: height * scale,
  }
}

// Common API configuration
const commonConfig = {
  headers: FIREFLY_API.COMMON_HEADERS,
  timeout: FIREFLY_API.DEFAULT_TIMEOUT,
  retries: FIREFLY_API.DEFAULT_RETRIES
}

// Register Firefly APIs with the registry
registerApi('firefly-v2', {
  baseUrl: FIREFLY_API.V2_BASE_URL,
  ...commonConfig
})

registerApi('firefly-v3', {
  baseUrl: FIREFLY_API.V3_BASE_URL,
  ...commonConfig
})

registerApi('firefly-v4', {
  baseUrl: FIREFLY_API.V4_BASE_URL,
  ...commonConfig
})

registerApi('firefly-batch', {
  baseUrl: FIREFLY_API.BATCH_BASE_URL,
  ...commonConfig
})

registerApi('firefly-video', {
  baseUrl: FIREFLY_API.VIDEO_BASE_URL,
  ...commonConfig
})

// Create API clients
const v2Client = createApiClient({
  baseUrl: FIREFLY_API.V2_BASE_URL,
  ...commonConfig
})

const v3Client = createApiClient({
  baseUrl: FIREFLY_API.V3_BASE_URL,
  ...commonConfig
})

const v4Client = createApiClient({
  baseUrl: FIREFLY_API.V4_BASE_URL,
  ...commonConfig
})

const batchClient = createApiClient({
  baseUrl: FIREFLY_API.BATCH_BASE_URL,
  ...commonConfig
})

const videoClient = createApiClient({
  baseUrl: FIREFLY_API.VIDEO_BASE_URL,
  ...commonConfig
})

// Function declarations
export async function generate(prompt: string, token: string, apiKey: string, options: FireflyGenerateOptions = {}) {
  const requestBody = {
    prompt,
    ...options,
  }

  try {
    const response = await v2Client.post<FireflyGenerateResponse>('/v2/images/generate', requestBody, {
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey
    })
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function generateV3(prompt: string, token: string, apiKey: string, options: FireflyGenerateOptionsV3 = {}) {
  const requestBody = {
    prompt,
    ...options,
  }

  try {
    const response = await v3Client.post<FireflyGenerateResponse>('/v2/images/generate', requestBody, {
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey
    })
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function generateV4(prompt: string, token: string, apiKey: string, options: FireflyGenerateOptionsV4 = {}) {
  const requestBody = {
    prompt,
    ...options,
  }

  try {
    const response = await v4Client.post<FireflyGenerateResponse>('/v2/images/generate', requestBody, {
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey
    })
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function generateBatch(
  requests: FireflyBatchGenerateImageRequest[],
  token: string,
  apiKey: string,
  options: FireflyBatchGenerateImagesBatchRequestOptions = {}
): Promise<FireflyGenerateResponse> {
  const requestBody = {
    requests,
    ...options,
  }

  try {
    const response = await batchClient.post<FireflyGenerateResponse>('/v2/images/generate-batch', requestBody, {
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey
    })
    return response
  } catch (e) {
    console.error(e)
    if (e instanceof Error) {
      throw e
    }
    throw new Error('Unknown error occurred during batch generation')
  }
}

export async function uploadImage(image: Blob, token: string, apiKey: string) {
  try {
    let uploadImage = image
    const bitmap = await createImageBitmap(image)
    if (bitmap.width > 2048 || bitmap.height > 2048) {
      const targetDimensions = scaleToFit(bitmap.width, bitmap.height, 2048)
      const canvas = new OffscreenCanvas(targetDimensions.width, targetDimensions.height)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        uploadImage = await canvas.convertToBlob()
      }
    }
    bitmap.close()

    const response = await v2Client.post<FireflyImageResponse>('/v2/storage/image', 
      new File([uploadImage], 'image', { type: image.type }), 
      {
        'Authorization': `Bearer ${token}`,
        'x-api-key': apiKey,
        'Content-Type': image.type
      }
    )
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function uploadImageV3(image: Blob, token: string, apiKey: string, scaleImage = true) {
  try {
    let uploadImage = image
    if (scaleImage) {
      const bitmap = await createImageBitmap(image)
      if (bitmap.width > 2048 || bitmap.height > 2048) {
        const targetDimensions = scaleToFit(bitmap.width, bitmap.height, 2048)
        const canvas = new OffscreenCanvas(targetDimensions.width, targetDimensions.height)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
          uploadImage = await canvas.convertToBlob()
        }
      }
      bitmap.close()
    }

    const response = await v3Client.post<FireflyImageResponse>('/v2/storage/image', 
      new File([uploadImage], 'image', { type: image.type }), 
      {
        'Authorization': `Bearer ${token}`,
        'x-api-key': apiKey,
        'Content-Type': image.type
      }
    )
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function uploadImageV4(image: Blob, token: string, apiKey: string, scaleImage = true) {
  try {
    let uploadImage = image
    if (scaleImage) {
      const bitmap = await createImageBitmap(image)
      if (bitmap.width > 2048 || bitmap.height > 2048) {
        const targetDimensions = scaleToFit(bitmap.width, bitmap.height, 2048)
        const canvas = new OffscreenCanvas(targetDimensions.width, targetDimensions.height)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
          uploadImage = await canvas.convertToBlob()
        }
      }
      bitmap.close()
    }

    const response = await v4Client.post<FireflyImageResponse>('/v2/storage/image', 
      new File([uploadImage], 'image', { type: image.type }), 
      {
        'Authorization': `Bearer ${token}`,
        'x-api-key': apiKey,
        'Content-Type': image.type
      }
    )
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function uploadImageBatch(image: Blob, token: string, apiKey: string, scaleImage = true) {
  try {
    let uploadImage = image
    if (scaleImage) {
      const bitmap = await createImageBitmap(image)
      if (bitmap.width > 2048 || bitmap.height > 2048) {
        const targetDimensions = scaleToFit(bitmap.width, bitmap.height, 2048)
        const canvas = new OffscreenCanvas(targetDimensions.width, targetDimensions.height)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
          uploadImage = await canvas.convertToBlob()
        }
      }
      bitmap.close()
    }

    const response = await batchClient.post<FireflyImageResponse>('/v2/storage/image', 
      new File([uploadImage], 'image', { type: image.type }), 
      {
        'Authorization': `Bearer ${token}`,
        'x-api-key': apiKey,
        'Content-Type': image.type
      }
    )
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function uploadVideoImage(image: Blob, token: string, apiKey: string, scaleImage = true): Promise<FireflyImageResponse> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let uploadImage = image
        console.log('Starting uploadVideoImage with image type:', image.type, 'size:', image.size)
        
        if (scaleImage) {
          const bitmap = await createImageBitmap(image)
          console.log('Original image dimensions:', bitmap.width, 'x', bitmap.height)
          
          if (bitmap.width > 2048 || bitmap.height > 2048) {
            const targetDimensions = scaleToFit(bitmap.width, bitmap.height, 2048)
            console.log('Scaling image to:', targetDimensions.width, 'x', targetDimensions.height)
            
            const canvas = new OffscreenCanvas(targetDimensions.width, targetDimensions.height)
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
              uploadImage = await canvas.convertToBlob()
              console.log('Resized image blob created, size:', uploadImage.size)
            }
          }
          bitmap.close()
        }

        // Use XMLHttpRequest instead of fetch for binary uploads
        const url = `${FIREFLY_API.VIDEO_BASE_URL}/v2/storage/image`
        console.log('Uploading to URL:', url)
        
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url, true)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.setRequestHeader('x-api-key', apiKey)
        xhr.setRequestHeader('Content-Type', image.type)
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            console.log('XMLHttpRequest successful')
            try {
              const data = JSON.parse(xhr.responseText)
              console.log('Image upload success response:', data)
              resolve(data as FireflyImageResponse)
            } catch (e) {
              console.error('Error parsing response:', e)
              reject(new Error('Error parsing response'))
            }
          } else {
            console.error('XMLHttpRequest failed with status:', xhr.status)
            console.error('Response:', xhr.responseText)
            reject(new Error(`HTTP error! status: ${xhr.status}, message: ${xhr.responseText}`))
          }
        }
        
        xhr.onerror = function() {
          console.error('XMLHttpRequest network error')
          reject(new Error('Network error'))
        }
        
        xhr.send(uploadImage)
      } catch (e) {
        console.error('Exception in uploadVideoImage:', e)
        reject(e)
      }
    })()
  })
}

export async function generateSimilar(imageId: string, token: string, apiKey: string, options: FireflyGenerateSimilarOptions = {}) {
  try {
    const requestBody = {
      image: {
        id: imageId,
      },
      ...options,
    }

    const response = await v2Client.post<FireflyGenerateSimilarResponse>('/v2/images/generate-similar', requestBody, {
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey
    })
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function genfill(prompt: string, token: string, apiKey: string, options: FireflyFillOptions = {}) {
  const requestBody = {
    ...options,
  }

  if (prompt === '') {
    requestBody.similarity = 0
  } else {
    requestBody.prompt = prompt
  }

  try {
    const response = await v3Client.post<Pick<FireflyGenerateResponse, 'version' | 'outputs'>>('/v2/images/fill', requestBody, {
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey
    })
    return response
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function generateVideo(prompt: string, token: string, apiKey: string, options: Omit<FireflyGenerateVideoOptions, 'prompt'> = {}) {
  const requestBody: FireflyGenerateVideoOptions = {
    prompt,
    ...options
  }

  try {
    console.log('Generate video request:', JSON.stringify(requestBody, null, 2))
    
    // Initial request to start generation
    const response = await videoClient.post<FireflyVideoGenerateResponse>('/v2/videos/generate', requestBody, {
      'Authorization': `Bearer ${token}`,
      'x-api-key': apiKey
    })
    
    console.log('Generate video response:', response)
    return response
  } catch (e) {
    console.error('Generate video error:', e)
    throw e
  }
}

export async function checkVideoStatus(
  url: string,
  token: string,
  apiKey: string
): Promise<FireflyVideoGenerateStatusResponse | FireflyVideoResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: new Headers({
        'Authorization': `Bearer ${token}`,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (e) {
    console.error(e)
    throw e
  }
}

// Export convenience functions
export const fireflyClient = {
  v2: v2Client,
  v3: v3Client,
  v4: v4Client,
  batch: batchClient,
  video: videoClient,
  generate,
  generateV3,
  generateV4,
  generateBatch,
  uploadImage,
  uploadImageV3,
  uploadImageV4,
  uploadImageBatch,
  uploadVideoImage,
  generateSimilar,
  genfill,
  generateVideo,
  checkVideoStatus
}