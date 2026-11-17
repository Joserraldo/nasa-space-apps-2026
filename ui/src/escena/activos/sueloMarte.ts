/**
 * Materiales del suelo y de las rocas de Marte (Etapa BC). Dos versiones por cada uno:
 *
 * - `detallado` (calidad alta y media, interruptor `sueloDetallado` de `calidad.ts`): `MeshStandardMaterial`
 *   con chunks propios (`onBeforeCompile`). El suelo mezcla por pendiente: regolito con grano en lo llano,
 *   roca estratificada en lo empinado (textura proyectada desde tres ejes, sin estirarse en las paredes) y
 *   polvo claro en cornisas y crestas. Normales de detalle: grava y marcas de viento cerca, que se apagan
 *   con la distancia. Las rocas sueltas llevan la misma roca triplanar, polvo arriba y el pie más oscuro.
 * - `simple` (calidad baja): color de vértice, sin texturas ni chunks.
 *
 * Texturas: CC0 de Poly Haven, 512 px WebP (`public/texturas/FUENTES.md`). El color de cada textura se usa
 * dividido por su media medida: aporta grano, no paleta. La paleta vive en `PALETA_SUELO`.
 * Sin `document` (pruebas en Node) se usan texturas neutras de 1 píxel.
 */
import * as THREE from "three";
import { CAMPO_CAMINOS, ROVER, texturaCaminos, texturaUso } from "./caminosSuelo";

/** Paleta (sRGB) del suelo de Jezero. [E] calibrada contra Occupy Mars 2 con `comparar_referencia.py`. */
export const PALETA_SUELO = {
  regolito: "#734631",
  regolitoOscuro: "#553323",
  roca: "#5f4134",
  estrato: "#93694f",
  polvo: "#a8754f",
  rocaSuelta: "#62524a",
  rocaSueltaCima: "#8d7464",
} as const;

/** Media lineal medida de cada textura de color (`comparar` con PIL, 17 nov). */
const MEDIA = {
  suelo: [0.0785, 0.0511, 0.0329],
  roca: [0.4066, 0.3454, 0.2762],
} as const;

/** Escalas (m por repetición) y pesos de las texturas. [E] */
export const ESCALAS_SUELO = {
  granoFino: 2.6,
  granoGrueso: 9.7,
  arena: 1.4,
  rocaPared: 5,
  rocaSuelta: 1.1,
  /** Los estratos: alto de la banda principal y de la fina (m). */
  estrato: 1.7,
  estratoFino: 0.55,
  estratoGrueso: 4.6,
} as const;

const ARCHIVOS = {
  suelo: "suelo_color.webp",
  sueloN: "suelo_normal.webp",
  arenaN: "arena_normal.webp",
  roca: "roca_color.webp",
  rocaN: "roca_normal.webp",
} as const;
type ClaveTextura = keyof typeof ARCHIVOS;

function neutra(normal: boolean): THREE.DataTexture {
  const t = new THREE.DataTexture(new Uint8Array(normal ? [128, 128, 255, 255] : [255, 255, 255, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

let cache: Record<ClaveTextura, THREE.Texture> | null = null;

/** Texturas del suelo (una sola vez por página). */
function texturas(): Record<ClaveTextura, THREE.Texture> {
  if (cache) return cache;
  const enNavegador = typeof document !== "undefined" && typeof Image !== "undefined" && !import.meta.env?.VITEST;
  const cargador = enNavegador ? new THREE.TextureLoader() : null;
  const salida = {} as Record<ClaveTextura, THREE.Texture>;
  for (const clave of Object.keys(ARCHIVOS) as ClaveTextura[]) {
    const esNormal = clave.endsWith("N");
    let t: THREE.Texture;
    if (cargador) {
      t = cargador.load(`${import.meta.env.BASE_URL}texturas/marte/${ARCHIVOS[clave]}`);
      t.colorSpace = esNormal ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.anisotropy = 8;
    } else {
      t = neutra(esNormal);
    }
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.name = `Mars_${clave}`;
    salida[clave] = t;
  }
  return (cache = salida);
}

const lin = (hex: string) => new THREE.Color(hex);
const f = (n: number) => n.toFixed(5);

const RUIDO_GLSL = /* glsl */ `
float hashT( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
float ruidoT( vec2 p ) {
	vec2 i = floor( p ), f = fract( p );
	vec2 u = f * f * ( 3.0 - 2.0 * f );
	return mix( mix( hashT( i ), hashT( i + vec2( 1.0, 0.0 ) ), u.x ), mix( hashT( i + vec2( 0.0, 1.0 ) ), hashT( i + vec2( 1.0, 1.0 ) ), u.x ), u.y );
}
float fbmT( vec2 p ) {
	float s = 0.0, a = 0.5;
	for ( int i = 0; i < 4; i ++ ) { s += a * ruidoT( p ); p = p * 2.03 + vec2( 17.3, - 9.1 ); a *= 0.5; }
	return s / 0.9375;
}
vec3 triplanarT( sampler2D t, vec3 p, vec3 w, float esc ) {
	return texture2D( t, p.zy * esc ).rgb * w.x + texture2D( t, p.xz * esc ).rgb * w.y + texture2D( t, p.xy * esc ).rgb * w.z;
}
vec3 triplanarNT( sampler2D t, vec3 p, vec3 w, float esc ) {
	vec3 tx = texture2D( t, p.zy * esc ).xyz * 2.0 - 1.0;
	vec3 ty = texture2D( t, p.xz * esc ).xyz * 2.0 - 1.0;
	vec3 tz = texture2D( t, p.xy * esc ).xyz * 2.0 - 1.0;
	return vec3( 0.0, tx.y, tx.x ) * w.x + vec3( ty.x, 0.0, ty.y ) * w.y + vec3( tz.x, tz.y, 0.0 ) * w.z;
}
`;

const VERTEX_PARS = /* glsl */ `
varying vec3 vMundoT;
varying vec3 vNormalT;
varying float vAltT;
`;

/** Posición y normal de mundo (con la matriz de instancia si la hay) y altura local escalada. */
const VERTEX_MUNDO = /* glsl */ `
{
	vec4 wpT = vec4( transformed, 1.0 );
	vec3 nI = objectNormal;
	float syT = 1.0;
	#ifdef USE_INSTANCING
		wpT = instanceMatrix * wpT;
		mat3 imT = mat3( instanceMatrix );
		nI /= vec3( dot( imT[ 0 ], imT[ 0 ] ), dot( imT[ 1 ], imT[ 1 ] ), dot( imT[ 2 ], imT[ 2 ] ) );
		nI = imT * nI;
		syT = length( imT[ 1 ] );
	#endif
	vMundoT = ( modelMatrix * wpT ).xyz;
	vNormalT = normalize( mat3( modelMatrix ) * nI );
	vAltT = transformed.y * syT;
}
`;

function fragmentPars(extra: string): string {
  return /* glsl */ `
varying vec3 vMundoT;
varying vec3 vNormalT;
varying float vAltT;
uniform sampler2D tSuelo;
uniform sampler2D tSueloN;
uniform sampler2D tArenaN;
uniform sampler2D tRoca;
uniform sampler2D tRocaN;
uniform vec3 uRegolito;
uniform vec3 uRegolitoOscuro;
uniform vec3 uRoca;
uniform vec3 uEstrato;
uniform vec3 uPolvo;
uniform float uSuelo;
uniform sampler2D tCaminos;
const vec3 MEDIA_SUELO = vec3( ${MEDIA.suelo.map(f).join(", ")} );
const vec3 MEDIA_ROCA = vec3( ${MEDIA.roca.map(f).join(", ")} );
${RUIDO_GLSL}
${extra}
`;
}

const E = ESCALAS_SUELO;

/**
 * Huella de bota (as11-40-5878): óvalo con suela marcada. `densidad` (0-1) decide cuántas celdas tienen
 * huella: solo donde se camina de verdad, en manchones (as11-40-5902), nunca como patrón parejo.
 */
const BOTA_GLSL = /* glsl */ `
float botaCapaT( vec2 p, float densidad, float semilla ) {
	vec2 celda = floor( p / 0.36 );
	vec2 loc = p - ( celda + 0.5 ) * 0.36;
	if ( hashT( celda + semilla ) > densidad ) return 0.0;
	float ang = hashT( celda + 7.1 + semilla ) * 6.2832;
	vec2 cs = vec2( cos( ang ), sin( ang ) );
	vec2 q = vec2( dot( loc, cs ), dot( loc, vec2( - cs.y, cs.x ) ) );
	q += ( vec2( hashT( celda + 3.3 ), hashT( celda + 5.7 ) ) - 0.5 ) * 0.08;
	float e = length( q / vec2( 0.13, 0.05 ) );
	// Parcialmente borrada por el polvo.
	float borrada = 0.45 + 0.55 * hashT( celda + 9.9 + semilla );
	return ( 1.0 - smoothstep( 0.7, 1.0, e ) ) * ( 0.8 + 0.2 * sin( q.x * 160.0 ) ) * borrada;
}
float botaT( vec2 p, float densidad ) {
	// Dos capas desfasadas: huellas que se pisan unas a otras.
	return max( botaCapaT( p, densidad, 0.0 ), botaCapaT( p + vec2( 0.18, 0.11 ), densidad * 0.7, 13.0 ) );
}
`;

/**
 * Color del suelo: reemplaza `map_fragment`. Deja variables para la normal. Referencias (regla 11):
 * estratos y cornisas `occupy-mars-2`; afloramientos en laderas suaves y talud al pie de las paredes
 * `surviving-mars-8` y `occupy-mars-2`; suelo usado en `caminosSuelo.ts`.
 */
const SUELO_COLOR = /* glsl */ `
vec3 pT = vMundoT;
vec3 nT = normalize( vNormalT );
float distT = length( pT - cameraPosition );
float cercaT = 1.0 - smoothstep( 25.0, 140.0, distT );
float macroT = fbmT( pT.xz / 38.0 );
float macro2T = fbmT( pT.xz / 170.0 + 3.7 );
float altoT = pT.y - uSuelo;
vec2 uvA = pT.xz / ${f(E.granoFino)};
vec2 uvB = mat2( 0.8, - 0.6, 0.6, 0.8 ) * pT.xz / ${f(E.granoGrueso)};
vec3 gA = texture2D( tSuelo, uvA ).rgb / MEDIA_SUELO;
vec3 gB = texture2D( tSuelo, uvB ).rgb / MEDIA_SUELO;
// Parches de arena lisa (ondas de viento) entre zonas de grava.
float mArenaT = smoothstep( 0.42, 0.68, fbmT( pT.xz / 13.0 + 11.0 ) );
vec3 granoT = mix( vec3( 1.0 ), mix( gB, gA, 0.3 + 0.45 * cercaT ), mix( 0.62, 0.22, mArenaT ) );
vec3 sueloT = mix( uRegolitoOscuro, uRegolito, smoothstep( 0.2, 0.8, macroT ) ) * granoT * ( 0.88 + 0.24 * macro2T ) * ( 1.0 + 0.1 * mArenaT );
vec3 wT = pow( abs( nT ), vec3( 4.0 ) );
wT /= ( wT.x + wT.y + wT.z );
vec3 rocaTexT = triplanarT( tRoca, pT, wT, ${f(1 / E.rocaPared)} ) / MEDIA_ROCA;
// Estratos: banda principal, fina y gruesa (se lee lejos), con una línea oscura de cornisa entre capas.
float yE = pT.y + 1.4 * fbmT( pT.xz / 16.0 );
float bandaT = sin( yE * 6.2832 / ${f(E.estrato)} ) * 0.5 + 0.5;
float bandaFinaT = sin( yE * 6.2832 / ${f(E.estratoFino)} + 1.3 ) * 0.5 + 0.5;
float bandaGruesaT = sin( yE * 6.2832 / ${f(E.estratoGrueso)} + 0.7 ) * 0.5 + 0.5;
float lineaT = 1.0 - smoothstep( 0.0, 0.14, abs( sin( 3.14159 * yE / ${f(E.estrato)} ) ) );
vec3 rocaT = mix( uRoca, uEstrato, smoothstep( 0.4, 0.9, bandaT ) * 0.7 + bandaFinaT * 0.3 ) * mix( 0.78, 1.18, bandaGruesaT ) * ( 1.0 - 0.38 * lineaT ) * mix( vec3( 1.0 ), rocaTexT, 0.75 );
float pendT = 1.0 - nT.y;
// Afloramientos de roca en lo alto, sin depender de la pendiente: también en laderas suaves.
float afloraT = smoothstep( 0.56, 0.68, fbmT( pT.xz / 21.0 + 5.0 ) ) * smoothstep( 2.0, 7.0, altoT );
float mRocaT = max( smoothstep( 0.12, 0.32, pendT + ( macroT - 0.5 ) * 0.16 ), afloraT * 0.8 );
float mPolvoT = smoothstep( 0.86, 0.96, nT.y ) * smoothstep( 1.5, 5.0, altoT ) * ( 1.0 - afloraT );
// Talud de piedra al pie de las paredes (horneado al cargar, \`horneado.z\`).
float taludT = vHornT.z;
vec3 piedraT = mix( uRoca, uRegolitoOscuro, 0.4 ) * mix( vec3( 1.0 ), rocaTexT * gA, 0.6 );
vec3 colT = mix( sueloT, piedraT, taludT * 0.75 * ( 1.0 - mRocaT ) );
colT = mix( colT, rocaT, mRocaT );
colT = mix( colT, uPolvo * mix( vec3( 1.0 ), granoT, 0.5 ), mPolvoT * 0.75 );
// Suelo usado (\`caminosSuelo.ts\`): senderos y zonas de trabajo compactados, suelo removido, botas y rover.
vec2 uvCamT = pT.xz / ${f(CAMPO_CAMINOS.lado)} + 0.5;
float dentroCampoT = step( abs( uvCamT.x - 0.5 ), 0.499 ) * step( abs( uvCamT.y - 0.5 ), 0.499 );
vec4 camT = texture2D( tCaminos, uvCamT );
vec4 usoT = texture2D( tUso, uvCamT );
float bordeT = ( camT.r - 0.5 ) * ${f(2 * CAMPO_CAMINOS.rango)} + ( fbmT( pT.xz * 1.6 ) - 0.5 ) * 0.55;
float mCamT = ( 1.0 - smoothstep( - 0.2, 0.35, bordeT ) ) * dentroCampoT;
// Removido: regolito fresco, más oscuro y rojizo que el polvo de arriba, en manchas.
float mRemT = dentroCampoT * usoT.a * smoothstep( 0.3, 0.6, fbmT( pT.xz * 0.9 + 2.0 ) + usoT.a * 0.35 );
// Huellas solo donde se camina: centro del sendero y esclusa (suelo removido), en manchones.
float latCamT = abs( camT.g - 0.5 ) * 2.0;
float pisadoT = max( mCamT * ( 1.0 - smoothstep( 0.3, 0.7, latCamT ) ) * step( 0.01, camT.g ), mRemT * 0.8 );
float densidadBotaT = 0.55 * pisadoT * smoothstep( 0.42, 0.62, fbmT( pT.xz * 0.7 + 4.0 ) );
float botaVisT = ( 1.0 - smoothstep( 8.0, 22.0, distT ) ) * step( 0.02, densidadBotaT );
float bota0T = botaVisT > 0.0 ? botaT( pT.xz, densidadBotaT ) : 0.0;
float latRT = ( usoT.r - 0.5 ) * ${f(2 * ROVER.semiancho)};
float rumboT = usoT.g * 3.14159;
float alongT = dot( pT.xz, vec2( cos( rumboT ), sin( rumboT ) ) );
float rodadaT = ( 1.0 - smoothstep( ${f(ROVER.rodada / 2 - 0.03)}, ${f(ROVER.rodada / 2 + 0.03)}, abs( abs( latRT ) - ${f(ROVER.trocha / 2)} ) ) ) * usoT.b * dentroCampoT;
float dibujoT = smoothstep( 0.2, 0.8, sin( alongT * 6.2832 / 0.16 + abs( latRT ) * 20.0 ) * 0.5 + 0.5 );
vec3 compactoT = mix( sueloT, uPolvo * mix( vec3( 1.0 ), granoT, 0.3 ), 0.38 );
colT = mix( colT, compactoT, smoothstep( 0.0, 0.25, mCamT ) * 0.8 * ( 1.0 - mRocaT ) );
colT = mix( colT, uRegolitoOscuro * 0.82 * granoT, mRemT * 0.7 );
colT *= 1.0 - 0.12 * bota0T * botaVisT;
colT *= 1.0 - rodadaT * ( 0.16 + 0.1 * dibujoT );
diffuseColor.rgb *= colT;
`;

/** Normal del suelo: va después de `normal_fragment_maps`. */
const SUELO_NORMAL = /* glsl */ `
{
	vec3 sN = texture2D( tSueloN, uvA ).xyz * 2.0 - 1.0;
	vec3 aN = texture2D( tArenaN, mat2( 0.6, 0.8, - 0.8, 0.6 ) * pT.xz / ${f(E.arena)} ).xyz * 2.0 - 1.0;
	float arenaPesoT = mix( 0.35, 1.0, mArenaT ) * ( 1.0 - mPolvoT * 0.5 ) * ( 1.0 - mRemT );
	vec3 perturbT = ( vec3( sN.x, 0.0, - sN.y ) * ( mix( 0.7, 0.25, mArenaT ) + 0.6 * mRemT + 0.5 * taludT ) + vec3( aN.x, 0.0, - aN.y ) * arenaPesoT ) * cercaT;
	perturbT *= 1.0 - 0.7 * smoothstep( 0.0, 0.25, mCamT ) * ( 1.0 - mRemT );
	// Huella de bota hundida unos 2,5 cm: normal por diferencias.
	if ( botaVisT > 0.0 ) {
		float bx = botaT( pT.xz + vec2( 0.015, 0.0 ), densidadBotaT );
		float bz = botaT( pT.xz + vec2( 0.0, 0.015 ), densidadBotaT );
		perturbT += vec3( bx - bota0T, 0.0, bz - bota0T ) * ( 0.015 / 0.015 ) * botaVisT;
	}
	vec3 nRocaT = triplanarNT( tRocaN, pT, wT, ${f(1 / E.rocaPared)} ) * ( 0.4 + 0.6 * cercaT );
	vec3 nW = normalize( nT + mix( perturbT, nRocaT, mRocaT ) );
	normal = normalize( ( viewMatrix * vec4( nW, 0.0 ) ).xyz );
}
`;

/** Luz horneada (sombra del sol y oclusión, \`horneado.xy\`): va después de `lights_fragment_end`. */
const SUELO_LUZ = /* glsl */ `
{
	// Cerca manda el mapa de sombras en tiempo real; lejos, la sombra horneada desde la función de altura.
	float lejosT = smoothstep( 28.0, 55.0, length( vMundoT.xz ) );
	// Cavidad: lejos la oclusión oscurece también parte de la luz directa (canaletas y pies de pared con
	// volumen aunque el sol venga de frente a las caras que mira la cámara).
	float cavidadT = mix( 1.0, vHornT.y * vHornT.y, 0.75 * lejosT );
	float sombraT = mix( 1.0, vHornT.x, lejosT ) * cavidadT;
	reflectedLight.directDiffuse *= sombraT;
	reflectedLight.directSpecular *= sombraT;
	reflectedLight.indirectDiffuse *= vHornT.y * vHornT.y;
}
`;

/** Roca suelta: textura triplanar (en `map_fragment`); polvo y pie oscuro van tras el color de vértice. */
const ROCA_COLOR = /* glsl */ `
vec3 pT = vMundoT;
vec3 nT = normalize( vNormalT );
float distT = length( pT - cameraPosition );
float cercaT = 1.0 - smoothstep( 15.0, 90.0, distT );
vec3 wT = pow( abs( nT ), vec3( 4.0 ) );
wT /= ( wT.x + wT.y + wT.z );
vec3 rocaTexT = triplanarT( tRoca, pT, wT, ${f(1 / E.rocaSuelta)} ) / MEDIA_ROCA;
diffuseColor.rgb *= mix( vec3( 1.0 ), rocaTexT, 0.8 );
`;

const ROCA_POLVO = /* glsl */ `
{
	// Polvo claro en las caras que miran arriba (cima de los bloques de occupy-mars-2).
	float mPolvoT = smoothstep( 0.45, 0.8, nT.y + ( ruidoT( pT.xz * 3.0 ) - 0.5 ) * 0.35 );
	diffuseColor.rgb = mix( diffuseColor.rgb, uPolvo * mix( vec3( 1.0 ), rocaTexT, 0.35 ), mPolvoT * 0.85 );
	diffuseColor.rgb *= 1.0 - 0.45 * ( 1.0 - smoothstep( 0.0, 0.25, vAltT ) );
}
`;

const ROCA_NORMAL = /* glsl */ `
{
	vec3 nRocaT = triplanarNT( tRocaN, pT, wT, ${f(1 / E.rocaSuelta)} ) * ( 0.8 + 0.9 * cercaT );
	normal = normalize( ( viewMatrix * vec4( normalize( nT + nRocaT ), 0.0 ) ).xyz );
}
`;

function instalar(material: THREE.MeshStandardMaterial, suelo: number, tipo: "suelo" | "roca"): void {
  const tx = texturas();
  const P = PALETA_SUELO;
  const uniforms = {
    tSuelo: { value: tx.suelo },
    tSueloN: { value: tx.sueloN },
    tArenaN: { value: tx.arenaN },
    tRoca: { value: tx.roca },
    tRocaN: { value: tx.rocaN },
    uRegolito: { value: lin(P.regolito) },
    uRegolitoOscuro: { value: lin(P.regolitoOscuro) },
    uRoca: { value: lin(P.roca) },
    uEstrato: { value: lin(P.estrato) },
    uPolvo: { value: lin(P.polvo) },
    uSuelo: { value: suelo },
    tCaminos: { value: texturaCaminos() },
    tUso: { value: texturaUso() },
  };
  material.userData.uniformsSuelo = uniforms;
  material.customProgramCacheKey = () => `marte-${tipo}`;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    // El suelo lleva además la luz horneada (`horneado`: sombra del sol, oclusión y talud).
    const extraVertex = tipo === "suelo" ? "attribute vec3 horneado;\nvarying vec3 vHornT;" : "";
    const extraMundo = tipo === "suelo" ? "vHornT = horneado;" : "";
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_PARS}\n${extraVertex}`)
      .replace("#include <worldpos_vertex>", `#include <worldpos_vertex>\n${VERTEX_MUNDO}\n${extraMundo}`);
    const extraFrag = tipo === "suelo" ? `varying vec3 vHornT;\nuniform sampler2D tUso;\n${BOTA_GLSL}` : "";
    const frag = shader.fragmentShader.replace("#include <common>", `#include <common>\n${fragmentPars(extraFrag)}`);
    shader.fragmentShader =
      tipo === "suelo"
        ? frag
            .replace("#include <map_fragment>", SUELO_COLOR)
            .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${SUELO_NORMAL}`)
            .replace("#include <lights_fragment_end>", `#include <lights_fragment_end>\n${SUELO_LUZ}`)
        : frag
            .replace("#include <map_fragment>", ROCA_COLOR)
            .replace("#include <color_fragment>", `#include <color_fragment>\n${ROCA_POLVO}`)
            .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${ROCA_NORMAL}`);
  };
}

export interface MaterialesSuelo {
  terreno: { detallado: THREE.MeshStandardMaterial; simple: THREE.MeshStandardMaterial };
  roca: { detallado: THREE.MeshStandardMaterial; simple: THREE.MeshStandardMaterial };
  /** Los cuatro, para que el dueño de la escena los libere con `liberarMateriales`. */
  todos: readonly THREE.MeshStandardMaterial[];
}

/**
 * Materiales del suelo de Marte. `suelo` = altura (mundo) del suelo de la base: el polvo de las cornisas
 * empieza por encima. Van marcados `compartido`: `ponerTerreno` los reutiliza y los libera el dueño de la escena.
 */
export function crearMaterialesSuelo(suelo = 0): MaterialesSuelo {
  const terrenoDetallado = new THREE.MeshStandardMaterial({ name: "Terrain_Mars", color: 0xffffff, roughness: 0.96, metalness: 0 });
  instalar(terrenoDetallado, suelo, "suelo");
  const terrenoSimple = new THREE.MeshStandardMaterial({ name: "Terrain_Mars_Simple", color: 0xffffff, roughness: 0.96, metalness: 0, vertexColors: true });
  const rocaDetallada = new THREE.MeshStandardMaterial({ name: "Rock_Mars", color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true });
  instalar(rocaDetallada, suelo, "roca");
  const rocaSimple = new THREE.MeshStandardMaterial({ name: "Rock_Mars_Simple", color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true });
  const todos = [terrenoDetallado, terrenoSimple, rocaDetallada, rocaSimple];
  for (const m of todos) m.userData.compartido = true;
  return {
    terreno: { detallado: terrenoDetallado, simple: terrenoSimple },
    roca: { detallado: rocaDetallada, simple: rocaSimple },
    todos,
  };
}

/** Color de partida (lineal) del regolito, la roca de pared y el polvo, para el color de vértice de respaldo. */
export function coloresRespaldo(): { regolito: THREE.Color; roca: THREE.Color; polvo: THREE.Color; rocaSuelta: THREE.Color } {
  const P = PALETA_SUELO;
  return { regolito: lin(P.regolito), roca: lin(P.roca), polvo: lin(P.polvo), rocaSuelta: lin(P.rocaSuelta) };
}
