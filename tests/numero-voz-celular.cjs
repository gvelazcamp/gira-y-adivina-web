/* Partida completa con un solo celular, sin sala TV. Voz simulada. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},locale:'es-UY',hasTouch:true,isMobile:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
    await page.addInitScript(()=>{
      localStorage.setItem('gya_nombre','Ana');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');localStorage.setItem('gya_tele_mic','1');
      localStorage.setItem('gya_que_numero_soy',JSON.stringify({max:50,rondas:7,nombres:['Ana','Beto']}));
      window.__offset=0;const now=performance.now.bind(performance);performance.now=()=>now()+window.__offset;
      window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{speak(u){window.__spoken.push(u);},cancel(){},getVoices(){return[];},addEventListener(){}}});
      window.__mics=[];window.SpeechRecognition=class{start(){window.__mics.push(this);setTimeout(()=>{if(!this.aborted){this.onstart?.();this.onaudiostart?.();}},0);}abort(){this.aborted=true;this.onend?.();}};
    });
    await page.goto(base+'/index.html');await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.documentElement.requestFullscreen=()=>Promise.resolve();window.sonidoPermitido=()=>true;Extensiones.abrirJuego('que-numero-soy');});
    assert(!(await page.locator('.pf-bienv').textContent()).match(/1 a (10|50|100)/));await page.locator('.pf-bienv-ok').click();
    assert.equal(await page.locator('[data-max],#qnsRangos,#qnsEmpezar').count(),0);assert.equal(await page.locator('.nv-local [data-nv-name]').count(),2);assert.equal(await page.locator('[data-qns-tv]').count(),1);
    const fichas=await page.evaluate(()=>localStorage.getItem('gya_fichas_ext'));
    await page.locator('.nv-local [data-nv-config]').click();await page.locator('.nv-local [data-nv-start]').click();
    await page.locator('.nv-local-count').waitFor();assert.equal(await page.locator('.nv-answer').count(),0,'answer is concealed while turning the phone');assert.equal(await page.evaluate(()=>window.__spoken.length),0);
    await page.waitForTimeout(1100);assert.equal(await page.locator('.nv-local-count b').textContent(),'2');assert.equal(await page.locator('.nv-answer').count(),0);
    await page.locator('.nv-local-play .nv-answer').waitFor();assert.equal(await page.locator('.nv-local-play .nv-answer').textContent(),'1939');await page.waitForFunction(()=>window.__spoken.length===1);assert(!(await page.evaluate(()=>window.__spoken[0].text)).includes('1939'));
    const fits=async selector=>{const r=await page.locator(selector).evaluate(el=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,vw:innerWidth,vh:innerHeight};});assert(r.x>=-1&&r.y>=-1&&r.x+r.w<=r.vw+1&&r.y+r.h<=r.vh+1,selector+' '+JSON.stringify(r));};
    for(const [w,h] of [[390,844],[360,640],[844,390],[700,320]]){
      await page.setViewportSize({width:w,height:h});await fits('.nv-local-play .nv-answer');await fits('.nv-local-actions');await fits('.nv-local-play .nv-question');await page.screenshot({path:'/tmp/numero-local-'+w+'x'+h+'.png'});
    }
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__spoken.at(-1).onend());await page.waitForFunction(()=>window.__mics.some(m=>!m.aborted));
    const answer=async text=>page.evaluate(text=>{const r=[{transcript:text}];r.isFinal=true;window.__mics.at(-1).onresult({resultIndex:0,results:[r]});},text);
    await answer('mil novecientos treinta y nueve');await page.waitForFunction(()=>document.querySelector('.nv-local-play header span')?.textContent.includes('1 acierto'));assert(await page.evaluate(()=>window.__mics[0].aborted));
    await page.waitForFunction(()=>window.__spoken.length===2);await page.evaluate(()=>window.__spoken.at(-1).onend());await page.waitForFunction(()=>window.__mics.filter(m=>!m.aborted).length===1);
    await answer('paso');await page.waitForFunction(()=>window.__spoken.length===3);assert((await page.locator('.nv-local-play header span').textContent()).includes('1 acierto'));await page.evaluate(()=>window.__spoken.at(-1).onend());await page.locator('[data-qns-ok]').click();await page.waitForFunction(()=>document.querySelector('.nv-local-play header span')?.textContent.includes('2 aciertos'));
    // Pausa oculta el número antes de volver a mirar el celular.
    await page.locator('[data-qns-pause]').click();await page.locator('[data-nv-resume]').waitFor();assert.equal(await page.locator('.nv-local-play').isVisible(),false);assert(await page.evaluate(()=>window.__mics.every(m=>m.aborted)));
    await page.locator('[data-nv-resume]').click();await page.locator('.nv-local-count').waitFor();assert.equal(await page.locator('.nv-local-play .nv-answer').count(),0);await page.locator('.nv-local-play .nv-answer').waitFor();await page.waitForFunction(()=>window.__spoken.length===4);await page.evaluate(()=>window.__spoken.at(-1).onend());
    await page.evaluate(()=>window.__offset+=31000);await page.locator('[data-nv-next]').waitFor();assert.equal(await page.locator('.nv-local-play').isVisible(),false);
    await page.locator('[data-nv-next]').click();assert((await page.locator('.nv-local-controls h2').textContent()).includes('Beto'));
    await page.locator('[data-nv-manual]').click();await page.locator('.nv-local-play .nv-answer').waitFor();await page.waitForFunction(()=>window.__spoken.length===5);await page.evaluate(()=>window.__spoken.at(-1).onend());await page.locator('[data-qns-ok]').click();await page.waitForFunction(()=>document.querySelector('.nv-local-play header span')?.textContent.includes('1 acierto'));
    await page.evaluate(()=>window.__offset+=31000);await page.locator('[data-nv-next]').waitFor();await page.locator('[data-nv-next]').click();await page.locator('[data-nv-again]').waitFor();assert((await page.locator('.nv-local-controls').textContent()).includes('Más aciertos: Ana'));
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gya_que_numero_soy')).rondas),8,'old rounds preserved and one round added');assert.equal(await page.evaluate(()=>localStorage.getItem('gya_fichas_ext')),fichas);
    await page.locator('[data-nv-again]').click();await page.locator('[data-nv-start]').click();await page.locator('.nv-local-count').waitFor();await page.evaluate(()=>Extensiones.cerrar());await page.waitForTimeout(3300);assert.equal(await page.locator('.nv-local-play').count(),0);assert(await page.evaluate(()=>window.__mics.every(m=>m.aborted)));
    // Reabrir conserva jugadores; cerrar durante lectura anula la locución y su callback.
    await page.evaluate(()=>Extensiones.abrirJuego('que-numero-soy'));await page.locator('.pf-bienv-ok').click();assert.equal(await page.locator('[data-nv-name]').count(),2);await page.locator('[data-nv-config]').click();await page.locator('[data-nv-start]').click();await page.locator('.nv-local-play .nv-answer').waitFor();await page.waitForFunction(()=>window.__spoken.length>=6);await page.evaluate(()=>{window.__late=window.__spoken.at(-1).onend;Extensiones.cerrar();window.__late?.();});assert.equal(await page.locator('.nv-local-play').count(),0);
    // Sin reconocimiento se puede marcar; respuesta de cinco dígitos y segundo plano.
    await page.evaluate(()=>{delete window.SpeechRecognition;delete window.webkitSpeechRecognition;window.NUMERO_VOZ_DATOS=[{id:'fixture-largo',pregunta:'¿Cuántos minutos suman los siete días de una semana?',respuesta:10080}];Extensiones.abrirJuego('que-numero-soy');});await page.locator('.pf-bienv-ok').click();await page.locator('[data-nv-config]').click();await page.locator('[data-nv-start]').click();await page.locator('.nv-local-play .nv-answer').waitFor();
    assert.equal(await page.locator('.nv-local-play .nv-answer').textContent(),'10080');await page.setViewportSize({width:360,height:640});await fits('.nv-local-play .nv-answer');await page.waitForFunction(()=>window.__spoken.at(-1)?.onend);await page.evaluate(()=>window.__spoken.at(-1).onend());await page.locator('[data-qns-ok]:enabled').waitFor();
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.locator('[data-nv-resume]').waitFor();assert.equal(await page.locator('.nv-local-play').isVisible(),false);
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.locator('[data-nv-resume]').click();await page.locator('[data-qns-cancel]').click();assert.equal(await page.locator('.nv-local-play').isVisible(),false);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await page.locator('.nv-local').count(),0);
    assert.deepEqual(errors,[]);await context.close();console.log('PASS single phone: no ranges, concealed countdown, question-only voice, spoken answers/pass/correction, shared 30 seconds, two-player winner, historical rounds, four sizes, manual fallback, background pause and cleanup');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
