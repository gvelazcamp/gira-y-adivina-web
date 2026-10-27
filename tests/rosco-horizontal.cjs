/* Prueba visual de la versión 16:9 para Gonzalo, sin alterar juego vertical.
   Ejecutar: BROWSER_EXECUTABLE=/usr/bin/chromium node tests/rosco-horizontal.cjs */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,"http://localhost").pathname;
  const file=path.join(root,pathname==="/"?"index.html":pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader("Content-Type",({".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml"})[path.extname(file)]||"application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  for(const {name,width,height} of [
    {name:"Gonzalo",width:1536,height:709},
    {name:"Gonzalo",width:844,height:390},
    {name:"Gonzalo",width:390,height:844},
    {name:"Vale",width:844,height:390}
  ]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:"block"});
   const page=await context.newPage();
   await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
   await page.addInitScript(n=>{
     localStorage.setItem("gya_nombre",n);
     localStorage.setItem("gya_avatar","avatar-01");
     localStorage.setItem("gya_pais","uruguay");
     localStorage.setItem("gya_bienvenida_vista","1");
   },name);
   await page.goto(base,{waitUntil:"load"});
   await page.waitForFunction(()=>!!window.Extensiones&&!!window.RoscoRioplatense);
   const isLandscape=width>height&&name==="Gonzalo";
   const welcome=await page.evaluate(()=>{
     const bounds=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
     document.querySelector("#splash")?.remove();
     Fichas.usar=()=>true;
     Extensiones.abrirJuego("rosco-rioplatense");
     const panel=document.querySelector("#rrPanel .rr-panel");
     return {panel:bounds(panel),scroll:panel.scrollHeight,visible:panel.clientHeight,
       isHorizontal:document.body.classList.contains("ext-horizontal"),
       modalShown:!document.querySelector("#rrPanel").hidden};
   });
   assert(welcome.modalShown,"welcome visible");
   assert.equal(welcome.isHorizontal,name==="Gonzalo","feature must be scoped to profile");
   if(isLandscape){
     assert(welcome.panel.right<=width+2&&welcome.panel.bottom<=height+2,"welcome card within screen");
     assert(welcome.scroll<=welcome.visible+4,"welcome must not require vertical scroll");
   }
   await page.evaluate(()=>{
     const button=[...document.querySelectorAll("#rrPanel button")].find(e=>e.textContent.startsWith("Jugar nivel"));
     if(!button)throw Error("Jugar nivel button missing");
     button.click();
   });
   await page.waitForFunction(()=>!document.querySelector("#rrJuego").hidden);
   const game=await page.evaluate(()=>{
     const bounds=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
     const q=id=>document.querySelector(id);
     return {
       display:getComputedStyle(q("#rrJuego")).display,
       wheel:bounds(q(".rr-rueda")),clue:bounds(q(".rr-pista")),
       form:bounds(q("#rrForm")),bar:bounds(q("#rrBarra")),
       inputFocused:document.activeElement===q("#rrEntrada"),
       scroll:q("#extShell").scrollHeight-q("#extShell").clientHeight
     };
   });
   if(isLandscape){
     assert.equal(game.display,"grid","16:9 uses a side-by-side grid");
     assert(game.wheel.right<game.clue.x,"Rosco must be to the left of the clue");
     assert(game.form.x>=game.clue.x-3,"answer belongs to clue column");
     assert(game.wheel.y>=0&&game.wheel.bottom<=height+3,"entire wheel must fit vertically");
     assert(game.form.bottom<=height+3,"answer must remain visible");
     assert(!game.inputFocused,"landscape does not pop up the Android keyboard automatically");
   }else{
     assert.equal(game.display,"block","other profiles and portrait keep original layout");
   }
   console.log("PASS",name,width+"x"+height,{welcome,game});
   await context.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
