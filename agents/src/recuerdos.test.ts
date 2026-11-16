import { describe, it, expect } from 'vitest';
import { aplicarAccion, partidaDorada, tormentaActiva } from '@solar-shield/engine';
import { comentarRecuerdo, reaccionTripulacion } from './recuerdos.js';
import { MEMORIA_INICIAL, turno } from './conversacion.js';
import en from '../i18n/en.json';
import es from '../i18n/es.json';
const inicial = partidaDorada();
describe('la tripulación recuerda decisiones reales', () => {
  it('dos partidas con decisiones diferentes producen comentarios diferentes', () => {
    const a=aplicarAccion(inicial,{tipo:'subir_escudo',nivel:2});
    const b=aplicarAccion(inicial,{tipo:'refugiarse'});
    const x=comentarRecuerdo('doctora',a,MEMORIA_INICIAL)!;
    const y=comentarRecuerdo('doctora',b,MEMORIA_INICIAL)!;
    expect(x.linea.clave).not.toBe(y.linea.clave);
    for(const l of [x.linea,y.linea]) for(const d of [en,es]) expect(d).toHaveProperty([l.clave]);
  });
  it('saluda con el recuerdo sin mutar el motor y no lo repite', () => {
    const s=aplicarAccion(inicial,{tipo:'subir_escudo',nivel:1});
    const antes=JSON.stringify(s);
    const a=turno({via:'acercarse',con:'ingeniera'},s,MEMORIA_INICIAL,{tormentaActiva:tormentaActiva(s),reaccion:reaccionTripulacion});
    const b=turno({via:'acercarse',con:'ingeniera'},s,a.memoria,{tormentaActiva:false,reaccion:reaccionTripulacion});
    expect(a.globo?.clave).toContain('agentes.recuerdo.');
    expect(b.globo?.clave).toContain('agentes.conversacion.saludo.');
    expect(JSON.stringify(s)).toBe(antes);
    expect(MEMORIA_INICIAL.comentados).toEqual({});
  });
  it('no culpa al niño por azar, sistema ni simulación', () => {
    const s={...inicial,causas:[{tick:0,origen:'mala_suerte' as const,descripcionKey:'x',accion:{tipo:'esperar' as const}}]};
    expect(comentarRecuerdo('ingeniera',s,MEMORIA_INICIAL)).toBeNull();
    expect(comentarRecuerdo('ia_base',inicial,MEMORIA_INICIAL)).toBeNull();
  });
  it('dos módulos del mismo tick se comentan por separado', () => {
    const s={...inicial,causas:['panel_solar','bateria'].map(modulo=>({tick:0,origen:'decision' as const,descripcionKey:'x',accion:{tipo:'colocar_modulo' as const,modulo:modulo as 'panel_solar'|'bateria'}}))};
    const a=comentarRecuerdo('ingeniera',s,MEMORIA_INICIAL)!;
    const b=comentarRecuerdo('ingeniera',s,a.memoria)!;
    expect(a.recuerdo.accion).not.toEqual(b.recuerdo.accion);
    expect(comentarRecuerdo('ingeniera',s,b.memoria)).toBeNull();
  });
});
