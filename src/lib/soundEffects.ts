/**
 * Sound Effects Utility using Web Audio API
 * Generates an exclusive tactile metallic click sound on button press
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext not supported or disabled', e);
    return null;
  }
}

/**
 * Plays a rich, crisp metallic gold plaque click sound
 */
export function playPlaqueClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Initial High Transient "Metallic Tick"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.045);

    // 2. Body Mechanical Clack
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(320, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.065);

    // 3. Subtle Warm Golden Resonance Ring
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1760, now + 0.005); // A6 note
    gain3.gain.setValueAtTime(0.04, now + 0.005);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.005);
    osc3.stop(now + 0.13);
  } catch {
    // Non-blocking fallback
  }
}

/**
 * Initializes global event listener for all button clicks throughout the application
 */
export function initGlobalButtonClickSound() {
  if (typeof window === 'undefined') return;

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element is a button or inside a button / clickable interactive role
    const button = target.closest('button, a[role="button"], input[type="submit"], input[type="button"], .login-gold-btn, .btn-3d-gold, .btn-3d-hadir-yellow, .btn-3d-emerald, .btn-3d-dark, .btn-3d-danger');
    if (button) {
      playPlaqueClickSound();
    }
  };

  window.addEventListener('click', handleClick, { capture: true, passive: true });
}
