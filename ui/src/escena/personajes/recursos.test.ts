import * as THREE from "three";
import { expect, it, vi } from "vitest";
import { retenerMateriales } from "./recursos";

it("libera al último usuario, conserva copias activas y permite otro montaje sin doble liberación", () => {
  const material = new THREE.MeshBasicMaterial();
  const raiz = new THREE.Mesh(new THREE.BoxGeometry(), material);
  const dispose = vi.spyOn(material, "dispose");
  const uno = retenerMateriales(raiz), dos = retenerMateriales(raiz.clone());
  uno(); uno();
  expect(dispose).not.toHaveBeenCalled();
  dos(); dos();
  expect(dispose).toHaveBeenCalledTimes(1);
  const siguiente = retenerMateriales(raiz);
  siguiente();
  expect(dispose).toHaveBeenCalledTimes(2);
  raiz.geometry.dispose();
});
