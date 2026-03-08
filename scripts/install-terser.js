#!/usr/bin/env node
/**
 * Install Terser for production builds
 * Run this script to install the required dependencies for optimized builds
 */

const { execSync } = require('child_process');

console.log('📦 Installing performance optimization dependencies...\n');

const packages = [
  'terser',  // For aggressive JavaScript minification
  'sharp',   // For image optimization
];

try {
  execSync(`pnpm add -D ${packages.join(' ')}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  
  console.log('\n✅ Performance optimization dependencies installed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: node scripts/optimize-images.js');
  console.log('2. Run: pnpm build');
  console.log('3. Check bundle size in dist/stats.html\n');
} catch (error) {
  console.error('\n❌ Error installing dependencies:', error.message);
  process.exit(1);
}
