import React, { useState } from 'react';
import { apis, gemini, GEMINI_API } from '../services';
import { Button, TextField, View, Heading, Flex, Text } from '@adobe/react-spectrum';

const GeminiChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<gemini.GeminiMessage[]>([
    {
      role: 'system',
      parts: [{ text: 'You are a helpful assistant powered by Gemini AI.' }]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: gemini.GeminiMessage = {
      role: 'user',
      parts: [{ text: input }]
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Filter out system messages for separate handling if needed
      const conversationMessages = updatedMessages.filter(msg => msg.role !== 'system');
      
      // Call the Gemini API
      const response = await apis.gemini.sendMessage(conversationMessages, {
        model: GEMINI_API.DEFAULT_MODEL,
        temperature: GEMINI_API.DEFAULT_TEMPERATURE
      });

      // Process response content
      const responseText = response
        .filter(part => part.text !== undefined)
        .map(part => part.text || '')
        .join('');

      // Add the AI response to the chat
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          parts: [{ text: responseText }]
        }
      ]);
    } catch (err) {
      // Handle errors
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Only display messages that are part of the conversation (not system messages)
  const displayMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <View 
      maxWidth="size-6000" 
      marginX="auto" 
      marginY="size-400"
      padding="size-300"
      borderWidth="thin"
      borderColor="dark"
      borderRadius="medium"
      backgroundColor="gray-50"
    >
      <Heading level={2}>Gemini Chat</Heading>
      
      <Flex 
        direction="column" 
        gap="size-100"
        marginBottom="size-300"
        height="size-3000"
        UNSAFE_style={{
          border: '1px solid var(--spectrum-global-color-gray-200)',
          borderRadius: 'var(--spectrum-global-dimension-size-50)',
          backgroundColor: 'var(--spectrum-global-color-gray-75)',
          overflow: 'auto',
          padding: 'var(--spectrum-global-dimension-size-100)'
        }}
      >
        {displayMessages.length === 0 ? (
          <Text UNSAFE_style={{ color: 'var(--spectrum-global-color-gray-600)', fontStyle: 'italic', textAlign: 'center' }}>
            Start a conversation with Gemini by typing a message below.
          </Text>
        ) : (
          displayMessages.map((message, index) => (
            <View 
              key={index} 
              UNSAFE_style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.role === 'user' ? 'var(--spectrum-global-color-green-500)' : 'var(--spectrum-global-color-gray-200)',
                padding: 'var(--spectrum-global-dimension-size-150)',
                borderRadius: 'var(--spectrum-global-dimension-size-50)',
                maxWidth: '80%'
              }}
            >
              <Text UNSAFE_style={{ fontWeight: 'bold' }}>{message.role === 'user' ? 'You' : 'Gemini'}</Text>
              <Text>{message.parts[0].text}</Text>
            </View>
          ))
        )}
        
        {loading && (
          <View
            UNSAFE_style={{
              alignSelf: 'flex-start',
              backgroundColor: 'var(--spectrum-global-color-gray-200)',
              padding: 'var(--spectrum-global-dimension-size-150)',
              borderRadius: 'var(--spectrum-global-dimension-size-50)',
              opacity: 0.7
            }}
          >
            <Text UNSAFE_style={{ fontWeight: 'bold' }}>Gemini</Text>
            <Text>Thinking...</Text>
          </View>
        )}
      </Flex>
      
      {error && (
        <View
          padding="size-100"
          UNSAFE_style={{
            backgroundColor: 'var(--spectrum-semantic-negative-color-background)',
            borderRadius: 'var(--spectrum-global-dimension-size-50)',
            marginBottom: 'var(--spectrum-global-dimension-size-100)'
          }}
        >
          <Text UNSAFE_style={{ fontWeight: 'bold' }}>Error:</Text> <Text>{error}</Text>
        </View>
      )}
      
      <form onSubmit={handleSubmit}>
        <Flex gap="size-100">
          <TextField
            width="100%"
            value={input}
            onChange={setInput}
            placeholder="Type a message to Gemini..."
            isDisabled={loading}
          />
          <Button 
            type="submit" 
            variant="primary"
            isDisabled={loading || !input.trim()}
          >
            Send
          </Button>
        </Flex>
      </form>
    </View>
  );
};

export default GeminiChat; 