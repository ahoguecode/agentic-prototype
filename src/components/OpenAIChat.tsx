import React, { useState } from 'react';
import { apis, OPENAI_API } from '../services';
import { OpenAIMessage, OpenAITextContent, OpenAIImageContent, OpenAIApiVersion, OpenAIDeployment } from '../services/openai/openaiService';
import { Button, TextField, View, Heading, Flex, Text, FileTrigger, Image, Well, ActionButton } from '@adobe/react-spectrum';
import Magnifier from '@spectrum-icons/ui/Magnifier';
import CrossSmall from '@spectrum-icons/ui/CrossSmall';

interface UploadedImage {
  dataUrl: string;
  file: File;
}

const OpenAIChat: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<OpenAIMessage[]>([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !uploadedImage)) return;

    let userMessage: OpenAIMessage;
    
    // Create user message based on whether there's an image, text, or both
    if (uploadedImage && input.trim()) {
      // Both image and text
      userMessage = {
        role: 'user',
        content: [
          apis.openai.createImageContent(uploadedImage.dataUrl),
          apis.openai.createTextContent(input)
        ]
      };
    } else if (uploadedImage) {
      // Only image
      userMessage = {
        role: 'user',
        content: [
          apis.openai.createImageContent(uploadedImage.dataUrl)
        ]
      };
    } else {
      // Only text
      userMessage = { role: 'user', content: input };
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setUploadedImage(null);
    setLoading(true);
    setError(null);

    try {
      // Call the OpenAI API with the updated messages
      const response = await apis.openai.sendMessage(updatedMessages, {
        deployment: OPENAI_API.DEFAULT_DEPLOYMENT as OpenAIDeployment,
        apiVersion: OPENAI_API.DEFAULT_API_VERSION as OpenAIApiVersion
      });

      // Add the AI response to the chat
      setMessages([...updatedMessages, response]);
    } catch (err) {
      // Handle errors
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickHello = async () => {
    setLoading(true);
    setError(null);

    try {
      // Set up the messages for a quick hello
      const quickMessages: OpenAIMessage[] = [
        { role: 'system', content: 'You are a helpful assistant that responds with a short, friendly greeting.' },
        { role: 'user', content: 'Say hello to me!' }
      ];

      // Call the OpenAI API
      const response = await apis.openai.sendMessage(quickMessages, {
        deployment: OPENAI_API.DEFAULT_DEPLOYMENT as 'o4-mini' | 'gpt-4o' | 'gpt-4o-mini',
        apiVersion: OPENAI_API.DEFAULT_API_VERSION as '2024-12-01-preview'
      });

      // Add both the user request and AI response to the chat
      setMessages([
        ...messages,
        { role: 'user', content: 'Say hello to me!' },
        response
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    try {
      // Only accept image files
      if (!file.type.startsWith('image/')) {
        setError('Only image files are supported');
        return;
      }
      
      // Process the image for OpenAI API
      const dataUrl = await apis.openai.prepareImageForOpenAI(file);
      
      setUploadedImage({
        dataUrl,
        file
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      console.error('Image processing error:', err);
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
  };

  // Only display messages that are part of the conversation (not system messages)
  const displayMessages = messages.filter(msg => msg.role !== 'system');

  // Function to render message content
  const renderMessageContent = (message: OpenAIMessage) => {
    if (typeof message.content === 'string') {
      return <Text>{message.content}</Text>;
    }
    
    // Handle array of content or single content object
    const contentArray = Array.isArray(message.content) ? message.content : [message.content];
    
    return (
      <Flex direction="column" gap="size-100">
        {contentArray.map((content: OpenAITextContent | OpenAIImageContent, idx: number) => {
          if (content.type === 'text') {
            return <Text key={idx}>{content.text}</Text>;
          } else if (content.type === 'image_url') {
            return (
              <View key={idx} marginY="size-100">
                <Image 
                  src={content.image_url.url} 
                  alt="Uploaded image" 
                  UNSAFE_style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px', 
                    borderRadius: 'var(--spectrum-global-dimension-size-50)' 
                  }} 
                />
              </View>
            );
          }
          return null;
        })}
      </Flex>
    );
  };

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
      <Flex direction="row" alignItems="center" justifyContent="space-between" marginBottom="size-200">
        <Heading level={2}>OpenAI Chat</Heading>
        <Button 
          variant="primary"
          onPress={handleQuickHello}
          isDisabled={loading}
        >
          Quick Hello
        </Button>
      </Flex>
      
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
            Start a conversation by typing a message below or use the "Quick Hello" button.
          </Text>
        ) : (
          displayMessages.map((message, index) => (
            <View 
              key={index} 
              UNSAFE_style={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.role === 'user' ? 'var(--spectrum-global-color-blue-400)' : 'var(--spectrum-global-color-gray-200)',
                padding: 'var(--spectrum-global-dimension-size-150)',
                borderRadius: 'var(--spectrum-global-dimension-size-50)',
                maxWidth: '80%'
              }}
            >
              <Text UNSAFE_style={{ fontWeight: 'bold' }}>{message.role === 'user' ? 'You' : 'AI'}</Text>
              {renderMessageContent(message)}
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
            <Text UNSAFE_style={{ fontWeight: 'bold' }}>AI</Text>
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
      
      {uploadedImage && (
        <Well marginBottom="size-100">
          <Flex alignItems="center" gap="size-100">
            <Image 
              src={uploadedImage.dataUrl} 
              alt="Uploaded image" 
              UNSAFE_style={{ 
                maxWidth: '100px', 
                maxHeight: '100px', 
                borderRadius: 'var(--spectrum-global-dimension-size-50)' 
              }} 
            />
            <Flex direction="column" gap="size-50">
              <Text>{uploadedImage.file.name}</Text>
              <ActionButton 
                isQuiet 
                onPress={removeUploadedImage}
                aria-label="Remove image"
              >
                <CrossSmall />
              </ActionButton>
            </Flex>
          </Flex>
        </Well>
      )}
      
      <form onSubmit={handleSubmit}>
        <Flex gap="size-100" direction="column">
          <Flex gap="size-100" alignItems="end">
            <TextField
              width="100%"
              value={input}
              onChange={setInput}
              placeholder="Type a message..."
              isDisabled={loading}
            />
            <FileTrigger
              acceptedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
              onSelect={handleImageUpload}
            >
              <ActionButton
                isDisabled={loading || !!uploadedImage}
                aria-label="Upload image"
              >
                <Magnifier />
              </ActionButton>
            </FileTrigger>
            <Button 
              type="submit" 
              variant="primary"
              isDisabled={loading || (!input.trim() && !uploadedImage)}
            >
              Send
            </Button>
          </Flex>
        </Flex>
      </form>
    </View>
  );
};

export default OpenAIChat; 