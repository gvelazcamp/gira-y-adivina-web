/* Ahorcado 16:9: preserva móvil vertical y resto de perfiles.
 * Ejecutar con BROWSER_EXECUTABLE=/usr/bin/chromium node tests/ahorcado-horizontal.cjs
 */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,"http://localhost").pathname;
 const file=path.join(root,pathname==="/"?"index.html":pathname);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
   res.writeHead(404);res.end();return;
 }
 res.setHeader("Content-Type",{".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp",".png":"image/png"}[path.extname(file)]||"application/octet-stream");
 fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(done=>server.listen(0,"127.0.0.1",done));
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 const base="http://127.0.0.1:"+server.address().port;
 try{
  for(const {name,width,height} of [
   {name:"Gonzalo",width:844,height:390},
   {name:"Gonzalo",width:1536,height:709},
   {name:"Gonzalo",width:390,height:844},
   {name:"Vale",width:844,height:390}
  ]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:"block",reducedMotion:"reduce"});
   const page=await context.newPage();
   await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
   await page.addInitScript(n=>{
    localStorage.setItem("gya_nombre",n);
    localStorage.setItem("gya_avatar","avatar-01");
    localStorage.setItem("gya_pais","uruguay");
    localStorage.setItem("gya_bienvenida_vista","1");
   },name);
   await page.goto(base,{waitUntil:"load"});
   await page.waitForFunction(()=>!!window.Extensiones&&!!window.AhorcadoRioplatense);
   await page.evaluate(()=>{
     document.querySelector("#splash")?.remove();
     document.documentElement.classList.remove("cargando");
     Fichas.usar=()=>true;
     Extensiones.abrirJuego("ahorcado-rioplatense");
   });
   const landscape=name==="Gonzalo"&&width>height;
   const welcome=await page.evaluate(()=>{
      const el=document.querySelector("#ahPanel .sf-panel");
      const r=el.getBoundingClientRect();
      return {display:getComputedStyle(el).display,height:r.height,bottom:r.bottom,
        scrolled:el.scrollHeight>el.clientHeight+3};
   });
   if(landscape){
     assert.equal(welcome.display,"grid","Welcome is adapted to TV proportions");
     assert(welcome.bottom<=height+3,"Welcome fits on screen");
     assert(!welcome.scrolled,"Welcome has no vertical scroll");
   }else assert.notEqual(welcome.display,"grid","Portrait and other profiles unchanged");
   await page.locator("#ahPanel .sf-acciones button").first().click();
   const board=await page.evaluate(()=>{
      const r=sel=>{const a=document.querySelector(sel).getBoundingClientRect();return {x:a.x,right:a.right,y:a.y,bottom:a.bottom,width:a.width,height:a.height};};
      return{grid:getComputedStyle(document.querySelector(".ah-game")).display,
        wheel:r("#ahRuedaWrap"),gallows:r("#ahFigura"),category:r("#ahPregunta"),
        word:r("#ahPalabra"),keyboard:r("#ahTeclado"),
        keyboardCols:getComputedStyle(document.querySelector("#ahTeclado")).gridTemplateColumns.split(" ").length,
        overflow:document.documentElement.scrollWidth>innerWidth+2};
   });
   if(landscape){
     assert.equal(board.grid,"grid","Landscape game uses 2 columns");
     assert(board.wheel.right<board.category.x,"Category is to the right of category wheel");
     assert(board.keyboard.x>=board.category.x-2,"Keyboard shares right column with category");
     assert(board.keyboard.bottom<=height+3,"All letters fit on horizontal screen");
     assert(board.wheel.y>=0&&board.wheel.bottom<=height+3,"Category wheel stays whole");
     assert(board.keyboardCols===6,"Six-column letter grid");
     assert(!board.overflow,"No page horizontal overflow");
   }else assert.notEqual(board.grid,"grid","Portrait/default unchanged");
   await page.evaluate(()=>Extensiones.abrirLobby());
   assert.equal(await page.evaluate(()=>document.body.classList.contains("ext-horizontal")),false,
     "Landscape reset when returning to Extensiones");
   console.log("PASS",name,width+"x"+height,{welcome,board});
   await context.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
