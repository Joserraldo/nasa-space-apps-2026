import { Color, Group, Mesh, SphereGeometry } from "three";
import { paletteHex } from "../../../materials/palette";
import { materials } from "../../../materials/shared";
import { alignBaseCenter, weldedColoredGeometry } from "../station/helpers";

type Coast = [longitude: number, latitude: number][];

// Low-resolution outlines for an Atlantic-facing globe; no texture is loaded.
const continents: Coast[] = [
  [[-165,65],[-142,70],[-126,55],[-119,33],[-102,20],[-85,15],[-81,9],[-77,10],[-82,26],[-68,44],[-54,48],[-58,61],[-78,67],[-102,74],[-132,70]],
  [[-80,11],[-63,10],[-49,1],[-35,-7],[-40,-18],[-55,-32],[-67,-55],[-75,-43],[-71,-18],[-80,-5]],
  [[-73,60],[-49,59],[-27,68],[-21,81],[-46,83],[-66,75]],
  [[-17,15],[-17,30],[-9,36],[12,37],[32,31],[43,13],[51,11],[41,-11],[36,-23],[23,-35],[13,-33],[9,-18],[12,-4],[-4,5],[-13,9]],
  [[-10,36],[-9,44],[-2,52],[-9,59],[6,57],[16,69],[32,72],[58,70],[82,76],[120,74],[143,56],[125,36],[106,19],[101,8],[93,22],[80,8],[69,24],[54,27],[46,13],[38,10],[34,34],[26,40],[16,39],[13,44],[7,42],[1,43],[-1,36]],
  [[112,-22],[122,-17],[137,-13],[151,-23],[153,-34],[141,-39],[129,-32],[114,-35]],
];

function inside(lon: number, lat: number, coast: Coast): boolean {
  let land = false;
  for (let i = 0, j = coast.length - 1; i < coast.length; j = i++) {
    const [a, b] = coast[i], [c, d] = coast[j];
    if ((b > lat) !== (d > lat) && lon < (c - a) * (lat - b) / (d - b) + a) land = !land;
  }
  return land;
}

export function buildEarth() {
  const shape = new SphereGeometry(1, 112, 64);
  const geometry = weldedColoredGeometry(shape, "white");
  shape.dispose();
  const positions = geometry.getAttribute("position"), colors = geometry.getAttribute("color");
  const ocean = new Color(paletteHex("blue")).lerp(new Color(paletteHex("cyan")), 0.37);
  const shelf = new Color(paletteHex("cyan"));
  const green = new Color(paletteHex("leafDark")).lerp(new Color(paletteHex("leaf")), 0.31);
  const soil = new Color(paletteHex("skin")).lerp(new Color(paletteHex("yellow")), 0.12);
  const cloud = new Color(paletteHex("ice")), color = new Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const lon = ((Math.atan2(x, -z) * 180 / Math.PI + 520) % 360) - 180;
    const lat = Math.asin(Math.max(-1, Math.min(1, y))) * 180 / Math.PI;
    const relief = Math.sin(21 * x - 14 * z) * Math.cos(18 * y + 15 * z);
    const onLand = continents.some(coast => inside(lon + 2.2 * relief, lat + 1.2 * relief, coast));
    const dry = Math.max(0, 1 - Math.abs(Math.abs(lat) - 24) / 18);
    if (onLand) color.copy(green).lerp(soil, 0.22 + 0.67 * dry + 0.10 * relief);
    else color.copy(ocean).lerp(shelf, 0.05 + 0.045 * relief);
    const front = Math.sin(24 * y + 8 * x + 3 * Math.sin(8 * z - 6 * x));
    const wisps = Math.sin(15 * z - 13 * x + 9 * y) + 0.45 * Math.sin(34 * x + 14 * y);
    const clouds = Math.max(0, Math.min(1, (front + wisps - 1.12) * 1.75));
    color.lerp(cloud, Math.max(clouds * 0.88, Math.abs(lat) > 74 + 3 * relief ? 0.9 : 0));
    colors.setXYZ(i, color.r, color.g, color.b);
  }
  const earth = new Group();
  earth.add(new Mesh(geometry, materials.M_palette));
  return alignBaseCenter(earth);
}
