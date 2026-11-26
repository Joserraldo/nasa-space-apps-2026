import type { Object3D } from "three";
import { inventoryIds } from "./inventory";
import { stableKey } from "./primitives/cache";
import type { PieceDefinition, PieceMetadata } from "./types";

interface RegisteredPiece {
  id: string;
  metadata: PieceMetadata;
  variants: Readonly<Record<string, object>>;
  parse: (input: unknown) => object;
  build: (params: object) => Object3D;
}

/** Each instance owns transforms; immutable cached geometries and materials are shared. */
export class PieceRegistry {
  private readonly definitions = new Map<string, RegisteredPiece>();
  private readonly templates = new Map<string, Object3D>();

  register<P extends object>(id: string, definition: PieceDefinition<P>): void {
    if (!inventoryIds.has(id)) throw new Error(`Unknown inventory id: ${id}`);
    if (this.definitions.has(id)) throw new Error(`Duplicate piece id: ${id}`);
    if (!Object.keys(definition.variants).length) throw new Error(`Missing variants: ${id}`);
    for (const params of Object.values(definition.variants)) definition.parse(params);
    this.definitions.set(id, {
      ...definition, id, build: params => definition.build(params as P),
    });
  }

  entries(): RegisteredPiece[] { return [...this.definitions.values()]; }
  ids(): string[] { return [...this.definitions.keys()]; }

  build(id: string, input: unknown = {}, fresh = false): Object3D {
    const definition = this.definitions.get(id);
    if (!definition) throw new Error(`Piece not registered: ${id}`);
    const params = definition.parse(input);
    const key = stableKey([id, params]);
    let template = fresh ? undefined : this.templates.get(key);
    if (!template) {
      template = definition.build(params);
      if (!fresh) this.templates.set(key, template);
    }
    const object = template.clone(true);
    const variant = Object.entries(definition.variants).find(([, p]) => stableKey(definition.parse(p)) === stableKey(params))?.[0] ?? "custom";
    object.name = `${id}_${variant}`;
    object.userData.pieceId = id;
    return object;
  }
}
