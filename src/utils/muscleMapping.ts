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
