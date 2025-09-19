# Exercise Database Setup Guide

This guide explains how to set up and manage the exercise database for your workout tracker application.

## 📋 Overview

The exercise database contains:
- **1,144 unique exercises** with comprehensive metadata
- **34 equipment types** (dumbbells, barbells, bodyweight, etc.)
- **46+ muscle groups** with anatomical classifications
- **4 relationship types** between exercises and muscles (target, lengthening, synergist, stabilizer)

## 🏗️ Database Architecture

### Core Tables

```typescript
// Exercises - Core exercise information
exercises: {
  title: string,              // "Bench Press (Barbell)"
  url?: string,               // External reference URL
  description?: string,       // Exercise instructions
  source: string,             // "muscleandmotion.com"
  exerciseType: ExerciseType, // How the exercise is measured
  _creationTime: number       // Auto-generated timestamp
}

// Equipment - Normalized equipment types
equipment: {
  name: string               // "Dumbbell", "Barbell", etc.
}

// Junction Tables for Many-to-Many Relationships
exerciseEquipment: {
  exerciseId: Id<"exercises">,
  equipmentId: Id<"equipment">
}

exerciseMuscles: {
  exerciseId: Id<"exercises">,
  muscleId: Id<"muscles">,
  role: "target" | "lengthening" | "synergist" | "stabilizer"
}
```

### Exercise Types

The system supports 8 exercise measurement types:
- `Weight Reps` - Traditional weight training
- `Reps Only` - Bodyweight exercises
- `Weighted Bodyweight` - Bodyweight + added weight
- `Assisted Bodyweight` - Assisted bodyweight movements
- `Duration` - Time-based exercises (planks, stretches)
- `Weight & Duration` - Weight + time
- `Distance & Duration` - Cardio exercises
- `Weight & Distance` - Weighted carrying exercises

## 🚀 Production Setup

### Prerequisites

1. **Bun runtime** (preferred package manager)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Convex account** and deployment
   ```bash
   npm install -g convex
   convex dev  # Follow setup instructions
   ```

### Initial Setup

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Deploy Convex schema**
   ```bash
   bun convex dev
   # This deploys the schema with all tables and indexes
   ```

3. **Seed equipment data**
   ```bash
   bun convex run seedEquipment:seedEquipment
   ```

4. **Import muscle data** (if not already done)
   ```bash
   # Muscles should be imported via your existing muscle import process
   bun convex import --table muscles path/to/muscles.jsonl
   ```

5. **Import exercise data**
   ```bash
   bun scripts/import-exercises.ts data/muscle_and_motion_exercices.csv
   ```

### Expected Results

After successful import:
- ✅ **34 equipment types** seeded
- ✅ **1,144 exercises** imported
- ✅ **~2,715 relationships** created (muscles + equipment)
- ✅ **Zero duplicates**

## 📊 Data Validation

### Check Import Success
```bash
# Verify exercise count
bun convex run exercises:getAllExercises | head -1

# Check for duplicates (should return 0)
bun convex run exercises:findDuplicateExercises

# Analyze relationships
bun convex run exercises:analyzeExerciseRelationships
```

### Query Examples
```typescript
// Get all dumbbell exercises
const dumbellId = await ctx.db
  .query("equipment")
  .withIndex("by_name", q => q.eq("name", "Dumbbell"))
  .first();

const exercises = await ctx.db
  .query("exerciseEquipment")
  .withIndex("by_equipment", q => q.eq("equipmentId", dumbellId._id))
  .collect();

// Get all exercises targeting chest
const chestExercises = await ctx.db
  .query("exerciseMuscles")
  .withIndex("by_muscle", q =>
    q.eq("muscleId", pectoralisId).eq("role", "target")
  )
  .collect();
```

## 🔄 Data Updates

### Adding New Exercises

To add new exercises, use the import script with a properly formatted CSV:

```csv
title;exercise_path;url;target_muscles;lengthening_muscles;synergist_muscles;stabilizer_muscles;description;equipment;exercise_type
New Exercise;/path;https://example.com;Pectoralis Major;;Triceps Brachii;Rectus Abdominis;Description;Dumbbell;Weight Reps
```

### Adding New Equipment

1. Update the `EQUIPMENT_LIST` in `convex/seedEquipment.ts`
2. Run the seeding command:
   ```bash
   bun convex run seedEquipment:seedEquipment
   ```

### Adding New Muscles

Muscles should be added through your existing muscle management system. Ensure the `name` field matches the format expected by the exercise import (Title Case).

## 🔍 Troubleshooting

### Common Issues

1. **Muscle Not Found Errors**
   - Check muscle names in CSV match database exactly (case-sensitive)
   - Review `import-errors.log` for unmatched muscle names
   - Update muscle mappings in `exerciseHelpers.ts` if needed

2. **Equipment Not Found**
   - Ensure equipment is seeded before importing exercises
   - Check equipment names match the predefined list

3. **Import Fails**
   - Verify CONVEX_URL environment variable is set
   - Ensure Convex deployment is running (`bun convex dev`)
   - Check CSV format matches expected columns

### Performance Notes

- **Import time**: ~10-15 minutes for full dataset (1,148 exercises)
- **Relationship creation**: ~3-5 seconds per exercise with relationships
- **Memory usage**: Minimal - processes one exercise at a time

## 📈 Monitoring

### Health Check Queries

```bash
# Exercise count
bun convex run exercises:getAllExercises | grep -o '_id' | wc -l

# Equipment count
bun convex run exercises:getAllEquipment | grep -o '_id' | wc -l

# Relationship health
bun convex run exercises:analyzeExerciseRelationships
```

### Expected Metrics
- **Total exercises**: 1,144
- **Exercises with relationships**: ~863 (75%)
- **Equipment relationships**: ~921
- **Muscle relationships**: ~1,794

## 🛡️ Data Safety

The exercise database includes several safety measures:
- **Relationship preservation**: Junction tables ensure data integrity
- **Duplicate prevention**: Unique constraints on exercise titles
- **Error logging**: Comprehensive logs for failed imports
- **Atomic operations**: All-or-nothing transaction safety

## 📚 API Reference

Key functions available for exercise management:

```typescript
// Queries
- exercises:getAllExercises
- exercises:getExercisesByMuscle
- exercises:getExercisesByEquipment
- exercises:getExercisesByType
- exercises:getExerciseDetails
- exercises:searchExercises

// Mutations
- exercises:importExercise
- exercises:linkExerciseToMuscle
- seedEquipment:seedEquipment
```

---

## 🎯 Next Steps

After setup, you can:
1. Build workout creation UI using exercise queries
2. Implement exercise filtering by muscle groups and equipment
3. Create exercise recommendation algorithms
4. Add user-specific exercise preferences and tracking