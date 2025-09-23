#!/usr/bin/env bun

import { ConvexClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";
import fs from 'fs';

const CONVEX_URL = process.env.CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL or EXPO_PUBLIC_CONVEX_URL environment variable is required");
  process.exit(1);
}

const client = new ConvexClient(CONVEX_URL);

async function main() {
  try {
    // Get all current muscles from database
    const muscles = await client.query(api.muscles.list);

    console.log(`📊 Found ${muscles.length} muscles in database`);

    // Create a set of existing muscle names
    const existingNames = new Set(muscles.map(m => m.name));

    // Read our import file
    const importData = fs.readFileSync('data/muscles_import.jsonl', 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    console.log(`📝 Found ${importData.length} muscles in import file`);

    // Find only new muscles
    const newMuscles = importData.filter(muscle => !existingNames.has(muscle.name));

    console.log(`🆕 Found ${newMuscles.length} new muscles to add:`);
    newMuscles.forEach(m => console.log(`  - ${m.name}`));

    // Write only new muscles to a file
    const newMusclesContent = newMuscles.map(m => JSON.stringify(m)).join('\n');
    fs.writeFileSync('new_muscles_only.jsonl', newMusclesContent);

    console.log(`\n✅ Created new_muscles_only.jsonl with ${newMuscles.length} muscles`);
    console.log(`\n🚀 Safe import command:`);
    console.log(`bun convex import --table muscles new_muscles_only.jsonl --append`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main().catch(console.error);