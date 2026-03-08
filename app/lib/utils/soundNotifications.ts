/**
 * Sound notification utilities for app events
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (needed for some browsers)
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      return null;
    }
  }
  
  return audioContext;
}

/**
 * Play a success notification sound when app starts
 */
export function playAppStartSound() {
  if (typeof window === 'undefined') return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    // Create oscillator for a pleasant "ding" sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Two-tone ascending notes (C to E) - pleasant and not annoying
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
    
    // Smooth fade in and out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    
    oscillator.type = 'sine';
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    
    console.log('✅ App started - notification sound played');
  } catch (e) {
    console.warn('Failed to play notification sound:', e);
  }
}

/**
 * Play a build error sound
 */
export function playErrorSound() {
  if (typeof window === 'undefined') return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Descending tone for error
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.linearRampToValueAtTime(200, now + 0.2);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
    
    oscillator.type = 'square';
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } catch (e) {
    console.warn('Failed to play error sound:', e);
  }
}

/**
 * Check if user has enabled notifications
 */
export function areNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const profile = localStorage.getItem('bolt_user_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      return parsed.notifications !== false; // Default to true
    }
  } catch (e) {
    console.warn('Failed to check notification settings:', e);
  }
  
  return true; // Default to enabled
}
