import { Box3, Group, Mesh, Vector3, type Object3D, type PerspectiveCamera } from "three";
import type { PieceRegistry } from "../kit/registry";
import { coloredGeometry, previewGlow, previewOpaque } from "../materials/preview";
import { triangleCount } from "../../tools/geometry-inspection";
import { arrangePage, fitSheetCamera } from "./layout";
import { catalogFamily, catalogPage } from "./pagination";
import { primitiveSamples } from "./samples";

export interface CatalogEntry {
  label: string;
  triangles: number;
  object: Group;
  anchor: Vector3;
}

export function createCatalog(registry: PieceRegistry, viewport: HTMLElement, list: HTMLElement) {
  const group = new Group();
  const entries: CatalogEntry[] = [];
  const candidates: { label: string; object: Object3D }[] = Object.entries(primitiveSamples).map(([name, build]) => ({
    label: name,
    object: new Mesh(
      coloredGeometry(build(), name === "ledStrip" ? "cyan" : name === "truncatedIcosa" ? "blue" : "white"),
      name === "ledStrip" ? previewGlow : previewOpaque,
    ),
  }));
  for (const entry of registry.entries()) {
    for (const [variant, params] of Object.entries(entry.variants)) {
      candidates.push({ label: `${entry.id} / ${variant}`, object: registry.build(entry.id, params) });
    }
  }
  for (const candidate of candidates) {
    const object = new Group();
    object.add(candidate.object);
    object.rotation.set(0.32, -0.45, 0);
    const triangles = triangleCount(object);
    entries.push({ label: candidate.label, triangles, object, anchor: new Vector3() });
  }

  const controls = document.createElement("div");
  controls.className = "catalog-controls";
  const label = document.createElement("label");
  label.htmlFor = "catalog-family";
  label.textContent = "Family";
  const family = document.createElement("select");
  family.id = label.htmlFor;
  family.className = "ui-select";
  for (const name of ["All", ...new Set(entries.map(entry => catalogFamily(entry.label)))]) {
    family.add(new Option(name, name));
  }

  const pager = document.createElement("div");
  pager.className = "catalog-pager";
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "ui-btn ui-btn--secondary";
  previous.textContent = "Previous page";
  const next = document.createElement("button");
  next.type = "button";
  next.className = "ui-btn ui-btn--secondary";
  next.textContent = "Next page";
  pager.append(previous, next);

  const status = document.createElement("p");
  status.className = "catalog-status";
  status.setAttribute("role", "status");
  controls.append(label, family, pager, status);
  list.before(controls);

  let page = 0;
  let camera: PerspectiveCamera | undefined;
  let labels: { element: HTMLDivElement; anchor: Vector3 }[] = [];
  const bounds = new Box3();

  const showPage = () => {
    const selection = catalogPage(entries, family.value, page);
    page = selection.page;
    labels.forEach(({ element }) => element.remove());
    bounds.copy(arrangePage(group, selection.items));
    labels = selection.items.map(entry => {
      const element = document.createElement("div");
      element.className = "asset-label";
      element.textContent = `${entry.label} · ${entry.triangles} tris`;
      viewport.append(element);
      return { element, anchor: entry.anchor };
    });
    list.replaceChildren(...selection.items.map(entry => {
      const item = document.createElement("li");
      item.textContent = `${entry.label} · ${entry.triangles} tris`;
      return item;
    }));
    status.textContent = `Page ${page + 1} / ${selection.pages} · ${selection.total} entries`;
    previous.disabled = page === 0;
    next.disabled = page === selection.pages - 1;
    if (camera) fitSheetCamera(camera, bounds);
  };

  family.onchange = () => { page = 0; showPage(); };
  previous.onclick = () => { page--; showPage(); };
  next.onclick = () => { page++; showPage(); };
  showPage();

  return {
    group,
    entries,
    fit(value: PerspectiveCamera) { camera = value; fitSheetCamera(value, bounds); },
    updateLabels(activeCamera: PerspectiveCamera) {
      const rect = viewport.getBoundingClientRect();
      for (const { element, anchor } of labels) {
        const position = anchor.clone().project(activeCamera);
        element.style.left = `${((position.x + 1) * rect.width) / 2}px`;
        element.style.top = `${((1 - position.y) * rect.height) / 2}px`;
        element.hidden = position.z > 1 || position.z < -1;
      }
    },
  };
}
