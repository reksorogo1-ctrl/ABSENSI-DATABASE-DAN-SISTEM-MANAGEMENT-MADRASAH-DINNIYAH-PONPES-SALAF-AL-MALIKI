import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ============================================================================
   1. 3D NUMERIC TYPOGRAPHY & KPI CARDS (COUNT-UP + METALLIC EXTRUSION + DELTA)
   ============================================================================ */

export type KpiTheme = 'emerald' | 'gold' | 'cyan' | 'amber';

export interface Kpi3DCardProps {
  label: string;
  value: number;
  suffix?: string;
  subtitle: string;
  delta?: number; // e.g. +18.5 or -2.4
  deltaLabel?: string;
  theme?: KpiTheme;
  icon?: React.ReactNode;
  index?: number;
  onClick?: () => void;
}

const THEME_STYLES: Record<
  KpiTheme,
  {
    topGlow: string;
    gradientText: string;
    extrudeShadow: string;
    iconWrap: string;
    borderAccent: string;
  }
> = {
  emerald: {
    topGlow: 'from-transparent via-emerald-400/90 to-transparent',
    gradientText: 'from-white via-emerald-200 to-emerald-400',
    extrudeShadow:
      '0 1px 0 #065f46, 0 2px 0 #064e3b, 0 3px 0 #022c22, 0 6px 14px rgba(0,0,0,0.65)',
    iconWrap: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300',
    borderAccent: 'hover:border-emerald-400/50',
  },
  gold: {
    topGlow: 'from-transparent via-[#D4AF37] to-transparent',
    gradientText: 'from-[#FFF9DB] via-[#F5D76E] to-[#D4AF37]',
    extrudeShadow:
      '0 1px 0 #b8921f, 0 2px 0 #8a6a10, 0 3px 0 #5c4508, 0 6px 14px rgba(0,0,0,0.65)',
    iconWrap: 'bg-[#D4AF37]/15 border-[#D4AF37]/45 text-[#F5D76E]',
    borderAccent: 'hover:border-[#D4AF37]/60',
  },
  cyan: {
    topGlow: 'from-transparent via-teal-300/90 to-transparent',
    gradientText: 'from-white via-teal-100 to-emerald-300',
    extrudeShadow:
      '0 1px 0 #0f766e, 0 2px 0 #115e59, 0 3px 0 #134e4a, 0 6px 14px rgba(0,0,0,0.65)',
    iconWrap: 'bg-teal-500/15 border-teal-400/40 text-teal-200',
    borderAccent: 'hover:border-teal-400/50',
  },
  amber: {
    topGlow: 'from-transparent via-amber-300/90 to-transparent',
    gradientText: 'from-amber-100 via-amber-300 to-[#D4AF37]',
    extrudeShadow:
      '0 1px 0 #b45309, 0 2px 0 #92400e, 0 3px 0 #78350f, 0 6px 14px rgba(0,0,0,0.65)',
    iconWrap: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    borderAccent: 'hover:border-amber-400/50',
  },
};

function useCountUp(target: number, durationMs = 850): number {
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? target : 0;
    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(safeTarget * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplay(safeTarget);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return display;
}

export const Kpi3DCard: React.FC<Kpi3DCardProps> = ({
  label,
  value,
  suffix = '',
  subtitle,
  delta,
  deltaLabel,
  theme = 'emerald',
  icon,
  index = 0,
  onClick,
}) => {
  const animatedVal = useCountUp(value, 800 + index * 100);
  const style = THEME_STYLES[theme];
  const isPositive = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`cyber-kpi-card group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#082E22] via-[#052017] to-[#03140E] border-t border-l border-emerald-400/30 border-b-2 border-r border-black/60 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5),0_4px_10px_-2px_rgba(16,185,129,0.08)] hover:-translate-y-1 hover:shadow-[0_15px_30px_-5px_rgba(16,185,129,0.18)] active:scale-[0.98] transition-all duration-300 ease-out p-5 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top-Left Soft Specular Light Reflection */}
      <div
        className="absolute -top-10 -left-10 w-36 h-36 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.16) 0%, transparent 70%)',
        }}
      />

      {/* Glowing Top Rim Line */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${style.topGlow} opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />

      {/* Subtle Sheen Sweep on Hover (Pure GPU transform) */}
      <div className="kpi-sheen-bar" />

      {/* Top Row: Label + Glossy 3D Icon Well */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D1FAE5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
          {label}
        </span>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-b from-emerald-500/20 to-emerald-950/60 border-t border-l border-emerald-300/30 border-b border-r border-black/60 shadow-inner flex items-center justify-center shrink-0 ${style.iconWrap}`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* 3D Extruded Numeric Counter + Raised 3D Delta Badge */}
      <div className="mt-3 flex items-end justify-between gap-2 flex-wrap relative z-10">
        <div className="relative inline-block leading-none select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]">
          {/* Extruded 3D Depth Layer */}
          <span
            aria-hidden="true"
            className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-transparent"
            style={{ textShadow: style.extrudeShadow }}
          >
            {animatedVal.toLocaleString('id-ID')}
            {suffix}
          </span>
          {/* Metallic / Gold / Emerald Specular Top Layer */}
          <span
            className={`absolute inset-0 text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight bg-gradient-to-b ${style.gradientText} bg-clip-text text-transparent`}
          >
            {animatedVal.toLocaleString('id-ID')}
            {suffix}
          </span>
        </div>

        {typeof delta === 'number' && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold tabular-nums border-t border-l border-b-2 border-r drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] ${
              isPositive
                ? 'bg-gradient-to-b from-emerald-500/25 to-emerald-950/75 border-t-emerald-300/40 border-l-emerald-400/30 border-b-black/65 border-r-black/55 text-emerald-200 shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
                : 'bg-gradient-to-b from-rose-500/25 to-rose-950/75 border-t-rose-300/40 border-l-rose-400/30 border-b-black/65 border-r-black/55 text-rose-200 shadow-[0_4px_10px_rgba(0,0,0,0.45)]'
            }`}
          >
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>
              {isPositive ? '+' : ''}
              {delta.toFixed(1)}%
            </span>
          </span>
        )}
      </div>

      {/* Supporting Caption */}
      <div className="mt-3 pt-2.5 border-t border-emerald-500/15 flex items-center justify-between gap-2 text-[11px] text-[#D1FAE5]/85">
        <span className="truncate">{subtitle}</span>
        {deltaLabel && (
          <span className="text-[10px] font-mono text-[#D4AF37] shrink-0">{deltaLabel}</span>
        )}
      </div>
    </motion.div>
  );
};

/* ============================================================================
   2. 3D PIE CHART (DIAGRAM LINGKARAN TIMBUL + EXTRUDED CYLINDER + INTERACTIVE)
   ============================================================================ */

export interface Pie3DSlice {
  name: string;
  value: number;
  fill: string;
}

interface Pie3DChartProps {
  data: Pie3DSlice[];
  unitLabel?: string;
}

function darkenHex(hex: string, factor = 0.55): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#032016';
  const r = Math.max(0, Math.round(parseInt(clean.slice(0, 2), 16) * factor));
  const g = Math.max(0, Math.round(parseInt(clean.slice(2, 4), 16) * factor));
  const b = Math.max(0, Math.round(parseInt(clean.slice(4, 6), 16) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}

function lightenHex(hex: string, amount = 0.25): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#34d399';
  const r = Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) + (255 - parseInt(clean.slice(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) + (255 - parseInt(clean.slice(2, 4), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) + (255 - parseInt(clean.slice(4, 6), 16)) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export const Pie3DChart: React.FC<Pie3DChartProps> = ({ data, unitLabel = '' }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const uid = useMemo(() => `pie3d-${Math.random().toString(36).slice(2, 8)}`, []);

  const slices = useMemo(() => {
    const valid = data.filter((d) => d.value > 0);
    const source = valid.length > 0 ? valid : [{ name: 'Belum Ada Data', value: 1, fill: '#10b981' }];
    const total = source.reduce((acc, s) => acc + s.value, 0) || 1;
    let currentAngle = -Math.PI / 2;

    return source.map((s, idx) => {
      const ratio = s.value / total;
      const sweep = ratio * Math.PI * 2;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      const midAngle = startAngle + sweep / 2;
      currentAngle = endAngle;
      return {
        ...s,
        idx,
        total,
        pct: Math.round(ratio * 100),
        startAngle,
        endAngle,
        midAngle,
        isFullCircle: ratio >= 0.999,
      };
    });
  }, [data]);

  const cx = 150;
  const cy = 92;
  const rx = 104;
  const ry = 76;
  const depth = 22;

  const describeTopWedge = (startA: number, endA: number, isFull: boolean) => {
    if (isFull) {
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    }
    const x1 = cx + rx * Math.cos(startA);
    const y1 = cy + ry * Math.sin(startA);
    const x2 = cx + rx * Math.cos(endA);
    const y2 = cy + ry * Math.sin(endA);
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  };

  const describeSideWall = (startA: number, endA: number, isFull: boolean) => {
    if (isFull) {
      // Bottom visible front half from 0 to PI
      const x1 = cx + rx;
      const y1 = cy;
      const x2 = cx - rx;
      const y2 = cy;
      return `M ${x1} ${y1} A ${rx} ${ry} 0 0 1 ${x2} ${y2} L ${x2} ${y2 + depth} A ${rx} ${ry} 0 0 0 ${x1} ${y1 + depth} Z`;
    }
    const x1 = cx + rx * Math.cos(startA);
    const y1 = cy + ry * Math.sin(startA);
    const x2 = cx + rx * Math.cos(endA);
    const y2 = cy + ry * Math.sin(endA);
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x2.toFixed(2)} ${(y2 + depth).toFixed(2)} A ${rx} ${ry} 0 ${largeArc} 0 ${x1.toFixed(2)} ${(y1 + depth).toFixed(2)} Z`;
  };

  const activeSlice = activeIndex !== null ? slices[activeIndex] : null;
  const primarySlice = slices[0];

  return (
    <div className="w-full flex flex-col items-center gap-4 relative" data-testid="donut-3d">
      {/* Floating Glass Tooltip on Hover / Tap */}
      <AnimatePresence>
        {activeSlice && (
          <motion.div
            key={activeSlice.name}
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute top-0 right-1 z-20 px-3.5 py-2 rounded-xl bg-gradient-to-br from-[#093426] via-[#052017] to-[#03140E] border-t border-l border-amber-400/40 border-b-2 border-r border-black/65 shadow-[0_12px_26px_-5px_rgba(0,0,0,0.72),0_4px_10px_-2px_rgba(16,185,129,0.14)] pointer-events-none"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeSlice.fill, boxShadow: `0 0 8px ${activeSlice.fill}` }}
              />
              <span>{activeSlice.name}</span>
            </div>
            <div className="text-[11px] font-mono font-extrabold text-[#D4AF37] tabular-nums mt-0.5">
              {activeSlice.value} {unitLabel} ({activeSlice.pct}%)
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Perspective Stage */}
      <div
        className="w-full max-w-[320px] flex justify-center items-center"
        style={{ perspective: '900px' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
          style={{
            transform: 'rotateX(25deg)',
            transformStyle: 'preserve-3d',
            filter: 'drop-shadow(0 18px 20px rgba(0, 0, 0, 0.5))',
          }}
        >
          <svg viewBox="0 0 300 205" className="w-full h-auto overflow-visible">
            <defs>
              {slices.map((s) => (
                <React.Fragment key={`${uid}-grad-${s.idx}`}>
                  <radialGradient id={`${uid}-top-${s.idx}`} cx="35%" cy="28%" r="75%">
                    <stop offset="0%" stopColor={lightenHex(s.fill, 0.38)} />
                    <stop offset="65%" stopColor={s.fill} />
                    <stop offset="100%" stopColor={darkenHex(s.fill, 0.78)} />
                  </radialGradient>
                  <linearGradient id={`${uid}-side-${s.idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={darkenHex(s.fill, 0.65)} />
                    <stop offset="100%" stopColor={darkenHex(s.fill, 0.34)} />
                  </linearGradient>
                </React.Fragment>
              ))}
            </defs>

            {/* Soft Floor Ambient Ring */}
            <ellipse
              cx={cx}
              cy={cy + depth + 10}
              rx={rx + 6}
              ry={ry * 0.85}
              fill="rgba(0, 0, 0, 0.42)"
            />

            {/* Extruded 3D Slices */}
            {slices.map((s) => {
              const isActive = activeIndex === s.idx;
              const popDist = isActive ? 11 : 0;
              const dx = Math.cos(s.midAngle) * popDist;
              const dy = Math.sin(s.midAngle) * (popDist * 0.75) - (isActive ? 7 : 0);

              return (
                <motion.g
                  key={s.name}
                  animate={{ x: dx, y: dy }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  onMouseEnter={() => setActiveIndex(s.idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => setActiveIndex(isActive ? null : s.idx)}
                  className="cursor-pointer"
                >
                  {/* Cylindrical 3D Depth Extrusion Wall */}
                  <path
                    d={describeSideWall(s.startAngle, s.endAngle, s.isFullCircle)}
                    fill={`url(#${uid}-side-${s.idx})`}
                    stroke="rgba(4, 26, 19, 0.55)"
                    strokeWidth="0.8"
                  />
                  {/* Lit Top Surface */}
                  <path
                    d={describeTopWedge(s.startAngle, s.endAngle, s.isFullCircle)}
                    fill={`url(#${uid}-top-${s.idx})`}
                    stroke={isActive ? '#FDE047' : 'rgba(255, 255, 255, 0.25)'}
                    strokeWidth={isActive ? 1.8 : 0.9}
                  />
                </motion.g>
              );
            })}

            {/* Center Metallic Emblem Readout */}
            <ellipse
              cx={cx}
              cy={cy + 3}
              rx={38}
              ry={27}
              fill="rgba(4, 26, 19, 0.9)"
              stroke="rgba(212, 175, 55, 0.55)"
              strokeWidth="1.4"
            />
            <text
              x={cx}
              y={cy + 2}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="19"
              fontWeight="800"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {(activeSlice ?? primarySlice)?.pct ?? 0}%
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              fill="#D4AF37"
              fontSize="8.5"
              fontWeight="700"
              letterSpacing="1.2"
            >
              {((activeSlice ?? primarySlice)?.name ?? '').toUpperCase().slice(0, 11)}
            </text>
          </svg>
        </motion.div>
      </div>

      {/* Interactive Glass Legend */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {slices.map((s) => {
          const isActive = activeIndex === s.idx;
          return (
            <motion.button
              key={s.name}
              type="button"
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => setActiveIndex(s.idx)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(isActive ? null : s.idx)}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition ${
                isActive
                  ? 'bg-emerald-900/75 border-[#D4AF37]/70 shadow-md'
                  : 'bg-[#041A13]/75 border-emerald-500/20 hover:border-emerald-400/40'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: s.fill, boxShadow: `0 0 8px ${s.fill}` }}
                />
                <span className="text-xs font-bold text-white truncate">{s.name}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-[#D1FAE5] tabular-nums shrink-0">
                {s.value} · {s.pct}%
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   3. 3D FLOATING GLOWING SPLINE LINE CHART (4PX TUBE + 3D SPHERE NODES + TAG)
   ============================================================================ */

export interface TrendPoint {
  tanggal: string;
  hadirSantri: number;
  hadirGuru: number;
  santriAbsen?: number;
  totalSantri?: number;
  guruAbsen?: number;
  totalGuru?: number;
}

interface Line3DChartProps {
  data: TrendPoint[];
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const Line3DChart: React.FC<Line3DChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const uid = useMemo(() => `line3d-${Math.random().toString(36).slice(2, 8)}`, []);

  const safeData = useMemo(() => {
    if (data && data.length > 0) return data.slice(-12);
    return [
      { tanggal: 'Hari 1', hadirSantri: 0, hadirGuru: 0 },
      { tanggal: 'Hari 2', hadirSantri: 0, hadirGuru: 0 },
    ];
  }, [data]);

  const width = 640;
  const height = 270;
  const padL = 38;
  const padR = 72; // room for floating right-side neon value tag
  const padT = 26;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const getX = (i: number) =>
    safeData.length === 1
      ? padL + plotW / 2
      : padL + (i / (safeData.length - 1)) * plotW;
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Number(val) || 0));
    return padT + plotH - (clamped / 100) * plotH;
  };

  const santriPts = safeData.map((d, i) => ({ x: getX(i), y: getY(d.hadirSantri) }));
  const guruPts = safeData.map((d, i) => ({ x: getX(i), y: getY(d.hadirGuru) }));

  const santriLine = buildSmoothPath(santriPts);
  const guruLine = buildSmoothPath(guruPts);

  const baselineY = padT + plotH;
  const santriArea =
    santriPts.length > 0
      ? `${santriLine} L ${santriPts[santriPts.length - 1].x.toFixed(1)} ${baselineY} L ${santriPts[0].x.toFixed(1)} ${baselineY} Z`
      : '';
  const guruArea =
    guruPts.length > 0
      ? `${guruLine} L ${guruPts[guruPts.length - 1].x.toFixed(1)} ${baselineY} L ${guruPts[0].x.toFixed(1)} ${baselineY} Z`
      : '';

  const latestIdx = safeData.length - 1;
  const latestSantri = safeData[latestIdx]?.hadirSantri ?? 0;
  const latestGuru = safeData[latestIdx]?.hadirGuru ?? 0;
  const latestSantriPt = santriPts[latestIdx];
  const latestGuruPt = guruPts[latestIdx];
  // Avoid overlap between the two floating tags on the right
  const santriTagY = latestSantriPt ? latestSantriPt.y : padT + 20;
  const rawGuruTagY = latestGuruPt ? latestGuruPt.y : padT + 50;
  const guruTagY =
    Math.abs(rawGuruTagY - santriTagY) < 22
      ? Math.min(baselineY - 8, santriTagY + 24)
      : rawGuruTagY;

  const activePoint = hoveredIdx !== null ? safeData[hoveredIdx] : null;

  return (
    <div className="w-full relative select-none">
      {/* Floating Glass Tooltip */}
      <AnimatePresence>
        {activePoint && hoveredIdx !== null && (
          <motion.div
            key={activePoint.tanggal}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="absolute top-1 left-2 z-20 px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-[#093426] via-[#052017] to-[#03140E] border-t border-l border-amber-400/40 border-b-2 border-r border-black/65 shadow-[0_12px_26px_-5px_rgba(0,0,0,0.72),0_4px_10px_-2px_rgba(16,185,129,0.14)] pointer-events-none text-xs"
          >
            <div className="font-bold text-[#D4AF37] pb-1 mb-1 border-b border-emerald-500/20">
              {activePoint.tanggal}
            </div>
            <div className="flex items-center justify-between gap-4 text-white tabular-nums">
              <span className="flex items-center gap-1.5 text-[#D1FAE5]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Santri
              </span>
              <span className="font-extrabold font-mono text-emerald-300">
                {activePoint.hadirSantri}%
                {activePoint.totalSantri ? ` (${activePoint.santriAbsen ?? 0}/${activePoint.totalSantri})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-white tabular-nums mt-0.5">
              <span className="flex items-center gap-1.5 text-[#D1FAE5]">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                Ustadz
              </span>
              <span className="font-extrabold font-mono text-[#F5D76E]">
                {activePoint.hadirGuru}%
                {activePoint.totalGuru ? ` (${activePoint.guruAbsen ?? 0}/${activePoint.totalGuru})` : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full overflow-x-auto no-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[320px] overflow-visible">
          <defs>
            {/* Glowing Translucent Area Gradients */}
            <linearGradient id={`${uid}-area-santri`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.42" />
              <stop offset="65%" stopColor="#059669" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#041A13" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${uid}-area-guru`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.34" />
              <stop offset="70%" stopColor="#B48415" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#041A13" stopOpacity="0" />
            </linearGradient>

            {/* 3D Tube Pipe Gradients */}
            <linearGradient id={`${uid}-tube-santri`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>
            <linearGradient id={`${uid}-tube-guru`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>

            {/* 3D Glossy Spherical Node Gradients */}
            <radialGradient id={`${uid}-sphere-santri`} cx="32%" cy="28%" r="68%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#6EE7B7" />
              <stop offset="75%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#064E3B" />
            </radialGradient>
            <radialGradient id={`${uid}-sphere-guru`} cx="32%" cy="28%" r="68%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#FEF08A" />
              <stop offset="75%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#713F12" />
            </radialGradient>

            {/* Neon Tube Bloom Filter */}
            <filter id={`${uid}-glow-emerald`} x="-15%" y="-30%" width="130%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10B981" floodOpacity="0.7" />
              <feDropShadow dx="0" dy="9" stdDeviation="4" floodColor="#000000" floodOpacity="0.65" />
            </filter>
            <filter id={`${uid}-glow-gold`} x="-15%" y="-30%" width="130%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#D4AF37" floodOpacity="0.65" />
              <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Subtle Horizontal Grid Lines & Y-Axis */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                  stroke="rgba(16, 185, 129, 0.14)"
                  strokeDasharray="3 4"
                />
                <text
                  x={padL - 7}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#D1FAE5"
                  opacity="0.75"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Translucent Glowing Areas */}
          <path d={guruArea} fill={`url(#${uid}-area-guru)`} />
          <path d={santriArea} fill={`url(#${uid}-area-santri)`} />

          {/* Secondary Deep Floating Shadow Beneath Splines */}
          <path
            d={guruLine}
            fill="none"
            stroke="rgba(0,0,0,0.45)"
            strokeWidth="5"
            transform="translate(0, 12)"
          />
          <path
            d={santriLine}
            fill="none"
            stroke="rgba(0,0,0,0.52)"
            strokeWidth="5"
            transform="translate(0, 14)"
          />

          {/* 3D Floating Tube Spline: Guru (Gold) */}
          <motion.path
            d={guruLine}
            fill="none"
            stroke={`url(#${uid}-tube-guru)`}
            strokeWidth="4"
            strokeLinecap="round"
            filter={`url(#${uid}-glow-gold)`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Top Specular Pipe Highlight: Guru */}
          <path
            d={guruLine}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1.1"
            strokeLinecap="round"
            transform="translate(0, -1)"
          />

          {/* 3D Floating Tube Spline: Santri (Cyber-Emerald) */}
          <motion.path
            d={santriLine}
            fill="none"
            stroke={`url(#${uid}-tube-santri)`}
            strokeWidth="4"
            strokeLinecap="round"
            filter={`url(#${uid}-glow-emerald)`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Top Specular Pipe Highlight: Santri */}
          <path
            d={santriLine}
            fill="none"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="1.2"
            strokeLinecap="round"
            transform="translate(0, -1)"
          />

          {/* Hover Vertical Laser Guide */}
          {hoveredIdx !== null && santriPts[hoveredIdx] && (
            <line
              x1={santriPts[hoveredIdx].x}
              y1={padT}
              x2={santriPts[hoveredIdx].x}
              y2={baselineY}
              stroke="rgba(16, 185, 129, 0.55)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
          )}

          {/* 3D Glossy Spherical Nodes + Latest Node Pulse */}
          {guruPts.map((pt, i) => {
            const isLatest = i === latestIdx;
            const isActive = hoveredIdx === i;
            return (
              <g key={`g-node-${i}`}>
                {isLatest && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={10}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                    className="cyber-node-pulse"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive || isLatest ? 5.5 : 4.2}
                  fill={`url(#${uid}-sphere-guru)`}
                  stroke="rgba(4,26,19,0.7)"
                  strokeWidth="0.8"
                />
              </g>
            );
          })}

          {santriPts.map((pt, i) => {
            const isLatest = i === latestIdx;
            const isActive = hoveredIdx === i;
            return (
              <g key={`s-node-${i}`}>
                {isLatest && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={11}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.6"
                    className="cyber-node-pulse"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive || isLatest ? 6 : 4.5}
                  fill={`url(#${uid}-sphere-santri)`}
                  stroke="rgba(4,26,19,0.7)"
                  strokeWidth="0.8"
                />
              </g>
            );
          })}

          {/* Floating Neon Current Value Markers on Right Side */}
          {latestSantriPt && (
            <g>
              <line
                x1={latestSantriPt.x}
                y1={latestSantriPt.y}
                x2={padL + plotW + 8}
                y2={santriTagY}
                stroke="rgba(16, 185, 129, 0.55)"
                strokeDasharray="2 3"
              />
              <rect
                x={padL + plotW + 8}
                y={santriTagY - 10}
                width={58}
                height={20}
                rx={7}
                fill="rgba(6, 36, 27, 0.95)"
                stroke="#10B981"
                strokeWidth="1.2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' }}
              />
              <text
                x={padL + plotW + 37}
                y={santriTagY + 3.5}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="800"
                fontFamily="ui-monospace, monospace"
              >
                S {latestSantri}%
              </text>
            </g>
          )}

          {latestGuruPt && (
            <g>
              <line
                x1={latestGuruPt.x}
                y1={latestGuruPt.y}
                x2={padL + plotW + 8}
                y2={guruTagY}
                stroke="rgba(212, 175, 55, 0.55)"
                strokeDasharray="2 3"
              />
              <rect
                x={padL + plotW + 8}
                y={guruTagY - 10}
                width={58}
                height={20}
                rx={7}
                fill="rgba(26, 20, 6, 0.95)"
                stroke="#D4AF37"
                strokeWidth="1.2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.45))' }}
              />
              <text
                x={padL + plotW + 37}
                y={guruTagY + 3.5}
                textAnchor="middle"
                fill="#FEF08A"
                fontSize="10"
                fontWeight="800"
                fontFamily="ui-monospace, monospace"
              >
                G {latestGuru}%
              </text>
            </g>
          )}

          {/* X-Axis Labels + Invisible Hit Columns for Touch/Mouse Hover */}
          {safeData.map((d, i) => {
            const x = getX(i);
            const showTick =
              safeData.length <= 7 || i === 0 || i === safeData.length - 1 || i % 2 === 0;
            const hitW = safeData.length > 1 ? plotW / (safeData.length - 1) : plotW;
            return (
              <g key={`x-${i}`}>
                {showTick && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    fill="#D1FAE5"
                    opacity="0.85"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {String(d.tanggal).slice(0, 10)}
                  </text>
                )}
                <rect
                  x={x - hitW / 2}
                  y={padT - 8}
                  width={hitW}
                  height={plotH + 22}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Crisp Legend Row */}
      <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-xs font-bold text-[#D1FAE5]">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          <span>Kehadiran Santri (%)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
          <span>Kehadiran Ustadz / Guru (%)</span>
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
   4. 3D ISOMETRIC PILLAR BAR CHART (FRONT + DARK SIDE + LIT TOP CAP)
   ============================================================================ */

export interface Bar3DCategory {
  name: string;
  Santri: number;
  Guru: number;
}

interface Bar3DIsometricChartProps {
  data: Bar3DCategory[];
}

export const Bar3DIsometricChart: React.FC<Bar3DIsometricChartProps> = ({ data }) => {
  const [hoveredCat, setHoveredCat] = useState<number | null>(null);
  const uid = useMemo(() => `bar3d-${Math.random().toString(36).slice(2, 8)}`, []);

  const maxVal = useMemo(() => {
    const rawMax = Math.max(
      1,
      ...data.flatMap((d) => [Number(d.Santri) || 0, Number(d.Guru) || 0])
    );
    return Math.ceil(rawMax / 5) * 5 || 10;
  }, [data]);

  const width = 460;
  const height = 250;
  const padL = 36;
  const padR = 20;
  const padT = 26;
  const padB = 38;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const baseY = padT + plotH;

  // Isometric extrusion offsets
  const dx = 10;
  const dy = 7;
  const barW = 24;
  const gapBetweenSeries = 12;

  const groupW = plotW / Math.max(1, data.length);

  const renderPillar = (
    x: number,
    val: number,
    palette: { frontGrad: string; sideFill: string; topFill: string },
    delaySec: number,
    isHighlighted: boolean
  ) => {
    const clamped = Math.max(0, Number(val) || 0);
    const barH = Math.max(clamped > 0 ? 10 : 4, (clamped / maxVal) * plotH);
    const topY = baseY - barH;

    // Front face rect corners: (x, topY) -> (x+barW, baseY)
    // Top cap parallelogram: (x, topY), (x+dx, topY-dy), (x+barW+dx, topY-dy), (x+barW, topY)
    const topCap = `${x},${topY} ${x + dx},${topY - dy} ${x + barW + dx},${topY - dy} ${x + barW},${topY}`;
    // Right side face parallelogram: (x+barW, topY), (x+barW+dx, topY-dy), (x+barW+dx, baseY-dy), (x+barW, baseY)
    const sideFace = `${x + barW},${topY} ${x + barW + dx},${topY - dy} ${x + barW + dx},${baseY - dy} ${x + barW},${baseY}`;

    return (
      <motion.g
        initial={{ scaleY: 0, opacity: 0.4 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.65, delay: delaySec, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${x + barW / 2}px ${baseY}px` }}
      >
        {/* Floor Contact Shadow */}
        <polygon
          points={`${x + 2},${baseY + 2} ${x + barW + dx + 4},${baseY - dy + 3} ${x + barW + dx + 8},${baseY + 5} ${x + 6},${baseY + 7}`}
          fill="rgba(0,0,0,0.45)"
        />
        {/* Front Face */}
        <rect
          x={x}
          y={topY}
          width={barW}
          height={barH}
          fill={palette.frontGrad}
          stroke={isHighlighted ? '#FFFFFF' : 'rgba(255,255,255,0.16)'}
          strokeWidth={isHighlighted ? 1.2 : 0.6}
        />
        {/* Darkened Right Isometric Side */}
        <polygon
          points={sideFace}
          fill={palette.sideFill}
          stroke="rgba(4,26,19,0.5)"
          strokeWidth="0.6"
        />
        {/* Bright Illuminated Isometric Top Cap */}
        <polygon
          points={topCap}
          fill={palette.topFill}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.7"
        />
        {/* Crisp Numeric Label Floating Above Pillar */}
        {clamped > 0 && (
          <text
            x={x + barW / 2 + dx / 2}
            y={topY - dy - 5}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="9.5"
            fontWeight="800"
            fontFamily="ui-monospace, monospace"
          >
            {clamped}
          </text>
        )}
      </motion.g>
    );
  };

  const activeCategory = hoveredCat !== null ? data[hoveredCat] : null;

  return (
    <div className="w-full relative select-none">
      {/* Floating Glass Tooltip */}
      <AnimatePresence>
        {activeCategory && (
          <motion.div
            key={activeCategory.name}
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="absolute top-0 right-1 z-20 px-3 py-2 rounded-xl bg-gradient-to-br from-[#093426] via-[#052017] to-[#03140E] border-t border-l border-amber-400/40 border-b-2 border-r border-black/65 shadow-[0_12px_26px_-5px_rgba(0,0,0,0.72),0_4px_10px_-2px_rgba(16,185,129,0.14)] pointer-events-none text-xs"
          >
            <div className="font-bold text-[#D4AF37] mb-1">{activeCategory.name}</div>
            <div className="flex items-center justify-between gap-3 text-[#D1FAE5] tabular-nums">
              <span>Santri:</span>
              <span className="font-mono font-extrabold text-emerald-300">{activeCategory.Santri}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[#D1FAE5] tabular-nums">
              <span>Ustadz:</span>
              <span className="font-mono font-extrabold text-[#FDE047]">{activeCategory.Guru}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id={`${uid}-front-santri`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id={`${uid}-front-guru`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#B48415" />
          </linearGradient>
        </defs>

        {/* Horizontal Reference Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = baseY - ratio * plotH;
          const labelVal = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="rgba(16, 185, 129, 0.14)"
                strokeDasharray="3 4"
              />
              <text
                x={padL - 8}
                y={y + 3.5}
                textAnchor="end"
                fill="#D1FAE5"
                opacity="0.75"
                fontSize="9.5"
                fontFamily="ui-monospace, monospace"
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* Isometric Floor Platform Line */}
        <line
          x1={padL}
          y1={baseY}
          x2={width - padR}
          y2={baseY}
          stroke="rgba(212, 175, 55, 0.4)"
          strokeWidth="1.2"
        />

        {/* Isometric Pillar Pairs */}
        {data.map((d, i) => {
          const center = padL + groupW * i + groupW / 2;
          const totalPairW = barW * 2 + gapBetweenSeries;
          const xSantri = center - totalPairW / 2 - dx / 2;
          const xGuru = xSantri + barW + gapBetweenSeries;
          const isHl = hoveredCat === i;

          return (
            <g
              key={d.name}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredCat(i)}
              onMouseLeave={() => setHoveredCat(null)}
              onClick={() => setHoveredCat(isHl ? null : i)}
            >
              {renderPillar(
                xSantri,
                d.Santri,
                {
                  frontGrad: `url(#${uid}-front-santri)`,
                  sideFill: '#064E3B',
                  topFill: '#6EE7B7',
                },
                i * 0.08,
                isHl
              )}
              {renderPillar(
                xGuru,
                d.Guru,
                {
                  frontGrad: `url(#${uid}-front-guru)`,
                  sideFill: '#78350F',
                  topFill: '#FEF08A',
                },
                i * 0.08 + 0.05,
                isHl
              )}

              {/* Category Label */}
              <text
                x={center}
                y={baseY + 20}
                textAnchor="middle"
                fill={isHl ? '#FDE047' : '#FFFFFF'}
                fontSize="11"
                fontWeight="700"
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-1 text-xs font-bold text-[#D1FAE5]">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-emerald-300 to-emerald-600 shadow" />
          <span>Santri</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-amber-200 to-[#D4AF37] shadow" />
          <span>Ustadz / Guru</span>
        </span>
      </div>
    </div>
  );
};

/* ============================================================================
   5. CYBER-EMERALD GREEN LASER SCAN OVERLAY (FOR SCANNER / CAMERA / RADAR BOXES)
   ============================================================================ */

export const ScannerLaserOverlay: React.FC<{ active?: boolean }> = ({ active = true }) => {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-20">
      {/* Corner Cyber Reticle Brackets */}
      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400/80 rounded-tl-md" />
      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400/80 rounded-tr-md" />
      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400/80 rounded-bl-md" />
      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400/80 rounded-br-md" />

      {/* Smooth Up-Down Green Laser Beam */}
      <motion.div
        initial={{ top: '8%' }}
        animate={{ top: ['8%', '90%', '8%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-x-3 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        style={{
          boxShadow: '0 0 12px 2px rgba(16, 185, 129, 0.85), 0 0 24px rgba(16, 185, 129, 0.45)',
        }}
      />
    </div>
  );
};
