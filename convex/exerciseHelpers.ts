import { QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export type ExerciseType =
  | "Weight Reps"
  | "Reps Only"
  | "Weighted Bodyweight"
  | "Assisted Bodyweight"
  | "Duration"
  | "Weight & Duration"
  | "Distance & Duration"
  | "Weight & Distance";

export type MuscleRole = "target" | "lengthening" | "synergist" | "stabilizer";

export function normalizeMuscleName(name: string): string {
  if (!name || typeof name !== 'string') return '';

  // Handle common variations and mappings to match database format
  const mappings: Record<string, string> = {
    "Deltoid": "Deltoids",
    "Quadriceps Femoris": "Rectus Femoris", // Check if this mapping is correct
    "Abdominal Muscles": "Rectus Abdominis",
    "Hip Adductor Muscles": "Adductor Longus And Pectineus", // Approximate mapping
    "Hip External Rotators (Deep Layer)": "Gluteus Medius", // Approximate mapping
    "Anterior Deltoid": "Deltoids",
    "Pectoralis Major, Clavicular Head": "Pectoralis Major",
    "Clavicular Head": "Pectoralis Major"
  };

  // Clean the name first
  let cleaned = name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,;].*$/, '') // Remove everything after comma or semicolon
    .trim();

  // Apply mappings
  if (mappings[cleaned]) {
    return mappings[cleaned];
  }

  // Convert to Title Case if needed
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeEquipmentName(name: string): string {
  if (!name || typeof name !== 'string') return '';

  const mappings: Record<string, string> = {
    "dumbell": "Dumbbell",
    "medicine ball": "Medicine-Ball",
    "ez-bar": "EZ Bar",
    "ez bar": "EZ Bar",
    "t-bar": "T Bar",
    "t bar": "T Bar",
    "ghd": "GHD Machine",
    "captain chair": "Captain's Chair",
    "weight plates": "Weight Plate",
    "plates": "Weight Plate",
    "band": "Resistance Band",
    "bands": "Resistance Band",
    "stability ball": "Stability Ball",
    "exercise ball": "Stability Ball",
    "swiss ball": "Stability Ball",
    "trap bar": "Trap Bar",
    "hex bar": "Trap Bar"
  };

  const normalized = name.trim();
  const lowerName = normalized.toLowerCase();

  return mappings[lowerName] || normalized;
}

export function parseExerciseType(type: string): ExerciseType {
  if (!type || typeof type !== 'string') return "Weight Reps";

  const typeMap: Record<string, ExerciseType> = {
    "weight_reps": "Weight Reps",
    "weight reps": "Weight Reps",
    "reps_only": "Reps Only",
    "reps only": "Reps Only",
    "weighted_bodyweight": "Weighted Bodyweight",
    "weighted bodyweight": "Weighted Bodyweight",
    "assisted_bodyweight": "Assisted Bodyweight",
    "assisted bodyweight": "Assisted Bodyweight",
    "duration": "Duration",
    "weight_duration": "Weight & Duration",
    "weight & duration": "Weight & Duration",
    "weight and duration": "Weight & Duration",
    "distance_duration": "Distance & Duration",
    "distance & duration": "Distance & Duration",
    "distance and duration": "Distance & Duration",
    "weight_distance": "Weight & Distance",
    "weight & distance": "Weight & Distance",
    "weight and distance": "Weight & Distance"
  };

  const normalized = type.toLowerCase().trim();
  return typeMap[normalized] || "Weight Reps";
}

export function parseEquipment(equipment: string): string[] {
  if (!equipment || typeof equipment !== 'string') return [];

  return equipment
    .split(/[;,]/)
    .map(e => normalizeEquipmentName(e.trim()))
    .filter(e => e.length > 0);
}

export function parseMuscles(muscles: string): string[] {
  if (!muscles || typeof muscles !== 'string') return [];

  return muscles
    .split(/[;,]/)
    .map(m => normalizeMuscleName(m.trim()))
    .filter(m => m.length > 0);
}

export async function findMuscleByName(
  ctx: QueryCtx,
  name: string
): Promise<Id<"muscles"> | null> {
  if (!name) return null;

  const normalized = normalizeMuscleName(name);

  const muscle = await ctx.db
    .query("muscles")
    .filter(q => q.eq(q.field("name"), normalized))
    .first();

  return muscle?._id || null;
}

export async function findEquipmentByName(
  ctx: QueryCtx,
  name: string
): Promise<Id<"equipment"> | null> {
  if (!name) return null;

  const normalized = normalizeEquipmentName(name);

  const equipment = await ctx.db
    .query("equipment")
    .withIndex("by_name", q => q.eq("name", normalized))
    .first();

  return equipment?._id || null;
}