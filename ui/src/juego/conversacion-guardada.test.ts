import { describe,it,expect } from 'vitest';
import { MEMORIA_INICIAL, turno, reaccionTripulacion, validarMemoriaConversacion } from '@solar-shield/agents';
import { aplicarAccion } from '@solar-shield/engine';
import { inicial,reducir } from './reductor.js';
import { serializarProgreso,deserializarProgreso } from './cuenta.js';
describe('integración de memoria en el guardado',()=>{
 it('volver a cargar no borra a quién habló ni repite una elección comentada',()=>{
  const j=inicial();const estado=aplicarAccion(j.estado,{tipo:'subir_escudo',nivel:1});
  const r=turno({via:'acercarse',con:'ingeniera'},estado,MEMORIA_INICIAL,{tormentaActiva:false,reaccion:reaccionTripulacion});
  const guardado=serializarProgreso(reducir({...j,estado,fase:'base'},{tipo:'charla',memoria:r.memoria,vistos:['rad']}));
  const restaurado=deserializarProgreso(JSON.parse(JSON.stringify(guardado)))!;
  expect(restaurado.conversacion).toEqual(r.memoria);expect(restaurado.curiosidades).toEqual(['rad']);
  expect(restaurado.estado).toEqual(estado);
  const otra=turno({via:'acercarse',con:'ingeniera'},restaurado.estado,restaurado.conversacion!,{tormentaActiva:false,reaccion:reaccionTripulacion});
  expect(otra.globo?.clave).toContain('saludo');
 });
 it('descarta datos de diálogo manipulados y admite partidas viejas',()=>{
  expect(validarMemoriaConversacion({...MEMORIA_INICIAL,hablados:['extra']})).toBeNull();
  expect(validarMemoriaConversacion({...MEMORIA_INICIAL,comentados:{ingeniera:[-1]}})).toBeNull();
  const d=serializarProgreso(inicial())!;
  expect(deserializarProgreso({...d,conversacion:{turnos:'muchos'},curiosidades:['invento']})).toMatchObject({curiosidades:[]});
  expect(deserializarProgreso(d)).not.toBeNull();
 });
});
