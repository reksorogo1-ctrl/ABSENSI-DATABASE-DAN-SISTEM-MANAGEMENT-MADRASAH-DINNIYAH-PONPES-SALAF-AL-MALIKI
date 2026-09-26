import React from 'react';

export interface DonutSlice {
  name: string;
  value: number;
  fill: string;
}

interface Donut3DProps {
  data: DonutSlice[];
  unitLabel?: string; // e.g. "Santri" | "Pengajar"
}

// A genuine 3D-looking donut: perspective-tilted disc with extruded thickness,
// a slowly sweeping light ring, a floating center readout, and an entrance animation.
export const Donut3D: React.FC<Donut3DProps> = ({ data, unitLabel = '' }) => {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;

  let acc = 0;
  const stops = slices
    .map((d) => {
      const start = (acc / total) * 360;
      acc += d.value;
      const end = (acc / total) * 360;
      return `${d.fill} ${start}deg ${end}deg`;
    })
    .join(', ');
  const gradient = `conic-gradient(from 0deg, ${stops})`;

  // Fake cylinder side-wall via a downward stack of box-shadows (reads as depth once tilted).
  const thickness: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const a = Math.max(0.12, 0.92 - i * 0.05);
    thickness.push(`0 ${i}px 0 rgba(3,20,12,${a.toFixed(2)})`);
  }
  thickness.push('0 26px 34px rgba(0,0,0,0.75)');

  const main = slices[0];
  const mainPct = main ? Math.round((main.value / total) * 100) : 0;

  return (
    <div className="donut3d-wrap" data-testid="donut-3d">
      <div className="donut3d-stage">
        <div className="donut3d-tilt">
          <div className="donut3d-disc" style={{ background: gradient, boxShadow: thickness.join(', ') }}>
            <div className="donut3d-ring" />
            <div className="donut3d-hole" />
          </div>
        </div>
        <div className="donut3d-center">
          <span className="donut3d-center-val">{mainPct}%</span>
          <span className="donut3d-center-lbl">{main ? main.name : ''}</span>
        </div>
      </div>

      <div className="donut3d-legend">
        {slices.map((d) => (
          <div key={d.name} className="donut3d-legend-item">
            <span className="donut3d-dot" style={{ background: d.fill, boxShadow: `0 0 8px ${d.fill}` }} />
            <span className="donut3d-legend-name">{d.name}</span>
            <span className="donut3d-legend-val">
              {d.value} {unitLabel} · {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
