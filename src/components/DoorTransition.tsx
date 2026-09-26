import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

interface DoorTransitionProps {
  onComplete: () => void;
  logoUrl?: string;
}

// Luxurious 3D sliding-door reveal played right after a successful login.
// Two vertical panels slide apart (left <- , -> right) unveiling the dashboard behind.
export const DoorTransition: React.FC<DoorTransitionProps> = ({ onComplete, logoUrl }) => {
  useEffect(() => {
    const t = window.setTimeout(onComplete, 1750);
    return () => window.clearTimeout(t);
  }, [onComplete]);

  const panelBg =
    'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.14) 0%, transparent 60%), linear-gradient(160deg,#063a24 0%,#031d12 55%,#010b06 100%)';

  return (
    <div className="fixed inset-0 z-[100000] pointer-events-none overflow-hidden" style={{ perspective: '1600px' }} data-testid="door-transition">
      {/* LEFT DOOR */}
      <motion.div
        initial={{ x: '0%', rotateY: 0 }}
        animate={{ x: '-100.5%', rotateY: 14 }}
        transition={{ duration: 1.35, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        className="absolute top-0 left-0 h-full w-1/2 origin-left"
        style={{
          background: panelBg,
          borderRight: '2px solid rgba(212,175,55,0.6)',
          boxShadow: '30px 0 80px rgba(0,0,0,0.7), inset -6px 0 24px rgba(0,0,0,0.65), inset 2px 0 2px rgba(212,175,55,0.35)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#faebaa_1px,transparent_1px)] [background-size:26px_26px]" />
        <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col items-end gap-2 pr-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[#faebaa] to-[#a47d12] flex items-center justify-center shadow-2xl overflow-hidden">
            {logoUrl ? <img src={logoUrl} alt="" className="w-9 h-9 object-contain" /> : <ShieldCheck className="w-7 h-7 text-[#06331f]" />}
          </div>
        </div>
      </motion.div>

      {/* RIGHT DOOR */}
      <motion.div
        initial={{ x: '0%', rotateY: 0 }}
        animate={{ x: '100.5%', rotateY: -14 }}
        transition={{ duration: 1.35, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
        className="absolute top-0 right-0 h-full w-1/2 origin-right"
        style={{
          background: panelBg,
          borderLeft: '2px solid rgba(212,175,55,0.6)',
          boxShadow: '-30px 0 80px rgba(0,0,0,0.7), inset 6px 0 24px rgba(0,0,0,0.65), inset -2px 0 2px rgba(212,175,55,0.35)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#faebaa_1px,transparent_1px)] [background-size:26px_26px]" />
      </motion.div>

      {/* CENTER SEAM LIGHT BURST */}
      <motion.div
        initial={{ opacity: 0.9, scaleY: 1 }}
        animate={{ opacity: 0, scaleY: 1.2 }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-24"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,244,205,0.85), transparent)', filter: 'blur(6px)' }}
      />
    </div>
  );
};
