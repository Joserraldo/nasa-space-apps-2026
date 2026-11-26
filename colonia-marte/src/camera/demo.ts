import { PerspectiveCamera } from "three";
import demo from "../../data/shots/ws0-demo.json";
import { SequencePlayer } from "./player";
import type { createNavigation } from "../navigation/mode-controller";
import type { createShell } from "../core/shell";

/** Optional preview wiring only; environment, zone labels and DOF render in later workstreams. */
export function attach(context:unknown): void {
  const {camera,navigation,shell}=context as {
    camera:PerspectiveCamera; navigation:ReturnType<typeof createNavigation>; shell:ReturnType<typeof createShell>;
  };
  const player=new SequencePlayer(demo), preference=matchMedia("(prefers-reduced-motion: reduce)");
  const apply=(dt:number) => {
    const frame=player.update(dt,preference.matches); player.apply(camera,frame); shell.fade.style.opacity=String(frame.opacity);
    if (frame.finished) {player.paused=true;shell.tour.textContent="Replay camera demo";}
  };
  navigation.setTourDriver({
    update:apply,pause() {player.paused=true;},
    reset() {player.seek(0);player.paused=false;apply(0);},
  });
  shell.tour.hidden=false;
  shell.tour.onclick=() => {
    if (navigation.mode==="tour" && !player.paused) {
      player.paused=true; shell.tour.textContent="Resume camera demo"; return;
    }
    if (navigation.mode==="tour" && player.paused && player.elapsed<player.duration) player.paused=false;
    else navigation.setMode("tour");
    shell.joystick.hidden=true; shell.status.textContent="CAMERA DEMO"; shell.tour.textContent="Pause camera demo";
    shell.orbit.setAttribute("aria-pressed","false"); shell.walk.setAttribute("aria-pressed","false");
  };
}
