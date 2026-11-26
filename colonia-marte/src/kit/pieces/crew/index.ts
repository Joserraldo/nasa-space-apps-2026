import type { PieceRegistry } from "../../registry";
import { irisExpressions } from "../../../materials/iris-faces";
import { buildIris, parseIris } from "./iris";

export function registerCrewPieces(registry: PieceRegistry): void {
  registry.register("CH-09", {
    parse: parseIris, build: buildIris,
    variants: Object.fromEntries(irisExpressions.map(expression => [expression, { expression }])),
    metadata: { category: "vehicle", pivot: "axle-center", pivotOffset: [0, 0.255, 0] },
  });
}
