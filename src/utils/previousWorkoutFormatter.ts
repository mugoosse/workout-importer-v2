import { formatTime } from "./formatDuration";
import { type LoggedSet, type ExerciseType } from "@/store/exerciseLog";

export interface PreviousWorkoutDisplayData {
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  rpe: number;
}

/**
 * Formats a previous workout set for display in the PREVIOUS column
 * Follows Hevy's formatting patterns
 */
export function formatPreviousSet(
  set: LoggedSet | PreviousWorkoutDisplayData,
  exerciseType: ExerciseType,
  weightUnit: "kg" | "lbs" = "kg",
  distanceUnit: "km" | "mi" = "km",
): string {
  const { weight, reps, duration, distance } = set;

  switch (exerciseType) {
    case "Weight Reps":
      // "10kg x 10"
      return `${weight}${weightUnit} x ${reps}`;

    case "Reps Only":
      // "x 10"
      return `x ${reps}`;

    case "Weighted Bodyweight":
      // "10kg x 10" (same as Weight Reps)
      return `${weight}${weightUnit} x ${reps}`;

    case "Assisted Bodyweight":
      // Shows with negative weight for assistance
      const assistWeight = weight ? -Math.abs(weight) : 0;
      return `${assistWeight}${weightUnit} x ${reps}`;

    case "Duration":
      // "00:05"
      return duration ? formatTime(duration) : "00:00";

    case "Weight & Duration":
      // "10kg x 00:05"
      return `${weight}${weightUnit} x ${duration ? formatTime(duration) : "00:00"}`;

    case "Distance & Duration":
      // "1 km in 10:00"
      const distanceValue = distance || 0;
      const distanceDisplay =
        distanceUnit === "km"
          ? `${distanceValue / 1000} km`
          : `${(distanceValue / 1609.34).toFixed(2)} mi`;
      return `${distanceDisplay} in ${duration ? formatTime(duration) : "00:00"}`;

    case "Weight & Distance":
      // "10kg - 10m"
      const weightDisplay = `${weight}${weightUnit}`;
      const distDisplay =
        distanceUnit === "km"
          ? `${(distance || 0) / 1000}km`
          : `${((distance || 0) / 1609.34).toFixed(2)}mi`;
      return `${weightDisplay} - ${distDisplay}`;

    default:
      // Fallback: show available data
      const parts = [];
      if (weight) parts.push(`${weight}${weightUnit}`);
      if (reps) parts.push(`${reps} reps`);
      if (duration) parts.push(formatTime(duration));
      if (distance) {
        const distanceValue =
          distanceUnit === "km"
            ? `${distance / 1000}km`
            : `${(distance / 1609.34).toFixed(2)}mi`;
        parts.push(distanceValue);
      }
      return parts.join(" • ");
  }
}

/**
 * Creates placeholder text for input fields based on previous data
 */
export function getPreviousValuePlaceholder(
  field: "weight" | "reps" | "duration" | "distance",
  previousSet?: LoggedSet | PreviousWorkoutDisplayData,
  weightUnit: "kg" | "lbs" = "kg",
  distanceUnit: "km" | "mi" = "km",
): string {
  if (!previousSet) return "";

  switch (field) {
    case "weight":
      return previousSet.weight ? previousSet.weight.toString() : "";
    case "reps":
      return previousSet.reps ? previousSet.reps.toString() : "";
    case "duration":
      return previousSet.duration ? previousSet.duration.toString() : "";
    case "distance":
      if (!previousSet.distance) return "";
      // Convert distance based on unit preference
      if (distanceUnit === "km") {
        return (previousSet.distance / 1000).toString();
      } else {
        return (previousSet.distance / 1609.34).toFixed(2);
      }
    default:
      return "";
  }
}

/**
 * Checks if two sets have the same values (for quick-fill validation)
 */
export function setsAreEqual(
  currentSet: {
    weight?: string;
    reps?: string;
    duration?: string;
    distance?: string;
    rpe?: string;
  },
  previousSet?: LoggedSet | PreviousWorkoutDisplayData,
): boolean {
  if (!previousSet) return false;

  const currentWeight = currentSet.weight
    ? parseFloat(currentSet.weight)
    : undefined;
  const currentReps = currentSet.reps ? parseInt(currentSet.reps) : undefined;
  const currentDuration = currentSet.duration
    ? parseInt(currentSet.duration)
    : undefined;
  const currentDistance = currentSet.distance
    ? parseFloat(currentSet.distance)
    : undefined;
  const currentRpe = currentSet.rpe ? parseInt(currentSet.rpe) : undefined;

  return (
    currentWeight === previousSet.weight &&
    currentReps === previousSet.reps &&
    currentDuration === previousSet.duration &&
    currentDistance === previousSet.distance &&
    currentRpe === previousSet.rpe
  );
}
