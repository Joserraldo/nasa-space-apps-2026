import { CanvasTexture, LinearFilter, SRGBColorSpace, type BufferGeometry } from "three";
import { paletteHex } from "./palette";
import { materials } from "./shared";
import { drawIrisFace, irisExpressions } from "./iris-faces";
import { drawMealHud, mealScreenTypes, type MealScreenType } from "./meal-screens";
import { decalTypes, drawDecalSticker, type DecalType } from "./decal-stickers";

export { decalTypes, mealScreenTypes, type DecalType, type MealScreenType };

export const screenTypes = [
  "dispenser", "terminal", "colony-map", "energy", "communications", "greenhouse", "solar-alert", "menu",
] as const;
export type ScreenType = typeof screenTypes[number];
export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 192;
export const SCREEN_ROWS = 7;
const MEAL_CELL_OFFSET = screenTypes.length + irisExpressions.length;
const DECAL_CELL_OFFSET = MEAL_CELL_OFFSET + mealScreenTypes.length;
let cached: ReturnType<typeof buildScreens> | undefined;

function circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function drawContents(context: CanvasRenderingContext2D, type: ScreenType) {
  const cyan = paletteHex("cyan");
  const amber = paletteHex("warning");
  const green = paletteHex("leaf");
  context.lineWidth = 3;
  context.strokeStyle = cyan;
  context.fillStyle = cyan;
  context.font = "13px monospace";
  if (type === "dispenser") {
    circle(context, 72, 92, 25, amber);
    context.fillStyle = green;
    context.fillRect(44, 91, 56, 7);
    context.fillStyle = paletteHex("oxide");
    context.fillRect(46, 100, 52, 8);
    circle(context, 164, 95, 26, cyan);
    circle(context, 164, 87, 23, amber);
    context.fillStyle = cyan;
    context.fillRect(237, 78, 32, 39);
    context.strokeRect(268, 82, 14, 21);
    context.fillText("MEAL 01   SOUP   DRINK", 39, 145);
  } else if (type === "colony-map") {
    const nodes = [[58, 89], [146, 70], [252, 87], [120, 137], [222, 137]];
    context.beginPath();
    for (const [x, y] of nodes) { context.moveTo(160, 105); context.lineTo(x, y); }
    context.stroke();
    for (const [x, y] of nodes) {
      context.strokeRect(x - 18, y - 12, 36, 24);
      circle(context, x, y, 4, amber);
    }
  } else if (type === "energy") {
    for (let index = 0; index < 8; index++) {
      context.fillStyle = index < 6 ? cyan : "#284856";
      context.fillRect(32 + index * 33, 124 - index * 9, 23, 20 + index * 9);
    }
    context.fillStyle = cyan;
    context.fillText("STORAGE  78% / 42 kW", 32, 64);
  } else if (type === "communications") {
    circle(context, 52, 92, 18, "#1E6FA8");
    circle(context, 47, 88, 7, green);
    circle(context, 268, 92, 14, paletteHex("oxide"));
    context.setLineDash([6, 5]);
    context.beginPath();
    context.moveTo(76, 92);
    context.quadraticCurveTo(162, 54, 248, 92);
    context.stroke();
    context.setLineDash([]);
    circle(context, 162, 73, 9, amber);
    context.fillStyle = amber;
    context.fillRect(150, 56, 24, 11);
    context.fillStyle = cyan;
    context.font = "bold 12px monospace";
    context.fillText("EARTH", 32, 125);
    context.fillText("MARS", 252, 125);
    context.strokeRect(72, 134, 176, 38);
    context.fillStyle = amber;
    context.font = "bold 17px monospace";
    context.fillText("WAIT 12:40", 108, 159);
  } else if (type === "greenhouse") {
    for (const x of [65, 155, 245]) {
      context.fillStyle = green;
      context.fillRect(x - 3, 85, 6, 46);
      context.beginPath();
      context.ellipse(x - 13, 88, 18, 8, 0.5, 0, Math.PI * 2);
      context.ellipse(x + 12, 103, 18, 8, -0.5, 0, Math.PI * 2);
      context.fill();
      context.strokeRect(x - 29, 132, 58, 9);
    }
    context.fillStyle = cyan;
    context.fillText("WATER OK / CYCLE 04", 44, 162);
  } else if (type === "solar-alert") {
    context.strokeStyle = amber;
    context.beginPath();
    context.moveTo(67, 62); context.lineTo(27, 137); context.lineTo(107, 137); context.closePath();
    context.stroke();
    context.fillStyle = amber;
    context.font = "bold 42px monospace";
    context.fillText("!", 54, 126);
    context.font = "14px monospace";
    context.fillText("SOLAR STORM", 137, 84);
    context.fillText("ENTER SHELTER", 137, 111);
    context.fillText("AIRLOCK SEALED", 137, 138);
  } else {
    const rows = type === "terminal"
      ? ["> SYSTEM CHECK", "> OXYGEN: NOMINAL", "> PRESSURE: 101 kPa", "> ALL SYSTEMS READY"]
      : ["01  COLONY STATUS", "02  CREW DIRECTORY", "03  SUPPLY LOG", "04  SETTINGS"];
    rows.forEach((text, index) => {
      context.fillStyle = index === 0 ? amber : cyan;
      context.fillText(text, 30, 69 + index * 25);
    });
  }
}

function buildScreens() {
  const canvases = new Map<ScreenType, HTMLCanvasElement>();
  const sheet = document.createElement("canvas");
  sheet.width = SCREEN_WIDTH * 4;
  sheet.height = SCREEN_HEIGHT * SCREEN_ROWS;
  const sheetContext = sheet.getContext("2d")!;
  screenTypes.forEach((type, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#071D29";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = paletteHex("cyan");
    context.lineWidth = 2;
    context.strokeRect(7, 7, 306, 178);
    context.fillStyle = paletteHex("cyan");
    context.font = "bold 15px monospace";
    context.fillText(type.replaceAll("-", " ").toUpperCase(), 20, 32);
    drawContents(context, type);
    canvases.set(type, canvas);
    sheetContext.drawImage(canvas, index % 4 * SCREEN_WIDTH, Math.floor(index / 4) * SCREEN_HEIGHT);
  });
  irisExpressions.forEach((expression, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    drawIrisFace(canvas.getContext("2d")!, expression);
    const cell = screenTypes.length + index;
    sheetContext.drawImage(canvas, cell % 4 * SCREEN_WIDTH, Math.floor(cell / 4) * SCREEN_HEIGHT);
  });
  mealScreenTypes.forEach((meal, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    drawMealHud(canvas.getContext("2d")!, meal, SCREEN_WIDTH, SCREEN_HEIGHT);
    const cell = MEAL_CELL_OFFSET + index;
    sheetContext.drawImage(canvas, cell % 4 * SCREEN_WIDTH, Math.floor(cell / 4) * SCREEN_HEIGHT);
  });
  decalTypes.forEach((decal, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    drawDecalSticker(canvas.getContext("2d")!, decal, SCREEN_WIDTH, SCREEN_HEIGHT);
    const cell = DECAL_CELL_OFFSET + index;
    sheetContext.drawImage(canvas, cell % 4 * SCREEN_WIDTH, Math.floor(cell / 4) * SCREEN_HEIGHT);
  });
  const texture = new CanvasTexture(sheet);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  materials.M_screen.map = texture;
  materials.M_screen.needsUpdate = true;
  return { canvases, sheet, texture };
}

/** Shared packed canvas texture for all station UI, Iris expressions, and food dispenser screens. */
export function getScreens() {
  return cached ??= buildScreens();
}

export function screenGeometry(source: BufferGeometry, type: ScreenType): BufferGeometry {
  const index = screenTypes.indexOf(type);
  if (index < 0) throw new Error(`Unknown screen type: ${type}`);
  return screenCellGeometry(source, index);
}

export function mealScreenGeometry(source: BufferGeometry, meal: MealScreenType): BufferGeometry {
  const index = mealScreenTypes.indexOf(meal);
  if (index < 0) throw new Error(`Unknown meal screen: ${meal}`);
  return screenCellGeometry(source, MEAL_CELL_OFFSET + index);
}

export function decalScreenGeometry(source: BufferGeometry, decal: DecalType): BufferGeometry {
  const index = decalTypes.indexOf(decal);
  if (index < 0) throw new Error(`Unknown decal sticker: ${decal}`);
  return screenCellGeometry(source, DECAL_CELL_OFFSET + index);
}

export function screenCellGeometry(source: BufferGeometry, index: number): BufferGeometry {
  if (!Number.isInteger(index) || index < 0 || index >= 4 * SCREEN_ROWS) {
    throw new Error("Invalid screen atlas cell");
  }
  const geometry = source.clone();
  const uv = geometry.getAttribute("uv");
  if (!uv) throw new Error("Screen geometry requires UV coordinates");
  const insetU = 0.5 / (SCREEN_WIDTH * 4);
  const insetV = 0.5 / (SCREEN_HEIGHT * SCREEN_ROWS);
  for (let vertex = 0; vertex < uv.count; vertex++) {
    uv.setXY(vertex,
      index % 4 / 4 + insetU + uv.getX(vertex) * (0.25 - 2 * insetU),
      1 - (Math.floor(index / 4) + 1) / SCREEN_ROWS + insetV +
        uv.getY(vertex) * (1 / SCREEN_ROWS - 2 * insetV),
    );
  }
  return geometry;
}
