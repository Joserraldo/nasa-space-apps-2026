import { describe, expect, it } from "vitest";
import { Float32BufferAttribute, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { createDemoRegistry } from "../../src/core/demo-pieces";
import { createProductionRegistry } from "../../src/kit/pieces";
import { inspectGeometry, validatePiece, validateRegistry, type Check } from "../../tools/validate-pieces";
import type { PieceMetadata } from "../../src/kit/types";

const registry = createDemoRegistry();
const metadata: PieceMetadata = {category:"furniture",pivot:"base-center"};
function altered(change: (root:Object3D,mesh:Mesh) => void): Object3D {
  const root = registry.build("DN-01",{},true), mesh = root.children[0] as Mesh;
  mesh.geometry = mesh.geometry.clone();
  change(root,mesh);
  return root;
}

describe("specification 8.1", () => {
  it("validates every registered variant through independent builds", () => {
    const results = validateRegistry(registry);
    console.log("PIECE_COUNTS",JSON.stringify(results));
    for (const result of results) expect(result.issues,`${result.id}/${result.variant}`).toEqual([]);
  });
  it("validates every production piece (WS3/WS4) with the same checks", () => {
    const results = validateRegistry(createProductionRegistry());
    console.log("PRODUCTION_PIECE_COUNTS", JSON.stringify(results));
    for (const result of results) expect(result.issues, `${result.id}/${result.variant}`).toEqual([]);
  });
  const broken: [Check, () => Object3D, PieceMetadata?, string?][] = [
    ["triangles",() => { const root=registry.build("DN-01"); root.clear(); return root; }],
    ["duplicates",() => altered((_root,mesh) => {
      const g=mesh.geometry;
      for (const [name,attribute] of Object.entries(g.attributes)) {
        g.setAttribute(name,new Float32BufferAttribute([...Array.from(attribute.array),...Array.from(attribute.array).slice(0,attribute.itemSize)],attribute.itemSize));
      }
      const index=Array.from(g.index!.array); index[0]=g.getAttribute("position").count-1; g.setIndex(index);
    })],
    ["degenerates",() => altered((_root,mesh) => { const index=Array.from(mesh.geometry.index!.array); index[1]=index[0]; mesh.geometry.setIndex(index); })],
    ["materials",() => altered((_root,mesh) => { mesh.material=new MeshStandardMaterial(); })],
    ["color", () => altered((_root, mesh) => { mesh.geometry.deleteAttribute("color"); })],
    ["grid",() => registry.build("ST-F01"),{category:"architecture",pivot:"module-corner",grid:{size:[2.1,0.2,2],module:2}},"ST-F01"],
    ["pivot",() => altered(root => { root.position.x=1; })],
    ["determinism",(() => { let counter=0; return () => altered(root => {root.position.x=counter++;}); })()],
    ["registry",() => registry.build("DN-01"),metadata,"FAKE-01"],
  ];
  for (const [check,build,meta=metadata,id="DN-01"] of broken) it(`deliberately broken piece fails ${check}`, () => {
    expect(validatePiece(id,meta,build).issues.map(issue => issue.check)).toContain(check);
  });
  it("also rejects missing indices and invalid normals", () => {
    const geometry=(registry.build("DN-01").children[0] as Mesh).geometry.clone();
    geometry.deleteAttribute("normal");
    expect(inspectGeometry(geometry).map(issue => issue.check)).toContain("normals");
    geometry.setIndex(null);
    expect(inspectGeometry(geometry)[0].check).toBe("index");
  });
});
