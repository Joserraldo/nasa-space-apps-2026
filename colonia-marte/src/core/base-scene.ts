import { Group } from "three";
import type { PieceRegistry } from "../kit/registry";
import { batchStatic } from "./batching";
import fixture from "../../data/layouts/fixtures/ws0-base.json";

/** Technical kit fixture only: no WS5 room layout or WS8 scene assembly. */
export function buildBaseScene(registry: PieceRegistry): Group {
  const root = new Group(); root.name = fixture.id;
  for (const reference of fixture.pieces) {
    const piece=registry.build(reference.id);
    piece.position.fromArray(reference.position); root.add(piece);
  }
  return batchStatic(root);
}
