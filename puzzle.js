/* Puzzle: el juego vive entero en puzzle.html (canvas a pantalla completa,
   con sus propias variables globales $ y S que chocarían con index.html),
   así que acá solo se abre en un iframe que tapa toda la pantalla. El "‹"
   de puzzle.html vuelve al lobby. Récord en gya_puzzle {armados}. */
const Puzzle=(()=>{
  let marco=null;
  function abrir(contenedor){
    salir();
    marco=document.createElement("iframe");marco.src="puzzle.html?v=50";marco.title="Puzzle";
    marco.style.cssText="position:fixed;left:0;right:0;bottom:0;top:env(safe-area-inset-top,0px);width:100%;height:calc(100% - env(safe-area-inset-top,0px));border:0;z-index:60;background:#160B24";
    contenedor.appendChild(marco);
  }
  function salir(){if(marco){try{const w=marco.contentWindow;if(w&&w.salirSalaSilencio)w.salirSalaSilencio();}catch(e){}marco.remove();marco=null;}}
  function armados(){try{return(JSON.parse(localStorage.getItem("gya_puzzle")||"{}").armados)||0;}catch(e){return 0;}}
  return{abrir,salir,armados};
})();
window.Puzzle=Puzzle;
