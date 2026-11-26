import { Group, InstancedMesh, Matrix4, Mesh, type BufferGeometry, type LOD, type Material } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

interface Source {
  mesh: Mesh<BufferGeometry, Material>;
  transforms: Matrix4[];
}

interface Cell {
  lods: LOD[];
  meshes: Source[][][];
  batch: Group;
  signature: string;
}

const CELL_SIZE = 32;

/** Render only the selected LODs, with batches local enough for whole-mesh frustum culling. */
export class ColonyRenderBatches extends Group {
  private readonly cells: Cell[] = [];

  constructor(lods: readonly LOD[]) {
    super();
    this.name = "Static colony render cells";
    const byCell = new Map<string, LOD[]>();
    for (const lod of lods) {
      const cell = [lod.position.x, lod.position.z].map(axis => Math.floor((axis + CELL_SIZE / 2) / CELL_SIZE)).join(",");
      const entries = byCell.get(cell) ?? [];
      entries.push(lod);
      byCell.set(cell, entries);
    }
    for (const entries of byCell.values()) {
      const batch = new Group();
      const meshes = entries.map(lod => {
        lod.updateWorldMatrix(true, true);
        return lod.levels.map(({ object }, level) => collectSources(object, level > 0));
      });
      this.cells.push({ lods: entries, meshes, batch, signature: "" });
      this.add(batch);
    }
  }

  refresh(): void {
    for (const cell of this.cells) {
      const levels = cell.lods.map(lod => lod.getCurrentLevel());
      const signature = levels.join(",");
      if (signature === cell.signature) continue;
      this.clearCell(cell);
      const sources = levels.flatMap((level, i) => cell.meshes[i][level]);
      this.compile(cell.batch, sources);
      cell.signature = signature;
    }
  }

  dispose(): void {
    for (const cell of this.cells) this.clearCell(cell);
  }

  private clearCell(cell: Cell): void {
    for (const child of cell.batch.children) {
      if (child instanceof InstancedMesh) child.dispose();
      else if (child instanceof Mesh) child.geometry.dispose();
    }
    cell.batch.clear();
  }

  private compile(batch: Group, sources: Source[]): void {
    const buckets = new Map<string, Source[]>();
    for (const source of sources) {
      const { mesh } = source;
      const attributes = Object.entries(mesh.geometry.attributes).sort(([a], [b]) => a.localeCompare(b))
        .map(([name, a]) => `${name}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`);
      const key = [mesh.material.id, mesh.castShadow, mesh.receiveShadow, mesh.renderOrder,
        Boolean(mesh.geometry.index), ...attributes].join("/");
      const bucket = buckets.get(key) ?? [];
      bucket.push(source);
      buckets.set(key, bucket);
    }
    for (const bucket of buckets.values()) {
      const byGeometry = new Map<BufferGeometry, Matrix4[]>();
      for (const { mesh, transforms } of bucket) {
        const matrices = byGeometry.get(mesh.geometry) ?? [];
        for (const matrix of transforms) matrices.push(matrix);
        byGeometry.set(mesh.geometry, matrices);
      }
      const source = bucket[0].mesh;
      const copies: BufferGeometry[] = [];
      const add = (mesh: Mesh) => {
        mesh.castShadow = source.castShadow;
        mesh.receiveShadow = source.receiveShadow;
        mesh.renderOrder = source.renderOrder;
        batch.add(mesh);
      };
      for (const [geometry, matrices] of byGeometry) {
        if (matrices.length > 3) {
          const instanced = new InstancedMesh(geometry, source.material, matrices.length);
          matrices.forEach((matrix, index) => instanced.setMatrixAt(index, matrix));
          instanced.instanceMatrix.needsUpdate = true;
          instanced.computeBoundingSphere();
          add(instanced);
        } else {
          for (const matrix of matrices) copies.push(geometry.clone().applyMatrix4(matrix));
        }
      }
      if (copies.length) {
        const merged = mergeGeometries(copies);
        if (!merged) throw new Error(`Incompatible static colony geometry: ${source.material.name}`);
        for (const geometry of copies) geometry.dispose();
        add(new Mesh(merged, source.material));
      }
    }
  }
}

function collectSources(root: LOD["levels"][number]["object"], includeGlass: boolean): Source[] {
  const result: Source[] = [];
  for (const child of root.children) {
    child.traverseVisible(node => {
      if (!(node instanceof Mesh) || Array.isArray(node.material) || node.layers.mask !== 1 ||
        node.material.transparent && (!includeGlass || node.material.depthWrite)) return;
      if (node instanceof InstancedMesh && node.instanceColor) return;
      const transforms: Matrix4[] = [];
      if (node instanceof InstancedMesh) {
        const local = new Matrix4();
        for (let i = 0; i < node.count; i++) {
          node.getMatrixAt(i, local);
          transforms.push(new Matrix4().multiplyMatrices(node.matrixWorld, local));
        }
      } else transforms.push(node.matrixWorld.clone());
      // Keep authored objects and transforms intact for picking and LOD; only suppress their draws.
      node.layers.disable(0);
      result.push({ mesh: node, transforms });
    });
  }
  return result;
}
