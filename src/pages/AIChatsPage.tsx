import { useState } from "react";
import {
  View,
  Tabs,
  TabList,
  TabPanels,
  Item,
  Heading,
} from "@adobe/react-spectrum";
import OpenAIChat from "../components/OpenAIChat";
import ClaudeChat from "../components/ClaudeChat";

/**
 * A page component that showcases different AI chat capabilities
 * Allows the user to switch between OpenAI and Claude chat interfaces
 */
export function AIChatsPage() {
  const [selectedTab, setSelectedTab] = useState<string>("openai");

  return (
    <View padding="size-250">
      <Heading level={1}>AI Chat Assistants</Heading>

      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <TabList>
          <Item key="openai">OpenAI Chat</Item>
          <Item key="claude">Claude Chat</Item>
        </TabList>

        <TabPanels>
          <Item key="openai">
            <View marginY="size-200">
              <OpenAIChat />
            </View>
          </Item>

          <Item key="claude">
            <View marginY="size-200">
              <ClaudeChat />
            </View>
          </Item>
        </TabPanels>
      </Tabs>
    </View>
  );
}
