import type { SourceCard } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";

/** Catálogo B4: fuentes NASA consultadas, estáticas. No representan mediciones en vivo del juego. */
export const CURIOSIDADES_MARTE = [
  {"id": "sol", "experto": "ia_base", "momento": "llegada", "tipo": "propiedad", "url": "https://science.nasa.gov/mars/facts/"},
  {"id": "azul", "experto": "meteorologa", "momento": "atardecer", "tipo": "observacion", "url": "https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/"},
  {"id": "remolino", "experto": "meteorologa", "momento": "remolino", "tipo": "observacion", "url": "https://science.nasa.gov/resource/dust-devils-on-mars/"},
  {"id": "lunas", "experto": "meteorologa", "momento": "lunas", "tipo": "propiedad", "url": "https://science.nasa.gov/mars/facts/"},
  {"id": "polvo", "experto": "meteorologa", "momento": "polvo", "tipo": "observacion", "url": "https://science.nasa.gov/solar-system/planets/mars/10-things-dust-in-the-wind-on-mars-and-well-beyond/"},
  {"id": "moxie", "experto": "ingeniera", "momento": "oxigeno", "tipo": "tecnologia", "url": "https://www.nasa.gov/space-technology-mission-directorate/tdm/mars-oxygen-in-situ-resource-utilization-experiment-moxie/"},
  {"id": "rad", "experto": "doctora", "momento": "radiacion", "tipo": "observacion", "url": "https://science.nasa.gov/resource/curiosity-sees-streaks-and-specks-during-2024-solar-storm/"},
  {"id": "senal", "experto": "ia_base", "momento": "telemetria", "tipo": "propiedad", "url": "https://www.nasa.gov/wp-content/uploads/2024/01/mars-communications-disruption-and-delay.pdf"},
  {"id": "analogo", "experto": "ingeniera", "momento": "habitat", "tipo": "analogo", "url": "https://www.nasa.gov/humans-in-space/chapea/habitat/"},
  {"id": "rojo", "experto": "meteorologa", "momento": "suelo", "tipo": "propiedad", "url": "https://science.nasa.gov/mars/facts/"},
 ] as const;
export type MomentoCuriosidad = (typeof CURIOSIDADES_MARTE)[number]["momento"];

/** El ambiente llama solo al ocurrir el momento real. Se muestra una vez por id de la partida.
 * Retorna null si ya se vio. No aplica acciones ni inventa una hora, una órbita o una tormenta.
 */
export function curiosidadMarte(momento: MomentoCuriosidad, vistos: readonly string[] = []): { id: string; dialogo: Dialogo } | null {
  const dato = CURIOSIDADES_MARTE.find(d => d.momento === momento && !vistos.includes(d.id));
  if (!dato) return null;
  const fuente: SourceCard = {nombreKey:"agentes.curiosidad.fuente",url:dato.url,idFuente:dato.id,consultadoEl:"2026-11-15",dueno:"NASA",estadoDato:"curado"};
  return {id:dato.id,dialogo:{experto:dato.experto,prioridad:"charla",lineas:[{clave:`agentes.curiosidad.${dato.id}`}],fuente}};
}
