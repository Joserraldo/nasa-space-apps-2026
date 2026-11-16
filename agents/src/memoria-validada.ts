import { ClassifierIntentSchema } from '@solar-shield/contracts';
import { PREGUNTAS_DE, type Interlocutor, type MemoriaConversacion } from './conversacion.js';
const interlocutor = (v:unknown): v is Interlocutor => typeof v==='string' && Object.hasOwn(PREGUNTAS_DE,v);
/** Guardados antiguos o manipulados nunca inyectan texto ni claves arbitrarias al diálogo. */
export function validarMemoriaConversacion(v:unknown): MemoriaConversacion|null {
  if(!v || typeof v!=='object')return null;
  const m=v as Record<string,unknown>;
  if(!Number.isSafeInteger(m.turnos) || (m.turnos as number)<0 || !Array.isArray(m.hablados) || m.hablados.length>6 || !m.hablados.every(interlocutor))return null;
  let ultima:MemoriaConversacion['ultima']=null;
  if(m.ultima!==null){
    if(!m.ultima || typeof m.ultima!=='object')return null;
    const u=m.ultima as Record<string,unknown>, p=ClassifierIntentSchema.safeParse(u.pregunta);
    if(!interlocutor(u.con)||!p.success)return null;
    ultima={con:u.con,pregunta:p.data};
  }
  if(!m.comentados || typeof m.comentados!=='object'||Array.isArray(m.comentados))return null;
  const comentados:MemoriaConversacion['comentados']={};
  for(const [k,ids] of Object.entries(m.comentados)){
    if(!interlocutor(k)||!Array.isArray(ids)||ids.length>1024||!ids.every(i=>Number.isSafeInteger(i)&&i>=0))return null;
    comentados[k]=[...ids];
  }
  return {turnos:m.turnos as number,hablados:[...new Set(m.hablados)],ultima,comentados};
}
