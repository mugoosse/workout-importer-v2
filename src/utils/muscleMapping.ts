import { type MuscleId } from "@/components/muscle-body/MuscleBody";

export type MajorMuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core";

// Map individual muscle svgIds to their major muscle groups
export const muscleToGroupMapping: Record<MuscleId, MajorMuscleGroup> = {
  // Chest
  pectoralis_major: "chest",
  serratus_anterior: "chest",

  // Back
  latissimus_dorsi: "back",
  lower_trapezius: "back",
  rhomboid_muscles: "back",
  trapezius: "back",
  teres_major: "back",
  erector_spinae: "back",
  infraspinatus: "back",

  // Legs
  rectus_femoris: "legs",
  vastus_lateralis: "legs",
  vastus_medialis: "legs",
  biceps_femoris: "legs",
  semitendinosus: "legs",
  gastrocnemius: "legs",
  soleus: "legs",
  gluteus_maximus: "legs",
  gluteus_medius: "legs",
  adductor_longus_and_pectineus: "legs",
  adductor_magnus: "legs",
  gracilis: "legs",
  sartorius: "legs",
  tensor_fasciae_latae: "legs",
  peroneus_longus: "legs",

  // Shoulders
  deltoids: "shoulders",

  // Arms
  biceps_brachii: "arms",
  triceps_brachii: "arms",
  brachialis: "arms",
  brachioradialis: "arms",
  extensor_carpi_radialis: "arms",
  flexor_carpi_radialis: "arms",
  flexor_carpi_ulnaris: "arms",

  // Core
  rectus_abdominis: "core",
  external_obliques: "core",
  omohyoid: "core",
  sternocleidomastoid: "core",
};

export const getMajorGroupFromMuscle = (
  muscleId: MuscleId,
): MajorMuscleGroup => {
  return muscleToGroupMapping[muscleId];
};

// Map individual muscle svgIds to their groups (intermediate level)
export const muscleToIntermediateGroupMapping: Record<MuscleId, string> = {
  // Chest
  pectoralis_major: "chest",
  serratus_anterior: "chest",

  // Back
  latissimus_dorsi: "lats",
  lower_trapezius: "traps",
  rhomboid_muscles: "upper_back",
  trapezius: "traps",
  teres_major: "upper_back",
  erector_spinae: "lower_back",
  infraspinatus: "upper_back",

  // Legs
  rectus_femoris: "quadriceps",
  vastus_lateralis: "quadriceps",
  vastus_medialis: "quadriceps",
  biceps_femoris: "hamstrings",
  semitendinosus: "hamstrings",
  gastrocnemius: "calves",
  soleus: "calves",
  gluteus_maximus: "glutes",
  gluteus_medius: "glutes",
  adductor_longus_and_pectineus: "adductors",
  adductor_magnus: "adductors",
  gracilis: "adductors",
  sartorius: "quadriceps",
  tensor_fasciae_latae: "abductors",
  peroneus_longus: "calves",

  // Shoulders
  deltoids: "shoulders",

  // Arms
  biceps_brachii: "biceps",
  triceps_brachii: "triceps",
  brachialis: "biceps",
  brachioradialis: "forearms",
  extensor_carpi_radialis: "forearms",
  flexor_carpi_radialis: "forearms",
  flexor_carpi_ulnaris: "forearms",

  // Core
  rectus_abdominis: "abdominals",
  external_obliques: "abdominals",
  omohyoid: "neck",
  sternocleidomastoid: "neck",
};

export const getGroupFromMuscle = (muscleId: MuscleId): string => {
  return muscleToIntermediateGroupMapping[muscleId];
};
