import {
  type MuscleColorPair,
  type MuscleId,
} from "@/components/muscle-body/MuscleBody";
import {
  getGroupProgressForMuscle,
  getProgressColor,
} from "@/store/weeklyProgress";
import { muscleToGroupMapping } from "@/utils/muscleMapping";

/**
 * Generate highlighted muscles for MuscleBody component based on weekly progress
 */
export const generateMuscleHighlights = (
  muscles: any[],
  weeklyProgress: any[],
  majorGroup?: string,
): MuscleColorPair[] => {
  const highlightedMuscles: MuscleColorPair[] = [];
  const seenMuscleIds = new Set<string>();

  // Filter muscles by major group if specified
  const filteredMuscles = majorGroup
    ? muscles.filter((muscle) => muscle.majorGroup === majorGroup)
    : muscles;

  filteredMuscles.forEach((muscle) => {
    if (seenMuscleIds.has(muscle.svgId)) {
      return;
    }
    seenMuscleIds.add(muscle.svgId);

    // Use group progress percentage instead of individual muscle progress
    const groupProgress = getGroupProgressForMuscle(
      muscle.svgId,
      weeklyProgress,
      muscleToGroupMapping,
    );
    const color = getProgressColor(groupProgress, true);

    highlightedMuscles.push({
      muscleId: muscle.svgId as MuscleId,
      color,
    });
  });

  return highlightedMuscles;
};

/**
 * Determine the optimal view for MuscleBody based on muscle group
 */
export const getOptimalViewForMuscleGroup = (
  majorGroup: string,
): "front" | "back" | "both" => {
  // For thumbnails, use "both" view for all muscle groups
  // to ensure consistent rendering at small sizes
  return "both";
};
