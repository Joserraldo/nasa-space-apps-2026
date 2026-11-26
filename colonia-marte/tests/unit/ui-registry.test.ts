import { beforeEach, describe, expect, it } from "vitest";
import {
  createIcon,
  createUIRegistry,
  UI_ICON_NAMES,
  uiColors,
  uiSpacing,
  uiTypography,
  UIRegistry,
} from "../../src/ui";
import { installDomShim } from "./helpers/dom-shim";

const UI_SOURCE_FILES = import.meta.glob<string>("../../src/ui/**/*.{ts,css}", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("UIRegistry and Sci-fi UI Kit Foundation", () => {
  beforeEach(() => {
    installDomShim();
  });

  it("registers all 46 Atomic UI modules across Foundation, Atoms, Molecules, and Organisms", () => {
    const registry = createUIRegistry();
    expect(registry.ids()).toHaveLength(46);
    expect(registry.entries("foundation")).toHaveLength(4);
    expect(registry.entries("atom")).toHaveLength(19);
    expect(registry.entries("molecule")).toHaveLength(14);
    expect(registry.entries("organism")).toHaveLength(9);

    for (const entry of registry.entries()) {
      expect(entry.metadata.figmaNodeId.length).toBeGreaterThan(2);
      for (const [variantName, params] of Object.entries(entry.variants)) {
        const rendered = registry.render(entry.id, params);
        expect(rendered.dataset.uiId, `${entry.id}:${variantName}`).toBe(entry.id);
        expect(rendered.dataset.uiLayer).toBe(entry.metadata.layer);
      }
    }
  });

  it("enforces ID naming, duplicate detection, and non-empty variants on registration", () => {
    const registry = new UIRegistry();
    expect(() =>
      registry.register("BAD-ID", {
        metadata: { layer: "atom", name: "Bad", figmaNodeId: "1:1", description: "Invalid" },
        variants: { base: {} },
        parse: () => ({}),
        render: () => document.createElement("div"),
      }),
    ).toThrow(/Invalid UI component id/);

    expect(() =>
      registry.register("UI-ATOM-EMPTY", {
        metadata: { layer: "atom", name: "Empty", figmaNodeId: "1:1", description: "No variants" },
        variants: {},
        parse: () => ({}),
        render: () => document.createElement("div"),
      }),
    ).toThrow(/Missing variants/);

    registry.register("UI-ATOM-SAMPLE", {
      metadata: { layer: "atom", name: "Sample", figmaNodeId: "1:2", description: "Valid" },
      variants: { base: {} },
      parse: () => ({}),
      render: () => document.createElement("div"),
    });

    expect(() =>
      registry.register("UI-ATOM-SAMPLE", {
        metadata: { layer: "atom", name: "Duplicate", figmaNodeId: "1:2", description: "Dup" },
        variants: { base: {} },
        parse: () => ({}),
        render: () => document.createElement("div"),
      }),
    ).toThrow(/Duplicate UI component id/);
  });

  it("renders all 39 Figma icons with decorative aria-hidden by default and role=img when labeled", () => {
    expect(UI_ICON_NAMES).toHaveLength(39);
    for (const name of UI_ICON_NAMES) {
      const decorative = createIcon(name);
      expect(decorative.getAttribute("aria-hidden")).toBe("true");
      expect(decorative.querySelectorAll("path").length).toBeGreaterThan(0);
    }
    const labeled = createIcon("warninig", { label: "System warning", size: 20 });
    expect(labeled.getAttribute("role")).toBe("img");
    expect(labeled.getAttribute("aria-label")).toBe("System warning");
    expect(labeled.getAttribute("width")).toBe("20");
  });

  it("exposes verified Figma color scales, typography tokens, spacing steps, and clean local files", () => {
    expect(uiColors.primary[500]).toBe("#ca3535");
    expect(uiColors.info[300]).toBe("#66ffff");
    expect(uiTypography).toHaveLength(13);
    expect(uiSpacing).toHaveLength(14);

    const entries = Object.entries(UI_SOURCE_FILES);
    expect(entries.length).toBeGreaterThanOrEqual(15);
    for (const [filePath, source] of entries) {
      expect(source, `${filePath} must not contain temporary Figma MCP URLs`).not.toContain(
        "figma.com/api/mcp/asset",
      );
      const lineCount = source.split(/\r?\n/).length;
      expect(lineCount, `${filePath} exceeds 300 lines (${lineCount})`).toBeLessThanOrEqual(300);
    }
  });
});
