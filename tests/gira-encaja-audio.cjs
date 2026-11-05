const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..'),trackName='observatory-in-the-clouds-v1.mp3';
const groups=[['Gato','Perro','León','Rana','Tortuga','Mariposa','Delfín','Elefante','Pingüino','Zorro','Conejo','Búho'],['Cactus','Girasol','Rosa','Palmera','Tulipán','Roble','Trébol','Pino','Brote','Trigo','Hoja','Lavanda'],['Saturno','Tierra','Luna','Sol','Cometa','Estrella','Galaxia','Marte','Neptuno','Satélite','Cohete','Astronauta'],['Pizza','Hamburguesa','Dona','Pan','Queso','Helado','Galleta','Torta','Pasta','Sushi','Medialuna','Chocolate']];
const server=http.createServer((req,res)=>{
  const f=path.join(root,new URL(req.url,'http://local').pathname.replace(/^\/$/,'/index.html'));
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.setHeader('Content-Length',fs.statSync(f).size);fs.createReadStream(f).pipe(res);
});
async function setup(browser,base,{name='Vale',muted=false,fake=false,reject=false,deferred=false,viewport={width:390,height:844}}={}){
  const context=await browser.newContext({viewport,serviceWorkers:'block',isMobile:true,hasTouch:true}),page=await context.newPage();
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
  await page.addInitScript(({name,muted,fake,reject,deferred})=>{
    localStorage.setItem('gya_nombre',name);localStorage.setItem('gya_avatar','avatar-01');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');localStorage.setItem('gya_musica',muted?'off':'on');
    const Native=window.Audio;window.__tracks=[];window.__reject=reject;window.__deferred=deferred;
    window.Audio=function(src){
      if(!String(src).includes('observatory-in-the-clouds-v1.mp3'))return new Native(src);
      if(!fake){const a=new Native(src);window.__tracks.push(a);return a;}
      const a={src,paused:true,loop:false,volume:1,currentTime:0,plays:0,pauses:0,
        play(){this.plays++;if(window.__reject){window.__reject=false;return Promise.reject(new DOMException('gesture required','NotAllowedError'));}
          if(window.__deferred)return new Promise(resolve=>{window.__resolve=()=>{this.paused=false;resolve();};});this.paused=false;return Promise.resolve();},
        pause(){this.paused=true;this.pauses++;},removeAttribute(key){if(key==='src')this.src='';},load(){this.unloaded=true;}};
      window.__tracks.push(a);return a;
    };
  },{name,muted,fake,reject,deferred});
  await page.goto(base);await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');Extensiones.abrirLobby();});
  return{context,page};
}
async function open(page){await page.locator('.ext-tarjeta').filter({hasText:'Girá y encajá'}).click();}
async function playCard(page,wrong=false){
  const label=await page.locator('.ge-canvas').getAttribute('aria-label'),word=label.split('. ')[0].replace('Ficha: ',''),cat=groups.findIndex(g=>g.includes(word));assert(cat>=0);
  if(!wrong&&label.includes('. Vertical.')!==((cat+1)%2===1))await page.locator('.ge-canvas').press('Space');
  for(let i=0;i<3;i++)await page.locator('.ge-canvas').press('ArrowLeft');
  for(let i=0;i<(wrong?(cat+1)%4:cat);i++)await page.locator('.ge-canvas').press('ArrowRight');
  await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(50);
}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    // Native media: prove the delivered file really decodes, plays and loops.
    {
      const {context,page}=await setup(browser,base,{viewport:{width:360,height:640}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
      await page.waitForFunction(()=>window.__tracks[0]?.readyState>=2&&!window.__tracks[0].paused);
      const media=await page.evaluate(()=>{const a=window.__tracks[0];return{duration:a.duration,loop:a.loop,volume:a.volume,error:a.error?.message};});
      assert(media.duration>87&&media.duration<89);assert(media.loop);assert(media.volume<=.3);assert(!media.error);
      await page.evaluate(()=>{const a=window.__tracks[0];a.currentTime=a.duration-.2;});
      await page.waitForFunction(()=>window.__tracks[0].currentTime<2&&!window.__tracks[0].paused);
      await page.locator('.ge-sound').click();assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true,'intro mute is clickable above its overlay');
      assert.equal(await page.evaluate(()=>localStorage.getItem('gya_musica')),'off');
      await page.locator('.ge-sound').click();await page.waitForFunction(()=>!window.__tracks[0].paused);
      for(const viewport of [{width:360,height:640},{width:390,height:844},{width:844,height:390}]){
        await page.setViewportSize(viewport);assert(await page.locator('.ge-hud').evaluate(e=>e.scrollWidth<=e.clientWidth),'sound button fits HUD');
      }
      await page.evaluate(()=>Extensiones.cerrar());assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true);assert.deepEqual(errors,[]);await context.close();
    }
    // Lifecycle in the real application, with deterministic media and game clocks.
    {
      const {context,page}=await setup(browser,base,{name:'Gonzalo',fake:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.clock.install({time:new Date('2026-11-05T18:00:00Z')});await page.clock.pauseAt(new Date('2026-11-05T18:00:01Z'));await open(page);
      assert.equal(await page.evaluate(()=>window.__tracks.length),1);assert.equal(await page.evaluate(()=>window.__tracks[0].paused),false);
      await page.evaluate(()=>{window.__tracks[0].currentTime=23;document.getElementById('btnMusica').click();});await page.clock.runFor(50);
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true,'global mute');
      await page.evaluate(()=>document.getElementById('btnMusica').click());await page.clock.runFor(50);
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),false);assert.equal(await page.evaluate(()=>window.__tracks[0].currentTime),23);
      await page.locator('[data-mode=palabras]').click();await page.locator('[data-start]').click();
      await page.locator('.ge-pause').click();assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true);await page.clock.runFor(1000);await page.locator('[data-resume]').click();
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),false,'resume music with game');
      await page.evaluate(()=>{window.__visible=false;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__visible?'visible':'hidden'});Object.defineProperty(document,'hidden',{configurable:true,get:()=>!window.__visible});document.dispatchEvent(new Event('visibilitychange'));});
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true);await page.evaluate(()=>{window.__visible=true;document.dispatchEvent(new Event('visibilitychange'));});
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true,'backgrounding keeps the game in pause');await page.locator('[data-resume]').click();
      await page.clock.runFor(2600);for(let i=0;i<3;i++)await playCard(page);await page.clock.runFor(700);
      assert.equal(await page.locator('.ge-question').evaluate(e=>e.hidden),false);
      assert.equal(await page.evaluate(()=>window.__tracks.length),1);assert.equal(await page.evaluate(()=>window.__tracks[0].paused),false,'same music in question');assert.equal(await page.evaluate(()=>window.__tracks[0].currentTime),23);
      const label=await page.locator('.ge-canvas').getAttribute('aria-label');if(label.includes('1939, vertical'))await page.locator('.ge-canvas').press('Space');
      await page.locator('.ge-canvas').press(label.includes('Izquierda: 1939,')?'ArrowLeft':'ArrowRight');await page.locator('.ge-canvas').press('ArrowDown');await page.clock.runFor(1500);
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),false,'music stays through answer and return');
      await page.clock.runFor(2600);for(let i=0;i<3;i++)await playCard(page,true);
      assert.match(await page.locator('.ge-panel h2').textContent(),/otra vez/);assert.equal(await page.evaluate(()=>window.__tracks[0].paused),false,'results keep music');
      await page.locator('[data-retry]').click();assert.equal(await page.evaluate(()=>window.__tracks.length),1,'retry does not stack tracks');assert.equal(await page.evaluate(()=>window.__tracks[0].currentTime),23);
      await page.evaluate(()=>Extensiones.abrirJuego('palabras-cruzadas'));assert.equal(await page.evaluate(()=>window.__tracks[0].paused&&window.__tracks[0].unloaded&&window.__tracks[0].currentTime===0),true,'changing extensions unloads the track');
      await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true);assert.deepEqual(errors,[]);await context.close();
    }
    // Saved mute is respected; autoplay rejection is retried only on interaction.
    for(const option of [{muted:true},{reject:true}]){
      const {context,page}=await setup(browser,base,{fake:true,...option});
      await page.clock.install({time:new Date('2026-11-05T18:00:00Z')});await page.clock.pauseAt(new Date('2026-11-05T18:00:01Z'));
      await page.evaluate(()=>Extensiones.abrirJuego('gira-encaja'));await page.clock.runFor(500);
      if(option.muted){assert.equal(await page.evaluate(()=>window.__tracks.length),0);await page.locator('.ge-sound').click();}
      else{assert.equal(await page.evaluate(()=>window.__tracks[0].plays),1,'no retry storm');await page.locator('[data-start]').click();}
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),false);await context.close();
    }
    // A pending play promise cannot restart audio after leaving the extension.
    {
      const {context,page}=await setup(browser,base,{fake:true,deferred:true});await open(page);await page.evaluate(()=>Extensiones.cerrar());
      await page.evaluate(async()=>{window.__resolve();await Promise.resolve();await Promise.resolve();});
      assert.equal(await page.evaluate(()=>window.__tracks[0].paused),true);await context.close();
    }
    console.log('PASS soundtrack: native MP3 decode/play/loop, HUD, all stages, mute preference/control, pause/background, single instance, navigation cleanup, autoplay recovery and pending-play cleanup');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
