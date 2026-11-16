import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useT, type Idioma } from '../i18n.js';
import { autenticarCuenta, consultarSesion, leerProgresoCuenta } from '../juego/cuenta.js';
import type { Juego } from '../juego/reductor.js';
import { FacetButton } from './base/FacetButton.js';
import { PanelFacetado } from './base/PanelFacetado.js';
import { LogoSolarShield } from './base/LogoSolarShield.js';
import { Retrato } from './base/Retrato.js';
import './base/inicio.css';
import './acceso.css';

export interface SesionJugador { usuario: string | null; progreso: Juego | null }
export function Acceso({ idioma, onIdioma, onEntrar }: {idioma: Idioma; onIdioma(i: Idioma): void; onEntrar(sesion: SesionJugador): void}) {
  const { t } = useT();
  const [modo, setModo] = useState<'login'|'register'>('login');
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [repetida, setRepetida] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [sesion, setSesion] = useState<string|null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const intento = useRef(0);
  useEffect(() => {
    let activo = true;
    const n = intento.current;
    void consultarSesion().then(u => { if (activo && intento.current === n && u) setSesion(u); });
    return () => { activo = false; };
  }, []);
  useEffect(() => { document.documentElement.lang = idioma; }, [idioma]);

  async function cargar(usuarioCuenta: string, n: number) {
    const r = await leerProgresoCuenta();
    if (intento.current !== n) return;
    if (!r.ok) { setError(r.errorKey); setOcupado(false); return; }
    setClave(''); setRepetida('');
    onEntrar({usuario:usuarioCuenta,progreso:r.datos});
  }
  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setError(null);
    if (modo === 'register' && clave !== repetida) { setError('ui.cuenta.error.coincidencia'); return; }
    const n = ++intento.current;
    setOcupado(true);
    const r = await autenticarCuenta(modo, usuario, clave);
    if (intento.current !== n) return;
    if (!r.ok) { setError(r.errorKey); setOcupado(false); return; }
    setSesion(r.usuario);
    await cargar(r.usuario,n);
  }
  function invitado() {
    ++intento.current;
    setClave(''); setRepetida('');
    onEntrar({usuario:null,progreso:null});
  }
  return (
    <main className="acceso portada" aria-labelledby="acceso-titulo">
      <div className="acceso-idiomas" role="group" aria-label={t('ui.portada.idioma')}>
        {(['en','es'] as const).map(i=><FacetButton key={i} labelKey={`ui.portada.idioma.${i}`} selected={idioma===i} onClick={()=>onIdioma(i)} />)}
      </div>
      <section className="acceso-bienvenida">
        <LogoSolarShield className="acceso-logo" />
        <h1 id="acceso-titulo">{t('ui.cuenta.titulo')}</h1>
        <p>{t('ui.cuenta.subtitulo')}</p>
        <div className="acceso-tripulante" aria-hidden="true"><Retrato persona="nino" expresion="feliz" tam={240} /></div>
      </section>
      <PanelFacetado tituloKey="ui.cuenta.panel" className="acceso-panel">
        <div className="acceso-invitado">
          <FacetButton variant="primary" icon="jugar" labelKey="ui.cuenta.invitado" onClick={invitado} />
          <p>{t('ui.cuenta.invitado.detalle')}</p>
        </div>
        <div className="acceso-separador"><span>{t('ui.cuenta.o')}</span></div>
        {sesion ? <div className="acceso-sesion">
          <p>{t('ui.cuenta.bienvenida',{usuario:sesion})}</p>
          <FacetButton variant="primary" labelKey="ui.cuenta.continuar" busy={ocupado} onClick={()=>{setError(null);setOcupado(true);void cargar(sesion,++intento.current);}} />
          <FacetButton labelKey="ui.cuenta.otra" disabled={ocupado} onClick={()=>{setSesion(null);setError(null);setUsuario('');setClave('');}} />
        </div> : <>
          <div className="acceso-modos" role="group" aria-label={t('ui.cuenta.modo')}>
            {(['login','register'] as const).map(m=><FacetButton key={m} labelKey={`ui.cuenta.${m}`} selected={modo===m} disabled={ocupado} onClick={()=>{setModo(m);setError(null);setClave('');setRepetida('');}} />)}
          </div>
          <form className="acceso-formulario" onSubmit={entrar} aria-busy={ocupado}>
            <label htmlFor="cuenta-usuario">{t('ui.cuenta.usuario')}</label>
            <input id="cuenta-usuario" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={20} required value={usuario} disabled={ocupado} onChange={e=>setUsuario(e.target.value)} aria-describedby="cuenta-ayuda" />
            <p id="cuenta-ayuda" className="acceso-ayuda">{t('ui.cuenta.usuario.ayuda')}</p>
            <label htmlFor="cuenta-clave">{t('ui.cuenta.clave')}</label>
            <input id="cuenta-clave" name="password" type={verClave?'text':'password'} autoComplete={modo==='register'?'new-password':'current-password'} minLength={8} maxLength={72} required value={clave} disabled={ocupado} onChange={e=>setClave(e.target.value)} aria-describedby="clave-ayuda" />
            <p id="clave-ayuda" className="acceso-ayuda">{t('ui.cuenta.clave.ayuda')}</p>
            {modo==='register' && <><label htmlFor="cuenta-repetida">{t('ui.cuenta.repetir')}</label><input id="cuenta-repetida" name="confirm-password" type={verClave?'text':'password'} autoComplete="new-password" minLength={8} maxLength={72} required value={repetida} disabled={ocupado} onChange={e=>setRepetida(e.target.value)} /></>}
            <label className="acceso-ver"><input type="checkbox" checked={verClave} onChange={e=>setVerClave(e.target.checked)} />{t('ui.cuenta.ver')}</label>
            <FacetButton type="submit" variant="primary" labelKey={modo==='login'?'ui.cuenta.entrar':'ui.cuenta.crear'} busy={ocupado} onClick={()=>{}} />
          </form>
        </>}
        {error && <p className="acceso-error" role="alert">{t(error)}</p>}
        <p className="acceso-privacidad">{t('ui.cuenta.privacidad')}</p>
      </PanelFacetado>
      <p className="acceso-aviso">{t('ui.aviso.nasa')}</p>
    </main>
  );
}
