import { PerspectiveCamera, Vector3 } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import canteen from "../../data/layouts/rooms/canteen.json";
import { createNavigation, type WalkLayout } from "../../src/navigation/mode-controller";
import { parseRoomLayout } from "../../src/catalog/layout";
import { createProductionRegistry } from "../../src/kit/pieces";

vi.mock("three/addons/controls/OrbitControls.js", () => ({
  OrbitControls: class {
    target = new Vector3();
    update() {}
    dispose() {}
  },
}));

describe("walking bounds from the room layout", () => {
  beforeEach(() => {
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("document", new EventTarget());
  });
  afterEach(() => vi.unstubAllGlobals());

  function walk(layout: WalkLayout, start: [number, number, number]) {
    const camera = new PerspectiveCamera();
    camera.position.set(...start);
    const joystick = { x: 0, y: 0, active: false };
    const navigation = createNavigation(camera, new EventTarget() as HTMLCanvasElement, joystick, layout);
    navigation.setMode("walk");
    return { camera, joystick, navigation };
  }

  it.each([[1, 1], [1, -1], [-1, 1], [-1, -1]])("reaches the NW-15 corner %s, %s and stops inside its walls", (x, z) => {
    // NW-15's authored grid is 6×4 two-metre cells in the Carbon worktree.
    const { camera, joystick, navigation } = walk({ module: 2, size: [6, 4] }, [6, 1.5, 4]);
    try {
      joystick.x = x;
      joystick.y = -z;
      for (let i = 0; i < 160; i++) navigation.update(.05);
      expect(camera.position.toArray()).toEqual([x > 0 ? 11.5 : .5, 1.5, z > 0 ? 7.5 : .5]);
    } finally { navigation.dispose(); }
  });

  it("preserves canteen spawn and speed and clamps before walking from an outside camera", () => {
    const layout = parseRoomLayout(canteen, createProductionRegistry());
    const { camera, joystick, navigation } = walk(layout, [11.5, 1.5, 4.2]);
    try {
      expect(camera.position.toArray()).toEqual([11.5, 1.5, 4.2]);
      joystick.y = 1;
      navigation.update(.05);
      expect(camera.position.x).toBe(11.5);
      expect(camera.position.z).toBeCloseTo(4.09);
      camera.position.set(19, 4, -3);
      navigation.setMode("walk");
      expect(camera.position.toArray()).toEqual([15.5, 1.5, .5]);
    } finally { navigation.dispose(); }
  });
});
