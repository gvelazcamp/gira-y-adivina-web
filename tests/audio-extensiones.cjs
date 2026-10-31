/* Al cambiar directamente de extensión, solo suena el juego actual.
   BROWSER_EXECUTABLE=/usr/bin/chromium node tests/audio-extensiones.cjs */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const requested=new URL(req.url,"http://local").pathname;
  const file=path.join(root,requested==="/"?"index.html":requested);
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
    const context=await browser.newContext({serviceWorkers:"block",locale:"es-UY"});
    const page=await context.newPage();
    await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
    await page.addInitScript(()=>{
      localStorage.setItem("gya_nombre","Vale");
      localStorage.setItem("gya_avatar","avatar-01");
      localStorage.setItem("gya_pais","uruguay");
      localStorage.setItem("gya_bienvenida_vista","1");
      window.GIRO_ROSCO_PILOTO=false;
      window.__audios=[];
      window.Audio=class{
        constructor(src=""){this.src=src;this.paused=true;this.dataset={};this.volume=1;window.__audios.push(this);}
        play(){this.paused=false;return Promise.resolve();}
        pause(){this.paused=true;}
        addEventListener(){}
      };
      Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
        cancel(){},getVoices(){return[];},speak(u){setTimeout(()=>u.onend?.(),0);}
      }});
    });
    await page.goto(base,{waitUntil:"load"});
    await page.waitForFunction(()=>!!window.Extensiones&&!!window.RoscoRioplatense);
    const estado=await page.evaluate(()=>{
      document.querySelector("#splash")?.remove();
      document.documentElement.classList.remove("cargando");
      sincronizarMusica();
      const principal=window.__audios.find(a=>a.src.includes("musica-menu"));
      if(!principal||principal.paused)throw Error("No arrancó la música principal");
      document.documentElement.classList.add("tele-modo");
      sincronizarMusica();
      if(!principal.paused)throw Error("La TV dejó sonando la música del menú");
      document.documentElement.classList.remove("tele-modo");
      sincronizarMusica();
      Extensiones.abrirJuego("sopa-fugaz");
      const sopa=window.__audios.find(a=>a.src.includes("sopa-fugaz-musica"));
      if(!principal.paused||!sopa||sopa.paused)throw Error("La sopa no apagó la música principal");
      Extensiones.abrirJuego("rosco-rioplatense");
      const rosco=window.__audios.find(a=>a.src.includes("rosco-rioplatense-musica"));
      return {principal:principal.paused,sopa:sopa.paused,rosco:!!rosco&&!rosco.paused};
    });
    assert.deepEqual(estado,{principal:true,sopa:true,rosco:true});
    await page.evaluate(()=>{window.GIRO_ROSCO_PILOTO=true;});
    await page.addScriptTag({url:base+"/giro-rosco-piloto.js?v=39"});
    const giro=await page.evaluate(()=>{
      document.querySelector(".rr-game")?.classList.add("rr-estudio");
      GiroRoscoPiloto.reaccion("acierto");
      const audio=window.__audios.find(a=>a.src.includes("voz/reacciones/"));
      if(!audio||audio.paused)throw Error("No arrancó la reacción de Giro");
      GiroRoscoPiloto.detenerReaccion();
      return audio.paused;
    });
    assert.equal(giro,true);
    await page.goto(base+"/?tele=1&telered=local",{waitUntil:"load"});
    await page.waitForFunction(()=>document.documentElement.classList.contains("tele-modo")&&!!document.querySelector("#teleTV"));
    const teleSilenciosa=await page.evaluate(()=>{
      sincronizarMusica();
      return window.__audios.filter(a=>/musica-(menu|partida|bonus)/.test(a.src)&&!a.paused).length;
    });
    assert.equal(teleSilenciosa,0,"La TV no debe oír la música del juego principal");
    await context.close();
    console.log("PASS: TV sin música del menú; una extensión activa; Giro se calla antes de la pista");
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
