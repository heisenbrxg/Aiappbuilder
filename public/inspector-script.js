(function() {
  let isInspectorActive = false;
  let inspectorStyle = null;
  let currentHighlight = null;
  const INSPECTOR_VERSION = '1.0.0';

  // Function to get relevant styles
  function getRelevantStyles(element) {
    const computedStyles = window.getComputedStyle(element);
    const relevantProps = [
      'display', 'position', 'width', 'height', 'margin', 'padding',
      'border', 'background', 'color', 'font-size', 'font-family',
      'text-align', 'flex-direction', 'justify-content', 'align-items'
    ];
    
    const styles = {};
    relevantProps.forEach(prop => {
      const value = computedStyles.getPropertyValue(prop);
      if (value) styles[prop] = value;
    });
    
    return styles;
  }

  // Function to create a readable element selector
  function createReadableSelector(element) {
    let selector = element.tagName.toLowerCase();
    
    // Add ID if present
    if (element.id) {
      selector += `#${element.id}`;
    }
    
    // Add classes if present
    let className = '';
    if (element.className) {
      if (typeof element.className === 'string') {
        className = element.className;
      } else if (element.className.baseVal !== undefined) {
        className = element.className.baseVal;
      } else {
        className = element.className.toString();
      }
      
      if (className.trim()) {
        const classes = className.trim().split(/\s+/).slice(0, 3); // Limit to first 3 classes
        selector += `.${classes.join('.')}`;
      }
    }
    
    return selector;
  }

  // Function to create element display text
  function createElementDisplayText(element) {
    const tagName = element.tagName.toLowerCase();
    let displayText = `<${tagName}`;
    
    // Add ID attribute
    if (element.id) {
      displayText += ` id="${element.id}"`;
    }
    
    // Add class attribute (limit to first 3 classes for readability)
    let className = '';
    if (element.className) {
      if (typeof element.className === 'string') {
        className = element.className;
      } else if (element.className.baseVal !== undefined) {
        className = element.className.baseVal;
      } else {
        className = element.className.toString();
      }
      
      if (className.trim()) {
        const classes = className.trim().split(/\s+/);
        const displayClasses = classes.length > 3 ? 
          classes.slice(0, 3).join(' ') + '...' : 
          classes.join(' ');
        displayText += ` class="${displayClasses}"`;
      }
    }
    
    // Add other important attributes
    const importantAttrs = ['type', 'name', 'href', 'src', 'alt', 'title'];
    importantAttrs.forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        const truncatedValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
        displayText += ` ${attr}="${truncatedValue}"`;
      }
    });
    
    displayText += '>';
    
    // Add text content preview for certain elements
    const textElements = ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'label'];
    if (textElements.includes(tagName) && element.textContent) {
      const textPreview = element.textContent.trim().substring(0, 50);
      if (textPreview) {
        displayText += textPreview.length < element.textContent.trim().length ? 
          textPreview + '...' : textPreview;
      }
    }
    
    displayText += `</${tagName}>`;
    
    return displayText;
  }

  // Function to create element info
  function createElementInfo(element) {
    const rect = element.getBoundingClientRect();
    
    return {
      tagName: element.tagName,
      className: getElementClassName(element),
      id: element.id || '',
      textContent: element.textContent?.slice(0, 100) || '',
      styles: getRelevantStyles(element),
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      // Add new readable formats
      selector: createReadableSelector(element),
      displayText: createElementDisplayText(element),
      elementPath: getElementPath(element)
    };
  }

  // Helper function to get element class name consistently
  function getElementClassName(element) {
    if (!element.className) return '';
    
    if (typeof element.className === 'string') {
      return element.className;
    } else if (element.className.baseVal !== undefined) {
      return element.className.baseVal;
    } else {
      return element.className.toString();
    }
  }

  // Function to get element path (breadcrumb)
  function getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body && current !== document.documentElement) {
      let pathSegment = current.tagName.toLowerCase();
      
      if (current.id) {
        pathSegment += `#${current.id}`;
      } else if (current.className) {
        const className = getElementClassName(current);
        if (className.trim()) {
          const firstClass = className.trim().split(/\s+/)[0];
          pathSegment += `.${firstClass}`;
        }
      }
      
      path.unshift(pathSegment);
      current = current.parentElement;
      
      // Limit path length
      if (path.length >= 5) break;
    }
    
    return path.join(' > ');
  }

  // Event handlers
  function handleMouseMove(e) {
    if (!isInspectorActive) return;
    
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;

    // Remove previous highlight
    if (currentHighlight) {
      currentHighlight.classList.remove('inspector-highlight');
    }
    
    // Add highlight to current element
    target.classList.add('inspector-highlight');
    currentHighlight = target;

    const elementInfo = createElementInfo(target);
    
    // Send message to parent
    window.parent.postMessage({
      type: 'INSPECTOR_HOVER',
      elementInfo: elementInfo
    }, '*');
  }

  function handleClick(e) {
    if (!isInspectorActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;

    const elementInfo = createElementInfo(target);
    
    // Send message to parent
    window.parent.postMessage({
      type: 'INSPECTOR_CLICK',
      elementInfo: elementInfo
    }, '*');
  }

  function handleMouseLeave() {
    if (!isInspectorActive) return;
    
    // Remove highlight
    if (currentHighlight) {
      currentHighlight.classList.remove('inspector-highlight');
      currentHighlight = null;
    }
    
    // Send message to parent
    window.parent.postMessage({
      type: 'INSPECTOR_LEAVE'
    }, '*');
  }

  // Function to activate/deactivate inspector
  function setInspectorActive(active) {
    isInspectorActive = active;
    
    if (active) {
      // Add inspector styles
      if (!inspectorStyle) {
        inspectorStyle = document.createElement('style');
        inspectorStyle.textContent = `
          .inspector-active * {
            cursor: crosshair !important;
          }
          .inspector-highlight {
            outline: 2px solid #3b82f6 !important;
            outline-offset: -2px !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
        `;
        document.head.appendChild(inspectorStyle);
      }
      
      document.body.classList.add('inspector-active');
      
      // Add event listeners
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('mouseleave', handleMouseLeave, true);
    } else {
      document.body.classList.remove('inspector-active');
      
      // Remove highlight
      if (currentHighlight) {
        currentHighlight.classList.remove('inspector-highlight');
        currentHighlight = null;
      }
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      
      // Remove styles
      if (inspectorStyle) {
        inspectorStyle.remove();
        inspectorStyle = null;
      }
    }
  }

  // Error handling and messaging
  window.onerror = function(message, source, lineno, colno, error) {
    window.parent.postMessage({
      type: 'JS_ERROR',
      version: INSPECTOR_VERSION,
      error: {
        message,
        source,
        lineno,
        colno,
        stack: error ? error.stack : null
      }
    }, '*');
  };

  window.onunhandledrejection = function(event) {
    window.parent.postMessage({
      type: 'PROMISE_REJECTION',
      version: INSPECTOR_VERSION,
      reason: event.reason ? event.reason.message : 'Unhandled promise rejection',
      stack: event.reason ? event.reason.stack : null
    }, '*');
  };

  const originalConsoleError = console.error;
  console.error = function(...args) {
    window.parent.postMessage({
      type: 'CONSOLE_ERROR',
      version: INSPECTOR_VERSION,
      arguments: args.map(arg => (arg instanceof Error ? { message: arg.message, stack: arg.stack } : arg))
    }, '*');
    originalConsoleError.apply(console, args);
  };

  // Enhanced Vite HMR error detection
  if (window.__vite_ping) {
    const originalVitePing = window.__vite_ping;
    window.__vite_ping = function(...args) {
      return originalVitePing.apply(this, args).catch(error => {
        window.parent.postMessage({
          type: 'VITE_HMR_ERROR',
          version: INSPECTOR_VERSION,
          message: error.message,
          stack: error.stack
        }, '*');
        throw error; // Re-throw to maintain original behavior
      });
    };
  }

  // Listen for Vite HMR events
  if (import.meta && import.meta.hot) {
    import.meta.hot.on('vite:error', (payload) => {
      window.parent.postMessage({
        type: 'VITE_HMR_ERROR',
        version: INSPECTOR_VERSION,
        message: payload.err?.message || 'Vite HMR error',
        stack: payload.err?.stack,
        id: payload.id,
        file: payload.file
      }, '*');
    });
  }

  // Listen for other Vite events that might indicate errors
  if (window.addEventListener) {
    window.addEventListener('vite:beforeUpdate', (event) => {
      // This can help track when updates fail
    });
  }

  // ========== NETWORK ERROR DETECTION ==========
  
  // Capture resource loading errors (images, scripts, CSS, fonts)
  window.addEventListener('error', (event) => {
    // Check if error is from a resource (not JavaScript error)
    if (event.target && event.target !== window) {
      const target = event.target;
      const tagName = target.tagName?.toLowerCase();
      
      // Only report for actual resource tags
      if (tagName === 'img' || tagName === 'script' || tagName === 'link' || tagName === 'video' || tagName === 'audio') {
        const resourceUrl = target.src || target.href || 'unknown';
        
        window.parent.postMessage({
          type: 'RESOURCE_ERROR',
          version: INSPECTOR_VERSION,
          resource: {
            type: tagName,
            url: resourceUrl,
            message: `Failed to load ${tagName}: ${resourceUrl}`
          }
        }, '*');
      }
    }
  }, true); // Use capture phase to catch all errors

  // Intercept fetch to detect HTTP errors and network failures
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
    
    return originalFetch.apply(this, args)
      .then(response => {
        // Detect HTTP error responses (4xx, 5xx)
        if (!response.ok) {
          window.parent.postMessage({
            type: 'NETWORK_ERROR',
            version: INSPECTOR_VERSION,
            network: {
              url: response.url || url,
              status: response.status,
              statusText: response.statusText,
              method: args[1]?.method || 'GET',
              message: `HTTP ${response.status}: ${response.statusText} - ${response.url || url}`
            }
          }, '*');
        }
        return response;
      })
      .catch(error => {
        // Network failure (offline, CORS, timeout, DNS, etc.)
        window.parent.postMessage({
          type: 'NETWORK_ERROR',
          version: INSPECTOR_VERSION,
          network: {
            url: url,
            method: args[1]?.method || 'GET',
            message: error.message || 'Network request failed',
            stack: error.stack,
            reason: 'Network failure (offline, CORS, timeout, or connection refused)'
          }
        }, '*');
        throw error; // Re-throw to maintain original behavior
      });
  };

  // Intercept XMLHttpRequest for legacy AJAX calls
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._requestMethod = method;
    this._requestUrl = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    // Track start time for timeout detection
    this._startTime = Date.now();
    
    // Listen for network errors
    this.addEventListener('error', () => {
      window.parent.postMessage({
        type: 'NETWORK_ERROR',
        version: INSPECTOR_VERSION,
        network: {
          url: this._requestUrl,
          method: this._requestMethod,
          message: 'XHR request failed (network error)',
          reason: 'Network failure or CORS issue'
        }
      }, '*');
    });
    
    // Listen for timeout
    this.addEventListener('timeout', () => {
      window.parent.postMessage({
        type: 'NETWORK_ERROR',
        version: INSPECTOR_VERSION,
        network: {
          url: this._requestUrl,
          method: this._requestMethod,
          message: 'XHR request timed out',
          reason: 'Request exceeded timeout limit'
        }
      }, '*');
    });
    
    // Listen for load to check HTTP status
    this.addEventListener('load', () => {
      if (this.status >= 400) {
        const duration = Date.now() - this._startTime;
        window.parent.postMessage({
          type: 'NETWORK_ERROR',
          version: INSPECTOR_VERSION,
          network: {
            url: this._requestUrl,
            method: this._requestMethod,
            status: this.status,
            statusText: this.statusText,
            duration: duration,
            message: `HTTP ${this.status}: ${this.statusText} - ${this._requestUrl}`
          }
        }, '*');
      }
    });
    
    return originalXHRSend.apply(this, args);
  };

  // ========== END NETWORK ERROR DETECTION ==========

  // Listen for messages from parent
  window.addEventListener('message', function(event) {
    if (event.data.type === 'INSPECTOR_ACTIVATE') {
      setInspectorActive(event.data.active);
    }
  });

  // Auto-inject if inspector is already active
  window.parent.postMessage({ type: 'INSPECTOR_READY', version: INSPECTOR_VERSION }, '*');
})();