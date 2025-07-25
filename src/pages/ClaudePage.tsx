import { Flex, View } from '@adobe/react-spectrum';
import ClaudeChat from '../components/ClaudeChat';

/**
 * A page component that showcases the Claude AI chat functionality
 */
export function ClaudePage() {
  return (
    <View padding="size-250">
      <Flex direction="column" gap="size-200">
        <ClaudeChat />
      </Flex>
    </View>
  );
} 