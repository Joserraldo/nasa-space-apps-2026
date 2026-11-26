export const mealScreenTypes = ["burger", "salad", "soup", "coffee"] as const;
export type MealScreenType = typeof mealScreenTypes[number];

function circle(g: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

/** Draw a canteen food dispenser screen cell (320x192) onto a 2D canvas context. */
export function drawMealHud(
  g: CanvasRenderingContext2D,
  meal: MealScreenType,
  width = 320,
  height = 192,
): void {
  const bg = g.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#05192a");
  bg.addColorStop(0.55, "#0b3d5c");
  bg.addColorStop(1, "#082940");
  g.fillStyle = bg;
  g.fillRect(0, 0, width, height);

  g.strokeStyle = "#3fd8ff";
  g.lineWidth = 3;
  g.strokeRect(8, 8, width - 16, height - 16);

  g.strokeStyle = "rgba(63, 216, 255, 0.45)";
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(160, 198, 150, 48, -0.08, Math.PI * 1.08, Math.PI * 1.92);
  g.stroke();

  for (const x of [16, 250]) {
    g.strokeStyle = "rgba(127, 232, 255, 0.65)";
    g.strokeRect(x, 42, 54, 82);
    g.fillStyle = "rgba(63, 216, 255, 0.78)";
    for (let i = 0; i < 3; i++) {
      g.fillRect(x + 17, 55 + i * 22, 30, 8);
      circle(g, x + 9, 59 + i * 22, 3.2, "#7fe8ff");
    }
  }

  g.strokeStyle = "#8cecff";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(160, 95, 68, 0, Math.PI * 2);
  g.stroke();
  circle(g, 160, 95, 60, "rgba(14, 88, 128, 0.58)");

  const cx = 160;
  const cy = 96;
  if (meal === "burger") {
    g.fillStyle = "#f2a541";
    g.beginPath();
    g.ellipse(cx, cy - 13, 46, 27, 0, Math.PI, 0);
    g.fill();
    for (const [sx, sy] of [[-18, -26], [-4, -31], [12, -28], [24, -21], [-8, -20]]) {
      circle(g, cx + sx, cy + sy, 2.2, "#fff3cf");
    }
    g.fillStyle = "#5dbb4c";
    g.fillRect(cx - 50, cy - 11, 100, 9);
    g.fillStyle = "#e4572e";
    g.fillRect(cx - 45, cy - 2, 90, 6);
    g.fillStyle = "#ffd24c";
    g.fillRect(cx - 46, cy + 4, 92, 6);
    g.fillStyle = "#6e3520";
    g.fillRect(cx - 47, cy + 10, 94, 14);
    g.fillStyle = "#f2a541";
    g.fillRect(cx - 44, cy + 25, 88, 13);
  } else if (meal === "salad") {
    g.fillStyle = "#d4e3ec";
    g.beginPath();
    g.ellipse(cx, cy + 10, 52, 27, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f5f9fc";
    g.beginPath();
    g.ellipse(cx, cy + 6, 44, 22, 0, 0, Math.PI * 2);
    g.fill();
    circle(g, cx - 14, cy + 2, 18, "#5dbb4c");
    circle(g, cx - 3, cy - 7, 15, "#3e8e3a");
    g.fillStyle = "#f4b23c";
    g.beginPath();
    g.ellipse(cx + 13, cy + 8, 22, 13, -0.25, 0, Math.PI * 2);
    g.fill();
    circle(g, cx - 21, cy + 12, 6.5, "#e4572e");
  } else if (meal === "soup") {
    g.fillStyle = "#dce8f0";
    g.beginPath();
    g.ellipse(cx, cy + 5, 50, 33, 0, 0, Math.PI);
    g.fill();
    g.fillStyle = "#eef5fa";
    g.beginPath();
    g.ellipse(cx, cy + 4, 50, 15, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f4ba40";
    g.beginPath();
    g.ellipse(cx, cy + 5, 43, 12, 0, 0, Math.PI * 2);
    g.fill();
    circle(g, cx - 11, cy + 4, 4, "#5dbb4c");
    circle(g, cx + 12, cy + 6, 3.5, "#5dbb4c");
    g.strokeStyle = "rgba(235, 248, 255, 0.88)";
    g.lineWidth = 3;
    for (const dx of [-16, 0, 16]) {
      g.beginPath();
      g.moveTo(cx + dx, cy - 12);
      g.quadraticCurveTo(cx + dx - 6, cy - 25, cx + dx + 3, cy - 38);
      g.stroke();
    }
  } else {
    g.strokeStyle = "#eef5fa";
    g.lineWidth = 7.5;
    g.beginPath();
    g.arc(cx + 28, cy + 6, 15, -1.2, 1.2);
    g.stroke();
    g.fillStyle = "#e8f1f7";
    g.fillRect(cx - 30, cy - 18, 56, 52);
    g.fillStyle = "#c6d6e2";
    g.fillRect(cx + 8, cy - 18, 18, 52);
    g.fillStyle = "#3fd8ff";
    g.fillRect(cx - 30, cy + 16, 56, 6);
    g.fillStyle = "#eef5fa";
    g.beginPath();
    g.ellipse(cx - 2, cy - 18, 28, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#6e381f";
    g.beginPath();
    g.ellipse(cx - 2, cy - 18, 23, 6.5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(235, 248, 255, 0.9)";
    g.lineWidth = 3;
    for (const dx of [-10, 7]) {
      g.beginPath();
      g.moveTo(cx + dx, cy - 30);
      g.quadraticCurveTo(cx + dx + 6, cy - 40, cx + dx - 3, cy - 50);
      g.stroke();
    }
  }
}
