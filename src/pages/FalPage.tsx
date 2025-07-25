import { Flex, View } from '@adobe/react-spectrum';
import FalImageGenerator from '../components/FalImageGenerator';

/**
 * A page component that showcases the Fal AI image generation functionality
 */
export function FalPage() {
  return (
    <View padding="size-250">
      <Flex direction="column" gap="size-200">
        <FalImageGenerator />
      </Flex>
    </View>
  );
} 