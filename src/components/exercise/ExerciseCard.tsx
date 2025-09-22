import { Badge } from "@/components/ui/Badge";
import {
  getDistanceUnitLabel,
  getRequiredFields,
  getWeightUnitLabel,
} from "@/utils/exerciseFieldHelpers";
import { cleanExerciseTitle } from "@/utils/exerciseUtils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { AddSetButton } from "./AddSetButton";
import {
  SetRow,
  type BaseSetData,
  type PreviousSetData,
  type UnitsConfig,
  type WorkoutSetData,
} from "./SetRow";

export interface ExerciseDetails {
  title?: string;
  name?: string;
  type?: string;
  exerciseType?: string;
  equipment?: (string | { name: string } | null)[];
}

export interface BaseExercise {
  exerciseId?: string;
  exerciseDetails?: ExerciseDetails;
  notes?: string;
}

export interface WorkoutExercise extends BaseExercise {
  sets: WorkoutSetData[];
}

export interface RoutineExercise extends BaseExercise {
  sets: BaseSetData[];
}

interface ExerciseCardProps {
  mode: "workout" | "routine";
  exercise: WorkoutExercise | RoutineExercise;
  index?: number;

  // Common props
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<BaseSetData>) => void;
  onUpdateNotes?: (notes: string) => void;
  onRemoveExercise?: () => void;

  // Workout-specific props
  previousSets?: PreviousSetData[];
  unitsConfig?: UnitsConfig;
  onCompleteSet?: (setId: string) => void;
  onUndoComplete?: (setId: string) => void;
  isTemplateExercise?: boolean;
  validationErrors?: Record<string, string[]>;
}

const getWeightLabel = (unitsConfig?: UnitsConfig): string => {
  return getWeightUnitLabel(unitsConfig?.weight === "kg");
};

const getDistanceLabel = (unitsConfig?: UnitsConfig): string => {
  return getDistanceUnitLabel(unitsConfig?.distance === "km");
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  mode,
  exercise,
  index,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onUpdateNotes,
  onRemoveExercise,
  previousSets = [],
  unitsConfig = { weight: "kg", distance: "km" },
  onCompleteSet,
  onUndoComplete,
  isTemplateExercise = false,
  validationErrors = {},
}) => {
  const isWorkoutMode = mode === "workout";

  const exerciseDetails = exercise.exerciseDetails;

  // Direct notes update - no debouncing needed for text fields

  if (!exerciseDetails) {
    return (
      <View className="bg-neutral-800 rounded-2xl p-4 mb-4">
        <Text className="text-white">Loading exercise...</Text>
      </View>
    );
  }

  const exerciseType =
    exerciseDetails.exerciseType || exerciseDetails.type || "Weight Reps";
  const requiredFields = getRequiredFields(exerciseType as any);

  const exerciseTitle = cleanExerciseTitle(
    exerciseDetails.title || exerciseDetails.name || "Unknown Exercise",
  );

  return (
    <View className="bg-neutral-800 rounded-2xl mb-4">
      {/* Exercise Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-1"
            onPress={() => {
              if (isWorkoutMode && !isTemplateExercise && exercise.exerciseId) {
                router.push(
                  `/(app)/(authenticated)/(modal)/exercise/${exercise.exerciseId}`,
                );
              }
            }}
          >
            <Text className="text-white text-lg font-Poppins_600SemiBold">
              {exerciseTitle}
            </Text>
            {exerciseDetails.equipment &&
              exerciseDetails.equipment.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mt-1">
                  {exerciseDetails.equipment.map((eq, eqIndex) => (
                    <Badge key={eqIndex} variant="outline" className="text-xs">
                      {typeof eq === "string" ? eq : eq?.name || "Equipment"}
                    </Badge>
                  ))}
                </View>
              )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRemoveExercise}
            className="p-2 ml-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View className="h-0.5 bg-dark" />

      {/* Notes Section */}
      <View className="px-4 pt-2">
        <TextInput
          value={exercise.notes || ""}
          onChangeText={onUpdateNotes}
          placeholder="Add notes here..."
          placeholderTextColor="#9CA3AF"
          className="bg-neutral-800 rounded-xl py-3 text-white font-Poppins_400Regular mb-1"
          multiline
        />
      </View>

      {/* Sets Section */}
      <View className="px-4 mb-1">
        {/* Sets Header */}
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-8 text-center">
            SET
          </Text>
          {isWorkoutMode && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-16 text-center">
              PREVIOUS
            </Text>
          )}
          {requiredFields.needsWeight && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              {getWeightLabel(unitsConfig)}
            </Text>
          )}
          {requiredFields.needsReps && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              REPS
            </Text>
          )}
          {requiredFields.needsDuration && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              TIME
            </Text>
          )}
          {requiredFields.needsDistance && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold flex-1 text-center">
              {getDistanceLabel(unitsConfig)}
            </Text>
          )}
          {isWorkoutMode && (
            <Text className="text-gray-300 text-xs font-Poppins_600SemiBold w-20 text-center">
              COMPLETION
            </Text>
          )}
        </View>

        {/* Sets Rows */}
        {exercise.sets.map((set, setIndex) => {
          const previousData = previousSets[setIndex];

          return (
            <SetRow
              key={set.id}
              set={set}
              index={setIndex}
              exerciseType={exerciseType}
              onUpdateSet={onUpdateSet}
              onDeleteSet={onRemoveSet}
              mode={mode}
              workoutSet={isWorkoutMode ? (set as WorkoutSetData) : undefined}
              previousData={previousData}
              unitsConfig={unitsConfig}
              onCompleteSet={onCompleteSet}
              onUndoComplete={onUndoComplete}
              completedSetsLength={exercise.sets.length}
              validationErrors={validationErrors[set.id] || []}
              allSets={exercise.sets}
            />
          );
        })}
      </View>

      {/* Add Set Button */}
      <AddSetButton onPress={onAddSet} />
    </View>
  );
};
