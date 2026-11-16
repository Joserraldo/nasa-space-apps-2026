import { useEffect, useRef, useState } from 'react';
import { guardarProgresoCuenta } from './cuenta.js';
import { reducir, type Juego } from './reductor.js';

/** Un solo escritor: las respuestas lentas no pueden sobrescribir un guardado más nuevo. */
export function useProgresoCuenta(usuario: string|null, juego: Juego) {
  const cola = useRef(Promise.resolve());
  const [estado, setEstado] = useState('ui.cuenta.guardado.listo');
  const guardar = async () => {
    if (!usuario || juego.fase === 'inicio') return true;
    setEstado('ui.cuenta.guardado.guardando');
    let ok = false;
    const snapshot = juego.registro ? reducir(juego,{tipo:'seguir'}) : juego;
    const trabajo = cola.current.then(async () => {
      const r = await guardarProgresoCuenta(snapshot);
      ok = r.ok;
      setEstado(r.ok?'ui.cuenta.guardado.ok':r.errorKey??'ui.cuenta.error.red');
    });
    cola.current = trabajo.catch(()=>{});
    await cola.current;
    return ok;
  };
  useEffect(()=>{
    if (!usuario || juego.fase === 'inicio') return;
    if (juego.fase === 'final') { void guardar(); return; }
    const timer=setTimeout(()=>{void guardar();},600);
    return ()=>clearTimeout(timer);
  },[usuario,juego]);
  return {estado,guardar};
}
