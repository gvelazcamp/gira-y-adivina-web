/* Edición de práctica: preguntas originales y puntajes de juego, no encuestas reales.
   Cada panel suma 100. Reemplazar puntos por resultados medidos al incorporar encuestas. */
const CIEN_CATEGORIAS=[
  {id:"comida",nombre:"Comida",corto:"Comida",icono:"🍖",color:"#BE2865"},
  {id:"carnaval",nombre:"Carnaval",corto:"Carnaval",icono:"🥁",color:"#7044BD"},
  {id:"futbol",nombre:"Fútbol",corto:"Fútbol",icono:"⚽",color:"#087F70"},
  {id:"costumbres",nombre:"Costumbres",corto:"Hábitos",icono:"🧉",color:"#AF5B20"},
  {id:"lunfardo",nombre:"Lunfardo",corto:"Lunfardo",icono:"💬",color:"#2859AC"},
  {id:"ciudades",nombre:"Ciudades",corto:"Ciudades",icono:"🏙️",color:"#997218"},
  {id:"playa",nombre:"Playa",corto:"Playa",icono:"🏖️",color:"#087F96"},
  {id:"musica",nombre:"Música",corto:"Música",icono:"🎸",color:"#AE356E"},
  {id:"viajes",nombre:"Viajes",corto:"Viajes",icono:"🧳",color:"#5152AC"},
  {id:"casa",nombre:"Casa",corto:"Casa",icono:"🏠",color:"#A54735"},
  {id:"animales",nombre:"Animales",corto:"Animales",icono:"🐾",color:"#337844"},
  {id:"escuela",nombre:"Escuela",corto:"Escuela",icono:"🎒",color:"#815096"}
];
// id | categoría | pregunta | respuesta:puntos:alias separados por coma; ...
const CIEN_PREGUNTAS=`asado|comida|Algo que ponés en la mesa cuando hay asado|Pan:30:pancito,panes;Ensalada:24:ensaladas;Chorizo:18:chori,chorizos;Vino:12:vinos;Chimichurri:9:chimi;Sal:7:salero
panaderia|comida|Algo que comprás en una panadería|Pan:32:panes,pancito;Bizcochos:23:bizcocho,factura,facturas;Medialunas:17:medialuna;Tortas:12:torta;Galletas:9:galleta,galletitas,galletita;Alfajores:7:alfajor
merienda|comida|Algo dulce para acompañar la merienda|Alfajor:30:alfajores;Galletitas:24:galletita,galletas,galleta;Torta:18:tortas,bizcochuelo;Medialuna:12:medialunas;Chocolate:9:chocolates;Churros:7:churro
desfile|carnaval|Algo que ves en un desfile de Carnaval|Disfraces:30:disfraz;Tambores:24:tambor,tamboril,tamboriles;Bailarines:18:bailarin,bailarina,bailarinas;Carrozas:12:carroza;Plumas:9:pluma;Banderas:7:bandera
disfraz|carnaval|Algo que usás para disfrazarte|Máscara:32:mascaras,careta,caretas;Peluca:23:pelucas;Sombrero:17:sombreros;Maquillaje:12:pintura facial,pintura;Capa:9:capas;Antifaz:7:antifaces
tablado|carnaval|Algo que encontrás en un tablado|Murga:30:murgas;Escenario:24:escenarios;Público:18:gente,espectadores;Micrófonos:12:microfono;Luces:9:luz,iluminacion;Sillas:7:silla,asientos
cancha|futbol|Algo que llevás a la cancha para alentar|Camiseta:32:camisetas,remera;Bandera:23:banderas;Bufanda:17:bufandas;Gorro:12:gorra,gorros,gorras;Tambor:9:bombo,tambores;Papel picado:7:papelitos,confeti
partido|futbol|Algo que puede cobrar el árbitro|Falta:30:faltas;Penal:24:penales,penalty;Fuera de juego:18:offside,orsai,posicion adelantada;Mano:12:manos;Tiro de esquina:9:corner,saque de esquina;Saque de banda:7:lateral,saque lateral
equipo|futbol|Un club de fútbol del Río de la Plata|Boca:30:boca juniors;River:24:river plate;Peñarol:18;Nacional:12;Racing:9:racing club;Independiente:7
mate|costumbres|Algo que necesitás para preparar mate|Yerba:32:yerba mate;Agua:23:agua caliente;Bombilla:17:bombillas;Mate:12:calabaza;Termo:9:termos;Caldera:7:pava,pava electrica,hervidor
domingo|costumbres|Un plan para un domingo en familia|Asado:30:hacer asado,comer asado;Paseo:24:pasear,caminar,salir a pasear;Almuerzo:18:almorzar,comer juntos;Película:12:peliculas,cine,ver una pelicula;Fútbol:9:ver futbol,jugar al futbol;Juegos de mesa:7:juego de mesa,cartas
lluvia|costumbres|Algo que hacés en casa un día de lluvia|Mirar una película:30:ver una pelicula,pelicula,peliculas,ver television,mirar tele,television;Dormir:24:siesta,dormir la siesta;Tomar mate:18:mate,matear;Leer:12:leer un libro,lectura;Cocinar:9:cocina;Jugar:7:videojuegos,juegos de mesa
dinero|lunfardo|Una forma popular de decir dinero|Plata:32;Guita:23;Mangos:17:mango;Billetes:12:billete;Lucas:9:luca;Pesos:7:peso
trabajo|lunfardo|Una palabra informal que podés escuchar hablando del trabajo|Laburo:30:laburar;Guita:24;Jefe:18:jefa;Changa:12:changas;Bondi:9;Fiaca:7
charla|lunfardo|Una palabra bien rioplatense en una charla entre amigos|Che:30;Bo:24;Dale:18;Ta:12;Bárbaro:9;Copado:7:copada
uruguay|ciudades|Una ciudad uruguaya que podrías visitar|Montevideo:32;Colonia:23:colonia del sacramento;Punta del Este:17:punta;Salto:12;Piriápolis:9;Maldonado:7
argentina|ciudades|Una ciudad argentina conocida para ir de paseo|Buenos Aires:30:capital federal,caba;Córdoba:24;Rosario:18;Mendoza:12;Bariloche:9:san carlos de bariloche;Mar del Plata:7:mardel
plaza|ciudades|Algo que encontrás en una plaza|Bancos:32:banco,banquitos;Árboles:23:arbol;Juegos:17:hamaca,hamacas,tobogan,juegos infantiles;Fuente:12:fuentes;Monumento:9:monumentos,estatua;Palomas:7:paloma
bolsoplaya|playa|Algo que guardás en el bolso para ir a la playa|Toalla:30:toallas,toallon;Protector solar:24:protector,bloqueador,bloqueador solar;Malla:18:traje de bano,bikini,short de bano;Agua:12:botella de agua;Lentes de sol:9:lentes,anteojos,anteojos de sol;Libro:7:libros
arena|playa|Algo que hacés en la arena|Tomar sol:32:broncearse,tomar el sol;Castillos:23:castillo,hacer castillos,castillos de arena;Jugar a la pelota:17:pelota,futbol,jugar al futbol;Caminar:12:pasear;Dormir:9:siesta;Tejo:7:jugar al tejo
costaplaya|playa|Algo que ves mirando hacia el mar|Olas:30:ola;Barcos:24:barco,velero,veleros;Gaviotas:18:gaviota;Bañistas:12:gente,personas,nadadores;Surfistas:9:surfista,surf;Horizonte:7
instrumentos|musica|Un instrumento para armar una banda|Guitarra:32:guitarras,guitarra electrica;Batería:23:bateria acustica;Bajo:17:bajo electrico;Teclado:12:teclados,piano;Saxofón:9:saxo;Trompeta:7:trompetas
fiesta|musica|Un ritmo que puede sonar en una fiesta rioplatense|Cumbia:30;Cuarteto:24;Reguetón:18:reggaeton;Rock:12;Salsa:9;Merengue:7
recital|musica|Algo que ves en un recital|Escenario:32;Luces:23:luz,iluminacion;Público:17:gente,espectadores;Cantante:12:cantantes;Parlantes:9:parlante,altavoces;Pantallas:7:pantalla
valija|viajes|Algo que metés en la valija|Ropa:30:remeras,pantalones;Calzado:24:zapatos,zapatillas;Cepillo de dientes:18:cepillo;Cargador:12:cargador de celular;Documentos:9:documento,pasaporte,cedula,dni;Perfume:7:perfumes
transporte|viajes|Un transporte que podés usar para viajar|Auto:32:coche,automovil;Ómnibus:23:omnibus,colectivo,bus,micro;Avión:17:aviones;Tren:12:trenes;Barco:9:ferry,buque;Moto:7:motocicleta
rutaparada|viajes|Un motivo para parar durante un viaje en ruta|Ir al baño:30:bano,banio;Cargar combustible:24:nafta,combustible,cargar nafta,gasolina;Comer:18:almorzar,merendar;Descansar:12:descanso,dormir;Comprar agua:9:agua,bebida,bebidas;Sacar fotos:7:fotos,fotografiar
cocina|casa|Algo que encontrás en una cocina|Heladera:32:refrigerador;Cocina:23:horno,estufa;Olla:17:ollas;Platos:12:plato;Cubiertos:9:tenedor,cuchillo,cuchara;Microondas:7
perdido|casa|Algo que buscás por toda la casa|Llaves:30:llave;Celular:24:telefono,movil;Control remoto:18:control,mando;Lentes:12:anteojos,gafas;Billetera:9:cartera,monedero;Medias:7:media,calcetines
limpieza|casa|Algo que usás para limpiar la casa|Escoba:32:escobas;Trapo:23:trapos,pano;Detergente:17:jabon;Balde:12:cubo;Aspiradora:9;Lampazo:7:mopa,fregona
mascotas|animales|Una mascota que alguien puede tener en casa|Perro:32:perros,perrito;Gato:23:gatos,gatito;Pez:17:peces,pecera;Hámster:12:hamsters;Conejo:9:conejos;Tortuga:7:tortugas
campo|animales|Un animal que podés ver en el campo rioplatense|Vaca:30:vacas,ternero,toro;Caballo:24:caballos,yegua;Oveja:18:ovejas,cordero;Gallina:12:gallinas,gallo;Cerdo:9:chancho,chanchos;Carpincho:7:carpinchos,capibara
paseoperro|animales|Algo que llevás cuando sacás a pasear al perro|Correa:32:correas;Bolsitas:23:bolsa,bolsas,bolsita;Agua:17:botella de agua;Collar:12:arnes;Pelota:9:pelotita,juguete;Premios:7:galletitas,snacks,comida
mochila|escuela|Algo que llevás en la mochila para ir a clase|Cuaderno:30:cuadernos;Lápiz:24:lapices,lapicera,boligrafo;Libro:18:libros;Goma:12:goma de borrar,borrador;Regla:9:reglas;Merienda:7:comida,colacion
recreo|escuela|Algo que hacés durante el recreo|Jugar:32:juegos;Comer:23:merendar,tomar la merienda;Charlar:17:hablar,conversar;Correr:12:carrera;Ir al baño:9:bano,banio;Tomar agua:7:agua,beber agua
materias|escuela|Una materia que se estudia en la escuela|Matemática:30:matematicas;Lengua:24:idioma espanol,lenguaje;Historia:18;Geografía:12;Ciencias:9:ciencias naturales;Educación física:7:gimnasia,deporte,deportes
heladeria|comida|Un gusto de helado que todos piden|Dulce de leche:30:ddl,dulce;Chocolate:24:choco;Frutilla:18:frutillas;Vainilla:12:crema americana;Limón:9:limon;Sambayón:7:sambayon
picada|comida|Algo que no puede faltar en una picada|Queso:30:quesos;Salame:24:salamin;Aceitunas:18:aceituna;Jamón:12:jamon,fiambre;Maní:9:mani;Pan:7:pancito,galletas
domingo_almuerzo|comida|Una comida típica del almuerzo de domingo|Asado:30:parrilla;Pastas:24:ravioles,tallarines,noquis,ñoquis;Milanesas:18:milanesa;Pollo:12:pollo al horno;Pizza:9:pizzas;Guiso:7:puchero
desayuno|comida|Algo que tomás en el desayuno|Café:30:cafe,cafe con leche;Mate:24:mates;Té:18:te;Leche:12:chocolatada;Jugo:9:jugo de naranja;Agua:7:
sandwich|comida|Algo que le ponés a un sándwich|Jamón:30:jamon;Queso:24:quesos;Lechuga:18:verdes;Tomate:12:tomates;Mayonesa:9:mayo;Huevo:7:huevos
murga_cosas|carnaval|Algo que lleva puesto un murguista|Maquillaje:30:pintura;Galera:24:sombrero;Traje:18:vestuario;Guantes:12:guante;Zapatos:9:zapatos de colores;Moño:7:moño,corbata
carnaval_festejo|carnaval|Algo que tirás en carnaval|Agua:30:bombitas,globos de agua;Papelitos:24:papel picado;Espuma:18:nieve,espuma de carnaval;Serpentinas:12:serpentina;Harina:9:;Huevos:7:huevo
futbol_gritos|futbol|Algo que le grita la hinchada al árbitro|Vendido:30:;Ladrón:24:ladron;Ciego:18:;Bombero:12:;Penal:9:;Fuera:7:afuera
futbol_puestos|futbol|Una posición en un equipo de fútbol|Golero:30:arquero;Delantero:24:nueve,goleador;Defensa:18:zaguero,defensor;Volante:12:mediocampista;Lateral:9:;Enganche:7:diez
futbol_cancha|futbol|Algo que hay en una cancha de fútbol|Arcos:30:arco;Pelota:24:;Césped:18:pasto,cesped;Tribuna:12:tribunas;Banderines:9:banderin;Red:7:redes
habito_noche|costumbres|Algo que hacés antes de dormir|Lavarte los dientes:30:dientes,cepillarse;Mirar el celular:24:celular;Ver tele:18:tele,television;Leer:12:;Bañarte:9:ducharse,ducha;Rezar:7:
costumbre_verano|costumbres|Algo que hacés en verano|Ir a la playa:30:playa;Tomar helado:24:helado;Piscina:18:pileta;Tomar mate:12:mate;Viajar:9:vacaciones;Dormir siesta:7:siesta
lunfardo_amigo|lunfardo|Una forma de llamar a un amigo|Bo:30:vo;Hermano:24:hermanito;Loco:18:;Amigo:12:amigazo;Che:9:;Compañero:7:compa
lunfardo_lindo|lunfardo|Una forma de decir que algo está muy bueno|Bárbaro:30:barbaro;Buenísimo:24:buenisimo;Genial:18:;De más:12:demas;Espectacular:9:;Piola:7:
lunfardo_enojo|lunfardo|Una forma de decir que alguien está enojado|Caliente:30:;Re caliente:24:recaliente;Con bronca:18:bronca;Furioso:12:;Rabioso:9:;Sacado:7:
ciudades_pasear|ciudades|Un lugar para pasear en Montevideo|Rambla:30:la rambla;Ciudad Vieja:24:;Prado:18:el prado;Parque Rodó:12:parque rodo;Mercado del Puerto:9:mercado;Tres Cruces:7:
ciudades_playas|ciudades|Un balneario uruguayo para veranear|Punta del Este:30:punta;Piriápolis:24:piriapolis;La Paloma:18:;Atlántida:12:atlantida;Cabo Polonio:9:polonio;Punta del Diablo:7:
ciudades_frontera|ciudades|Una ciudad uruguaya de frontera|Rivera:30:;Chuy:24:;Salto:18:;Artigas:12:;Paysandú:9:paysandu;Fray Bentos:7:
ciudades_turismo|ciudades|Algo que visita un turista en Colonia|Faro:30:el faro;Calle de los Suspiros:24:suspiros;Murallas:18:muralla,portón,porton;Puerto:12:;Plaza:9:plaza mayor;Museos:7:museo
playa_vender|playa|Algo que venden en la playa|Helados:30:helado;Churros:24:churro;Choclos:18:choclo;Bebidas:12:refresco,agua;Alfajores:9:alfajor;Bizcochos:7:
playa_animales|playa|Un animal que ves en la playa|Gaviota:30:gaviotas;Perro:24:perros;Cangrejo:18:cangrejos;Medusa:12:aguaviva,aguavivas;Lobo marino:9:lobos;Caracol:7:caracoles
musica_fogon|musica|Algo que no falta en un fogón con guitarra|Guitarra:30:;Canciones:24:cantar;Fuego:18:leña;Mate:12:;Amigos:9:;Bombo:7:
musica_recital|musica|Algo que llevás a un recital|Entrada:30:ticket;Celular:24:;Plata:18:dinero;Agua:12:;Campera:9:abrigo;Bandera:7:
viajes_problemas|viajes|Algo que sale mal en un viaje|Perder la valija:30:valija;Retraso:24:demora;Llueve:18:lluvia;Se pincha la rueda:12:rueda;Olvidarse algo:9:olvido;Mareo:7:
viajes_hotel|viajes|Algo que hay en la habitación de un hotel|Cama:30:;Tele:24:televisor;Baño:18:;Toallas:12:toalla;Aire acondicionado:9:aire;Frigobar:7:heladerita
casa_living|casa|Algo que hay en el living|Sillón:30:sillon,sofa;Tele:24:televisor;Mesa:18:mesita;Alfombra:12:;Cuadros:9:cuadro;Lámpara:7:lampara
casa_arreglos|casa|Algo que siempre se rompe en la casa|Canilla:30:;Lamparita:24:luz;Enchufe:18:;Cisterna:12:;Persiana:9:;Calefón:7:calefon
animales_miedo|animales|Un animal que da miedo|Araña:30:arana;Víbora:24:vibora,serpiente;Tiburón:18:tiburon;León:12:leon;Alacrán:9:alacran;Rata:7:
animales_zoo|animales|Un animal que ves en el zoológico|León:30:leon;Jirafa:24:;Elefante:18:;Mono:12:;Tigre:9:;Cebra:7:
escuela_maestra|escuela|Algo que dice siempre la maestra|Silencio:30:;Abran el cuaderno:24:cuaderno;Hagan fila:18:fila;Presten atención:12:atencion;Deberes:9:;Pasen al pizarrón:7:pizarron
comida_parrilla|comida|Un corte que se tira a la parrilla|Asado de tira:30:tira,asado;Vacío:24:vacio;Entraña:18:entrana;Chorizo:12:chorizos;Pollo:9:;Morcilla:7:morcillas
comida_feria|comida|Algo que comprás en la feria vecinal|Frutas:30:fruta;Verduras:24:verdura;Huevos:18:huevo;Queso:12:quesos;Pescado:9:;Flores:7:
comida_rapida|comida|Una comida rápida para la noche|Pizza:30:pizzas;Chivito:24:chivitos;Hamburguesa:18:hamburguesas;Milanesa al pan:12:milanesa;Panchos:9:pancho;Empanadas:7:empanada
carnaval_teatro|carnaval|Una categoría del concurso de carnaval|Murga:30:murgas;Parodistas:24:parodia;Humoristas:18:humor;Revista:12:revistas;Lubolos:9:comparsa;Sociedades de negros:7:
futbol_festejo|futbol|Algo que hace un jugador al festejar un gol|Gritar:30:grito;Abrazarse:24:abrazo;Correr:18:;Besar la camiseta:12:camiseta;Bailar:9:baile;Tirarse al pasto:7:
futbol_mundial|futbol|Algo que hacés cuando juega la Celeste en un Mundial|Ver el partido:30:mirar,partido;Ponerte la camiseta:24:camiseta;Gritar:18:;Juntarte con amigos:12:amigos;Comer asado:9:asado;Faltar al trabajo:7:faltar
costumbre_cumple|costumbres|Algo que no falta en un cumpleaños|Torta:30:;Velitas:24:velas;Globos:18:globo;Regalos:12:regalo;Música:9:musica;Sándwiches:7:sanguchitos
costumbre_fin_de_anio|costumbres|Algo que hacés el 31 de diciembre|Brindar:30:brindis;Comer:24:cena;Abrazarse:18:abrazos;Fuegos artificiales:12:cuetes;Tirar papeles:9:papeles;Bailar:7:
lunfardo_nino|lunfardo|Una forma de decir niño en el Río de la Plata|Gurí:30:guri;Botija:24:;Pibe:18:;Chiquilín:12:chiquilin;Nene:9:;Purrete:7:
lunfardo_cansado|lunfardo|Una forma de decir que estás muy cansado|Muerto:30:;Reventado:24:;Fundido:18:;Hecho pelota:12:;Molido:9:;Destruido:7:
lunfardo_trabajar|lunfardo|Una forma de decir que vas a trabajar|Voy a laburar:30:laburar;Voy al laburo:24:laburo;Voy a yugarla:18:yugar;Voy a trabajar:12:;Voy a la oficina:9:;Voy al trabajo:7:
ciudades_interior|ciudades|Un departamento del interior de Uruguay|Canelones:30:;Maldonado:24:;Salto:18:;Colonia:12:;Rivera:9:;Tacuarembó:7:tacuarembo
ciudades_bsas|ciudades|Un barrio de Buenos Aires|Palermo:30:;La Boca:24:boca;San Telmo:18:;Recoleta:12:;Belgrano:9:;Puerto Madero:7:
playa_problemas|playa|Algo que te arruina un día de playa|Viento:30:;Lluvia:24:;Quemarte:18:quemadura,sol;Aguavivas:12:medusas;Mucha gente:9:gente;Arena en la comida:7:arena
musica_cantar|musica|Un lugar donde cantás aunque no sepas|Ducha:30:baño;Auto:24:;Karaoke:18:;Fiesta:12:;Fogón:9:fogon;Cancha:7:
viajes_avion|viajes|Algo que pasa en un vuelo|Turbulencia:30:;Te dan comida:24:comida;Dormís:18:dormir;Se te tapan los oídos:12:oidos;Ves una película:9:pelicula;Bebé llorando:7:bebe
casa_dormitorio|casa|Algo que hay en el dormitorio|Cama:30:;Ropero:24:placard;Mesita de luz:18:mesita;Almohada:12:;Lámpara:9:lampara,velador;Espejo:7:
animales_ruido|animales|Un animal que hace mucho ruido|Perro:30:;Gallo:24:;Gato:18:;Loro:12:cotorra;Vaca:9:;Teru teru:7:terutero
escuela_tunica|escuela|Algo típico de la escuela pública uruguaya|Túnica:30:tunica;Moña:24:mona,moña azul;Copa de leche:18:leche;Recreo:12:;Pizarrón:9:pizarron;Ceibalita:7:ceibal,computadora
escuela_excusas|escuela|Una excusa para no hacer los deberes|Me olvidé:30:olvide;Se lo comió el perro:24:perro;Estaba enfermo:18:enfermo;No entendí:12:no entendi;Se cortó la luz:9:luz;No tenía cuaderno:7:cuaderno`
.split("\n").map(linea=>{
  const [id,categoria,pregunta,panel]=linea.split("|");
  return{id,categoria,pregunta,respuestas:panel.split(";").map(entrada=>{
    const [texto,puntos,alias=""]=entrada.split(":");return{texto,puntos:Number(puntos),alias:alias?alias.split(","):[]};
  })};
});
