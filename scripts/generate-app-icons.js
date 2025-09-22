#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '../src/assets/images/muscle-trophy-logo.png');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/images');

const ICON_CONFIGS = [
  {
    name: 'icon.png',
    size: 1024,
    description: 'Main app icon for iOS and Android',
    optimize: { quality: 85, compressionLevel: 9 }
  },
  {
    name: 'adaptive-icon-foreground.png',
    size: 1024,
    description: 'Android adaptive icon foreground layer',
    optimize: { quality: 85, compressionLevel: 9 }
  },
  {
    name: 'splash-logo.png',
    size: 200,
    description: 'Splash screen logo',
    optimize: { quality: 90, compressionLevel: 9 }
  },
  {
    name: 'favicon.png',
    size: 48,
    description: 'Web favicon',
    optimize: { quality: 90, compressionLevel: 9 }
  }
];

async function generateIcons() {
  console.log('🎨 Starting icon generation from muscle-trophy-logo.png...\n');

  try {
    // Check if source file exists
    await fs.access(SOURCE_IMAGE);

    // Get source image metadata
    const metadata = await sharp(SOURCE_IMAGE).metadata();
    console.log(`📊 Source image: ${metadata.width}x${metadata.height}px, ${metadata.format.toUpperCase()}\n`);

    // Generate each icon variant
    for (const config of ICON_CONFIGS) {
      const outputPath = path.join(OUTPUT_DIR, config.name);

      console.log(`📱 Generating ${config.name} (${config.size}x${config.size}px)`);
      console.log(`   ${config.description}`);

      await sharp(SOURCE_IMAGE)
        .resize(config.size, config.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png(config.optimize)
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`   ✅ Generated successfully (${sizeKB} KB)\n`);
    }

    console.log('🎉 All icons generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update app.json with the new icon paths');
    console.log('   2. Delete old unused assets');
    console.log('   3. Run "bun prebuild --clean" to apply changes');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run the script
generateIcons();