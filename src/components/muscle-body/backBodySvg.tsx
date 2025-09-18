import React from "react";
import { G, Path, Svg, SvgProps } from "react-native-svg";

export enum BackMuscleId {
  RHOMBOID_MUSCLES = "rhomboid_muscles",
  TRAPEZIUS = "trapezius",
  GRACILIS = "gracilis",
  TENSOR_FASCIAE_LATAE = "tensor_fasciae_latae",
  ERECTOR_SPINAE = "erector_spinae",
  FLEXOR_CARPI_RADIALIS = "flexor_carpi_radialis",
  BICEPS_FEMORIS = "biceps_femoris",
  ADDUCTOR_MAGNUS = "adductor_magnus",
  SEMITENDINOSUS = "semitendinosus",
  GLUTEUS_MEDIUS = "gluteus_medius",
  GLUTEUS_MAXIMUS = "gluteus_maximus",
  FLEXOR_CARPI_ULNARIS = "flexor_carpi_ulnaris",
  EXTENSOR_CARPI_RADIALIS = "extensor_carpi_radialis",
  BRACHIORADIALIS = "brachioradialis",
  SERRATUS_ANTERIOR = "serratus_anterior",
  EXTERNAL_OBLIQUES = "external_obliques",
  TRICEPS_BRACHII = "triceps_brachii",
  LATISSIMUS_DORSI = "latissimus_dorsi",
  TERES_MAJOR = "teres_major",
  INFRASPINATUS = "infraspinatus",
  LOWER_TRAPEZIUS = "lower_trapezius",
  DELTOIDS = "deltoids",
  GASTROCNEMIUS = "gastrocnemius",
  SOLEUS = "soleus",
}

export const BACK_MUSCLE_IDS = Object.values(BackMuscleId);

export const BACK_BODY_CONTOUR =
  "M175.75 187.477V178.917C175.75 172.73 172.262 166.141 170.093 162.63C172.241 155.569 172.262 138.649 171.096 130.792C170.38 126.024 167.004 122.131 165.337 119.637C165.368 119.445 165.398 119.254 165.429 119.063C166.35 113.299 162.361 99.1455 159.977 93.1803C158.392 89.2169 155.078 87.718 152.418 86.5109C150.976 85.857 149.739 85.2937 149.033 84.489C147.243 82.4268 145.453 81.8634 143.878 81.3705Z";

// Type for simplified back body muscle paths (just path data strings)
type BackMusclePaths = string[];

// Simplified muscle paths for back view
export const backBodyData: Record<BackMuscleId, BackMusclePaths> = {
  [BackMuscleId.RHOMBOID_MUSCLES]: [],
  [BackMuscleId.TRAPEZIUS]: [],
  [BackMuscleId.GRACILIS]: [],
  [BackMuscleId.TENSOR_FASCIAE_LATAE]: [],
  [BackMuscleId.ERECTOR_SPINAE]: [],
  [BackMuscleId.FLEXOR_CARPI_RADIALIS]: [],
  [BackMuscleId.BICEPS_FEMORIS]: [],
  [BackMuscleId.ADDUCTOR_MAGNUS]: [],
  [BackMuscleId.SEMITENDINOSUS]: [],
  [BackMuscleId.GLUTEUS_MEDIUS]: [],
  [BackMuscleId.GLUTEUS_MAXIMUS]: [],
  [BackMuscleId.FLEXOR_CARPI_ULNARIS]: [],
  [BackMuscleId.EXTENSOR_CARPI_RADIALIS]: [],
  [BackMuscleId.BRACHIORADIALIS]: [],
  [BackMuscleId.SERRATUS_ANTERIOR]: [],
  [BackMuscleId.EXTERNAL_OBLIQUES]: [],
  [BackMuscleId.TRICEPS_BRACHII]: [],
  [BackMuscleId.LATISSIMUS_DORSI]: [],
  [BackMuscleId.TERES_MAJOR]: [],
  [BackMuscleId.INFRASPINATUS]: [],
  [BackMuscleId.LOWER_TRAPEZIUS]: [],
  [BackMuscleId.DELTOIDS]: [],
  [BackMuscleId.GASTROCNEMIUS]: [],
  [BackMuscleId.SOLEUS]: [],
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
