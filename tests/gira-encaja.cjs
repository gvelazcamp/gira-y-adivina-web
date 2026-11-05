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
      await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Gonzalo');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
        const clear=CanvasRenderingContext2D.prototype.clearRect,fill=CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.matches('.ge-canvas'))window.__geDraw=[];return clear.apply(this,a);};
        CanvasRenderingContext2D.prototype.fillText=function(text,...a){if(this.canvas.matches('.ge-canvas')){const t=this.getTransform(),r=this.canvas.getBoundingClientRect();window.__geDraw.push({text,font:this.font,x:r.x+t.e*r.width/this.canvas.width,y:r.y+t.f*r.height/this.canvas.height,vertical:Math.abs(t.b)>Math.abs(t.a)});}return fill.call(this,text,...a);};
      });
      await page.goto(base,{waitUntil:'load'});
      await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');Extensiones.abrirLobby();});
      assert.equal(await page.locator('.ext-tarjeta').filter({hasText:'Girá y encajá'}).count(),1);
      await page.locator('.ext-tarjeta').filter({hasText:'Girá y encajá'}).click();
      await page.clock.install({time:new Date('2026-11-05T16:00:00Z')});await page.clock.pauseAt(new Date('2026-11-05T16:00:01Z'));
      await page.locator('[data-mode=palabras]').click();await page.locator('[data-start]').click();
      await page.clock.runFor(50);
      assert(await page.evaluate(()=>document.querySelector('.ge-canvas').height>0));
      assert(await page.evaluate(()=>{const r=document.querySelector('.ge-game').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight+2;}),'game fits viewport '+JSON.stringify(viewport));
      const cards=()=>page.evaluate(words=>window.__geDraw.filter(p=>words.includes(p.text)),names.flat());
      let first=await cards();assert.equal(first.length,3,'three cards immediately');
      assert.equal(new Set(first.map(p=>names.findIndex(a=>a.includes(p.text)))).size,3,'mixed categories in first cluster');
      const before=await page.locator('.ge-canvas').getAttribute('aria-label');
      await page.locator('.ge-pause').click();await page.clock.runFor(15000);
      assert.equal(await page.locator('.ge-canvas').getAttribute('aria-label'),before,'pause preserves selected card');
      assert.deepEqual(await cards(),first,'pause freezes all three positions');
      assert.equal(await page.locator('.ge-lives').textContent(),'♥♥♥');await page.locator('[data-resume]').click();
      // Touch an unselected card: select and rotate only that card.
      const target=first.find(p=>!before.startsWith('Ficha: '+p.text+'.'));
      await page.mouse.click(target.x,target.y);await page.clock.runFor(20);
      assert((await page.locator('.ge-canvas').getAttribute('aria-label')).startsWith('Ficha: '+target.text+'.'));
      const rotated=await cards();
      for(const p of rotated)assert.equal(p.vertical,p.text===target.text?!target.vertical:first.find(q=>q.text===p.text).vertical,'individual rotation');
      // Drag this card and ensure its companions stay in their own lanes.
      const box=await page.locator('.ge-canvas').boundingBox();
      await page.mouse.move(target.x,target.y);await page.mouse.down();await page.mouse.move(target.x+45*box.width/480,target.y,{steps:3});await page.mouse.up();await page.clock.runFor(20);
      const moved=await cards();
      for(const p of moved)assert(Math.abs(p.x-(p.text===target.text?target.x+45*box.width/480:first.find(q=>q.text===p.text).x))<2,'individual dragging');
      const label=await page.locator('.ge-canvas').getAttribute('aria-label');await page.mouse.click(box.x+5,box.y+box.height*.5);
      assert.equal(await page.locator('.ge-canvas').getAttribute('aria-label'),label,'empty background does not rotate a card');
      const startPositions=await cards();await page.clock.runFor(1000);const falling=await cards();
      const virtualH=Math.max(200,480*box.height/box.width),oldSpeed=Math.max(25,(virtualH-160)/8)*box.height/virtualH;
      for(const p of falling)assert(p.y-startPositions.find(q=>q.text===p.text).y>=oldSpeed*1.18,'faster falling');
      // Start clean and complete every level without letting peer cards disappear.
      await page.evaluate(()=>Extensiones.abrirJuego('gira-encaja'));await page.locator('[data-mode=palabras]').click();await page.locator('[data-start]').click();
      let total=0;
      for(let level=1;level<=5;level++)for(let wave=0;wave<3;wave++){
        await page.clock.runFor(20);assert.equal((await cards()).length,3,'fresh trio for every wave');
        for(let n=0;n<3;n++){
          const label=await page.locator('.ge-canvas').getAttribute('aria-label'),word=label.split('. ')[0].replace('Ficha: ',''),cat=names.findIndex(list=>list.includes(word));
          assert(cat>=0,'recognized card '+label);
          const vertical=(cat+level)%2===1,expectedVertical=level>=3&&wave===2?!vertical:vertical;
          if(label.includes('. Vertical.')!==expectedVertical)await page.locator('.ge-canvas').press('Space');
          await page.locator('.ge-canvas').press('ArrowLeft');await page.locator('.ge-canvas').press('ArrowLeft');await page.locator('.ge-canvas').press('ArrowLeft');
          for(let k=0;k<cat;k++)await page.locator('.ge-canvas').press('ArrowRight');
          await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(80);
          total++;assert.equal(await page.locator('.ge-lives').textContent(),'♥♥♥','valid card '+total);
          assert.equal((await cards()).length,2-n,'only resolved card leaves its trio');
        }
        await page.clock.runFor(1300);
      }
      assert.match(await page.locator('.ge-panel h2').textContent(),/completo/);
      const record=await page.evaluate(()=>GiraEncaja.mejorPuntaje());assert(record>=4500);
      await page.locator('[data-retry]').click();await page.clock.runFor(20);
      // One incorrectly oriented card and two wrong categories cost exactly three lives.
      for(let i=0;i<3;i++){
        const label=await page.locator('.ge-canvas').getAttribute('aria-label'),word=label.split('. ')[0].replace('Ficha: ',''),cat=names.findIndex(list=>list.includes(word));
        const lane=i===0?cat:(cat+1)%4;
        if(i===0&&label.includes('. Vertical.')===((cat+1)%2===1))await page.locator('.ge-canvas').press('Space');
        for(let k=0;k<3;k++)await page.locator('.ge-canvas').press('ArrowLeft');
        for(let k=0;k<lane;k++)await page.locator('.ge-canvas').press('ArrowRight');
        await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(80);
        assert.equal(await page.locator('.ge-lives').textContent(),'♥'.repeat(2-i)+'♡'.repeat(i+1));
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
    console.log('PASS Girá y encajá: trios, individual touch/drag, faster fall, five levels, pause, loss, record, cleanup, four viewports, Gonzalo visibility');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
