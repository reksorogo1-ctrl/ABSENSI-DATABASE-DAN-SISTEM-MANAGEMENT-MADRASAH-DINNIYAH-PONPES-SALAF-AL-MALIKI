import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { LOGO_MADRASAH, LOGO_PONDOK } from '../brand';

interface DoorTransitionProps {
  onComplete: () => void;
  logoUrl?: string;
}

const panelBg =
  'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.14) 0%, transparent 60%), linear-gradient(160deg,#063a24 0%,#031d12 55%,#010b06 100%)';

const LogoFrame: React.FC<{ src: string; round?: boolean; testId: string }> = ({ src, round, testId }) => (
  <div
    data-testid={testId}
    className={`door-logo-frame p-[4px] ${round ? 'rounded-full' : 'rounded-3xl'} bg-gradient-to-b from-[#fff2be] via-[#d4af37] to-[#7a5410] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(212,175,55,0.45)]`}
  >
    <div className={`${round ? 'rounded-full w-40 h-40 sm:w-52 sm:h-52' : 'rounded-[20px] w-56 h-40 sm:w-72 sm:h-52'} bg-white overflow-hidden flex items-center justify-center border-2 border-[#06331f]`}>
      <img src={src} alt="" className="w-full h-full object-contain p-1.5" />
    </div>
  </div>
);

// Luxurious 3D sliding-door reveal played right after a successful login.
// Two vertical panels slide apart (left <- , -> right) unveiling the dashboard behind.
export const DoorTransition: React.FC<DoorTransitionProps> = ({ onComplete }) => {
  useEffect(() => {
    const t = window.setTimeout(onComplete, 2100);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  const door = { duration: 1.35, ease: [0.76, 0, 0.24, 1] as [number, number, number, number], delay: 0.55 };

  return (
    <div className="fixed inset-0 z-[100000] pointer-events-none overflow-hidden" style={{ perspective: '1600px' }} data-testid="door-transition">
      {/* LEFT DOOR */}
      <motion.div
        initial={{ x: '0%', rotateY: 0 }}
        animate={{ x: '-100.5%', rotateY: 14 }}
        transition={door}
        className="absolute top-0 left-0 h-full w-1/2 origin-left"
        style={{ background: panelBg, borderRight: '2px solid rgba(212,175,55,0.6)', boxShadow: '30px 0 80px rgba(0,0,0,0.7), inset -6px 0 24px rgba(0,0,0,0.65), inset 2px 0 2px rgba(212,175,55,0.35)', transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#faebaa_1px,transparent_1px)] [background-size:26px_26px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute top-1/2 right-8 sm:right-14 -translate-y-1/2"
        >
          <LogoFrame src={LOGO_MADRASAH} round testId="door-logo-madrasah" />
        </motion.div>
      </motion.div>

      {/* RIGHT DOOR */}
      <motion.div
        initial={{ x: '0%', rotateY: 0 }}
        animate={{ x: '100.5%', rotateY: -14 }}
        transition={door}
        className="absolute top-0 right-0 h-full w-1/2 origin-right"
        style={{ background: panelBg, borderLeft: '2px solid rgba(212,175,55,0.6)', boxShadow: '-30px 0 80px rgba(0,0,0,0.7), inset 6px 0 24px rgba(0,0,0,0.65), inset -2px 0 2px rgba(212,175,55,0.35)', transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#faebaa_1px,transparent_1px)] [background-size:26px_26px]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.08 }}
          className="absolute top-1/2 left-8 sm:left-14 -translate-y-1/2"
        >
          <LogoFrame src={LOGO_PONDOK} testId="door-logo-pondok" />
        </motion.div>
      </motion.div>

      {/* CENTER SEAM LIGHT BURST */}
      <motion.div
        initial={{ opacity: 0.9, scaleY: 1 }}
        animate={{ opacity: 0, scaleY: 1.2 }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.6 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-24"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,244,205,0.85), transparent)', filter: 'blur(6px)' }}
      />
    </div>
  );
};
