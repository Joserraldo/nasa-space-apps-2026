import { afterEach, describe, expect, it, vi } from 'vitest';
import { autenticarCuenta, cerrarSesionCuenta, leerProgresoCuenta, guardarProgresoCuenta } from './cuenta.js';
import { inicial, reducir } from './reductor.js';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const respuesta=(json:unknown,status=200)=>new Response(JSON.stringify(json),{status,headers:{'content-type':'application/json'}});
describe('cuenta y progreso del acceso',()=>{
  it('guarda solo una pista de sesión, nunca contraseña ni token',async()=>{
    const setItem=vi.fn();vi.stubGlobal('localStorage',{setItem,removeItem:vi.fn()});
    const f=vi.fn(async(_url:string,_init:RequestInit)=>respuesta({usuario:'piloto_1'},201));vi.stubGlobal('fetch',f);
    expect(await autenticarCuenta('register',' PILOTO_1 ','clave-prueba')).toEqual({ok:true,usuario:'piloto_1'});
    expect(setItem.mock.calls).toEqual([['ss_sesion_activa','1']]);
    expect(f.mock.calls[0]?.[0]).toBe('/api/auth/register');
  });
  it('muestra usuario ocupado y no registra sesión',async()=>{
    const setItem=vi.fn();vi.stubGlobal('localStorage',{setItem});vi.stubGlobal('fetch',async()=>respuesta({error:'usuario_ocupado'},409));
    expect(await autenticarCuenta('register','piloto_1','clave-prueba')).toEqual({ok:false,errorKey:'ui.cuenta.error.ocupado'});
    expect(setItem).not.toHaveBeenCalled();
  });
  it('guarda y recupera una misión validada mediante las rutas existentes',async()=>{
    let datos:unknown=null;
    vi.stubGlobal('fetch',async(_url:string,init:RequestInit)=>{
      expect(init.credentials).toBe('same-origin');
      if(init.method==='PUT'){datos=JSON.parse(init.body as string).datos;return respuesta({ok:true});}
      return respuesta({datos});
    });
    const juego=reducir(inicial(),{tipo:'fase',fase:'satelite'});
    expect(await guardarProgresoCuenta(juego)).toEqual({ok:true});
    const r=await leerProgresoCuenta();expect(r.ok).toBe(true);
    if(r.ok)expect(r.datos?.estado).toEqual(juego.estado);
  });
  it('no declara cierre de sesión si el servidor no lo confirmó',async()=>{
    const removeItem=vi.fn();vi.stubGlobal('localStorage',{removeItem});vi.stubGlobal('fetch',async()=>respuesta({error:'offline'},503));
    expect(await cerrarSesionCuenta()).toBe(false);expect(removeItem).not.toHaveBeenCalled();
  });
});
