import "./globo.css";

/**
 * Globo de una línea corta sobre quien habla (PLAN-JUGABILIDAD §1, tarea F4; lámina personajes/07,
 * panel 02: caja marfil facetada con un piquito hacia el personaje). El texto llega ya traducido
 * (`GloboEscena.texto`); quién lo ancla en el mundo es la escena (A2) y quién decide la línea, la
 * tripulación (B1). Las conversaciones largas van en la franja de diálogo (E5), no aquí.
 *
 * Anclaje: con `punta="abajo"` (por defecto) el globo se corre solo hacia arriba y al centro, así que
 * quien lo ubica pone `left`/`top` (o un `translate` en un contenedor) en la cabeza del actor y la punta
 * queda ahí. Con `punta="arriba"` cuelga debajo del punto (para un retrato, como en la lámina).
 */
export function Globo({ texto, quien, punta = "abajo", tono = "normal", className }: {
  texto: string;
  /** Nombre de quien habla, ya traducido. Solo para el lector: en el mundo el actor se ve. */
  quien?: string | undefined;
  punta?: "abajo" | "arriba";
  /** `aviso`: borde ámbar, para una alerta corta (sin miedo: el detalle va en texto). */
  tono?: "normal" | "aviso";
  className?: string | undefined;
}) {
  return (
    <div className={`globo${className ? ` ${className}` : ""}`} data-punta={punta} data-tono={tono} role="status">
      <p className="globo-cara">
        {quien && <span className="oculto-visual">{quien}: </span>}
        {texto}
      </p>
    </div>
  );
}
