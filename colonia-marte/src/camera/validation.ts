import { DoubleSide, Matrix4, Ray, Vector3, type BufferGeometry, type Mesh } from "three";
import { MeshBVH } from "three-mesh-bvh";
import type { ShotTrajectory } from "./trajectory";

type CollisionMesh = Mesh<BufferGeometry>;

/**
 * World-space portal rectangle with finite positive half extents.
 * The inward normal and right axis must be finite, nonzero and perpendicular.
 */
export interface CameraPortal {
  id: string;
  center: Vector3;
  inwardNormal: Vector3;
  right: Vector3;
  halfWidth: number;
  halfHeight: number;
}

interface HitLocation {
  segmentIndex: number;
  startTime: number;
  endTime: number;
  time: number;
  point: Vector3;
}

type CollisionHit = HitLocation & { ok: false; kind: "collision"; mesh: CollisionMesh };
type PortalFacingHit = HitLocation & { ok: false; kind: "portal-facing"; portal: CameraPortal };
export type ShotValidationResult = { ok: true } | CollisionHit | PortalFacingHit;

interface SampledSegment {
  segmentIndex: number;
  startTime: number;
  endTime: number;
  start: Vector3;
  end: Vector3;
}

interface Collider {
  mesh: CollisionMesh;
  bvh: MeshBVH;
  worldToLocal: Matrix4;
}

interface Aperture {
  portal: CameraPortal;
  normal: Vector3;
  right: Vector3;
  up: Vector3;
  lastSide: number;
}

const MAX_CHORD_LENGTH = 0.25;
const SAMPLES_PER_SPLINE_SPAN = 16;

/**
 * Headless authoring check for one shot. The caller supplies static triangle
 * meshes with invertible transforms and any authored portal apertures.
 *
 * Checks camera-center chords, not the continuous curve, camera volume,
 * animated/instanced geometry or shot transitions. Mesh world matrices are
 * refreshed, but geometry is not modified. Hit points are world-space;
 * segment times are in shot-local seconds and hit times are interpolated.
 */
export function validateShotTrajectory(
  trajectory: ShotTrajectory,
  collisionMeshes: readonly CollisionMesh[],
  portals: readonly CameraPortal[],
): ShotValidationResult {
  const colliders = prepareColliders(collisionMeshes);
  const apertures = prepareApertures(portals);
  const segmentCount = countSegments(trajectory);
  let startTime = 0;
  let start = trajectory.sample(0).position;
  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
    const endTime = trajectory.shot.duration * ((segmentIndex + 1) / segmentCount);
    const end = trajectory.sample(endTime).position;
    const segment = { segmentIndex, startTime, endTime, start, end };
    const collision = firstCollision(segment, colliders);
    const entry = firstMisdirectedEntry(trajectory, segment, apertures);
    if (entry && (!collision || entry.time < collision.time)) return entry;
    if (collision) return collision;
    start = end;
    startTime = endTime;
  }
  return { ok: true };
}

function countSegments(trajectory: ShotTrajectory): number {
  const peakSpeedFactor = trajectory.shot.easing === "smoothstep" ? 1.5 : 1;
  return Math.max(
    (trajectory.shot.position.length - 1) * SAMPLES_PER_SPLINE_SPAN,
    Math.ceil(trajectory.position.getLength() * peakSpeedFactor / MAX_CHORD_LENGTH),
  );
}

function prepareColliders(meshes: readonly CollisionMesh[]): Collider[] {
  const byGeometry = new Map<BufferGeometry, MeshBVH>();
  return meshes.map(mesh => {
    let bvh = byGeometry.get(mesh.geometry);
    if (!bvh) {
      bvh = new MeshBVH(mesh.geometry, { indirect: true, setBoundingBox: false });
      byGeometry.set(mesh.geometry, bvh);
    }
    mesh.updateWorldMatrix(true, false);
    return { mesh, bvh, worldToLocal: mesh.matrixWorld.clone().invert() };
  });
}

function firstCollision(segment: SampledSegment, colliders: readonly Collider[]): CollisionHit | undefined {
  let earliest: CollisionHit | undefined;
  for (const { mesh, bvh, worldToLocal } of colliders) {
    const localStart = segment.start.clone().applyMatrix4(worldToLocal);
    const localDirection = segment.end.clone().applyMatrix4(worldToLocal).sub(localStart);
    const localLength = localDirection.length();
    if (localLength === 0) continue;

    const ray = new Ray(localStart, localDirection.divideScalar(localLength));
    const hit = bvh.raycastFirst(ray, DoubleSide, 0, localLength);
    if (!hit) continue;

    const location = locateHit(segment, hit.distance / localLength);
    if (!earliest || location.time < earliest.time) {
      earliest = { ok: false, kind: "collision", mesh, ...location };
    }
  }
  return earliest;
}

function prepareApertures(portals: readonly CameraPortal[]): Aperture[] {
  return portals.map(portal => {
    const normal = portal.inwardNormal.clone().normalize();
    const right = portal.right.clone().normalize();
    const up = new Vector3().crossVectors(normal, right);
    return { portal, normal, right, up, lastSide: 0 };
  });
}

function firstMisdirectedEntry(
  trajectory: ShotTrajectory,
  segment: SampledSegment,
  apertures: readonly Aperture[],
): PortalFacingHit | undefined {
  let earliest: PortalFacingHit | undefined;
  for (const aperture of apertures) {
    const location = findEntry(segment, aperture);
    if (!location || (earliest && location.time >= earliest.time)) continue;
    const { position, target } = trajectory.sample(location.time);
    if (target.sub(position).dot(aperture.normal) > 0) continue;
    earliest = { ok: false, kind: "portal-facing", portal: aperture.portal, ...location };
  }
  return earliest;
}

function findEntry(segment: SampledSegment, aperture: Aperture): HitLocation | undefined {
  const { portal, normal, right, up } = aperture;
  const startDistance = normal.dot(segment.start.clone().sub(portal.center));
  const endDistance = normal.dot(segment.end.clone().sub(portal.center));
  // Retain the approach side across samples exactly on the portal plane.
  if (startDistance !== 0) aperture.lastSide = Math.sign(startDistance);
  if (aperture.lastSide !== -1 || endDistance <= 0) return;

  const location = locateHit(segment, startDistance / (startDistance - endDistance));
  const offset = location.point.clone().sub(portal.center);
  if (Math.abs(offset.dot(right)) <= portal.halfWidth && Math.abs(offset.dot(up)) <= portal.halfHeight) {
    return location;
  }
}

function locateHit({ segmentIndex, startTime, endTime, start, end }: SampledSegment, fraction: number): HitLocation {
  return {
    segmentIndex, startTime, endTime,
    time: startTime + (endTime - startTime) * fraction,
    point: start.clone().lerp(end, fraction),
  };
}
