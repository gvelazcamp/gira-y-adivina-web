/* Rosco horizontal: micrófono y visibilidad al aparecer teclado Android.
   Prueba local: BROWSER_EXECUTABLE=/usr/bin/chromium node tests/rosco-microfono.cjs */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
 const requested=new URL(req.url,"http://local").pathname;
 const file=path.join(root,requested==="/"?"index.html":requested);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
 res.setHeader("Content-Type",{".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png"}[path.extname(file)]||"application/octet-stream");
 fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const origin="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  for(const name of ["Gonzalo","Vale"]){
   const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:"block"});
   const page=await context.newPage();
   await page.route("**/*",route=>route.request().url().startsWith(origin)?route.continue():route.fulfill({status:200,body:""}));
   await page.addInitScript(n=>{
     localStorage.setItem("gya_nombre",n);
     localStorage.setItem("gya_avatar","avatar-01");
     localStorage.setItem("gya_pais","uruguay");
     localStorage.setItem("gya_bienvenida_vista","1");
     window.__voz=[];
     window.SpeechRecognition=class{
       start(){window.__voz.push(this)}
       abort(){}
     };
   },name);
   await page.goto(origin,{waitUntil:"load"});
   await page.waitForFunction(()=>!!window.Extensiones&&!!window.RoscoRioplatense);
   await page.evaluate(()=>{
     document.querySelector("#splash")?.remove();
     Fichas.usar=()=>true;
     Extensiones.abrirJuego("rosco-rioplatense");
     const btn=[...document.querySelectorAll("#rrPanel button")].find(b=>b.textContent.startsWith("Jugar nivel"));
     if(!btn)throw Error("Missing start Rosco button");
     btn.click();
   });
   await page.waitForFunction(()=>!document.querySelector("#rrJuego").hidden);
   await page.waitForFunction(()=>document.querySelector("#rrEntrada")&&document.querySelector("#rrVoz"));
   const visible=await page.locator("#rrVoz").isVisible();
   assert.equal(visible,name==="Gonzalo","Mic only for horizontal Gonzalo during initial test");
   if(name==="Gonzalo"){
     // Time advancing means the voice control must work during a real turn.
     await page.waitForFunction(()=>document.querySelector("#rrEnviar")?.disabled===false);
     await page.locator("#rrVoz").click();
     assert.equal(await page.locator("#rrVoz").getAttribute("aria-pressed"),"true");
     await page.evaluate(()=>{
       const r=window.__voz[0];
       if(!r)throw Error("SpeechRecognition not started");
       r.onresult({results:[[{transcript:"POCHOCLO",confidence:.9}]]});
       r.onend();
     });
     assert.equal(await page.locator("#rrEntrada").inputValue(),"POCHOCLO");
     assert.match(await page.locator("#rrMensaje").textContent(),/Tocá Enviar/);
     assert.equal(await page.locator("#rrVoz").getAttribute("aria-pressed"),"false");
     assert.equal(await page.locator("#rrEntrada").isFocused(),false,"voice needs no Android keyboard");
     await page.evaluate(()=>{
       const vv=window.visualViewport;
       Object.defineProperty(vv,"height",{value:135,configurable:true});
       document.querySelector("#rrEntrada").focus({preventScroll:true});
       vv.dispatchEvent(new Event("resize"));
     });
     await page.waitForFunction(()=>document.querySelector(".ext-shell")?.classList.contains("rr-teclado-abierto"));
     const layout=await page.evaluate(()=>{
       const shell=document.querySelector(".ext-shell");
       const q=s=>document.querySelector(s);
       const input=q("#rrEntrada").getBoundingClientRect();
       return{
         viewport:parseFloat(shell.style.height),
         hiddenWheel:getComputedStyle(q(".rr-rueda")).display==="none",
         hiddenHeader:getComputedStyle(q(".ext-header")).display==="none",
         formVisible:q("#rrForm").getBoundingClientRect().bottom<=shell.getBoundingClientRect().bottom+2,
         inputTop:input.top
       };
     });
     assert(layout.hiddenWheel&&layout.hiddenHeader,"Compact view hides large decorations while typing");
     assert(layout.formVisible,"Answer field must stay above keyboard");
     await page.locator("#rrEntrada").blur();
     await page.evaluate(()=>window.visualViewport.dispatchEvent(new Event("resize")));
     await page.waitForFunction(()=>!document.querySelector(".ext-shell")?.classList.contains("rr-teclado-abierto"));
   }
   await context.close();
  }
  console.log("PASS Rosco voice responses and keyboard-safe horizontal layout");
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});