// Soft, synthesized ambient harmony for the cinematic intro.
// Built with the Web Audio API (no external asset). Gently fades in and out.
export interface AmbientHandle {
  ensureStarted: () => void;
  fadeOut: (seconds?: number) => void;
  setMuted: (m: boolean) => void;
  dispose: () => void;
}

export function createAmbient(targetGain = 0.06): AmbientHandle {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let started = false;
  let muted = false;
  let swellTimer: number | null = null;

  // A calm, consonant chord (low + mid partials) for a scholarly, meditative feel.
  const voices = [130.81, 196.0, 261.63, 329.63, 392.0];

  const ensureStarted = () => {
    if (started) return;
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.Q.setValueAtTime(0.6, ctx.currentTime);
      filter.connect(master);
      master.connect(ctx.destination);

      voices.forEach((freq, i) => {
        const osc = ctx!.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx!.currentTime);
        osc.detune.setValueAtTime((i - 2) * 4, ctx!.currentTime);
        const vg = ctx!.createGain();
        vg.gain.setValueAtTime(i === 0 ? 1 : 0.55 / (i + 0.5), ctx!.currentTime);
        osc.connect(vg);
        vg.connect(filter);
        osc.start();

        // slow individual detune drift for a "living" shimmer
        const lfo = ctx!.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.05 + i * 0.02, ctx!.currentTime);
        const lfoGain = ctx!.createGain();
        lfoGain.gain.setValueAtTime(3, ctx!.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);
        lfo.start();
      });

      // fade in
      master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : targetGain, ctx.currentTime + 4);

      // gentle breathing swell
      swellTimer = window.setInterval(() => {
        if (!ctx || !master || muted) return;
        const t = ctx.currentTime;
        const up = targetGain * 1.25;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(up, t + 4);
        master.gain.linearRampToValueAtTime(targetGain, t + 8);
      }, 8000);

      started = true;
    } catch (e) {
      /* audio unavailable — silently ignore */
    }
  };

  const setMuted = (m: boolean) => {
    muted = m;
    if (ctx && master) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
      master.gain.exponentialRampToValueAtTime(m ? 0.0001 : targetGain, t + 0.6);
    }
  };

  const fadeOut = (seconds = 0.7) => {
    if (ctx && master) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    }
  };

  const dispose = () => {
    if (swellTimer) window.clearInterval(swellTimer);
    fadeOut(0.4);
    window.setTimeout(() => {
      try { ctx?.close(); } catch (e) { /* noop */ }
      ctx = null; master = null; started = false;
    }, 500);
  };

  return { ensureStarted, fadeOut, setMuted, dispose };
}
