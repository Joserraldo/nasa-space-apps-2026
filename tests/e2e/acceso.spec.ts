import { test, expect } from '@playwright/test';

test('invitado entra sin API ni crear cuenta y avisa antes de salir',async({page})=>{
  const peticiones:string[]=[];
  await page.route('**/api/**',r=>{peticiones.push(r.request().url());return r.abort();});
  await page.goto('/');
  await page.getByRole('button',{name:'Play as guest',exact:true}).click();
  await expect(page.getByRole('button',{name:'Start mission',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Start mission',exact:true}).click();
  await page.getByRole('button',{name:'Skip intro',exact:true}).click();
  await page.getByRole('button',{name:'Skip',exact:true}).click();
  page.once('dialog',async d=>{expect(d.message()).toContain('guest progress will be lost');await d.accept();});
  await page.getByRole('button',{name:'Back to sign in',exact:true}).click();
  await expect(page.getByRole('button',{name:'Play as guest',exact:true})).toBeVisible();
  expect(peticiones).toEqual([]);
});

test('error de login permite seguir como invitado',async({page})=>{
  await page.route('**/api/auth/login',r=>r.fulfill({status:401,json:{error:'credenciales'}}));
  await page.goto('/');
  await page.getByLabel('Username',{exact:true}).fill('piloto_1');
  await page.getByLabel('Password',{exact:true}).fill('clave-prueba');
  await page.getByRole('button',{name:'Log in and play',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Check your username and password');
  await page.getByRole('button',{name:'Play as guest',exact:true}).click();
  await expect(page.getByRole('button',{name:'Start mission',exact:true})).toBeVisible();
});

test('crear cuenta guarda la misión y recupera la opción Continuar',async({page})=>{
  let datos:unknown=null;
  await page.route('**/api/auth/register',r=>r.fulfill({status:201,json:{usuario:'piloto_1'}}));
  await page.route('**/api/auth/me',r=>r.fulfill({json:{usuario:'piloto_1'}}));
  await page.route('**/api/progress',async r=>{
    if(r.request().method()==='PUT'){datos=r.request().postDataJSON().datos;await r.fulfill({json:{ok:true}});}
    else await r.fulfill({json:{datos}});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByLabel('Username',{exact:true}).fill('piloto_1');
  await page.getByLabel('Password',{exact:true}).fill('clave-prueba');
  await page.getByLabel('Repeat password',{exact:true}).fill('clave-prueba');
  await page.getByRole('button',{name:'Create account and play',exact:true}).click();
  await page.getByRole('button',{name:'Start mission',exact:true}).click();
  await page.getByRole('button',{name:'Skip intro',exact:true}).click();
  await page.getByRole('button',{name:'Skip',exact:true}).click();
  await expect(page.getByRole('status',{name:'Account progress'})).toContainText('Progress saved');
  expect(datos).not.toBeNull();
  await page.reload();
  await page.getByRole('button',{name:'Load my progress',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  // Con E8 en develop, saltar la intro lleva directo a la órbita (ui/05).
  await expect(page.getByRole('heading',{name:'Observe Mars'})).toBeVisible();
});

test('acceso bilingüe cabe en celular y conserva el invitado visible',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'ES',exact:true}).click();
  await expect(page.getByRole('button',{name:'Jugar como invitado',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button',{name:'Jugar como invitado',exact:true}).click();
  await expect(page.getByRole('button',{name:'Empezar misión',exact:true})).toBeVisible();
});
