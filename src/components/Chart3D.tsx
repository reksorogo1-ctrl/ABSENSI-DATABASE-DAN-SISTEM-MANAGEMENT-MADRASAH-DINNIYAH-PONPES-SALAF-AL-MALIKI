import React from 'react';
import { Pie3DChart, type Pie3DSlice } from './Analytics3DSuite';

export type DonutSlice = Pie3DSlice;

interface Donut3DProps {
  data: DonutSlice[];
  unitLabel?: string;
}

// Upgraded to genuine extruded 3D Pie Chart with perspective(900px) rotateX(25deg),
// cylindrical depth extrusion, radial-gradient top lighting, and interactive slice lift + glass tooltip.
export const Donut3D: React.FC<Donut3DProps> = ({ data, unitLabel = '' }) => {
  return <Pie3DChart data={data} unitLabel={unitLabel} />;
};
