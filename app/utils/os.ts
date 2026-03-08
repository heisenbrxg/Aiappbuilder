// In server/worker environments `navigator` may not exist, or its `platform` might be undefined.
// Compute a safe lower-case platform string once and reuse it.
const _platform =
  typeof navigator !== 'undefined' && typeof navigator.platform === 'string'
    ? navigator.platform.toLowerCase()
    : '';

export const isMac = _platform.includes('mac');
export const isWindows = _platform.includes('win');
export const isLinux = _platform.includes('linux');
