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
    .split(/[;,]/)
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
    const seedResult = await client.mutation(api.seedEquipment.seedEquipment);
    console.log(`✅ ${seedResult.message}`);

    console.log("📖 Parsing CSV file...");
    const csvData = await parseCSV(csvFilePath);
    console.log(`📋 Found ${csvData.length} exercises to import`);

    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        if (!row.title || row.title.trim() === '') {
          errors.push(`Row ${i + 1}: Missing title`);
          skipped++;
          continue;
        }

        const muscles = {
          target: parseMuscles(row.target_muscles),
          lengthening: parseMuscles(row.lengthening_muscles),
          synergist: parseMuscles(row.synergist_muscles),
          stabilizer: parseMuscles(row.stabilizer_muscles),
        };

        const equipment = parseEquipment(row.equipment);

        const result = await client.mutation(api.exercises.importExercise, {
          title: row.title.trim(),
          url: row.url && row.url.trim() !== '' ? row.url.trim() : undefined,
          description: row.description && row.description.trim() !== '' ? row.description.trim() : undefined,
          exerciseType: row.exercise_type || "Weight Reps",
          equipmentNames: equipment,
          muscles
        });

        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            errors.push(`${row.title}: ${error}`);
          });
        }

        imported++;

        if (imported % 10 === 0) {
          console.log(`📝 Imported ${imported}/${csvData.length} exercises...`);
        }

      } catch (error) {
        errors.push(`${row.title}: ${error instanceof Error ? error.message : String(error)}`);
        skipped++;
      }
    }

    const errorLogPath = path.join(process.cwd(), 'import-errors.log');

    if (errors.length > 0) {
      const errorLog = errors.map(error => `[${new Date().toISOString()}] ${error}`).join('\n');
      fs.writeFileSync(errorLogPath, errorLog);
      console.log(`⚠️  ${errors.length} errors logged to: ${errorLogPath}`);
    }

    console.log("\n📊 Import Summary:");
    console.log(`✅ Successfully imported: ${imported} exercises`);
    console.log(`⚠️  Skipped/Errors: ${skipped} exercises`);
    console.log(`📝 Total errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n🔍 Review errors in: ${errorLogPath}`);
    }

  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);