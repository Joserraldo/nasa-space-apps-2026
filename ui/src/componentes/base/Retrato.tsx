import { useEffect, useState } from "react";

/**
 * Retratos de diálogo en SVG facetado (DISEÑO §4.4, láminas personajes/02, 04, 06, 09 y 07):
 * la MISMA identidad que el personaje 3D, con las ocho expresiones de las láminas. Solo polígonos y
 * colores de tokens. Una cara nunca reemplaza una cifra: el retrato es decorativo (`aria-hidden`),
 * el nombre y el texto van al lado.
 */

export type Persona = "nino" | "ingeniera" | "doctora" | "meteorologa" | "ia_base";
/** `pensando` es "curious" en el niño y "thinking" en las adultas (las láminas usan las dos palabras). */
export type Expresion = "neutral" | "feliz" | "pensando" | "preocupada" | "habla_cerrada" | "habla_abierta" | "habla_redonda" | "parpadeo";
export const EXPRESIONES: readonly Expresion[] = ["neutral", "feliz", "pensando", "preocupada", "habla_cerrada", "habla_abierta", "habla_redonda", "parpadeo"];
export const PERSONAS: readonly Persona[] = ["nino", "ingeniera", "doctora", "meteorologa", "ia_base"];

const v = (token: string) => `var(--color-${token})`;
const mezcla = (a: string, b: string, pa: number) => `color-mix(in srgb, ${v(a)} ${pa}%, ${v(b)})`;

/** Cabeza y pelo de cada humano. El niño tiene la cabeza más grande respecto al cuerpo (DISEÑO §4.2). */
const HUMANOS = {
  nino: {
    cabeza: "76,60 124,60 136,76 138,112 126,130 104,138 84,134 70,120 66,96 66,74",
    pelo: ["66,86 62,64 76,46 100,38 126,44 142,62 140,84 132,72 118,62 98,60 80,66 72,80", "64,90 70,74 76,92 70,104"],
    acento: "teal", emblema: null, gafas: false, oreja: [66, 104],
  },
  ingeniera: {
    cabeza: "80,58 122,58 134,74 136,108 126,128 106,136 88,132 74,118 70,94 72,72",
    pelo: ["66,124 56,96 60,64 80,44 108,40 132,50 144,70 140,88 128,70 108,60 86,62 76,76 76,104 84,128", "58,126 66,112 82,132 70,140"],
    acento: "naranja", emblema: "llave", gafas: false, oreja: [72, 102],
  },
  doctora: {
    cabeza: "80,58 122,58 134,74 136,108 126,128 106,136 88,132 74,118 70,94 72,72",
    pelo: ["70,100 64,70 80,48 106,42 130,50 142,66 136,80 120,64 98,60 82,68 78,92", "52,118 54,96 70,90 80,104 76,126 62,130"],
    acento: "teal", emblema: "escudo", gafas: true, oreja: [72, 102],
  },
  meteorologa: {
    cabeza: "80,58 122,58 134,74 136,108 126,128 106,136 88,132 74,118 70,94 72,72",
    pelo: ["68,104 62,72 78,48 104,38 130,42 146,58 142,72 120,62 112,74 96,64 84,72 78,96", "112,74 120,62 140,72 130,78"],
    acento: "ciruela-traje", emblema: "sol", gafas: false, oreja: [72, 102],
  },
} as const;

function Boca({ e, x, y, piel }: { e: Expresion; x: number; y: number; piel: string }) {
  const tinta = v("indigo-texto");
  const dentro = v("roca-basalto");
  switch (e) {
    case "feliz":
    case "habla_abierta":
      return <polygon points={`${x - 10},${y - 2} ${x + 10},${y - 2} ${x + 7},${y + 6} ${x},${y + 9} ${x - 7},${y + 6}`} fill={dentro} stroke={tinta} strokeWidth="1.5" strokeLinejoin="round" />;
    case "habla_redonda":
      return <polygon points={`${x - 3},${y - 3} ${x + 3},${y - 3} ${x + 5},${y + 1} ${x + 3},${y + 5} ${x - 3},${y + 5} ${x - 5},${y + 1}`} fill={dentro} stroke={tinta} strokeWidth="1.5" />;
    case "preocupada":
      return <polygon points={`${x - 6},${y + 4} ${x - 3},${y} ${x + 3},${y} ${x + 6},${y + 4} ${x + 3},${y + 3} ${x - 3},${y + 3}`} fill={dentro} stroke={tinta} strokeWidth="1.5" />;
    case "pensando":
      return <polyline points={`${x - 5},${y + 2} ${x + 6},${y}`} fill="none" stroke={tinta} strokeWidth="2.4" strokeLinecap="round" />;
    case "habla_cerrada":
      return <polyline points={`${x - 6},${y} ${x},${y + 3} ${x + 6},${y}`} fill="none" stroke={tinta} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return <polyline points={`${x - 8},${y - 1} ${x - 3},${y + 3} ${x + 3},${y + 3} ${x + 8},${y - 1}`} fill="none" stroke={tinta} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />;
  }
}

function Ojos({ e, cerrar }: { e: Expresion; cerrar: boolean }) {
  const tinta = v("indigo-texto");
  const ojos = [[90, 96], [116, 96]] as const;
  if (e === "parpadeo" || cerrar) {
    return <g>{ojos.map(([x, y]) => <polyline key={x} points={`${x - 5},${y} ${x},${y + 3} ${x + 5},${y}`} fill="none" stroke={tinta} strokeWidth="2.4" strokeLinecap="round" />)}</g>;
  }
  const alto = e === "feliz" ? 5 : 6;
  return <g>{ojos.map(([x, y]) => <polygon key={x} fill={tinta} points={`${x - 2.5},${y - alto} ${x + 2.5},${y - alto} ${x + 3.5},${y - 2} ${x + 3.5},${y + 2} ${x + 2.5},${y + alto - 1} ${x - 2.5},${y + alto - 1} ${x - 3.5},${y + 2} ${x - 3.5},${y - 2}`} />)}</g>;
}

function Cejas({ e, color }: { e: Expresion; color: string }) {
  // Preocupada: suben por dentro. Pensando: una ceja arriba. El resto, rectas y tranquilas.
  const [iz, de] = e === "preocupada"
    ? [["83,85 95,81"], ["111,81 123,85"]]
    : e === "pensando"
      ? [["83,86 95,85"], ["110,81 123,79"]]
      : [["83,84 95,83"], ["111,83 123,84"]];
  return <g stroke={color} strokeWidth="3.4" strokeLinecap="round">{[...iz, ...de].map((p) => <polyline key={p} points={p} fill="none" />)}</g>;
}

function Emblema({ tipo }: { tipo: "llave" | "escudo" | "sol" | null }) {
  if (tipo === "llave") return <polygon fill={v("naranja")} points="122,178 128,172 132,176 138,170 142,174 136,180 140,184 134,190 128,184 124,188 120,184 126,180" />;
  if (tipo === "sol") return (
    <g fill={v("ambar")}>
      <polygon points="130,174 136,174 140,178 140,184 136,188 130,188 126,184 126,178" />
      <polygon points="132,166 134,166 134,171 132,171" /><polygon points="132,191 134,191 134,196 132,196" />
      <polygon points="118,180 123,180 123,182 118,182" /><polygon points="143,180 148,180 148,182 143,182" />
    </g>
  );
  if (tipo === "escudo") return <polygon fill={v("teal")} stroke={v("traje-marfil")} strokeWidth="1.5" points="132,172 140,175 139,184 132,190 125,184 124,175" />;
  return null;
}

function Humano({ persona, e, cerrar }: { persona: Exclude<Persona, "ia_base">; e: Expresion; cerrar: boolean }) {
  const h = HUMANOS[persona];
  const piel = v(`piel-${persona}`);
  const pelo = v(`cabello-${persona}`);
  return (
    <g>
      {/* Mochila, traje y hombros. */}
      <polygon fill={mezcla("ciruela", "marfil", 22)} points="22,152 54,148 58,200 20,200" />
      <polygon fill={v("traje-marfil")} points="40,166 66,150 134,150 160,166 168,200 32,200" />
      {persona === "doctora"
        ? <g fill={v("teal")}><polygon points="44,164 64,152 72,158 54,176" /><polygon points="128,152 156,164 152,176 122,160" /><polygon points="122,160 132,156 112,200 100,200" /></g>
        : <g fill={v(h.acento)}><polygon points="34,170 64,154 70,176 38,190" /><polygon points="136,154 166,170 162,190 130,176" /></g>}
      {persona === "ingeniera" && <g fill={mezcla("ciruela", "marfil", 55)}><polygon points="68,160 74,158 82,200 76,200" /><polygon points="126,158 132,160 124,200 118,200" /></g>}
      {/* Luz del pecho y emblema del rol. */}
      <polygon fill={v("cian")} points="95,166 105,166 110,171 110,179 105,184 95,184 90,179 90,171" />
      <polygon fill={v("lila")} points="98,170 102,170 105,173 105,177 102,180 98,180 95,177 95,173" />
      <Emblema tipo={h.emblema} />
      {/* Cuello. */}
      <polygon fill={piel} points="90,128 112,128 114,146 88,146" />
      {/* Cuello del traje: anillo teal facetado. */}
      <polygon fill={v("teal")} points="52,148 70,138 130,138 148,148 140,160 60,160" />
      <polygon fill={mezcla("teal", "indigo-texto", 70)} points="66,146 76,142 124,142 134,146 128,150 72,150" />
      {/* Pelo de atrás, cabeza, oreja, pelo de adelante. */}
      {h.pelo[1] && <polygon fill={pelo} points={h.pelo[1]} />}
      <polygon fill={piel} points={h.cabeza} />
      <polygon fill={piel} stroke={mezcla("roca-basalto", "marfil", 25)} strokeWidth="1" points={`${h.oreja[0] - 8},${h.oreja[1] - 8} ${h.oreja[0]},${h.oreja[1] - 10} ${h.oreja[0] + 2},${h.oreja[1] + 6} ${h.oreja[0] - 6},${h.oreja[1] + 8}`} />
      <polygon fill={pelo} points={h.pelo[0]} />
      {/* Facetas de luz: la luz viene de arriba a la izquierda (DISEÑO §3.3). */}
      <polygon fill={v("marfil")} opacity="0.14" points={h.cabeza.split(" ").slice(0, 4).join(" ") + " 100,98"} />
      <Cejas e={e} color={pelo === v("cabello-meteorologa") ? mezcla("cabello-meteorologa", "indigo-texto", 50) : pelo} />
      <Ojos e={e} cerrar={cerrar} />
      {h.gafas && (
        <g fill="none" stroke={v("traje-marfil")} strokeWidth="3.4" strokeLinejoin="round">
          <polygon points="82,88 98,88 102,93 102,100 98,105 82,105 78,100 78,93" />
          <polygon points="108,88 124,88 128,93 128,100 124,105 108,105 104,100 104,93" />
          <polyline points="102,95 104,95" /><polyline points="78,94 72,92" />
        </g>
      )}
      <Boca e={e} x={104} y={116} piel={piel} />
      {/* Antena del casco y casco: vidrio lila transparente, nunca opaco (DISEÑO §3.2). */}
      <g transform="translate(14,4)">
        <polygon fill={v("traje-marfil")} points="40,64 46,64 46,96 40,96" />
        <polygon fill={v("traje-marfil")} stroke={mezcla("ciruela", "marfil", 30)} strokeWidth="1" points="36,90 50,90 50,108 36,108" />
        <polygon fill={v("traje-marfil")} stroke={mezcla("ciruela", "marfil", 30)} strokeWidth="1" points="38,46 48,46 52,52 52,58 48,64 38,64 34,58 34,52" />
      </g>
      <polygon fill={v("lila")} fillOpacity="0.16" stroke={mezcla("ciruela", "lila", 22)} strokeOpacity="0.85" strokeWidth="7"
        points="100,10 138,20 162,46 170,84 162,122 140,146 100,154 60,146 38,122 30,84 38,46 62,20" />
      <polygon fill={v("marfil")} opacity="0.45" points="62,24 90,16 70,38 50,56" />
    </g>
  );
}

function Iris({ e, cerrar, danada }: { e: Expresion; cerrar: boolean; danada: boolean }) {
  const ojo = danada ? v("error") : v("cian");
  const pantalla = v("indigo-texto");
  const ojos = [[82, 104], [118, 104]] as const;
  const cerrado = e === "parpadeo" || cerrar;
  return (
    <g>
      {/* Panel solar, antena, cuerpo con chaflanes, pantalla y ruedas (personajes/07, mundo/01). */}
      <polygon fill={v("indigo-botas")} points="40,34 160,34 168,48 32,48" />
      <g stroke={v("traje-marfil")} strokeWidth="1.5">{[60, 80, 100, 120, 140].map((x) => <polyline key={x} points={`${x},34 ${x + 2},48`} />)}</g>
      <polygon fill={v("traje-marfil")} points="146,14 150,14 150,34 146,34" />
      <polygon fill={v("traje-marfil")} points="144,6 152,6 155,10 152,14 144,14 141,10" />
      <polygon fill={v("traje-marfil")} stroke={mezcla("ciruela", "marfil", 30)} strokeWidth="2" points="40,56 160,56 172,68 172,150 160,162 40,162 28,150 28,68" />
      <polygon fill={pantalla} points="48,74 152,74 160,82 160,128 152,136 48,136 40,128 40,82" />
      {danada && <g stroke={v("error")} strokeOpacity="0.45" strokeWidth="2">{[86, 98, 116, 124].map((y) => <polyline key={y} points={`46,${y} 156,${y}`} />)}</g>}
      {ojos.map(([x, y], i) => {
        if (cerrado) return <polyline key={x} points={`${x - 9},${y} ${x + 9},${y}`} stroke={ojo} strokeWidth="4" strokeLinecap="round" />;
        if (danada && i === 1) return <g key={x} stroke={ojo} strokeWidth="4" strokeLinecap="round"><polyline points={`${x - 7},${y - 7} ${x + 7},${y + 7}`} /><polyline points={`${x + 7},${y - 7} ${x - 7},${y + 7}`} /></g>;
        if (e === "feliz" || e === "habla_abierta") return <polyline key={x} points={`${x - 9},${y + 3} ${x},${y - 6} ${x + 9},${y + 3}`} fill="none" stroke={ojo} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />;
        const inclina = e === "preocupada" ? (i === 0 ? -4 : 4) : 0;
        return <polygon key={x} fill={ojo} points={`${x - 7},${y - 9 + inclina} ${x + 7},${y - 9 - inclina} ${x + 9},${y + 7} ${x - 9},${y + 7}`} />;
      })}
      {e.startsWith("habla") && <polygon fill={ojo} points={e === "habla_redonda" ? "96,122 104,122 106,127 104,131 96,131 94,127" : e === "habla_abierta" ? "88,121 112,121 108,130 92,130" : "90,124 110,124 110,127 90,127"} />}
      <g fill={pantalla}>{[44, 156].map((x) => <polygon key={x} points={`${x - 16},150 ${x + 16},150 ${x + 20},162 ${x + 16},186 ${x - 16},186 ${x - 20},162`} />)}</g>
      <g fill={v("traje-marfil")}>{[44, 156].map((x) => <polygon key={x} points={`${x - 5},162 ${x + 5},162 ${x + 7},168 ${x + 5},174 ${x - 5},174 ${x - 7},168`} />)}</g>
    </g>
  );
}

/** Intervalos de parpadeo fijos (100 ms cada 4 a 7 s, APLICACION §7): sin azar. */
const PAUSAS = [4600, 6200, 5100, 6800, 4300];

/** Parpadeo automático: lo apaga el movimiento reducido y cuando la expresión ya es `parpadeo`. */
function useParpadeo(activo: boolean): boolean {
  const [cerrado, setCerrado] = useState(false);
  useEffect(() => {
    if (!activo || typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let id: number;
    const ciclo = () => {
      id = window.setTimeout(() => {
        setCerrado(true);
        id = window.setTimeout(() => { setCerrado(false); i = (i + 1) % PAUSAS.length; ciclo(); }, 100);
      }, PAUSAS[i]);
    };
    ciclo();
    return () => window.clearTimeout(id);
  }, [activo]);
  return cerrado;
}

export function Retrato({ persona, expresion = "neutral", danada = false, tam = 96, parpadear = false, className }: {
  persona: Persona;
  expresion?: Expresion;
  /** Solo Iris: ojos con falla y pantalla con interferencia (está dañada por la radiación). */
  danada?: boolean;
  tam?: number;
  parpadear?: boolean;
  className?: string | undefined;
}) {
  const cerrado = useParpadeo(parpadear && expresion !== "parpadeo");
  return (
    <svg className={className} width={tam} height={tam} viewBox="0 0 200 200" aria-hidden="true" focusable="false" data-persona={persona} data-expresion={expresion}>
      {persona === "ia_base" ? <Iris e={expresion} cerrar={cerrado} danada={danada} /> : <Humano persona={persona} e={expresion} cerrar={cerrado} />}
    </svg>
  );
}
