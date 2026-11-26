export interface DEM {
  width: number; height: number; metersPerPixel: number; values: Int16Array;
  centerX: number; centerZ: number;
}

/** Signed little-endian meters from NASA Mars Trek, MOLA + HRSC; never rescaled to colony detail. */
export function decodeJezeroDEM(buffer: ArrayBuffer): DEM {
  if (buffer.byteLength !== 280 * 280 * 2) throw new Error("Invalid Jezero DEM length");
  const view = new DataView(buffer), values = new Int16Array(280 * 280);
  for (let i = 0; i < values.length; i++) values[i] = view.getInt16(i * 2, true);
  return { width: 280, height: 280, metersPerPixel: 289, values, centerX: 0.8 / 1.4 * 279, centerZ: 139.5 };
}

export function sampleDEM(dem: DEM, x: number, z: number): number {
  const px = Math.max(0, Math.min(dem.width - 1.001, dem.centerX + x / dem.metersPerPixel));
  const pz = Math.max(0, Math.min(dem.height - 1.001, dem.centerZ + z / dem.metersPerPixel));
  const ix = Math.floor(px), iz = Math.floor(pz), u = px - ix, v = pz - iz;
  const at = (dx: number, dz: number) => dem.values[(iz + dz) * dem.width + ix + dx];
  return (at(0, 0) * (1 - u) + at(1, 0) * u) * (1 - v) +
    (at(0, 1) * (1 - u) + at(1, 1) * u) * v;
}
