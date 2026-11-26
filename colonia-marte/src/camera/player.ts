import type { PerspectiveCamera } from "three";
import { parseSequence, type Shot } from "./schema";
import { ShotTrajectory } from "./trajectory";

export interface CameraFrame {
  shot: Shot;
  position: ReturnType<ShotTrajectory["sample"]>["position"];
  target: ReturnType<ShotTrajectory["sample"]>["target"];
  opacity: number;
  localTime: number;
  finished: boolean;
}

/** Deterministic seeking; cuts switch exactly at boundaries, fades pass through black. */
export class SequencePlayer {
  readonly trajectories: ShotTrajectory[];
  readonly duration: number;
  elapsed = 0;
  paused = true;
  constructor(input: unknown) {
    this.trajectories = parseSequence(input).shots.map(shot => new ShotTrajectory(shot));
    this.duration = this.trajectories.reduce((sum,path) => sum+path.shot.duration,0);
  }
  seek(seconds: number, reducedMotion = false): CameraFrame {
    if (!Number.isFinite(seconds)) throw new Error("Invalid playback time");
    this.elapsed = Math.max(0,Math.min(this.duration,seconds));
    let localTime = this.elapsed;
    let index = 0;
    while (index<this.trajectories.length-1 && localTime>=this.trajectories[index].shot.duration) {
      localTime -= this.trajectories[index++].shot.duration;
    }
    const path = this.trajectories[index], shot = path.shot;
    const transition = shot.transition;
    // Fade-out also belongs to the incoming shot, so a cut-to-fade boundary is black on both sides.
    const next = this.trajectories[index+1]?.shot.transition;
    const fadeIn = transition.type === "fade" ? 1-localTime/transition.duration : 0;
    const fadeOut = next?.type === "fade" ? 1-(shot.duration-localTime)/next.duration : 0;
    return {
      shot, ...path.sample(localTime,reducedMotion), localTime,
      opacity:Math.max(0,Math.min(1,Math.max(fadeIn,fadeOut))), finished:this.elapsed>=this.duration,
    };
  }
  update(dt: number, reducedMotion = false): CameraFrame {
    if (!Number.isFinite(dt) || dt<0) throw new Error("Invalid playback delta");
    return this.seek(this.elapsed+(this.paused ? 0 : dt),reducedMotion);
  }
  apply(camera: PerspectiveCamera, frame: CameraFrame): void {
    camera.position.copy(frame.position);
    if (frame.position.distanceToSquared(frame.target)>1e-10) camera.lookAt(frame.target);
    camera.fov = frame.shot.fov; camera.updateProjectionMatrix();
  }
}
