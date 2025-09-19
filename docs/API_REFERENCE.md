# Exercise Database API Reference

## Overview

This document provides a complete reference for all available queries and mutations in the exercise database system.

## Queries

### `getAllExercises()`
Returns all exercises in the database.

```typescript
const exercises = await ctx.runQuery(api.exercises.getAllExercises);
```

**Returns:** `Array<Exercise>`

---

### `getExerciseDetails(exerciseId)`
Gets detailed information about a specific exercise including all relationships.

```typescript
const exercise = await ctx.runQuery(api.exercises.getExerciseDetails, {
  exerciseId: "kn7..."
});
```

**Parameters:**
- `exerciseId: Id<"exercises">` - The exercise ID

**Returns:**
```typescript
{
  _id: Id<"exercises">,
  title: string,
  url?: string,
  description?: string,
  source: string,
  exerciseType: ExerciseType,
  _creationTime: number,
  muscles: Array<{
    muscle: Muscle,
    role: "target" | "lengthening" | "synergist" | "stabilizer"
  }>,
  equipment: Array<Equipment>
}
```

---

### `getExercisesByMuscle(muscleId, role?)`
Gets all exercises that work a specific muscle, optionally filtered by role.

```typescript
// All exercises for a muscle
const exercises = await ctx.runQuery(api.exercises.getExercisesByMuscle, {
  muscleId: "kn7..."
});

// Only exercises targeting the muscle
const targetingExercises = await ctx.runQuery(api.exercises.getExercisesByMuscle, {
  muscleId: "kn7...",
  role: "target"
});
```

**Parameters:**
- `muscleId: Id<"muscles">` - The muscle ID
- `role?: "target" | "lengthening" | "synergist" | "stabilizer"` - Optional role filter

**Returns:** `Array<Exercise>`

---

### `getExercisesByEquipment(equipmentId)`
Gets all exercises that use specific equipment.

```typescript
const exercises = await ctx.runQuery(api.exercises.getExercisesByEquipment, {
  equipmentId: "kn7..."
});
```

**Parameters:**
- `equipmentId: Id<"equipment">` - The equipment ID

**Returns:** `Array<Exercise>`

---

### `getExercisesByType(exerciseType)`
Gets all exercises of a specific type.

```typescript
const exercises = await ctx.runQuery(api.exercises.getExercisesByType, {
  exerciseType: "Weight Reps"
});
```

**Parameters:**
- `exerciseType: ExerciseType` - The exercise type to filter by

**Exercise Types:**
- `"Weight Reps"`
- `"Reps Only"`
- `"Weighted Bodyweight"`
- `"Assisted Bodyweight"`
- `"Duration"`
- `"Weight & Duration"`
- `"Distance & Duration"`
- `"Weight & Distance"`

**Returns:** `Array<Exercise>`

---

### `searchExercises(searchTerm, exerciseType?)`
Performs full-text search on exercise titles with optional type filtering.

```typescript
// Search all exercises
const exercises = await ctx.runQuery(api.exercises.searchExercises, {
  searchTerm: "bench press"
});

// Search within specific type
const exercises = await ctx.runQuery(api.exercises.searchExercises, {
  searchTerm: "squat",
  exerciseType: "Weight Reps"
});
```

**Parameters:**
- `searchTerm: string` - The search term
- `exerciseType?: ExerciseType` - Optional exercise type filter

**Returns:** `Array<Exercise>`

---

### `getAllEquipment()`
Returns all equipment types in the database.

```typescript
const equipment = await ctx.runQuery(api.exercises.getAllEquipment);
```

**Returns:** `Array<Equipment>`

```typescript
type Equipment = {
  _id: Id<"equipment">,
  name: string,
  _creationTime: number
}
```

## Mutations

### `importExercise(exerciseData)`
Imports a single exercise with all its relationships.

```typescript
const result = await ctx.runMutation(api.exercises.importExercise, {
  title: "Bench Press (Barbell)",
  url: "https://example.com/exercise/123",
  description: "A compound upper body exercise...",
  exerciseType: "Weight Reps",
  equipmentNames: ["Barbell", "Bench"],
  muscles: {
    target: ["Pectoralis Major"],
    lengthening: [],
    synergist: ["Triceps Brachii", "Deltoids"],
    stabilizer: ["Rectus Abdominis"]
  }
});
```

**Parameters:**
```typescript
{
  title: string,
  url?: string,
  description?: string,
  exerciseType: string,
  equipmentNames: Array<string>,
  muscles: {
    target: Array<string>,
    lengthening: Array<string>,
    synergist: Array<string>,
    stabilizer: Array<string>
  }
}
```

**Returns:**
```typescript
{
  exerciseId: Id<"exercises">,
  errors: Array<string>
}
```

---

### `linkExerciseToMuscle(exerciseId, muscleName, role)`
Creates a relationship between an exercise and a muscle.

```typescript
const result = await ctx.runMutation(api.exercises.linkExerciseToMuscle, {
  exerciseId: "kn7...",
  muscleName: "Pectoralis Major",
  role: "target"
});
```

**Parameters:**
- `exerciseId: Id<"exercises">` - The exercise ID
- `muscleName: string` - The muscle name (must match database exactly)
- `role: "target" | "lengthening" | "synergist" | "stabilizer"` - The muscle's role

**Returns:**
```typescript
{
  success: boolean,
  message?: string,
  error?: string
}
```

---

### `seedEquipment()`
Seeds the database with all predefined equipment types.

```typescript
const result = await ctx.runMutation(api.seedEquipment.seedEquipment);
```

**Returns:**
```typescript
{
  totalEquipment: number,
  newlySeeded: number,
  message: string
}
```

## Analysis Queries

### `findDuplicateExercises()`
Analyzes the database for duplicate exercises (for maintenance).

```typescript
const analysis = await ctx.runQuery(api.exercises.findDuplicateExercises);
```

**Returns:**
```typescript
{
  totalExercises: number,
  uniqueTitles: number,
  duplicateGroups: number,
  totalDuplicates: number,
  duplicates: Array<{
    title: string,
    count: number,
    exercises: Array<Exercise>
  }>,
  sampleUnique: Array<string>
}
```

---

### `analyzeExerciseRelationships()`
Provides statistics about exercise relationships (for health monitoring).

```typescript
const stats = await ctx.runQuery(api.exercises.analyzeExerciseRelationships);
```

**Returns:**
```typescript
{
  totalExercises: number,
  totalMuscleRelationships: number,
  totalEquipmentRelationships: number,
  exercisesWithNoRelationships: number,
  exercisesWithRelationships: number,
  relationshipDistribution: {
    noRelationships: number,
    onlyMuscle: number,
    onlyEquipment: number,
    both: number
  },
  sampleNoRelationships: Array<{
    title: string,
    id: Id<"exercises">
  }>
}
```

## Type Definitions

### Core Types

```typescript
type Exercise = {
  _id: Id<"exercises">,
  title: string,
  url?: string,
  description?: string,
  source: string,
  exerciseType: ExerciseType,
  _creationTime: number
}

type ExerciseType =
  | "Weight Reps"
  | "Reps Only"
  | "Weighted Bodyweight"
  | "Assisted Bodyweight"
  | "Duration"
  | "Weight & Duration"
  | "Distance & Duration"
  | "Weight & Distance"

type MuscleRole = "target" | "lengthening" | "synergist" | "stabilizer"

type Equipment = {
  _id: Id<"equipment">,
  name: string,
  _creationTime: number
}
```

## Usage Examples

### Building a Workout

```typescript
// 1. Find all chest exercises
const chestMuscle = await ctx.runQuery(api.muscles.getMuscleByName, {
  name: "Pectoralis Major"
});

const chestExercises = await ctx.runQuery(api.exercises.getExercisesByMuscle, {
  muscleId: chestMuscle._id,
  role: "target"
});

// 2. Filter by available equipment
const dumbellEquipment = await ctx.runQuery(api.exercises.getAllEquipment)
  .then(equipment => equipment.find(e => e.name === "Dumbbell"));

const dumbellChestExercises = chestExercises.filter(async exercise => {
  const details = await ctx.runQuery(api.exercises.getExerciseDetails, {
    exerciseId: exercise._id
  });
  return details.equipment.some(e => e._id === dumbellEquipment._id);
});
```

### Exercise Search

```typescript
// Search with filters
const searchResults = await ctx.runQuery(api.exercises.searchExercises, {
  searchTerm: "bench",
  exerciseType: "Weight Reps"
});

// Get detailed information
const detailedResults = await Promise.all(
  searchResults.map(exercise =>
    ctx.runQuery(api.exercises.getExerciseDetails, {
      exerciseId: exercise._id
    })
  )
);
```

### Equipment-Based Filtering

```typescript
// Get all bodyweight exercises
const bodyweightEquipment = await ctx.runQuery(api.exercises.getAllEquipment)
  .then(equipment => equipment.find(e => e.name === "Bodyweight"));

const bodyweightExercises = await ctx.runQuery(api.exercises.getExercisesByEquipment, {
  equipmentId: bodyweightEquipment._id
});
```

## Error Handling

### Common Error Scenarios

1. **Exercise Not Found**
   ```typescript
   const exercise = await ctx.runQuery(api.exercises.getExerciseDetails, {
     exerciseId: "invalid_id"
   });
   // Returns: null
   ```

2. **Muscle Matching Errors** (during import)
   ```typescript
   const result = await ctx.runMutation(api.exercises.importExercise, {
     // ... other fields
     muscles: {
       target: ["Invalid Muscle Name"]
     }
   });
   // Returns: { exerciseId, errors: ["Muscle not found: Invalid Muscle Name"] }
   ```

3. **Equipment Not Found** (during import)
   ```typescript
   const result = await ctx.runMutation(api.exercises.importExercise, {
     // ... other fields
     equipmentNames: ["Invalid Equipment"]
   });
   // Returns: { exerciseId, errors: ["Equipment not found: Invalid Equipment"] }
   ```

### Best Practices

1. **Always check for null returns** when querying specific exercises
2. **Handle errors array** when importing exercises
3. **Use try-catch blocks** for mutation operations
4. **Validate equipment and muscle names** before importing