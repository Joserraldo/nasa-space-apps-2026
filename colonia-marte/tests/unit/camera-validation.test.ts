import { BoxGeometry, Group, Mesh, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { Vec3 } from "../../src/camera/schema";
import { ShotTrajectory } from "../../src/camera/trajectory";
import { validateShotTrajectory, type CameraPortal } from "../../src/camera/validation";

function straightShot(position: Vec3[], target: Vec3[]): ShotTrajectory {
  return new ShotTrajectory({
    id: "validation-shot", position, target, duration: 2, easing: "linear",
    fov: 60, environment: "AMB-01", zone: "Test", transition: { type: "cut" },
  });
}

const portal: CameraPortal = {
  id: "airlock", center: new Vector3(0.03, 0, 0), inwardNormal: new Vector3(2, 0, 0),
  right: new Vector3(0, 0, 1), halfWidth: 0.5, halfHeight: 1,
};

describe("camera trajectory validation", () => {
  it("reports the earliest transformed thin-wall hit between samples", () => {
    const trajectory = straightShot([[-1, 0, 0], [1, 0, 0]], [[2, 0, 0], [2, 0, 0]]);
    const geometry = new BoxGeometry(2, 2, 0.002);
    const nearWall = new Mesh(geometry);
    const farWall = new Mesh(geometry);
    const parent = new Group();
    parent.position.set(0.02, 0, 0);
    parent.rotation.y = Math.PI / 2;
    parent.scale.set(2, 0.5, 0.5);
    farWall.position.z = 0.12;
    parent.add(nearWall, farWall);
    const originalIndex = Array.from(geometry.index!.array);

    const result = validateShotTrajectory(trajectory, [farWall, nearWall], []);

    expect(result).toMatchObject({ ok: false, kind: "collision", mesh: nearWall });
    if (result.ok) return;
    expect(result.point.x).toBeCloseTo(0.0195, 6);
    expect(result.point.y).toBeCloseTo(0, 6);
    expect(result.point.z).toBeCloseTo(0, 6);
    expect(result.time).toBeCloseTo(1.0195, 6);
    expect(result.startTime).toBeLessThan(result.time);
    expect(result.endTime).toBeGreaterThan(result.time);
    expect(Array.from(geometry.index!.array)).toEqual(originalIndex);
    expect(geometry.boundingBox).toBeNull();
  });

  it("reports an outward-looking entry before a later collision in the same segment", () => {
    const trajectory = straightShot([[-1, 0, 0], [1, 0, 0]], [[-2.08, 0, 0], [1.92, 0, 0]]);
    const wall = new Mesh(new BoxGeometry(0.002, 2, 2));
    wall.position.x = 0.075;

    const result = validateShotTrajectory(trajectory, [wall], [portal]);

    expect(result).toMatchObject({ ok: false, kind: "portal-facing", portal });
    if (result.ok) return;
    expect(result.point.x).toBeCloseTo(0.03, 6);
    expect(result.time).toBeCloseTo(1.03, 6);
  });

  it("accepts a clear shot looking inward at the portal, even if it turns afterward", () => {
    const trajectory = straightShot([[-1, 0, 0], [1, 0, 0]], [[1.08, 1, 0], [-0.92, 1, 0]]);
    const wallBeyondShot = new Mesh(new BoxGeometry(0.002, 2, 2));
    wallBeyondShot.position.x = 1.25;

    expect(validateShotTrajectory(trajectory, [wallBeyondShot], [portal])).toEqual({ ok: true });
  });

  it("does not treat an exit through the opening as an entry", () => {
    const trajectory = straightShot([[1, 0, 0], [-1, 0, 0]], [[-2, 0, 0], [-2, 0, 0]]);

    expect(validateShotTrajectory(trajectory, [], [portal])).toEqual({ ok: true });
  });

  it("does not treat a plane crossing outside the aperture as an entry", () => {
    const trajectory = straightShot([[-1, 0, 0.75], [1, 0, 0.75]], [[-2, 0, 0.75], [-2, 0, 0.75]]);

    expect(validateShotTrajectory(trajectory, [], [portal])).toEqual({ ok: true });
  });

  it("rejects an entry with no look direction", () => {
    const positions: Vec3[] = [[-1, 0, 0], [1, 0, 0]];
    const trajectory = straightShot(positions, positions);

    expect(validateShotTrajectory(trajectory, [], [portal])).toMatchObject({ ok: false, kind: "portal-facing" });
  });
});
