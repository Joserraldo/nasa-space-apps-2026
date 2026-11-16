import { describe, expect, it } from 'vitest';
import { SourceCardSchema } from '@solar-shield/contracts';
import { CURIOSIDADES_MARTE, curiosidadMarte } from './curiosidades-marte.js';
import en from '../i18n/en.json';
import es from '../i18n/es.json';
describe('curiosidades verificadas de Marte',()=>{
  it('diez momentos con fuente NASA, inglés y español',()=>{
    expect(CURIOSIDADES_MARTE).toHaveLength(10);
    expect(new Set(CURIOSIDADES_MARTE.map(d=>d.id)).size).toBe(10);
    for(const d of CURIOSIDADES_MARTE){
      const r=curiosidadMarte(d.momento)!;
      expect(SourceCardSchema.safeParse(r.dialogo.fuente).success).toBe(true);
      expect(new URL(r.dialogo.fuente!.url).hostname).toMatch(/(^|\.)nasa\.gov$/);
      expect(r.dialogo.fuente?.estadoDato).toBe('curado');
      expect(r.dialogo.experto).toBe(d.experto);
      expect(r.dialogo.accion).toBeUndefined();
      for(const dic of [en,es]) expect(dic).toHaveProperty([r.dialogo.lineas[0]!.clave]);
    }
  });
  it('la curiosidad no se repite ni modifica la memoria del llamador',()=>{
    const vistos=['azul'];expect(curiosidadMarte('atardecer',vistos)).toBeNull();expect(vistos).toEqual(['azul']);
    expect(curiosidadMarte('radiacion',vistos)?.id).toBe('rad');
  });
});
