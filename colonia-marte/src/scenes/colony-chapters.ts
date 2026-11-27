const loadStarter = () => import("../../data/layouts/colonies/c2-inicio.json");
const loadFinal = () => import("../../data/layouts/colonies/final.json");

const chapters = new Map<string, () => Promise<{ default: unknown }>>([
  ["c2", loadStarter],
  ["c2-inicio", loadStarter],
  ["c3", () => import("../../data/layouts/colonies/c3.json")],
  ["c4", () => import("../../data/layouts/colonies/c4.json")],
  ["c5", () => import("../../data/layouts/colonies/c5.json")],
  ["final", loadFinal],
]);

export async function loadColonyChapter(params: URLSearchParams) {
  const chapter = params.get("chapter");
  if ((chapter === "c5" || chapter === "final") && params.get("site") === "polar") {
    return (await import("../../data/layouts/colonies/c5-polar.json")).default;
  }
  const load = chapters.get(chapter ?? "") ?? loadFinal;
  return (await load()).default;
}
