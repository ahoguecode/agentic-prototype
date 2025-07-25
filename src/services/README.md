# Simple API Client

A lightweight, easy-to-use API client for making HTTP requests to various APIs.

## Basic Usage

### Direct API Client

Create and use an API client directly:

```typescript
import { createApiClient } from './services/api-simple';

// Create a client for a specific API
const myApi = createApiClient({
  baseUrl: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  timeout: 10000,
  retries: 2
});

// Use the client to make requests
async function fetchData() {
  try {
    // GET request
    const userData = await myApi.get('/users/123');
    
    // POST request
    const newUser = await myApi.post('/users', { name: 'John', email: 'john@example.com' });
    
    // PUT request with query parameters
    await myApi.put('/users/123', { name: 'John Updated' }, {}, { include: 'details' });
    
    // DELETE request
    await myApi.delete('/users/123');
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

### Using the OpenAI API

The OpenAI API is pre-configured and ready to use:

```typescript
import { apis } from './services/api-simple';

async function chatWithAI() {
  const messages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' }
  ];
  
  try {
    // Send messages to OpenAI
    const response = await apis.openai.sendMessage(messages, {
      deployment: 'o3-mini',
      apiVersion: '2024-12-01-preview'
    });
    
    console.log('AI response:', response.content);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Using the API Registry

Register and manage multiple APIs:

```typescript
import { registerApi, getApiClient } from './services/api-simple';

// Register APIs
registerApi('github', {
  baseUrl: 'https://api.github.com',
  headers: {
    'Authorization': `token ${GITHUB_TOKEN}`
  }
});

registerApi('weather', {
  baseUrl: 'https://api.weatherapi.com/v1',
  timeout: 5000
});

// Use registered APIs
async function fetchGithubAndWeather() {
  const githubApi = getApiClient('github');
  const weatherApi = getApiClient('weather');
  
  const repos = await githubApi.get('/user/repos');
  const forecast = await weatherApi.get('/forecast.json', { q: 'London', days: 3 });
  
  return { repos, forecast };
}
```

## Features

- **Lightweight**: Simple functional approach with minimal abstractions
- **Type-safe**: Full TypeScript support
- **Easy to use**: Intuitive API with method chaining
- **Configurability**: Set default options like timeouts and headers
- **Error handling**: Proper error handling with typed errors
- **Retries**: Built-in retry mechanism with exponential backoff
- **Cancellation**: Support for request timeouts and cancellation 