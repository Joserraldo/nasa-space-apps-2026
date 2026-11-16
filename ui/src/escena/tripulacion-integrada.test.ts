import { expect,it } from 'vitest';
import { crearTripulacionBase } from './tripulacionBase.js';
it('monta las tres expertas en el mundo y libera sus recursos',()=>{
 const t=crearTripulacionBase();
 expect(t.doctora.grupo.parent).toBe(t.grupo);expect(t.meteorologa.grupo.parent).toBe(t.grupo);
 t.jugador.grupo.position.copy(t.doctora.grupo.position);
 t.animar(1000,true);
 expect(t.doctora.rostro.grupo.visible).toBe(true);
 expect(t.meteorologa.rostro.grupo.visible).toBe(false);
 t.jugador.grupo.position.copy(t.meteorologa.grupo.position);
 t.animar(2000,true);
 expect(t.meteorologa.rostro.grupo.visible).toBe(true);
 expect(t.doctora.rostro.grupo.visible).toBe(false);
 t.liberar();t.liberar();
});
