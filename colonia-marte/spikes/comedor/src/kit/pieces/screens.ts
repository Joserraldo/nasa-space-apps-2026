import * as THREE from "three";

export type ScreenIcon = "burger" | "soup" | "salad" | "coffee" | "menu";

const cache = new Map<string, THREE.CanvasTexture>();

/** Dispenser / wall screen UI drawn in a canvas. One texture per icon, shared. */
export function screenTexture(icon: ScreenIcon): THREE.CanvasTexture {
  const hit = cache.get(icon);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 288;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 512, 288);
  bg.addColorStop(0, "#08223d");
  bg.addColorStop(1, "#0e4f78");
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 288);
  g.strokeStyle = "#3fd8ff";
  g.lineWidth = 6;
  g.strokeRect(10, 10, 492, 268);
  g.globalAlpha = 0.55;
  g.fillStyle = "#3fd8ff";
  for (let i = 0; i < 3; i++) {
    g.fillRect(36, 70 + i * 46, 88, 14);
    g.fillRect(392, 70 + i * 46, 88, 14);
  }
  g.globalAlpha = 1;
  g.beginPath();
  g.arc(256, 144, 86, 0, Math.PI * 2);
  g.strokeStyle = "#7fe8ff";
  g.lineWidth = 5;
  g.stroke();
  drawIcon(g, icon);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(icon, t);
  return t;
}

function drawIcon(g: CanvasRenderingContext2D, icon: ScreenIcon): void {
  const cx = 256;
  const cy = 144;
  if (icon === "burger") {
    g.fillStyle = "#f2a541";
    g.beginPath();
    g.ellipse(cx, cy - 22, 58, 30, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = "#5dbb4c";
    g.fillRect(cx - 62, cy - 14, 124, 12);
    g.fillStyle = "#7a3b22";
    g.fillRect(cx - 58, cy, 116, 20);
    g.fillStyle = "#f2a541";
    g.fillRect(cx - 56, cy + 22, 112, 18);
  } else if (icon === "soup") {
    g.fillStyle = "#f4f7fa";
    g.beginPath();
    g.ellipse(cx, cy + 6, 66, 40, 0, 0, Math.PI);
    g.fill();
    g.fillStyle = "#f2c14e";
    g.beginPath();
    g.ellipse(cx, cy + 6, 60, 14, 0, 0, Math.PI * 2);
    g.fill();
  } else if (icon === "salad") {
    g.fillStyle = "#f4f7fa";
    g.beginPath();
    g.ellipse(cx, cy + 10, 64, 26, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e4572e";
    g.beginPath();
    g.arc(cx - 18, cy - 2, 18, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5dbb4c";
    g.beginPath();
    g.arc(cx + 18, cy, 22, 0, Math.PI * 2);
    g.fill();
  } else if (icon === "coffee") {
    g.fillStyle = "#f4f7fa";
    g.fillRect(cx - 40, cy - 30, 80, 70);
    g.strokeStyle = "#f4f7fa";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(cx + 46, cy + 4, 18, -1.2, 1.2);
    g.stroke();
    g.fillStyle = "#6b3e26";
    g.fillRect(cx - 34, cy - 24, 68, 14);
  } else {
    g.fillStyle = "#3fd8ff";
    for (let i = 0; i < 4; i++) g.fillRect(cx - 50, cy - 50 + i * 28, 100, 12);
  }
}
