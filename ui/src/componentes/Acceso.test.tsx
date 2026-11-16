import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Acceso } from './Acceso.js';
import { IdiomaContext } from '../i18n.js';
describe('acceso opcional',()=>{
  it.each(['en','es'] as const)('ofrece invitado sin correo y campos etiquetados en %s',idioma=>{
    const html=renderToStaticMarkup(<IdiomaContext.Provider value={idioma}><Acceso idioma={idioma} onIdioma={()=>{}} onEntrar={()=>{}} /></IdiomaContext.Provider>);
    expect(html).toContain(idioma==='en'?'Play as guest':'Jugar como invitado');
    expect(html).toContain(idioma==='en'?'Create account':'Crear cuenta');
    expect(html).toContain('for="cuenta-usuario"');expect(html).toContain('for="cuenta-clave"');
    expect(html).toContain('type="password"');expect(html).toContain('autoComplete="current-password"');
    expect(html).not.toContain('type="email"');expect(html).not.toContain('ui.cuenta.');
  });
});
