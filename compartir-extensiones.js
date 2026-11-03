(function compartirExtensiones(){
  "use strict";
  if(window.GyaCompartir)return;
  const COLOR={bg:"#160B24",panel:"#2A1A3C",gold:"#F5B301",mint:"#37D6C0",cream:"#F6EFE2",muted:"#CDB8E6"};
  const LINK="https://girayadivina.com/";
  const formato=v=>String(v==null?"":v).trim().slice(0,250);
  function partir(ctx,txt,maxWidth,maxLineas=3){
    const palabras=formato(txt).split(/\s+/);const filas=[];let linea="";
    for(const palabra of palabras){
      if(ctx.measureText(palabra).width>maxWidth&&linea){filas.push(linea);linea="";}
      const prueba=linea?linea+" "+palabra:palabra;
      if(ctx.measureText(prueba).width>maxWidth&&linea){filas.push(linea);linea=palabra;}else linea=prueba;
    }
    if(linea)filas.push(linea);
    return filas.slice(0,maxLineas);
  }
  function redondo(ctx,x,y,w,h,r){
    ctx.beginPath();
    if(typeof ctx.roundRect==="function")ctx.roundRect(x,y,w,h,r);
    else{ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y+r,x+r,y);ctx.closePath();}
    ctx.fill();
  }
  function dibujar(data){
    const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;
    const ctx=canvas.getContext("2d");
    if(!ctx)throw new Error("Canvas no disponible");
    const grad=ctx.createLinearGradient(0,0,1080,1920);grad.addColorStop(0,"#4C2670");grad.addColorStop(.65,COLOR.bg);grad.addColorStop(1,"#0B0616");
    ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1920);
    ctx.globalAlpha=.12;ctx.fillStyle=COLOR.gold;ctx.beginPath();ctx.arc(940,150,310,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=COLOR.mint;ctx.beginPath();ctx.arc(80,1590,260,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="900 58px Arial, sans-serif";ctx.fillStyle=COLOR.gold;ctx.fillText("GIRÁ Y ADIVINÁ",540,105);
    ctx.fillStyle=COLOR.muted;ctx.font="600 36px Arial, sans-serif";ctx.fillText("MI RESULTADO",540,173);
    ctx.fillStyle=COLOR.gold;ctx.fillRect(160,231,760,5);
    ctx.font="900 76px Arial, sans-serif";ctx.fillStyle=COLOR.cream;
    partir(ctx,data.titulo,930,3).forEach((linea,i)=>ctx.fillText(linea,540,324+i*88));
    ctx.fillStyle=COLOR.panel;redondo(ctx,68,590,944,302,42);
    ctx.fillStyle=COLOR.mint;ctx.font="900 66px Arial, sans-serif";
    partir(ctx,data.resultado||"¡Partida terminada!",850,2).forEach((linea,i)=>ctx.fillText(linea,540,682+i*80));
    ctx.fillStyle=COLOR.cream;ctx.font="600 35px Arial, sans-serif";
    partir(ctx,data.subtitulo||"",850,2).forEach((linea,i)=>ctx.fillText(linea,540,818+i*43));
    const metricas=(Array.isArray(data.metricas)?data.metricas:[]).slice(0,4);
    const w=450,h=224;
    metricas.forEach((m,i)=>{
      const x=68+(i%2)*494,y=952+Math.floor(i/2)*257;
      ctx.fillStyle="#352149";redondo(ctx,x,y,w,h,28);
      ctx.fillStyle=COLOR.gold;ctx.font="900 66px Arial, sans-serif";
      const valor=formato(m.valor).slice(0,18);
      const tam=valor.length>12?35:valor.length>8?44:valor.length>5?52:66;
      ctx.font="900 "+tam+"px Arial, sans-serif";
      ctx.fillText(valor,x+w/2,y+86);
      ctx.font="600 31px Arial, sans-serif";ctx.fillStyle=COLOR.cream;
      partir(ctx,m.etiqueta||"",w-38,2).forEach((t,j)=>ctx.fillText(t,x+w/2,y+159+j*30));
    });
    const detalleY=metricas.length>2?1526:metricas.length?1280:1020;
    ctx.fillStyle=COLOR.muted;ctx.font="600 37px Arial, sans-serif";
    const extra=partir(ctx,data.detalle||"",900,4);extra.forEach((t,i)=>ctx.fillText(t,540,detalleY+i*56));
    ctx.fillStyle=COLOR.gold;ctx.fillRect(120,1757,840,3);
    ctx.font="800 44px Arial, sans-serif";ctx.fillText("¿TE ANIMÁS A SUPERARME?",540,1810);
    ctx.fillStyle=COLOR.cream;ctx.font="600 37px Arial, sans-serif";ctx.fillText("girayadivina.com",540,1871);
    return canvas;
  }
  function estilo(){
    if(document.getElementById("gyaCompartirEstilo"))return;
    const s=document.createElement("style");s.id="gyaCompartirEstilo";
    s.textContent=`
    .gya-compartir-capa{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:12px;background:#090412e8;font-family:system-ui,Arial,sans-serif;color:#F6EFE2}
    .gya-compartir-caja{position:relative;width:min(100%,460px);max-height:calc(100dvh - 24px);overflow-y:auto;background:#29183E;border:2px solid #F5B301;border-radius:24px;box-shadow:0 20px 60px #000c;padding:18px;text-align:center}
    .gya-compartir-caja h2{font-size:clamp(20px,4vw,26px);margin:4px 34px 7px;color:#F5B301}
    .gya-compartir-caja p{font-size:13px;line-height:1.3;color:#D9C6EA;margin:0 0 10px}
    .gya-compartir-previa{display:block;width:auto;max-width:100%;height:min(37dvh,300px);margin:0 auto 13px;border:2px solid #F5B30170;border-radius:12px;object-fit:contain;background:#160B24}
    .gya-compartir-acciones{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .gya-compartir-acciones button,.gya-compartir-cerrar{cursor:pointer;font-family:inherit;font-weight:800;border-radius:12px;border:1px solid #F5B3014d;padding:11px 8px;min-height:46px;background:#422956;color:#fff;font-size:13px}
    .gya-compartir-acciones button:disabled{opacity:.55;cursor:wait}
    .gya-compartir-acciones button[data-red="w"]{background:#238A59}
    .gya-compartir-acciones button[data-red="i"]{background:#B92B81}
    .gya-compartir-cerrar{position:absolute;right:10px;top:10px;width:34px;height:34px;padding:0;min-height:0;border-radius:50%;background:#5B466A}
    .gya-compartir-estado{min-height:28px;margin-top:9px!important;font-size:12px!important}
    @media(max-height:570px){.gya-compartir-caja{display:grid;grid-template-columns:36% 1fr;gap:7px;align-items:center}.gya-compartir-caja h2,.gya-compartir-caja p{grid-column:2}.gya-compartir-previa{grid-column:1;grid-row:1/5;max-height:65dvh;height:auto}.gya-compartir-acciones{grid-column:2}.gya-compartir-estado{grid-column:2}}
    `;
    document.head.appendChild(s);
  }
  function descargar(blob,nombre){
    const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=nombre;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),30000);
  }
  function abrir(config){
    const data={
      titulo:formato(config&&config.titulo||"Girá y Adiviná"),
      resultado:formato(config&&config.resultado||"¡Partida terminada!"),
      subtitulo:formato(config&&config.subtitulo||""),
      detalle:formato(config&&config.detalle||""),
      metricas:Array.isArray(config&&config.metricas)?config.metricas.slice(0,4):[],
      archivo:formato(config&&config.archivo||"resultado-gira-y-adivina").replace(/[^a-z0-9_-]/gi,"-")+".png"
    };
    estilo();document.querySelector(".gya-compartir-capa")?.remove();
    const canvas=dibujar(data);
    const texto=[data.titulo+" · "+data.resultado,data.subtitulo,data.metricas.map(m=>formato(m.etiqueta)+": "+formato(m.valor)).join(" · "),data.detalle,"¿Te animás a superarme? "+LINK].filter(Boolean).join("\n");
    const capa=document.createElement("div");capa.className="gya-compartir-capa";capa.setAttribute("role","dialog");capa.setAttribute("aria-modal","true");capa.setAttribute("aria-label","Compartir resultado");
    const caja=document.createElement("div");caja.className="gya-compartir-caja";capa.appendChild(caja);
    caja.innerHTML='<button type="button" class="gya-compartir-cerrar" aria-label="Cerrar">✕</button><h2>¡Compartí tu resultado!</h2><p>Tu tarjeta está lista para WhatsApp o historias de Instagram.</p><div class="gya-compartir-acciones"><button type="button" data-red="w">WhatsApp</button><button type="button" data-red="i">Instagram</button><button type="button" data-red="g">Guardar imagen</button><button type="button" data-red="c">Copiar resultado</button></div><p class="gya-compartir-estado" role="status" aria-live="polite"></p>';
    canvas.className="gya-compartir-previa";canvas.setAttribute("role","img");canvas.setAttribute("aria-label","Tarjeta con el resultado de "+data.titulo);
    caja.insertBefore(canvas,caja.querySelector(".gya-compartir-acciones"));
    const estado=caja.querySelector(".gya-compartir-estado"),cerrar=()=>{capa.remove();document.removeEventListener("keydown",tecla)};
    const tecla=e=>{if(e.key==="Escape")cerrar()};
    caja.querySelector(".gya-compartir-cerrar").onclick=cerrar;
    capa.onclick=e=>{if(e.target===capa)cerrar()};
    document.addEventListener("keydown",tecla);
    const blob=()=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error("No se pudo generar PNG")),"image/png"));
    async function enviar(red,b){
      const valor=b.textContent;b.disabled=true;b.textContent="Generando…";
      try{
        const archivoBlob=await blob();
        if(red==="g"){descargar(archivoBlob,data.archivo);estado.textContent="Imagen guardada. Podés publicarla en tus redes.";return}
        if(red==="c"){try{await navigator.clipboard.writeText(texto)}catch(_){const ta=document.createElement("textarea");ta.value=texto;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}estado.textContent="Resultado copiado.";return}
        const file=new File([archivoBlob],data.archivo,{type:"image/png"});
        if(typeof navigator.share==="function"&&typeof navigator.canShare==="function"&&navigator.canShare({files:[file]})){
          try{await navigator.share({files:[file],text:texto});return}
          catch(e){if(e&&e.name==="AbortError")return}
        }
        descargar(archivoBlob,data.archivo);
        estado.textContent=red==="w"?"Imagen descargada. Adjuntala en WhatsApp.":"Imagen descargada. Subila a tu historia de Instagram.";
        if(red==="w")window.open("https://wa.me/?text="+encodeURIComponent(texto),"_blank","noopener");
      }catch(e){estado.textContent="No se pudo compartir. Probá guardando la imagen."}
      finally{b.disabled=false;b.textContent=valor}
    }
    caja.querySelectorAll(".gya-compartir-acciones button").forEach(b=>b.onclick=()=>enviar(b.dataset.red,b));
    document.body.appendChild(capa);
    caja.querySelector(".gya-compartir-cerrar").focus({preventScroll:true});
    return capa;
  }
  window.GyaCompartir={abrir,dibujar};
})();
