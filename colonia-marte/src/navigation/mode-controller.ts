import { Euler, Vector3, type PerspectiveCamera } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { JoystickState } from "./joystick";
import type { RoomLayout } from "../catalog/layout";

export type NavigationMode = "orbit" | "walk" | "tour";
export interface TourDriver { update(dt: number): void; pause(): void; reset(): void }
export type WalkLayout = Pick<RoomLayout, "module" | "size">;
const WALL_MARGIN = .5;

/** Prototype modes adapted to the kit; no game missions, doors or WS7 collision assumptions. */
export function createNavigation(camera: PerspectiveCamera, canvas: HTMLCanvasElement, joystick: JoystickState, layout?: WalkLayout) {
  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  const pressed = new Set<string>();
  const rotation = new Euler(0, 0, 0, "YXZ");
  const forward = new Vector3();
  const right = new Vector3();
  const movement = new Vector3();
  let mode: NavigationMode = "orbit";
  let driver: TourDriver | undefined;
  let pointer: number | null = null;
  let lastX = 0;
  let lastY = 0;
  const min = layout ? WALL_MARGIN : -1;
  const maxX = layout ? layout.size[0] * layout.module - WALL_MARGIN : 7;
  const maxZ = layout ? layout.size[1] * layout.module - WALL_MARGIN : 7;
  const constrainToFloor = () => {
    camera.position.x = Math.max(min, Math.min(maxX, camera.position.x));
    camera.position.y = 1.5;
    camera.position.z = Math.max(min, Math.min(maxZ, camera.position.z));
  };
  const resetInput = () => { pressed.clear(); pointer = null; joystick.x = joystick.y = 0; };
  const setMode = (next: NavigationMode) => {
    resetInput();
    driver?.pause();
    mode = next;
    orbit.enabled = next === "orbit";
    if (next === "walk") {
      if (layout) constrainToFloor();
      else camera.position.y = 1.5;
      rotation.setFromQuaternion(camera.quaternion, "YXZ");
    }
    if (next === "orbit") {
      camera.getWorldDirection(forward);
      orbit.target.copy(camera.position).addScaledVector(forward, 5);
    }
    if (next === "tour") driver?.reset();
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.target !== canvas) return;
    const key = event.key.toLowerCase();
    if ([" ", "home", "end", "pageup", "pagedown"].includes(key)) event.preventDefault();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
      event.preventDefault();
      pressed.add(key);
    }
  };
  const keyup = (event: KeyboardEvent) => { pressed.delete(event.key.toLowerCase()); };
  const down = (event: PointerEvent) => {
    canvas.focus({ preventScroll: true });
    if (mode !== "walk" || pointer !== null || event.button !== 0) return;
    pointer = event.pointerId;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(pointer);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    rotation.y -= (event.clientX - lastX) * 0.004;
    rotation.x = Math.max(-1.3, Math.min(1.3, rotation.x - (event.clientY - lastY) * 0.004));
    rotation.z = 0;
    camera.quaternion.setFromEuler(rotation);
    lastX = event.clientX;
    lastY = event.clientY;
  };
  const up = (event: PointerEvent) => { if (event.pointerId === pointer) pointer = null; };
  const hidden = () => { if (document.hidden) resetInput(); };
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", resetInput);
  document.addEventListener("visibilitychange", hidden);
  canvas.addEventListener("blur", resetInput);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  return {
    orbit, setMode,
    get mode() { return mode; },
    setTourDriver(value: TourDriver) { driver = value; },
    update(dt: number) {
      if (mode === "tour") { driver?.update(dt); return; }
      if (mode === "orbit") orbit.update();
      if (mode !== "walk") return;
      const x = joystick.x + Number(pressed.has("d") || pressed.has("arrowright"))
        - Number(pressed.has("a") || pressed.has("arrowleft"));
      const y = joystick.y + Number(pressed.has("w") || pressed.has("arrowup"))
        - Number(pressed.has("s") || pressed.has("arrowdown"));
      const length = Math.hypot(x, y);
      if (!length) return;
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.set(-forward.z, 0, forward.x);
      movement.copy(forward).multiplyScalar(y).addScaledVector(right, x)
        .multiplyScalar(2.2 * Math.min(1, length) / length * Math.min(dt, 0.05));
      camera.position.add(movement);
      constrainToFloor();
    },
    dispose() {
      orbit.dispose();
      resetInput();
      driver?.pause();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", resetInput);
      document.removeEventListener("visibilitychange", hidden);
      canvas.removeEventListener("blur", resetInput);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
    },
  };
}
