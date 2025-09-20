import type { WeightUnit, DistanceUnit } from "@/store/units";

// Weight conversions
export const convertWeight = (
  value: number,
  from: WeightUnit,
  to: WeightUnit,
): number => {
  if (from === to) return value;

  if (from === "kg" && to === "lbs") {
    return value * 2.20462;
  }
  if (from === "lbs" && to === "kg") {
    return value / 2.20462;
  }

  return value;
};

// Distance conversions
export const convertDistance = (
  value: number,
  from: DistanceUnit,
  to: DistanceUnit,
): number => {
  if (from === to) return value;

  if (from === "km" && to === "miles") {
    return value * 0.621371;
  }
  if (from === "miles" && to === "km") {
    return value / 0.621371;
  }

  return value;
};

// Meters to yards conversion (for detailed distance like Weight & Distance exercises)
export const convertMetersToYards = (meters: number): number => {
  return meters * 1.09361;
};

export const convertYardsToMeters = (yards: number): number => {
  return yards / 1.09361;
};

// Format display values with proper precision
export const formatWeight = (value: number, unit: WeightUnit): string => {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${unit}`;
};

export const formatDistance = (value: number, unit: DistanceUnit): string => {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded} ${unit}`;
};

export const formatMetersDistance = (
  meters: number,
  useYards: boolean,
): string => {
  if (useYards) {
    const yards = convertMetersToYards(meters);
    const rounded = Math.round(yards * 100) / 100;
    return `${rounded} yd`;
  }

  const rounded = Math.round(meters * 100) / 100;
  return `${rounded} m`;
};
