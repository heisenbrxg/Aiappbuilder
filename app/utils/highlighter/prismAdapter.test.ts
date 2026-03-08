import { describe, it, expect } from 'vitest';
import { codeToHtml, createHighlighter, bundledLanguages, isSpecialLang } from './prismAdapter';

describe('PrismJS Adapter', () => {
  it('should export expected types and functions', () => {
    expect(typeof codeToHtml).toBe('function');
    expect(typeof createHighlighter).toBe('function');
    expect(Array.isArray(bundledLanguages)).toBe(true);
    expect(typeof isSpecialLang).toBe('function');
  });

  it('should create a highlighter with codeToHtml method', async () => {
    const highlighter = await createHighlighter();
    expect(highlighter).toHaveProperty('codeToHtml');
    expect(typeof highlighter.codeToHtml).toBe('function');
  });

  it('should highlight JavaScript code', async () => {
    const code = 'const hello = "world";';
    const result = await codeToHtml(code, { lang: 'javascript', theme: 'light-plus' });
    
    expect(result).toContain('<pre class="language-javascript">');
    expect(result).toContain('<code class="language-javascript">');
    expect(result).toContain('const');
    expect(result).toContain('hello');
  });

  it('should handle unknown languages gracefully', async () => {
    const code = 'some unknown code';
    const result = await codeToHtml(code, { lang: 'unknownlang', theme: 'dark-plus' });
    
    expect(result).toContain('<pre class="language-unknownlang">');
    expect(result).toContain('<code class="language-unknownlang">');
    expect(result).toContain('some unknown code');
  });

  it('should map language aliases correctly', async () => {
    const code = 'print("hello")';
    const result = await codeToHtml(code, { lang: 'py', theme: 'light-plus' });
    
    expect(result).toContain('<pre class="language-python">');
    expect(result).toContain('<code class="language-python">');
  });

  it('should handle both light and dark themes', async () => {
    const code = 'test';
    const lightResult = await codeToHtml(code, { lang: 'text', theme: 'light-plus' });
    const darkResult = await codeToHtml(code, { lang: 'text', theme: 'dark-plus' });
    
    expect(lightResult).toContain('test');
    expect(darkResult).toContain('test');
  });

  it('should escape HTML characters in plain text', async () => {
    const code = '<script>alert("test")</script>';
    const result = await codeToHtml(code, { lang: 'text', theme: 'light-plus' });
    
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&lt;/script&gt;');
    expect(result).toContain('&quot;test&quot;');
  });

  it('should return false for isSpecialLang', () => {
    expect(isSpecialLang('javascript')).toBe(false);
    expect(isSpecialLang('python')).toBe(false);
    expect(isSpecialLang('anyLanguage')).toBe(false);
  });
});
