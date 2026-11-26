import { createHudRing } from "../atoms/hud-atoms";
import { createHudReply } from "../organisms/crew-dialogue";
import type { UIRegistry } from "../registry";

const HOLD_MS = 3000;

export function createHudHoldGate(onUnlock: () => void) {
  const root = document.createElement("div");
  root.className = "ui-hud-hold-gate";
  const ring = createHudRing({ glyph: "shield", level: 1 });
  ring.setAttribute("role", "progressbar");
  ring.setAttribute("aria-label", "Hold progress");
  ring.querySelector(".ui-hud-ring__arc")?.setAttribute("pathLength", "100");
  const button = createHudReply({ glyph: "none", label: "Hold for 3 seconds" });
  button.classList.add("ui-hud-hold-gate__button");
  root.append(ring, button);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let ticks: ReturnType<typeof setInterval> | undefined;
  let frame: number | undefined;
  let source: string | number | undefined;
  let started = 0;
  let unlocked = false;

  function progress(percent: number): void {
    ring.style.setProperty("--hold-progress", String(percent));
    ring.setAttribute("aria-valuenow", String(Math.floor(percent)));
  }

  function stop(): void {
    clearTimeout(timer);
    clearInterval(ticks);
    if (frame !== undefined && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    source = timer = ticks = frame = undefined;
  }

  function cancel(): void {
    stop();
    if (!unlocked) progress(0);
  }

  function start(trigger: string | number): void {
    if (source !== undefined || unlocked) return;
    source = trigger;
    started = Date.now();
    const draw = () => {
      progress(Math.min(100, (Date.now() - started) / HOLD_MS * 100));
      frame = requestAnimationFrame(draw);
    };
    if (typeof requestAnimationFrame === "function" && !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(draw);
    } else {
      ticks = setInterval(() => progress(Math.min(100, (Date.now() - started) / HOLD_MS * 100)), 1000);
    }
    timer = setTimeout(() => {
      stop();
      unlocked = true;
      progress(100);
      onUnlock();
    }, HOLD_MS);
  }

  progress(0);
  button.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button !== 0 || source !== undefined) return;
    button.setPointerCapture(event.pointerId);
    start(event.pointerId);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
    button.addEventListener(name, event => { if (event.pointerId === source) cancel(); });
  }
  button.addEventListener("keydown", event => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!event.repeat) start(event.key);
  });
  button.addEventListener("keyup", event => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (event.key === source) cancel();
  });
  button.addEventListener("blur", cancel);
  return { root, button, cancel, reset() { unlocked = false; cancel(); } };
}

export function registerHudHoldGate(registry: UIRegistry): void {
  registry.register("UI-MOLECULE-HUD-HOLD-GATE", {
    metadata: { layer: "molecule", name: "HUD hold gate", figmaNodeId: "1:12", description: "Hold a button for three seconds to unlock an area." },
    variants: { Default: {} },
    parse: () => ({}),
    render: () => createHudHoldGate(() => {}).root,
  });
}
