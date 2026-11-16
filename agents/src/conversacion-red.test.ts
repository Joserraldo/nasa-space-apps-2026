import { describe, it, expect, vi } from 'vitest';
import { partidaDorada } from '@solar-shield/engine';
import { conversarConRed } from './conversacion-red.js';
import { MEMORIA_INICIAL } from './conversacion.js';
const s=partidaDorada(), base={tormentaActiva:false};
const payload={version:'0',experto:'ingeniera',accion:'estado_salud',parametros:{dosis:'999'},confianza:0.9,fuente:'modelo'};
describe('texto y voz con respaldo',()=>{
  it.each(['texto','voz'] as const)('%s envía solo texto y responde con el estado del motor',async via=>{
    const f=vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit)=>new Response(JSON.stringify(payload)));
    const e=via==='texto'?{via,texto:'my tummy feels funny',con:'ingeniera' as const}:{via,transcripcion:'my tummy feels funny',con:'ingeniera' as const};
    const r=await conversarConRed(e,s,MEMORIA_INICIAL,{...base,fetch:f});
    expect(JSON.parse(f.mock.calls[0]![1]!.body as string)).toEqual({texto:'my tummy feels funny'});
    expect(r.habla).toBe('doctora');
    expect(JSON.stringify(r.dialogo)).not.toContain('999');
    expect(r.dialogo.accion).toBeUndefined();
  });
  it.each([429,500])('HTTP %s mantiene los botones',async status=>{
    const r=await conversarConRed({via:'texto',texto:'blablabla',con:'doctora'},s,MEMORIA_INICIAL,{...base,fetch:async()=>new Response('',{status})});
    expect(r.entendido).toBe(false);expect(r.opciones.length).toBeGreaterThan(0);
  });
  it('JSON roto y red caída dejan una aclaración',async()=>{
    for(const f of [async()=>new Response('no JSON'),async()=>{throw Error('offline')}]){
      const r=await conversarConRed({via:'voz',transcripcion:'blablabla'},s,MEMORIA_INICIAL,{...base,fetch:f});
      expect(r.entendido).toBe(false);expect(r.opciones.length).toBeGreaterThan(0);
    }
  });
  it.each(['sube el escudo porfaaa','more power to the shield','tengo miedo','im scared','no entiendo','where do i go'])('%s funciona sin modelo',async texto=>{
    const f=vi.fn();const r=await conversarConRed({via:'texto',texto},s,MEMORIA_INICIAL,{...base,fetch:f});
    expect(f).not.toHaveBeenCalled();expect(r.entendido).toBe(true);
  });
});
