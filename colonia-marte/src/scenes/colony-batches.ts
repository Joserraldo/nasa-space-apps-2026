import {
  Group, InstancedMesh, LOD, Matrix4, Mesh, Vector3,
  type BufferGeometry, type Camera, type Material, type Object3D,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ColonyRenderBatches } from "./colony-render-batches";

interface Part {
  owner: Object3D;
  mesh: Mesh<BufferGeometry, Material>;
  extent: number;
}

export class ColonyGroup extends Group {
  private readonly lods: LOD[] = [];
  private renderBatches?: ColonyRenderBatches;
  detailedTriangles = 0;

  addBuildings(pieces: readonly Object3D[], ranges?: readonly [number, number]): void {
    this.addLOD(makeColonyLOD(pieces, ranges));
  }

  addLOD(lod: LOD): void {
    this.lods.push(lod);
    this.add(lod);
  }

  optimizeStaticRender(camera?: Camera): void {
    if (this.renderBatches) return;
    if (camera) this.updateLods(camera);
    this.renderBatches = new ColonyRenderBatches(this.lods);
    this.add(this.renderBatches);
    this.renderBatches.refresh();
  }

  restoreStaticRender(): void {
    if (!this.renderBatches) return;
    this.renderBatches.dispose();
    this.remove(this.renderBatches);
    this.renderBatches = undefined;
  }

  updateLods(camera: Camera): boolean {
    let changed = false;
    for (const lod of this.lods) {
      const previous = lod.getCurrentLevel();
      lod.update(camera);
      if (lod.getCurrentLevel() !== previous) changed = true;
    }
    if (changed) this.renderBatches?.refresh();
    return changed;
  }

  dispose(): void {
    this.renderBatches?.dispose();
    this.traverse(node => {
      if (node instanceof InstancedMesh) node.dispose();
      else if (node instanceof Mesh) node.geometry.dispose();
    });
  }
}

function collectParts(pieces: readonly Object3D[]): Part[] {
  const parts: Part[] = [];
  const size = new Vector3(), scale = new Vector3();
  for (const owner of pieces) {
    owner.updateWorldMatrix(true, true);
    owner.traverseVisible(node => {
      if (!(node instanceof Mesh)) return;
      if (Array.isArray(node.material)) throw new Error("Colony parts must use a single shared material");
      node.geometry.computeBoundingBox();
      node.geometry.boundingBox!.getSize(size).multiply(node.getWorldScale(scale));
      parts.push({ owner, mesh: node, extent: Math.max(size.x, size.y, size.z) });
    });
  }
  return parts;
}

export function fuseColonyInfrastructure(pieces: readonly Object3D[]): Group {
  return fuseParts(collectParts(pieces), new Vector3());
}

export function makeColonyLOD(pieces: readonly Object3D[], ranges: readonly [number, number] = [62, 105]): LOD {
  const parts = collectParts(pieces);
  const lod = new LOD();
  lod.name = pieces[0].name;
  lod.autoUpdate = false;
  const position = new Vector3();
  for (const piece of pieces) lod.position.add(piece.getWorldPosition(position));
  lod.position.divideScalar(pieces.length);
  // Co-located repeating modules share a level, conservatively protecting the nearest member.
  const radius = Math.max(...pieces.map(piece => lod.position.distanceTo(piece.getWorldPosition(position))));
  for (const [distance, minFeature] of [[0, 0], [ranges[0] + radius, 0.28], [ranges[1] + radius, 0.7]]) {
    const level = fuseParts(parts.filter(part => part.extent >= minFeature || part.mesh.material.transparent), lod.position);
    level.visible = distance === 0;
    lod.addLevel(level, distance, 0.12);
  }
  return lod;
}

function fuseParts(parts: readonly Part[], origin: Vector3): Group {
  const group = new Group();
  const byMaterial = new Map<Material, Map<BufferGeometry, Part[]>>();
  for (const part of parts) {
    const { material, geometry } = part.mesh;
    if (!byMaterial.has(material)) byMaterial.set(material, new Map());
    const byGeometry = byMaterial.get(material)!;
    if (!byGeometry.has(geometry)) byGeometry.set(geometry, []);
    byGeometry.get(geometry)!.push(part);
  }
  const offset = new Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);
  const matrix = new Matrix4();
  for (const [material, geometries] of byMaterial) {
    const merge: BufferGeometry[] = [];
    for (const [geometry, uses] of geometries) {
      if (new Set(uses.map(part => part.owner)).size > 3) {
        const batch = new InstancedMesh(geometry, material, uses.length);
        uses.forEach(({ mesh }, i) => batch.setMatrixAt(i, matrix.multiplyMatrices(offset, mesh.matrixWorld)));
        batch.instanceMatrix.needsUpdate = true;
        batch.computeBoundingSphere();
        group.add(batch);
      } else {
        for (const { mesh } of uses) {
          merge.push(geometry.clone().applyMatrix4(matrix.multiplyMatrices(offset, mesh.matrixWorld)));
        }
      }
    }
    if (!merge.length) continue;
    const geometry = mergeGeometries(merge);
    for (const copy of merge) copy.dispose();
    if (!geometry) throw new Error(`Incompatible colony geometry for ${material.name}`);
    group.add(new Mesh(geometry, material));
  }
  return group;
}

export function countColonyTriangles(root: Object3D): number {
  let triangles = 0;
  root.traverse(node => {
    if (!(node instanceof Mesh)) return;
    const count = node.geometry.index?.count ?? node.geometry.getAttribute("position").count;
    triangles += (count / 3) * (node instanceof InstancedMesh ? node.count : 1);
  });
  return triangles;
}
