import { type ExerciseType } from "@/store/exerciseLog";

export interface FieldRequirements {
  needsReps: boolean;
  needsWeight: boolean;
  needsDuration: boolean;
  needsDistance: boolean;
}

export const getRequiredFields = (
  exerciseType: ExerciseType,
): FieldRequirements => {
  switch (exerciseType) {
    case "Weight Reps":
      return {
        needsReps: true,
        needsWeight: true,
        needsDuration: false,
        needsDistance: false,
      };
    case "Reps Only":
      return {
        needsReps: true,
        needsWeight: false,
        needsDuration: false,
        needsDistance: false,
      };
    case "Weighted Bodyweight":
    case "Assisted Bodyweight":
      return {
        needsReps: true,
        needsWeight: true,
        needsDuration: false,
        needsDistance: false,
      };
    case "Duration":
      return {
        needsReps: false,
        needsWeight: false,
        needsDuration: true,
        needsDistance: false,
      };
    case "Weight & Duration":
      return {
        needsReps: false,
        needsWeight: true,
        needsDuration: true,
        needsDistance: false,
      };
    case "Distance & Duration":
      return {
        needsReps: false,
        needsWeight: false,
        needsDuration: true,
        needsDistance: true,
      };
    case "Weight & Distance":
      return {
        needsReps: false,
        needsWeight: true,
        needsDuration: false,
        needsDistance: true,
      };
    default:
      return {
        needsReps: true,
        needsWeight: false,
        needsDuration: false,
        needsDistance: false,
      };
  }
};

export const getWeightUnitLabel = (useKg: boolean): string => {
  return useKg ? "kg" : "lbs";
};

export const getDistanceUnitLabel = (useKm: boolean): string => {
  return useKm ? "km" : "mi";
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
};
