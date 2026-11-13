/** Tormenta (registro de datos) → SpaceWeatherEvent (contrato). Función pura. */
import { SpaceWeatherEventSchema, type SpaceWeatherEvent } from "./contrato";
import { intensidadFase, redondear } from "./intensidad";
import type { Fase, Tormenta } from "./tormenta";

const ms = (hora: string) => Date.parse(hora);
const horasEntre = (a: string, b: string) => redondear((ms(b) - ms(a)) / 3_600_000);

export function magnitud(f: Fase): string | undefined {
  if (f.claseGoes) return f.claseGoes;
  if (f.velocidadKmS) return `${f.velocidadKmS} km/s`;
  if (f.kpMax !== undefined) return `Kp ${f.kpMax}`;
  return undefined;
}

/**
 * Tipo principal = la CME si hay (es lo que viaja hasta la base); si no, la fase más intensa.
 */
function fasePrincipal(t: Tormenta): Fase {
  const cme = t.fases.find((f) => f.tipo === "CME");
  if (cme) return cme;
  return [...t.fases].sort((a, b) => (intensidadFase(b) ?? -1) - (intensidadFase(a) ?? -1))[0];
}

export function aConvenio(t: Tormenta): SpaceWeatherEvent {
  const inicio = t.fases[0].hora;
  const fin = [t.fases[t.fases.length - 1].hora, t.llegadaMarte?.hora ?? ""].sort().pop()!;
  const principal = fasePrincipal(t);
  const valores = t.fases.map(intensidadFase).filter((x): x is number => x !== null);
  const ev: SpaceWeatherEvent = {
    id: t.id,
    tipo: principal.tipo,
    inicio,
    duracionHoras: horasEntre(inicio, fin),
    intensidad: redondear(valores.length ? Math.max(...valores) : 0),
    magnitudTexto: t.fases.map(magnitud).filter(Boolean).join(" · ") || undefined,
    fuente: {
      nombreKey: t.fuente.nombreKey,
      url: principal.url,
      idFuente: principal.idFuente,
      consultadoEl: t.fuente.consultadoEl,
      dueno: t.fuente.dueno,
      estadoDato: t.estadoDato,
    },
    fases: t.fases.map((f) => ({
      tipo: f.tipo,
      idFuente: f.idFuente,
      offsetHoras: horasEntre(inicio, f.hora),
      magnitudTexto: magnitud(f),
      observadoEn: f.observadoEn,
    })),
    marcoMarte: t.marcoMarte,
    llegadaMarte: t.llegadaMarte && {
      idFuente: t.llegadaMarte.idFuente,
      offsetHoras: horasEntre(inicio, t.llegadaMarte.hora),
      rozando: t.llegadaMarte.rozando,
    },
    medicionMarte: t.medicionMarte && {
      unidad: t.medicionMarte.unidad,
      fondo: t.medicionMarte.fondo,
      pico: t.medicionMarte.pico,
      factor: t.medicionMarte.factor,
      offsetHorasPico: Math.max(0, horasEntre(inicio, `${t.medicionMarte.diaPico}T12:00Z`)),
    },
  };
  return SpaceWeatherEventSchema.parse(ev);
}
