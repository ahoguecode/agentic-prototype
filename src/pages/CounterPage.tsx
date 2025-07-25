import { useState } from 'react';
import { Flex, Heading, View } from '@adobe/react-spectrum';
import { CounterButton } from '../components/CounterButton';

/**
 * A page component that showcases the counter functionality
 */
export function CounterPage() {
  const [count, setCount] = useState(0);

  // Handle counter changes
  const handleCounterChange = (newValue: number) => {
    setCount(newValue);
  };

  return (
    <View padding="size-250">
      <Flex direction="column" gap="size-100">
        <Heading level={2}>Counter Demo</Heading>
        <CounterButton count={count} onIncrement={handleCounterChange} />
      </Flex>
    </View>
  );
} 