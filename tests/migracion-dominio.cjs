const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const puente=fs.readFileSync(path.join(__dirname,'../migracion/puente.html'),'utf8');
const recibir=fs.readFileSync(path.join(__dirname,'../migracion/recibir.html'),'utf8');
const vieja='https://gvelazcamp.github.io/gira-y-adivina-rioplatense/';
const nueva='https://girayadivina.com/';

async function escenario({fallarEnvio=false,otroPerfil=false}={}){
  const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
  const context=await browser.newContext();
  let fila=null,envios=0;
  await context.route('https://qfeubudlnoogwzozywph.supabase.co/rest/v1/gya_ranking**',async route=>{
    const req=route.request();
    const cors={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'apikey,authorization,content-type,prefer'};
    if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
    if(req.method()==='POST'){
      envios++;
      if(fallarEnvio)return route.fulfill({status:503,body:'sin conexión',headers:cors});
      fila=req.postDataJSON();
      return route.fulfill({status:201,body:'',headers:cors});
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fila?[{estado_juego:fila.estado_juego}]:[]),headers:cors});
  });
  await context.route('https://girayadivina.com/**',route=>{
    const html=route.request().url().includes('/migrar.html')?recibir:'<title>Juego</title>';
    return route.fulfill({status:200,contentType:'text/html',body:html});
  });
  await context.route('https://gvelazcamp.github.io/gira-y-adivina-rioplatense/**',route=>route.fulfill({status:200,contentType:'text/html',body:route.request().url().includes('juego-anterior.html')?'<title>Juego anterior</title>':puente}));
  const page=await context.newPage();
  await page.goto(vieja+'juego-anterior.html');
  await page.evaluate(()=>{
    localStorage.setItem('gya_nombre','Vale');
    localStorage.setItem('gya_avatar','av1');
    localStorage.setItem('gya_pais','uruguay');
    localStorage.setItem('gya_monedas','857');
    localStorage.setItem('larueda_mundo','["Montevideo"]');
    localStorage.setItem('regllave_priv','clave-sensible');
    localStorage.setItem('ps-dia','{"day":1,"guesses":["SOL"]}');
    localStorage.setItem('rosco-best','27');
    localStorage.setItem('mj_racha','{"d":1,"n":3}');
    localStorage.setItem('pz_partida','x'.repeat(200000));
    localStorage.setItem('otro_sitio','no copiar');
  });
  if(otroPerfil){
    await page.goto(nueva+'index.html');
    await page.evaluate(()=>localStorage.setItem('gya_nombre','Otra persona'));
  }
  await page.goto(vieja+'index.html');
  if(fallarEnvio){
    await page.locator('#alternativa:visible').waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('gya_monedas')),'857');
    assert.equal(envios,1);
  }else if(otroPerfil){
    await page.waitForURL(nueva+'migrar.html#*');
    await page.getByText('Este navegador ya tiene una partida de otra persona. No se reemplazó.').waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('gya_nombre')),'Otra persona');
  }else{
    await page.waitForURL(nueva+'index.html');
    assert.equal(await page.evaluate(()=>localStorage.getItem('gya_nombre')),'Vale');
    assert.equal(await page.evaluate(()=>localStorage.getItem('gya_monedas')),'857');
    assert.equal(await page.evaluate(()=>localStorage.getItem('larueda_mundo')),'["Montevideo"]');
    assert.equal(await page.evaluate(()=>localStorage.getItem('regllave_priv')),'clave-sensible');
    assert.equal(await page.evaluate(()=>localStorage.getItem('ps-dia')),'{"day":1,"guesses":["SOL"]}');
    assert.equal(await page.evaluate(()=>localStorage.getItem('rosco-best')),'27');
    assert.equal(await page.evaluate(()=>localStorage.getItem('mj_racha')),'{"d":1,"n":3}');
    assert.equal(await page.evaluate(()=>localStorage.getItem('pz_partida')?.length),200000);
    assert.equal(await page.evaluate(()=>localStorage.getItem('otro_sitio')),null);
    assert.equal(await page.evaluate(()=>localStorage.getItem('dominio_migracion_v1')),'ok');
    assert.equal(envios,1);
    assert(!JSON.stringify(fila).includes('clave-sensible'));
    assert(!JSON.stringify(fila).includes('"gya_nombre"'));
    await page.goto(vieja+'index.html');
    await page.waitForURL(nueva+'index.html');
    assert.equal(await page.evaluate(()=>localStorage.getItem('gya_monedas')),'857');
    assert.equal(envios,1);
  }
  await browser.close();
}

(async()=>{
  await escenario();
  await escenario({fallarEnvio:true});
  await escenario({otroPerfil:true});
  console.log('Migración de dominio: partida completa, reintento y perfil ajeno OK');
})().catch(e=>{console.error(e);process.exitCode=1;});
