import { CatmullRomCurve3, TubeGeometry, Vector3, type BufferGeometry } from "three";
import { cachedGeometry } from "./cache";
import { chamferBox, extrudeProfile } from "./geometry";
import { chamferRect } from "./profiles";
import { finishGeometry } from "./normals";
import { coloredGeometry } from "../../materials/uv";

/** A recessed, open-backed rim. The panel itself belongs to the composing piece. */
export function panelInset(width = 1, height = 0.7, depth = 0.08, rim = 0.08): BufferGeometry {
  if (!(rim > 0 && rim * 4 < Math.min(width, height))) throw new Error("Invalid panel rim");
  const outer = chamferRect(width, height, rim);
  const inner = chamferRect(width-2*rim, height-2*rim, rim/2);
  outer.holes.push(inner);
  return extrudeProfile(outer, depth, Math.min(0.01, depth/4));
}

export function ledStrip(length = 1, width = 0.04, depth = 0.03): BufferGeometry {
  return coloredGeometry(chamferBox(length, width, depth, Math.min(width, depth) * 0.25, ["back"]), "cyan");
}

export type Point3 = [number, number, number];
export function pipeRun(points: Point3[], radius = 0.06, segments = 12): BufferGeometry {
  if (points.length < 2 || !points.flat().every(Number.isFinite) || !(radius > 0) ||
    !Number.isInteger(segments) || segments < 2 ||
    points.some((p,i) => i && new Vector3(...p).distanceTo(new Vector3(...points[i-1])) < 1e-5)) {
    throw new Error("Invalid pipe path");
  }
  return cachedGeometry(["pipeRun", points, radius, segments], () => finishGeometry(new TubeGeometry(
    new CatmullRomCurve3(points.map(p => new Vector3(...p)), false, "centripetal"), segments, radius, 8, false,
  )));
}
