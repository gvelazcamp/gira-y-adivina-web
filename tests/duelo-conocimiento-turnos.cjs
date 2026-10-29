const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    const page=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await page.addInitScript(()=>{
      Math.random=()=>.1;
      window.__mics=[];window.__tones=[];window.__spoken=[];
      class FakeRecognition{
        constructor(){this.running=false;window.__mics.push(this)}
        start(){this.running=true;setTimeout(()=>{if(this.running)this.onstart?.()},100);setTimeout(()=>{if(this.running)this.onaudiostart?.()},450)}
        abort(){this.running=false;this.onend?.()}
        emit(text){this.onresult?.({resultIndex:0,results:[{0:{transcript:text},length:1,isFinal:true}]})}
      }
      class FakeAudioContext{
        constructor(){this.currentTime=0}
        createOscillator(){const oscillator={frequency:{value:0},connect(){},start(){window.__tones.push(this.frequency.value)},stop(){}};return oscillator}
        createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
      }
      window.SpeechRecognition=FakeRecognition;
      window.webkitSpeechRecognition=FakeRecognition;
      window.AudioContext=FakeAudioContext;
      window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(utterance){window.__spoken.push(utterance.text);setTimeout(()=>utterance.onend?.(),20)},cancel(){}}});
      Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
    });
    await page.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    assert.equal(await page.evaluate(()=>isCorrectSpeech('Inglaterra','gb')),false,'Inglaterra no corresponde a la bandera del Reino Unido');
    assert.equal(await page.evaluate(()=>isCorrectSpeech('Reino Unido','gb')),true);
    await page.locator('#input0').fill('Gonzalo');
    await page.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
    await page.locator('#setup-form button[type=submit]').click();
    await page.waitForFunction(()=>phase==='announcing'&&active===0,null,{timeout:10000});
    const before=await page.evaluate(()=>({ms:players[0].ms,button:document.querySelector('#pass-button').disabled,turn:document.querySelector('#active-turn-banner').textContent}));
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(()=>players[0].ms),before.ms,'el reloj espera mientras se lee la pregunta');
    assert.equal(before.button,true,'no se puede responder antes de la narración');
    assert.match(before.turn,/Gonzalo/i);
    assert.equal(await page.evaluate(()=>window.__mics.some(m=>m.running)),false,'el micrófono aún no escucha la narración');
    await page.waitForFunction(()=>phase==='waiting-mic'&&active===0,null,{timeout:10000});
    const beforeMic=await page.evaluate(()=>players[0].ms);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>players[0].ms),beforeMic,'el reloj espera hasta que se activa el micrófono');
    await page.waitForFunction(()=>phase==='playing'&&active===0&&window.__mics.some(m=>m.running),null,{timeout:10000});
    assert((await page.evaluate(()=>window.__spoken)).some(s=>s.includes('¿Cuánto da')),'la pregunta se narra en voz alta');
    assert.equal(await page.locator('#name1').textContent(),'SOFÍA');
    assert.equal(await page.locator('#sound-text').textContent(),'ON');
    await page.evaluate(()=>{question={...question,category:'banderas',code:'pt',answer:'Portugal'};window.__mics.at(-1).emit('Portugal')});
    await page.waitForFunction(()=>phase==='playing'&&active===1,null,{timeout:12000});
    const bot=await page.evaluate(()=>({
      name:players[1].name,score:players[0].score,disabled:document.querySelector('#answer-input').disabled,
      focused:document.activeElement?.id==='answer-input',micRunning:window.__mics.some(m=>m.running),
      feedback:document.querySelector('#feedback').textContent,tones:window.__tones
    }));
    assert.equal(bot.name,'Sofía');
    assert.equal(bot.score,1);
    assert.equal(bot.disabled,true,'el bot no habilita la respuesta humana');
    assert.equal(bot.focused,false,'el bot no abre el teclado del celular');
    assert.equal(bot.micRunning,false,'el micrófono se pausa en el turno del bot');
    assert.match(bot.feedback,/Sofía está pensando/);
    assert(bot.tones.includes(440),'sonido de turno del bot');
    await page.evaluate(()=>window.__mics[0].emit(question.answer));
    assert.equal(await page.evaluate(()=>players[1].score),0,'audio antiguo no responde por el bot');
    await page.waitForFunction(()=>phase==='playing'&&active===0&&players[1].score===1&&window.__mics.some(m=>m.running),null,{timeout:16000});
    const human=await page.evaluate(()=>({score:players[0].score,botScore:players[1].score,tones:window.__tones}));
    assert.equal(human.score,1);
    assert.equal(human.botScore,1);
    assert(human.tones.includes(740),'sonido distinto al volver al jugador');
    assert((await page.evaluate(()=>window.__spoken)).some(s=>s.includes('Sofía responde:')),'el bot dice su respuesta');
    await page.evaluate(()=>window.__mics[0].emit(question.answer));
    assert.equal(await page.evaluate(()=>players[0].score),1,'audio del turno anterior no responde la pregunta nueva');
    await page.evaluate(()=>{question={...question,category:'banderas',code:'pt',answer:'Portugal'}});
    await page.evaluate(()=>window.__mics.at(-1).emit('paso'));
    await page.waitForFunction(()=>phase==='transition'&&players[0].errors===1,null,{timeout:1000});
    assert.match(await page.locator('#score0').textContent(),/1 error/);
    assert.match(await page.locator('#feedback').textContent(),/Era Portugal/);
    assert((await page.evaluate(()=>window.__spoken)).some(s=>s.includes('La bandera era Portugal')),'al pasar se dice el país correcto');
    await page.close();

    const second=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await second.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await second.addInitScript(()=>{Math.random=()=>.9});
    await second.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await second.locator('#input0').fill('Gonzalo');
    await second.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
    await second.locator('[data-answer=text]').click();
    await second.locator('#setup-form button[type=submit]').click();
    await second.waitForFunction(()=>phase==='playing'&&active===1,null,{timeout:10000});
    assert.equal(await second.locator('#answer-input').isDisabled(),true,'Sofía empieza sin abrir el teclado humano');
    assert.match(await second.locator('#feedback').textContent(),/Sofía está pensando/);
    await second.waitForFunction(()=>phase==='playing'&&active===0&&players[1].score===1,null,{timeout:16000});
    await second.locator('#answer-input').fill(await second.evaluate(()=>question.answer));
    await second.locator('#answer-submit').click();
    await second.waitForFunction(()=>players[0].score===1,null,{timeout:1000});
    await second.close();

    const noVoice=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await noVoice.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await noVoice.addInitScript(()=>{Math.random=()=>.1;window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined});
    await noVoice.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await noVoice.locator('#input0').fill('Gonzalo');
    await noVoice.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
    await noVoice.locator('#setup-form button[type=submit]').click();
    await noVoice.waitForFunction(()=>phase==='playing'&&active===0,null,{timeout:10000});
    assert.equal(await noVoice.locator('#dc-answer').inputValue(),'text','sin micrófono permite escribir');
    await noVoice.locator('#answer-input').fill(await noVoice.evaluate(()=>question.answer));
    await noVoice.locator('#answer-submit').click();
    await noVoice.waitForFunction(()=>players[0].score===1,null,{timeout:1000});
    await noVoice.close();
    const textPass=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await textPass.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await textPass.addInitScript(()=>{Math.random=()=>.1});
    await textPass.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await textPass.locator('#input0').fill('Gonzalo');
    await textPass.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='matematica'));
    await textPass.locator('[data-answer=text]').click();
    await textPass.locator('#setup-form button[type=submit]').click();
    await textPass.waitForFunction(()=>phase==='playing'&&active===0,null,{timeout:10000});
    await textPass.evaluate(()=>{question={...question,category:'banderas',code:'pt',answer:'Portugal'}});
    await textPass.locator('#answer-input').fill('Argentina');
    await textPass.locator('#answer-submit').click();
    await textPass.waitForFunction(()=>phase==='transition'&&players[0].errors===1,null,{timeout:1000});
    assert.match(await textPass.locator('#feedback').textContent(),/Era Portugal/);
    assert.match(await textPass.locator('#mic-heard').textContent(),/Portugal/);
    await textPass.close();
    const wrongVoice=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await wrongVoice.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await wrongVoice.addInitScript(()=>{
      Math.random=()=>.1;window.__mics=[];
      class FakeRecognition{
        constructor(){this.running=false;window.__mics.push(this)}
        start(){this.running=true;setTimeout(()=>{if(this.running)this.onstart?.()},20);setTimeout(()=>{if(this.running)this.onaudiostart?.()},40)}
        abort(){this.running=false;this.onend?.()}
        emit(text){this.onresult?.({resultIndex:0,results:[{0:{transcript:text},length:1,isFinal:true}]})}
      }
      window.SpeechRecognition=FakeRecognition;window.webkitSpeechRecognition=FakeRecognition;
      window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
      Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(u){setTimeout(()=>u.onend?.(),20)},cancel(){}}});
    });
    await wrongVoice.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await wrongVoice.locator('#input0').fill('Gonzalo');
    await wrongVoice.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='banderas'));
    await wrongVoice.locator('#setup-form button[type=submit]').click();
    await wrongVoice.waitForFunction(()=>phase==='playing'&&active===0&&window.__mics.some(m=>m.running),null,{timeout:10000});
    await wrongVoice.evaluate(()=>{question={...question,category:'banderas',code:'pt',answer:'Portugal'};window.__mics.at(-1).emit('ruido')});
    assert.equal(await wrongVoice.evaluate(()=>players[0].errors),0,'un ruido del micrófono no cuenta como respuesta');
    await wrongVoice.evaluate(()=>window.__mics.at(-1).emit('Argentina'));
    await wrongVoice.waitForFunction(()=>phase==='transition'&&players[0].errors===1,null,{timeout:1000});
    assert.match(await wrongVoice.locator('#feedback').textContent(),/Era Portugal/);
    await wrongVoice.evaluate(()=>resetToConfig());
    await wrongVoice.locator('#input0').fill('Gonzalo');
    await wrongVoice.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='videojuegos'));
    await wrongVoice.locator('#setup-form button[type=submit]').click();
    await wrongVoice.waitForFunction(()=>phase==='playing'&&active===0&&question.category==='videojuegos'&&window.__mics.some(m=>m.running),null,{timeout:10000});
    assert.equal(await wrongVoice.locator('#quiz-image').isVisible(),true);
    await wrongVoice.evaluate(()=>window.__mics.at(-1).emit(question.answer));
    await wrongVoice.waitForFunction(()=>players[0].score===1,null,{timeout:1000});
    await wrongVoice.evaluate(()=>resetToConfig());
    await wrongVoice.locator('#input0').fill('Gonzalo');
    await wrongVoice.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='ciudades'));
    await wrongVoice.locator('#setup-form button[type=submit]').click();
    await wrongVoice.waitForFunction(()=>phase==='playing'&&active===0&&question.category==='ciudades'&&window.__mics.some(m=>m.running),null,{timeout:10000});
    const voiceCity=await wrongVoice.evaluate(()=>question.answer);
    await wrongVoice.evaluate(()=>window.__mics.at(-1).emit(question.answer==='París'?'Londres':'París'));
    await wrongVoice.waitForFunction(()=>phase==='transition'&&players[0].errors===1,null,{timeout:1000});
    assert((await wrongVoice.locator('#feedback').textContent()).includes(voiceCity),'el error hablado revela la ciudad correcta');
    await wrongVoice.close();
    const categories=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await categories.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await categories.addInitScript(()=>{Math.random=()=>.1;window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined});
    await categories.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    assert.equal(await categories.locator('input[value=ciudades]').count(),1);
    assert.equal(await categories.locator('input[value=simpsons]').count(),0);
    assert.deepEqual(await categories.evaluate(()=>[IMAGE_ITEMS.ciudades.length,IMAGE_ITEMS.videojuegos.length]),[64,62]);
    assert.equal(await categories.evaluate(()=>Object.entries(IMAGE_ITEMS).every(([category,items])=>items.every(item=>openAnswer(item.answer,category)?.name===item.answer))),true,'cada imagen tiene una respuesta reconocible');
    assert.equal(await categories.evaluate(()=>Object.entries(IMAGE_ITEMS).every(([category,items])=>new Set(items.map(item=>category+':'+normalize(item.answer))).size===items.length)),true,'no hay respuestas visuales duplicadas');
    assert.match(await categories.locator('#image-pool-status').textContent(),/Ciudades 64\/64 · Videojuegos 62\/62/);
    await categories.locator('#input0').fill('Gonzalo');
    await categories.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='ciudades'));
    await categories.locator('[data-answer=text]').click();
    await categories.locator('#setup-form button[type=submit]').click();
    await categories.waitForFunction(()=>phase==='playing'&&active===0&&question.category==='ciudades',null,{timeout:10000});
    assert.match(await categories.locator('#question-title').textContent(),/QUÉ CIUDAD/);
    assert.equal(await categories.locator('#quiz-image').isVisible(),true,'la ciudad se muestra en una imagen');
    assert.match(await categories.locator('#quiz-image').getAttribute('style'),/ciudades-atlas\.png/);
    const cityAnswer=await categories.evaluate(()=>question.answer);
    assert.equal(await categories.evaluate(()=>imageRemaining('ciudades')),63);
    assert.equal(await categories.evaluate(()=>JSON.parse(localStorage.getItem(IMAGE_HISTORY_KEY)).length),1);
    await categories.locator('#answer-input').fill(cityAnswer);
    await categories.locator('#answer-submit').click();
    await categories.waitForFunction(()=>players[0].score===1,null,{timeout:1000});
    assert((await categories.locator('#feedback').textContent()).includes(cityAnswer));
    assert.equal(await categories.locator('#dots0 .dot.on').count(),1,'el acierto deja un ✓ en la tanda');
    assert.equal(await categories.evaluate(()=>isRightAnswer('Londres',{category:'ciudades',answer:'París'})),false,'la foto de París no acepta otra ciudad');
    await categories.waitForFunction(()=>players[1].score===1||players[1].errors===1,null,{timeout:16000});
    assert.equal(await categories.evaluate(()=>[...askedQuestions].filter(key=>key.startsWith('ciudades:')).length),2,'el bot recibe otra imagen');
    await categories.reload({waitUntil:'load'});
    assert.equal(await categories.evaluate(()=>imageRemaining('ciudades')),62,'el historial persiste al recargar');
    await categories.locator('#input0').fill('Gonzalo');
    await categories.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='ciudades'));
    await categories.locator('#setup-form button[type=submit]').click();
    await categories.waitForFunction(()=>phase==='playing'&&active===0&&question.category==='ciudades',null,{timeout:10000});
    assert.notEqual(await categories.evaluate(()=>question.answer),cityAnswer,'otra partida no repite la ciudad vista');
    await categories.evaluate(()=>resetToConfig());
    await categories.locator('#input0').fill('Gonzalo');
    await categories.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='videojuegos'));
    await categories.locator('#setup-form button[type=submit]').click();
    await categories.waitForFunction(()=>phase==='playing'&&active===0&&question.category==='videojuegos',null,{timeout:10000});
    assert.match(await categories.locator('#question-title').textContent(),/VIDEOJUEGO/);
    assert.equal(await categories.locator('#quiz-image').isVisible(),true,'el videojuego se muestra en una imagen');
    assert.match(await categories.locator('#quiz-image').getAttribute('style'),/videojuegos-atlas\.png/);
    assert.equal(await categories.evaluate(()=>openAnswer('Mario Kart','videojuegos').name),'Mario Kart','se distingue Mario Kart de Super Mario');
    const videoAnswer=await categories.evaluate(()=>question.answer);
    const wrongVideo=videoAnswer==='Minecraft'?'Tetris':'Minecraft';
    await categories.locator('#answer-input').fill(wrongVideo);
    await categories.locator('#answer-submit').click();
    await categories.waitForFunction(()=>phase==='transition'&&players[0].errors===1,null,{timeout:1000});
    assert((await categories.locator('#feedback').textContent()).includes(videoAnswer),'un error revela el videojuego correcto');
    assert.match(await categories.locator('#feedback').textContent(),/RESPUESTA ERRÓNEA/);
    assert.equal(await categories.locator('#dots0 .dot.miss').count(),1,'el error deja una ✕ roja');
    await categories.evaluate(()=>finish(1,'Prueba de resultados'));
    assert.equal(await categories.locator('#result-review .review-row.miss').count(),1);
    assert((await categories.locator('#result-review').textContent()).includes(videoAnswer),'el resultado muestra la respuesta correcta');
    assert((await categories.locator('#result-review').textContent()).includes(wrongVideo),'el resultado muestra la respuesta dada');
    await categories.close();
    const exhausted=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await exhausted.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await exhausted.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await exhausted.evaluate(()=>{localStorage.setItem(IMAGE_HISTORY_KEY,JSON.stringify(IMAGE_ITEMS.ciudades.map(item=>'ciudades:'+normalize(item.answer))))});
    await exhausted.reload({waitUntil:'load'});
    assert.equal(await exhausted.evaluate(()=>imageRemaining('ciudades')),0);
    await exhausted.locator('#input0').fill('Gonzalo');
    await exhausted.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='ciudades'));
    await exhausted.locator('#setup-form button[type=submit]').click();
    assert.match(await exhausted.locator('#setup-voice-error').textContent(),/Elegí otra categoría/,'no inicia si solo quedan imágenes vistas');
    await exhausted.close();
    const passCase=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    await passCase.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.fulfill({status:200,body:''}));
    await passCase.addInitScript(()=>{Math.random=()=>.1;window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined});
    await passCase.goto('http://127.0.0.1:'+server.address().port+'/duelo-conocimiento.html',{waitUntil:'load'});
    await passCase.locator('#input0').fill('Gonzalo');
    await passCase.locator('input[name=category]').evaluateAll(inputs=>inputs.forEach(input=>input.checked=input.value==='ciudades'));
    await passCase.locator('#setup-form button[type=submit]').click();
    await passCase.waitForFunction(()=>phase==='playing'&&active===0&&question.category==='ciudades',null,{timeout:10000});
    const passedAnswer=await passCase.evaluate(()=>question.answer);
    await passCase.locator('#pass-button').click();
    assert.equal(await passCase.locator('#dots0 .dot.miss').count(),1,'Pasapalabra deja una ✕');
    await passCase.evaluate(()=>finish(1,'Prueba de resumen'));
    assert.match(await passCase.locator('#result-review').textContent(),/Pasapalabra/);
    assert((await passCase.locator('#result-review').textContent()).includes(passedAnswer),'el pase conserva la solución para el resumen');
    await passCase.close();
    console.log('PASS Duelo: 64 ciudades, 62 videojuegos; sin Simpson ni repeticiones entre partidas');
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
