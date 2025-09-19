# Exercise Data Architecture

## Overview

This document describes the technical architecture of the exercise database system, including schema design, data relationships, and implementation patterns.

## Schema Design

### Core Tables

#### `exercises`
Primary table storing exercise metadata.

```typescript
exercises: defineTable({
  title: v.string(),                    // Unique exercise name
  url: v.optional(v.string()),          // External reference URL
  description: v.optional(v.string()),  // Exercise instructions
  source: v.string(),                   // Data source identifier
  exerciseType: v.union(                // How exercise is measured/tracked
    v.literal("Weight Reps"),
    v.literal("Reps Only"),
    v.literal("Weighted Bodyweight"),
    v.literal("Assisted Bodyweight"),
    v.literal("Duration"),
    v.literal("Weight & Duration"),
    v.literal("Distance & Duration"),
    v.literal("Weight & Distance")
  ),
})
  .index("by_title", ["title"])          // Fast title lookups
  .index("by_type", ["exerciseType"])    // Filter by exercise type
  .searchIndex("search_exercises", {      // Full-text search
    searchField: "title",
    filterFields: ["source", "exerciseType"]
  })
```

#### `equipment`
Normalized equipment lookup table.

```typescript
equipment: defineTable({
  name: v.string(),                     // Equipment name (e.g., "Dumbbell")
})
  .index("by_name", ["name"])           // Fast equipment lookups
```

**Predefined Equipment Types:**
```
"Ab Wheel", "BOSU", "Barbell", "Battle Rope", "Bench", "Bodyweight",
"Box", "Cable", "Cable Bar", "Captain's Chair", "Dumbbell", "EZ Bar",
"Foam Roller", "GHD Machine", "Hurdle", "Kettlebell", "Landmine",
"Machine", "Medicine-Ball", "Mini Band", "Parallettes", "Plyo Box",
"Resistance Band", "Rings", "Roman Chair", "Sandbag", "Sliders",
"Smith Machine", "Stability Ball", "Straps", "T Bar", "Trap Bar",
"Weight Plate", "Weight Sled"
```

### Junction Tables (Many-to-Many Relationships)

#### `exerciseEquipment`
Links exercises to required equipment.

```typescript
exerciseEquipment: defineTable({
  exerciseId: v.id("exercises"),
  equipmentId: v.id("equipment"),
})
  .index("by_exercise", ["exerciseId"])    // Get equipment for exercise
  .index("by_equipment", ["equipmentId"]) // Get exercises for equipment
```

#### `exerciseMuscles`
Links exercises to muscles with role classification.

```typescript
exerciseMuscles: defineTable({
  exerciseId: v.id("exercises"),
  muscleId: v.id("muscles"),
  role: v.union(
    v.literal("target"),      // Primary muscles worked
    v.literal("lengthening"), // Muscles being stretched
    v.literal("synergist"),   // Assisting muscles
    v.literal("stabilizer")   // Stabilizing muscles
  ),
})
  .index("by_exercise", ["exerciseId", "role"])        // Get muscles for exercise by role
  .index("by_muscle", ["muscleId", "role"])            // Get exercises for muscle by role
  .index("by_exercise_and_muscle", ["exerciseId", "muscleId"]) // Prevent duplicates
```

## Data Relationships

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│  exercises  │──────▶│ exerciseEquipment│◀──────│  equipment  │
│             │       │                 │       │             │
│ • title     │       │ • exerciseId    │       │ • name      │
│ • url       │       │ • equipmentId   │       └─────────────┘
│ • desc      │       └─────────────────┘
│ • source    │
│ • type      │       ┌─────────────────┐       ┌─────────────┐
└─────────────┘──────▶│ exerciseMuscles │◀──────│   muscles   │
                      │                 │       │             │
                      │ • exerciseId    │       │ • name      │
                      │ • muscleId      │       │ • svgId     │
                      │ • role          │       │ • group     │
                      └─────────────────┘       └─────────────┘
```

### Relationship Cardinalities

- **Exercise ↔ Equipment**: Many-to-Many
  - One exercise can use multiple equipment types
  - One equipment type can be used in multiple exercises

- **Exercise ↔ Muscles**: Many-to-Many with Role
  - One exercise can work multiple muscles in different roles
  - One muscle can be worked by multiple exercises in different roles

## Query Patterns

### Common Query Operations

#### 1. Get Exercise Details with Relationships
```typescript
export const getExerciseDetails = query({
  args: { exerciseId: v.id("exercises") },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);

    const [muscleRels, equipmentRels] = await Promise.all([
      ctx.db.query("exerciseMuscles")
        .withIndex("by_exercise", q => q.eq("exerciseId", args.exerciseId))
        .collect(),
      ctx.db.query("exerciseEquipment")
        .withIndex("by_exercise", q => q.eq("exerciseId", args.exerciseId))
        .collect()
    ]);

    // Hydrate relationships...
  }
});
```

#### 2. Filter Exercises by Equipment
```typescript
export const getExercisesByEquipment = query({
  args: { equipmentId: v.id("equipment") },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("exerciseEquipment")
      .withIndex("by_equipment", q => q.eq("equipmentId", args.equipmentId))
      .collect();

    return await Promise.all(
      relationships.map(rel => ctx.db.get(rel.exerciseId))
    );
  }
});
```

#### 3. Filter Exercises by Muscle and Role
```typescript
export const getExercisesByMuscle = query({
  args: {
    muscleId: v.id("muscles"),
    role: v.optional(v.literal("target" | "lengthening" | "synergist" | "stabilizer"))
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("exerciseMuscles")
      .withIndex("by_muscle", q => {
        const base = q.eq("muscleId", args.muscleId);
        return args.role ? base.eq("role", args.role) : base;
      });

    const relationships = await query.collect();
    // Return exercises...
  }
});
```

## Data Import Pipeline

### Import Process Flow

```
CSV File → Parse → Validate → Transform → Insert → Link Relationships
```

### 1. CSV Parsing
```typescript
interface CSVRow {
  title: string;
  url: string;
  target_muscles: string;        // Semicolon-separated
  lengthening_muscles: string;   // Semicolon-separated
  synergist_muscles: string;     // Semicolon-separated
  stabilizer_muscles: string;    // Semicolon-separated
  description: string;
  equipment: string;             // Semicolon-separated
  exercise_type: string;
}
```

### 2. Data Transformation

#### Muscle Name Normalization
```typescript
export function normalizeMuscleName(name: string): string {
  const mappings = {
    "Deltoid": "Deltoids",
    "Abdominal Muscles": "Rectus Abdominis",
    // ... more mappings
  };

  let cleaned = name.trim().replace(/[,;].*$/, '');

  return mappings[cleaned] || cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

#### Equipment Parsing
```typescript
export function parseEquipment(equipment: string): string[] {
  return equipment
    .split(/[;,]/)
    .map(e => normalizeEquipmentName(e.trim()))
    .filter(e => e.length > 0);
}
```

### 3. Relationship Creation

For each exercise, the import process:
1. Creates the exercise record
2. Links to equipment (creates missing equipment records)
3. Links to muscles with appropriate roles
4. Logs any unmatched muscles for manual review

## Performance Considerations

### Indexing Strategy

1. **Primary Indexes**: Enable fast lookups by key fields
   - `exercises.by_title` - Exercise name lookups
   - `equipment.by_name` - Equipment name lookups

2. **Relationship Indexes**: Optimize junction table queries
   - `exerciseEquipment.by_exercise` - Get equipment for exercise
   - `exerciseEquipment.by_equipment` - Get exercises for equipment
   - `exerciseMuscles.by_exercise` - Get muscles for exercise
   - `exerciseMuscles.by_muscle` - Get exercises for muscle

3. **Composite Indexes**: Support complex filtering
   - `exerciseMuscles.by_exercise` includes role for filtering
   - `exerciseMuscles.by_muscle` includes role for filtering

### Query Optimization

1. **Batch Operations**: Use Promise.all for parallel relationship queries
2. **Index Usage**: Always query junction tables via indexes
3. **Selective Loading**: Only fetch needed relationship data
4. **Pagination**: Implement pagination for large result sets

## Data Validation

### Schema Validation

Convex provides runtime validation through the schema definition:
- Type safety for all fields
- Required vs optional field validation
- Enum validation for exerciseType and muscle roles

### Business Logic Validation

Additional validation in helper functions:
- Muscle name normalization and mapping
- Equipment name standardization
- Exercise type inference and validation

### Error Handling

1. **Import Errors**: Logged to file for manual review
2. **Missing References**: Graceful handling of unmatched muscles/equipment
3. **Duplicate Prevention**: Unique constraints on exercise titles

## Testing Strategy

### Unit Tests
- Normalization functions
- Parsing utilities
- Validation logic

### Integration Tests
- End-to-end import process
- Relationship integrity
- Query performance

### Data Quality Tests
- Duplicate detection
- Orphaned relationship detection
- Data completeness validation

## Future Enhancements

### Potential Schema Extensions

1. **Exercise Variations**
   ```typescript
   exerciseVariations: defineTable({
     baseExerciseId: v.id("exercises"),
     variationExerciseId: v.id("exercises"),
     variationType: v.string(), // "difficulty", "equipment", "angle"
   })
   ```

2. **Exercise Categories**
   ```typescript
   categories: defineTable({
     name: v.string(),
     parentId: v.optional(v.id("categories")),
   })

   exerciseCategories: defineTable({
     exerciseId: v.id("exercises"),
     categoryId: v.id("categories"),
   })
   ```

3. **Exercise Media**
   ```typescript
   exerciseMedia: defineTable({
     exerciseId: v.id("exercises"),
     type: v.union(v.literal("image"), v.literal("video")),
     url: v.string(),
     description: v.optional(v.string()),
   })
   ```

### Performance Optimizations

1. **Materialized Views**: Pre-computed popular exercise lists
2. **Caching**: Cache frequently accessed exercise details
3. **Search Enhancement**: Advanced full-text search capabilities
4. **Recommendation Engine**: ML-based exercise recommendations