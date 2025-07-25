import { View, Heading, Tabs, TabList, TabPanels, Item } from '@adobe/react-spectrum'
import { FalPage } from '../pages/FalPage'
import OpenAIChat from '../components/OpenAIChat'
import ClaudeChat from '../components/ClaudeChat'
import GeminiChat from '../components/GeminiChat'
import FireflyVideoGenerator from '../components/FireflyVideoGenerator'
import FireflyImageGenerator from '../components/FireflyImageGenerator'
import StockComponent from '../components/StockComponent'
import AudioMusicGenerator from '../components/AudioMusicGenerator'

function TestPage() {
  return (
      <View padding="size-200">
        <Heading level={1}>Template</Heading>
        <Tabs>
          <TabList>
            <Item key="openai">OpenAI Chat</Item>
            <Item key="claude">Claude Chat</Item>
            <Item key="gemini">Gemini Chat</Item>
            <Item key="fireflyImage">Firefly Image</Item>
            <Item key="stock">Stock</Item>
            <Item key="fireflyVideo">Firefly Video</Item>
            <Item key="fal">FAL</Item>
            <Item key="audio">Audio Music</Item>
          </TabList>
          <TabPanels>
            <Item key="openai">
              <OpenAIChat />
            </Item>
            <Item key="claude">
              <ClaudeChat />
            </Item>
            <Item key="gemini">
              <GeminiChat />
            </Item>
            <Item key="fireflyImage">
              <FireflyImageGenerator />
            </Item>
            <Item key="stock">
              <StockComponent />
            </Item>
            <Item key="fireflyVideo">
              <FireflyVideoGenerator />
            </Item>
            <Item key="fal">
              <FalPage />
            </Item>
            <Item key="audio">
              <AudioMusicGenerator />
            </Item>
          </TabPanels>
        </Tabs>
      </View>
  )
}

export default TestPage 
