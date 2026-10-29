/* Recorrido real del Rosco en el navegador, con el servicio de voz simulado.
   BROWSER_EXECUTABLE=/usr/bin/chromium node tests/rosco-voz-pantalla.cjs */
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
  res.setHeader("Content-Type",({".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png"})[path.extname(file)]||"application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:"block",locale:"es-UY"});
    const page=await context.newPage();
    await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
    await page.addInitScript(()=>{
      localStorage.setItem("gya_nombre","Vale");
      localStorage.setItem("gya_avatar","avatar-01");
      localStorage.setItem("gya_pais","uruguay");
      localStorage.setItem("gya_bienvenida_vista","1");
      window.GIRO_ROSCO_PILOTO=false;
      window.__roscoReconocimientos=[];
      window.SpeechRecognition=class{
        start(){window.__roscoReconocimientos.push(this);setTimeout(()=>{this.onstart?.();this.onaudiostart?.();},0);}
        abort(){this.onend?.();}
      };
      Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{
        cancel(){},getVoices(){return[];},speak(u){setTimeout(()=>u.onend?.(),0);}
      }});
    });
    await page.goto(base,{waitUntil:"load"});
    await page.waitForFunction(()=>!!window.Extensiones&&!!window.RoscoRioplatense);
    await page.evaluate(()=>{
      document.querySelector("#splash")?.remove();document.documentElement.classList.remove("cargando");
      Fichas.usar=()=>true;
      ROSCO_CONFIG.letras="CKLUYZ";ROSCO_CONFIG.niveles[1].letras=6;ROSCO_CONFIG.segundosPorLetra=30;ROSCO_CONFIG.giroMs=0;
      const casos=ROSCO_DATOS.filter(d=>["CHIVITO","KAKI","LOMITO","UNTAR","YUYO","ZAMBA"].includes(d.palabra));
      if(casos.length!==6)throw Error("Faltan las palabras del caso real");
      ROSCO_DATOS.splice(0,ROSCO_DATOS.length,...casos);
      Extensiones.abrirJuego("rosco-rioplatense");
      document.querySelector("#rrPanel .rr-principal").click();
    });
    await page.waitForFunction(()=>document.querySelector("#rrEnviar")?.disabled===false);
    await page.locator("#rrVoz").click();
    let aciertos=0;
    for(let n=0;n<6;n++){
      await page.waitForFunction(i=>window.__roscoReconocimientos.length>i,n);
      await page.waitForFunction(()=>document.querySelector("#rrEstadoVozG")?.textContent.includes("ESCUCHANDO"));
      const letra=await page.locator("#rrGrande").textContent();
      const palabra={C:"COTORRA",K:"CAQUI",L:"LOMO",U:"UNTAR",Y:"YUYO",Z:"SAMBA"}[letra];
      assert(palabra,"letra inesperada: "+letra);
      await page.evaluate(({i,palabra,incorrecta})=>{
        const r=window.__roscoReconocimientos[i];
        r.onresult({resultIndex:0,results:[{0:{transcript:palabra,confidence:.9},length:1,isFinal:incorrecta}]});
        if(incorrecta)setTimeout(()=>r.onspeechstart?.(),1000);
      },{i:n,palabra,incorrecta:letra==="C"});
      if(letra==="C")await page.waitForFunction(()=>document.querySelector("#rrErrores")?.textContent==="1",null,{timeout:6000});
      else{
        aciertos++;
        await page.waitForFunction(i=>document.querySelector("#rrAciertos")?.textContent.startsWith(i+"/"),aciertos);
      }
    }
    assert.equal(await page.locator("#rrAciertos").textContent(),"5/6");
    assert.equal(await page.locator("#rrErrores").textContent(),"1");
    await context.close();
    console.log("PASS: LOMO, CAQUI, UNTAR, YUYO y SAMBA/ZAMBA; COTORRA cuenta error sin espera infinita");
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
