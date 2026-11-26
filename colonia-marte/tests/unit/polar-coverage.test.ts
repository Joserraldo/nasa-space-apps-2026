import { expect, it } from "vitest";
import { Mesh, PerspectiveCamera, Raycaster, Triangle, Vector2, Vector3 } from "three";
import { createTerrain } from "../../src/environment/terrain";
import { noise } from "../../src/environment/noise";

it("keeps ice dominant in a projected sample grid from both review cameras", () => {
  const terrain = createTerrain({ biome: "polar", seed: 42 }); terrain.updateMatrixWorld(true);
  const ray = new Raycaster();
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), bary = new Vector3();
  for (const elevated of [false, true]) {
    const camera = new PerspectiveCamera(54, 1080 / 860, 0.1, 60000);
    camera.position.set(0, elevated ? 25 : 1.5, elevated ? 45 : 12);
    camera.lookAt(0, elevated ? 0 : 1.5, elevated ? -220 : -100); camera.updateMatrixWorld(true);
    let covered = 0, samples = 0;
    for (let y = -0.95; y <= 0.15; y += 0.1) for (let x = -0.95; x < 1; x += 0.1) {
      ray.setFromCamera(new Vector2(x, y), camera);
      const hit = ray.intersectObject(terrain, true)[0];
      if (!hit?.face || !(hit.object instanceof Mesh)) continue;
      const position = hit.object.geometry.getAttribute("position");
      const bias = hit.object.geometry.getAttribute("iceBias");
      const seed = hit.object.geometry.getAttribute("iceSeed");
      const face = hit.face;
      Triangle.getBarycoord(hit.point, a.fromBufferAttribute(position, face.a),
        b.fromBufferAttribute(position, face.b), c.fromBufferAttribute(position, face.c), bary);
      const interpolatedBias = bias.getX(face.a) * bary.x + bias.getX(face.b) * bary.y + bias.getX(face.c) * bary.z;
      const field = noise(hit.point.x / 32, hit.point.z / 32, seed.getX(face.a)) + interpolatedBias;
      covered += field > 0.29 ? 1 : 0; samples++;
    }
    const ratio = covered / samples;
    console.log("PROJECTED_POLAR_ICE", JSON.stringify({ elevated, samples, covered, ratio }));
    expect(samples).toBeGreaterThan(50); expect(ratio).toBeGreaterThan(0.6);
  }
  terrain.children.forEach(node => (node as Mesh).geometry.dispose());
});
