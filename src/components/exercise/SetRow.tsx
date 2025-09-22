import { SwipeableSetRow } from "@/components/SwipeableSetRow";
import { cn } from "@/utils/cn";
import { getRequiredFields } from "@/utils/exerciseFieldHelpers";
import {
  formatPreviousSet,
  getPreviousValuePlaceholder,
} from "@/utils/previousWorkoutFormatter";
import React from "react";
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

export const SetRow: React.FC<SetRowProps> = ({
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
}) => {
  const requiredFields = getRequiredFields(exerciseType as any);
  const isWorkoutMode = mode === "workout";
  const actualSet = workoutSet || set;
  const isCompleted = isWorkoutMode && workoutSet?.isCompleted;

  const getInputBackground = (fieldName: string) => {
    if (isCompleted) return "bg-green-600/90";
    if (validationErrors.includes(fieldName))
      return "bg-red-600/20 border border-red-500";
    return "bg-neutral-800";
  };

  const handleUpdateSet = (setId: string, updates: Partial<BaseSetData>) => {
    onUpdateSet(setId, updates);
  };

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
            value={
              actualSet.weight
                ? unitsConfig.weight === "lbs"
                  ? convertWeight(actualSet.weight, "kg", "lbs").toString()
                  : actualSet.weight.toString()
                : ""
            }
            onChangeText={(value) => {
              const weightInKg =
                unitsConfig.weight === "lbs" && value
                  ? convertWeight(parseFloat(value), "lbs", "kg")
                  : value
                    ? parseFloat(value)
                    : undefined;
              handleUpdateSet(actualSet.id, { weight: weightInKg });
            }}
            placeholder={
              isWorkoutMode && previousData && previousData.rpe !== undefined
                ? getPreviousValuePlaceholder(
                    "weight",
                    { ...previousData, rpe: previousData.rpe },
                    unitsConfig.weight,
                    unitsConfig.distance === "miles" ? "mi" : "km",
                  )
                : "0"
            }
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
            value={actualSet.reps ? actualSet.reps.toString() : ""}
            onChangeText={(value) =>
              handleUpdateSet(actualSet.id, {
                reps: value ? parseInt(value) : undefined,
              })
            }
            placeholder={
              isWorkoutMode && previousData && previousData.rpe !== undefined
                ? getPreviousValuePlaceholder("reps", {
                    ...previousData,
                    rpe: previousData.rpe,
                  })
                : "0"
            }
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
            value={actualSet.duration ? actualSet.duration.toString() : ""}
            onChangeText={(value) =>
              handleUpdateSet(actualSet.id, {
                duration: value ? parseInt(value) : undefined,
              })
            }
            placeholder={
              isWorkoutMode && previousData && previousData.rpe !== undefined
                ? getPreviousValuePlaceholder("duration", {
                    ...previousData,
                    rpe: previousData.rpe,
                  })
                : "60"
            }
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
            value={
              actualSet.distance
                ? unitsConfig.distance === "miles"
                  ? (actualSet.distance / 1000 / 1.609344).toString()
                  : actualSet.distance.toString()
                : ""
            }
            onChangeText={(value) => {
              const distanceInMeters =
                unitsConfig.distance === "miles" && value
                  ? parseFloat(value) * 1000 * 1.609344
                  : value
                    ? parseFloat(value)
                    : undefined;
              handleUpdateSet(actualSet.id, { distance: distanceInMeters });
            }}
            placeholder={
              isWorkoutMode && previousData && previousData.rpe !== undefined
                ? getPreviousValuePlaceholder(
                    "distance",
                    { ...previousData, rpe: previousData.rpe },
                    unitsConfig.weight,
                    unitsConfig.distance === "miles" ? "mi" : "km",
                  )
                : "100"
            }
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
              className="bg-green-800 bg-opacity-70 rounded-full py-2 px-3 items-center justify-center border border-green-600"
              activeOpacity={0.7}
            >
              <Text className="text-green-100 text-xs font-Poppins_500Medium">
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
    >
      <SetContent />
    </SwipeableSetRow>
  );
};
