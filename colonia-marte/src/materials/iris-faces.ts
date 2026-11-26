import { paletteHex } from "./palette";

export const irisExpressions = ["happy", "curious", "worried", "damaged", "off"] as const;
export type IrisExpression = typeof irisExpressions[number];

/** Each expression is a stable atlas cell. Glitch bars are deterministic, never random each frame. */
export function drawIrisFace(context: CanvasRenderingContext2D, expression: IrisExpression) {
  context.fillStyle = paletteHex("nightSky"); context.fillRect(0, 0, 320, 192);
  if (expression === "off") return;
  context.strokeStyle = paletteHex(expression === "damaged" ? "doorClosed" : "cyan");
  context.fillStyle = context.strokeStyle; context.lineWidth = 15; context.lineCap = "round";
  for (const x of [104, 216]) {
    context.beginPath();
    if (expression === "happy") context.arc(x, 88, 28, Math.PI, Math.PI * 2);
    else if (expression === "damaged") {
      context.moveTo(x - 18, 63); context.lineTo(x + 18, 98);
      context.moveTo(x + 18, 63); context.lineTo(x - 18, 98);
    } else {
      const radius = expression === "curious" && x === 216 ? 32 : 22;
      context.arc(x, 85, radius, 0, Math.PI * 2);
    }
    context.stroke();
  }
  context.beginPath();
  if (expression === "worried") context.arc(160, 162, 30, Math.PI * 1.15, Math.PI * 1.85);
  else if (expression === "happy") context.arc(160, 105, 34, 0.2, Math.PI - 0.2);
  else { context.moveTo(143, 140); context.lineTo(177, expression === "curious" ? 132 : 140); }
  context.stroke();
  if (expression === "worried") {
    context.beginPath(); context.moveTo(85, 46); context.lineTo(124, 35);
    context.moveTo(196, 35); context.lineTo(235, 46); context.stroke();
  }
  if (expression === "damaged") {
    for (let i = 0; i < 7; i++) context.fillRect((i * 73) % 280, 20 + i * 24, 34 + i * 7, 4);
  }
}
