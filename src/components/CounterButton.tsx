import { Button } from '@adobe/react-spectrum';
import { increment } from '../utils/counterUtils';
import { CounterChangeHandler } from '../types/counter';

interface CounterButtonProps {
  count: number;
  onIncrement: CounterChangeHandler;
}

export function CounterButton({ count, onIncrement }: CounterButtonProps) {
  const handleIncrement = () => {
    const newValue = increment(count);
    onIncrement(newValue);
  };

  return (
    <Button variant="primary" onPress={handleIncrement}>
      count is {count}
    </Button>
  );
} 