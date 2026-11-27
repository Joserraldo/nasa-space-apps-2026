import { MathUtils } from "three";
import districtJson from "../../data/layouts/colonies/base-district.json";
import pilotJson from "../../data/layouts/colonies/exterior-pilot.json";
import { parseColonyPaving } from "../kit/pieces/mars/colony-street";
import { plazaOutline } from "../kit/pieces/mars/colony-plaza";
import type { PieceRegistry } from "../kit/registry";
import { parseColonyLayout, type ColonyLayout, type ColonyPlacementSpec, type ColonyViewSpec } from "./colony-layout";

type PlanPoint = ColonyPlacementSpec["at"];

const districtViews: ColonyViewSpec[] = [
  {
    id: "district-overview", label: "District overview",
    position: [-34, 24, 57], target: [-64, 1, 11], fov: 49,
  },
  {
    id: "entrance-to-district", label: "Entrance toward district", eyeHeight: 1.5,
    position: [-15.95, 1.5, 36.8], target: [-59, 1.8, 19], fov: 53,
  },
];
const arrivalView: ColonyViewSpec = {
  id: "family-arrival", label: "Family arrival",
  position: [31, 4.1, 4], target: [20.2, 5.1, -7.35], fov: 48,
};

function road(at: PlanPoint, points: PlanPoint[], districtConnector: "arterial" | "hub"): ColonyPlacementSpec {
  const path = points.map(([x, z]) => [x - at[0], z - at[1]]);
  return { id: "MI-01", at, districtConnector, params: { layout: "road", path } };
}

export function composeColonyLayout(layout: ColonyLayout, registry?: PieceRegistry): ColonyLayout {
  const area = layout.reservedAreas.find(area => area.sublayout === "base-district");
  if (!area) return layout;
  const source = parseColonyLayout(districtJson, registry);
  const pilot = parseColonyLayout(pilotJson);
  const [ox, oz] = area.at;
  const rotation = area.rot ?? 0;
  const angle = MathUtils.degToRad(rotation);
  const c = Math.cos(angle), s = Math.sin(angle);
  const world = ([x, z]: PlanPoint): PlanPoint => [ox + x * c + z * s, oz + z * c - x * s];
  const imported = source.placements.map((part): ColonyPlacementSpec => ({
    ...part, id: part.id === "MB-14" ? "MB-13" : part.id,
    at: world(part.at), rot: (part.rot ?? 0) + rotation,
    ...(source.flatPlatform ? { platform: "base-district" } : {}),
  }));

  // Carbon's arterial is the longitudinal road exporting the east mouth after rotation.
  const plaza = source.placements.find(part => part.id === "MI-01" && part.params?.layout === "plaza");
  const arterial = source.placements.find(part => part.id === "MI-01" && part.params?.layout === "road" && part.at[0] === -9.2);
  if (!plaza || !arterial) throw new Error("Missing district platform or arterial");
  const plazaSpec = parseColonyPaving(plaza.params ?? {});
  const arterialSpec = parseColonyPaving(arterial.params ?? {});
  if (plazaSpec.layout !== "plaza" || arterialSpec.layout !== "road") throw new Error("Invalid district paving");
  for (const [x, z] of plazaOutline(plazaSpec)) {
    const [wx, wz] = world([plaza.at[0] + x, plaza.at[1] + z]);
    if (Math.abs(wx - ox) > area.size[0] / 2 || Math.abs(wz - oz) > area.size[1] / 2) {
      throw new Error("District platform exceeds its reserved area");
    }
  }

  const [endX, endZ] = arterialSpec.path.at(-1)!;
  const outlet = world([arterial.at[0] + endX, arterial.at[1] + endZ]);
  const junction: PlanPoint = [-24, 24];
  const entranceRoad = road(outlet, [outlet, [-31.5, 20.2], junction, [-20.2, 30.5], [-15.85, 35.0]], "arterial");
  const hubRoad = road(junction, [junction, [-20.2, 18.25], [-16.6, 19.1], [-7.85, 18.25], [2.7, 20.5], [5.6, 15.7], [4.65, 12.99]], "hub");

  // The west entrance appears with the district, even in chapters before the final colony.
  const entrances = pilot.placements.filter(part =>
    (part.id === "MI-01" && part.params?.layout === "plaza" && part.at[1] > 20) ||
    part.id === "MB-05" || part.id === "MB-14" || (part.id === "NX-04" && part.params?.principal === true));
  const missingEntrances = entrances.filter(part => !layout.placements.some(existing =>
    existing.id === part.id && existing.at[0] === part.at[0] && existing.at[1] === part.at[1]));
  const views = layout.views.length === 1 ? [layout.views[0], ...pilot.views.slice(1)] : layout.views;
  return {
    ...layout,
    placements: [...layout.placements, ...missingEntrances, ...imported, entranceRoad, hubRoad],
    views: layout.id === "final" ? [...views, ...districtViews, arrivalView] : [...views, ...districtViews],
  };
}
