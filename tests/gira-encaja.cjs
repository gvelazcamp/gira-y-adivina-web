const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
const names=[['Gato','Perro','León','Rana','Tortuga','Mariposa','Delfín','Elefante','Pingüino','Zorro','Conejo','Búho'],['Cactus','Girasol','Rosa','Palmera','Tulipán','Roble','Trébol','Pino','Brote','Trigo','Hoja','Lavanda'],['Saturno','Tierra','Luna','Sol','Cometa','Estrella','Galaxia','Marte','Neptuno','Satélite','Cohete','Astronauta'],['Pizza','Hamburguesa','Dona','Pan','Queso','Helado','Galleta','Torta','Pasta','Sushi','Medialuna','Chocolate']];
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    for(const viewport of [{width:390,height:844},{width:844,height:390},{width:360,height:640},{width:1280,height:900}]){
      const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<900,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
      await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Gonzalo');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');});
      await page.goto(base,{waitUntil:'load'});
      await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');Extensiones.abrirLobby();});
      assert.equal(await page.locator('.ext-tarjeta').filter({hasText:'Girá y encajá'}).count(),1);
      await page.locator('.ext-tarjeta').filter({hasText:'Girá y encajá'}).click();
      await page.clock.install({time:new Date('2026-11-05T16:00:00Z')});await page.clock.pauseAt(new Date('2026-11-05T16:00:01Z'));
      await page.locator('[data-mode=palabras]').click();await page.locator('[data-start]').click();
      await page.clock.runFor(50);
      assert(await page.evaluate(()=>document.querySelector('.ge-canvas').height>0));
      assert(await page.evaluate(()=>{const r=document.querySelector('.ge-game').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight+2;}),'game fits viewport '+JSON.stringify(viewport));
      const before=await page.locator('.ge-canvas').getAttribute('aria-label');
      await page.locator('.ge-pause').click();await page.clock.runFor(15000);
      assert.equal(await page.locator('.ge-canvas').getAttribute('aria-label'),before,'pause preserves piece');
      assert.equal(await page.locator('.ge-lives').textContent(),'♥♥♥');await page.locator('[data-resume]').click();
      // Play all five levels through actual pointer and keyboard controls.
      let total=0;
      for(let level=1;level<=5;level++)for(let done=0;done<8;done++){
        const label=await page.locator('.ge-canvas').getAttribute('aria-label'),word=label.split('. ')[0].replace('Ficha: ',''),cat=names.findIndex(list=>list.includes(word));
        assert(cat>=0,'recognized card '+label);
        const vertical=(cat+level)%2===1;
        const expectedVertical=level>=3&&done>=4?!vertical:vertical;
        const initialVertical=label.includes('. Vertical.');
        if(initialVertical!==expectedVertical)await page.locator('.ge-canvas').press('Space');
        const box=await page.locator('.ge-canvas').boundingBox(),x=box.x+box.width/2,y=box.y+box.height*.3;
        await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+((75+110*cat)-240)*box.width/480,y,{steps:3});await page.mouse.up();
        await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(2400);
        total++;assert.equal(await page.locator('.ge-lives').textContent(),'♥♥♥','valid category + rotation + positioning '+total);
      }
      assert.match(await page.locator('.ge-panel h2').textContent(),/completo/);
      const record=await page.evaluate(()=>GiraEncaja.mejorPuntaje());assert(record>=4000);
      await page.locator('[data-retry]').click();
      // Wrong categories cost one life; the third mistake ends the round.
      for(let i=0;i<3;i++){
        const label=await page.locator('.ge-canvas').getAttribute('aria-label'),word=label.split('. ')[0].replace('Ficha: ',''),cat=names.findIndex(list=>list.includes(word));
        const box=await page.locator('.ge-canvas').boundingBox(),wrong=(cat+1)%4;
        await page.mouse.move(box.x+box.width/2,box.y+box.height*.3);await page.mouse.down();await page.mouse.move(box.x+box.width/2+((75+110*wrong)-240)*box.width/480,box.y+box.height*.3,{steps:2});await page.mouse.up();
        await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(2400);
      }
      assert.match(await page.locator('.ge-panel h2').textContent(),/otra vez/);
      assert.equal(await page.evaluate(()=>GiraEncaja.mejorPuntaje()),record,'losing does not erase record');
      await page.evaluate(()=>Extensiones.abrirLobby());assert.equal(await page.locator('.ge-game').count(),0);
      await page.evaluate(()=>Extensiones.abrirJuego('gira-encaja'));await page.locator('[data-start]').click();
      await page.clock.runFor(500);
      if(process.env.UI_SCREENSHOTS){fs.mkdirSync(process.env.UI_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,'gira-encaja-'+viewport.width+'.png')});}
      await page.evaluate(()=>Extensiones.cerrar());assert.equal(await page.locator('.ge-game').count(),0);
      await page.clock.runFor(10000);assert.deepEqual(errors,[]);await context.close();
    }
    // Visibility and direct opening both respect the existing private-profile gate.
    for(const name of ['Vale','Ana']){
      const ctx=await browser.newContext({serviceWorkers:'block'}),page=await ctx.newPage();
      await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({body:''}));
      await page.addInitScript(n=>{localStorage.setItem('gya_nombre',n);localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');},name);
      await page.goto(base);await page.evaluate(()=>{document.querySelector('#splash')?.remove();Extensiones.abrirLobby();});
      assert.equal(await page.locator('.ext-tarjeta').filter({hasText:'Girá y encajá'}).count(),0);
      await page.evaluate(()=>Extensiones.abrirJuego('gira-encaja'));assert.equal(await page.locator('.ge-game').count(),0);
      await page.evaluate(()=>GiraEncaja.abrir(document.body));assert.equal(await page.locator('.ge-game').count(),0);await ctx.close();
    }
    console.log('PASS Girá y encajá: five levels, controls, pause, loss, record, cleanup, four viewports, private Gonzalo visibility');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
