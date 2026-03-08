/**
 * Combined Preview Scripts
 * Includes both inspector functionality and Vite error detection
 */

// Inspector Script (existing functionality)
(function() {
  const inspectorScript = document.createElement('script');
  inspectorScript.src = '/inspector-script.js';
  document.head.appendChild(inspectorScript);
})();

// Vite Error Detector
(function() {
  'use strict';
  
  console.log('[Vite Error Detector] Initializing...');
  
  // Debounce function to avoid spamming
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Function to extract error details from Vite overlay
  function extractViteError() {
    // Look for Vite error overlay
    const errorOverlay = document.querySelector('vite-error-overlay');
    if (!errorOverlay) return null;
    
    // Check if overlay is actually visible
    const shadowRoot = errorOverlay.shadowRoot;
    if (!shadowRoot) return null;
    
    // Get all text content from the overlay
    const overlayContent = shadowRoot.textContent || '';
    console.log('[Vite Error Detector] Full overlay content:', overlayContent);
    
    // Try multiple selectors to extract error information
    let message = '';
    let file = '';
    let frame = '';
    let stack = '';
    
    // Try various selectors for different parts of the error
    const possibleMessageSelectors = ['.message-body', '.message', 'pre', '.error-message'];
    const possibleFileSelectors = ['.file', '.filename', '.file-path'];
    const possibleFrameSelectors = ['.frame', '.code-frame', '.source-code'];
    const possibleStackSelectors = ['.stack', '.stacktrace', '.error-stack'];
    
    // Extract message
    for (const selector of possibleMessageSelectors) {
      const el = shadowRoot.querySelector(selector);
      if (el && el.textContent) {
        message = el.textContent.trim();
        break;
      }
    }
    
    // Extract file
    for (const selector of possibleFileSelectors) {
      const el = shadowRoot.querySelector(selector);
      if (el && el.textContent) {
        file = el.textContent.trim();
        break;
      }
    }
    
    // Extract frame
    for (const selector of possibleFrameSelectors) {
      const el = shadowRoot.querySelector(selector);
      if (el && el.textContent) {
        frame = el.textContent.trim();
        break;
      }
    }
    
    // Extract stack
    for (const selector of possibleStackSelectors) {
      const el = shadowRoot.querySelector(selector);
      if (el && el.textContent) {
        stack = el.textContent.trim();
        break;
      }
    }
    
    // If no structured message found, use full overlay content
    if (!message && overlayContent) {
      message = overlayContent;
    }
    
    if (!message) return null;
    
    // Create comprehensive error object
    const error = {
      type: 'VITE_BUILD_ERROR',
      message: message,
      file: file,
      frame: frame,
      stack: stack,
      fullContent: overlayContent, // Include full content for debugging
      timestamp: Date.now()
    };
    
    // Extract specific error type and import path
    if (error.message.includes('Failed to resolve import') || error.fullContent.includes('Failed to resolve import')) {
      error.errorType = 'import';
      const importMatch = (error.message + ' ' + error.fullContent).match(/Failed to resolve import ["']([^"']+)["']/);
      if (importMatch) {
        error.importPath = importMatch[1];
      }
      
      // Extract file path from error
      const fileMatch = (error.message + ' ' + error.fullContent).match(/from ["']([^"']+)["']/);
      if (fileMatch && !error.file) {
        error.file = fileMatch[1];
      }
    } else if (error.message.includes('Syntax Error') || error.message.includes('SyntaxError')) {
      error.errorType = 'syntax';
    } else if (error.message.includes('Transform failed')) {
      error.errorType = 'transform';
    } else {
      error.errorType = 'build';
    }
    
    console.log('[Vite Error Detector] Extracted error:', error);
    return error;
  }
  
  // Error state tracking
  let lastErrorHash = null;
  let errorCount = 0;
  let lastErrorTime = 0;
  
  // Function to generate error hash for deduplication
  function getErrorHash(error) {
    return btoa(error.message + error.file + error.errorType).slice(0, 16);
  }
  
  // Function to send error to parent with deduplication
  const sendError = debounce(function(error) {
    if (!error || window.parent === window) return;
    
    const errorHash = getErrorHash(error);
    const now = Date.now();
    
    // Deduplicate identical errors within 5 seconds
    if (errorHash === lastErrorHash && (now - lastErrorTime) < 5000) {
      console.log('[Vite Error Detector] Duplicate error ignored');
      return;
    }
    
    lastErrorHash = errorHash;
    lastErrorTime = now;
    errorCount++;
    
    console.log('[Vite Error Detector] Sending error to parent:', error);
    
    // Add error metadata
    error.errorCount = errorCount;
    error.canRetry = error.errorType === 'import' || error.errorType === 'transform';
    
    window.parent.postMessage({
      type: 'VITE_ERROR_DETECTED',
      error: error
    }, '*');
  }, 500);
  
  // Listen for retry requests from parent
  window.addEventListener('message', function(event) {
    if (event.data.type === 'RETRY_PREVIEW') {
      console.log('[Vite Error Detector] Retry requested, reloading...');
      window.location.reload();
    }
  });
  
  // Monitor for Vite error overlay
  const observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName && node.nodeName.toLowerCase() === 'vite-error-overlay') {
          console.log('[Vite Error Detector] Vite error overlay detected!');
          // Wait a bit for the overlay to fully render
          setTimeout(() => {
            const error = extractViteError();
            if (error) {
              sendError(error);
            }
          }, 100);
        }
      }
    }
  });
  
  // Start observing
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Also check for existing overlay on load
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      const error = extractViteError();
      if (error) {
        sendError(error);
      }
    }, 500);
  });
  
  // Listen for unhandled errors and console errors as backup
  window.addEventListener('error', function(event) {
    console.log('[Vite Error Detector] Window error event:', event);
    
    // Check if this might be related to a module loading issue
    if (event.message && (event.message.includes('Unexpected token') || 
        event.message.includes('SyntaxError') ||
        event.message.includes('import') ||
        event.message.includes('module'))) {
      
      // Try to get more detailed error info from the current error overlay
      setTimeout(() => {
        const error = extractViteError();
        if (error) {
          sendError(error);
        } else {
          // Fallback to window error if no overlay found
          sendError({
            type: 'VITE_WINDOW_ERROR',
            message: event.message || 'Unknown error',
            file: event.filename || '',
            line: event.lineno || 0,
            column: event.colno || 0,
            stack: event.error?.stack || '',
            timestamp: Date.now()
          });
        }
      }, 100);
    }
  });
  
  // Also listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.log('[Vite Error Detector] Unhandled promise rejection:', event);
    
    const reason = event.reason;
    let errorMessage = '';
    
    if (typeof reason === 'string') {
      errorMessage = reason;
    } else if (reason && reason.message) {
      errorMessage = reason.message;
    } else {
      errorMessage = String(reason);
    }
    
    if (errorMessage.includes('Failed to resolve import') ||
        errorMessage.includes('[vite]') ||
        errorMessage.includes('Transform failed')) {
      sendError({
        type: 'VITE_PROMISE_ERROR',
        message: errorMessage,
        stack: reason?.stack || '',
        timestamp: Date.now()
      });
    }
  });
  
  // Listen for console errors as backup
  const originalError = console.error;
  console.error = function(...args) {
    originalError.apply(console, args);
    
    const errorStr = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    console.log('[Vite Error Detector] Console error:', errorStr);
    
    // Check if it's a Vite-related error
    if (errorStr.includes('[vite]') || 
        errorStr.includes('Failed to resolve import') ||
        errorStr.includes('Transform failed') ||
        errorStr.includes('plugin:vite:import-analysis')) {
      
      // Try to get the overlay error first
      setTimeout(() => {
        const overlayError = extractViteError();
        if (overlayError) {
          sendError(overlayError);
        } else {
          sendError({
            type: 'VITE_CONSOLE_ERROR',
            message: errorStr,
            fullContent: errorStr,
            timestamp: Date.now()
          });
        }
      }, 50);
    }
  };
  
  console.log('[Vite Error Detector] Ready and monitoring for errors');
})();
