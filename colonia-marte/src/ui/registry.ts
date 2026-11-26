import type { RegisteredUIComponent, UIComponentDefinition, UILayer } from "./types";

const UI_ID_PATTERN = /^UI-(FOUNDATION|ATOM|MOLECULE|ORGANISM)-[A-Z0-9-]+$/;

/** Typed Atomic Design registry mirroring PieceRegistry conventions for 2D HUD/UI elements. */
export class UIRegistry {
  private readonly definitions = new Map<string, RegisteredUIComponent>();

  register<P extends object>(id: string, definition: UIComponentDefinition<P>): void {
    if (!UI_ID_PATTERN.test(id)) {
      throw new Error(`Invalid UI component id "${id}": expected UI-<LAYER>-<NAME>`);
    }
    if (this.definitions.has(id)) {
      throw new Error(`Duplicate UI component id: ${id}`);
    }
    const variantNames = Object.keys(definition.variants);
    if (!variantNames.length) {
      throw new Error(`Missing variants for UI component: ${id}`);
    }
    for (const params of Object.values(definition.variants)) {
      definition.parse(params);
    }
    this.definitions.set(id, {
      id,
      metadata: definition.metadata,
      variants: definition.variants,
      parse: input => definition.parse(input),
      render: params => definition.render(params as P),
    });
  }

  ids(): string[] {
    return [...this.definitions.keys()];
  }

  entries(layer?: UILayer): RegisteredUIComponent[] {
    const all = [...this.definitions.values()];
    return layer ? all.filter(entry => entry.metadata.layer === layer) : all;
  }

  get(id: string): RegisteredUIComponent | undefined {
    return this.definitions.get(id);
  }

  render(id: string, input: unknown = {}): HTMLElement {
    const definition = this.definitions.get(id);
    if (!definition) {
      throw new Error(`UI component not registered: ${id}`);
    }
    const params = definition.parse(input);
    const element = definition.render(params);
    element.dataset.uiId = id;
    element.dataset.uiLayer = definition.metadata.layer;
    element.dataset.figmaNode = definition.metadata.figmaNodeId;
    return element;
  }
}
