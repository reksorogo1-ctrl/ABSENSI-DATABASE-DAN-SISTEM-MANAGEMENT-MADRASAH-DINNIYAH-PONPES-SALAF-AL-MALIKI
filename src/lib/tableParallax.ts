/**
 * Physical 3D Table Interactive Parallax & Compression Controller
 * Adds smooth cursor-tracking tilt (1-2 degrees), physical hover elevation,
 * specular reflection tracking, and click/touch compression.
 * Non-invasive: Never blocks clicks, inputs, or table operations.
 * Mobile responsive: Automatically disables tilt on touch devices.
 */

export function initTablePhysicalParallax() {
  if (typeof window === 'undefined') return () => {};

  // Check if device has fine pointer and hover support (desktop)
  const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isDesktopPointer) {
    // On mobile devices, tilt is disabled for smooth 60fps performance
    return () => {};
  }

  let rafId: number | null = null;
  let latestEvent: PointerEvent | null = null;

  const updateParallax = () => {
    if (!latestEvent) return;
    const target = (latestEvent.target as HTMLElement)?.closest('.table-3d-stack') as HTMLElement | null;
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = (latestEvent.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (latestEvent.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

      // Ultra-subtle tilt: max 1.2 - 1.6 degrees
      const tiltY = +(x * 1.8).toFixed(2);
      const tiltX = +(-y * 1.6).toFixed(2);
      const mousePctX = Math.round((x + 0.5) * 100);
      const mousePctY = Math.round((y + 0.5) * 100);

      target.style.setProperty('--tilt-x', `${tiltX}deg`);
      target.style.setProperty('--tilt-y', `${tiltY}deg`);
      target.style.setProperty('--mouse-x', `${mousePctX}%`);
      target.style.setProperty('--mouse-y', `${mousePctY}%`);
    }
    rafId = null;
  };

  const handlePointerMove = (e: PointerEvent) => {
    latestEvent = e;
    if (!rafId) {
      rafId = requestAnimationFrame(updateParallax);
    }
  };

  const handlePointerLeave = (e: PointerEvent) => {
    const target = (e.target as HTMLElement)?.closest('.table-3d-stack') as HTMLElement | null;
    if (!target) return;

    target.style.setProperty('--tilt-x', '0deg');
    target.style.setProperty('--tilt-y', '0deg');
    target.style.setProperty('--mouse-x', '50%');
    target.style.setProperty('--mouse-y', '50%');
  };

  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('pointerout', handlePointerLeave, { passive: true });

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerout', handlePointerLeave);
  };
}
