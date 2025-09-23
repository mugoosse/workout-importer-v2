#!/usr/bin/env bun
/**
 * Exercise Data Importer
 *
 * This script imports exercise data from a CSV file into the Convex database.
 * It seeds equipment data, parses exercise information, and creates all necessary
 * relationships between exercises, muscles, and equipment.
 *
 * Usage: bun scripts/import-exercises.ts <csv-file-path>
 *
 * CSV Format: title;exercise_path;url;target_muscles;lengthening_muscles;synergist_muscles;stabilizer_muscles;description;equipment;exercise_type
 */

import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

interface CSVRow {
  title: string;
  exercise_path: string;
  url: string;
  target_muscles: string;
  lengthening_muscles: string;
  synergist_muscles: string;
  stabilizer_muscles: string;
  description: string;
  equipment: string;
  exercise_type: string;
}

const CONVEX_URL = process.env.CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL or EXPO_PUBLIC_CONVEX_URL environment variable is required");
  process.exit(1);
}

const client = new ConvexClient(CONVEX_URL);

function parseCSV(filePath: string): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const records: CSVRow[] = [];
    const parser = parse({
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', function() {
      let record;
      while (record = parser.read()) {
        records.push(record);
      }
    });

    parser.on('error', function(err) {
      reject(err);
    });

    parser.on('end', function() {
      resolve(records);
    });

    fs.createReadStream(filePath).pipe(parser);
  });
}

function parseMuscles(muscleString: string): string[] {
  if (!muscleString || muscleString.trim() === '') return [];

  return muscleString
    .split(';')
    .map(m => m.trim())
    .filter(m => m.length > 0);
}

function parseEquipment(equipmentString: string): string[] {
  if (!equipmentString || equipmentString.trim() === '') return [];

  return equipmentString
    .split(/[;,]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
}

async function main() {
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error("❌ Usage: bun scripts/import-exercises.ts <csv-file-path>");
    process.exit(1);
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`);
    process.exit(1);
  }

  console.log(`📊 Starting import from: ${csvFilePath}`);
  console.log(`🔗 Using Convex URL: ${CONVEX_URL}`);

  try {
    console.log("🌱 Seeding equipment...");
    const seedResult = await client.mutation(api.seedEquipment.seedEquipment, {});
    console.log(`✅ ${seedResult.message}`);

    console.log("📖 Parsing CSV file...");
    const csvData = await parseCSV(csvFilePath);
    console.log(`📋 Found ${csvData.length} exercises to import`);

    // Transform CSV data to the format expected by the bulk import
    const exercises = csvData
      .filter(row => row.title && row.title.trim() !== '')
      .map(row => ({
        title: row.title.trim(),
        url: row.url && row.url.trim() !== '' ? row.url.trim() : undefined,
        description: row.description && row.description.trim() !== '' ? row.description.trim() : undefined,
        exerciseType: row.exercise_type || "Weight Reps",
        equipmentNames: parseEquipment(row.equipment),
        muscles: {
          target: parseMuscles(row.target_muscles),
          lengthening: parseMuscles(row.lengthening_muscles),
          synergist: parseMuscles(row.synergist_muscles),
          stabilizer: parseMuscles(row.stabilizer_muscles),
        }
      }));

    console.log(`📝 Processed ${exercises.length} valid exercises`);

    // STEP 1: Preview the import
    console.log("\n📊 Analyzing import data...");
    const preview = await client.query(api.exercises.previewExerciseImport, { exercises });

    console.log("\n=== IMPORT PREVIEW ===");
    console.log(`📋 Total exercises: ${preview.totalExercises}`);
    console.log(`✅ Will create: ${preview.newExercises.length} new exercises`);
    console.log(`⏭️  Will skip: ${preview.existingExercises.length} existing exercises`);

    console.log(`\n🦵 Muscle mappings:`);
    console.log(`  📊 Total muscle references: ${preview.muscleStats.total}`);
    console.log(`  ✅ Successfully mapped: ${preview.muscleStats.mapped}`);
    console.log(`  ❌ Failed to map: ${preview.muscleStats.unmapped}`);

    console.log(`\n🏋️  Equipment mappings:`);
    console.log(`  📊 Total equipment references: ${preview.equipmentStats.total}`);
    console.log(`  ✅ Successfully mapped: ${preview.equipmentStats.mapped}`);
    console.log(`  ❌ Failed to map: ${preview.equipmentStats.unmapped}`);

    if (preview.unmappedMuscles.length > 0) {
      console.log("\n⚠️  UNMAPPED MUSCLES (will be logged as errors):");
      preview.unmappedMuscles.slice(0, 20).forEach(muscle => {
        console.log(`  - ${muscle}`);
      });
      if (preview.unmappedMuscles.length > 20) {
        console.log(`  ... and ${preview.unmappedMuscles.length - 20} more`);
      }
    }

    if (preview.unmappedEquipment.length > 0) {
      console.log("\n⚠️  UNMAPPED EQUIPMENT (will be logged as errors):");
      preview.unmappedEquipment.slice(0, 10).forEach(equipment => {
        console.log(`  - ${equipment}`);
      });
      if (preview.unmappedEquipment.length > 10) {
        console.log(`  ... and ${preview.unmappedEquipment.length - 10} more`);
      }
    }

    // STEP 2: Ask for confirmation (only in interactive mode)
    if (process.stdout.isTTY) {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('\n🚀 Proceed with bulk import? (y/n): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log("❌ Import cancelled by user");
        process.exit(0);
      }
    } else {
      console.log("\n🚀 Running in non-interactive mode, proceeding with import...");
    }

    // STEP 3: Execute bulk import
    console.log("\n🚀 Starting bulk import...");
    const result = await client.mutation(api.exercises.importExercisesBulk, { exercises });

    console.log("\n=== IMPORT RESULTS ===");
    console.log(`✅ Created: ${result.created} new exercises`);
    console.log(`⏭️  Skipped: ${result.skipped} existing exercises`);
    console.log(`🦵 Muscle relationships created: ${result.muscleRelationsCreated}`);
    console.log(`🏋️  Equipment relationships created: ${result.equipmentRelationsCreated}`);
    console.log(`❌ Errors: ${result.errors.length}`);

    // Log errors to file if any
    if (result.errors.length > 0) {
      const errorLogPath = path.join(process.cwd(), 'import-errors.log');
      const errorLog = result.errors.map(error => `[${new Date().toISOString()}] ${error}`).join('\n');
      fs.writeFileSync(errorLogPath, errorLog);
      console.log(`\n🔍 Detailed errors logged to: ${errorLogPath}`);

      // Show first few errors in console
      console.log("\n⚠️  First few errors:");
      result.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`  ... and ${result.errors.length - 5} more (see log file)`);
      }
    }

    console.log("\n🎉 Bulk import completed successfully!");

  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);