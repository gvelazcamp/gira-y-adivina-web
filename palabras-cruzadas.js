/* Crucigramas clásicos: cada cruce es una única casilla compartida. */
window.PalabrasCruzadas=(()=>{
  const CLAVE="gya_palabras_cruzadas",AYUDAS=3;
  const banco=()=>window.PALABRAS_CRUZADAS_DATOS||[];
  const normalizar=s=>String(s||"").toUpperCase().replace(/Ñ/g,"\u0001").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\u0001/g,"Ñ").replace(/[^A-ZÑ]/g,"");
  const clave=(f,c)=>f+","+c;
  let raiz=null,crucigrama=null,palabras=[],celdas=new Map(),seleccion=0,cursor=null,errores=new Set(),mensajeActual="";
  let datos=cargar();
  function cargar(){
    try{
      const d=JSON.parse(localStorage.getItem(CLAVE)||"null");
      if(d&&d.version===1)return{version:1,actual:typeof d.actual==="string"?d.actual:"pc-1",letras:d.letras&&typeof d.letras==="object"&&!Array.isArray(d.letras)?d.letras:{},ayudas:Array.isArray(d.ayudas)?d.ayudas:[],revisadas:Array.isArray(d.revisadas)?d.revisadas:[],guiaVista:d.guiaVista===true,resueltos:Array.isArray(d.resueltos)?d.resueltos.filter(x=>typeof x==="string"):[],total:Number.isSafeInteger(d.total)&&d.total>=0?d.total:0,seleccion:Number.isInteger(d.seleccion)?d.seleccion:0};
    }catch(e){}
    return{version:1,actual:"pc-1",letras:{},ayudas:[],revisadas:[],guiaVista:false,resueltos:[],total:0,seleccion:0};
  }
  function guardar(){datos.seleccion=seleccion;try{localStorage.setItem(CLAVE,JSON.stringify(datos));}catch(e){}}
  const completa=p=>p.casillas.every(k=>datos.letras[k]===celdas.get(k).letra);
  const terminado=()=>palabras.length>0&&palabras.every(completa);
  const fija=k=>datos.ayudas.includes(k);
  function preparar(){
    crucigrama=banco().find(p=>p.id===datos.actual)||banco()[0];if(!crucigrama)return false;
    datos.actual=crucigrama.id;celdas=new Map();
    palabras=crucigrama.palabras.map((p,i)=>{
      const respuesta=normalizar(p.respuesta),casillas=[];
      for(let n=0;n<respuesta.length;n++){
        const f=p.fila+(p.direccion==="V"?n:0),c=p.columna+(p.direccion==="H"?n:0),k=clave(f,c);
        if(!celdas.has(k))celdas.set(k,{fila:f,columna:c,letra:respuesta[n],palabras:[]});
        celdas.get(k).palabras.push(i);casillas.push(k);
      }
      return{...p,respuestaNormal:respuesta,casillas};
    });
    const comienzos=[...new Set(palabras.map(p=>p.casillas[0]))].sort((a,b)=>{const x=celdas.get(a),y=celdas.get(b);return x.fila-y.fila||x.columna-y.columna;});
    palabras.forEach(p=>p.numero=comienzos.indexOf(p.casillas[0])+1);
    datos.letras=Object.fromEntries(Object.entries(datos.letras).filter(([k,l])=>celdas.has(k)&&typeof l==="string"&&/^[A-ZÑ]$/.test(l)));
    datos.ayudas=[...new Set(datos.ayudas)].filter(k=>celdas.has(k)&&datos.letras[k]===celdas.get(k).letra).slice(0,AYUDAS);
    datos.revisadas=[...new Set(datos.revisadas)].filter(k=>celdas.has(k)&&datos.letras[k]);
    datos.resueltos=[...new Set(datos.resueltos)].filter(id=>banco().some(p=>p.id===id));
    seleccion=datos.seleccion>=0&&datos.seleccion<palabras.length?datos.seleccion:0;
    cursor=palabras[seleccion].casillas.find(k=>!datos.letras[k])||palabras[seleccion].casillas.find(k=>!fija(k))||palabras[seleccion].casillas[0];
    errores=new Set();mensajeActual="";guardar();return true;
  }
  function estructura(){
    raiz.innerHTML=`<div class="pc-juego">
      <header class="pc-cabecera"><div><img src="logo-palabras-cruzadas.svg" alt="Palabras Cruzadas" class="pc-logo"><p>Un cruce, otra palabra, una idea más.</p></div><button type="button" class="pc-redondo" id="pcAyudaBoton" aria-label="Cómo jugar">Cómo jugar</button></header>
      <div class="pc-avance"><span id="pcNivel"></span><span id="pcProgreso" role="status"></span></div>
      <div class="pc-contenido"><section class="pc-panel-tablero" aria-label="Crucigrama">
        <p class="pc-instruccion">Tocá una casilla clara, leé su pista y escribí la respuesta. Las oscuras no se usan.</p>
        <div class="pc-pista-actual"><button type="button" class="pc-flecha" id="pcAnterior" aria-label="Pista anterior">‹<small>Anterior</small></button><div><b id="pcDireccion"></b><p id="pcPista"></p><small id="pcLargo"></small></div><button type="button" class="pc-flecha" id="pcProxima" aria-label="Pista siguiente">›<small>Otra pista</small></button></div>
        <div class="pc-leyenda" role="group" aria-label="Qué significa cada color"><span><i class="pc-muestra-blanca"></i>Blanco: sin comprobar</span><span><i class="pc-muestra-palabra"></i>Celeste: palabra elegida</span><span><i class="pc-muestra-cursor"></i>Borde azul: escribís acá</span><span><i class="pc-muestra-bien">✓</i>Verde: letra correcta</span><span><i class="pc-muestra-mal">×</i>Rojo: letra incorrecta</span><span><i class="pc-muestra-ayuda">🔒</i>Dorado: ayuda fija</span></div>
        <div id="pcGrilla" class="pc-grilla" role="group" aria-label="Tablero de palabras cruzadas"></div>
        <div class="pc-seleccion-info"><span id="pcPosicion" role="status" aria-live="polite"></span><button type="button" id="pcCambiarDireccion" hidden>↔ Cambiar dirección</button></div>
        <p id="pcMensaje" class="pc-mensaje" role="status" aria-live="polite"></p>
        <div class="pc-acciones"><button type="button" id="pcComprobar">Comprobar palabra</button><button type="button" id="pcRevelar">Revelar letra (3)</button></div>
        <div id="pcTeclado" class="pc-teclado" aria-label="Teclado del crucigrama"></div>
        <div id="pcContinuar" class="pc-continuar" hidden><button type="button" id="pcVerResultado">Ver resultado</button><button type="button" id="pcSiguiente">Siguiente crucigrama</button></div>
      </section><section class="pc-panel-pistas" aria-label="Pistas del crucigrama"><h3>Las pistas</h3><p class="pc-nota">Tocá una pista o una casilla para escribir.</p><div id="pcHorizontales"></div><div id="pcVerticales"></div></section></div>
      <dialog id="pcAyuda" class="pc-dialogo"><button type="button" class="pc-cerrar" aria-label="Cerrar ayuda">×</button><h2>Así se juega</h2>
        <ol class="pc-pasos"><li><b>Leé la pista.</b> Por ejemplo: «Lugar donde vivís» (4 letras).</li><li><b>Tocá sus casillas y escribí CASA.</b> La palabra se marca en celeste. El borde azul muestra dónde va la próxima letra.</li></ol>
        <div class="pc-demo" role="img" aria-label="Ejemplo: CASA horizontal cruza con SOL vertical, compartiendo la S. El último cuadro de CASA tiene borde azul."><span>C</span><span>A</span><span>S</span><span class="pc-demo-activa">_</span><i></i><i></i><span class="pc-demo-cruce">O</span><i></i><i></i><i></i><span class="pc-demo-cruce">L</span><i></i></div><p>Acá falta la última A de CASA. La S se comparte con SOL.</p>
        <p>En un cruce, una misma letra sirve para dos palabras. Podés tocar <b>Cambiar dirección</b> para elegir horizontal o vertical.</p>
        <p><b>Comprobar palabra</b> marca cada letra escrita: <strong class="pc-texto-bien">verde ✓ = correcta</strong> y <strong class="pc-texto-mal">rojo × = incorrecta</strong>. Tocá una roja y escribí otra letra para corregirla.</p>
        <p><b>Revelar letra</b> escribe una letra por vos. Queda dorada con 🔒 y no se puede cambiar. Tenés tres ayudas por crucigrama.</p>
        <p>Las casillas blancas todavía no están comprobadas. Solo las oscuras no se pueden tocar. Escribí sin tildes ni espacios, conservando la Ñ. No hay reloj y tu partida se guarda.</p>
        <button type="button" class="pc-principal pc-entendido" autofocus>Entendido, jugar</button></dialog>
      <dialog id="pcFinal" class="pc-dialogo"><button type="button" class="pc-cerrar" aria-label="Ver el tablero">×</button><span class="pc-trofeo" aria-hidden="true">✦</span><h2>¡Crucigrama completo!</h2><p id="pcResumen"></p><button type="button" id="pcSiguienteFinal" class="pc-principal">Siguiente crucigrama</button><button type="button" id="pcRevisar">Ver el tablero</button></dialog>
    </div>`;
    raiz.querySelector("#pcAyudaBoton").onclick=()=>raiz.querySelector("#pcAyuda").showModal();
    raiz.querySelector("#pcAyuda").addEventListener("close",()=>{const primera=!datos.guiaVista;datos.guiaVista=true;guardar();if(primera&&raiz&&matchMedia("(max-width:759px)").matches)raiz.querySelector(".pc-instruccion").scrollIntoView({block:"start",behavior:"instant"});});
    raiz.querySelector("#pcCambiarDireccion").onclick=()=>{const opts=celdas.get(cursor).palabras;const otra=opts.find(i=>i!==seleccion);if(otra!==undefined)elegir(otra,cursor);};
    raiz.querySelectorAll("#pcAyuda button").forEach(b=>b.onclick=()=>raiz.querySelector("#pcAyuda").close());
    raiz.querySelectorAll("#pcFinal .pc-cerrar,#pcRevisar").forEach(b=>b.onclick=()=>raiz.querySelector("#pcFinal").close());
    raiz.querySelector("#pcVerResultado").onclick=mostrarResultado;
    raiz.querySelector("#pcSiguiente").onclick=siguiente;raiz.querySelector("#pcSiguienteFinal").onclick=siguiente;
    raiz.querySelector("#pcAnterior").onclick=()=>elegir((seleccion+palabras.length-1)%palabras.length);
    raiz.querySelector("#pcProxima").onclick=()=>elegir((seleccion+1)%palabras.length);
    raiz.querySelector("#pcComprobar").onclick=comprobar;raiz.querySelector("#pcRevelar").onclick=revelar;
    const teclado=raiz.querySelector("#pcTeclado");
    for(const fila of ["QWERTYUIOP","ASDFGHJKLÑ","ZXCVBNM"]){
      const row=document.createElement("div");row.className="pc-teclas";
      for(const letra of fila){const b=document.createElement("button");b.type="button";b.textContent=letra;b.setAttribute("aria-label","Letra "+letra);b.onclick=()=>tecla(letra);row.appendChild(b);}
      if(fila==="ZXCVBNM"){const b=document.createElement("button");b.type="button";b.textContent="⌫";b.setAttribute("aria-label","Borrar letra");b.onclick=()=>tecla("Backspace");row.appendChild(b);}
      teclado.appendChild(row);
    }
  }
  function elegir(i,k=null){
    if(!raiz)return;seleccion=i;cursor=k||palabras[i].casillas[0];
    mensajeActual="";guardar();pintar();
  }
  function tocar(k){
    const opciones=celdas.get(k).palabras;
    let i=opciones.includes(seleccion)?seleccion:opciones.find(n=>palabras[n].direccion===palabras[seleccion].direccion)??opciones[0];
    if(k===cursor&&opciones.length>1)i=opciones.find(n=>n!==seleccion)??i;
    elegir(i,k);
  }
  function pintar(){
    if(!raiz)return;
    errores=new Set(datos.revisadas.filter(k=>datos.letras[k]&&datos.letras[k]!==celdas.get(k).letra));
    const g=raiz.querySelector("#pcGrilla"),foco=document.activeElement?.classList.contains("pc-celda");
    g.style.setProperty("--pc-cols",crucigrama.columnas);g.style.setProperty("--pc-filas",crucigrama.filas);g.replaceChildren();
    const seleccionada=palabras[seleccion],ganadas=palabras.filter(completa),verdes=new Set(ganadas.flatMap(p=>p.casillas).concat(datos.revisadas.filter(k=>datos.letras[k]===celdas.get(k).letra)));
    for(let f=0;f<crucigrama.filas;f++)for(let c=0;c<crucigrama.columnas;c++){
      const k=clave(f,c),celda=celdas.get(k);
      if(!celda){const negro=document.createElement("span");negro.className="pc-negra";negro.setAttribute("aria-hidden","true");g.appendChild(negro);continue;}
      const b=document.createElement("button");b.type="button";b.className="pc-celda"+(seleccionada.casillas.includes(k)?" pc-seleccionada":"")+(cursor===k?" pc-activa":"")+(verdes.has(k)?" pc-correcta":"")+(errores.has(k)?" pc-error":"")+(datos.ayudas.includes(k)?" pc-revelada":"");
      b.dataset.casilla=k;b.tabIndex=cursor===k?0:-1;b.setAttribute("aria-pressed",String(cursor===k));b.setAttribute("aria-invalid",String(errores.has(k)));
      const comienzo=palabras.find(p=>p.casillas[0]===k);
      if(comienzo){const n=document.createElement("small");n.textContent=comienzo.numero;b.appendChild(n);}
      const l=document.createElement("span");l.textContent=datos.letras[k]||"";b.appendChild(l);
      b.setAttribute("aria-label",`Fila ${f+1}, columna ${c+1}: ${datos.letras[k]||"vacía"}${cursor===k?", escribís aquí":""}${datos.ayudas.includes(k)?", ayuda fija, no editable":errores.has(k)?", letra incorrecta":verdes.has(k)?", letra correcta":""}`);b.onclick=()=>tocar(k);g.appendChild(b);
    }
    if(foco)g.querySelector('[data-casilla="'+cursor+'"]').focus({preventScroll:true});
    raiz.querySelector("#pcNivel").textContent="Crucigrama "+(banco().indexOf(crucigrama)+1)+" de "+banco().length;
    raiz.querySelector("#pcProgreso").textContent="Palabras resueltas: "+ganadas.length+" / "+palabras.length;
    raiz.querySelector("#pcDireccion").textContent="Pista "+seleccionada.numero+" · "+(seleccionada.direccion==="H"?"Horizontal →":"Vertical ↓");
    raiz.querySelector("#pcPista").textContent=seleccionada.pista;
    const largos=seleccionada.respuesta.split(/\s+/).map(w=>normalizar(w).length);
    raiz.querySelector("#pcLargo").textContent=largos.length>1?largos.join(" + ")+" letras · sin espacio":largos[0]+" letras";
    for(const [dir,id,titulo] of [["H","pcHorizontales","Horizontales →"],["V","pcVerticales","Verticales ↓"]]){
      const panel=raiz.querySelector("#"+id);panel.replaceChildren();const h=document.createElement("h4");h.textContent=titulo;panel.appendChild(h);
      palabras.forEach((p,i)=>{if(p.direccion!==dir)return;const b=document.createElement("button");b.type="button";b.className="pc-pista"+(i===seleccion?" pc-elegida":"")+(completa(p)?" pc-lista":"");
        b.setAttribute("aria-pressed",String(i===seleccion));b.dataset.palabra=i;
        const n=document.createElement("b");n.textContent=p.numero;const texto=document.createElement("span");texto.textContent=p.pista+(completa(p)?" ✓":"");b.append(n,texto);b.onclick=()=>{elegir(i);if(matchMedia("(max-width:759px)").matches)raiz.querySelector(".pc-instruccion").scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth"});};panel.appendChild(b);});
    }
    const posicion=raiz.querySelector("#pcPosicion");
    posicion.textContent=completa(seleccionada)?"✓ Palabra resuelta. Elegí otra pista para seguir.":fija(cursor)?"🔒 Esta letra es una ayuda fija. Tocá otra casilla.":"Borde azul: letra "+(seleccionada.casillas.indexOf(cursor)+1)+" de "+seleccionada.casillas.length;
    const cambiar=raiz.querySelector("#pcCambiarDireccion");cambiar.hidden=celdas.get(cursor).palabras.length<2;
    raiz.querySelector("#pcMensaje").textContent=mensajeActual;raiz.querySelector("#pcMensaje").hidden=!mensajeActual;
    const fin=terminado();raiz.querySelector("#pcRevelar").textContent="Revelar letra ("+(AYUDAS-datos.ayudas.length)+")";
    raiz.querySelector("#pcRevelar").disabled=fin||completa(seleccionada)||datos.ayudas.length>=AYUDAS;raiz.querySelector("#pcComprobar").disabled=fin;
    raiz.querySelectorAll("#pcTeclado button").forEach(b=>b.disabled=fin);
    raiz.querySelector("#pcContinuar").hidden=!fin;
    const ultimo=banco().indexOf(crucigrama)===banco().length-1;
    raiz.querySelector("#pcSiguiente").textContent=ultimo?"Volver a empezar":"Siguiente crucigrama";
    raiz.querySelector("#pcSiguienteFinal").textContent=ultimo?"Volver a empezar":"Siguiente crucigrama";
  }
  function verificarFinal(){
    const fin=terminado();
    if(fin&&!datos.resueltos.includes(crucigrama.id)){datos.resueltos.push(crucigrama.id);datos.total++;guardar();pintar();mostrarResultado();if(typeof bip==="function")bip(900,.1);}
  }
  function avanzar(){
    const lista=palabras[seleccion].casillas,pos=lista.indexOf(cursor);
    if(pos<lista.length-1)cursor=lista[pos+1];
  }
  function tecla(valor){
    if(!raiz||raiz.querySelector("dialog[open]")||terminado())return false;
    if(valor==="Enter"){const siguientes=palabras.map((_,i)=>(seleccion+i+1)%palabras.length);elegir(siguientes.find(i=>!completa(palabras[i]))??seleccion);return true;}
    if(valor===" "){const opts=celdas.get(cursor).palabras;if(opts.length>1)elegir(opts.find(i=>i!==seleccion),cursor);return true;}
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(valor)){
      const df=valor==="ArrowDown"?1:valor==="ArrowUp"?-1:0,dc=valor==="ArrowRight"?1:valor==="ArrowLeft"?-1:0;
      let {fila:f,columna:c}=celdas.get(cursor);
      while((f+=df)>=0&&f<crucigrama.filas&&(c+=dc)>=0&&c<crucigrama.columnas){const k=clave(f,c);if(celdas.has(k)){const opts=celdas.get(k).palabras;elegir(opts.find(i=>palabras[i].direccion===(df?"V":"H"))??opts[0],k);break;}}
      return true;
    }
    if(valor==="Backspace"||valor==="Delete"){
      if(!fija(cursor)&&datos.letras[cursor])delete datos.letras[cursor];
      else if(valor==="Backspace"){const lista=palabras[seleccion].casillas;for(let i=lista.indexOf(cursor)-1;i>=0;i--)if(!fija(lista[i])){cursor=lista[i];delete datos.letras[cursor];break;}}
      datos.revisadas=datos.revisadas.filter(k=>k!==cursor);errores.delete(cursor);mensajeActual="";guardar();pintar();return true;
    }
    const letra=normalizar(valor);if(letra.length!==1||valor.length!==1)return false;
    if(fija(cursor)){if(datos.letras[cursor]===letra){avanzar();mensajeActual="";}else mensajeActual="Esta letra está revelada y no se puede cambiar.";guardar();pintar();return true;}
    datos.letras[cursor]=letra;datos.revisadas=datos.revisadas.filter(k=>k!==cursor);errores.delete(cursor);mensajeActual="";avanzar();guardar();pintar();verificarFinal();return true;
  }
  function comprobar(){
    const p=palabras[seleccion],escritas=p.casillas.filter(k=>datos.letras[k]),malas=escritas.filter(k=>datos.letras[k]!==celdas.get(k).letra),vacias=p.casillas.filter(k=>!datos.letras[k]);
    datos.revisadas=[...new Set(datos.revisadas.concat(escritas))];
    const buenas=escritas.length-malas.length;
    mensajeActual=malas.length?buenas+(buenas===1?" correcta · ":" correctas · ")+malas.length+(malas.length===1?" incorrecta. ":" incorrectas. ")+"Tocá una roja para cambiarla.":vacias.length?(escritas.length===0?"Tocá la casilla con borde azul y escribí la respuesta.":vacias.length===1?"Falta una letra para completar esta palabra.":"Faltan "+vacias.length+" letras para completar esta palabra."):"¡Palabra correcta! Elegí otra pista para seguir.";
    guardar();pintar();
  }
  function revelar(){
    if(terminado()||completa(palabras[seleccion])||datos.ayudas.length>=AYUDAS)return;
    const lista=palabras[seleccion].casillas;
    const k=datos.letras[cursor]!==celdas.get(cursor).letra?cursor:lista.find(x=>datos.letras[x]!==celdas.get(x).letra);if(!k)return;
    datos.letras[k]=celdas.get(k).letra;datos.ayudas.push(k);datos.revisadas=datos.revisadas.filter(x=>x!==k);
    const pos=lista.indexOf(k);cursor=lista.find((x,i)=>i>pos&&!fija(x)&&datos.letras[x]!==celdas.get(x).letra)||lista.find(x=>!fija(x)&&datos.letras[x]!==celdas.get(x).letra)||k;
    mensajeActual="Mostramos una letra dorada con 🔒. Seguí en la casilla con borde azul.";
    guardar();pintar();verificarFinal();
  }
  function mostrarResultado(){
    if(!raiz||!terminado())return;
    raiz.querySelector("#pcResumen").textContent="Resolviste las "+palabras.length+" palabras de «"+crucigrama.titulo+"»"+(datos.ayudas.length?" con "+datos.ayudas.length+(datos.ayudas.length===1?" letra de ayuda.":" letras de ayuda."):" sin revelar letras. ¡Bien ahí!");
    const d=raiz.querySelector("#pcFinal");if(!d.open)d.showModal();
  }
  function siguiente(){
    if(!terminado())return;
    raiz.querySelector("#pcFinal").close();const indice=banco().indexOf(crucigrama),nuevo=(indice+1)%banco().length;
    if(nuevo===0)datos.resueltos=[];
    datos.actual=banco()[nuevo].id;datos.letras={};datos.ayudas=[];datos.revisadas=[];datos.seleccion=0;preparar();pintar();
    raiz.querySelector(".pc-juego").scrollIntoView({block:"start",behavior:"instant"});
  }
  function abrir(contenedor){salir();raiz=contenedor;raiz.closest(".ext-shell")?.classList.add("pc-abierta");if(!preparar()){raiz.textContent="No se pudo cargar Palabras Cruzadas. Recargá el juego.";return;}estructura();pintar();if(!datos.guiaVista)raiz.querySelector("#pcAyuda").showModal();}
  function salir(){if(raiz){raiz.closest(".ext-shell")?.classList.remove("pc-abierta");guardar();raiz.querySelectorAll("dialog[open]").forEach(d=>d.close());}raiz=null;crucigrama=null;palabras=[];celdas=new Map();}
  return{abrir,salir,tecla,resueltos:()=>datos.total};
})();
