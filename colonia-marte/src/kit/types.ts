import type { Object3D } from "three";

export const triangleBudgets = {
  prop: [50, 400], furniture: [300, 1500], largeFurniture: [1500, 4000],
  architecture: [100, 1200], capsule: [1000, 2500], building: [3000, 12000],
  vehicle: [3000, 8000], character: [2500, 5000], terrain: [0, 150000],
} as const;
export type PieceCategory = keyof typeof triangleBudgets;
export type Pivot = "base-center" | "module-corner" | "hinge" | "axle-center";
export interface PieceMetadata {
  category: PieceCategory;
  pivot: Pivot;
  /** cell: full bay; wall-line: X span on grid line Z=0; point: centered on a grid node. */
  placement?: "cell" | "wall-line" | "point";
  /** Declared envelope in meters, including a 3m clear height or 0.2m slab when applicable. */
  grid?: { size: [number, number, number]; module: 2 | 4 };
  pivotOffset?: [number, number, number];
}
export interface PieceDefinition<P extends object> {
  parse: (input: unknown) => P;
  build: (params: P) => Object3D;
  variants: Readonly<Record<string, P>>;
  metadata: PieceMetadata;
}
