const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'};

function encontrarPalabra(letras,n,palabra){
  const dirs=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)for(const [dr,dc] of dirs){
    const ks=Array.from({length:palabra.length},(_,i)=>[r+dr*i,c+dc*i]);
    if(ks.every(([rr,cc],i)=>rr>=0&&rr<n&&cc>=0&&cc<n&&letras[rr*n+cc]===palabra[i]))return ks.map(([rr,cc])=>rr*n+cc);
  }
  throw Error('No se encontró '+palabra);
}
async function arrastrar(page,indices){
  const boxes=await page.locator('.sf-celda').evaluateAll((els,ks)=>ks.map(k=>{
    const b=els[k].getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};
  }),indices);
  await page.mouse.move(boxes[0].x,boxes[0].y);
  await page.mouse.down();
  for(const b of boxes.slice(1))await page.mouse.move(b.x,b.y,{steps:2});
  await page.mouse.up();
}

(async()=>{
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://local').pathname;
    const file=path.join(root,pathname==='/'?'index.html':pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  try{
    for(const viewport of [{width:360,height:780},{width:1280,height:900}]){
      const context=await browser.newContext({viewport,isMobile:viewport.width===360,hasTouch:viewport.width===360,serviceWorkers:'block'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,body:''}));
      await page.addInitScript(()=>{localStorage.setItem('gya_nombre','Prueba');localStorage.setItem('gya_avatar','avatar-01');localStorage.setItem('gya_pais','uruguay');localStorage.setItem('gya_bienvenida_vista','1');const d=new Date();localStorage.setItem('gya_dia_alta',d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'));});
      await page.goto(base,{waitUntil:'load'});
      await page.evaluate(()=>{document.querySelector('#splash')?.remove();document.documentElement.classList.remove('cargando');document.querySelectorAll('.capa.ver').forEach(el=>el.classList.remove('ver'));window.Fichas=undefined;});
      const economiaAntes=await page.evaluate(()=>({monedas:meta.monedas,vidas:meta.vidas,tickets:meta.tickets}));
      await page.evaluate(()=>Extensiones.abrirJuego('sopa-fugaz'));
      await page.locator('.sf-panel .sf-principal').click();
      const N=14;
      assert.equal(await page.locator('.sf-celda').count(),N*N,'tablero grande desde el nivel 1');
      const niveles=await page.evaluate(()=>[1,3,30].map(n=>SopaFugaz.configNivel(n)));
      assert.equal(niveles[0].palabras,12);assert.equal(niveles[0].forma,null);assert.equal(niveles[1].forma.id,'corazon');assert.equal(niveles[2].palabras,16);assert(niveles[2].margen>=.75);
      const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,gridWidth:document.querySelector('#sfGrid').getBoundingClientRect().width}));
      assert(layout.scrollWidth<=layout.innerWidth,'sin desborde horizontal '+JSON.stringify(layout));
      const resolver=async(revesPrimera)=>{const words=await page.evaluate(()=>{const inv=Object.fromEntries(Object.entries(SOPA_DIBUJOS).map(([w,e])=>[e,w]));return[...document.querySelectorAll('.sf-palabra')].map(x=>x.classList.contains('dibujo')?inv[x.querySelector('i').textContent]:x.textContent);});
        for(const [i,word] of words.entries()){const letras=await page.locator('.sf-celda').allTextContents();const ks=encontrarPalabra(letras,N,word);await arrastrar(page,i===0&&revesPrimera?ks.reverse():ks);
          assert(await page.evaluate(w=>[...document.querySelectorAll('.sf-palabra.hecho')].some(x=>x.textContent===w||x.textContent.endsWith(w)),word),'tacha '+word);}
        return words;};
      /* Pista y pausa */
      await page.locator('#sfPista').click();assert.equal(await page.locator('.sf-celda.pista').count(),1);
      await page.locator('#sfPausa').click();const t1=await page.locator('#sfTiempo').textContent();await page.waitForTimeout(1300);
      assert.equal(await page.locator('#sfTiempo').textContent(),t1,'la pausa para el reloj');await page.locator('.sf-panel .sf-principal').click();
      const w1=await resolver(true);
      await page.locator('.sf-panel h3').waitFor();assert.match(await page.locator('.sf-panel h3').textContent(),/Sopa completa/);
      assert.equal(await page.locator('.sf-caps polyline').count(),w1.length,'cada palabra queda marcada con una cápsula');
      await page.locator('.sf-panel .sf-principal').click();
      const w2=await resolver(false);assert(w2.every(w=>!w1.includes(w)),'no repite palabras');
      await page.locator('.sf-panel .sf-principal').click();
      assert.match(await page.locator('#sfForma').textContent(),/Corazón/);assert(await page.locator('.sf-celda.fuera').count()>0,'nivel 3 con forma');
      const w3=await page.evaluate(()=>{const inv=Object.fromEntries(Object.entries(SOPA_DIBUJOS).map(([w,e])=>[e,w]));return[...document.querySelectorAll('.sf-palabra')].map(x=>x.classList.contains('dibujo')?inv[x.querySelector('i').textContent]:x.textContent);});assert(w3.every(w=>!w1.includes(w)&&!w2.includes(w)));
      const vistas=await page.evaluate(()=>JSON.parse(localStorage.getItem('gya_vistas_sopa')).length);assert.equal(vistas,w1.length+w2.length+w3.length);
      const economiaDespues=await page.evaluate(()=>({monedas:meta.monedas,vidas:meta.vidas,tickets:meta.tickets}));
      assert.deepEqual(economiaDespues,economiaAntes);
      assert.deepEqual(errors,[]);
      console.log('PASS Sopa Fugaz',viewport.width,'tablero 14x14, pista, pausa, cápsulas, reverso, sin repetir, forma');
      await context.close();
    }
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
