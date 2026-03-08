/**
 * Utility to detect various types of errors in terminal output
 */

export interface DetectedError {
  type: 'vite' | 'build' | 'runtime' | 'syntax';
  title: string;
  description: string;
  filePath?: string;
  line?: number;
  column?: number;
  rawError: string;
  importPath?: string; // Add importPath field
}

/**
 * Buffer state for streaming error detection
 */
export interface BufferState {
  buffer: string;
  detectedHashes: Set<string>;
}

/**
 * Create a new buffer state
 */
export function createBufferState(): BufferState {
  return {
    buffer: '',
    detectedHashes: new Set<string>()
  };
}

/**
 * Generate a simple hash for error deduplication
 */
function hashError(rawError: string): string {
  let hash = 0;
  for (let i = 0; i < rawError.length; i++) {
    const char = rawError.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Remove ANSI escape codes from a string
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u001b\u009b][[()\]#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

/**
 * Generate a more robust hash including file and location for deduplication
 */
function hashErrorDetailed(error: DetectedError): string {
  return hashError(`${error.rawError}|${error.filePath || ''}|${error.line || ''}|${error.column || ''}`);
}

/**
 * Patterns to detect various error types in terminal output
 */
const ERROR_PATTERNS = {
  // Vite import errors
  viteImportError: /\[plugin:vite:import-analysis\] Failed to resolve import "([^"]+)" from "([^"]+)"/,
  
  // Vite transform errors
  viteTransformError: /\[plugin:vite:([^\]]+)\] (.+?)$/m,
  
  // General build errors
  buildError: /error during build:|build failed|compilation failed/i,
  
  // HTML parse5 errors
  htmlParseError: /Unable to parse HTML;.*parse5 error code ([^\s]+)/,

  // CSS parse errors
  cssParseError: /Syntax Error.*?css.*?at.*?:(\d+):(\d+)/i,

  // Node generic runtime trace (first line)
  nodeTraceError: /Error: (.+?)\n\s+at /,
  
  // TypeScript errors
  tsError: /TS\d+: (.+)/,
  
  // ESLint errors
  eslintError: /(\d+:\d+)\s+error\s+(.+?)\s+(.+)$/m,
  
  // Module not found
  moduleNotFound: /Cannot find module '([^']+)'|Module not found: (?:Error: )?Can't resolve '([^']+)'/,
  
  // Syntax errors
  syntaxError: /SyntaxError: (.+)/,
  
  // Failed to compile
  compilationFailed: /Failed to compile\.|Compilation failed/,
};

/**
 * Extract file location from error stack trace
 */
function extractFileLocation(error: string): { filePath?: string; line?: number; column?: number } {
  // Match file paths with line:column
  const locationMatch = error.match(/(?:at\s+)?([^:\s]+\.(?:js|jsx|ts|tsx|vue|svelte|html|css|scss|md)):(\d+):(\d+)/);
  if (locationMatch) {
    return {
      filePath: locationMatch[1],
      line: parseInt(locationMatch[2], 10),
      column: parseInt(locationMatch[3], 10),
    };
  }
  
  // Match simple file paths
  const fileMatch = error.match(/(?:from |in |at )"?([^":\s]+\.(?:js|jsx|ts|tsx|vue|svelte|html|css|scss|md))"?/);
  if (fileMatch) {
    return { filePath: fileMatch[1] };
  }
  
  return {};
}

/**
 * Detect errors in terminal output
 */
export function detectErrorsInOutput(output: string): DetectedError[] {
  // Strip ANSI control codes for cleaner matching
  output = stripAnsi(output);

  const errors: DetectedError[] = [];
  
  // Check for Vite import errors
  const viteImportMatch = output.match(ERROR_PATTERNS.viteImportError);
  if (viteImportMatch) {
    const [fullMatch, importPath, filePath] = viteImportMatch;
    const location = extractFileLocation(output);
    
    errors.push({
      type: 'vite',
      title: 'Import Resolution Error',
      description: `Failed to resolve import "${importPath}" from "${filePath}". The module might not be installed or the import path might be incorrect.`,
      filePath: location.filePath || filePath,
      line: location.line,
      column: location.column,
      rawError: fullMatch,
      importPath: importPath,
    });
  }
  
  // Check for Vite transform errors
  const viteTransformMatch = output.match(ERROR_PATTERNS.viteTransformError);
  if (viteTransformMatch && !viteImportMatch) { // Avoid duplicates
    const [fullMatch, plugin, message] = viteTransformMatch;
    const location = extractFileLocation(output);
    
    errors.push({
      type: 'vite',
      title: `Vite Plugin Error (${plugin})`,
      description: message.trim(),
      ...location,
      rawError: fullMatch,
    });
  }

  // Check for HTML parse5 errors
  const htmlParseMatch = output.match(ERROR_PATTERNS.htmlParseError);
  if (htmlParseMatch) {
    const [fullMatch, code] = htmlParseMatch;
    const location = extractFileLocation(output);
    errors.push({
      type: 'build',
      title: 'HTML Parse Error',
      description: `parse5 error code: ${code}`,
      ...location,
      rawError: fullMatch,
    });
  }

  // Check for CSS parse errors
  const cssParseMatch = output.match(ERROR_PATTERNS.cssParseError);
  if (cssParseMatch) {
    const [fullMatch] = cssParseMatch;
    const location = extractFileLocation(output);
    errors.push({
      type: 'build',
      title: 'CSS Syntax Error',
      description: 'CSS parsing failed.',
      ...location,
      rawError: fullMatch,
    });
  }
  
  // Check for module not found errors
  const moduleMatch = output.match(ERROR_PATTERNS.moduleNotFound);
  if (moduleMatch) {
    const moduleName = moduleMatch[1] || moduleMatch[2];
    const location = extractFileLocation(output);
    
    errors.push({
      type: 'build',
      title: 'Module Not Found',
      description: `Cannot find module '${moduleName}'. Try running 'npm install ${moduleName}' to install the missing dependency.`,
      ...location,
      rawError: moduleMatch[0],
    });
  }
  
  // Check for TypeScript errors
  const tsMatch = output.match(ERROR_PATTERNS.tsError);
  if (tsMatch) {
    const [fullMatch, message] = tsMatch;
    const location = extractFileLocation(output);
    
    errors.push({
      type: 'build',
      title: 'TypeScript Error',
      description: message,
      ...location,
      rawError: fullMatch,
    });
  }
  
  // Check for syntax errors
  const syntaxMatch = output.match(ERROR_PATTERNS.syntaxError);
  if (syntaxMatch) {
    const [fullMatch, message] = syntaxMatch;
    const location = extractFileLocation(output);
    
    errors.push({
      type: 'syntax',
      title: 'Syntax Error',
      description: message,
      ...location,
      rawError: fullMatch,
    });
  }
  
  // Check for general compilation failures
  if (ERROR_PATTERNS.compilationFailed.test(output) && errors.length === 0) {
    errors.push({
      type: 'build',
      title: 'Compilation Failed',
      description: 'The build process failed. Check the terminal output for more details.',
      rawError: output.slice(0, 500), // First 500 chars
    });
  }

  // Generic catch-all with file reference
  if (errors.length === 0) {
    const genericMatch = output.match(/(?:Error|ERROR|error).*\n.*?:\d+:\d+/);
    if (genericMatch) {
      errors.push({
        type: 'build',
        title: 'Unhandled Build Error',
        description: genericMatch[0].slice(0, 120) + '…',
        rawError: genericMatch[0],
      });
    }
  }
  
  return errors;
}

/**
 * Detect errors in a chunk of streaming output
 * Maintains a rolling buffer to avoid excessive memory usage
 */
export function detectErrorsInChunk(chunk: string, bufferState: BufferState): DetectedError[] {
  const MAX_BUFFER_SIZE = 16384; // 16KB buffer for richer context
  
  // Add new chunk to buffer
  bufferState.buffer += chunk;
  
  // Trim buffer if it gets too large (keep last 2KB + new chunk)
  if (bufferState.buffer.length > MAX_BUFFER_SIZE) {
    const trimIndex = bufferState.buffer.length - 2048;
    // Try to trim at a newline to avoid breaking error patterns
    const newlineIndex = bufferState.buffer.indexOf('\n', trimIndex);
    const trimAt = newlineIndex !== -1 ? newlineIndex + 1 : trimIndex;
    bufferState.buffer = bufferState.buffer.slice(trimAt);
  }
  
  // Detect errors in the current buffer
  const errors = detectErrorsInOutput(bufferState.buffer);
  
  // Filter out duplicate errors based on hash
  const newErrors = errors.filter(error => {
    const errorHash = hashErrorDetailed(error);
    if (bufferState.detectedHashes.has(errorHash)) {
      return false;
    }
    bufferState.detectedHashes.add(errorHash);
    return true;
  });
  
  return newErrors;
}

/**
 * Format error for display in chat alert
 */
export function formatErrorForAlert(error: DetectedError, fullOutput: string): { title: string; description: string; content: string } {
  let content = '';
  
  // Add file location if available
  if (error.filePath) {
    content += `File: ${error.filePath}`;
    if (error.line && error.column) {
      content += `:${error.line}:${error.column}`;
    }
    content += '\n\n';
  }
  
  // Add the main error
  content += error.rawError;
  
  // Try to extract more context around the error
  if (fullOutput && fullOutput.includes(error.rawError)) {
    const errorIndex = fullOutput.indexOf(error.rawError);
    const beforeError = fullOutput.slice(Math.max(0, errorIndex - 500), errorIndex).trim();
    const afterError = fullOutput.slice(errorIndex + error.rawError.length, errorIndex + error.rawError.length + 500).trim();
    
    if (beforeError || afterError) {
      content += '\n\n--- Additional Context ---\n';
      if (beforeError) {
        const beforeLines = beforeError.split('\n').slice(-5).join('\n');
        if (beforeLines) content += beforeLines + '\n';
      }
      if (afterError) {
        const afterLines = afterError.split('\n').slice(0, 5).join('\n');
        if (afterLines) content += '\n' + afterLines;
      }
    }
  }
  
  // Add suggestions based on error type
  if (error.type === 'vite' && error.importPath) {
    content += `\n\n--- Suggested Fix ---\nRun: npm install ${error.importPath}`;
  }
  
  return {
    title: error.title,
    description: error.description,
    content: content.trim(),
  };
}
