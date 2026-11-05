const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const groups=[['Gato','Perro','León','Rana','Tortuga','Mariposa','Delfín','Elefante','Pingüino','Zorro','Conejo','Búho'],['Cactus','Girasol','Rosa','Palmera','Tulipán','Roble','Trébol','Pino','Brote','Trigo','Hoja','Lavanda'],['Saturno','Tierra','Luna','Sol','Cometa','Estrella','Galaxia','Marte','Neptuno','Satélite','Cohete','Astronauta'],['Pizza','Hamburguesa','Dona','Pan','Queso','Helado','Galleta','Torta','Pasta','Sushi','Medialuna','Chocolate']];
const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    for(const [index,viewport] of [{width:390,height:844},{width:844,height:390},{width:360,height:640},{width:1280,height:900}].entries()){
      const context=await browser.newContext({viewport,serviceWorkers:'block',isMobile:viewport.width<900,hasTouch:true}),page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
      await page.addInitScript(name=>{
        localStorage.setItem('gya_nombre',name);localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');
        const clear=CanvasRenderingContext2D.prototype.clearRect,fill=CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.matches('.ge-canvas'))window.__draw=[];return clear.apply(this,args);};
        CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(this.canvas.matches('.ge-canvas')){const t=this.getTransform(),r=this.canvas.getBoundingClientRect(),x=args[0],y=args[1];window.__draw.push({text,font:this.font,x:r.x+(t.a*x+t.c*y+t.e)*r.width/this.canvas.width,y:r.y+(t.b*x+t.d*y+t.f)*r.height/this.canvas.height});}return fill.call(this,text,...args);};
      },index%2?'Vale':'Gonzalo');
      await page.goto(base);await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');Extensiones.abrirJuego('gira-encaja');});
      await page.clock.install({time:new Date('2026-11-05T18:00:00Z')});await page.clock.pauseAt(new Date('2026-11-05T18:00:01Z'));
      await page.locator('[data-mode=palabras]').click();await page.locator('[data-start]').click();await page.clock.runFor(2600);
      assert.equal(await page.locator('.ge-question').evaluate(e=>e.hidden),true,'sorting before question');
      for(let i=0;i<3;i++){
        const label=await page.locator('.ge-canvas').getAttribute('aria-label'),word=label.split('. ')[0].replace('Ficha: ',''),cat=groups.findIndex(g=>g.includes(word));assert(cat>=0);
        if(label.includes('. Vertical.')!==((cat+1)%2===1))await page.locator('.ge-canvas').press('Space');
        for(let j=0;j<3;j++)await page.locator('.ge-canvas').press('ArrowLeft');
        for(let j=0;j<cat;j++)await page.locator('.ge-canvas').press('ArrowRight');
        await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(50);
        assert.equal(await page.locator('.ge-question').evaluate(e=>e.hidden),true,'question waits for every sorting card');
      }
      await page.evaluate(value=>{Math.random=()=>value;},index%2?.9:.1);
      await page.clock.runFor(650);
      const panel=page.locator('.ge-question');assert.equal(await panel.evaluate(e=>e.hidden),false);
      assert.match(await panel.textContent(),/Segunda Guerra Mundial en Europa/);
      const bank=await page.evaluate(()=>window.GIRA_ENCAJA_PREGUNTAS);
      assert(bank.length>=15);assert.equal(new Set(bank.map(q=>q.id)).size,bank.length);assert.equal(new Set(bank.map(q=>q.pregunta)).size,bank.length);
      for(const q of bank){assert(q.pregunta&&q.correcta&&q.otra);assert.notEqual(q.correcta,q.otra);}
      assert.equal(bank.find(q=>q.id==='segunda-guerra').correcta,'1939');
      const labels=await page.evaluate(()=>window.__draw.filter(x=>x.font==='800 21px system-ui'));
      assert.deepEqual(labels.map(x=>x.text).sort(),['1939','1945'],'exactly two answers');
      const correct=labels.find(x=>x.text==='1939'),box=await page.locator('.ge-canvas').boundingBox();
      assert.equal(correct.x>box.x+box.width/2,index%2===0,'correct option can be on either side');
      assert(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth),'question text fits');
      assert(await page.evaluate(()=>{const g=document.querySelector('.ge-game').getBoundingClientRect();return g.left>=0&&g.right<=innerWidth&&g.bottom<=innerHeight+2;}),'screen fits');
      const position=()=>page.evaluate(()=>window.__draw.find(x=>x.text==='?'));
      const p=await position();assert(p);
      await page.locator('.ge-pause').click();await page.clock.runFor(15000);assert.deepEqual(await position(),p,'quiz pauses');await page.locator('[data-resume]').click();
      await page.clock.runFor(1000);const after=await position(),h=Math.max(200,480*box.height/box.width),expected=(h-85-Math.min(52,h*.12))/9*box.height/h;
      assert(Math.abs(after.y-p.y-expected)<2,'same nine-second fall, without extra time');
      if(process.env.UI_SCREENSHOTS){fs.mkdirSync(process.env.UI_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.UI_SCREENSHOTS,'gira-encaja-pregunta-'+viewport.width+'.png')});}
      const label=await page.locator('.ge-canvas').getAttribute('aria-label');
      if(index===2){await page.clock.runFor(9000);assert.equal(await panel.evaluate(e=>e.hidden),true,'timeout returns to sorting');}
      else{
        const answer=index===1?'1945':'1939',left=label.includes('Izquierda: '+answer+','),vertical=label.includes(answer+', vertical');
        if(vertical)await page.locator('.ge-canvas').press('Space');
        await page.locator('.ge-canvas').press(left?'ArrowLeft':'ArrowRight');
        await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(50);
        assert.equal(await panel.evaluate(e=>e.hidden),true);
        assert.match(await page.locator('.ge-feedback').textContent(),index===1?/La respuesta era 1939/:/Correcto! 1939/);
      }
      assert.equal(await page.locator('.ge-lives').textContent(),index===1||index===2?'♥♥♡':'♥♥♥');
      assert.match(await page.locator('.ge-level').textContent(),/3\/9/,'quiz leaves sorting progress unchanged');
      await page.clock.runFor(2000);assert.equal(await panel.evaluate(e=>e.hidden),true,'does not repeat the same quiz');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gya_vistas_gira_encaja_preguntas')).length),1);
      await page.evaluate(()=>Extensiones.cerrar());await page.clock.runFor(20000);assert.equal(await page.locator('.ge-game').count(),0);assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS quizzes: natural transition, exactly two shuffled answers, 1939, unchanged fall time, pause, correct/wrong/timeout, return to sorting, history, four screens, Gonzalo/Vale');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
