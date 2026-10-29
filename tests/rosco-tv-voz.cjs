/* Prueba independiente: Rosco horizontal en modo TV, consulta Sí/No y
   reconocimiento automático. Ejecutar: node tests/rosco-tv-voz.cjs */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const js=fs.readFileSync(path.join(root,"rosco-rioplatense.js"),"utf8");
const css=fs.readFileSync(path.join(root,"rosco-horizontal.css"),"utf8");
const ext=fs.readFileSync(path.join(root,"extensiones.js"),"utf8");
const extCss=fs.readFileSync(path.join(root,"extensiones.css"),"utf8");
const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sw=fs.readFileSync(path.join(root,"sw.js"),"utf8");
new Function(js);new Function(ext);new Function(sw);
assert(js.includes('if(resultado.isFinal){vozSilenciosG=0;pasar();return;}'),"Pasapalabra confirmado por voz");
assert(js.includes('$("#rrEntrada").value=items[actual].palabra;'),"Aceptar frase natural en una sola respuesta hablada");
assert(js.includes('r.interimResults=true;r.maxAlternatives=5;'),"Reconocimiento de voz como Duelo");
assert(!js.includes("navigator.mediaDevices.getUserMedia("),"No reservar el micrófono dos veces al duplicar pantalla");
assert(js.includes("Micrófono en pausa · se reanuda al volver."),"El modo de voz no se pierde al compartir pantalla");
assert(js.includes('campo.inputMode=propio||vozG?"none":"text";'),"El teclado nativo no debe superponerse al propio");
assert(js.includes('const valeEnTV=')&&js.includes('pruebaG=(typeof esGonzalo==='),"Solo Gonzalo y Vale con TV");
assert(js.includes('if(pruebaG&&typeof esGonzalo==="function"&&esGonzalo()&&typeof window.GiroRoscoPiloto?.mostrarFinal'),"Giro sigue reservado para Gonzalo");
assert(css.includes(".rr-game .rr-voz-consulta"),"El aviso de voz tiene estilo");
assert(ext.includes('shell.classList.toggle("ext-tv-activo"'),"Marcador para mover extensiones solamente en TV");
assert(extCss.includes(".ext-shell.ext-tv-activo .ext-wrap"),"Desplazar TV sin alterar celular");
assert(index.includes("rosco-rioplatense.js?v=35"));
assert(index.includes("rosco-horizontal.css?v=11"));
assert(index.includes("extensiones.js?v=99"));
assert(sw.includes("gya-cache-v521"));
const a=js.indexOf("  let vozConsultadaG=false,avisoVozG=null;");
const b=js.indexOf("  /* Dibujos en assets/rosco/",a);
assert(a>=0&&b>a,"Funciones reales de consulta encontradas");
const fragment=js.slice(a,b);
function simulate(enabled,yes){
  const calls=[];
  const layer={
    setAttribute(){},
    addEventListener(_,fn){this.click=fn;},
    querySelector(){return {focus(){}};},
    remove(){calls.push("removed");}
  };
  const env={
    pruebaG:enabled,vozLeyendoG:false,vozG:false,ultimo:0,actual:0,
    items:[{definicion:"prueba"}],fase:"resolver",audioMusica:null,
    horizontalG:()=>true,
    window:{GyaTV:{activo:()=>true}},
    performance:{now:()=>345},
    document:{hidden:false,createElement:()=>layer},
    raiz:{appendChild(){calls.push("shown");}},
    alternarVozG(){this.vozG=true;calls.push("voice");},
    leerPistaG(){calls.push("clue");},
    hablar(){calls.push("fallback");}
  };
  const shown=new Function("env","with(env){"+fragment+" return mostrarConsultaVozG();}")(env);
  if(enabled){
    assert.equal(shown,true);
    layer.click({target:{closest(){return{dataset:{voz:yes?"si":"no"}};}}});
  }
  return {shown,calls};
}
assert.deepEqual(simulate(true,true).calls,["shown","removed","voice","clue"],"Sí activa la voz automáticamente");
assert.deepEqual(simulate(true,false).calls,["shown","removed","fallback"],"No conserva lectura tradicional");
const other=simulate(false,false);
assert.equal(other.shown,false,"No aparece el aviso a perfiles no habilitados");
assert.deepEqual(other.calls,[]);
console.log("PASS: Sí activa voz, No conserva el teclado, Pasapalabra y respuesta sin Enviar, TV desplaza contenido y protege perfiles");
