import React from 'react';
import { AppSettings } from '../types';
import { resolveLogos } from '../brand';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Frame dimensions follow each logo's own aspect: round 1:1 (madrasah), wide ~2.2:1 (pondok).
const ROUND: Record<Size, string> = {
  xs: 'w-9 h-9', sm: 'w-11 h-11', md: 'w-16 h-16', lg: 'w-32 h-32 sm:w-40 sm:h-40', xl: 'w-40 h-40 sm:w-52 sm:h-52',
};
const WIDE: Record<Size, string> = {
  xs: 'w-20 h-9', sm: 'w-24 h-11', md: 'w-36 h-16', lg: 'w-56 h-[104px] sm:w-72 sm:h-[132px]', xl: 'w-72 h-[132px] sm:w-[22rem] sm:h-[164px]',
};
const PAD: Record<Size, string> = { xs: 'p-[2px]', sm: 'p-[2px]', md: 'p-[3px]', lg: 'p-[3px]', xl: 'p-[4px]' };
const RADIUS: Record<Size, string> = { xs: 'rounded-lg', sm: 'rounded-xl', md: 'rounded-2xl', lg: 'rounded-2xl', xl: 'rounded-3xl' };

interface LogoFrameProps { src: string; alt: string; shape: 'round' | 'wide'; size?: Size; testId?: string; className?: string; }

export const LogoFrame: React.FC<LogoFrameProps> = ({ src, alt, shape, size = 'sm', testId, className = '' }) => {
  const round = shape === 'round';
  const outer = round ? 'rounded-full' : RADIUS[size];
  const inner = round ? 'rounded-full' : 'rounded-[inherit]';
  const glow = size === 'lg' || size === 'xl'
    ? 'shadow-[0_20px_45px_rgba(0,0,0,0.8),0_0_34px_rgba(212,175,55,0.4)]'
    : 'shadow-[0_6px_16px_rgba(0,0,0,0.6),0_0_12px_rgba(212,175,55,0.3)]';
  return (
    <div data-testid={testId} className={`brand-logo-frame shrink-0 ${PAD[size]} ${outer} ${glow} bg-gradient-to-b from-[#fff2be] via-[#d4af37] to-[#7a5410] ${className}`}>
      <div className={`${inner} ${round ? ROUND[size] : WIDE[size]} bg-white overflow-hidden flex items-center justify-center`}>
        <img src={src} alt={alt} className="w-full h-full object-contain p-[4%]" onError={(e) => { (e.target as HTMLElement).style.visibility = 'hidden'; }} />
      </div>
    </div>
  );
};

interface BrandLogosProps { settings?: Partial<AppSettings> | null; size?: Size; gap?: string; className?: string; idPrefix?: string; }

export const BrandLogos: React.FC<BrandLogosProps> = ({ settings, size = 'sm', gap = 'gap-2.5', className = '', idPrefix = 'brand' }) => {
  const logos = resolveLogos(settings);
  return (
    <div className={`flex items-center ${gap} ${className}`} data-testid={`${idPrefix}-logos`}>
      <LogoFrame src={logos.madrasah} alt="Logo Madrasah Diniyah" shape="round" size={size} testId={`${idPrefix}-logo-madrasah`} />
      <LogoFrame src={logos.pondok} alt="Logo Pondok Pesantren" shape="wide" size={size} testId={`${idPrefix}-logo-pondok`} />
    </div>
  );
};
