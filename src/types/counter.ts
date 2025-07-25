/**
 * Types related to counter functionality
 */

/**
 * Configuration options for a counter
 */
export interface CounterConfig {
  /** Initial value of the counter */
  initialValue: number;
  
  /** Minimum allowed value */
  min?: number;
  
  /** Maximum allowed value */
  max?: number;
  
  /** Amount to increment/decrement by */
  step?: number;
}

/**
 * Event handler for counter changes
 */
export type CounterChangeHandler = (newValue: number) => void; 