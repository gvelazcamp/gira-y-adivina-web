/* Sala TV real entre dos pestañas: Giro no puede responder por el jugador.
   BROWSER_EXECUTABLE=/usr/bin/chromium node tests/tele-rosco-giro-microfono.cjs */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,"http://local").pathname.replace(/^\//,""));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    const context=await browser.newContext({serviceWorkers:"block"});
    const tv=await context.newPage(),phone=await context.newPage(),errors=[];
    for(const p of [tv,phone]){
      p.on("pageerror",e=>errors.push(e.message));
      await p.route("**/*",r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:""}));
    }
    await tv.addInitScript(()=>{
      window.GiroRoscoPiloto={habilitado:()=>false,reaccion(tipo,aro,done){window.__giroFin=done;window.__giroTipo=tipo;},cerrar(){}};
    });
    await phone.addInitScript(()=>{
      localStorage.setItem("gya_tele_mic","1");
      window.__microfonos=[];
      window.SpeechRecognition=class{
        start(){window.__microfonos.push(this);setTimeout(()=>this.onaudiostart?.(),0);}
        abort(){this.__abortado=true;this.onend?.();}
      };
    });
    await tv.goto(base+"/index.html?tele=1&telered=local",{waitUntil:"load"});
    const code=await tv.locator(".tl-codigo").textContent();
    await phone.goto(base+"/index.html?telecel="+code+"&telered=local&n=Gonzalo",{waitUntil:"load"});
    await tv.waitForFunction(()=>document.querySelector(".tl-jugadores")?.textContent.includes("Gonzalo"));
    await tv.locator('[data-j="rosco"]').click();
    await phone.waitForFunction(()=>document.querySelector("#tlDcMic")?.textContent.includes("Te escucho"),null,{timeout:10000});
    const primera=await phone.locator(".tl-cel-letra").textContent();
    await phone.locator("#tlTexto").fill("ESTATUA");
    await phone.locator("#tlEnviar").click();
    await phone.waitForFunction(()=>document.querySelector("#tlDcMic")?.textContent.includes("Giro está hablando"));
    assert.equal(await tv.evaluate(()=>window.__giroTipo),"error");
    assert(await phone.evaluate(()=>window.__microfonos.at(-1).__abortado),"El celular siguió escuchando a Giro");
    const antes=await tv.locator(".tl-mal").last().textContent();
    const reloj=await tv.locator("#tlReloj").textContent();
    await phone.waitForTimeout(900);
    assert.equal(await tv.locator("#tlReloj").textContent(),reloj,"Giro consumió tiempo del jugador");
    await phone.evaluate(cod=>{
      const bc=new BroadcastChannel("gya/tele/"+cod);
      bc.postMessage({pid:sessionStorage.getItem("gya_tele_pid"),t:"accion",a:"dc_voz",l:[{alts:["Qué lástima"],isFinal:true}]});
      bc.close();
    },code);
    await phone.waitForTimeout(250);
    assert.equal(await tv.locator(".tl-mal").last().textContent(),antes,"La voz de Giro contó como otro error");
    await tv.evaluate(()=>window.__giroFin());
    await phone.waitForFunction(()=>document.querySelector("#tlDcMic")?.textContent.includes("Te escucho"),null,{timeout:4000});
    assert.notEqual(await phone.locator(".tl-cel-letra").textContent(),primera,"No avanzó la letra");
    await phone.waitForTimeout(300);
    await phone.evaluate(cod=>{
      const bc=new BroadcastChannel("gya/tele/"+cod);
      bc.postMessage({pid:sessionStorage.getItem("gya_tele_pid"),t:"accion",a:"dc_voz",l:[{alts:["Qué lástima"],isFinal:true}]});
      bc.close();
    },code);
    await phone.waitForTimeout(250);
    assert.equal(await tv.locator(".tl-mal").last().textContent(),antes,"El eco tardío de Giro contó como error");
    assert.equal(errors.length,0,errors.join("\n"));
    console.log("PASS: TV pausa micrófono y reloj durante Giro, ignora su voz y reanuda en la siguiente letra");
    await context.close();
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
