/**
 * Atmósfera y gradación de color del exterior (Etapa A). Cambia cuatro chunks de r160 una sola vez,
 * antes de compilar cualquier material del exterior:
 *
 * - Niebla de altura: solo en la rama `FOG_EXP2` (la escena usa `THREE.FogExp2` cuando el interruptor
 *   `nieblaAltura` está activo). Densa a ras del suelo y lejos, limpia cerca del jugador; color caramelo.
 *   La niebla lineal (`THREE.Fog`) queda igual que en three, así otras escenas no cambian.
 * - Gradación: el `CustomToneMapping` de r160 viene vacío. Acá es AgX + curva en S + tono partido
 *   (luces altas cálidas, sombras levemente frías) + saturación moderada. Lo usan los materiales cuando el
 *   renderer tiene `CustomToneMapping` y el pase final del compositor (`postproceso.ts`).
 *
 * Ningún otro archivo de `ui/` usa `FogExp2` ni `CustomToneMapping` (verificado con grep al escribir esto).
 */
import * as THREE from "three";

/**
 * Niebla de altura (u = m). Densidad de altura: `exp(-caida · (y - suelo))`. Profundidad óptica:
 * `F · (x + (cuadratica · x)²)` con `x = densidad · d`, `d` = distancia menos `inicio` y `F` = la integral de
 * la densidad a lo largo del rayo. La parte lineal da bruma a media distancia (lomas a 40-80 m); la
 * cuadrática separa las tres capas de montañas (215, 252 y 292 m), cada una más lavada. [E]
 */
export const NIEBLA_ALTURA = {
  /** Radio limpio alrededor de la cámara (m): la base se ve con su color pleno. */
  inicio: 18,
  /** Caída con la altura (1/m): a 40 m sobre el suelo la densidad baja a ~37 %. */
  caida: 0.025,
  /** Altura del suelo de la base (m). */
  suelo: 0,
  /** Peso del término cuadrático. */
  cuadratica: 1.1,
} as const;

/** Densidad de la niebla de altura por momento (`FogExp2.density`). La noche va sin bruma. [E] */
export const DENSIDAD_NIEBLA = { dia: 0.0036, atardecer: 0.0038, noche: 0.0006 } as const;

/**
 * Gradación sobre AgX, en espacio aproximado de pantalla (gamma 2,2). [E]
 * - `contraste`: mezcla hacia una curva en S (smoothstep) alrededor del gris medio.
 * - `sombra` / `luz`: desplazamiento RGB en sombras (frío) y luces altas (cálido).
 * - `saturacion`: 1 = la de AgX, que tiende a lavar; un poco más la devuelve sin saturar de más.
 * - `desaturarSombra`: cuánto se acercan las sombras a su gris (el regolito rojo bajo un relleno caramelo
 *   da rojo al cuadrado; así quedan pardas y levemente frías, no rojas).
 */
export const GRADACION = {
  contraste: 0.36,
  sombra: [-0.03, -0.006, 0.034] as const,
  luz: [0.012, 0.004, -0.012] as const,
  saturacion: 1.0,
  desaturarSombra: 0.38,
} as const;

const f = (n: number) => n.toFixed(5);
const v3 = (v: readonly number[]) => `vec3( ${v.map(f).join(", ")} )`;

const FOG_PARS_VERTEX = /* glsl */ `
#ifdef USE_FOG
	varying float vFogDepth;
	#ifdef FOG_EXP2
		varying vec3 vFogMundo;
	#endif
#endif
`;

const FOG_VERTEX = /* glsl */ `
#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	#ifdef FOG_EXP2
		// Posición de mundo sin inversa: vista = R · mundo + t, y v · M = transpose(M) · v.
		vFogMundo = ( mvPosition.xyz - viewMatrix[ 3 ].xyz ) * mat3( viewMatrix );
	#endif
#endif
`;

const FOG_PARS_FRAGMENT = /* glsl */ `
#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
		varying vec3 vFogMundo;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif
`;

const FOG_FRAGMENT = /* glsl */ `
#ifdef USE_FOG
	#ifdef FOG_EXP2
		vec3 fogRayo = vFogMundo - cameraPosition;
		float fogDist = length( fogRayo );
		float fogD = max( fogDist - ${f(NIEBLA_ALTURA.inicio)}, 0.0 );
		float fogK = ${f(NIEBLA_ALTURA.caida)};
		float fogH = cameraPosition.y - ${f(NIEBLA_ALTURA.suelo)};
		float fogKy = fogK * fogRayo.y;
		// Integral de exp(-k·h) a lo largo del rayo, normalizada por la distancia (1 en un rayo horizontal).
		float fogF = exp( - fogK * fogH ) * ( abs( fogKy ) > 1e-3 ? ( 1.0 - exp( - fogKy ) ) / fogKy : 1.0 );
		float fogX = fogDensity * fogD;
		float fogQ = ${f(NIEBLA_ALTURA.cuadratica)} * fogX;
		float fogTau = ( fogX + fogQ * fogQ ) * min( fogF, 4.0 );
		float fogFactor = 1.0 - exp( - fogTau );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif
`;

const GRADACION_GLSL = /* glsl */ `
vec3 CustomToneMapping( vec3 color ) {
	vec3 c = AgXToneMapping( color );
	vec3 p = pow( max( c, vec3( 0.0 ) ), vec3( 1.0 / 2.2 ) );
	vec3 s = p * p * ( 3.0 - 2.0 * p );
	p = mix( p, s, ${f(GRADACION.contraste)} );
	float l = dot( p, vec3( 0.2126, 0.7152, 0.0722 ) );
	float enSombra = 1.0 - smoothstep( 0.08, 0.5, l );
	p = mix( p, vec3( l ), ${f(GRADACION.desaturarSombra)} * enSombra );
	p += ${v3(GRADACION.sombra)} * enSombra;
	p += ${v3(GRADACION.luz)} * smoothstep( 0.55, 0.95, l );
	float l2 = dot( p, vec3( 0.2126, 0.7152, 0.0722 ) );
	p = mix( vec3( l2 ), p, ${f(GRADACION.saturacion)} );
	return pow( clamp( p, 0.0, 1.0 ), vec3( 2.2 ) );
}
`;

const STUB_CUSTOM = "vec3 CustomToneMapping( vec3 color ) { return color; }";

let instalada = false;

/** Instala los chunks (idempotente). Hay que llamarla antes del primer render del exterior. */
export function instalarAtmosfera(): void {
  if (instalada) return;
  const chunks = THREE.ShaderChunk as unknown as Record<string, string>;
  const tono = chunks.tonemapping_pars_fragment ?? "";
  if (!tono.includes(STUB_CUSTOM)) {
    // Otra versión de three: sin gradación, pero el resto sigue (AgX queda como estaba).
    console.warn("[atmosfera] tonemapping_pars_fragment cambió; sin gradación personalizada");
  } else {
    chunks.tonemapping_pars_fragment = tono.replace(STUB_CUSTOM, GRADACION_GLSL);
  }
  chunks.fog_pars_vertex = FOG_PARS_VERTEX;
  chunks.fog_vertex = FOG_VERTEX;
  chunks.fog_pars_fragment = FOG_PARS_FRAGMENT;
  chunks.fog_fragment = FOG_FRAGMENT;
  instalada = true;
}

/** Tone mapping del exterior según el interruptor de gradación. */
export function toneMappingExterior(gradacion: boolean): THREE.ToneMapping {
  return gradacion ? THREE.CustomToneMapping : THREE.NoToneMapping;
}
