/* Línea del tiempo (prueba Gonzalo y Vale): ubicar cada hecho en su lugar de la línea. */
(function(){
  const KEY="gya_linea_tiempo_record",POR_RONDA=10,VIDAS=3;
  let raiz=null,estado=null,tema="mezcla";
  const D=()=>window.LINEA_TIEMPO_DATOS.temas;
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const mezclar=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function record(){try{return Number(localStorage.getItem(KEY))||0;}catch(e){return 0;}}
  function guardarRecord(p){try{if(p>record())localStorage.setItem(KEY,String(p));}catch(e){}}
  function temaInfo(){return tema==="mezcla"?{nombre:"Mezcla",emoji:"🎲"}:D().find(t=>t.id===tema);}
  function hechos(){const lista=tema==="mezcla"?D().flatMap(t=>t.hechos.map(h=>h.concat(t.emoji))):D().find(t=>t.id===tema).hechos;
    return lista.map(h=>({anio:h[0],titulo:h[1],detalle:h[2],emoji:h[3]}));}

  function como(){PantallaFija.bienvenida(raiz.closest("#extContenido")||document.body,{titulo:"Línea del tiempo",alt:"Línea del tiempo",sinFija:true,items:[
    ["🃏","Sale una <b>carta</b> con un hecho de Uruguay, Argentina o el mundo."],
    ["👆","<b>Tocá el hueco</b> de la línea donde creés que va: antes, después o en el medio."],
    ["✅","Si acertás, muestra el año y suma más con cada <b>racha</b> 🔥."],
    ["💔","Si le errás, se va a su lugar y perdés una <b>vida</b>. Tenés 3."]]});}

  function abrir(contenedor){
    salir();
    raiz=document.createElement("section");raiz.className="lt";contenedor.appendChild(raiz);
    elegirTema();como();
  }
  function salir(){document.querySelectorAll(".pf-bienv").forEach(x=>x.remove());if(raiz){raiz.remove();raiz=null;}estado=null;}

  function elegirTema(){
    estado=null;
    const opciones=[{id:"mezcla",nombre:"Mezcla",emoji:"🎲",n:D().reduce((a,t)=>a+t.hechos.length,0)}].concat(D().map(t=>({id:t.id,nombre:t.nombre,emoji:t.emoji,n:t.hechos.length})));
    raiz.innerHTML='<div class="lt-hud"><span>Récord <b>'+record()+'</b></span><button type="button" class="lt-ayuda" aria-label="Cómo se juega">❓</button></div>'+
      '<p class="lt-tema-titulo">Elegí un tema</p><div class="lt-temas">'+opciones.map(o=>'<button type="button" data-tema="'+o.id+'"><span>'+o.emoji+'</span><b>'+esc(o.nombre)+'</b><small>'+o.n+' hechos</small></button>').join("")+'</div>';
    raiz.querySelector(".lt-ayuda").onclick=como;
    raiz.querySelectorAll("[data-tema]").forEach(b=>b.onclick=()=>{tema=b.dataset.tema;empezar();});
  }

  function empezar(){
    const mazo=mezclar(hechos());
    estado={linea:[mazo[0]],mazo:mazo.slice(1,POR_RONDA+1),actual:null,puntos:0,racha:0,vidas:VIDAS,hechas:0,resultado:null};
    siguiente();
  }
  function siguiente(){
    if(!estado.mazo.length||estado.vidas<=0)return fin();
    estado.actual=estado.mazo.shift();estado.resultado=null;pintar();
  }
  function ubicar(pos){
    if(!estado||estado.resultado)return;
    const L=estado.linea,c=estado.actual;
    const antes=pos>0?L[pos-1].anio:-Infinity,despues=pos<L.length?L[pos].anio:Infinity;
    const bien=c.anio>=antes&&c.anio<=despues;
    let lugar=pos;
    if(!bien){lugar=L.findIndex(x=>x.anio>c.anio);if(lugar<0)lugar=L.length;}
    L.splice(lugar,0,c);estado.hechas++;
    if(bien){estado.racha++;const p=10+10*estado.racha;estado.puntos+=p;estado.resultado={bien:true,lugar,texto:"+"+p+(estado.racha>1?" · racha x"+estado.racha:"")};}
    else{estado.racha=0;estado.vidas--;estado.resultado={bien:false,lugar,texto:"Era "+c.anio};}
    pintar();
  }

  function hud(){const v="♥".repeat(estado.vidas)+"♡".repeat(VIDAS-estado.vidas);
    return '<div class="lt-hud"><span>Puntos <b>'+estado.puntos+'</b></span><span>Racha <b>'+estado.racha+'🔥</b></span><span class="lt-vidas" aria-label="'+estado.vidas+' vidas">'+v+'</span><button type="button" class="lt-ayuda" aria-label="Cómo se juega">❓</button></div>';}
  function carta(h,clase){return '<div class="lt-carta '+(clase||"")+'"><span class="lt-e">'+h.emoji+'</span><span class="lt-t">'+esc(h.titulo)+'<small>'+esc(h.detalle)+'</small></span><span class="lt-a">'+h.anio+'</span></div>';}
  function pintar(){
    const t=temaInfo(),r=estado.resultado,L=estado.linea;
    let linea="";
    L.forEach((h,i)=>{
      if(!r)linea+='<button type="button" class="lt-hueco" data-pos="'+i+'">¿va acá?</button>';
      linea+=carta(h,r&&r.lugar===i?(r.bien?"lt-ok":"lt-mal"):"");
    });
    if(!r)linea+='<button type="button" class="lt-hueco" data-pos="'+L.length+'">¿va acá?</button>';
    const num=Math.min(estado.hechas+(r?0:1),POR_RONDA);
    raiz.innerHTML=hud()+'<div class="lt-tema">'+t.emoji+" "+esc(t.nombre).toUpperCase()+" · CARTA "+num+" DE "+POR_RONDA+'</div>'+
      '<div class="lt-linea">'+linea+'</div>'+
      '<div class="lt-pie">'+(r?
        '<div class="lt-cartel '+(r.bien?"":"lt-cartel-mal")+'" role="status"><b>'+(r.bien?"¡BIEN!":"¡UY!")+'</b><span>'+r.texto+'</span></div><button type="button" class="lt-siguiente">'+(estado.mazo.length&&estado.vidas>0?"Siguiente carta ➜":"Ver resultado ➜")+'</button>':
        '<div class="lt-nueva"><span class="lt-e">'+estado.actual.emoji+'</span><span><b>'+esc(estado.actual.titulo)+'</b><small>'+esc(estado.actual.detalle)+' · ¿En qué año fue?</small></span><span class="lt-q">?</span></div><p class="lt-ayuda-txt">Tocá el hueco donde va la carta</p>')+'</div>';
    raiz.querySelector(".lt-ayuda").onclick=como;
    raiz.querySelectorAll(".lt-hueco").forEach(b=>b.onclick=()=>ubicar(Number(b.dataset.pos)));
    const sig=raiz.querySelector(".lt-siguiente");if(sig)sig.onclick=siguiente;
    const marco=raiz.querySelector(".lt-linea"),foco=raiz.querySelector(".lt-ok,.lt-mal");
    if(foco)marco.scrollTop=Math.max(0,foco.offsetTop-marco.clientHeight/2+foco.offsetHeight/2);
  }
  function fin(){
    const p=estado.puntos,antes=record();guardarRecord(p);
    const completa=estado.vidas>0;
    const capa=document.createElement("div");capa.className="lt-final";
    capa.innerHTML='<div class="lt-final-caja"><span class="lt-final-icono">'+(completa?"🏆":"⏳")+'</span><h3>'+(completa?"¡Línea completa!":"Se terminaron las vidas")+'</h3><p><b>'+p+' puntos</b> · '+(estado.hechas-(VIDAS-estado.vidas))+' de '+estado.hechas+' bien ubicadas</p><p>'+(p>antes?"¡Nuevo récord! 🎉":"Récord: "+record())+'</p><button type="button" class="lt-otra">Jugar otra vez</button><button type="button" class="lt-temas-btn">Elegir tema</button></div>';
    raiz.appendChild(capa);
    capa.querySelector(".lt-otra").onclick=empezar;capa.querySelector(".lt-temas-btn").onclick=elegirTema;
  }
  window.LineaTiempo={abrir,salir,record};
})();
