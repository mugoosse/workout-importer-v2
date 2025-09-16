import React from "react";
import { Svg, Path, G, SvgProps } from "react-native-svg";

// Back-visible muscles from the schema
export type BackMuscleId =
  | "biceps_femoris"
  | "erector_spinae"
  | "gluteus_maximus"
  | "gluteus_medius"
  | "infraspinatus"
  | "latissimus_dorsi"
  | "lower_trapezius"
  | "rhomboid_muscles"
  | "semitendinosus"
  | "teres_major"
  | "trapezius"
  | "triceps_brachii";

// Body contour path for back view (simplified)
export const BACK_BODY_CONTOUR =
  "M175.75 187.477V178.917C175.75 172.73 172.262 166.141 170.093 162.63C172.241 155.569 172.262 138.649 171.096 130.792C170.38 126.024 167.004 122.131 165.337 119.637C165.368 119.445 165.398 119.254 165.429 119.063C166.35 113.299 162.361 99.1455 159.977 93.1803C158.392 89.2169 155.078 87.718 152.418 86.5109C150.976 85.857 149.739 85.2937 149.033 84.489C147.243 82.4268 145.453 81.8634 143.878 81.3705Z";

// Simplified muscle paths for back view
export const backBodyData: Record<BackMuscleId, string[]> = {
  biceps_femoris: [
    "M71.6843 398.966C69.8636 404.901 67.5827 409.609 65.7415 413.401C64.6368 415.685 63.6856 417.646 63.0105 419.477Z",
  ],
  erector_spinae: [
    "M89.973 180.123C89.973 175.234 92.345 170.876 95.234 167.891C97.123 165.432 99.567 162.789 101.234 159.876Z",
  ],
  gluteus_maximus: [
    "M52.3523 236.205C51.2988 243.357 49.8872 253.145 42.9625 256.877C43.0239 256.636 43.0852 256.394 43.1466 256.153Z",
  ],
  gluteus_medius: [
    "M45.806 415.735C45.8879 402.839 46.0311 390.888 46.1129 377.992C44.3638 374.783 41.9294 369.754 40.9475 366.675Z",
  ],
  infraspinatus: [
    "M89.973 120.123C89.973 115.234 92.345 110.876 95.234 107.891C97.123 105.432 99.567 102.789 101.234 99.876Z",
  ],
  latissimus_dorsi: [
    "M71.6843 398.966C69.8636 404.901 67.5827 409.609 65.7415 413.401C64.6368 415.685 63.6856 417.646 63.0105 419.477Z",
  ],
  lower_trapezius: [
    "M89.973 140.123C89.973 135.234 92.345 130.876 95.234 127.891C97.123 125.432 99.567 122.789 101.234 119.876Z",
  ],
  rhomboid_muscles: [
    "M89.973 130.123C89.973 125.234 92.345 120.876 95.234 117.891C97.123 115.432 99.567 112.789 101.234 109.876Z",
  ],
  semitendinosus: [
    "M71.6843 398.966C69.8636 404.901 67.5827 409.609 65.7415 413.401C64.6368 415.685 63.6856 417.646 63.0105 419.477Z",
  ],
  teres_major: [
    "M89.973 110.123C89.973 105.234 92.345 100.876 95.234 97.891C97.123 95.432 99.567 92.789 101.234 89.876Z",
  ],
  trapezius: [
    "M89.973 90.123C89.973 85.234 92.345 80.876 95.234 77.891C97.123 75.432 99.567 72.789 101.234 69.876Z",
  ],
  triceps_brachii: [
    "M119.523 435.27C121.293 443.107 122.786 450.4 122.275 453.066C122.203 453.458 122.336 454.997 122.04 455.248Z",
  ],
};

export interface BackBodyProps extends SvgProps {
  highlightedMuscles?: BackMuscleId[];
  muscleColor?: string;
  defaultColor?: string;
  onMusclePress?: (muscleId: BackMuscleId) => void;
}

export const BackBodyMuscleMap: React.FC<BackBodyProps> = ({
  highlightedMuscles = [],
  muscleColor = "#6F2DBD",
  defaultColor = "#E5E5E5",
  onMusclePress,
  ...svgProps
}) => {
  return (
    <Svg width={179} height={508} viewBox="0 0 179 508" {...svgProps}>
      {/* Body contour */}
      <Path
        d={BACK_BODY_CONTOUR}
        fill="#F8F8F8"
        stroke="#E0E0E0"
        strokeWidth={1}
      />

      {/* Render muscles */}
      {Object.entries(backBodyData).map(([muscleId, paths]) => {
        const isHighlighted = highlightedMuscles.includes(
          muscleId as BackMuscleId,
        );
        const fillColor = isHighlighted ? muscleColor : defaultColor;
        const opacity = isHighlighted ? 0.8 : 0.6;

        return (
          <G
            key={muscleId}
            onPress={() => onMusclePress?.(muscleId as BackMuscleId)}
          >
            {paths.map((pathData, index) => (
              <Path
                key={`${muscleId}-${index}`}
                d={pathData}
                fill={fillColor}
                opacity={opacity}
                stroke="none"
              />
            ))}
          </G>
        );
      })}
    </Svg>
  );
};
