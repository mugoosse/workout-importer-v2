import { SwipeableSetRow } from "@/components/SwipeableSetRow";
import { useDebouncedNumericInput } from "@/hooks/useDebouncedInput";
import { cn } from "@/utils/cn";
import { getRequiredFields } from "@/utils/exerciseFieldHelpers";
import {
  formatPreviousSet,
  getPreviousValuePlaceholder,
} from "@/utils/previousWorkoutFormatter";
import React, { useCallback } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export interface BaseSetData {
  id: string;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
}

export interface WorkoutSetData extends BaseSetData {
  isCompleted: boolean;
  rpe?: number;
  isPR?: boolean;
  prValue?: number;
}

export interface PreviousSetData {
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  rpe?: number;
}

export interface UnitsConfig {
  weight: "kg" | "lbs";
  distance: "km" | "miles";
}

interface SetRowProps {
  set: BaseSetData;
  index: number;
  exerciseType: string;
  onUpdateSet: (setId: string, updates: Partial<BaseSetData>) => void;
  onDeleteSet?: (setId: string) => void;
  mode: "workout" | "routine";

  // Workout-specific props
  workoutSet?: WorkoutSetData;
  previousData?: PreviousSetData;
  unitsConfig?: UnitsConfig;
  onCompleteSet?: (setId: string) => void;
  onUndoComplete?: (setId: string) => void;
  completedSetsLength?: number;
  validationErrors?: string[]; // Field names that should be highlighted as errors

  // Current workout context for smart defaults
  allSets?: BaseSetData[]; // All sets in the current exercise for smart placeholder logic
}

// Unit conversion functions
const convertWeight = (
  weight: number,
  from: "kg" | "lbs",
  to: "kg" | "lbs",
): number => {
  if (from === to) return weight;
  if (from === "kg" && to === "lbs") return weight * 2.20462;
  if (from === "lbs" && to === "kg") return weight / 2.20462;
  return weight;
};

const SetRowComponent: React.FC<SetRowProps> = ({
  set,
  index,
  exerciseType,
  onUpdateSet,
  onDeleteSet,
  mode,
  workoutSet,
  previousData,
  unitsConfig = { weight: "kg", distance: "km" },
  onCompleteSet,
  onUndoComplete,
  completedSetsLength = 1,
  validationErrors = [],
  allSets = [],
}) => {
  const requiredFields = getRequiredFields(exerciseType as any);
  const isWorkoutMode = mode === "workout";
  const actualSet = workoutSet || set;
  const isCompleted = isWorkoutMode && workoutSet?.isCompleted;

  // Get smart default values from current exercise sets (most recent set with values)
  const getSmartDefault = (field: keyof BaseSetData): number | undefined => {
    if (!isWorkoutMode || !allSets) return undefined;

    // Look for the most recent set before current index that has a value for this field
    for (let i = index - 1; i >= 0; i--) {
      const prevSet = allSets[i] as any;
      if (prevSet?.[field] !== undefined && prevSet?.[field] !== null) {
        return prevSet[field];
      }
    }

    return undefined;
  };

  const getInputBackground = (fieldName: string) => {
    if (isCompleted) {
      return workoutSet?.isPR
        ? "bg-purple-600/90 border border-purple-600/90"
        : "bg-green-600/90 border border-green-600/90";
    }
    if (validationErrors.includes(fieldName)) {
      return "bg-red-600/20 border border-red-500";
    }
    return "bg-neutral-800 border border-neutral-800";
  };

  const handleUpdateSet = useCallback(
    (setId: string, updates: Partial<BaseSetData>) => {
      onUpdateSet(setId, updates);
    },
    [onUpdateSet],
  );

  // Memoize callback functions to prevent hook recreation
  const handleWeightChange = useCallback(
    (value: number | undefined) => {
      const weightInKg =
        unitsConfig.weight === "lbs" && value
          ? convertWeight(value, "lbs", "kg")
          : value;
      handleUpdateSet(actualSet.id, { weight: weightInKg });
    },
    [actualSet.id, unitsConfig.weight, handleUpdateSet],
  );

  const handleRepsChange = useCallback(
    (value: number | undefined) => {
      handleUpdateSet(actualSet.id, {
        reps: value ? Math.round(value) : undefined,
      });
    },
    [actualSet.id, handleUpdateSet],
  );

  const handleDurationChange = useCallback(
    (value: number | undefined) => {
      handleUpdateSet(actualSet.id, {
        duration: value ? Math.round(value) : undefined,
      });
    },
    [actualSet.id, handleUpdateSet],
  );

  const handleDistanceChange = useCallback(
    (value: number | undefined) => {
      const distanceInMeters =
        unitsConfig.distance === "miles" && value
          ? value * 1000 * 1.609344
          : value;
      handleUpdateSet(actualSet.id, { distance: distanceInMeters });
    },
    [actualSet.id, unitsConfig.distance, handleUpdateSet],
  );

  // Calculate placeholders
  const weightPlaceholder = (() => {
    if (!isWorkoutMode) return "0";

    // First try smart default from current workout
    const smartDefault = getSmartDefault("weight");
    if (smartDefault !== undefined) {
      const displayValue =
        unitsConfig.weight === "lbs"
          ? convertWeight(smartDefault, "kg", "lbs")
          : smartDefault;
      return displayValue.toString();
    }

    // Fallback to previous workout data
    if (previousData && previousData.rpe !== undefined) {
      return getPreviousValuePlaceholder(
        "weight",
        { ...previousData, rpe: previousData.rpe },
        unitsConfig.weight,
        unitsConfig.distance === "miles" ? "mi" : "km",
      );
    }

    return "0";
  })();

  // Setup debounced inputs for each field
  const weightInput = useDebouncedNumericInput(
    actualSet.weight
      ? unitsConfig.weight === "lbs"
        ? convertWeight(actualSet.weight, "kg", "lbs")
        : actualSet.weight
      : undefined,
    handleWeightChange,
    300, // 300ms debounce
  );

  const repsPlaceholder = (() => {
    if (!isWorkoutMode) return "0";

    const smartDefault = getSmartDefault("reps");
    if (smartDefault !== undefined) {
      return smartDefault.toString();
    }

    if (previousData && previousData.rpe !== undefined) {
      return getPreviousValuePlaceholder("reps", {
        ...previousData,
        rpe: previousData.rpe,
      });
    }

    return "0";
  })();

  const durationPlaceholder = (() => {
    if (!isWorkoutMode) return "60";

    const smartDefault = getSmartDefault("duration");
    if (smartDefault !== undefined) {
      return smartDefault.toString();
    }

    if (previousData && previousData.rpe !== undefined) {
      return getPreviousValuePlaceholder("duration", {
        ...previousData,
        rpe: previousData.rpe,
      });
    }

    return "60";
  })();

  const distancePlaceholder = (() => {
    if (!isWorkoutMode) return "100";

    const smartDefault = getSmartDefault("distance");
    if (smartDefault !== undefined) {
      const displayValue =
        unitsConfig.distance === "miles"
          ? smartDefault / 1000 / 1.609344
          : smartDefault;
      return displayValue.toString();
    }

    if (previousData && previousData.rpe !== undefined) {
      return getPreviousValuePlaceholder(
        "distance",
        { ...previousData, rpe: previousData.rpe },
        unitsConfig.weight,
        unitsConfig.distance === "miles" ? "mi" : "km",
      );
    }

    return "100";
  })();

  // Debug logging to track store vs UI state
  console.log(
    `[SetRow] Set ${index + 1} reps - Store: ${actualSet.reps}, Input will show: ${actualSet.reps?.toString() || "undefined"}`,
  );

  const repsInput = useDebouncedNumericInput(
    actualSet.reps,
    handleRepsChange,
    300,
  );

  const durationInput = useDebouncedNumericInput(
    actualSet.duration,
    handleDurationChange,
    300,
  );

  const distanceInput = useDebouncedNumericInput(
    actualSet.distance
      ? unitsConfig.distance === "miles"
        ? actualSet.distance / 1000 / 1.609344
        : actualSet.distance
      : undefined,
    handleDistanceChange,
    300,
  );

  const SetContent = () => (
    <View className="flex-row items-center">
      {/* Set Number */}
      <Text className="text-white text-sm font-Poppins_600SemiBold w-8 text-center">
        {index + 1}
      </Text>

      {/* Previous Column (workout mode only) */}
      {isWorkoutMode && (
        <View className="w-16 items-center">
          <Text className="text-gray-400 text-xs font-Poppins_400Regular text-center">
            {previousData && previousData.rpe !== undefined
              ? formatPreviousSet(
                  { ...previousData, rpe: previousData.rpe },
                  exerciseType as any,
                  unitsConfig.weight,
                  unitsConfig.distance === "miles" ? "mi" : "km",
                )
              : "-"}
          </Text>
          {previousData && previousData.rpe && (
            <Text className="text-gray-400 text-xs font-Poppins_400Regular text-center">
              RPE {previousData.rpe}
            </Text>
          )}
        </View>
      )}

      {/* Weight Input */}
      {requiredFields.needsWeight && (
        <View className="flex-1 mx-1">
          <TextInput
            key={`weight-${actualSet.id}-${actualSet.weight || 0}`}
            ref={weightInput.inputRef}
            value={weightInput.value}
            onChangeText={weightInput.onChange}
            onFocus={weightInput.onFocus}
            onBlur={weightInput.onBlur}
            placeholder={weightPlaceholder}
            placeholderTextColor="#666"
            keyboardType="numeric"
            className={cn(
              "rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular",
              getInputBackground("weight"),
            )}
          />
        </View>
      )}

      {/* Reps Input */}
      {requiredFields.needsReps && (
        <View className="flex-1 mx-1">
          <TextInput
            key={`reps-${actualSet.id}-${actualSet.reps || 0}`}
            ref={repsInput.inputRef}
            value={repsInput.value}
            onChangeText={repsInput.onChange}
            onFocus={repsInput.onFocus}
            onBlur={repsInput.onBlur}
            placeholder={repsPlaceholder}
            placeholderTextColor="#666"
            keyboardType="numeric"
            className={cn(
              "rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular",
              getInputBackground("reps"),
            )}
          />
        </View>
      )}

      {/* Duration Input */}
      {requiredFields.needsDuration && (
        <View className="flex-1 mx-1">
          <TextInput
            key={`duration-${actualSet.id}-${actualSet.duration || 0}`}
            ref={durationInput.inputRef}
            value={durationInput.value}
            onChangeText={durationInput.onChange}
            onFocus={durationInput.onFocus}
            onBlur={durationInput.onBlur}
            placeholder={durationPlaceholder}
            placeholderTextColor="#666"
            keyboardType="numeric"
            className={cn(
              "rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular",
              getInputBackground("duration"),
            )}
          />
        </View>
      )}

      {/* Distance Input */}
      {requiredFields.needsDistance && (
        <View className="flex-1 mx-1">
          <TextInput
            key={`distance-${actualSet.id}-${actualSet.distance || 0}`}
            ref={distanceInput.inputRef}
            value={distanceInput.value}
            onChangeText={distanceInput.onChange}
            onFocus={distanceInput.onFocus}
            onBlur={distanceInput.onBlur}
            placeholder={distancePlaceholder}
            placeholderTextColor="#666"
            keyboardType="numeric"
            className={cn(
              "rounded-lg p-2 text-white text-center text-sm font-Poppins_400Regular",
              getInputBackground("distance"),
            )}
          />
        </View>
      )}

      {/* Action Column (workout mode only) */}
      {isWorkoutMode && (
        <View className="w-20 mx-1">
          {workoutSet?.isCompleted ? (
            <TouchableOpacity
              onPress={() => onUndoComplete?.(actualSet.id)}
              className={cn(
                "rounded-full py-2 px-3 items-center justify-center border",
                workoutSet.isPR
                  ? "bg-purple-800 bg-opacity-70 border-purple-600"
                  : "bg-green-800 bg-opacity-70 border-green-600",
              )}
              activeOpacity={0.7}
            >
              <Text
                className={cn(
                  "text-xs font-Poppins_500Medium",
                  workoutSet.isPR ? "text-purple-100" : "text-green-100",
                )}
              >
                RPE {workoutSet.rpe}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onCompleteSet?.(actualSet.id)}
              className="bg-[#6F2DBD] rounded-lg py-2 px-2 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-white text-xs font-Poppins_500Medium">
                Complete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SwipeableSetRow
      onDelete={() => onDeleteSet?.(actualSet.id)}
      canDelete={completedSetsLength > 1}
      isCompleted={workoutSet?.isCompleted || false}
      isPR={workoutSet?.isPR || false}
    >
      <SetContent />
    </SwipeableSetRow>
  );
};

export const SetRow = React.memo(SetRowComponent, (prevProps, nextProps) => {
  // Only re-render if essential data has changed
  const prevSet = prevProps.workoutSet || prevProps.set;
  const nextSet = nextProps.workoutSet || nextProps.set;

  // Check if any previous sets have changed (for placeholder calculation)
  const prevSetsForPlaceholder =
    prevProps.allSets?.slice(0, prevProps.index) || [];
  const nextSetsForPlaceholder =
    nextProps.allSets?.slice(0, nextProps.index) || [];

  const placeholderDataChanged =
    prevSetsForPlaceholder.length !== nextSetsForPlaceholder.length ||
    prevSetsForPlaceholder.some((prevPrevSet, i) => {
      const nextPrevSet = nextSetsForPlaceholder[i];
      return (
        prevPrevSet?.weight !== nextPrevSet?.weight ||
        prevPrevSet?.reps !== nextPrevSet?.reps ||
        prevPrevSet?.duration !== nextPrevSet?.duration ||
        prevPrevSet?.distance !== nextPrevSet?.distance
      );
    });

  // Check if validation errors changed
  const validationErrorsChanged =
    prevProps.validationErrors?.length !== nextProps.validationErrors?.length ||
    prevProps.validationErrors?.some(
      (error, i) => error !== nextProps.validationErrors?.[i],
    );

  return (
    prevSet.id === nextSet.id &&
    prevSet.weight === nextSet.weight &&
    prevSet.reps === nextSet.reps &&
    prevSet.duration === nextSet.duration &&
    prevSet.distance === nextSet.distance &&
    prevProps.index === nextProps.index &&
    prevProps.exerciseType === nextProps.exerciseType &&
    (prevProps.workoutSet?.isCompleted || false) ===
      (nextProps.workoutSet?.isCompleted || false) &&
    !placeholderDataChanged &&
    !validationErrorsChanged
  );
});
