const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://local').pathname;
  const file=path.join(root,pathname==='/'?'index.html':pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    for(const {name,initial,mode,expectBlocked,expectFichas} of [
      {name:'Pepe',initial:0,mode:'bot',expectBlocked:true,expectFichas:0},
      {name:'Pepe',initial:3,mode:'bot',expectBlocked:false,expectFichas:2},
      {name:'Andrés',initial:0,mode:'bot',expectBlocked:false,expectFichas:0},
      {name:'Pepe',initial:0,mode:'local',expectBlocked:false,expectFichas:0},
      {name:'Pepe',initial:0,mode:'online',expectBlocked:false,expectFichas:0},
    ]){
      const context=await browser.newContext({serviceWorkers:'block'});
      const page=await context.newPage();
      await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:''}));
      await page.addInitScript(({name,initial})=>{
        localStorage.setItem('gya_nombre',name);
        localStorage.setItem('gya_pais','uruguay');
        localStorage.setItem('gya_bienvenida_vista','1');
        localStorage.setItem('gya_fichas_ext',JSON.stringify({'duelo-conocimiento':{n:initial,prox:initial?0:Date.now()+20*60*1000}}));
      },{name,initial});
      await page.goto(base,{waitUntil:'load'});
      await page.evaluate(()=>{
        document.querySelector('#splash')?.remove();
        document.documentElement.classList.remove('cargando');
        document.querySelector('#setup').style.display='none';
        Extensiones.abrirJuego('duelo-conocimiento');
      });
      const frame=page.frameLocator('iframe[src^="duelo-conocimiento.html"]');
      await frame.locator('[data-mode=bot]').waitFor();
      await frame.locator(`[data-mode=${mode}]`).click();
      await frame.locator('[data-answer=text]').click();
      await frame.locator('#input0').fill(name);
      await frame.locator('#setup-form button[type=submit]').click();
      const state=await page.evaluate(()=>({
        blocked:!!document.querySelector('.fx-capa'),
        fichas:JSON.parse(localStorage.getItem('gya_fichas_ext'))['duelo-conocimiento'].n,
        tester:Fichas.libre(),
        chip:document.querySelector('#extFichas').hidden,
      }));
      assert.equal(state.blocked,expectBlocked,`${name}/${mode}: cartel`);
      assert.equal(state.fichas,expectFichas,`${name}/${mode}: fichas`);
      assert.equal(state.tester,name==='Andrés');
      assert.equal(state.chip,name==='Andrés',`${name}/${mode}: indicador`);
      assert.equal(await frame.locator('#setup-overlay').evaluate(el=>el.classList.contains('hidden')), !expectBlocked&&mode!=='online',`${name}/${mode}: inicio`);
      if(mode==='online')assert.equal(await frame.locator('#dc-room-lobby').isVisible(),true,'la sala online se crea sin gastar fichas');
      if(name==='Pepe'&&initial===3){
        await frame.locator('#rematch-btn').evaluate(button=>button.click());
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gya_fichas_ext'))['duelo-conocimiento'].n),1,'la revancha contra BOT gasta otra ficha');
      }
      await context.close();
    }
    console.log('PASS Duelo de Conocimiento: BOT y revancha cobran; tester, juego local y sala online libres');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
