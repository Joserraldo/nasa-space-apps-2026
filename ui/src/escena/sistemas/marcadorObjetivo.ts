/**
 * Marcador 3D del objetivo actual (gota cian + anillo en el suelo, como en el prototipo
 * `base-marte-jugable.html`). Se monta solo por el registro de `escena/sistemas/`.
 */
import * as THREE from "three";
import { lugar } from "../mundo";
import type { ContextoSistema, SistemaEscena } from "../escena3d";

export function crearSistema(): SistemaEscena {
  let grupo: THREE.Group | null = null;
  let pin: THREE.Group | null = null;
  let aro: THREE.Mesh | null = null;
  const mats: THREE.Material[] = [];
  const geos: THREE.BufferGeometry[] = [];

  return {
    id: "marcador-objetivo",
    montar(ctx: ContextoSistema) {
      grupo = new THREE.Group();
      grupo.name = "Objective_Marker";
      grupo.visible = false;

      const matCian = new THREE.MeshBasicMaterial({ color: 0x3fd8ff, toneMapped: false });
      const matBlanco = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const matAro = new THREE.MeshBasicMaterial({
        color: 0x3fd8ff,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      mats.push(matCian, matBlanco, matAro);

      pin = new THREE.Group();
      const gCono = new THREE.ConeGeometry(0.24, 0.5, 20);
      const gEsfera = new THREE.SphereGeometry(0.26, 20, 14);
      const gBrillo = new THREE.SphereGeometry(0.1, 12, 8);
      const gAro = new THREE.RingGeometry(0.95, 1.15, 36);
      geos.push(gCono, gEsfera, gBrillo, gAro);

      const cono = new THREE.Mesh(gCono, matCian);
      cono.position.set(0, -0.22, 0);
      cono.rotation.x = Math.PI;
      const esfera = new THREE.Mesh(gEsfera, matCian);
      esfera.position.set(0, 0.1, 0);
      const brillo = new THREE.Mesh(gBrillo, matBlanco);
      brillo.position.set(0, 0.14, 0.2);
      pin.add(cono, esfera, brillo);

      aro = new THREE.Mesh(gAro, matAro);
      aro.rotation.x = -Math.PI / 2;
      aro.position.y = 0.04;

      grupo.add(pin, aro);
      ctx.escena.add(grupo);
    },
    actualizar(_dt: number, ctx: ContextoSistema) {
      if (!grupo || !pin || !aro) return;
      const id = ctx.pedido.objetivo?.lugar ?? ctx.vista?.lugarObjetivo ?? null;
      if (!id) {
        grupo.visible = false;
        return;
      }
      const l = lugar(id);
      grupo.visible = true;
      grupo.position.set(l.mx, 0, l.mz);
      const t = ctx.ahora / 1000;
      const salto = ctx.reducido ? 0 : Math.sin(t * 3.2) * 0.18;
      pin.position.set(0, l.my + 0.4 + salto, 0);
      if (!ctx.reducido) pin.rotation.y = t * 1.6;
      const pulso = ctx.reducido ? 1 : 1 + Math.sin(t * 3.2) * 0.08;
      aro.scale.setScalar(pulso);
    },
    dispose() {
      if (grupo) grupo.removeFromParent();
      for (const g of geos) g.dispose();
      for (const m of mats) m.dispose();
      geos.length = 0;
      mats.length = 0;
      grupo = null;
      pin = null;
      aro = null;
    },
  };
}
