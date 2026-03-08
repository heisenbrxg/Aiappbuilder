/**
 * Safely stringify JSON with handling for special types like Promises, Functions, etc.
 * This prevents "[object Promise]" and similar issues when serializing complex objects.
 */
export function safeJsonStringify(value: any, space?: number | string): string {
  const replacer = (key: string, val: any) => {
    // Handle Promises
    if (val && typeof val === 'object' && val.constructor?.name === 'Promise') {
      return '[Promise - pending]';
    }
    
    // Handle Functions
    if (typeof val === 'function') {
      return '[Function]';
    }
    
    // Handle undefined (JSON.stringify removes undefined, but we want to show it)
    if (val === undefined) {
      return '[undefined]';
    }
    
    // Handle symbols
    if (typeof val === 'symbol') {
      return `[Symbol: ${val.toString()}]`;
    }
    
    // Handle circular references (will be caught by try-catch, but good to be explicit)
    // Note: This is a basic check, for complex circular refs use a WeakSet tracker
    
    return val;
  };

  try {
    return JSON.stringify(value, replacer, space);
  } catch (error) {
    // Handle circular references and other errors
    if (error instanceof TypeError && error.message.includes('circular')) {
      return '[Circular Reference Detected]';
    }
    return '[Serialization Error: ' + (error as Error).message + ']';
  }
}

/**
 * Parse and re-stringify JSON for pretty formatting with error handling
 */
export function formatJson(input: any, space: number = 2): string {
  // If already an object, stringify it
  if (typeof input === 'object' && input !== null) {
    return safeJsonStringify(input, space);
  }
  
  // If it's a string that looks like "[object Promise]", handle it
  if (typeof input === 'string') {
    if (input === '[object Promise]') {
      return '"[Promise - pending]"';
    }
    
    // Try to parse and re-format
    try {
      const parsed = JSON.parse(input);
      return safeJsonStringify(parsed, space);
    } catch {
      // Not valid JSON, return as-is
      return input;
    }
  }
  
  // For primitives, convert to string
  return String(input);
}
