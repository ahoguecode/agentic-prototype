import { CounterConfig } from '../types/counter';
import { increment, decrement } from '../utils/counterUtils';

/**
 * A model for managing counter state
 */
export class CounterModel {
  private _value: number;
  private _config: Required<CounterConfig>;

  /**
   * Creates a new counter model
   * @param config - Configuration options for the counter
   */
  constructor(config: CounterConfig) {
    this._value = config.initialValue;
    this._config = {
      initialValue: config.initialValue,
      min: config.min ?? Number.MIN_SAFE_INTEGER,
      max: config.max ?? Number.MAX_SAFE_INTEGER,
      step: config.step ?? 1,
    };
  }

  /**
   * Gets the current value
   */
  get value(): number {
    return this._value;
  }

  /**
   * Increments the counter
   * @returns The new value
   */
  incrementValue(): number {
    const newValue = increment(this._value, this._config.step);
    this._value = Math.min(newValue, this._config.max);
    return this._value;
  }

  /**
   * Decrements the counter
   * @returns The new value
   */
  decrementValue(): number {
    const newValue = decrement(this._value, this._config.step);
    this._value = Math.max(newValue, this._config.min);
    return this._value;
  }

  /**
   * Resets the counter to its initial value
   * @returns The initial value
   */
  reset(): number {
    this._value = this._config.initialValue;
    return this._value;
  }
} 