import React from 'react';

interface KaligrafiSalafHeaderProps {
  className?: string;
  subTitleClassName?: string;
}

export const KaligrafiSalafHeader: React.FC<KaligrafiSalafHeaderProps> = ({
  className = '',
  subTitleClassName = ''
}) => {
  return (
    <div className={`w-full flex flex-col items-center justify-center select-none ${className}`}>
      {/* 
        PREMIUM ISLAMIC CALLIGRAPHY BANNER (16:5 Aspect Ratio)
        Pure vector SVG implementation with multi-tone antique gold gradients,
        specular 3D lighting, and classical Thuluth calligraphy aesthetics.
      */}
      <div className="w-full max-w-[860px] mx-auto px-1 relative">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent blur-2xl pointer-events-none rounded-3xl transform scale-95" />

        <svg
          viewBox="0 0 1000 315"
          className="w-full h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 1. Rich Metallic 3D Gold Gradient for Main Calligraphy */}
            <linearGradient id="goldThuluthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff8db" />
              <stop offset="18%" stopColor="#ffea75" />
              <stop offset="38%" stopColor="#f5c738" />
              <stop offset="60%" stopColor="#d4a323" />
              <stop offset="82%" stopColor="#997010" />
              <stop offset="100%" stopColor="#573e04" />
            </linearGradient>

            {/* 2. Gold Highlight Stroke Gradient */}
            <linearGradient id="goldStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffde6" />
              <stop offset="50%" stopColor="#e5b839" />
              <stop offset="100%" stopColor="#6e4f07" />
            </linearGradient>

            {/* 3. Ornament & Flourish Gradient */}
            <linearGradient id="goldOrnamentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cda12f" />
              <stop offset="50%" stopColor="#fff3b0" />
              <stop offset="100%" stopColor="#cda12f" />
            </linearGradient>

            {/* 4. Filter for Specular 3D Depth & Shadow */}
            <filter id="gold3dDepth" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#011409" floodOpacity="0.85" />
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ffd700" floodOpacity="0.35" />
            </filter>

            {/* 5. Subtle Inner Background Vignette for Banner Frame */}
            <radialGradient id="emeraldBannerVignette" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#0a3d24" stopOpacity="0.88" />
              <stop offset="60%" stopColor="#042214" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#011008" stopOpacity="0.99" />
            </radialGradient>
          </defs>

          {/* Banner Container Frame with Elegant Islamic Emerald Velvet Theme */}
          <rect
            x="4"
            y="4"
            width="992"
            height="307"
            rx="24"
            fill="url(#emeraldBannerVignette)"
            stroke="url(#goldStrokeGrad)"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />

          {/* Corner Ornamental Accents */}
          <g stroke="url(#goldOrnamentGrad)" strokeWidth="1" fill="none" opacity="0.65">
            <path d="M 20 50 C 20 30, 30 20, 50 20 L 70 20" />
            <circle cx="20" cy="20" r="2.5" fill="#f5c738" />
            <path d="M 980 50 C 980 30, 970 20, 950 20 L 930 20" />
            <circle cx="980" cy="20" r="2.5" fill="#f5c738" />
            <path d="M 20 265 C 20 285, 30 295, 50 295 L 70 295" />
            <circle cx="20" cy="295" r="2.5" fill="#f5c738" />
            <path d="M 980 265 C 980 285, 970 295, 950 295 L 930 295" />
            <circle cx="980" cy="295" r="2.5" fill="#f5c738" />
          </g>

          {/* Side Arabesque Ornamental Flourishes */}
          <g fill="url(#goldOrnamentGrad)" opacity="0.85">
            {/* Left flourish */}
            <path d="M 65 110 C 85 95, 110 115, 130 110 C 115 118, 90 125, 65 110 Z" />
            <circle cx="55" cy="110" r="3" />
            {/* Right flourish */}
            <path d="M 935 110 C 915 95, 890 115, 870 110 C 885 118, 910 125, 935 110 Z" />
            <circle cx="945" cy="110" r="3" />
          </g>

          {/* MAIN CALLIGRAPHY: الْمَدْرَسَةُ الدِّينِيَّةُ الْإِسْلَامِيَّةُ الْمَالِكِيَّةُ */}
          <g filter="url(#gold3dDepth)">
            <text
              x="500"
              y="125"
              textAnchor="middle"
              fill="url(#goldThuluthGrad)"
              stroke="url(#goldStrokeGrad)"
              strokeWidth="0.8"
              style={{
                fontFamily: "'Amiri', 'Scheherazade New', 'Traditional Arabic', serif",
                fontSize: '66px',
                fontWeight: '700',
                letterSpacing: '1px',
                direction: 'rtl',
                unicodeBidi: 'bidi-override'
              }}
            >
              الْمَدْرَسَةُ الدِّينِيَّةُ الْإِسْلَامِيَّةُ الْمَالِكِيَّةُ
            </text>
          </g>

          {/* Decorative Divider Line with Diamond Center */}
          <g stroke="url(#goldOrnamentGrad)" strokeWidth="1" opacity="0.75">
            <line x1="220" y1="180" x2="460" y2="180" />
            <line x1="540" y1="180" x2="780" y2="180" />
            <polygon points="500,174 506,180 500,186 494,180" fill="#ffd700" stroke="#f5c738" strokeWidth="1" />
            <circle cx="475" cy="180" r="1.5" fill="#f5c738" />
            <circle cx="525" cy="180" r="1.5" fill="#f5c738" />
          </g>

          {/* LINE 1: MADRASAH DINNIYAH */}
          <text
            x="500"
            y="225"
            textAnchor="middle"
            fill="#fcfbf7"
            style={{
              fontFamily: "'Cinzel', 'Marcellus', 'Playfair Display', serif",
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '0.24em',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))'
            }}
          >
            MADRASAH DINNIYAH
          </text>

          {/* LINE 2: PONDOK PESANTREN SALAF AL-MALIKI PEKALONGAN */}
          <text
            x="500"
            y="268"
            textAnchor="middle"
            fill="#faeed3"
            style={{
              fontFamily: "'Cinzel', 'Marcellus', 'Playfair Display', serif",
              fontSize: '18px',
              fontWeight: '600',
              letterSpacing: '0.18em',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))'
            }}
          >
            PONDOK PESANTREN SALAF AL-MALIKI PEKALONGAN
          </text>
        </svg>
      </div>
    </div>
  );
};
