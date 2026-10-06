import { DiscountStrategy } from './discount-strategy.interface.js';
import { FlatDiscountStrategy } from './flat-discount.strategy.js';
import { PercentageDiscountStrategy } from './percentage-discount.strategy.js';

export * from './discount-strategy.interface.js';
export * from './flat-discount.strategy.js';
export * from './percentage-discount.strategy.js';

export const DISCOUNT_STRATEGIES: Record<string, DiscountStrategy> = {
  FLAT: new FlatDiscountStrategy(),
  PERCENTAGE: new PercentageDiscountStrategy(),
};
