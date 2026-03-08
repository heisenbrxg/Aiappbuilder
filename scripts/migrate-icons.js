#!/usr/bin/env node
/**
 * Icon Migration Script - Lucide/react-icons → Phosphor
 * 
 * This script helps automate the migration from Lucide React and react-icons
 * to Phosphor icons by finding and replacing imports.
 * 
 * Usage: node scripts/migrate-icons.js [--dry-run] [--file path/to/file.tsx]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon mapping: Lucide/react-icons → Phosphor
const ICON_MAPPING = {
  // Lucide → Phosphor
  'Menu': 'List',
  'X': 'X',
  'Search': 'MagnifyingGlass',
  'Settings': 'Gear',
  'User': 'User',
  'LogOut': 'SignOut',
  'LogIn': 'SignIn',
  'ChevronRight': 'CaretRight',
  'ChevronLeft': 'CaretLeft',
  'ChevronDown': 'CaretDown',
  'ChevronUp': 'CaretUp',
  'ArrowRight': 'ArrowRight',
  'ArrowLeft': 'ArrowLeft',
  'Plus': 'Plus',
  'Minus': 'Minus',
  'Check': 'Check',
  'CheckCircle': 'CheckCircle',
  'AlertCircle': 'WarningCircle',
  'AlertTriangle': 'Warning',
  'Info': 'Info',
  'XCircle': 'XCircle',
  'Send': 'PaperPlaneRight',
  'Mail': 'Envelope',
  'Phone': 'Phone',
  'MessageSquare': 'ChatCircle',
  'Bell': 'Bell',
  'BellOff': 'BellSlash',
  'Share2': 'ShareNetwork',
  'FileText': 'FileText',
  'File': 'File',
  'Folder': 'Folder',
  'FolderOpen': 'FolderOpen',
  'Download': 'Download',
  'Upload': 'Upload',
  'Copy': 'Copy',
  'Trash2': 'Trash',
  'Edit': 'PencilSimple',
  'Save': 'FloppyDisk',
  'ExternalLink': 'ArrowSquareOut',
  'Eye': 'Eye',
  'EyeOff': 'EyeClosed',
  'Moon': 'Moon',
  'Sun': 'Sun',
  'Loader2': 'CircleNotch',
  'Code': 'Code',
  'Terminal': 'Terminal',
  'Database': 'Database',
  'Server': 'CloudCheck',
  'Cloud': 'Cloud',
  'Cpu': 'Cpu',
  'HardDrive': 'HardDrive',
  'Wifi': 'WifiHigh',
  'WifiOff': 'WifiSlash',
  'Lock': 'Lock',
  'Unlock': 'LockOpen',
  'Key': 'Key',
  'Shield': 'Shield',
  'ShieldCheck': 'ShieldCheck',
  'GitBranch': 'GitBranch',
  'DollarSign': 'CurrencyDollar',
  'TrendingUp': 'TrendUp',
  'TrendingDown': 'TrendDown',
  'BarChart': 'ChartBar',
  'PieChart': 'ChartPie',
  'LineChart': 'ChartLine',
  'BarChart3': 'ChartBarHorizontal',
  'Activity': 'Pulse',
  'Coins': 'Coins',
  'Wallet': 'Wallet',
  'ShoppingCart': 'ShoppingCart',
  'Store': 'Storefront',
  'Linkedin': 'LinkedinLogo',
  'Github': 'GithubLogo',
  'Zap': 'Lightning',
  'Sparkles': 'Sparkle',
  'Rocket': 'Rocket',
  'Brain': 'Brain',
  'Wand2': 'MagicWand',
  'Star': 'Star',
  'Heart': 'Heart',
  'ThumbsUp': 'ThumbsUp',
  'Globe': 'Globe',
  'Globe2': 'GlobeHemisphereWest',
  'MapPin': 'MapPin',
  'Calendar': 'Calendar',
  'Clock': 'Clock',
  'Building': 'Buildings',
  'Users': 'Users',
  'Home': 'House',
  'Cookie': 'Cookie',
  'Lightbulb': 'Lightbulb',
  'ToggleLeft': 'ToggleLeft',
  'ToggleRight': 'ToggleRight',
  'Scale': 'Scales',
  'Gavel': 'Gavel',
  'Package': 'Package',
  'Crown': 'Crown',
  'Smartphone': 'DeviceMobile',
  'MoreVertical': 'DotsThreeVertical',
  'MoreHorizontal': 'DotsThree',
  'Grid': 'GridFour',
  'List': 'ListBullets',
  'Maximize2': 'ArrowsOut',
  'Minimize2': 'ArrowsIn',
  'Image': 'Image',
  'Video': 'Video',
  'Mic': 'Microphone',
  'MicOff': 'MicrophoneSlash',
  'Volume2': 'SpeakerHigh',
  'VolumeX': 'SpeakerSlash',
  'BookOpen': 'BookOpen',
  'Play': 'Play',
  'Pause': 'Pause',
  'RotateCcw': 'ArrowClockwise',
};

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const fileArg = args.find(arg => arg.startsWith('--file='));
const targetFile = fileArg ? fileArg.split('=')[1] : null;

console.log('🔄 Icon Migration Tool');
console.log('='.repeat(50));
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
if (targetFile) {
  console.log(`Target: ${targetFile}`);
} else {
  console.log('Target: All files in app/');
}
console.log('='.repeat(50));
console.log('');

/**
 * Get all files that import from lucide-react or react-icons
 */
function getFilesToMigrate() {
  if (targetFile) {
    return [targetFile];
  }

  const appDir = path.join(process.cwd(), 'app');
  
  // Find all files with lucide-react imports
  let files = [];
  try {
    const result = execSync(
      `grep -rl "from 'lucide-react'" ${appDir}`,
      { encoding: 'utf-8' }
    );
    files = result.trim().split('\n').filter(Boolean);
  } catch (error) {
    // No files found
  }

  // Find all files with react-icons imports
  try {
    const result = execSync(
      `grep -rl "from 'react-icons" ${appDir}`,
      { encoding: 'utf-8' }
    );
    const reactIconFiles = result.trim().split('\n').filter(Boolean);
    files = [...new Set([...files, ...reactIconFiles])];
  } catch (error) {
    // No files found
  }

  return files;
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
  console.log(`\n📄 Processing: ${path.relative(process.cwd(), filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let changeCount = 0;

  // Step 1: Find lucide-react imports
  const lucideImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
  const lucideMatches = [...content.matchAll(lucideImportRegex)];

  if (lucideMatches.length > 0) {
    lucideMatches.forEach(match => {
      const fullMatch = match[0];
      const icons = match[1].split(',').map(i => i.trim());
      
      // Map icons
      const mappedIcons = icons.map(icon => {
        // Handle "X as XIcon" pattern
        const parts = icon.split(' as ');
        const iconName = parts[0].trim();
        const alias = parts[1] ? ` as ${parts[1].trim()}` : '';
        
        const phosphorIcon = ICON_MAPPING[iconName] || iconName;
        
        if (phosphorIcon !== iconName) {
          console.log(`  ✓ ${iconName} → ${phosphorIcon}${alias}`);
          changeCount++;
        }
        
        return phosphorIcon + alias;
      });

      // Replace import
      const newImport = `import { ${mappedIcons.join(', ')} } from '~/components/ui/icons';`;
      content = content.replace(fullMatch, newImport);
      modified = true;
    });
  }

  // Step 2: Find react-icons imports
  const reactIconsRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react-icons\/\w+['"];?/g;
  const reactIconsMatches = [...content.matchAll(reactIconsRegex)];

  if (reactIconsMatches.length > 0) {
    console.log(`  ⚠️  Found react-icons import - needs manual review`);
    changeCount++;
    // Could add automatic mapping here if needed
  }

  // Step 3: Update icon usage in JSX (if needed)
  // Lucide and Phosphor both use 'size' prop, so no changes needed usually

  // Write changes
  if (modified && !isDryRun) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Saved ${changeCount} changes`);
  } else if (modified && isDryRun) {
    console.log(`  📋 Would save ${changeCount} changes (dry run)`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }

  return { modified, changeCount };
}

/**
 * Main execution
 */
async function main() {
  const files = getFilesToMigrate();
  
  if (files.length === 0) {
    console.log('✅ No files found with lucide-react or react-icons imports!');
    return;
  }

  console.log(`Found ${files.length} files to migrate\n`);

  let totalChanges = 0;
  let filesModified = 0;

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }

    const result = migrateFile(file);
    if (result.modified) {
      filesModified++;
      totalChanges += result.changeCount;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Migration Summary');
  console.log('='.repeat(50));
  console.log(`Files processed: ${files.length}`);
  console.log(`Files modified: ${filesModified}`);
  console.log(`Total changes: ${totalChanges}`);
  
  if (isDryRun) {
    console.log('\n⚠️  This was a DRY RUN - no files were modified');
    console.log('Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Review the changes: git diff');
    console.log('2. Test the application: pnpm dev');
    console.log('3. Check for any visual regressions');
    console.log('4. Update package.json to remove lucide-react and react-icons');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
