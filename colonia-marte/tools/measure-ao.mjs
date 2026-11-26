import { createServer } from "vite";
import { writeFile } from "node:fs/promises";

// Middleware mode transforms TypeScript without opening another HTTP port.
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { createAORoom } = await server.ssrLoadModule("/src/scenes/ao-fixture.ts");
  const { bakeRoomAO } = await server.ssrLoadModule("/tools/bake-room-ao.ts");
  const { serializeAOCache, restoreAOCache } = await server.ssrLoadModule("/tools/bake-vertex-ao.ts");
  const { triangleCount } = await server.ssrLoadModule("/tools/geometry-inspection.ts");
  const room = createAORoom(), cache = new Map();
  const cold = bakeRoomAO(room, {}, cache);
  const json = serializeAOCache(cache);
  const warm = bakeRoomAO(room, {}, restoreAOCache(json));
  const colors = cold.group.children.flatMap(mesh => Array.from(mesh.geometry.getAttribute("color").array));
  const result = {
    runtime: process.version, samples: 48, radiusMeters: 1.25, modules: 3,
    triangles: triangleCount(room), vertices: colors.length / 3,
    coldMilliseconds: cold.milliseconds, warmMilliseconds: warm.milliseconds,
    warmCacheHits: warm.results.every(item => item.cacheHit), cacheBytes: Buffer.byteLength(json),
    minimumVisibility: Math.min(...colors), maximumVisibility: Math.max(...colors),
  };
  await writeFile("docs/capturas/t4-2-ao-metrics.json", JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result, null, 2));
} finally {
  await server.close();
}
