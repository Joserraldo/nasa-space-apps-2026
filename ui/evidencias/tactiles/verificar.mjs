// Montaje aislado y multitáctil emulado; NO sustituye la prueba en un celular real.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const temporal = resolve("build/qa-tactiles"), salida = resolve("ui/evidencias/tactiles");
mkdirSync(temporal, {recursive:true});
writeFileSync(temporal+"/index.html",'<!doctype html><html lang="en"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Touch QA</title><style>body{margin:0}</style><div id="root"></div><script type="module" src="./fixture.tsx"></script></html>');
writeFileSync(temporal+"/fixture.tsx",`
import React,{useState} from "react";
import {createRoot} from "react-dom/client";
import {EntradaTactil} from "/ui/src/escena/entradaTactil.ts";
import {ControlesTactiles} from "/ui/src/componentes/ControlesTactiles.tsx";
import {IdiomaContext} from "/ui/src/i18n.ts";
import "/ui/src/estilos/tokens.css";
import "/ui/src/estilos/base.css";
import "/ui/src/componentes/base/facetas.css";
import "/ui/src/componentes/base/facetado.css";
window.stats={usos:[],camaras:0,centros:0,pausas:0,audio:0,hud:0};
function Fixture(){
 const [cfg,setCfg]=useState({activa:true,camara:"tercera",lugarCercano:"taller",bloqueada:false,ocupado:false});
 const [entrada]=useState(()=>new EntradaTactil({onRecentrar:()=>window.stats.centros++,permiteZoom:()=>window.modo==="tercera"}));
 window.modo=cfg.camara; window.entrada=entrada; window.configurar=p=>setCfg(c=>({...c,...p}));
 const idioma=new URLSearchParams(location.search).get("idioma")||"en";
 document.documentElement.lang=idioma;
 return <IdiomaContext.Provider value={idioma}><div data-superficie style={{position:"relative",width:"100vw",height:"100dvh",touchAction:"pan-y",background:"var(--color-regolito-claro)"}}>
 <button data-hud onClick={()=>window.stats.hud++} style={{position:"absolute",left:16,top:16}}>HUD passthrough</button>
 <ControlesTactiles {...cfg} entrada={entrada} onUsar={id=>window.stats.usos.push(id)}
 onCamara={()=>{window.stats.camaras++;setCfg(c=>({...c,camara:c.camara==="tercera"?"primera":"tercera"}));}}
 onPausar={()=>{window.stats.pausas++;setCfg(c=>({...c,activa:false}));}} onActivarAudio={()=>window.stats.audio++}/>
 </div></IdiomaContext.Provider>;
}
const root=createRoot(document.getElementById("root"));root.render(<Fixture/>);window.desmontar=()=>root.unmount();
`);
const server = await createServer({root:process.cwd(),publicDir:"ui/public",configFile:"ui/vite.config.ts",server:{host:"127.0.0.1",port:5176,strictPort:true}});
let browser;
try {
  await server.listen(); browser=await chromium.launch({headless:true});
  const resultados=[];
  for(const [width,height] of [[1024,683],[844,390],[390,844]]) {
    const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    const page=await context.newPage(), errores=[];
    page.on("pageerror",e=>errores.push(e.message));
    await page.goto("http://127.0.0.1:5176/build/qa-tactiles/index.html");
    await page.getByRole("button",{name:"Inspect",exact:true}).waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(async()=>{const fuentes=await document.fonts.load("18px Nunito");return fuentes.length>0&&getComputedStyle(document.body).fontFamily.includes("Nunito");}));
    assert(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue("--color-cian").trim().length>0));
    assert.equal(await page.locator(".controles-tactiles").evaluate(e=>getComputedStyle(e).pointerEvents),"none");
    assert.equal(await page.locator("[data-superficie]").evaluate(e=>e.style.touchAction),"none");
    const cdp=await context.newCDPSession(page);
    const touch=(type,points)=>cdp.send("Input.dispatchTouchEvent",{type,touchPoints:points});
    const a={id:1,x:width*.18,y:height*.58},b={id:2,x:width*.68,y:height*.28};
    await touch("touchStart",[a,b]);
    await touch("touchMove",[{...a,x:a.x+30},{...b,x:b.x+20,y:b.y+15}]);
    const estado=await page.evaluate(()=>window.entrada.estado);
    assert(estado.moverX>0 && estado.mirarX>0 && estado.mirarY>0);
    assert.equal(await page.locator(".controles-tactiles").evaluate(e=>getComputedStyle(e).touchAction),"none");
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    for(const boton of await page.locator(".controles-tactiles button").all()) {
      const r=await boton.boundingBox();assert(r.width>=48 && r.height>=48);
    }
    await page.locator("[data-hud]").evaluate(e=>e.style.visibility="hidden");
    await page.screenshot({path:salida+`/captura-${width}x${height}.png`});
    await page.locator("[data-hud]").evaluate(e=>e.style.visibility="visible");
    await touch("touchEnd",[]);
    assert.equal(await page.evaluate(()=>window.entrada.estado.moverX),0);
    await page.getByRole("button",{name:"HUD passthrough",exact:true}).tap();
    assert.equal(await page.evaluate(()=>window.stats.hud),1);
    assert.equal(await page.evaluate(()=>window.entrada.estado.moverX),0);
    await page.getByRole("button",{name:"Inspect",exact:true}).tap();
    assert.deepEqual(await page.evaluate(()=>window.stats.usos),["taller"]);
    assert.equal(await page.evaluate(()=>window.entrada.estado.mirarX),0);
    await page.touchscreen.tap(width*.8,height*.2);await page.touchscreen.tap(width*.8,height*.2);
    assert.equal(await page.evaluate(()=>window.stats.centros),1);
    await page.getByRole("button",{name:"First person",exact:true}).tap();
    await page.getByRole("button",{name:"Third person",exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.stats.camaras),1);
    await page.evaluate(()=>window.configurar({mostrarBotones:false}));
    await page.getByRole("button",{name:"Third person",exact:true}).waitFor({state:"detached"});
    await page.getByRole("button",{name:"HUD passthrough",exact:true}).tap();
    assert.equal(await page.evaluate(()=>window.stats.hud),2);
    await touch("touchStart",[a,b]);await touch("touchMove",[{...a,x:a.x+30},{...b,x:b.x+20}]);
    assert(await page.evaluate(()=>window.entrada.estado.moverX>0&&window.entrada.estado.mirarX>0));
    await touch("touchEnd",[]);
    await page.evaluate(()=>window.configurar({mostrarBotones:true}));
    await page.getByRole("button",{name:"Third person",exact:true}).waitFor();
    await page.evaluate(()=>window.configurar({bloqueada:true}));
    await page.getByText("This action is not available now.",{exact:true}).waitFor();
    await page.getByRole("button",{name:"Inspect",exact:true}).tap({force:true});
    assert.equal(await page.evaluate(()=>window.stats.usos.length),1);
    await page.evaluate(()=>window.configurar({bloqueada:false,ocupado:true}));
    await page.locator('[aria-busy="true"]').waitFor();
    await page.locator('[aria-busy="true"]').tap({force:true});
    assert.equal(await page.evaluate(()=>window.stats.usos.length),1);
    await page.keyboard.press("KeyW");
    assert.equal(await page.locator(".controles-tactiles").getAttribute("data-visible"),"false");
    await touch("touchStart",[a]); await touch("touchMove",[{...a,x:a.x+30}]);
    assert.equal(await page.locator(".controles-tactiles").getAttribute("data-visible"),"true");
    await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));});
    await page.waitForFunction(()=>document.querySelector(".controles-tactiles").dataset.visible==="false");
    assert.equal(await page.evaluate(()=>window.stats.pausas),1);
    assert.equal(await page.evaluate(()=>window.entrada.estado.moverX),0);
    assert.equal(await page.locator("[data-superficie]").evaluate(e=>e.style.touchAction),"pan-y");
    await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:false});document.dispatchEvent(new Event("visibilitychange"));});
    assert.equal(await page.locator(".controles-tactiles").getAttribute("data-visible"),"false");
    await touch("touchEnd",[]);
    await page.evaluate(()=>window.configurar({activa:true}));
    await page.waitForFunction(()=>document.querySelector("[data-superficie]").style.touchAction==="none");
    await touch("touchStart",[a]);await touch("touchMove",[{...a,x:a.x+30}]);
    await page.evaluate(()=>window.desmontar());
    assert.deepEqual(await page.evaluate(()=>[window.entrada.estado.moverX,window.entrada.estado.moverZ,window.entrada.estado.mirarX,window.entrada.estado.mirarY,window.entrada.estado.zoom]),[0,0,0,0,0]);
    await page.evaluate(()=>{Object.defineProperty(document,"hidden",{configurable:true,value:true});document.dispatchEvent(new Event("visibilitychange"));});
    assert.equal(await page.evaluate(()=>window.stats.pausas),1);
    assert.deepEqual(errores,[]);
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto("http://127.0.0.1:5176/build/qa-tactiles/index.html?idioma=es");
    await page.getByRole("button",{name:"Inspeccionar",exact:true}).waitFor();
    assert.equal(await page.locator(".controles-tactiles__joystick").evaluate(e=>getComputedStyle(e).transitionDuration),"0s");
    resultados.push({width,height,multitactil:true,botones:true,hudSinIntercepcion:true,botonesOcultables:true,touchActionRestaurado:true,dobleToque:true,pausaSimulada:true,limpieza:true,es:true,movimientoReducido:true,errores});
    await context.close();
  }
  writeFileSync(salida+"/resultados.json",JSON.stringify({celularReal:"pendiente",escena3D:"sin integrar",viewports:resultados},null,2)+"\n");
  console.log("Táctil emulado: 3 tamaños, mover+mirar, botones, doble toque, teclado, pausa y limpieza: OK");
} finally {await browser?.close();await server.close();}
