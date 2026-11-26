function hash(x: number, z: number, seed: number): number {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(seed, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

/** Seeded smooth value noise; no process-global random state. */
export function noise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const smooth = (n: number) => n * n * (3 - 2 * n);
  const u = smooth(x - ix), v = smooth(z - iz);
  const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed);
  const c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
