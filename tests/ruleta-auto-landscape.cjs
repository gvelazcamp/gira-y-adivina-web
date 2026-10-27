/* Prueba del giro automático de la Ruleta principal (perfil Gonzalo).
 * Requiere Playwright + navegador local para verificar la geometría.
 */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),http=require("node:http"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{
  const p=new URL(req.url,"http://localhost").pathname;
  const file=path.join(root,p==="/"?"index.html":p);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.setHeader("Content-Type",{".html":"text/html",".js":"text/javascript",".css":"text/css",".webp":"image/webp"}[path.extname(file)]||"application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(done=>server.listen(0,"127.0.0.1",done));
 const base="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  for(const name of ["Gonzalo","Vale"]){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:"block"});
   const page=await context.newPage();
   await page.route("**/*",route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,body:""}));
   await page.addInitScript(n=>{
     localStorage.setItem("gya_nombre",n);
     localStorage.setItem("gya_avatar","avatar-01");
     localStorage.setItem("gya_pais","uruguay");
     localStorage.setItem("gya_bienvenida_vista","1");
   },name);
   await page.goto(base,{waitUntil:"load"});
   await page.evaluate(()=>{
     document.querySelector("#splash")?.remove();
     document.querySelectorAll(".capa.ver").forEach(el=>el.classList.remove("ver"));
     document.documentElement.classList.remove("cargando");
     $("setup").style.display="none";
     $("juego").style.display="block";
     modo="bot";miJug=0;arranca=0;meta.pistasGratis=0;enTutorial=false;
     armarTeclado();iniciarPartida(perfil.nombre,"Margarita");
   });
   await page.setViewportSize({width:844,height:390});
   await page.waitForFunction(()=>!matchMedia("(orientation:portrait)").matches);
   if(name==="Gonzalo")await page.waitForFunction(()=>document.body.classList.contains("modo-horizontal"));
   const layout=await page.evaluate(()=>{
      const box=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return{
        mode:document.body.classList.contains("modo-horizontal"),
        board:box("#tablero"),actionPanel:box("#juego > .zona"),wheelOverlay:box("#capaRueda"),
        width:document.documentElement.scrollWidth,
        bodyMode:document.body.className
      };
   });
   assert.equal(layout.mode,name==="Gonzalo","Only Gonzalo turns main wheel landscape automatically");
   if(name==="Gonzalo"){
     assert(layout.board.right<layout.actionPanel.x+5,"wheel phrase board sits left of action panel");
     assert(layout.width<=844+2,"no horizontal page overflow");
     assert(layout.actionPanel.bottom<=390+2,"action panel stays within TV viewport");
     await page.setViewportSize({width:390,height:844});
     await page.waitForFunction(()=>!document.body.classList.contains("modo-horizontal"));
   }
   console.log("PASS",name,layout);
   await context.close();
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});