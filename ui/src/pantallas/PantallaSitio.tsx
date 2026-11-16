import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { GameState } from "@solar-shield/contracts";
import { terrenoJezero, terrenoLunaPoloSur, terrenoLunaVisible, terrenoMarteNorte } from "@solar-shield/data";
import { ordenarSitios, type PuntajeSitio } from "@solar-shield/engine";
import { misionActiva } from "../juego/misiones.js";
import urlDem from "../../../data/terreno/jezero/elevacion.bin?url";
import { useT } from "../i18n.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { CostRow } from "../componentes/base/Piezas.js";
import { FuenteTerreno } from "../componentes/TarjetaFuente.js";
import "../componentes/base/facetas.css";
import "./sitio.css";

/**
 * E4, paso 3 (ESCENAS §2.5 y §2.7). No hay lámina v8: familia de tarjetas de `ui/03` y un mapa
 * de Jezero facetado a partir del DEM real (Mars Trek). Puntajes: motor (`ordenarSitios`) y datos;
 * costo de aterrizaje: misión. Reemplaza a `ElegirSitio.tsx` (FLUJO §2.3).
 */

const CRITERIOS = ["plano", "luz", "blindaje"] as const;
const terreno = terrenoJezero;

/** EXPERIMENTAL: sitio que pinta la tarjeta. Sin `puntajes` (la nave de Outpost) no se muestran criterios. */
interface SitioTarjeta { id: string; nombreKey: string; descripcionKey: string; puntajes?: { plano: number; luz: number; blindaje: number } }

const TERRENOS: Record<string, { sitios: readonly SitioTarjeta[]; fuente: typeof terrenoJezero.fuente; nombreKey: string }> = {
  "jezero": terrenoJezero,
  "marte-norte": terrenoMarteNorte as never,
  "luna-visible": terrenoLunaVisible as never,
  "luna-polo-sur": terrenoLunaPoloSur as never,
};

/** Sitios de la misión activa: los del terreno de datos si existen; si no, las zonas de la misión. */
function sitiosDeMision(): { sitios: SitioTarjeta[]; terreno: (typeof TERRENOS)[string] | null } {
  const m = misionActiva();
  const ter = m.terrenoId ? TERRENOS[m.terrenoId] ?? null : null;
  const sitios = m.sitiosCandidatos.map((c) => ter?.sitios.find((x) => x.id === c.id) ?? { id: c.id, nombreKey: c.porQueKey, descripcionKey: c.porQueKey });
  return { sitios, terreno: ter };
}

/** Posición de un sitio en el mapa, en fracción 0-1 del lienzo (oeste→este, norte→sur). */
function enMapa(lon: number, lat: number) {
  const b = terreno.bbox;
  return { x: (lon - b.oeste) / (b.este - b.oeste), y: (b.norte - lat) / (b.norte - b.sur) };
}

export function PantallaSitio({ estado, onElegir }: { estado: GameState; onElegir: (s: PuntajeSitio) => void }) {
  const { t } = useT();
  const deMision = useMemo(sitiosDeMision, []);
  const esJezero = misionActiva().terrenoId === "jezero";
  const sitios = useMemo(() => {
    const con = deMision.sitios.filter((x) => x.puntajes) as Parameters<typeof ordenarSitios>[0];
    const sin = deMision.sitios.filter((x) => !x.puntajes).map((x) => ({ id: x.id, nombreKey: x.nombreKey, porCriterio: { plano: 0, luz: 0, blindaje: 0 }, total: 0, rangoKey: "" }));
    return [...ordenarSitios(con, estado.objetivo), ...sin];
  }, [estado.objetivo, deMision]);
  const porId = useMemo(() => new Map(terreno.sitios.map((s) => [s.id, s])), []);
  const [elegido, setElegido] = useState(sitios[0]?.id ?? "");
  const lista = useRef<HTMLUListElement>(null);
  const foco = porId.get(elegido);
  const p = foco ? enMapa(foco.lon, foco.lat) : { x: 0.5, y: 0.5 };

  /** Desde el mapa: marca el sitio y trae su tarjeta a la vista (en el carrusel, al centro). */
  function verTarjeta(id: string) {
    setElegido(id);
    const ul = lista.current;
    const li = ul?.querySelector<HTMLElement>(`[data-sitio="${id}"]`);
    // Solo el carrusel se mueve, y solo en horizontal: scrollIntoView arrastraría también el documento.
    if (ul && li && ul.scrollWidth > ul.clientWidth + 1) {
      ul.scrollTo({ left: li.offsetLeft + li.offsetWidth / 2 - ul.clientWidth / 2, behavior: "auto" });
    }
  }

  /** En el carrusel (celular horizontal), la tarjeta que queda al centro es la elegida y el mapa la sigue. */
  function alDeslizar() {
    const ul = lista.current;
    if (!ul || ul.scrollWidth <= ul.clientWidth + 1) return;
    const centro = ul.scrollLeft + ul.clientWidth / 2;
    let mejor = elegido;
    let dist = Infinity;
    for (const li of ul.querySelectorAll<HTMLElement>("[data-sitio]")) {
      const d = Math.abs(li.offsetLeft + li.offsetWidth / 2 - centro);
      if (d < dist) { dist = d; mejor = li.dataset.sitio!; }
    }
    if (mejor !== elegido) setElegido(mejor);
  }

  return (
    <section className="sitio" aria-labelledby="sitio-titulo">
      <div className="fc sitio-cabeza">
        <div className="fc-cara sitio-cabeza-cara">
          <h2 id="sitio-titulo">{t("ui.paso.3.titulo")}</h2>
          <p>{t("ui.paso.3.texto")}</p>
        </div>
      </div>

      {esJezero && <div className="sitio-mapa">
        <div className="sitio-lienzo" style={{ "--foco-x": p.x, "--foco-y": p.y } as CSSProperties}>
          <MapaJezero etiqueta={t(terreno.nombreKey)} />
          {sitios.map((s, i) => {
            const c = porId.get(s.id)!;
            const m = enMapa(c.lon, c.lat);
            const sel = s.id === elegido;
            return (
              <button key={s.id} type="button" className={`sitio-pin${sel ? " sitio-pin-sel" : ""}`}
                style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                aria-pressed={sel} aria-label={t(s.nombreKey)} onClick={() => verTarjeta(s.id)}>
                <span className="sitio-pin-cara" aria-hidden="true">{i + 1}</span>
                {sel && <span className="sitio-pin-nombre" aria-hidden="true">{t(s.nombreKey)}</span>}
              </button>
            );
          })}
        </div>
        <p className="sitio-credito">{t(terreno.fuente.nombreKey)} · {t("datos.etiqueta.curado")}</p>
      </div>}

      <ul className="sitio-lista" ref={lista} onScroll={alDeslizar}>
        {sitios.map((s, i) => (
          <TarjetaSitio key={s.id} n={i + 1} s={s} crudo={deMision.sitios.find((x) => x.id === s.id)!} sel={s.id === elegido} onVer={() => setElegido(s.id)} onElegir={() => onElegir(s)} />
        ))}
        {deMision.terreno && <li className="sitio-fuente"><FuenteTerreno fuente={deMision.terreno.fuente} /></li>}
      </ul>
    </section>
  );
}

/** Una tarjeta de sitio: criterios del dato, puntaje del motor y costo de aterrizaje de la misión. */
function TarjetaSitio({ n, s, crudo, sel, onVer, onElegir }: { n: number; s: PuntajeSitio; crudo: SitioTarjeta; sel: boolean; onVer: () => void; onElegir: () => void }) {
  const { t } = useT();
  const costo = misionActiva().sitiosCandidatos.find((c) => c.id === s.id)?.aterrizaje;
  const idTitulo = `sitio-${s.id}`;
  return (
    <li className={`fc sitio-item${sel ? " sitio-item-sel" : ""}`} data-sitio={s.id} onClick={onVer} onFocus={onVer}>
      <article className="fc-cara sitio-tarjeta" aria-labelledby={idTitulo}>
        <header className="sitio-tarjeta-cab">
          <span className="sitio-num" aria-hidden="true">{n}</span>
          <h3 id={idTitulo}>{t(s.nombreKey)}</h3>
        </header>
        {crudo.descripcionKey !== s.nombreKey && <p className="sitio-desc">{t(crudo.descripcionKey)}</p>}
        {crudo.puntajes && <><ul className="sitio-criterios">
          {CRITERIOS.map((c) => {
            const v = Math.round(crudo.puntajes![c] * 100);
            return (
              <li key={c}>
                <span>{t(`ui.paso.3.criterio.${c}`)}</span>
                <span className="sitio-pista" aria-hidden="true"><span style={{ inlineSize: `${v}%` }} /></span>
                <span className="sitio-valor">{v}</span>
              </li>
            );
          })}
        </ul>
        <p className="sitio-total">
          <span>{t("ui.paso.3.total")}</span>
          <strong>{Math.round(s.total * 100)}</strong>
          <span className="sitio-rango">{t(s.rangoKey)}</span>
        </p></>}
        {costo && <CostRow inmediato={costo.inmediato} retrasado={costo.retrasado} />}
        <FacetButton variant="primary" labelKey="ui.paso.3.elegir" icon="jugar" className="sitio-aterrizar" onClick={onElegir} />
      </article>
    </li>
  );
}

/* ---------- Mapa facetado desde el DEM real ---------- */

const PASO = 10; // px del DEM por faceta: 28 x 28 celdas, 2 triángulos cada una
const EXAGERAR = 4; // el cráter es bajito frente a sus 80 km: se exagera la altura para que se lea la luz
const TONOS = 5; // t-0 (más oscuro) a t-4 (más claro), ver sitio.css

interface Faceta { puntos: string; tono: number }

/** Cuantil q (0-1) de una lista ya ordenada. */
const cuantil = (orden: number[], q: number) => orden[Math.floor(q * (orden.length - 1))]!;

/**
 * Convierte el DEM (Int16 LE, metros) en triángulos planos con 5 tonos de los tokens de entorno.
 * La altura real da la banda (fondo del cráter, delta, borde, meseta) y la luz desde arriba a la
 * izquierda (DISEÑO §3.3) la aclara u oscurece un tono. Cada vértice es el promedio de su celda
 * para que el ruido del DEM no se vea como manchas. Pura: no toca el DOM.
 */
function facetasDelDem(h: Int16Array, ancho: number, alto: number): Faceta[] {
  const mpp = terreno.dem.metrosPorPixel;
  const r = PASO / 2;
  const cache = new Map<number, number>();
  const media = (cx: number, cy: number) => {
    const k = cy * (ancho + 1) + cx;
    const ya = cache.get(k);
    if (ya !== undefined) return ya;
    let s = 0, n = 0;
    for (let y = Math.max(0, cy - r); y < Math.min(alto, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x < Math.min(ancho, cx + r); x++) { s += h[y * ancho + x]!; n++; }
    }
    const m = n ? s / n : 0;
    cache.set(k, m);
    return m;
  };
  const luz = (() => { const v = [-1, -1, 1.2]; const n = Math.hypot(...v); return v.map((c) => c / n); })();
  const crudas: { puntos: string; altura: number; lambert: number }[] = [];
  const tri = (a: number[], b: number[], c: number[]) => {
    const u = [b[0]! - a[0]!, b[1]! - a[1]!, ((b[2]! - a[2]!) / mpp) * EXAGERAR];
    const v = [c[0]! - a[0]!, c[1]! - a[1]!, ((c[2]! - a[2]!) / mpp) * EXAGERAR];
    let n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    if (n[2]! < 0) n = n.map((k) => -k);
    const l = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    crudas.push({
      puntos: `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`,
      altura: (a[2]! + b[2]! + c[2]!) / 3,
      lambert: (n[0]! * luz[0]! + n[1]! * luz[1]! + n[2]! * luz[2]!) / l,
    });
  };
  const p = (x: number, y: number) => [x, y, media(x, y)];
  for (let y = 0; y < alto; y += PASO) {
    for (let x = 0; x < ancho; x += PASO) {
      const x2 = Math.min(x + PASO, ancho), y2 = Math.min(y + PASO, alto);
      const p00 = p(x, y), p10 = p(x2, y), p01 = p(x, y2), p11 = p(x2, y2);
      // La diagonal alterna para que la malla no se vea en rayas.
      if (((x + y) / PASO) % 2 === 0) { tri(p00, p10, p11); tri(p00, p11, p01); }
      else { tri(p00, p10, p01); tri(p10, p11, p01); }
    }
  }
  // Cortes por cuantiles: el reparto no depende de la exageración ni del rango de alturas.
  const alturas = crudas.map((c) => c.altura).sort((a, b) => a - b);
  const luces = crudas.map((c) => c.lambert).sort((a, b) => a - b);
  // La luz da el tono (regolito domina, DISEÑO §2.3); el fondo del cráter baja un tono para que se lea.
  const cortesLuz = [0.1, 0.24, 0.45, 0.9].map((q) => cuantil(luces, q));
  const fondo = cuantil(alturas, 0.35);
  return crudas.map((c) => {
    let tono = cortesLuz.filter((k) => c.lambert > k).length; // 0 a 4
    if (c.altura < fondo && tono >= 3) tono -= 1;
    return { puntos: c.puntos, tono: Math.min(TONOS - 1, tono) };
  });
}

function MapaJezero({ etiqueta }: { etiqueta: string }) {
  const { ancho, alto } = terreno.dem;
  const [facetas, setFacetas] = useState<Faceta[] | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch(urlDem)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => { if (vivo) setFacetas(facetasDelDem(new Int16Array(b), ancho, alto)); })
      .catch(() => { /* sin DEM queda el fondo liso; los sitios y las tarjetas siguen funcionando */ });
    return () => { vivo = false; };
  }, [ancho, alto]);
  return (
    <svg className="sitio-svg" viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" role="img" aria-label={etiqueta} focusable="false">
      <rect className="t-2" width={ancho} height={alto} />
      {facetas?.map((f, i) => <polygon key={i} className={`t-${f.tono}`} points={f.puntos} />)}
    </svg>
  );
}
