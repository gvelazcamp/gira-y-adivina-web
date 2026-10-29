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
  res.setHeader('Content-Type',{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream');
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
    await page.evaluate(()=>window.__mics.at(-1).emit('paso'));
    await page.waitForFunction(()=>phase==='transition'&&players[0].errors===1,null,{timeout:1000});
    assert.match(await page.locator('#score0').textContent(),/1 error/);
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
    await textPass.locator('#answer-input').fill('paso');
    await textPass.locator('#answer-submit').click();
    await textPass.waitForFunction(()=>phase==='transition'&&players[0].errors===1,null,{timeout:1000});
    await textPass.close();
    console.log('PASS Duelo: narración y reloj pausado, alternancia BOT/humano, respuesta hablada, paso por voz y texto, sin micrófono');
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
