import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface IntroOpeningProps {
  onComplete: () => void;
  appName?: string;
  subTitle?: string;
  logoUrl?: string;
}

export const IntroOpening: React.FC<IntroOpeningProps> = ({
  onComplete,
  appName = 'SIM SALAF AL-MALIKI',
  subTitle = 'PONDOK PESANTREN SALAF AL-MALIKI',
  logoUrl
}) => {
  const [stage, setStage] = useState<number>(0);
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Stage 1: Particles & ambient emerald depth glow
    const t1 = setTimeout(() => setStage(1), 100);
    // Stage 2: 3D Emblem rotation & scale-up with gold glow
    const t2 = setTimeout(() => setStage(2), 600);
    // Stage 3: Title & institution name reveal
    const t3 = setTimeout(() => setStage(3), 1200);
    // Stage 4: Fade-out transition to dashboard
    const t4 = setTimeout(() => {
      setFadingOut(true);
      setTimeout(onComplete, 600);
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#02110a] text-white select-none transition-opacity duration-700 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 45%, rgba(212, 175, 55, 0.18) 0%, transparent 55%),
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 60%),
          linear-gradient(180deg, #010c07 0%, #03190f 50%, #010a05 100%)
        `
      }}
    >
      {/* Decorative Islamic Geometric Star Grid Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Ambient Floating Light Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-[#d4af37]/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Skip Button (Top Right) */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 btn-luxury-dark text-[11px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1.5 opacity-80 hover:opacity-100 transition shadow-lg"
      >
        <span>LEWATI</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
      </button>

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg mx-auto">
        {/* Basmalah Calligraphy in Islamic Script */}
        <div
          className={`font-serif text-[#f4df96] text-lg sm:text-xl tracking-widest transition-all duration-700 ${
            stage >= 1 ? 'opacity-90 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
          style={{ fontFamily: "'Amiri', serif" }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        {/* 3D Islamic Emblem / Logo with Gold Glow */}
        <div
          className={`my-6 relative transition-all duration-1000 ease-out transform ${
            stage >= 2
              ? 'opacity-100 scale-100 rotate-0'
              : 'opacity-0 scale-75 -rotate-6'
          }`}
        >
          {/* Radial soft gold halo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#faebaa] to-emerald-400 blur-2xl opacity-40 animate-pulse" />

          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-b from-[#faebaa] via-[#d4af37] to-[#805f0d] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.4)] relative flex items-center justify-center transform transition hover:scale-105">
            <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-[#06301d] to-[#01140b] p-3 flex flex-col items-center justify-center border border-[#faebaa]/40">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Ponpes"
                  className="w-16 h-16 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#124d31] to-[#062416] border border-[#d4af37]/60 flex items-center justify-center shadow-inner">
                    <span className="font-serif font-black text-2xl text-[#f4df96] text-gold-3d">
                      م
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#d4af37] mt-1.5 font-mono">
                    SALAF AL-MALIKI
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Institution & App Title with Shimmer */}
        <div
          className={`space-y-2 transition-all duration-800 ease-out ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#082d1c]/90 border border-[#d4af37]/40 shadow">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[#faebaa]">
              {subTitle}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f7e49f] to-[#d4af37] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            {appName}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-200/90 font-medium tracking-wide max-w-sm mx-auto">
            SISTEM INFORMASI & ADMINISTRASI MADRASAH DINIYAH SALAFIYAH TERPADU
          </p>
        </div>

        {/* Subtle Loading / Progress Bar */}
        <div className="mt-8 w-48 h-1 bg-[#052617] rounded-full overflow-hidden border border-[#d4af37]/30 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] via-[#faebaa] to-emerald-400 rounded-full transition-all duration-[2600ms] ease-out"
            style={{ width: stage >= 1 ? '100%' : '5%' }}
          />
        </div>
        <span className="text-[10px] text-emerald-300/70 font-mono tracking-widest mt-2 uppercase">
          MEMUAT SISTEM TERPADU...
        </span>
      </div>
    </div>
  );
};
