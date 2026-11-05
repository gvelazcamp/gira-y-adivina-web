const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,"http://local").pathname.replace(/\/$/,"/index.html")));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader("Content-Type",{".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png",".svg":"image/svg+xml"}[path.extname(file)]||"application/octet-stream");
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||"/usr/bin/chromium",args:["--no-sandbox"]});
  try{
    for(const name of ["Gonzalo","Vale","Romina"]){
      const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:"block"});
      const page=await context.newPage();
      const errors=[];page.on("pageerror",e=>errors.push(e.message));
      async function iniciarDuelo(){
        if(await page.locator(".pf-bienv-ok").count())await page.locator(".pf-bienv-ok").click();
        if(await page.locator(".ac-final[open]").count())await page.locator(".ac-final-primaria").click();
        else await page.locator(".ac-sortear").click();
      }
      async function comprobarPopup(titulo){
        assert(await page.locator(".ac-final").isVisible());
        assert.equal(await page.locator("dialog:modal").count(),1,"native modal is above the game");
        assert.match(await page.locator("#acFinalTitulo").textContent(),titulo);
        assert.equal(await page.locator(".ac-final .ac-escenario").count(),1,"the stage is part of the popup");
        assert(await page.locator(".ac-controles").isHidden(),"result is not below the stage");
        assert(await page.evaluate(()=>document.querySelector(".ac-final").contains(document.activeElement)),"focus inside the popup");
        for(const viewport of [{width:1280,height:900},{width:844,height:390},{width:390,height:736},{width:390,height:450},{width:360,height:640}]){
          await page.setViewportSize(viewport);
          await page.evaluate(()=>window.dispatchEvent(new Event("resize")));
          const m=await page.locator(".ac-final").evaluate(el=>({r:el.getBoundingClientRect().toJSON(),ancho:innerWidth,alto:innerHeight,scroll:el.scrollHeight-el.clientHeight}));
          assert(m.r.left>=0&&m.r.right<=m.ancho+1&&m.r.top>=0&&m.r.bottom<=m.alto+1&&m.scroll<=1,"popup fits: "+JSON.stringify({viewport,...m}));
        }
        await page.setViewportSize({width:1280,height:900});
      }

      await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
      await page.addInitScript(n=>{
        window.__musicasCaigo=[];
        const AudioNativo=window.Audio;
        window.Audio=function(src){
          if(String(src).includes("ahora-caigo-musica-v1.mp3")){
            const pista={src,paused:true,loop:false,volume:1,currentTime:0,playCount:0,pauseCount:0,
              play(){this.paused=false;this.playCount++;return Promise.resolve();},
              pause(){this.paused=true;this.pauseCount++;}};
            window.__musicasCaigo.push(pista);return pista;
          }
          return new AudioNativo(src);
        };
        window.__speechInstances=[];
        window.SpeechRecognition=class{
          constructor(){window.__speechInstances.push(this);}
          start(){this.started=true;}
          abort(){this.aborted=true;}
          emit(textos){this.onresult?.({results:[textos.map(transcript=>({transcript}))]});}
          fail(error){this.onerror?.({error});}
        };
        localStorage.setItem("gya_nombre",n);localStorage.setItem("gya_avatar","avatar-02");
        localStorage.setItem("gya_pais","uruguay");localStorage.setItem("gya_bienvenida_vista","1");
      },name);
      await page.goto(base,{waitUntil:"load"});
      await page.waitForFunction(()=>window.Extensiones&&window.AhoraCaigo);
      await page.clock.install({time:new Date("2026-11-04T12:00:00Z")});
      await page.clock.pauseAt(new Date("2026-11-04T12:00:01Z"));
      await page.evaluate(()=>{
        document.querySelector("#splash")?.remove();document.documentElement.classList.remove("cargando");
        Extensiones.abrirLobby();
      });
      assert.equal(await page.getByRole("button",{name:/No te caigas/}).count(),1,"catalog visibility (published for everyone)");
      await page.evaluate(()=>Extensiones.abrirJuego("no-te-caigas"));
      assert.equal(await page.locator(".ac-juego").count(),1,"direct entry for everyone");
      if(name!=="Romina"){
        assert.equal(await page.locator("#extTitulo").textContent(),"No te caigas");
        assert.equal(await page.locator(".ac-logo").getAttribute("alt"),"No te caigas");
        await page.waitForFunction(()=>document.querySelector(".ac-logo")?.naturalWidth>0);
      }
      if(name==="Romina"){
        await page.evaluate(()=>AhoraCaigo.abrir(document.getElementById("extContenido")));
        assert.equal(await page.locator(".ac-juego").count(),1,"module open for everyone");
        await context.close();continue;
      }
      if(name==="Vale"){
        assert.equal(await page.locator(".ac-principal .ac-nombre").textContent(),"Vale");
        await page.evaluate(()=>{Math.random=()=>0;});
        await iniciarDuelo();await page.clock.runFor(12000);
        assert.equal(await page.locator(".ac-identidad.ac-activo .ac-tu-nombre").textContent(),"Vale");
        assert.match(await page.locator(".ac-pasar").textContent(),/Pasar pregunta/);
        await page.locator(".ac-pasar").click();
        assert.equal(await page.locator(".ac-reloj b").textContent(),"20");
        assert.equal(await page.locator(".ac-vidas").textContent(),"2 pases");
        await page.evaluate(()=>Extensiones.cerrar());
        assert.deepEqual(errors,[],"no browser errors for Vale");
        await context.close();continue;
      }
      assert(await page.evaluate(()=>window.__musicasCaigo.length===1&&!window.__musicasCaigo[0].paused),"music plays on the entry screen");
      assert(await page.evaluate(()=>window.__musicasCaigo[0].loop&&window.__musicasCaigo[0].volume<=.3));
      assert.equal(await page.locator(".ac-participante").count(),11);
      assert.equal(await page.locator(".ac-principal .ac-nombre").textContent(),"Gonzalo");
      assert((await page.locator(".ac-principal .ac-avatar").getAttribute("src")).endsWith("avatar-02.webp"));
      // The rear pose only applies to Gonzalo's avatar in the centre.
      await page.evaluate(()=>{localStorage.setItem("gya_avatar","avatar-22");Extensiones.abrirJuego("ahora-caigo");});
      assert.equal(await page.locator(".ac-de-espaldas").count(),1);
      assert((await page.locator(".ac-principal .ac-avatar").getAttribute("src")).endsWith("avatar-22-espalda.webp"));
      assert(await page.locator(".ac-principal").evaluate(el=>
        +getComputedStyle(el.querySelector(".ac-avatar")).zIndex>+getComputedStyle(el.querySelector(".ac-atril")).zIndex),"podium behind rear-facing player");
      await page.waitForFunction(()=>[...document.querySelectorAll(".ac-juego img")].every(i=>i.complete&&i.naturalWidth>0));
      for(const viewport of [{width:1280,height:900},{width:844,height:390},{width:390,height:844}]){
        await page.setViewportSize(viewport);
        const layout=await page.evaluate(()=>{
          const s=document.querySelector(".ac-escenario").getBoundingClientRect();
          return{fits:s.right<=innerWidth&&s.left>=0,inside:[...document.querySelectorAll(".ac-participante")].every(p=>{
            const r=p.getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;
          })};
        });
        assert(layout.fits&&layout.inside,"all eleven figures fit: "+JSON.stringify(viewport));
      }
      await page.setViewportSize({width:1280,height:900});

      await page.evaluate(()=>{musicaOn=false;});await page.clock.runFor(250);
      assert(await page.evaluate(()=>window.__musicasCaigo[0].paused),"global mute pauses the track");
      await page.evaluate(()=>{musicaOn=true;});await page.clock.runFor(250);
      assert(await page.evaluate(()=>!window.__musicasCaigo[0].paused),"unmuting resumes entry music");
      await page.evaluate(()=>{
        Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"hidden"});
        document.dispatchEvent(new Event("visibilitychange"));
      });
      assert(await page.evaluate(()=>window.__musicasCaigo[0].paused),"hidden app pauses music");
      await page.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event("visibilitychange"));});
      assert(await page.evaluate(()=>!window.__musicasCaigo[0].paused),"visible entry screen resumes music");
      await page.evaluate(()=>{window.__randomOriginal=Math.random;Math.random=()=>.99;});
      await iniciarDuelo();
      assert(await page.locator(".ac-sortear").isDisabled());
      assert(await page.evaluate(()=>!window.__musicasCaigo[0].paused),"music accompanies the draw");
      await page.evaluate(()=>{Math.random=()=>0;});
      await page.clock.runFor(12000);
      await page.evaluate(()=>{Math.random=()=>.99;});
      assert.equal(await page.locator(".ac-elegido .ac-nombre").textContent(),"10");
      assert.equal(await page.locator(".ac-iluminado").count(),1);
      assert(await page.locator(".ac-duelo").isVisible());
      assert.equal(await page.locator(".ac-turno-texto").textContent(),"TE TOCA");
      assert(await page.evaluate(()=>window.__musicasCaigo[0].paused),"player questions are silent");
      assert.equal(await page.locator(".ac-identidad.ac-activo").count(),1);
      assert.equal(await page.locator(".ac-identidad.ac-activo .ac-tu-nombre").textContent(),"Gonzalo");
      assert.equal(await page.locator(".ac-identidad.ac-activo").getAttribute("aria-current"),"true");
      const pista=await page.locator(".ac-pregunta").textContent();
      const ayuda=await page.locator(".ac-visible").count(),total=await page.locator(".ac-letra").count();
      assert(ayuda>0&&ayuda<total,"some letters revealed, never the whole answer");
      async function comprobarPantalla(viewport){
        await page.setViewportSize(viewport);
        await page.evaluate(()=>window.dispatchEvent(new Event("resize")));
        assert(await page.locator(".ac-escenario").isHidden(),"only the question panel during a duel");
        assert(await page.locator(".ac-cabecera").isHidden());
        const medidas=await page.evaluate(()=>{
          const shell=document.querySelector(".ext-shell"),panel=document.querySelector(".ac-duelo"),r=panel.getBoundingClientRect();
          const vv=window.visualViewport,borde=(vv?.offsetTop||0)+(vv?.height||innerHeight);
          const selectores=[".ac-marcador",".ac-pregunta",".ac-letras","#acRespuesta",".ac-responder button",".ac-voz",".ac-pasar",".ac-mensaje"];
          return{panel:r.toJSON(),borde,ancho:innerWidth,scroll:shell.scrollHeight-shell.clientHeight,
            fuera:selectores.flatMap(sel=>{
              const el=document.querySelector(sel);if(!el||!el.getClientRects().length)return[];
              const b=el.getBoundingClientRect();return b.bottom>borde+1||b.top<r.top-1||b.right>r.right+1||b.left<r.left-1?[{sel,r:b.toJSON()}]:[];
            })};
        });
        assert(medidas.panel.left>=0&&medidas.panel.right<=medidas.ancho+1&&medidas.panel.bottom<=medidas.borde+1&&medidas.scroll<=1&&medidas.fuera.length===0,"single-screen question: "+JSON.stringify({viewport,...medidas}));
      }
      for(const viewport of [{width:1280,height:900},{width:844,height:390},{width:390,height:844},{width:360,height:640},{width:390,height:450}])await comprobarPantalla(viewport);
      assert((await page.locator(".ac-tu-avatar").getAttribute("src")).endsWith("avatar-22.webp"));
      assert((await page.locator(".ac-rival-avatar").getAttribute("src")).endsWith("avatar-10.webp"));
      await page.setViewportSize({width:1280,height:900});
      if(process.env.SCREENSHOT_PATH)await page.locator(".ext-wrap").screenshot({path:process.env.SCREENSHOT_PATH,animations:"disabled"});
      await page.locator(".ac-voz").click();
      assert.equal(await page.locator(".ac-voz").getAttribute("aria-pressed"),"true");
      await page.evaluate(()=>window.__speechInstances.at(-1).fail("not-allowed"));
      assert.match(await page.locator(".ac-mensaje").textContent(),/Permití el micrófono/);
      assert(await page.locator("#acRespuesta").isEnabled());
      if(process.env.SCREENSHOT_MOBILE_PATH){
        await page.setViewportSize({width:390,height:736});
        await page.evaluate(()=>window.dispatchEvent(new Event("resize")));
        await page.locator(".ext-wrap").screenshot({path:process.env.SCREENSHOT_MOBILE_PATH,animations:"disabled"});
        await page.setViewportSize({width:1280,height:900});
      }
      const segundos=+(await page.locator(".ac-reloj b").textContent());
      await page.locator("#acRespuesta").fill("respuesta equivocada");
      await page.locator(".ac-responder button").click();
      assert.match(await page.locator(".ac-mensaje").textContent(),/Probá otra vez/);
      await page.clock.runFor(1000);
      assert.equal(+(await page.locator(".ac-reloj b").textContent()),segundos-1,"wrong answers do not reset the clock");
      assert.equal(await page.locator(".ac-pregunta").textContent(),pista);
      const respuesta=await page.evaluate(()=>AHORA_CAIGO_DATOS.find(q=>q.pregunta===document.querySelector(".ac-pregunta").textContent).respuesta);
      await page.locator("#acRespuesta").fill(respuesta.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase());
      await page.locator(".ac-responder button").click();
      assert.match(await page.locator(".ac-mensaje").textContent(),/Correcto/);
      assert.equal(await page.locator(".ac-turno-texto").textContent(),"¡CORRECTO!");
      assert(await page.evaluate(()=>window.__musicasCaigo[0].paused),"answer transition stays silent");
      await page.clock.runFor(1501);
      assert.equal(await page.locator(".ac-turno-texto").textContent(),"RESPONDE EL RIVAL");
      assert(await page.evaluate(()=>window.__musicasCaigo[0].paused),"rival questions are silent too");
      assert.equal(await page.locator(".ac-identidad.ac-activo .ac-rival-nombre").textContent(),"Participante 10");
      assert.notEqual(await page.locator(".ac-pregunta").textContent(),pista,"different question for the rival");
      assert(await page.locator(".ac-responder").isHidden());
      await page.clock.runFor(30000);
      assert.match(await page.locator(".ac-estado").textContent(),/Ganaste el duelo/);
      await comprobarPopup(/Ganaste el duelo/);
      assert(await page.evaluate(()=>!window.__musicasCaigo[0].paused),"result popup resumes music");
      if(process.env.SCREENSHOT_RESULT_PATH)await page.locator(".ac-final").screenshot({path:process.env.SCREENSHOT_RESULT_PATH,animations:"disabled"});
      assert.equal(await page.locator(".ac-caido").count(),1);
      await page.evaluate(()=>{Math.random=()=>.99;});
      await iniciarDuelo();
      await page.evaluate(()=>{Math.random=()=>0;});await page.clock.runFor(12000);
      await page.evaluate(()=>{Math.random=()=>.99;});
      assert.equal(await page.locator(".ac-elegido .ac-nombre").textContent(),"9","fallen rival is excluded");
      await page.locator(".ac-voz").click();
      await page.evaluate(()=>{window.__lateSpeech=window.__speechInstances.at(-1).onresult;});
      await page.clock.runFor(30000);
      assert(await page.evaluate(()=>window.__speechInstances.at(-1).aborted),"deadline aborts microphone");
      await page.evaluate(()=>window.__lateSpeech({results:[[{transcript:"tarde"}]]}));
      assert.match(await page.locator(".ac-estado").textContent(),/Caíste/);
      await comprobarPopup(/Caíste/);
      assert.equal(await page.locator(".ac-principal.ac-caido").count(),1);
      await iniciarDuelo();
      assert.equal(await page.locator(".ac-caido").count(),0,"restart restores the stage");
      await page.evaluate(()=>{Math.random=()=>0;});
      await iniciarDuelo();await page.clock.runFor(12000);
      const responder=async(porVoz=false)=>{
        const r=await page.evaluate(()=>AHORA_CAIGO_DATOS.find(q=>q.pregunta===document.querySelector(".ac-pregunta").textContent).respuesta);
        if(porVoz){
          await page.locator(".ac-voz").click();
          await page.evaluate(respuesta=>window.__speechInstances.at(-1).emit(["transcripción incorrecta",respuesta]),r);
        }else{
          await page.locator("#acRespuesta").fill(r);await page.locator("#acRespuesta").press("Enter");
        }
      };
      await responder(true);
      assert.equal(await page.locator(".ac-voz").getAttribute("aria-pressed"),"false");
      await page.clock.runFor(1501);
      assert.equal(await page.locator(".ac-turno-texto").textContent(),"RESPONDE EL RIVAL");
      await page.clock.runFor(3500);
      assert.match(await page.locator(".ac-mensaje").textContent(),/rival acertó/);
      await page.clock.runFor(1500);
      assert.equal(await page.locator(".ac-turno-texto").textContent(),"TE TOCA","bot answer returns turn to player");
      await page.locator(".ac-voz").click();
      await page.evaluate(()=>{window.__lateSpeech=window.__speechInstances.at(-1).onresult;Extensiones.abrirLobby();});
      assert(await page.evaluate(()=>window.__speechInstances.at(-1).aborted),"exit aborts microphone");
      assert.equal(await page.locator(".ac-abierta").count(),0,"scenario styles cleaned up");
      await page.evaluate(()=>Extensiones.abrirJuego("ahora-caigo"));
      await page.evaluate(()=>window.__lateSpeech({results:[[{transcript:"tarde"}]]}));
      await page.clock.runFor(35000);
      assert(await page.locator(".ac-duelo").isHidden(),"old bot and deadline callbacks are cancelled on exit");
      assert.equal(await page.locator(".ac-caido").count(),0);
      await page.evaluate(()=>{Math.random=()=>.99;});
      const vistas=new Set();
      for(let ronda=0;ronda<10;ronda++){
        await iniciarDuelo();await page.clock.runFor(7000);
        assert.equal(await page.locator(".ac-turno-texto").textContent(),"RESPONDE EL RIVAL","rival starts every duel");
        const bot=await page.locator(".ac-pregunta").textContent();
        assert(!vistas.has(bot),"questions do not repeat");vistas.add(bot);
        await page.clock.runFor(30000);
        assert.equal(await page.locator(".ac-caido").count(),ronda+1);
      }
      assert.match(await page.locator(".ac-estado").textContent(),/Eliminaste a los diez/);
      await comprobarPopup(/Ganaste la partida/);
      assert.equal(vistas.size,10);
      await page.evaluate(()=>{Math.random=()=>0;Extensiones.abrirJuego("ahora-caigo");});
      await iniciarDuelo();await page.clock.runFor(12000);
      assert.equal(await page.locator(".ac-vidas").textContent(),"3 pases");
      for(let uso=0;uso<3;uso++){
        const q=await page.locator(".ac-pregunta").textContent();
        const mascara=await page.locator(".ac-letras").textContent();
        const historial=await page.evaluate(()=>Vistas.cargar("ahora_caigo").size);
        if(uso===1){await page.locator(".ac-voz").click();await page.evaluate(()=>window.__speechInstances.at(-1).emit(["pase"]));}
        else await page.locator(".ac-pasar").click();
        assert.equal(await page.locator(".ac-pregunta").textContent(),q,"pass transfers the same question");
        assert.equal(await page.locator(".ac-letras").textContent(),mascara,"pass preserves the revealed letters");
        assert.equal(await page.evaluate(()=>Vistas.cargar("ahora_caigo").size),historial,"pass does not spend another question");
        assert.equal(await page.locator(".ac-reloj b").textContent(),"20");
        assert.equal(await page.locator(".ac-vidas").textContent(),(2-uso)+((2-uso)===1?" pase":" pases"));
        await page.clock.runFor(3500);await page.clock.runFor(1500);
        assert.equal(await page.locator(".ac-turno-texto").textContent(),"TE TOCA");
        assert.notEqual(await page.locator(".ac-pregunta").textContent(),q,"correct pass response returns a new question to the leader");
      }
      assert(await page.locator(".ac-pasar").isDisabled(),"only three passes per game");
      await page.locator(".ac-voz").click();await page.evaluate(()=>window.__speechInstances.at(-1).emit(["pase"]));
      assert.match(await page.locator(".ac-mensaje").textContent(),/No te quedan pases/);
      await page.evaluate(()=>{Math.random=()=>.99;});
      await responder();await page.clock.runFor(1501);await page.clock.runFor(30000);
      assert.match(await page.locator(".ac-estado").textContent(),/Ganaste el duelo/);
      await iniciarDuelo();await page.clock.runFor(7000);
      assert.equal(await page.locator(".ac-vidas").textContent(),"0 pases","passes do not refill between duels");
      await page.evaluate(()=>{Math.random=()=>0;Extensiones.abrirJuego("ahora-caigo");});
      await iniciarDuelo();await page.clock.runFor(12000);
      await page.evaluate(()=>{Math.random=()=>.99;});
      await page.locator(".ac-pasar").click();await page.clock.runFor(19999);
      assert.equal(await page.locator(".ac-caido").count(),0);
      await page.clock.runFor(1);
      assert.equal(await page.locator(".ac-caido").count(),1,"a passed question expires at 20 seconds");
      assert.match(await page.locator(".ac-mensaje").textContent(),/20 segundos/);
      for(const respuesta of ["SOLIDIFICACIÓN","DISYUNTOR"]){
        await page.evaluate(palabra=>{
          window.__bancoOriginal=window.__bancoOriginal||AHORA_CAIGO_DATOS;
          const item={id:"ac-geometria-"+palabra,categoria:"Prueba de geometría",
            pregunta:"¿Cómo se muestra una pregunta larga junto a una respuesta larga en una pantalla pequeña?",respuesta:palabra,alternativas:[]};
          window.AHORA_CAIGO_DATOS=[item,{...item,id:item.id+"-geometria"}];
          Math.random=()=>0;Extensiones.abrirJuego("ahora-caigo");
        },respuesta);
        await iniciarDuelo();await page.clock.runFor(12000);
        for(const viewport of [{width:390,height:736},{width:360,height:640},{width:390,height:450},{width:844,height:390}])await comprobarPantalla(viewport);
        await page.setViewportSize({width:390,height:844});
        await page.evaluate(()=>{
          Object.defineProperty(visualViewport,"height",{configurable:true,get:()=>400});
          visualViewport.dispatchEvent(new Event("resize"));
        });
        await comprobarPantalla({width:390,height:844});
        await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event("resize"));});
      }
      await page.evaluate(()=>{
        Math.random=()=>0;window.AHORA_CAIGO_DATOS=window.__bancoOriginal;window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;
        Extensiones.abrirJuego("ahora-caigo");
      });
      await iniciarDuelo();await page.clock.runFor(12000);
      assert(await page.locator(".ac-voz").isDisabled(),"typing remains available without speech recognition");
      assert(await page.locator("#acRespuesta").isEnabled());
      await page.clock.runFor(30000);
      assert.equal(await page.locator("dialog:modal").count(),1);
      await page.locator(".ac-final-salir").click();
      assert.equal(await page.locator("dialog:modal").count(),0,"leaving closes the result popup");
      assert.equal(await page.locator(".ac-preguntando").count(),0,"leaving restores the normal shell");
      assert(await page.evaluate(()=>window.__musicasCaigo[0].paused&&window.__musicasCaigo[0].currentTime===0),"exit stops and resets the music");
      await page.evaluate(()=>{Math.random=window.__randomOriginal;Extensiones.cerrar();});
      assert.equal(await page.locator(".ac-abierta").count(),0);
      assert.deepEqual(errors,[],"no browser errors");
      await context.close();
    }
    console.log("PASS: open for every profile, existing assets, 11 figures at 3 sizes, single-screen layout and keyboard, profile avatars, speech results/errors/cleanup, hints, unlimited retries, rival-first turns, 3 passes per game, same question/20-second transfer, active turn indicators, result popups and music only outside questions");
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
