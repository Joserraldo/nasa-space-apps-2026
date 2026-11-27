import { Mesh, type Object3D } from "three";
import { presets, type EnvironmentPreset } from "../environment/presets";
import { boxCenter } from "../kit/pieces/station/helpers";
import { paletteUV } from "../materials/atlas";
import { materials } from "../materials/shared";
import type { ColonyLayout } from "./colony-layout";

export function selectColonyEnvironment(layout: Pick<ColonyLayout, "environment" | "biome">, query: URLSearchParams) {
  const preset = (id: string) => presets.find(candidate => candidate.id === id) ?? presets[3];
  const weather = query.get("weather");
  const time = query.get("time");
  if (layout.biome === "polar") return preset("AMB-07");
  if (weather === "solar") {
    const day = preset("AMB-04");
    const alert: EnvironmentPreset = {
      ...day, id: "solar-alert", name: "Solar alert",
      light: { ...day.light, sun: "warning", sky: "sunHalo", intensity: 2.45, ambient: 1.32 },
      sky: { ...day.sky, halo: "warning", size: 0.18 },
    };
    return alert;
  }
  if (weather === "dust") return preset("AMB-06");
  if (time === "night") return preset("AMB-08");
  if (time === "dusk") return preset("AMB-05");
  if (time === "day" || weather === "clear") return preset("AMB-04");
  return preset(layout.environment);
}

const cellUV = paletteUV("blue");
const dustUV = paletteUV("regolithShade");

export function coverSolarCells(array: Object3D): void {
  array.traverse(node => {
    if (!(node instanceof Mesh) || node.material !== materials.M_palette) return;
    const uv = node.geometry.getAttribute("uv");
    if (!uv || !Array.from({ length: uv.count }, (_, i) => i)
      .some(i => uv.getX(i) === cellUV[0] && uv.getY(i) === cellUV[1])) return;
    // Cached piece geometry must remain unchanged when another chapter opens in clear weather.
    node.geometry = node.geometry.clone();
    const covered = node.geometry.getAttribute("uv");
    for (let i = 0; i < covered.count; i++) {
      if (covered.getX(i) === cellUV[0] && covered.getY(i) === cellUV[1]) covered.setXY(i, ...dustUV);
    }
  });
}

export function lightHabitatInterior(capsule: Object3D): void {
  // These emit from inside the pressure shell; the glass itself remains non-emissive.
  capsule.add(
    boxCenter([0.12, 0.16, 1.05], "warning", [-1.22, 1.55, 0.25], 0.012),
    boxCenter([0.12, 0.16, 1.05], "warning", [1.22, 1.55, 0.25], 0.012),
  );
}
