import { codeToHtml, createHighlighter, bundledLanguages, isSpecialLang } from './prismAdapter';

// Example usage demonstrating the PrismJS adapter functionality

async function demonstrateAdapter() {
  console.log('🎨 PrismJS Adapter Demo');
  console.log('======================');

  // Show available bundled languages
  console.log('\n📦 Bundled Languages (sample):');
  console.log(bundledLanguages.slice(0, 5).join(', '), '...');

  // Check if languages are special
  console.log('\n🔍 Special Language Check:');
  console.log('Is JavaScript special?', isSpecialLang('javascript'));
  console.log('Is Python special?', isSpecialLang('python'));

  // Direct usage
  console.log('\n🚀 Direct Usage:');
  const jsCode = 'const greeting = "Hello, World!";';
  const jsHtml = await codeToHtml(jsCode, { lang: 'javascript', theme: 'dark-plus' });
  console.log('JavaScript code highlighted:');
  console.log(jsHtml);

  // Using highlighter instance
  console.log('\n⚙️  Highlighter Instance:');
  const highlighter = await createHighlighter();
  const pyCode = 'print("Hello from Python!")';
  const pyHtml = await highlighter.codeToHtml(pyCode, { lang: 'python', theme: 'light-plus' });
  console.log('Python code highlighted:');
  console.log(pyHtml);

  // Language alias mapping
  console.log('\n🔄 Language Alias Mapping:');
  const shellCode = 'echo "Testing shell alias"';
  const shellHtml = await codeToHtml(shellCode, { lang: 'sh', theme: 'dark-plus' });
  console.log('Shell code (using "sh" alias):');
  console.log(shellHtml);

  // Unsupported language fallback
  console.log('\n🛡️  Unsupported Language Fallback:');
  const unknownCode = '<unknown>code</unknown>';
  const unknownHtml = await codeToHtml(unknownCode, { lang: 'unknownlang', theme: 'light-plus' });
  console.log('Unknown language code:');
  console.log(unknownHtml);

  console.log('\n✅ Demo completed successfully!');
}

// Uncomment to run the demo
// demonstrateAdapter().catch(console.error);

export { demonstrateAdapter };
