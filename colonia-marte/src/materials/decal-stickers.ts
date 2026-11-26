export const decalTypes = [
  "hab-01",
  "hab-02",
  "hab-03",
  "hab-04",
  "hub-crest",
  "hazard-airlock",
  "tower-comm",
  "bay-utility",
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

export function drawDecalSticker(
  ctx: CanvasRenderingContext2D,
  type: DecalType,
  w: number,
  h: number,
): void {
  if (type.startsWith("hab-")) {
    const num = type.slice(4);
    const names: Record<string, string> = {
      "01": "HAB-ALPHA // CREW",
      "02": "HAB-BETA // BIO-LAB",
      "03": "HAB-GAMMA // MED",
      "04": "HAB-DELTA // OPS",
    };
    drawPlateBase(ctx, w, h, "#AEB6C0", "#2C3540", Number(num));

    ctx.fillStyle = "#1E2630";
    ctx.fillRect(20, 24, 108, h - 48);
    ctx.fillStyle = "#C6CFD8";
    ctx.font = "bold 66px sans-serif";
    ctx.fillText(num, 34, 114);
    ctx.fillStyle = "#B87A24";
    ctx.fillRect(20, h - 34, 108, 10);

    ctx.fillStyle = "#1E2630";
    ctx.font = "bold 17px monospace";
    ctx.fillText(names[num] ?? "HAB MODULE", 140, 48);
    ctx.fillStyle = "#394450";
    ctx.font = "bold 12px monospace";
    ctx.fillText("PRESSURE  101.3 kPa", 140, 74);
    ctx.fillText("SECTOR    JEZERO-N4", 140, 94);
    ctx.fillText(`SERIAL    MC-H${num}-2034`, 140, 114);

    drawHazardStripes(ctx, 140, 126, 92, 16, "#B57B24", "#202730");
    drawBarcode(ctx, 242, 122, 56, 24, "#202730");
    return;
  }

  if (type === "hub-crest") {
    drawPlateBase(ctx, w, h, "#222A34", "#7C8794", 11);
    ctx.fillStyle = "#161D24";
    drawHexagon(ctx, 74, h / 2, 54);
    ctx.fill();
    ctx.strokeStyle = "#B87E28";
    ctx.lineWidth = 3.5;
    drawHexagon(ctx, 74, h / 2, 54);
    ctx.stroke();

    ctx.fillStyle = "#8C4843";
    ctx.beginPath();
    ctx.arc(74, h / 2 + 2, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#AEBAC6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(74, h / 2 + 2, 38, 13, -0.38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#C4CDD6";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("ARES-IV", 142, 52);
    ctx.fillStyle = "#8FA0B0";
    ctx.font = "bold 13px monospace";
    ctx.fillText("JEZERO CENTRAL HUB", 142, 76);
    ctx.fillStyle = "#B87E28";
    ctx.fillRect(142, 88, 152, 4);
    ctx.fillStyle = "#A8B3BE";
    ctx.font = "12px monospace";
    ctx.fillText("AIRLOCK SEAL NOMINAL", 142, 112);
    ctx.fillText("NODE ID // HUB-02-A", 142, 132);
    drawBarcode(ctx, 142, 144, 140, 18, "#8FA0B0");
    return;
  }

  if (type === "hazard-airlock") {
    drawPlateBase(ctx, w, h, "#A8B0BA", "#232A32", 23);
    drawHazardStripes(ctx, 16, 18, w - 32, 30, "#BA8222", "#1C2229");
    drawHazardStripes(ctx, 16, h - 48, w - 32, 30, "#BA8222", "#1C2229");

    ctx.fillStyle = "#9C362E";
    ctx.beginPath();
    ctx.moveTo(56, 62);
    ctx.lineTo(26, 118);
    ctx.lineTo(86, 118);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#D0D6DC";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("!", 50, 111);

    ctx.fillStyle = "#1B2229";
    ctx.font = "bold 19px sans-serif";
    ctx.fillText("CAUTION // PRESSURIZED", 98, 82);
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#313B46";
    ctx.fillText("O2 / CRYO TRANSFER LINE", 98, 103);
    ctx.fillText("LOCK VALVES BEFORE EVA", 98, 121);
    return;
  }

  if (type === "tower-comm") {
    drawPlateBase(ctx, w, h, "#192B35", "#6C8E9B", 37);
    ctx.fillStyle = "#2A8499";
    ctx.fillRect(20, 22, 12, h - 44);
    ctx.fillStyle = "#B8CBD4";
    ctx.font = "bold 46px sans-serif";
    ctx.fillText("T-07", 44, 76);
    ctx.fillStyle = "#76A8B8";
    ctx.font = "bold 14px monospace";
    ctx.fillText("ORBITAL RELAY TOWER", 44, 104);
    ctx.fillStyle = "#96B2BC";
    ctx.font = "12px monospace";
    ctx.fillText("ARRAY BAND  X / Ka-LINK", 44, 128);
    ctx.fillText("ELEVATION   +18.4 M", 44, 148);

    ctx.strokeStyle = "#5CA2B5";
    ctx.lineWidth = 3;
    for (const r of [16, 30, 44]) {
      ctx.beginPath();
      ctx.arc(254, 72, r, -2.2, -0.9);
      ctx.stroke();
    }
    drawBarcode(ctx, 222, 124, 72, 26, "#76A8B8");
    return;
  }

  drawPlateBase(ctx, w, h, "#B2B9C2", "#2B333C", 53);
  ctx.fillStyle = "#252D36";
  ctx.fillRect(20, 22, w - 40, 34);
  ctx.fillStyle = "#C6CFD8";
  ctx.font = "bold 18px monospace";
  ctx.fillText("UTILITY BAY // SEC-10", 32, 45);

  ctx.fillStyle = "#222A33";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("M-10", 28, 102);
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#38424D";
  ctx.fillText("ATMOS SCRUBBER & CARGO", 132, 80);
  ctx.fillText("MAX PAYLOAD  12,500 KG", 132, 100);
  ctx.fillText("ROOF HATCHES SEALED", 132, 120);

  drawHazardStripes(ctx, 24, 134, 108, 20, "#B47C22", "#202730");
  drawBarcode(ctx, 146, 132, 144, 22, "#252D36");
}
