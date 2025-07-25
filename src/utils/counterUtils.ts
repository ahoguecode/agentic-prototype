/**
 * Utility functions for counter operations
 */

/**
 * Increments a number by a specified amount
 * @param value - The current value
 * @param incrementBy - The amount to increment by (default: 1)
 * @returns The incremented value
 */
export function increment(value: number, incrementBy: number = 1): number {
  return value + incrementBy;
}

/**
 * Decrements a number by a specified amount
 * @param value - The current value
 * @param decrementBy - The amount to decrement by (default: 1)
 * @returns The decremented value
 */
export function decrement(value: number, decrementBy: number = 1): number {
  return value - decrementBy;
} 