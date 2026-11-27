export const decalTypes = [
  "hab-01",
  "hab-02",
  "hab-03",
  "hab-04",
  "hub-crest",
  "hazard-airlock",
  "tower-comm",
  "bay-utility",
  "sector-03",
  "bay-01",
  "bay-02",
  "bay-03",
] as const;

export type DecalType = typeof decalTypes[number];

function drawPlateBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: string,
  border: string,
  seed: number,
): void {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle brushed metal / matte vinyl grain + micro-weathering so decals read physical, never emissive
  let s = (seed * 2654435761) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let y = 0; y < h; y += 3) {
    const delta = (rand() - 0.5) * 10;
    ctx.fillStyle = delta > 0
      ? `rgba(255,255,255,${(delta / 255).toFixed(3)})`
      : `rgba(0,0,0,${(-delta / 220).toFixed(3)})`;
    ctx.fillRect(0, y, w, 2);
  }
  for (let i = 0; i < 48; i++) {
    const px = Math.floor(rand() * w);
    const py = Math.floor(rand() * h);
    const pw = 2 + Math.floor(rand() * 8);
    ctx.fillStyle = rand() > 0.5 ? "rgba(25,32,40,0.12)" : "rgba(215,222,230,0.10)";
    ctx.fillRect(px, py, pw, 2);
  }

  // Outer die-cut bevel & inner technical hairline
  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, w - 10, h - 10);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  // Corner aerospace fasteners / rivets
  for (const [rx, ry] of [[18, 18], [w - 18, 18], [18, h - 18], [w - 18, h - 18]] as const) {
    ctx.fillStyle = "#2A323B";
    ctx.beginPath();
    ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8C96A2";
    ctx.fillRect(rx - 3, ry - 0.8, 6, 1.6);
  }
}

function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  const widths = [3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2, 3, 1, 2];
  let cx = x;
  for (let i = 0; i < widths.length && cx < x + w - 3; i++) {
    const bw = widths[i];
    if (i % 2 === 0) ctx.fillRect(cx, y, bw, h);
    cx += bw + 2;
  }
}

function drawHazardStripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amber = "#B88022",
  dark = "#1E242B",
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = amber;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = dark;
  const step = 24;
  for (let sx = x - h; sx < x + w + h; sx += step) {
    ctx.beginPath();
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + 12, y + h);
    ctx.lineTo(sx + 12 + h, y);
    ctx.lineTo(sx + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxRight: number,
  weight: "bold" | "normal",
  basePx: number,
  family: "sans-serif" | "monospace",
): void {
  const avail = Math.max(40, maxRight - x);
  let px = basePx;
  ctx.font = `${weight} ${px}px ${family}`;
  const measured = ctx.measureText(text).width;
  if (measured > avail) {
    px = Math.max(9, Math.floor(((px * avail) / measured) * 10) / 10);
    ctx.font = `${weight} ${px}px ${family}`;
  }
  ctx.fillText(text, x, y, avail);
}

export function drawDecalSticker(
  ctx: CanvasRenderingContext2D,
  type: DecalType,
  w: number,
  h: number,
): void {
  const safeRight = w - 24;

  if (type.startsWith("hab-")) {
    const num = type.slice(4);
    const names: Record<string, string> = {
      "01": "HAB-ALPHA // CREW",
      "02": "HAB-BETA // BIO-LAB",
      "03": "HAB-GAMMA // MED",
      "04": "HAB-DELTA // OPS",
    };
    drawPlateBase(ctx, w, h, "#AEB6C0", "#2C3540", Number(num));

    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 15, w - 30, h - 30);
    ctx.clip();

    ctx.fillStyle = "#1E2630";
    ctx.fillRect(22, 24, 98, h - 48);
    ctx.fillStyle = "#C6CFD8";
    drawFittedText(ctx, num, 32, 112, 114, "bold", 62, "sans-serif");
    ctx.fillStyle = "#B87A24";
    ctx.fillRect(22, h - 34, 98, 10);

    ctx.fillStyle = "#1E2630";
    drawFittedText(ctx, names[num] ?? "HAB MODULE", 132, 48, safeRight, "bold", 14, "monospace");
    ctx.fillStyle = "#394450";
    drawFittedText(ctx, "PRESSURE  101.3 kPa", 132, 74, safeRight, "bold", 11.5, "monospace");
    drawFittedText(ctx, "SECTOR    JEZERO-N4", 132, 94, safeRight, "bold", 11.5, "monospace");
    drawFittedText(ctx, `SERIAL    MC-H${num}-2034`, 132, 114, safeRight, "bold", 11.5, "monospace");

    drawHazardStripes(ctx, 132, 126, 92, 16, "#B57B24", "#202730");
    drawBarcode(ctx, 234, 122, 58, 24, "#202730");
    ctx.restore();
    return;
  }

  if (type === "hub-crest") {
    drawPlateBase(ctx, w, h, "#222A34", "#7C8794", 11);
    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 15, w - 30, h - 30);
    ctx.clip();

    ctx.fillStyle = "#161D24";
    drawHexagon(ctx, 72, h / 2, 52);
    ctx.fill();
    ctx.strokeStyle = "#B87E28";
    ctx.lineWidth = 3.5;
    drawHexagon(ctx, 72, h / 2, 52);
    ctx.stroke();

    ctx.fillStyle = "#8C4843";
    ctx.beginPath();
    ctx.arc(72, h / 2 + 2, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#AEBAC6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(72, h / 2 + 2, 36, 12, -0.38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#C4CDD6";
    drawFittedText(ctx, "ARES-IV", 138, 52, safeRight, "bold", 20, "sans-serif");
    ctx.fillStyle = "#8FA0B0";
    drawFittedText(ctx, "JEZERO CENTRAL HUB", 138, 76, safeRight, "bold", 12.5, "monospace");
    ctx.fillStyle = "#B87E28";
    ctx.fillRect(138, 88, 148, 4);
    ctx.fillStyle = "#A8B3BE";
    drawFittedText(ctx, "AIRLOCK SEAL NOMINAL", 138, 112, safeRight, "normal", 11.5, "monospace");
    drawFittedText(ctx, "NODE ID // HUB-02-A", 138, 132, safeRight, "normal", 11.5, "monospace");
    drawBarcode(ctx, 138, 144, 140, 18, "#8FA0B0");
    ctx.restore();
    return;
  }

  if (type === "hazard-airlock") {
    drawPlateBase(ctx, w, h, "#A8B0BA", "#232A32", 23);
    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 15, w - 30, h - 30);
    ctx.clip();

    drawHazardStripes(ctx, 18, 20, w - 36, 28, "#BA8222", "#1C2229");
    drawHazardStripes(ctx, 18, h - 48, w - 36, 28, "#BA8222", "#1C2229");

    ctx.fillStyle = "#9C362E";
    ctx.beginPath();
    ctx.moveTo(52, 62);
    ctx.lineTo(24, 118);
    ctx.lineTo(80, 118);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#D0D6DC";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("!", 46, 110);

    ctx.fillStyle = "#1B2229";
    drawFittedText(ctx, "CAUTION // PRESSURIZED", 90, 81, safeRight, "bold", 14.5, "sans-serif");
    ctx.fillStyle = "#313B46";
    drawFittedText(ctx, "O2 / CRYO TRANSFER LINE", 90, 102, safeRight, "bold", 11.5, "monospace");
    drawFittedText(ctx, "LOCK VALVES BEFORE EVA", 90, 120, safeRight, "bold", 11.5, "monospace");
    ctx.restore();
    return;
  }

  if (type === "tower-comm") {
    drawPlateBase(ctx, w, h, "#192B35", "#6C8E9B", 37);
    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 15, w - 30, h - 30);
    ctx.clip();

    ctx.fillStyle = "#2A8499";
    ctx.fillRect(22, 24, 10, h - 48);
    ctx.fillStyle = "#B8CBD4";
    drawFittedText(ctx, "T-07", 42, 76, 206, "bold", 44, "sans-serif");
    ctx.fillStyle = "#76A8B8";
    drawFittedText(ctx, "ORBITAL RELAY TOWER", 42, 104, 214, "bold", 13, "monospace");
    ctx.fillStyle = "#96B2BC";
    drawFittedText(ctx, "ARRAY BAND  X / Ka-LINK", 42, 128, 214, "normal", 11.5, "monospace");
    drawFittedText(ctx, "ELEVATION   +18.4 M", 42, 148, 214, "normal", 11.5, "monospace");

    ctx.strokeStyle = "#5CA2B5";
    ctx.lineWidth = 3;
    for (const r of [15, 28, 41]) {
      ctx.beginPath();
      ctx.arc(252, 72, r, -2.2, -0.9);
      ctx.stroke();
    }
    drawBarcode(ctx, 222, 124, 70, 26, "#76A8B8");
    ctx.restore();
    return;
  }

  if (type === "sector-03") {
    drawPlateBase(ctx, w, h, "#C7CED6", "#66717D", 61);
    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 15, w - 30, h - 30);
    ctx.clip();

    // Clean painted architectural hull stencil ("03", v3-t010.60 & v3-t044.90)
    ctx.fillStyle = "#1F262F";
    drawFittedText(ctx, "03", 52, 134, safeRight, "bold", 118, "sans-serif");
    ctx.fillStyle = "#485462";
    drawFittedText(ctx, "SEC-03 // ATMOS", 56, 160, safeRight, "bold", 12, "monospace");
    ctx.restore();
    return;
  }

  if (type.startsWith("bay-0")) {
    const bayNum = type.slice(4);
    drawPlateBase(ctx, w, h, "#6B7278", "#C5922E", 70 + Number(bayNum));
    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 15, w - 30, h - 30);
    ctx.clip();

    ctx.fillStyle = "#CFA038";
    ctx.fillRect(22, 22, w - 44, 14);
    ctx.fillStyle = "#D4D8DC";
    drawFittedText(ctx, bayNum, 78, 126, safeRight, "bold", 94, "monospace");
    ctx.fillStyle = "#CFA038";
    drawFittedText(ctx, `CHARGE BAY ${bayNum}`, 44, 160, safeRight, "bold", 15, "monospace");
    ctx.restore();
    return;
  }

  drawPlateBase(ctx, w, h, "#B2B9C2", "#2B333C", 53);
  ctx.save();
  ctx.beginPath();
  ctx.rect(15, 15, w - 30, h - 30);
  ctx.clip();

  ctx.fillStyle = "#252D36";
  ctx.fillRect(22, 22, w - 44, 34);
  ctx.fillStyle = "#C6CFD8";
  drawFittedText(ctx, "UTILITY BAY // SEC-10", 32, 45, w - 32, "bold", 16.5, "monospace");

  ctx.fillStyle = "#222A33";
  drawFittedText(ctx, "M-10", 24, 102, 114, "bold", 32, "sans-serif");
  ctx.fillStyle = "#38424D";
  drawFittedText(ctx, "ATMOS SCRUBBER & CARGO", 120, 80, safeRight, "bold", 11.5, "monospace");
  drawFittedText(ctx, "MAX PAYLOAD  12,500 KG", 120, 100, safeRight, "bold", 11.5, "monospace");
  drawFittedText(ctx, "ROOF HATCHES SEALED", 120, 120, safeRight, "bold", 11.5, "monospace");

  drawHazardStripes(ctx, 24, 134, 104, 20, "#B47C22", "#202730");
  drawBarcode(ctx, 140, 132, 148, 22, "#252D36");
  ctx.restore();
}
