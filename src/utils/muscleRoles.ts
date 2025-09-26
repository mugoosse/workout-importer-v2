import { type MuscleRole } from "@/utils/xpCalculator";

// Helper function to get role color
export const getRoleColor = (role: MuscleRole): string => {
  switch (role) {
    case "target":
      return "#1FD224";
    case "synergist":
      return "#FF8A1B";
    case "stabilizer":
      return "#FCD514";
    case "lengthening":
      return "#3498DB";
    default:
      return "#6F2DBD";
  }
};

// Helper function to get role display name
export const getRoleDisplayName = (role: MuscleRole): string => {
  switch (role) {
    case "target":
      return "Target";
    case "synergist":
      return "Synergist";
    case "stabilizer":
      return "Stabilizer";
    case "lengthening":
      return "Lengthening";
    default:
      return "Unknown";
  }
};

// Helper function to get role description
export const getRoleDescription = (role: MuscleRole): string => {
  switch (role) {
    case "target":
      return "Exercises that primarily work this muscle";
    case "synergist":
      return "Exercises where this muscle assists";
    case "stabilizer":
      return "Exercises where this muscle stabilizes";
    case "lengthening":
      return "Exercises that stretch this muscle";
    default:
      return "Unknown role";
  }
};
