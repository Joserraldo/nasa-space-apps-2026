/**
 * El juego completo (ruta /play). Solo pinta y escucha: las reglas están en flujo.ts y en el motor.
 * Usa los componentes de la vista sin editarlos.
 */
import "./juego.css";
import { crearMezclador } from "../audio/mezclador";
import { conectarVoz } from "../audio/voz";
import { SequencePlayer } from "../camera/player";
import { startLoop } from "../core/loop";
import { isChapterId, type ChapterId } from "../ui/content/chapters";
import { createCrewDialogue, createHudReply } from "../ui/organisms/crew-dialogue";
import { createGameHud } from "../ui/organisms/game-hud";
import { createMainMenu } from "../ui/organisms/main-menu";
import { createPauseMenu } from "../ui/organisms/pause-menu";
import { createSettingsMenu } from "../ui/organisms/settings-menu";
import { loadSettings, resetProgress, saveSettings, SETTINGS_KEY, type SettingsState } from "../ui/state/settings";
import { estadoDialogo, estadoHud, estadoPausa, estadoTarjeta } from "./adaptador";
import { crearEscenario3d } from "./escenario3d";
import {
  continuar, decidirEnIntro, empezarCapitulo, escenaActual, nuevoJuego, responder, vistaDe, type Juego, type Plan,
} from "./flujo";
import { borrar, cargar, guardar } from "./guardado";
import { hablante, type HablanteId } from "./hablantes";
import { idiomaDe, textosDeComponentes, traducir } from "./i18n";
import { cargarIntro, momento, type EscenarioId } from "./intro";
import { SALAS } from "./salas";

function almacenSeguro(): Storage {
  try { localStorage.getItem(SETTINGS_KEY); return localStorage; } catch {
    const datos = new Map<string, string>();
    return { getItem: (k: string) => datos.get(k) ?? null, setItem: (k: string, v: string) => void datos.set(k, v),
      removeItem: (k: string) => void datos.delete(k), key: (i: number) => [...datos.keys()][i] ?? null,
      get length() { return datos.size; }, clear: () => datos.clear() };
  }
}

function crear<K extends keyof HTMLElementTagNameMap>(tag: K, clase: string, texto?: string): HTMLElementTagNameMap[K] {
  const nodo = document.createElement(tag);
  nodo.className = clase;
  if (texto !== undefined) {
    nodo.textContent = texto;
    nodo.dataset.voiceLine = texto;
  }
  return nodo;
}

export function mountJuego(): void {
  const almacen = almacenSeguro();
  let ajustes: SettingsState = loadSettings(almacen);
  const t = (clave: string) => traducir(idiomaDe(ajustes), clave);
  /** Textos fijos de los componentes de la vista, en el idioma elegido. */
  const textos = () => textosDeComponentes(idiomaDe(ajustes));

  const raiz = crear("div", "juego");
  const lienzo = crear("div", "juego__3d");
  const velo = crear("div", "juego__velo");
  const capa = crear("div", "juego__capa");
  raiz.append(lienzo, velo, capa);
  document.getElementById("app")!.replaceChildren(raiz);

  const mezclador = crearMezclador(ajustes);
  conectarVoz(raiz, mezclador.voz);
  const desbloquear = () => mezclador.desbloquear();
  raiz.addEventListener("pointerdown", desbloquear, { capture: true });
  raiz.addEventListener("keydown", desbloquear, { capture: true });
  document.addEventListener("visibilitychange", () => mezclador.ocultar(document.hidden));

  const intro = cargarIntro();
  const escenario = crearEscenario3d(lienzo);
  let juego: Juego | null = null;
  /** Detiene lo que esté corriendo en la pantalla actual. */
  let salir = () => {};

  function aplicarAjustes(): void {
    document.documentElement.classList.toggle("ui-big-text", ajustes.bigText);
    document.documentElement.lang = ajustes.language;
    document.title = t("juego.titulo");
    mezclador.ajustar(ajustes);
  }

  /** Ajustes de la vista. `alCerrar` recibe si cambió el idioma, porque la pantalla debe repintarse. */
  function crearAjustes(alCerrar: (cambioIdioma: boolean) => void) {
    let idiomaAntes = ajustes.language;
    const menu = createSettingsMenu(ajustes, {
      onChange: (nuevos) => {
        ajustes = nuevos;
        saveSettings(almacen, nuevos);
        aplicarAjustes();
      },
      onPreview: () => mezclador.voz.decir(t("juego.voz.prueba")),
      onResetProgress: () => { resetProgress(almacen); juego = null; },
      onBack: () => {
        const cambio = ajustes.language !== idiomaAntes;
        idiomaAntes = ajustes.language;
        alCerrar(cambio);
      },
    }, textos());
    return menu;
  }

  function limpiar(): void {
    salir();
    salir = () => {};
    mezclador.voz.callar();
    velo.className = "juego__velo";
    capa.replaceChildren();
  }

  function boton(texto: string, icono: "play" | "next" | "back" | "home" | "shield" | "gear", alTocar: () => void): HTMLButtonElement {
    const b = createHudReply({ label: texto, glyph: icono, voiceLine: texto });
    b.classList.add("juego__boton");
    b.addEventListener("click", () => { mezclador.efecto("boton"); alTocar(); });
    return b;
  }

  async function preparar(ids: readonly EscenarioId[]): Promise<void> {
    for (const id of ids) {
      // Un respiro para que la pantalla de carga se pinte antes del trabajo pesado.
      await new Promise((listo) => setTimeout(listo, 30));
      await escenario.preparar(id);
    }
  }

  function aviso(texto: string): void {
    limpiar();
    const panel = crear("div", "juego__panel");
    panel.setAttribute("role", "status");
    panel.append(crear("p", "juego__texto", texto));
    capa.append(panel);
  }

  async function conCarga(ids: readonly EscenarioId[], despues: () => void): Promise<void> {
    aviso(t("juego.cargando"));
    try {
      await preparar(ids);
      despues();
    } catch (error) {
      console.error(error);
      aviso(t("juego.error"));
    }
  }

  function inicio(): void {
    limpiar();
    mezclador.musica("calma");
    escenario.mostrar("space", "AMB-01");
    escenario.vista("space");
    const guardada = cargar(almacen);
    // Si se borra el avance o cambia el idioma, la portada se vuelve a pintar.
    const ajustesMenu = crearAjustes((cambioIdioma) => {
      if (cambioIdioma || Boolean(cargar(almacen)) !== Boolean(guardada)) inicio();
    });
    const portada = createMainMenu(guardada ? capituloDe(guardada) : undefined, {
      onContinue: () => { mezclador.efecto("boton"); juego = guardada; mostrar(); },
      onNewGame: () => {
        mezclador.efecto("boton");
        borrar(almacen);
        juego = nuevoJuego(ajustes);
        void conCarga([...new Set(intro.tomas.map((x) => x.escenario))], verIntro);
      },
      onSettings: () => { mezclador.efecto("boton"); ajustesMenu.open(); },
    }, textos());
    capa.append(portada.dialog, ajustesMenu.dialog);
    portada.dialog.showModal();
  }

  function capituloDe(partida: Juego): ChapterId {
    const id = `C${vistaDe(partida).capitulo}`;
    return isChapterId(id) ? id : "C1";
  }

  function subtitulo(quien: HablanteId | null, clave: string): HTMLElement {
    const caja = crear("div", "juego__subtitulo");
    if (quien) {
      const persona = hablante(quien, idiomaDe(ajustes));
      caja.dataset.hablante = quien;
      const retrato = crear("img", "juego__retrato");
      retrato.src = persona.portrait;
      retrato.alt = `${persona.name}, ${persona.role}`;
      caja.append(retrato);
    }
    const linea = crear("p", "juego__linea", t(clave));
    linea.dataset.leer = "";
    linea.setAttribute("aria-live", "polite");
    caja.append(linea);
    return caja;
  }

  function verIntro(): void {
    limpiar();
    const player = new SequencePlayer(intro.secuencia);
    player.paused = false;
    const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lugar = crear("div", "juego__abajo");
    const fuente = crear("p", "juego__fuente");
    fuente.hidden = true;
    const saltar = boton(t("intro.saltar"), "next", () => { player.seek(intro.decisionEn); });
    saltar.classList.add("juego__saltar");
    capa.append(fuente, saltar, lugar);
    let toma = "";
    let linea = "";
    let preguntado = false;
    mezclador.abrirIntro();
    salir = startLoop(raiz, (dt) => {
      const cuadro = player.update(dt, sinMovimiento);
      const ahora = momento(intro, player.elapsed);
      escenario.mostrar(ahora.toma.escenario, ahora.toma.plano.environment);
      escenario.encuadrar(cuadro);
      velo.style.opacity = String(cuadro.opacity);
      if (ahora.toma.id !== toma) {
        toma = ahora.toma.id;
        mezclador.musica(ahora.toma.musica);
        mezclador.efecto(ahora.toma.efecto);
        velo.className = ahora.toma.efecto === "alerta" ? "juego__velo juego__velo--alerta" : "juego__velo";
        fuente.hidden = !ahora.toma.fuente;
        if (ahora.toma.fuente) fuente.textContent = `${t(ahora.toma.fuente.aviso)} ${t(ahora.toma.fuente.clave)}`;
        fuente.dataset.voiceLine = fuente.textContent ?? "";
        lugar.replaceChildren();
        linea = "";
      }
      if (ahora.linea && ahora.linea.linea !== linea && !preguntado) {
        linea = ahora.linea.linea;
        lugar.replaceChildren(subtitulo(ahora.linea.hablante, linea));
      }
      if (ahora.decidiendo && ahora.linea && !preguntado) {
        preguntado = true;
        saltar.hidden = true;
        const opciones = crear("div", "juego__opciones");
        for (const r of ahora.toma.decision!) {
          const b = createHudReply({ label: t(r.texto), glyph: r.icono, voiceLine: t(r.texto) });
          b.classList.add("juego__boton");
          b.addEventListener("click", () => elegir(r.id as Plan));
          opciones.append(b);
        }
        lugar.append(opciones);
      }
    });

    function elegir(plan: Plan): void {
      mezclador.efecto("confirmar");
      juego = decidirEnIntro(juego!, plan);
      guardar(almacen, juego);
      const lineas = [...intro.despues[plan], ...intro.despues.cierre];
      const ver = (i: number) => {
        const l = lineas[i];
        if (!l) { mostrar(); return; }
        lugar.replaceChildren(subtitulo(l.hablante, l.linea), boton(t("juego.accion.seguir"), "next", () => ver(i + 1)));
      };
      ver(0);
    }
  }

  function tarjeta(): void {
    const actual = juego!;
    const datos = estadoTarjeta(vistaDe(actual), idiomaDe(ajustes));
    const sala = SALAS[vistaDe(actual).sala];
    escenario.mostrar(sala.escenario, sala.ambiente);
    escenario.vista(sala.escenario);
    mezclador.musica(datos.tipo === "inicio" ? "curiosa" : "final");
    const panel = crear("div", "juego__panel");
    panel.append(crear("h1", "juego__titulo", datos.capitulo));
    const texto = crear("p", "juego__texto", datos.texto);
    texto.dataset.voiceLine = datos.voiceLine;
    texto.dataset.leer = "";
    panel.append(texto, boton(datos.accion.label, datos.tipo === "fallo" ? "back" : "next", () => {
      juego = datos.tipo === "inicio" ? empezarCapitulo(actual) : continuar(actual, ajustes);
      mostrar();
    }));
    capa.append(panel);
  }

  function escena(): void {
    const actual = juego!;
    const datos = escenaActual(actual);
    const idioma = idiomaDe(ajustes);
    const sala = SALAS[datos.sala];
    escenario.mostrar(sala.escenario, sala.ambiente);
    escenario.vista(sala.escenario);
    const tormenta = actual.partida.tick >= vistaDe(actual).mision.tickTormenta && datos.paso >= 5 && datos.paso <= 6;
    mezclador.musica(tormenta ? "tension" : "curiosa");
    if (tormenta) velo.className = "juego__velo juego__velo--alerta";

    const vista = estadoHud(vistaDe(actual), idioma, ajustes);
    const persona = hablante(datos.hablante, idioma);
    // El niño toca para hablar: antes de hacerlo ve los medidores y el objetivo.
    vista.interaction = { target: persona.name, action: t("juego.hablar"), voiceLine: `${t("juego.hablar")}: ${persona.name}.` };

    /** El aviso de cierre llega después: así sabe a dónde ir. */
    let irAlMenu = false;
    const menu = createPauseMenu(estadoPausa(vistaDe(actual), idioma), (id) => {
      if (id === "settings") ajustesMenu.open();
      if (id === "menu") { irAlMenu = true; menu.close(); }
    }, textos());
    // Con idioma nuevo se cierra la pausa para repintar toda la pantalla.
    const ajustesMenu = crearAjustes((cambioIdioma) => { if (cambioIdioma) menu.close(); });
    menu.dialog.addEventListener("close", () => {
      mezclador.pausar(false);
      if (juego && !irAlMenu) mostrar(); else inicio();
    });

    const hud = createGameHud(vista, () => hablar(), () => { mezclador.pausar(true); menu.open(); }, textos());
    capa.append(hud.layer, menu.dialog, ajustesMenu.dialog);
    // Los diálogos nativos van junto al HUD y se quitan al cambiar de pantalla.
    salir = () => { menu.dialog.remove(); ajustesMenu.dialog.remove(); };
    requestAnimationFrame(() => hud.placeInteraction({ x: hud.layer.clientWidth / 2, y: hud.layer.clientHeight / 2 }));

    function hablar(): void {
      if (hud.layer.querySelector(".ui-crew-dialogue")) return;
      const dialogo = createCrewDialogue(estadoDialogo(datos, idioma), (id) => {
        const paso = responder(juego!, id);
        paso.sonidos.forEach((s) => mezclador.efecto(s));
        if (paso.rechazada) return;
        juego = paso.juego;
        mostrar();
      }, textos());
      dialogo.root.dataset.hablante = datos.hablante;
      hud.setMode("dialogue");
      hud.layer.append(dialogo.root);
      if (datos.hablante === "iris" && datos.id.endsWith("-iris")) mezclador.efecto("irisDanada");
      if (datos.fuente) {
        const nota = crear("p", "juego__fuente", `${t("juego.noEnVivo")}: ${t(datos.fuente)}`);
        hud.layer.append(nota);
      }
      dialogo.focusFirstReply();
    }
  }

  function terminado(): void {
    mezclador.musica("final");
    const panel = crear("div", "juego__panel");
    panel.append(crear("h1", "juego__titulo", t("juego.terminado")), crear("p", "juego__texto", t("juego.terminado.mas")),
      boton(t("juego.pausa.menu"), "home", () => { borrar(almacen); juego = null; inicio(); }));
    capa.append(panel);
  }

  /** Pinta la pantalla que corresponde al estado actual, preparando antes su escenario. */
  function mostrar(): void {
    const actual = juego!;
    guardar(almacen, actual);
    const escenarioId = SALAS[vistaDe(actual).sala].escenario;
    const pintar = () => {
      limpiar();
      if (actual.fase === "tarjeta" || actual.fase === "resultado") tarjeta();
      else if (actual.fase === "escena") escena();
      else terminado();
    };
    void escenario.preparar(escenarioId).then(pintar).catch(() => aviso(t("juego.error")));
    if (!preparados.has(escenarioId)) { preparados.add(escenarioId); aviso(t("juego.cargando")); }
  }
  const preparados = new Set<EscenarioId>();

  aplicarAjustes();
  void conCarga(["space"], inicio);
}
