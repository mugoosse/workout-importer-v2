/**
 * Muscle color generation utilities
 */

export interface MuscleColorSet {
  primary: string;
  secondary: string;
  tertiary: string;
  shadow: string;
}

/**
 * Generates a set of color variants from a base color for muscle rendering
 * Creates primary, secondary, tertiary, and shadow variants by adjusting HSL values
 */
export function generateMuscleColorVariants(
  baseColorHex: string,
): MuscleColorSet {
  // Convert hex to HSL
  const hex = baseColorHex.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  // Define variants with lightness multipliers and saturation adjustments
  const variants = {
    primary: { lightness: 1.0, saturation: 1.0 },
    secondary: { lightness: 0.913, saturation: 0.85 },
    tertiary: { lightness: 0.655, saturation: 0.87 },
    shadow: { lightness: 0.6, saturation: 0.87 },
  };

  const result: MuscleColorSet = {} as MuscleColorSet;

  for (const [variant, config] of Object.entries(variants)) {
    const newL = Math.max(0, Math.min(1, l * config.lightness));
    const newS = Math.max(0, Math.min(1, s * config.saturation));

    // Convert HSL back to RGB
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let newR, newG, newB;
    if (newS === 0) {
      newR = newG = newB = newL;
    } else {
      const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
      const p = 2 * newL - q;
      newR = hue2rgb(p, q, h + 1 / 3);
      newG = hue2rgb(p, q, h);
      newB = hue2rgb(p, q, h - 1 / 3);
    }

    // Convert to hex
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    result[variant as keyof MuscleColorSet] =
      `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`.toUpperCase();
  }

  return result;
}

/**
 * Default muscle colors for different states
 */
export const MUSCLE_COLORS = {
  DEFAULT: "#E5E5E5",
  PRIMARY: "#6F2DBD",
  SECONDARY: "#E74C3C",
  SUCCESS: "#27AE60",
  WARNING: "#F39C12",
  INFO: "#3498DB",
} as const;
