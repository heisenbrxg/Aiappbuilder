/**
 * Security middleware utilities for protecting against common attacks
 */

export interface SecurityConfig {
  blockSensitiveFiles: boolean;
  logSecurityEvents: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

const DEFAULT_CONFIG: SecurityConfig = {
  blockSensitiveFiles: true,
  logSecurityEvents: true,
};

// List of sensitive file patterns that should never be accessible
export const SENSITIVE_FILE_PATTERNS = [
  // Environment files
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
  
  // Configuration files
  'wrangler.toml',
  'tsconfig.json',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  
  // Git and version control
  '.git',
  '.gitignore',
  '.gitmodules',
  
  // Build and deployment
  'Dockerfile',
  'docker-compose.yaml',
  'docker-compose.yml',
  'node_modules',
  'dist',
  'build',
  '.vercel',
  '.netlify',
  
  // IDE and editor files
  '.vscode',
  '.idea',
  '.vs',
  
  // System files
  '.DS_Store',
  'Thumbs.db',
  
  // Backup files
  '*.bak',
  '*.backup',
  '*.old',
  '*.tmp',
  
  // Database files
  '*.db',
  '*.sqlite',
  '*.sql',
  
  // Log files
  '*.log',
  'logs',
  
  // Security files
  '.htaccess',
  '.htpasswd',
  'web.config',
  
  // Source maps (can reveal source code)
  '*.js.map',
  '*.css.map',
];

// Common attack patterns to detect
export const ATTACK_PATTERNS = [
  // Directory traversal
  '../',
  '..\\',
  '%2e%2e%2f',
  '%2e%2e%5c',
  
  // Null byte injection
  '%00',
  '\0',
  
  // Script injection attempts
  '<script',
  'javascript:',
  'vbscript:',
  
  // SQL injection patterns
  'union select',
  'drop table',
  'delete from',
  
  // Command injection
  '$()',
  '`',
  '|',
  ';',
];

/**
 * Check if a pathname contains sensitive file patterns
 */
export function isSensitiveFileRequest(pathname: string): boolean {
  const lowerPath = pathname.toLowerCase();
  
  return SENSITIVE_FILE_PATTERNS.some(pattern => {
    // Handle wildcard patterns
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(lowerPath);
    }
    
    // Check if path contains the pattern
    return lowerPath.includes(pattern) || 
           lowerPath.startsWith(`/${pattern}`) || 
           lowerPath.endsWith(`/${pattern}`);
  });
}

/**
 * Check if a request contains potential attack patterns
 */
export function containsAttackPatterns(request: Request): boolean {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  const search = url.search.toLowerCase();
  
  return ATTACK_PATTERNS.some(pattern => 
    pathname.includes(pattern) || search.includes(pattern)
  );
}

/**
 * Log security events with relevant information
 */
export function logSecurityEvent(
  type: 'sensitive_file' | 'attack_pattern' | 'rate_limit' | 'blocked',
  request: Request,
  details?: string
) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   request.headers.get('X-Real-IP') || 
                   'unknown';
  
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const pathname = new URL(request.url).pathname;
  
  console.warn(`🚨 SECURITY EVENT [${type.toUpperCase()}]:`, {
    pathname,
    clientIP,
    userAgent: userAgent.substring(0, 100), // Truncate long user agents
    timestamp: new Date().toISOString(),
    details,
  });
  
  // In production, you might want to send this to a security monitoring service
  // Example: sendToSecurityService({ type, pathname, clientIP, userAgent, timestamp: new Date() });
}

/**
 * Create security response headers
 */
export function createSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Main security middleware function
 */
export function applySecurityMiddleware(
  request: Request,
  config: Partial<SecurityConfig> = {}
): { blocked: boolean; reason?: string; headers?: Record<string, string> } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { pathname } = new URL(request.url);
  
  // Check for sensitive file access
  if (finalConfig.blockSensitiveFiles && isSensitiveFileRequest(pathname)) {
    if (finalConfig.logSecurityEvents) {
      logSecurityEvent('sensitive_file', request, `Attempted access to: ${pathname}`);
    }
    
    return {
      blocked: true,
      reason: 'Access to sensitive files is not allowed',
      headers: createSecurityHeaders(),
    };
  }
  
  // Check for attack patterns
  if (containsAttackPatterns(request)) {
    if (finalConfig.logSecurityEvents) {
      logSecurityEvent('attack_pattern', request, `Suspicious patterns detected in: ${pathname}`);
    }
    
    return {
      blocked: true,
      reason: 'Request contains suspicious patterns',
      headers: createSecurityHeaders(),
    };
  }
  
  return { blocked: false };
}
