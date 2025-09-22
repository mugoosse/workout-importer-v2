/**
 * Cleans exercise titles by removing equipment information and numbered prefixes
 * @param title - The raw exercise title
 * @returns The cleaned title without equipment suffix or numbered prefix
 */
export const cleanExerciseTitle = (title: string): string => {
  if (!title) return "";

  return (
    title
      // Remove numbered prefix pattern "1. ", "2. ", etc.
      .replace(/^\d+\.\s*/, "")
      // Remove equipment suffix pattern " (Equipment Name)"
      .replace(/\s*\([^)]*\)\s*$/, "")
      .trim()
  );
};
