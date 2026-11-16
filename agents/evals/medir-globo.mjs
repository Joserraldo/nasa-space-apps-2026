// Servidor Vite de ui en BASE_URL. Usa el CSS real de F4 y mide texto sin recortarlo.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const repo = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const base = process.env.BASE_URL ?? 'http://localhost:5210';
const browser = await chromium.launch({headless:true, args:['--no-sandbox']});
const page = await browser.newPage({viewport:{width:390,height:844}});
await page.goto(base);
const result = await page.evaluate(async (repo) => {
  const {lineasGlobo,bienvenidaGlobo}=await import('/@fs' + repo + '/agents/src/globo.ts');
  const {traducir}=await import('/src/i18n.ts');
  document.body.innerHTML='<main></main>';
  for (const href of ['/src/estilos/tokens.css','/src/estilos/base.css','/src/componentes/base/globo.css']) {
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);
    await new Promise(resolve => {link.onload=resolve;link.onerror=resolve;});
  }
  const style=document.createElement('style');style.textContent='body{margin:0;background:#fbf3eb}main{padding:16px}h1{font-size:18px}h2{font-size:14px}.globo{translate:none;animation:none;margin:12px auto}';document.head.append(style);
  const main=document.querySelector('main');
  for(const idioma of ['en','es']) for(const nivel of ['tutorial','pistas','danada','offline']) {
    const h=document.createElement('h1');h.textContent=idioma+' / '+nivel;main.append(h);
    for(const [paso,lineas] of [[0,bienvenidaGlobo(nivel)],...Array.from({length:8},(_,i)=>[i+1,lineasGlobo(i+1,nivel)])]) {
      const label=document.createElement('h2');label.textContent='Step '+paso;main.append(label);
      for(const linea of lineas){const d=document.createElement('div');d.className='globo';d.dataset.key=idioma+':'+linea.clave;const p=document.createElement('p');p.className='globo-cara';p.textContent=traducir(idioma,linea.clave,linea.vars);d.append(p);main.append(d);}
    }
  }
  await document.fonts.ready;
  return [...document.querySelectorAll('.globo')].map(d=>{const p=d.firstChild,s=getComputedStyle(p);return {key:d.dataset.key,text:p.textContent,rows:Math.round((p.getBoundingClientRect().height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom))/parseFloat(s.lineHeight))};});
}, repo);
await mkdir('agents/evals/capturas',{recursive:true});
await page.screenshot({path:'agents/evals/capturas/b1-globos-390.png',fullPage:true});
await writeFile('agents/evals/globos-medidos.json',JSON.stringify({viewport:{width:390,height:844},measured:result.length,maxRows:Math.max(...result.map(r=>r.rows)),failures:result.filter(r=>r.rows>2)},null,2)+'\n');
await browser.close();
const failures=result.filter(r=>r.rows>2);
console.log(JSON.stringify({measured:result.length,failures},null,2));
if(failures.length) process.exitCode=1;
