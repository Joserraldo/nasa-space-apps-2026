import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Acceso, type ModoAcceso } from './Acceso.js';
import { IdiomaContext, type Idioma } from '../i18n.js';

const dibujar = (idioma: Idioma, modoInicial?: ModoAcceso) => renderToStaticMarkup(
  <IdiomaContext.Provider value={idioma}><Acceso idioma={idioma} onIdioma={()=>{}} onEntrar={()=>{}} modoInicial={modoInicial} /></IdiomaContext.Provider>);

describe('acceso opcional',()=>{
  it.each(['en','es'] as const)('paso 1: ofrece invitado y los dos modos de cuenta, sin campos todavía, en %s',idioma=>{
    const html=dibujar(idioma);
    expect(html).toContain(idioma==='en'?'Play as guest':'Jugar como invitado');
    expect(html).toContain(idioma==='en'?'Create account':'Crear cuenta');
    expect(html).toContain(idioma==='en'?'Log in':'Iniciar sesión');
    expect(html).not.toContain('id="cuenta-usuario"');
    expect(html).not.toContain('ui.cuenta.');
  });

  it.each(['en','es'] as const)('iniciar sesión: campos etiquetados, sin correo y con la contraseña actual, en %s',idioma=>{
    const html=dibujar(idioma,'login');
    expect(html).toContain('for="cuenta-usuario"');expect(html).toContain('for="cuenta-clave"');
    expect(html).toContain('type="password"');expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('autoComplete="username"');expect(html).toContain('autoCorrect="off"');
    expect(html).not.toContain('type="email"');expect(html).not.toContain('ui.cuenta.');
  });

  it.each(['en','es'] as const)('crear cuenta: contraseña nueva y repetirla, cada una con su pista, en %s',idioma=>{
    const html=dibujar(idioma,'register');
    expect(html).toContain('autoComplete="new-password"');
    expect(html).toContain('for="cuenta-repetida"');expect(html).toContain('aria-describedby="repetir-ayuda"');
    expect(html).not.toContain('ui.cuenta.');
  });
});
