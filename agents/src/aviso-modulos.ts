import type { GameState } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";

/**
 * Aviso de tormenta antes de elegir módulos (paso 4): si la partida trae una tormenta curada en el
 * estado, la Meteoróloga avisa primero, la Doctora dice cómo se mide la radiación y la Ingeniera
 * explica qué gasta el escudo. Tres diálogos en ese orden; sin tormenta no hay aviso.
 */
export function avisosAntesDeModulos(estado: Pick<GameState, "tormenta">): Dialogo[] {
  const t = estado.tormenta;
  if (!t) return [];
  return [
    {
      experto: "meteorologa",
      prioridad: "alerta",
      fuente: t.fuente,
      lineas: [
        { clave: "agentes.aviso.meteorologa.sensor" },
        // Igual que la rama de pronóstico de `expertos.ts`: nombre curado + fecha real del evento.
        { clave: "agentes.meteorologa.pronostico.viene", vars: { nombreKey: `datos.tormenta.${t.id}.nombre`, fecha: t.inicio.slice(0, 10) } },
        { clave: "agentes.aviso.meteorologa.nube" },
      ],
    },
    { experto: "doctora", prioridad: "consejo", lineas: [{ clave: "agentes.aviso.doctora.contar" }] },
    { experto: "ingeniera", prioridad: "consejo", lineas: [{ clave: "agentes.aviso.ingeniera.escudo" }] },
  ];
}
