/* Compartir resultado (todas las extensiones): popup con una foto 1080×1350 en el estilo del juego
   (logo, título del resultado, cifras grandes y, si hay, una lista de lo que pasó en la partida)
   y botón Compartir (Web Share con la imagen; si no hay, se descarga).
   CompartirResultado.abrir({juego,logo,titulo,sub,cifras:[[emoji,valor,etiqueta]],filas:[{emoji,texto,valor,estado:"ok"|"mal"|""}],texto,archivo,contenedor})
   CompartirResultado.boton(opcionesOFuncion,clase) devuelve un <button> "📲 Compartir resultado" listo para poner en el final. */
window.CompartirResultado=(()=>{
  const imagenes=new Map();
  const imagen=src=>{if(!src)return Promise.resolve(null);if(!imagenes.has(src))imagenes.set(src,new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=src;}));return imagenes.get(src);};
  function recortar(g,t,max){t=String(t??"");if(g.measureText(t).width<=max)return t;while(t.length>1&&g.measureText(t+"…").width>max)t=t.slice(0,-1);return t+"…";}
  function ajustar(g,t,max,base,familia){let s=base;do{g.font=s+"px "+familia;s-=2;}while(g.measureText(t).width>max&&s>20);}
  function caja(g,x,y,w,h,r){g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,r);else g.rect(x,y,w,h);}
  async function foto(o){
    try{await Promise.all(['800 40px "Archivo Black"','700 30px Outfit','600 24px Outfit'].map(f=>document.fonts?.load(f)));}catch(e){}
    const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
    const fondo=g.createLinearGradient(0,0,0,H);fondo.addColorStop(0,"#4a2a7a");fondo.addColorStop(.45,"#2A1A3C");fondo.addColorStop(1,"#160B24");g.fillStyle=fondo;g.fillRect(0,0,W,H);
    // rayos suaves
    g.save();g.globalAlpha=.07;g.translate(W/2,170);for(let i=0;i<16;i++){g.rotate(Math.PI/8);g.fillStyle="#fff";g.beginPath();g.moveTo(0,0);g.lineTo(900,-70);g.lineTo(900,70);g.fill();}g.restore();
    let y=40;const logo=await imagen(o.logo);
    if(logo){const esc=Math.min(560/logo.width,250/logo.height),lw=logo.width*esc,lh=logo.height*esc;g.drawImage(logo,(W-lw)/2,y,lw,lh);y+=lh+28;}
    else{g.textAlign="center";g.textBaseline="top";g.fillStyle="#F5B301";ajustar(g,o.juego||"",900,76,'"Archivo Black",sans-serif');g.fillText(o.juego||"",W/2,y+30);y+=150;}
    g.textAlign="center";g.textBaseline="middle";
    if(o.titulo){g.fillStyle="#37D6C0";ajustar(g,o.titulo,960,58,'"Archivo Black",sans-serif');g.fillText(o.titulo,W/2,y+28);y+=76;}
    if(o.sub){g.fillStyle="#F6EFE2";g.font="600 32px Outfit,sans-serif";g.fillText(recortar(g,o.sub,960),W/2,y+16);y+=58;}
    const cifras=(o.cifras||[]).slice(0,3);
    if(cifras.length){
      y+=8;const gap=24,w=(W-120-gap*(cifras.length-1))/cifras.length,h=176;
      cifras.forEach(([emoji,valor,etiqueta],i)=>{
        const x=60+i*(w+gap);g.fillStyle="#2A1A3C";caja(g,x,y,w,h,28);g.fill();g.strokeStyle="#F5B30177";g.lineWidth=3;g.stroke();
        g.font="44px sans-serif";g.fillStyle="#fff";g.fillText(emoji||"",x+w/2,y+40);
        g.fillStyle="#F5B301";ajustar(g,String(valor),w-30,60,'"Archivo Black",sans-serif');g.fillText(String(valor),x+w/2,y+98);
        g.fillStyle="#E4D8EB";g.font="600 26px Outfit,sans-serif";g.fillText(recortar(g,etiqueta||"",w-24),x+w/2,y+148);
      });
      y+=h+30;
    }
    if(o.grilla&&o.grilla.celdas&&o.grilla.celdas.length){
      const cs=o.grilla.celdas,minF=Math.min(...cs.map(x=>x.f)),minC=Math.min(...cs.map(x=>x.c)),nf=Math.max(...cs.map(x=>x.f))-minF+1,nc=Math.max(...cs.map(x=>x.c))-minC+1;
      const pieG=H-180,lado=Math.floor(Math.min(92,900/nc,(pieG-y-10)/nf)),x0=(W-lado*nc)/2,y0=y;
      cs.forEach(d=>{const x=x0+(d.c-minC)*lado,yy=y0+(d.f-minF)*lado;
        g.fillStyle=d.estado==="ayuda"?"#F5B301":d.estado==="ok"?"#37D6C0":d.estado==="mal"?"#E5197C":"#f4eedf";caja(g,x+2,yy+2,lado-4,lado-4,Math.max(4,lado*.14));g.fill();
        if(d.letra){g.fillStyle="#1E1033";g.font='800 '+Math.round(lado*.56)+'px "Archivo Black",sans-serif';g.textAlign="center";g.fillText(d.letra,x+lado/2,yy+lado/2+2);}});
      y=y0+nf*lado+24;
    }
    if(o.circulo&&o.circulo.length){
      const pieC=H-180,R=Math.min(330,(pieC-y)/2-30),cx=W/2,cy=y+R+30,n=o.circulo.length,r=Math.min(40,R*Math.sin(Math.PI/n)*.9);
      o.circulo.forEach((d,i)=>{const a=i*2*Math.PI/n,x=cx+R*Math.sin(a),yy=cy-R*Math.cos(a);
        g.beginPath();g.arc(x,yy,r,0,7);g.fillStyle=d.estado==="ok"?"#37D6C0":d.estado==="mal"?"#E5197C":"#4A3A66";g.fill();g.lineWidth=4;g.strokeStyle="#160B24";g.stroke();
        g.fillStyle=d.estado?"#160B24":"#F6EFE2";g.font='800 '+Math.round(r*.95)+'px "Archivo Black",sans-serif';g.fillText(d.t,x,yy+2);});
      if(o.centro){g.fillStyle="#F5B301";ajustar(g,String(o.centro[0]),R*1.2,110,'"Archivo Black",sans-serif');g.fillText(String(o.centro[0]),cx,cy-10);g.fillStyle="#E4D8EB";g.font="700 30px Outfit,sans-serif";g.fillText(o.centro[1]||"",cx,cy+58);}
      y=cy+R+r+20;
    }
    const filas=(o.filas||[]).filter(Boolean),pie=H-170;
    if(filas.length){
      const maxF=Math.max(1,Math.floor((pie-y)/62)),lista=filas.slice(0,maxF),paso=Math.min(92,(pie-y)/lista.length),alto=paso*.84;
      lista.forEach((f,i)=>{
        const fy=y+i*paso,col=f.estado==="ok"?"#16816b":f.estado==="mal"?"#842541":"#f4eedf",txt=f.estado?"#fff":"#2A1A3C";
        g.fillStyle=col;caja(g,80,fy,W-160,alto,18);g.fill();
        const mid=fy+alto/2;let x=106;g.textAlign="left";
        if(f.emoji){g.font=Math.round(alto*.48)+"px sans-serif";g.fillStyle="#fff";g.fillText(f.emoji,x,mid+2);x+=alto*.7;}
        g.fillStyle=txt;g.font="700 "+Math.round(Math.min(34,alto*.42))+"px Outfit,sans-serif";g.fillText(recortar(g,f.texto,W-160-(x-80)-(f.valor!=null?190:30)),x,mid+2);
        if(f.valor!=null){g.textAlign="right";g.fillStyle=f.estado?"#FFE08A":"#7B3FE4";g.font='800 '+Math.round(Math.min(38,alto*.44))+'px "Archivo Black",sans-serif';g.fillText(recortar(g,String(f.valor),170),W-106,mid+2);}
      });
      if(filas.length>lista.length){g.textAlign="center";g.fillStyle="#cdbbdf";g.font="600 24px Outfit,sans-serif";g.fillText("… y "+(filas.length-lista.length)+" más",W/2,y+lista.length*paso+14);}
    }
    g.textAlign="center";g.fillStyle="#F5B301";g.font='800 48px "Archivo Black",sans-serif';g.fillText(o.reto||"¿Me ganás?",W/2,H-112);
    g.fillStyle="#E4D8EB";g.font="600 29px Outfit,sans-serif";g.fillText("Girá y Adiviná · "+(o.juego||""),W/2,H-58);
    return new Promise(ok=>c.toBlob(ok,"image/png"));
  }
  function link(){try{return location.origin&&location.origin!=="null"?location.origin:"https://girayadivina.com";}catch(e){return "https://girayadivina.com";}}
  async function abrir(o){
    if(typeof o==="function")o=o();if(!o)return;
    document.querySelector(".cr-compartir-capa")?.remove();
    const capa=document.createElement("dialog");capa.className="cr-compartir-capa";
    capa.innerHTML='<div class="cr-compartir-caja" role="dialog" aria-label="Compartir resultado"><button type="button" class="cr-compartir-x" aria-label="Cerrar">✕</button><h3>Compartí tu resultado</h3><div class="cr-compartir-foto"><span>Armando la foto…</span></div><button type="button" class="cr-compartir-ok" disabled>📲 Compartir</button></div>';
    /* <dialog> modal: queda arriba de todo, también de los finales que ya son diálogos (Palabras Cruzadas, No te caigas). */
    document.body.appendChild(capa);try{capa.showModal();}catch(e){capa.setAttribute("open","");}
    const cerrar=()=>{try{capa.close();}catch(e){}capa.remove();};capa.addEventListener("cancel",ev=>{ev.preventDefault();cerrar();});capa.querySelector(".cr-compartir-x").onclick=cerrar;capa.addEventListener("click",ev=>{if(ev.target===capa)cerrar();});
    let png=null;try{png=await foto(o);}catch(e){}
    if(!capa.isConnected)return;
    const ok=capa.querySelector(".cr-compartir-ok"),zona=capa.querySelector(".cr-compartir-foto");
    if(!png){zona.textContent="No se pudo crear la foto.";return;}
    const url=URL.createObjectURL(png);zona.innerHTML='<img alt="Mi resultado">';zona.querySelector("img").src=url;ok.disabled=false;
    const texto=(o.texto||("🎮 "+(o.juego||"Girá y Adiviná")+": "+(o.titulo||"")+(o.sub?" · "+o.sub:"")))+" ¿Me ganás? Jugá en Girá y Adiviná 👉 "+link();
    const nombre=(o.archivo||"resultado")+".png";
    ok.onclick=async()=>{
      const archivo=typeof File==="function"?new File([png],nombre,{type:"image/png"}):null;
      if(archivo&&typeof navigator.share==="function"){try{if(!navigator.canShare||navigator.canShare({files:[archivo]})){await navigator.share({files:[archivo],text:texto});return;}}catch(e){if(e?.name==="AbortError")return;}}
      const a=document.createElement("a");a.href=url;a.download=nombre;document.body.appendChild(a);a.click();a.remove();ok.textContent="Foto guardada · subila donde quieras";
    };
  }
  function boton(o,clase){const b=document.createElement("button");b.type="button";b.className="cr-boton"+(clase?" "+clase:"");b.textContent="📲 Compartir resultado";b.onclick=ev=>{ev.stopPropagation();abrir(typeof o==="function"?o():o);};return b;}
  const html=(clase)=>'<button type="button" class="cr-boton'+(clase?" "+clase:"")+'" data-compartir-resultado>📲 Compartir resultado</button>';
  function cerrar(){document.querySelectorAll(".cr-compartir-capa").forEach(x=>x.remove());}
  return{abrir,boton,html,foto,cerrar};
})();
