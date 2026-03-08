#!/usr/bin/env node
/**
 * Image Optimization Script
 * 
 * This script optimizes all images in the public directory:
 * 1. Converts PNG to WebP (50-80% smaller)
 * 2. Generates multiple sizes for responsive images
 * 3. Creates blur-up placeholders
 * 4. Preserves original files with .original extension
 * 
 * Usage: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const AVATAR_DIR = path.join(PUBLIC_DIR, 'avatars');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

// Configuration for different image types
const IMAGE_CONFIGS = {
  avatar: {
    sizes: [44, 88, 132], // 1x, 2x, 3x for 44px display size
    quality: 85,
    format: 'webp',
  },
  logo: {
    sizes: [67, 134, 201], // 1x, 2x, 3x for 67px display size
    quality: 90,
    format: 'webp',
  },
  thumbnail: {
    sizes: [384, 768, 1152], // 1x, 2x, 3x for 384px display size
    quality: 80,
    format: 'webp',
  },
  og: {
    sizes: [1200], // Open Graph images
    quality: 85,
    format: 'webp',
  },
};

/**
 * Get all image files in a directory
 */
async function getImageFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter(file => 
      /\.(png|jpg|jpeg)$/i.test(file) && 
      !file.endsWith('.original.png') &&
      !file.endsWith('.original.jpg')
    );
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
    return [];
  }
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath, outputPath, width, quality, format) {
  try {
    await sharp(inputPath)
      .resize(width, width, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat(format, { quality })
      .toFile(outputPath);
    
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    const savings = Math.round((1 - outputStats.size / inputStats.size) * 100);
    
    console.log(`  ✓ ${path.basename(outputPath)} (${width}px) - ${savings}% smaller`);
  } catch (error) {
    console.error(`  ✗ Error optimizing ${path.basename(inputPath)}:`, error.message);
  }
}

/**
 * Generate blur placeholder
 */
async function generateBlurPlaceholder(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .resize(20, 20, { fit: 'cover' })
      .blur(5)
      .toFormat('webp', { quality: 50 })
      .toFile(outputPath);
    
    console.log(`  ✓ Blur placeholder generated`);
  } catch (error) {
    console.error(`  ✗ Error generating blur placeholder:`, error.message);
  }
}

/**
 * Process images in a directory
 */
async function processDirectory(dir, imageType) {
  console.log(`\n📁 Processing ${imageType} images in ${dir}...`);
  
  const files = await getImageFiles(dir);
  
  if (files.length === 0) {
    console.log('  No images to process');
    return;
  }

  const config = IMAGE_CONFIGS[imageType];

  for (const file of files) {
    const inputPath = path.join(dir, file);
    const baseName = path.basename(file, path.extname(file));
    
    console.log(`\n🖼️  Processing ${file}...`);

    // Backup original file
    const originalPath = path.join(dir, `${baseName}.original${path.extname(file)}`);
    try {
      await fs.access(originalPath);
    } catch {
      await fs.copyFile(inputPath, originalPath);
      console.log(`  ✓ Original backed up`);
    }

    // Generate optimized versions
    for (const size of config.sizes) {
      const outputFileName = config.sizes.length > 1 
        ? `${baseName}-${size}w.${config.format}`
        : `${baseName}.${config.format}`;
      const outputPath = path.join(dir, outputFileName);
      
      await optimizeImage(inputPath, outputPath, size, config.quality, config.format);
    }

    // Generate blur placeholder for larger images
    if (imageType !== 'avatar') {
      const blurPath = path.join(dir, `${baseName}-blur.webp`);
      await generateBlurPlaceholder(inputPath, blurPath);
    }

    // Replace original PNG with optimized WebP (smallest size)
    const mainWebpPath = path.join(dir, `${baseName}.${config.format}`);
    try {
      await fs.access(mainWebpPath);
      // Optional: Remove original PNG to save space (commented out for safety)
      // await fs.unlink(inputPath);
      // console.log(`  ✓ Original PNG removed (backed up as .original)`);
    } catch {
      console.log(`  ⚠ Main WebP file not created`);
    }
  }
}

/**
 * Generate srcset metadata
 */
async function generateSrcSetMetadata() {
  const metadata = {
    avatars: {},
    logos: {},
    images: {},
  };

  // Process avatars
  const avatarFiles = await getImageFiles(AVATAR_DIR);
  for (const file of avatarFiles) {
    const baseName = path.basename(file, path.extname(file));
    if (!baseName.includes('-') && !baseName.includes('original')) {
      metadata.avatars[baseName] = {
        src: `/avatars/${baseName}.webp`,
        srcset: IMAGE_CONFIGS.avatar.sizes
          .map(size => `/avatars/${baseName}-${size}w.webp ${size}w`)
          .join(', '),
        sizes: '44px',
      };
    }
  }

  // Save metadata
  const metadataPath = path.join(PUBLIC_DIR, 'image-metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n✅ Image metadata saved to ${metadataPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting image optimization...\n');

  // Process each directory
  await processDirectory(AVATAR_DIR, 'avatar');
  await processDirectory(path.join(PUBLIC_DIR, 'images'), 'thumbnail');
  
  // Process logo separately
  const logoFile = 'logo-white.png';
  const logoPath = path.join(PUBLIC_DIR, logoFile);
  try {
    await fs.access(logoPath);
    await processDirectory(PUBLIC_DIR, 'logo');
  } catch {
    console.log('\n⚠️  Logo file not found, skipping...');
  }

  // Generate metadata
  await generateSrcSetMetadata();

  console.log('\n✨ Image optimization complete!\n');
  console.log('Next steps:');
  console.log('1. Update components to use optimized WebP images');
  console.log('2. Add srcset attributes for responsive images');
  console.log('3. Test images in browser to ensure quality is acceptable');
  console.log('4. Consider removing original PNG files to save space (after backup!)\n');
}

// Run the script
main().catch(console.error);
