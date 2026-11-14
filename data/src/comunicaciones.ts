/**
 * Retraso de comunicaciones Marte–Tierra (paso 7 de la ruta dorada; lo nombra el enunciado).
 * Calculado por código: distancia / velocidad de la luz. Distancias [V] NASA NSSDC, ficha de Marte
 * ("Distance from Earth": mínimo 54,6 y máximo 401,4 millones de km; actualizada el 19 may 2025).
 */
export const DISTANCIA_TIERRA_MARTE_KM = { min: 54.6e6, max: 401.4e6 } as const;
export const VELOCIDAD_LUZ_KM_S = 299_792.458; // definición exacta (SI)
export const FUENTE_DISTANCIA = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html";

/** Minutos que tarda un mensaje en UN sentido, con un decimal. */
export const minutosLuz = (km: number) => Math.round((km / VELOCIDAD_LUZ_KM_S / 60) * 10) / 10;

export const RETRASO_MARTE_MIN = {
  min: minutosLuz(DISTANCIA_TIERRA_MARTE_KM.min),
  max: minutosLuz(DISTANCIA_TIERRA_MARTE_KM.max),
} as const;
