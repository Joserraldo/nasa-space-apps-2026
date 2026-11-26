import { CatmullRomCurve3, Vector3 } from "three";
import type { Easing, Shot } from "./schema";

export function ease(progress: number, easing: Easing): number {
  const t = Math.max(0,Math.min(1,progress));
  return easing === "smoothstep" ? t*t*(3-2*t) : t;
}

export class ShotTrajectory {
  readonly position: CatmullRomCurve3;
  readonly target: CatmullRomCurve3;
  constructor(readonly shot: Shot) {
    this.position = new CatmullRomCurve3(shot.position.map(p => new Vector3(...p)),false,"centripetal");
    this.target = new CatmullRomCurve3(shot.target.map(p => new Vector3(...p)),false,"centripetal");
    // Dense arc-length lookup avoids speed spikes at unevenly spaced knots.
    this.position.arcLengthDivisions = 8192;
    this.target.arcLengthDivisions = 4096;
    this.position.updateArcLengths(); this.target.updateArcLengths();
  }
  sample(seconds: number, reducedMotion = false): { position:Vector3; target:Vector3 } {
    const progress = reducedMotion ? 0 : ease(seconds/this.shot.duration,this.shot.easing);
    return {position:this.position.getPointAt(progress),target:this.target.getPointAt(progress)};
  }
}
