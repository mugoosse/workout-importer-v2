export type ColorVariant = "primary" | "secondary" | "tertiary" | "shadow";

export interface SvgPath {
  d: string;
  variant: ColorVariant;
}

export interface OutlinePath {
  d: string;
  fill: string;
}

export interface MuscleColorPair<T> {
  muscleId: T;
  color: string;
}
