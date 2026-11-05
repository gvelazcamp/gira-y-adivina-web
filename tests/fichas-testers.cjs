const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const games=['palabra-secreta','sopa-fugaz','rueda-de-letras','frases-en-giro','memoria-en-giro','rosco-rioplatense','silabario-rioplatense','cien-rioplatenses','ahorcado-rioplatense','moon-tap','tutti-frutti','puzzle','duelo-conocimiento'];
const server=http.createServer((req,res)=>{
  const f=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    for(const name of ['Gonzalo','Grace','Vale','Andres','Andrés','Romina','Meg','Juan e.','Flor','Mari','Ruben','Rubén',' mEg ']){
      const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
      await page.addInitScript(({name,games})=>{
        localStorage.setItem('gya_nombre',name);localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
        localStorage.setItem('gya_fichas_ext',JSON.stringify(Object.fromEntries(games.map((id,i)=>[id,{n:i%2?0:2,prox:i%2?Date.now()+20*60*1000:0}]))));
      },{name,games});
      await page.goto(base,{waitUntil:'load'});
      const result=await page.evaluate(games=>{
        window.paseExtActivo=()=>false;
        const before=localStorage.getItem('gya_fichas_ext'),resources=[meta.monedas,meta.vidas];let retry=0;
        const all=games.map(id=>({id,charged:Fichas.cobra(id),plays:Array.from({length:6},()=>Fichas.usar(id,()=>retry++))}));
        return{before,after:localStorage.getItem('gya_fichas_ext'),all,retry,resources,afterResources:[meta.monedas,meta.vidas],blocked:!!document.querySelector('.fx-capa'),free:Fichas.libre()};
      },games);
      assert.equal(result.before,result.after,name+': no fichas consumed, including stored zero');
      assert.deepEqual(result.resources,result.afterResources,name+': main lives/coins preserved');assert.equal(result.retry,0);assert.equal(result.blocked,false);
      assert.equal(result.free,name!=='Gonzalo'); // Creator retains the existing three visible unlimited rayitos.
      for(const g of result.all){assert(g.plays.every(Boolean),name+'/'+g.id);assert.equal(g.charged,name==='Gonzalo',name+'/'+g.id+': display policy');}
      // Exercise the actual Rosco start button without its optional presentation covering it.
      await page.evaluate(()=>{window.GIRO_ROSCO_PILOTO=false;document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');Extensiones.abrirJuego('rosco-rioplatense');});
      assert.equal(await page.locator('#extFichas').evaluate(e=>e.hidden),name!=='Gonzalo');
      if(['Juan e.','Meg','Grace','Gonzalo'].includes(name)){
        const saved=await page.evaluate(()=>localStorage.getItem('gya_fichas_ext'));
        await page.locator('#rrPanel button.rr-principal').first().click();
        assert.equal(await page.locator('#rrJuego').evaluate(e=>e.hidden),false,name+': starts with zero fichas');
        assert.equal(await page.locator('.fx-capa').count(),0);
        assert.equal(await page.evaluate(()=>localStorage.getItem('gya_fichas_ext')),saved);
      }
      assert.deepEqual(errors,[]);await context.close();
    }
    // Similar names keep the normal charge policy; no prefix/substring grants.
    const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
    await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
    await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Pepe');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');localStorage.setItem('gya_fichas_ext',JSON.stringify({'rosco-rioplatense':{n:1,prox:0}}));});
    await page.goto(base);
    const controls=await page.evaluate(games=>{
      window.paseExtActivo=()=>false;
      const names=['Pepe','Juan','Juan E','Juan.e','Juan .e','juan .e','Juan E.','juan e.','JUAN E.','Juan  e.',' Juan e. ','Juan e..','Juán e.','Juan e','Juana E','Juan E Pérez','Megara','Meg Pérez','Grace2'];
      const charges=names.flatMap(nombre=>{perfil.nombre=nombre;return games.map(id=>Fichas.cobra(id));});
      perfil.nombre='Pepe';const first=Fichas.usar('rosco-rioplatense'),remaining=Fichas.de('rosco-rioplatense').n,second=Fichas.usar('rosco-rioplatense');
      return{charges,first,remaining,second,blocked:!!document.querySelector('.fx-capa')};
    },games);
    assert(controls.charges.every(Boolean));assert.equal(controls.first,true);assert.equal(controls.remaining,0);assert.equal(controls.second,false);assert.equal(controls.blocked,true);
    await context.close();
    console.log('PASS free testers: exact Juan e. only, punctuation/case/space variants charged, Meg and other exemptions preserved, all 13 games, zero balance, Rosco UI and normal-player limits');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
