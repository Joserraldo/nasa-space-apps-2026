/**
 * Terreno de Jezero (Mars Trek) y sitios candidatos. Las medidas (elevación) son de NASA/ESA
 * vía Mars Trek; pendiente, horizonte y puntajes son DERIVADOS por el equipo con reglas fijas
 * (docs/science/terreno.md). Nada de esto es "en vivo".
 */
import { z } from "zod";

/** Recuadro del mapa: el cráter completo (~45 km) con su borde. Grados este / norte. */
export const JEZERO = { oeste: 76.9, sur: 17.7, este: 78.3, norte: 19.1, ancho: 280, alto: 280 } as const;

/** Radio de Marte (esfera IAU 2000) usado por Trek para su proyección. */
export const RADIO_MARTE_M = 3_396_190;

const Puntaje = z.number().min(0).max(1);

export const SitioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombreKey: z.string(),
  descripcionKey: z.string(),
  lon: z.number(),
  lat: z.number(),
  /** Medido (DEM MOLA+HRSC vía Mars Trek). */
  elevacionM: z.number(),
  /** Derivado: pendiente media (grados) en un radio de ~1,5 km. */
  pendienteGrados: z.number().min(0),
  /** Derivado: altura media del horizonte (grados) en 8 direcciones, hasta 15 km. */
  horizonteGrados: z.number().min(0),
  /** Derivados 0–1 (1 = mejor). Ningún sitio es perfecto: lo comprueba una prueba. */
  puntajes: z.object({ plano: Puntaje, luz: Puntaje, blindaje: Puntaje }),
});
export type Sitio = z.infer<typeof SitioSchema>;

export const TerrenoSchema = z.object({
  version: z.literal("0.1.0"),
  id: z.literal("jezero"),
  nombreKey: z.string(),
  bbox: z.object({ oeste: z.number(), sur: z.number(), este: z.number(), norte: z.number() }),
  dem: z.object({ archivo: z.string(), ancho: z.number().int(), alto: z.number().int(), metrosPorPixel: z.number(), minM: z.number(), maxM: z.number() }),
  imagenes: z.object({
    sombreado: z.string(),
    ctx: z.array(z.object({ archivo: z.string(), oeste: z.number(), norte: z.number(), grados: z.number() })),
  }),
  sitios: z.array(SitioSchema).min(3).max(4),
  fuente: z.object({
    nombreKey: z.literal("fuente.marsTrek"),
    dueno: z.string(),
    urls: z.array(z.string().url()).min(1),
    consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estadoDato: z.literal("curado"),
    /** Clave del texto "valores derivados por el equipo a partir de…". */
    derivadoKey: z.literal("datos.terreno.derivado"),
  }),
});
export type Terreno = z.infer<typeof TerrenoSchema>;

/** Radio de la Luna (esfera IAU, 1 737 400 m) usado por Moon Trek (SR 104903). */
export const RADIO_LUNA_M = 1_737_400;
/** Cuadro de 0,5° × 0,5° alrededor de cada sitio (64 × 64 px del DEM LOLA de 128 px/grado). */
export const LUNA_CUADRO = { medioGrados: 0.25, px: 64 } as const;

export const SitioLunaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombreKey: z.string(),
  descripcionKey: z.string(),
  /** Misión Apolo cuyo módulo de descenso fija la posición (capa CombinedNomenclature de Moon Trek). */
  mision: z.string(),
  lon: z.number(),
  lat: z.number(),
  bbox: z.object({ oeste: z.number(), sur: z.number(), este: z.number(), norte: z.number() }),
  dem: z.object({ archivo: z.string(), ancho: z.number().int(), alto: z.number().int(), metrosPorPixel: z.number() }),
  sombreado: z.string(),
  /** Medido (DEM LOLA vía Moon Trek). */
  elevacionM: z.number(),
  /** Derivado: pendiente media (grados) en un radio de 1,5 km, igual que Jezero. */
  pendienteGrados: z.number().min(0),
  /** Derivado: máximo − mínimo del DEM en el cuadro de 0,5° (~15 km). */
  relieveM: z.number().min(0),
  /** Derivado 0–1 (1 = mejor), como en Jezero. Solo el plano tiene fuente; luz y blindaje quedan pendientes (null). */
  puntajes: z.object({ plano: Puntaje, luz: Puntaje.nullable(), blindaje: Puntaje.nullable() }),
});
export type SitioLuna = z.infer<typeof SitioLunaSchema>;

export const TerrenoLunaSchema = z.object({
  version: z.literal("0.1.0"),
  id: z.literal("luna-visible"),
  nombreKey: z.string(),
  sitios: z.array(SitioLunaSchema).length(3),
  fuente: z.object({
    nombreKey: z.literal("fuente.moonTrek"),
    dueno: z.string(),
    urls: z.array(z.string().url()).min(1),
    consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estadoDato: z.literal("curado"),
    derivadoKey: z.literal("datos.terreno.derivado"),
    /** Criterios sin fuente verificada: no se inventan valores. */
    pendientes: z.array(z.enum(["luz", "blindaje", "citaHielo"])),
  }),
});
export type TerrenoLuna = z.infer<typeof TerrenoLunaSchema>;

/**
 * Luz de los sitios de luna-visible en 2024. La tabla del punto subsolar es de NASA SVS 5187;
 * elevación del Sol y amaneceres son DERIVADOS por el equipo (fórmula esférica, horizonte plano).
 */
export const LuzLunaSchema = z.object({
  version: z.literal("0.1.0"),
  id: z.literal("luz-luna-visible"),
  metodo: z.string(),
  tabla: z.object({
    archivo: z.string(),
    filas: z.number().int(),
    desde: z.string(),
    hasta: z.string(),
    columnas: z.object({ latSolar: z.string(), lonSolar: z.string() }),
  }),
  tormentas: z.array(
    z.object({
      id: z.string(),
      /** Hora de la primera fase de la tormenta curada (DONKI), UTC. */
      horaUtc: z.string(),
      sitios: z.array(
        z.object({
          sitioId: z.string(),
          subsolar: z.object({ latGrados: z.number().min(-90).max(90), lonGrados: z.number().min(-180).max(180) }),
          /** Derivado: altura del Sol sobre un horizonte plano. */
          elevacionSolGrados: z.number().min(-90).max(90),
          dia: z.boolean(),
          proximoAmanecerUtc: z.string().nullable(),
          horasHastaAmanecer: z.number().min(0).nullable(),
        }),
      ),
    }),
  ),
  sitios: z.array(
    z.object({
      sitioId: z.string(),
      /** Derivado: fracción de las horas de 2024 con el Sol sobre el horizonte plano. */
      fraccionConSol2024: z.number().min(0).max(1),
      amaneceres2024Utc: z.array(z.string()),
    }),
  ),
  fuente: z.object({
    nombreKey: z.literal("fuente.svs"),
    dueno: z.string(),
    urls: z.array(z.string().url()).min(1),
    consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estadoDato: z.literal("curado"),
    derivadoKey: z.literal("datos.luz.derivado"),
  }),
});
export type LuzLuna = z.infer<typeof LuzLunaSchema>;

/** Proyección estereográfica polar norte de Mars Trek (esfera Mars 2000, meridiano central 0, metros). */
export function proyectarPolarNorte(lonEsteGrados: number, latGrados: number): { x: number; y: number } {
  const rad = Math.PI / 180;
  const rho = 2 * RADIO_MARTE_M * Math.tan(((90 - latGrados) * rad) / 2);
  return { x: rho * Math.sin(lonEsteGrados * rad), y: -rho * Math.cos(lonEsteGrados * rad) };
}

/** Cuadro de 24 km × 24 km alrededor de cada sitio del polo norte (160 × 160 px, 150 m/px; el DEM nativo es de ~39 m/px). */
export const MARTE_NORTE_CUADRO = { medioM: 12_000, px: 160 } as const;

export const SitioMarteNorteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nombreKey: z.string(),
  descripcionKey: z.string(),
  /** Nombre y tipo en el nomenclátor de la UAI (capa combinedNom_np de Mars Trek). */
  nomenclatura: z.object({ nombre: z.string(), tipo: z.string(), diametroKm: z.number() }),
  lon: z.number(),
  lat: z.number(),
  /** Centro en la proyección polar (metros), calculado con `proyectarPolarNorte`. */
  centroM: z.object({ x: z.number(), y: z.number() }),
  /** Recuadro en la proyección polar (metros). La fila 0 del DEM es el borde de y máxima. */
  bboxM: z.object({ xmin: z.number(), ymin: z.number(), xmax: z.number(), ymax: z.number() }),
  dem: z.object({ archivo: z.string(), ancho: z.number().int(), alto: z.number().int(), metrosPorPixel: z.number() }),
  /** Medido (DEM MOLA vía Mars Trek). */
  elevacionM: z.number(),
  /** Derivado: pendiente media (grados) en un radio de 1,5 km, igual que Jezero. */
  pendienteGrados: z.number().min(0),
  /** Derivado: máximo − mínimo del DEM en el cuadro de 24 km. */
  relieveM: z.number().min(0),
  puntajes: z.object({ plano: Puntaje, luz: Puntaje.nullable(), blindaje: Puntaje.nullable() }),
});
export type SitioMarteNorte = z.infer<typeof SitioMarteNorteSchema>;

export const TerrenoMarteNorteSchema = z.object({
  version: z.literal("0.1.0"),
  id: z.literal("marte-polo-norte"),
  nombreKey: z.string(),
  sitios: z.array(SitioMarteNorteSchema).min(3).max(4),
  fuente: z.object({
    nombreKey: z.literal("fuente.marsTrek"),
    dueno: z.string(),
    urls: z.array(z.string().url()).min(1),
    consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    estadoDato: z.literal("curado"),
    derivadoKey: z.literal("datos.terreno.derivado"),
    /** Criterios sin fuente verificada: no se inventan valores. */
    pendientes: z.array(z.enum(["luz", "blindaje"])),
  }),
});
export type TerrenoMarteNorte = z.infer<typeof TerrenoMarteNorteSchema>;

/** Estereográfica polar sur de Moon Trek (esfera IAU, escala 1 en el polo): misma que LRO_LOLA_DEM_SPole75_30mp_v04. */
export const WKT_POLAR_SUR =
  'PROJCS["Moon2000_spole",GEOGCS["GCS_Moon",DATUM["D_Moon_2000",SPHEROID["Moon_2000_IAU_IAG",1737400.0,0.0]],PRIMEM["Reference_Meridian",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Stereographic_South_Pole"],PARAMETER["false_easting",0.0],PARAMETER["false_northing",0.0],PARAMETER["central_meridian",0.0],PARAMETER["standard_parallel_1",-90.0],UNIT["Meter",1.0]]';
/** Cuadro de 15,36 km alrededor de cada sitio del polo sur: 128 × 128 px de 120 m. */
export const LUNA_SUR_CUADRO = { ladoM: 15_360, px: 128 } as const;

/** (lat, lon) en grados → metros en la proyección polar sur: ρ = 2R·tan((90+lat)/2), x = ρ·sin(lon), y = ρ·cos(lon). */
export function aPolarSur(lat: number, lon: number): { x: number; y: number } {
  const rad = Math.PI / 180;
  const rho = 2 * RADIO_LUNA_M * Math.tan(((90 + lat) * rad) / 2);
  return { x: rho * Math.sin(lon * rad), y: rho * Math.cos(lon * rad) };
}

/** De dónde sale cada dato de hielo/sombra/temperatura: capa de Moon Trek, instrumento (si la capa lo declara) y fecha. */
const CapaHieloSchema = z.object({
  capa: z.string(),
  /** null = el servicio no lo declara (no se inventa). */
  instrumento: z.string().nullable(),
  consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.string().url(),
  /** "derivado" = lo calculó el equipo a partir de la capa; "medido" = valor tal cual de la capa. */
  origen: z.enum(["medido", "derivado"]),
});
export const HieloSombraSchema = z.object({
  /** PSR_SP (dato secundario): puntos (centros) de regiones en sombra permanente dentro del recuadro; no son polígonos. */
  sombraPermanente: CapaHieloSchema.extend({
    regionesEnRecuadro: z.number().int().min(0),
    ids: z.array(z.string()),
    /** Área de la región entera (puede salirse del recuadro). */
    areaRegionesKm2: z.number().min(0),
    textoKey: z.string().nullable(),
  }),
  /** LOLA (LRO): fracción del recuadro en sombra permanente (mapa binario 240 m, Mazarico et al. 2011). Es la base del texto de sombra. */
  sombraPermanenteLola: CapaHieloSchema.extend({
    /** Parte del recuadro (0..1) en sombra permanente, leída de teselas WMTS (~667 m/px): aproximada. */
    fraccion: z.number().min(0).max(1),
    /** ¿El centro del cráter está en sombra permanente? */
    centro: z.boolean(),
    cita: z.string(),
    /** Resolución de lectura (m/px en latitud): la capa nativa es de 240 m. */
    resolucionLecturaM: z.number(),
  }).optional(),
  /** SP_IceLoc_280m: puntos con "señal de hielo" dentro del recuadro. La capa no documenta qué mide. */
  senalHielo: CapaHieloSchema.extend({
    puntosEnRecuadro: z.number().int().min(0),
    /** false = la capa no tiene cita verificada: el texto de hielo NO se asigna hasta que la haya. */
    citaVerificada: z.boolean().optional(),
    textoKey: z.string().nullable(),
  }),
  /** DIVINER máximo estacional < 110 K (verano e invierno del sur). */
  temperatura: CapaHieloSchema.extend({
    capaInvierno: z.string(),
    fraccionBajo110KVerano: z.number().min(0).max(1),
    fraccionBajo110KInvierno: z.number().min(0).max(1),
    /** El valor más bajo de la capa dentro del recuadro (K): medido. */
    minimoMaxVeranoK: z.number().nullable(),
    minimoMaxInviernoK: z.number().nullable(),
    textoKey: z.string().nullable(),
  }),
});
export type HieloSombra = z.infer<typeof HieloSombraSchema>;

export const SitioLunaSurSchema = SitioLunaSchema.omit({ mision: true, bbox: true, sombreado: true }).extend({
  /** Nombre del accidente en el nomenclátor IAU (capa CombinedNomenclature de Moon Trek). */
  nombreIau: z.string(),
  /** Diámetro del accidente (km), del nomenclátor. */
  diametroKm: z.number(),
  /** Recuadro en metros de la proyección polar sur (ver WKT_POLAR_SUR). */
  bboxM: z.object({ xmin: z.number(), ymin: z.number(), xmax: z.number(), ymax: z.number() }),
  /** Hielo, sombra permanente y frío (opcional para no romper datos viejos). */
  hieloSombra: HieloSombraSchema.optional(),
});
export type SitioLunaSur = z.infer<typeof SitioLunaSurSchema>;

export const TerrenoLunaPoloSurSchema = TerrenoLunaSchema.omit({ id: true, sitios: true }).extend({
  id: z.literal("luna-polo-sur"),
  sitios: z.array(SitioLunaSurSchema).min(4).max(6),
});
export type TerrenoLunaPoloSur = z.infer<typeof TerrenoLunaPoloSurSchema>;
