// Soft synthesized "grand door opening" sound: low wooden rumble, air whoosh, faint golden chime.
export const isSoundMuted = () => localStorage.getItem('sim_sound_muted') === '1';
export const setSoundMuted = (m: boolean) => localStorage.setItem('sim_sound_muted', m ? '1' : '0');

export function playDoorSound(delayMs = 500) {
  if (isSoundMuted()) return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx: AudioContext = new AC();
    const t0 = ctx.currentTime + delayMs / 1000;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.5, t0);
    master.connect(ctx.destination);

    // 1) low rumble — filtered noise with slow envelope
    const dur = 1.9;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(140, t0);
    lp.frequency.linearRampToValueAtTime(70, t0 + dur);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t0);
    ng.gain.exponentialRampToValueAtTime(0.35, t0 + 0.25);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    noise.connect(lp); lp.connect(ng); ng.connect(master);
    noise.start(t0); noise.stop(t0 + dur);

    // 2) air whoosh — bandpass sweep
    const wb = ctx.createBufferSource();
    wb.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(1.2, t0);
    bp.frequency.setValueAtTime(300, t0);
    bp.frequency.exponentialRampToValueAtTime(1800, t0 + 1.2);
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t0);
    wg.gain.exponentialRampToValueAtTime(0.12, t0 + 0.5);
    wg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
    wb.connect(bp); bp.connect(wg); wg.connect(master);
    wb.start(t0); wb.stop(t0 + 1.6);

    // 3) faint golden chime as light bursts through
    [523.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t0);
      const g = ctx.createGain();
      const ts = t0 + 0.55 + i * 0.09;
      g.gain.setValueAtTime(0.0001, ts);
      g.gain.exponentialRampToValueAtTime(0.06 / (i + 1), ts + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, ts + 1.6);
      o.connect(g); g.connect(master);
      o.start(ts); o.stop(ts + 1.7);
    });

    window.setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, delayMs + 2600);
  } catch { /* audio unavailable */ }
}
