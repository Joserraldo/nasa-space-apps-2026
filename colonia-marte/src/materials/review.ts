import { Box3 } from "three";
import { fitSheetCamera } from "../catalog/layout";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { createLink, createNavbar, DEFAULT_APP_NAV_ITEMS } from "../ui";
import { atlas } from "./atlas";
import { palette } from "./palette";
import { materialSamples } from "./samples";
import { getScreens } from "./screens";

export function atlasCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = atlas.width;
  canvas.height = atlas.height;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Palette atlas, 256 by 256 pixels. Emissive colors occupy the bottom row.");
  const context = canvas.getContext("2d")!;
  const pixels = context.createImageData(atlas.width, atlas.height);
  pixels.data.set(atlas.pixels);
  context.putImageData(pixels, 0, 0);
  return canvas;
}

export function addCatalogAtlas() {
  const container = document.getElementById("palette-preview")!;
  const heading = document.createElement("h2");
  heading.textContent = "WS1 palette atlas";
  const link = createLink({
    label: "Review six materials and eight screens",
    href: "/materials",
    style: "onTheme",
  });
  container.append(heading, atlasCanvas(), link);
}

export function mountMaterialsReview() {
  document.title = "Materials review | Mars Colony";
  const app = document.getElementById("app")!;
  const navbar = createNavbar({
    eyebrow: "WS1 / APPROVAL GATE",
    title: "Palette & materials",
    items: DEFAULT_APP_NAV_ITEMS("/materials"),
  });
  app.innerHTML = `
    <main class="materials-review">
      <div class="review-content">
        <section class="atlas-section" aria-labelledby="atlas-heading">
          <div><h2 id="atlas-heading">256 × 256 palette</h2><div id="atlas-image"></div></div>
          <div><p>${palette.length} colors. Bottom row: ${palette.filter(color => color.emissive).length} emissives.
            Nearest sampling, no mipmaps.</p>
            <p>Observed samples preserve the reference. Base colors drive the atlas and materials.
              Declared values have no measured frame; daylight sky follows MARTE.md.</p>
            <ul id="swatches" role="list"></ul>
          </div>
        </section>
        <section class="material-stage" aria-label="Six material samples: sphere and beveled cube for each">
          <div id="viewport"></div>
        </section>
        <section aria-labelledby="screens-heading">
          <h2 id="screens-heading">Shared screen interfaces</h2><div id="screens"></div>
        </section>
        <p class="review-note">Material swatches only. Terrain geometry and environment presets belong to WS2.</p>
      </div>
      <aside class="reference-strip" aria-label="Reference frames">
        <h2>Compare references</h2>
        <figure><img src="/references/interior.jpg" width="480" height="270"
          alt="Interior: warm gray panels, blue seating and cyan dispenser screens">
          <figcaption>Interior / v2-t017.10</figcaption></figure>
        <figure><img src="/references/exterior.jpg" width="480" height="270"
          alt="Exterior: gray capsule shells and warm luminous hexagons on polar terrain">
          <figcaption>Exterior / v3-t054.60</figcaption></figure>
        <figure><img src="/references/crew.jpg" width="480" height="270"
          alt="Crew: faceted characters with flat red, teal and neutral uniform panels">
          <figcaption>Crew / v1-t039.90</figcaption></figure>
        <p>V3 ice is polar only. Its lavender sky and planetary ring are excluded.</p>
      </aside>
    </main>`;
  app.prepend(navbar);

  document.getElementById("atlas-image")!.append(atlasCanvas());
  const swatches = document.getElementById("swatches")!;
  for (const color of palette) {
    const item = document.createElement("li");
    item.dataset.color = color.id;
    const label = document.createElement("strong");
    label.textContent = `${color.id} / ${color.role}`;
    const pair = document.createElement("div");
    pair.className = "swatch-pair";
    for (const [name, hex] of [["observed", color.observed.hex], ["base", color.base]]) {
      const sample = document.createElement("span");
      sample.className = `${name}-swatch`;
      const chip = document.createElement("span");
      chip.className = "color-chip";
      chip.setAttribute("aria-hidden", "true");
      if (hex) chip.style.background = hex;
      sample.append(chip, `${name}: ${hex ?? "not measured"}`);
      pair.append(sample);
    }
    const reason = document.createElement("small");
    reason.textContent = color.baseReason;
    const provenance = document.createElement("small");
    const observed = color.observed;
    provenance.textContent = observed.frame ? `${observed.frame} [${observed.region?.join(", ")}]`
      : `Declared value / ${color.source}`;
    item.append(label, pair, reason, provenance);
    item.title = `${color.usage} (${color.source})`;
    swatches.append(item);
  }
  const screens = getScreens();
  for (const [type, canvas] of screens.canvases) {
    const figure = document.createElement("figure");
    const caption = document.createElement("figcaption");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${type.replaceAll("-", " ")} interface preview`);
    caption.textContent = type.replaceAll("-", " ");
    figure.append(canvas, caption);
    document.getElementById("screens")!.append(figure);
  }
  const viewport = document.getElementById("viewport")!;
  const rendering = createRendering(viewport);
  rendering.stats.dom.hidden = true;
  const samples = materialSamples();
  rendering.scene.add(samples.group);
  const bounds = new Box3().setFromObject(samples.group);
  samples.entries.forEach(entry => bounds.expandByPoint(entry.anchor));
  const labels = samples.entries.map(entry => {
    const element = document.createElement("div");
    element.className = "asset-label";
    element.textContent = entry.label;
    viewport.append(element);
    return { element, anchor: entry.anchor };
  });
  const stop = startLoop(viewport, dt => {
    fitSheetCamera(rendering.camera, bounds);
    rendering.composer.render(dt);
    for (const { element, anchor } of labels) {
      const point = anchor.clone().project(rendering.camera);
      element.style.left = `${((point.x + 1) * viewport.clientWidth) / 2}px`;
      element.style.top = `${((1 - point.y) * viewport.clientHeight) / 2}px`;
    }
  });
  window.addEventListener("pagehide", () => { stop(); rendering.dispose(); }, { once: true });
}
