# Fitness Workout Tracker 💪

A comprehensive React Native fitness application with an extensive exercise database, built with Expo and Convex.

## Features

- **1,144+ Exercises**: Comprehensive exercise database with detailed metadata
- **Smart Filtering**: Filter exercises by muscle groups, equipment, and exercise type
- **Muscle Mapping**: Visual muscle selection with anatomical diagrams
- **Equipment Management**: Track and filter by 34+ equipment types
- **Real-time Backend**: Powered by Convex for instant data synchronization
- **Cross-platform**: Works on iOS, Android, and Web

## Exercise Database

This project includes a production-ready exercise database featuring:
- **1,144 unique exercises** with detailed instructions
- **34 equipment types** (dumbbells, barbells, bodyweight, etc.)
- **46+ muscle groups** with anatomical classifications
- **4 muscle relationship types** (target, lengthening, synergist, stabilizer)
- **8 exercise measurement types** (weight reps, duration, distance, etc.)

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 18+
- [Convex](https://www.convex.dev) account for backend
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd workout-importer-v2
   bun install
   ```

2. **Set up Convex backend**
   ```bash
   bun convex dev
   # Follow the prompts to set up your Convex deployment
   ```

3. **Set up exercise database**
   ```bash
   # Seed equipment data
   bun convex run seedEquipment:seedEquipment

   # Import exercise data (optional - if you have the CSV file)
   bun scripts/import-exercises.ts data/muscle_and_motion_exercices.csv
   ```

4. **Start the development server**
   ```bash
   bun start
   ```

5. **Run on your device**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web
   - Scan QR code for physical device

## Development Commands

```bash
bun start                   # Start Expo development server
bun convex:dev             # Start Convex backend in development mode
bun android                # Run on Android emulator/device
bun ios                    # Run on iOS simulator/device
bun web                    # Run web version
bun lint                   # Run ESLint
bun prebuild               # Generate native code (when needed)
```

## Exercise Database API

### Quick Examples

```typescript
// Get all exercises
const exercises = await ctx.runQuery(api.exercises.getAllExercises);

// Find chest exercises
const chestExercises = await ctx.runQuery(api.exercises.getExercisesByMuscle, {
  muscleId: pectoralisMajorId,
  role: "target"
});

// Filter by equipment
const dumbellExercises = await ctx.runQuery(api.exercises.getExercisesByEquipment, {
  equipmentId: dumbellId
});

// Search exercises
const searchResults = await ctx.runQuery(api.exercises.searchExercises, {
  searchTerm: "bench press"
});

// Get exercise details with all relationships
const exercise = await ctx.runQuery(api.exercises.getExerciseDetails, {
  exerciseId: exerciseId
});
```

## Documentation

- **[📋 Exercise Setup Guide](./EXERCISE_SETUP.md)** - Complete production setup and deployment guide
- **[🏗️ Architecture Documentation](./docs/EXERCISE_ARCHITECTURE.md)** - Technical architecture and database design
- **[📚 API Reference](./docs/API_REFERENCE.md)** - Complete API documentation with examples

## Tech Stack

- **Frontend**: React Native 0.79.5 + Expo SDK 53
- **Backend**: Convex (real-time database with authentication)
- **Routing**: Expo Router (file-based routing in `src/app/`)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Jotai
- **Authentication**: Convex Auth with OAuth support
- **Package Manager**: Bun
- **TypeScript**: Strict mode with path aliases

## Project Structure

```
src/
├── app/           # Expo Router pages (file-based routing)
├── assets/        # Images, fonts, and static assets
└── global.css     # Global Tailwind styles

convex/            # Backend schema, functions, and auth
├── schema.ts      # Database schema with exercise tables
├── exercises.ts   # Exercise-related queries and mutations
├── auth.ts        # Authentication configuration
└── ...

data/              # Exercise and muscle data files
scripts/           # Import and maintenance scripts
docs/              # Documentation
```

## Database Schema

The exercise database uses a normalized relational structure:

```
exercises ──────┐
│               │
├── exerciseEquipment ── equipment
│               │
└── exerciseMuscles ──── muscles
```

- **exercises**: Core exercise data (title, description, type, etc.)
- **equipment**: Normalized equipment types (34 predefined types)
- **exerciseEquipment**: Many-to-many relationship between exercises and equipment
- **exerciseMuscles**: Many-to-many relationship with role classification
- **muscles**: Existing muscle data with anatomical classifications

## Environment Setup

### For Development

Create a `.env.local` file:
```bash
CONVEX_DEPLOYMENT=<your-deployment-name>
EXPO_PUBLIC_CONVEX_URL=<your-convex-url>
```

### For Production

Set environment variables in your deployment platform:
- `CONVEX_DEPLOYMENT`
- `EXPO_PUBLIC_CONVEX_URL`

## Import Exercise Data

If you have exercise data in CSV format:

```bash
# Import from CSV file
bun scripts/import-exercises.ts path/to/exercises.csv

# Check import results
bun convex run exercises:analyzeExerciseRelationships
```

CSV Format: `title;exercise_path;url;target_muscles;lengthening_muscles;synergist_muscles;stabilizer_muscles;description;equipment;exercise_type`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Data Sources

Exercise data sourced from:
- Muscle & Motion (muscleandmotion.com)
- Anatomical muscle classifications
- Equipment categorization

## License

[Your License Here]

## Learn More

- [Convex Documentation](https://docs.convex.dev) - Learn about the backend platform
- [Expo Documentation](https://docs.expo.dev) - Learn about the mobile framework
- [React Native Documentation](https://reactnative.dev/docs) - Learn about React Native
- [NativeWind Documentation](https://www.nativewind.dev) - Learn about styling with Tailwind CSS