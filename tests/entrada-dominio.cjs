const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const raiz=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(raiz,'index.html'),'utf8');
const entrada=index.match(/<script>\s*\/\* La app Android nueva[\s\S]*?<\/script>/);
assert(entrada,'falta la comprobación temprana en index.html');
const juego=`<!doctype html><html><head>${entrada[0]}</head><body>Juego</body></html>`;
const puente=fs.readFileSync(path.join(raiz,'../gira-y-adivina-rioplatense/migracion/puente.html'),'utf8');
const recibir=fs.readFileSync(path.join(raiz,'migracion/recibir.html'),'utf8');
const vieja='https://gvelazcamp.github.io/gira-y-adivina-rioplatense/';
const nueva='https://girayadivina.com/';

async function escenario(browser,{partidaAnterior=false,partidaNueva=false,sala=false}={}){
  const context=await browser.newContext();
  let puenteAbierto=0,envios=0,fila;
  await context.route('https://qfeubudlnoogwzozywph.supabase.co/rest/v1/gya_ranking**',async route=>{
    const req=route.request();
    const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'apikey,authorization,content-type,prefer'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
    if(req.method()==='POST'){
      envios++;
      fila=req.postDataJSON();
      return route.fulfill({status:201,headers});
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fila?[{estado_juego:fila.estado_juego}]:[]),headers});
  });
  await context.route('https://girayadivina.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:route.request().url().includes('/migrar.html')?recibir:juego}));
  await context.route('https://gvelazcamp.github.io/gira-y-adivina-rioplatense/**',route=>{
    if(route.request().url().includes('juego-anterior.html'))return route.fulfill({status:200,contentType:'text/html',body:'<title>Juego anterior</title>'});
    puenteAbierto++;
    return route.fulfill({status:200,contentType:'text/html',body:puente});
  });
  const page=await context.newPage();
  if(partidaAnterior){
    await page.goto(vieja+'juego-anterior.html');
    await page.evaluate(()=>{
      localStorage.setItem('gya_nombre','Vale');
      localStorage.setItem('gya_monedas','857');
    });
  }
  if(partidaNueva){
    await page.goto(nueva+'index.html');
    await page.evaluate(()=>localStorage.setItem('gya_nombre','Nueva'));
  }
  const inicio=nueva+'index.html?comprobar_partida=1'+(sala?'&sala=ABC':'');
  await page.goto(inicio,{waitUntil:'commit'});
  if(partidaAnterior)await page.waitForFunction(()=>localStorage.getItem('dominio_migracion_v1')==='ok',undefined,{timeout:20000});
  else if(!partidaNueva)await page.waitForFunction(()=>localStorage.getItem('dominio_origen_comprobado_v1')==='ok',undefined,{timeout:20000});
  await page.waitForURL(inicio,{timeout:20000});
  await page.locator('body').waitFor();
  assert.equal(await page.evaluate(()=>new URLSearchParams(location.search).get('sala')),sala?'ABC':null);
  assert.equal(await page.evaluate(()=>new URLSearchParams(location.search).has('sin_partida_anterior')),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('gya_nombre')),partidaAnterior?'Vale':partidaNueva?'Nueva':null);
  assert.equal(await page.evaluate(()=>localStorage.getItem('gya_monedas')),partidaAnterior?'857':null);
  assert.equal(puenteAbierto,partidaAnterior||!partidaNueva?1:0);
  assert.equal(envios,partidaAnterior?1:0);
  await page.reload();
  assert.equal(puenteAbierto,partidaAnterior||!partidaNueva?1:0,'no debe volver a consultar el dominio anterior');
  assert.equal(envios,partidaAnterior?1:0,'no debe volver a enviar la partida');
  await context.close();
}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
  try{
    await escenario(browser,{partidaAnterior:true,sala:true});
    await escenario(browser);
    await escenario(browser,{partidaNueva:true});
    console.log('Entrada nueva: migra una vez, no crea bucle y conserva enlaces y perfiles OK');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
