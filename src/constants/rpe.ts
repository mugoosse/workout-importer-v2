/**
 * RPE (Rate of Perceived Exertion) Constants
 *
 * RPE is measured on a scale from 1-10 where:
 * 1 = Very Easy
 * 10 = Maximum Effort
 */

export const RPE_SCALE = {
  MIN: 1,
  MAX: 10,
} as const;

export const RPE_SCALE_SIZE = RPE_SCALE.MAX - RPE_SCALE.MIN + 1; // 10 total values (1-10)
