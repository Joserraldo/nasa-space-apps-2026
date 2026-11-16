/**
 * Domo protector geodésico Fresnel y haces de radiación solar con deflexión estricta.
 * - En calma o durante la colocación inicial de módulos (`modulos`), no caen partículas (sin "nieve").
 * - Durante la misión, cuando se anuncia o golpea la tormenta solar, caen haces direccionales de
 *   partículas energéticas solares (SEP) y un pulso de alerta pide activar/subir el escudo.
 * - Con el escudo activo, el domo se despliega de abajo hacia arriba con malla geodésica cian
 *   y bloquea el 100 % de los haces en el radio exterior (ningún haz puede atravesar el interior).
 */
import * as THREE from "three";
import type { ContextoSistema, SistemaEscena } from "../escena3d";

const CENTRO_X = 0.0;
const CENTRO_Z = -3.2;
const RADIO_ESCUDO = 14.2;
const NUM_HACES = 220;

export function crearSistema(): SistemaEscena {
  let grupo: THREE.Group | null = null;
  let domo: THREE.Mesh | null = null;
  let redGeodesica: THREE.LineSegments | null = null;
  let aroBase: THREE.Mesh | null = null;
  let aroAlerta: THREE.Mesh | null = null;
  let haces: THREE.LineSegments | null = null;

  let shieldMat: THREE.ShaderMaterial | null = null;
  let redMat: THREE.LineBasicMaterial | null = null;
  let aroMat: THREE.MeshBasicMaterial | null = null;
  let alertaMat: THREE.MeshBasicMaterial | null = null;
  let hacesMat: THREE.LineBasicMaterial | null = null;
  const geos: THREE.BufferGeometry[] = [];

  // Cada haz tiene 2 vértices (cabeza y cola) => NUM_HACES * 2 * 3 floats
  const posHaces = new Float32Array(NUM_HACES * 6);
  const colHaces = new Float32Array(NUM_HACES * 6);
  const estadoHaz = new Float32Array(NUM_HACES * 6); // [x, y, z, vx, vy, vz]

  let despliegue = 0;
  let uHitActual = 0;

  function reaparecerHaz(i: number): void {
    const k = i * 6;
    // Nacen siempre por encima de la altura del domo (y = 17..28 m) en dirección solar
    const x = CENTRO_X - 22 + Math.random() * 32;
    const y = RADIO_ESCUDO + 3.5 + Math.random() * 12;
    const z = CENTRO_Z - 14 + Math.random() * 28;
    const rapidez = 22 + Math.random() * 8;
    // Dirección diagonal desde el Sol ([-0.8, 0.65, 0.2] invertido)
    const vx = 0.68 * rapidez + (Math.random() - 0.5) * 1.5;
    const vy = -0.68 * rapidez;
    const vz = -0.22 * rapidez + (Math.random() - 0.5) * 1.5;

    estadoHaz[k] = x;
    estadoHaz[k + 1] = y;
    estadoHaz[k + 2] = z;
    estadoHaz[k + 3] = vx;
    estadoHaz[k + 4] = vy;
    estadoHaz[k + 5] = vz;

    // Color solar ámbar/dorado intenso
    colHaces[k] = 1.0;
    colHaces[k + 1] = 0.55;
    colHaces[k + 2] = 0.12;
    colHaces[k + 3] = 1.0;
    colHaces[k + 4] = 0.82;
    colHaces[k + 5] = 0.35;
  }

  return {
    id: "escudo-tormenta",
    montar(ctx: ContextoSistema) {
      grupo = new THREE.Group();
      grupo.name = "Shield_And_Solar_Storm";

      shieldMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
        uniforms: {
          uDeploy: { value: 0 },
          uHit: { value: 0 },
          uT: { value: 0 },
        },
        vertexShader: `
          varying vec3 vN, vP, vV;
          void main() {
            vP = position;
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uDeploy, uHit, uT;
          varying vec3 vN, vP, vV;
          void main() {
            if (uDeploy < 0.01) discard;
            float hNorm = clamp(vP.y / ${RADIO_ESCUDO.toFixed(1)}, 0.0, 1.0);
            if (hNorm > uDeploy) discard;
            float frente = smoothstep(uDeploy - 0.12, uDeploy, hNorm);
            float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
            float hex = smoothstep(0.88, 0.97, abs(sin(vP.x * 1.35)) * abs(sin(vP.z * 1.35)) * abs(cos(vP.y * 1.35)));
            float onda = smoothstep(0.6, 1.0, sin(vP.y * 1.6 - uT * 7.0)) * uHit;
            float baseRim = 1.0 - smoothstep(0.0, 0.14, hNorm);
            vec3 cBase = vec3(0.02, 0.52, 0.82);
            vec3 cBrillo = vec3(0.28, 0.94, 1.0);
            vec3 col = mix(cBase, cBrillo, clamp(fres * 0.65 + hex * 0.45 + frente * 0.9 + onda * 0.7 + baseRim * 0.5, 0.0, 1.0));
            float alpha = clamp(fres * 0.42 + hex * 0.18 + frente * 0.55 + onda * 0.35 + baseRim * 0.38 + 0.05, 0.0, 0.62);
            gl_FragColor = vec4(col, alpha);
          }
        `,
      });

      const gDomo = new THREE.SphereGeometry(RADIO_ESCUDO, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
      geos.push(gDomo);
      domo = new THREE.Mesh(gDomo, shieldMat);
      domo.name = "Shield_Dome";
      domo.position.set(CENTRO_X, 0, CENTRO_Z);
      domo.castShadow = false;
      domo.receiveShadow = false;
      domo.visible = false;

      // Malla geodésica nítida sobre el domo para que la cúpula se lea con claridad sobre el cielo salmón
      const gIco = new THREE.IcosahedronGeometry(RADIO_ESCUDO + 0.03, 2);
      const posIco = gIco.getAttribute("position");
      const segs: number[] = [];
      const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
      const agregarArista = (a: THREE.Vector3, b: THREE.Vector3) => {
        if (a.y < -0.1 && b.y < -0.1) return;
        segs.push(a.x, Math.max(0, a.y), a.z, b.x, Math.max(0, b.y), b.z);
      };
      for (let i = 0; i < posIco.count; i += 3) {
        vA.fromBufferAttribute(posIco, i);
        vB.fromBufferAttribute(posIco, i + 1);
        vC.fromBufferAttribute(posIco, i + 2);
        agregarArista(vA, vB);
        agregarArista(vB, vC);
        agregarArista(vC, vA);
      }
      gIco.dispose();
      const gRed = new THREE.BufferGeometry();
      gRed.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
      geos.push(gRed);
      redMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      });
      redGeodesica = new THREE.LineSegments(gRed, redMat);
      redGeodesica.position.set(CENTRO_X, 0, CENTRO_Z);
      redGeodesica.visible = false;

      const gAro = new THREE.RingGeometry(RADIO_ESCUDO - 0.22, RADIO_ESCUDO + 0.08, 64);
      geos.push(gAro);
      aroMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      aroBase = new THREE.Mesh(gAro, aroMat);
      aroBase.rotation.x = -Math.PI / 2;
      aroBase.position.set(CENTRO_X, 0.04, CENTRO_Z);
      aroBase.visible = false;

      // Anillo de alerta en el generador de escudo (-5.4, -7.2) cuando hay tormenta y falta activar/subir escudo
      const gAlerta = new THREE.RingGeometry(1.3, 1.75, 40);
      geos.push(gAlerta);
      alertaMat = new THREE.MeshBasicMaterial({
        color: 0xff9d2e,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      aroAlerta = new THREE.Mesh(gAlerta, alertaMat);
      aroAlerta.rotation.x = -Math.PI / 2;
      aroAlerta.position.set(-5.4, 0.06, -7.2);
      aroAlerta.visible = false;

      for (let i = 0; i < NUM_HACES; i++) reaparecerHaz(i);
      const gHaces = new THREE.BufferGeometry();
      gHaces.setAttribute("position", new THREE.BufferAttribute(posHaces, 3));
      gHaces.setAttribute("color", new THREE.BufferAttribute(colHaces, 3));
      geos.push(gHaces);

      hacesMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        toneMapped: false,
      });
      haces = new THREE.LineSegments(gHaces, hacesMat);
      haces.name = "Solar_Storm_Rays";
      haces.frustumCulled = false;
      haces.visible = false;

      grupo.add(domo, redGeodesica, aroBase, aroAlerta, haces);
      ctx.escena.add(grupo);
    },

    actualizar(dt: number, ctx: ContextoSistema) {
      if (!grupo || !domo || !redGeodesica || !aroBase || !aroAlerta || !haces || !shieldMat || !redMat || !aroMat || !alertaMat || !hacesMat) return;
      const t = ctx.ahora / 1000;
      const v = ctx.vista;
      const enMision = v?.fase === "base" || v?.fase === "tormenta";
      const estadoEscudo = v?.modulos.escudo ?? "ausente";
      const hayTormenta = Boolean(enMision && (v?.tormenta.activa || v?.tormenta.anunciada || v?.fase === "tormenta"));

      // El domo del escudo solo se despliega durante la misión cuando el módulo escudo está instalado/operativo,
      // o cuando se previsualiza su instalación en el paso de módulos.
      const escudoActivo = (enMision && estadoEscudo === "funcionando") || estadoEscudo === "instalando";
      const metaDespliegue = escudoActivo ? (hayTormenta ? 1.0 : 0.88) : 0;

      const paso = Math.min(0.1, Math.max(0.016, dt));
      despliegue += (metaDespliegue - despliegue) * Math.min(1, paso * 3.2);

      const mostrarDomo = despliegue > 0.02;
      domo.visible = mostrarDomo;
      redGeodesica.visible = mostrarDomo;
      aroBase.visible = mostrarDomo;

      if (mostrarDomo) {
        shieldMat.uniforms.uDeploy!.value = despliegue;
        shieldMat.uniforms.uHit!.value = uHitActual;
        shieldMat.uniforms.uT!.value = t;
        redMat.opacity = (hayTormenta ? 0.42 : 0.24) * despliegue;
        aroMat.opacity = (0.45 + 0.25 * uHitActual) * despliegue;
      }

      // Alerta visual para obligar/guiar a activar el escudo cuando hay tormenta
      const mostrarAlerta = hayTormenta && !escudoActivo;
      aroAlerta.visible = mostrarAlerta;
      if (mostrarAlerta) {
        const pulso = 1 + 0.18 * Math.sin(t * 6);
        aroAlerta.scale.setScalar(pulso);
        alertaMat.opacity = 0.55 + 0.35 * Math.sin(t * 6);
      }

      // Haces de tormenta solar: SOLO durante tormenta anunciada o activa en la misión (nunca nieve en calma)
      if (!hayTormenta || ctx.reducido) {
        haces.visible = false;
        uHitActual *= 0.85;
        return;
      }

      haces.visible = true;
      const numActivos = v?.tormenta.activa || v?.fase === "tormenta" ? NUM_HACES : Math.floor(NUM_HACES * 0.45);
      const radioBloqueo = RADIO_ESCUDO + 0.25;
      let impactos = 0;

      for (let i = 0; i < NUM_HACES; i++) {
        const k = i * 6;
        if (i >= numActivos) {
          posHaces[k] = posHaces[k + 3] = 0;
          posHaces[k + 1] = posHaces[k + 4] = -100;
          posHaces[k + 2] = posHaces[k + 5] = 0;
          continue;
        }

        let x = estadoHaz[k]! + estadoHaz[k + 3]! * paso;
        let y = estadoHaz[k + 1]! + estadoHaz[k + 4]! * paso;
        let z = estadoHaz[k + 2]! + estadoHaz[k + 5]! * paso;
        let vx = estadoHaz[k + 3]!;
        let vy = estadoHaz[k + 4]!;
        let vz = estadoHaz[k + 5]!;

        const dx = x - CENTRO_X;
        const dy = y;
        const dz = z - CENTRO_Z;
        const dist = Math.hypot(dx, dy, dz);

        // Bloqueo estricto: ningún haz puede entrar jamás dentro de RADIO_ESCUDO cuando el domo está desplegado
        if (despliegue > 0.35 && dist < radioBloqueo && dy > 0.05) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          const nz = dz / (dist || 1);
          x = CENTRO_X + nx * (radioBloqueo + 0.15);
          y = ny * (radioBloqueo + 0.15);
          z = CENTRO_Z + nz * (radioBloqueo + 0.15);
          // Reflexión hacia afuera sobre la normal de la cúpula
          const vn = vx * nx + vy * ny + vz * nz;
          if (vn < 0) {
            vx -= 2 * vn * nx;
            vy = Math.abs(vy - 2 * vn * ny) * 0.7 + 4.0;
            vz -= 2 * vn * nz;
          }
          // El haz cambia a cian eléctrico al ser desviado por el escudo
          colHaces[k] = 0.0;
          colHaces[k + 1] = 0.92;
          colHaces[k + 2] = 1.0;
          colHaces[k + 3] = 0.75;
          colHaces[k + 4] = 0.98;
          colHaces[k + 5] = 1.0;
          impactos++;
        }

        if (y < 0.15 || dist > 38) {
          reaparecerHaz(i);
          continue;
        }

        estadoHaz[k] = x;
        estadoHaz[k + 1] = y;
        estadoHaz[k + 2] = z;
        estadoHaz[k + 3] = vx;
        estadoHaz[k + 4] = vy;
        estadoHaz[k + 5] = vz;

        // Segmento orientado según su velocidad (haz luminoso de ~1.1 m, nunca copo de nieve)
        const largoCola = 0.048;
        let tx = x - vx * largoCola;
        let ty = y - vy * largoCola;
        let tz = z - vz * largoCola;
        if (despliegue > 0.35) {
          const tDist = Math.hypot(tx - CENTRO_X, ty, tz - CENTRO_Z);
          if (tDist < radioBloqueo) {
            const s = (radioBloqueo + 0.05) / (tDist || 1);
            tx = CENTRO_X + (tx - CENTRO_X) * s;
            ty = ty * s;
            tz = CENTRO_Z + (tz - CENTRO_Z) * s;
          }
        }
        posHaces[k] = x;
        posHaces[k + 1] = y;
        posHaces[k + 2] = z;
        posHaces[k + 3] = tx;
        posHaces[k + 4] = ty;
        posHaces[k + 5] = tz;
      }

      const geom = haces.geometry;
      (geom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (geom.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      uHitActual = Math.min(1, uHitActual * 0.88 + impactos * 0.05);
    },

    dispose() {
      if (grupo) grupo.removeFromParent();
      for (const g of geos) g.dispose();
      geos.length = 0;
      shieldMat?.dispose();
      redMat?.dispose();
      aroMat?.dispose();
      alertaMat?.dispose();
      hacesMat?.dispose();
      grupo = null;
      domo = null;
      redGeodesica = null;
      aroBase = null;
      aroAlerta = null;
      haces = null;
    },
  };
}
