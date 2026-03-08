import Prism from 'prismjs';

// Import all commonly used Prism language components statically
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating'; // Required for PHP
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-git';

// Re-export language as string type instead of Shiki-specific BundledLanguage
export type language = string;

// Common languages that are typically bundled
export const bundledLanguages: string[] = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'python',
  'bash',
  'css',
  'html',
  'json',
  'markdown',
  'yaml',
  'sql',
  'php',
  'java',
  'c',
  'rust',
  'go',
  'ruby',
  'swift',
];

export const isSpecialLang = (lang: string) => false;

// Language mapping for common aliases
const languageMap: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'sh': 'bash',
  'shell': 'bash',
  'yml': 'yaml',
  'md': 'markdown',
  'txt': 'text',
  'plaintext': 'text',
  'html': 'markup',
  'xml': 'markup',
  'svg': 'markup',
};

export async function codeToHtml(code: string, { lang, theme }: { lang: string; theme: 'light-plus' | 'dark-plus' }) {
  // Map theme names
  const themeClass = theme === 'dark-plus' ? 'github-dark' : 'github-light';
  
  // Map language aliases
  const mappedLang = languageMap[lang] || lang;
  
  // All languages are now imported statically, no need for dynamic imports
  // Check if the language is supported by Prism
  if (mappedLang !== 'text' && mappedLang !== 'plaintext' && !Prism.languages[mappedLang]) {
    console.warn(`Prism language '${mappedLang}' not found, falling back to plaintext.`);
  }

  try {
    // For text/plaintext, always escape HTML characters manually
    if (mappedLang === 'text' || mappedLang === 'plaintext') {
      const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      return `<pre class="language-${mappedLang}"><code class="language-${mappedLang}">${escaped}</code></pre>`;
    }
    
    // Use Prism to highlight the code if language is available
    const prismLang = Prism.languages[mappedLang];
    const highlighted = prismLang 
      ? Prism.highlight(code, prismLang, mappedLang)
      : code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    return `<pre class="language-${mappedLang}"><code class="language-${mappedLang}">${highlighted}</code></pre>`;
  } catch (error) {
    console.warn('Error highlighting code:', error);
    // Fallback to escaped plain text
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<pre class="language-${mappedLang}"><code class="language-${mappedLang}">${escaped}</code></pre>`;
  }
}

export async function createHighlighter() {
  return { codeToHtml };
}
