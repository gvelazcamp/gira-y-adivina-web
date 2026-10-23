/* Idioma de los menús (Español / English). El contenido del juego (frases,
   dichos, palabras de las extensiones) queda en español a propósito.
   No toca el código de cada pantalla: traduce el texto ya dibujado
   (nodos de texto y placeholder/title/aria-label) buscando la frase exacta
   en EN; los números se reemplazan por # para usar la misma traducción
   ("🪙 120 monedas" → "# monedas" → "# coins"). Se elige en
   ⚙️ Más opciones; si nunca se eligió, sale del idioma del celular. */
(function(){
  let idioma="es";
  try{idioma=localStorage.getItem("gya_idioma")||(/^es\b/i.test(navigator.language||"es")?"es":"en");}catch(e){}
  window.GYA_IDIOMA=idioma;
  window.gyaCambiarIdioma=function(nuevo){try{localStorage.setItem("gya_idioma",nuevo);}catch(e){}location.reload();};
  if(idioma!=="en")return;
  try{document.documentElement.lang="en";}catch(e){}

  const EN={
  /* ---- Inicio / menú ---- */
  "Jugar ahora":"Play now","¡Jugar ahora!":"Play now!","Jugar online":"Play online","Jugar con amigos":"Play with friends",
  "Buscá un rival y arrancá ya":"Find a rival and start right away","Compartí y conectá con amigos":"Share and connect with friends",
  "Uruguay, vos contra la máquina":"Uruguay, you vs. the computer","Social":"Social","Tienda":"Shop","Eventos":"Events","EVENTOS":"EVENTS",
  "Torneos":"Tournaments","Torneo":"Tournament","Logros":"Achievements","Mis récords":"My records","Compartir el juego":"Share the game",
  "Pruebas":"Tests","Instalar app en el celular":"Install the app on your phone","Más opciones":"More options","Cerrar":"Close",
  "Volver":"Back","Volver al inicio":"Back to home","Volver al mapa":"Back to map","Salir":"Exit","Continuar":"Continue","CONTINUAR":"CONTINUE",
  "Aceptar":"OK","Cancelar":"Cancel","Entendido":"Got it","Genial":"Great","Vamos":"Let's go","Ahora no":"Not now","Más tarde":"Later",
  "No, gracias":"No, thanks","Compartir":"Share","Comprar":"Buy","Usar":"Use","Enviar":"Send","Responder":"Reply","Revancha":"Rematch",
  "Abandonar":"Quit","Abandonar partida":"Quit match","Entrar":"Enter","Elegí":"Choose","Siguiente →":"Next →","Aviso":"Notice",
  "Jugá a las extensiones de Girá y Adiviná":"Play Girá y Adiviná extensions","Más juegos para descubrir":"More games to discover",
  "Ranking de amigos":"Friends ranking","Objetivos diarios":"Daily goals","Racha de días jugados":"Days-played streak",
  "Ruleta de premios":"Prize wheel","Partida Diaria":"Daily Match","Jugar la Partida Diaria":"Play the Daily Match",
  "Evento diario":"Daily event","Evento de ciudad":"City event","Desafío especial":"Special challenge","Competí contra otros jugadores":"Compete against other players",
  "Practicá las mecánicas más difíciles, sin gastar vidas ni monedas":"Practice the hardest mechanics without spending lives or coins",
  "Volvé cada día por algo nuevo":"Come back every day for something new","Monedas, marcos y más":"Coins, frames and more",
  "Ver el avance de los jugadores":"See players' progress","Jugá todos juntos":"Play all together","Sala TV":"TV Room","SALA TV":"TV ROOM",
  "Sala TV / Familia":"TV Room / Family","Jugá con varios celulares usando la tele como pantalla grande.":"Play with several phones using the TV as a big screen.",
  "Jugá 1 contra 1 a la distancia, cada uno desde su celular.":"Play 1 vs 1 remotely, each one from their own phone.",
  "Girá, pedí una consonante y adiviná la frase antes que el otro.":"Spin, call a consonant and guess the phrase before the other player.",
  "Girá y Adiviná Rioplatense — juego de frases para dos":"Girá y Adiviná Rioplatense — a phrase game for two",
  "Activar sonido":"Turn sound on","Silenciar todo el sonido":"Mute all sound","Cambiar perfil":"Change profile",
  "Cargando… con internet lento puede tardar un poco":"Loading… it may take a moment on a slow connection",
  "Monedas":"Coins","monedas":"coins","# monedas":"# coins","+# monedas":"+# coins","tickets":"tickets","ronda":"round","total":"total","turno":"turn",
  "Vidas llenas":"Full lives","Próxima vida en":"Next life in","Próxima vida en ":"Next life in ","Próxima ruleta en":"Next wheel in",
  "¡Te quedaste sin vidas!":"You're out of lives!","Pedile una vida a un amigo":"Ask a friend for a life",
  "Compartí el juego y te regalamos 1 ❤️ — una vez por día":"Share the game and get 1 ❤️ — once a day",
  "+1 vida por compartir el juego":"+1 life for sharing the game",
  /* ---- Configuración ---- */
  "⚙️ Más opciones":"⚙️ More options","Idioma":"Language",
  /* ---- Perfil ---- */
  "ELEGÍ TU NOMBRE":"CHOOSE YOUR NAME","ELEGÍ TU AVATAR":"CHOOSE YOUR AVATAR","Elegí tu avatar":"Choose your avatar","Ahora elegí tu avatar":"Now choose your avatar",
  "Elegí tu nombre y tu avatar":"Choose your name and avatar","Tu nombre":"Your name","escribí tu nombre":"type your name","Nombre":"Name","ej: Fede":"e.g. Alex",
  "Confirmar nombre":"Confirm name","← Cambiar nombre":"← Change name","País de origen":"Country of origin","EDITAR PERFIL":"EDIT PROFILE","GUARDAR CAMBIOS":"SAVE CHANGES",
  "Elegí tu país para habilitar el perfil.":"Choose your country to enable your profile.",
  "Elegí tu país para habilitar el perfil. La expansión sugerida queda cruzada al otro lado del Río de la Plata.":"Choose your country to enable your profile. The suggested expansion is across the Río de la Plata.",
  "Tu expansión sugerida será Argentina.":"Your suggested expansion will be Argentina.","Tu expansión sugerida será Uruguay.":"Your suggested expansion will be Uruguay.",
  "Ese nombre ya lo usa otro jugador. Probá otro, por ej.":"That name is already taken. Try another one, e.g.",
  "Elegí un nombre propio, distinto de":"Choose your own name, different from",
  "Escribí el nombre.":"Type the name.","Elegí el avatar.":"Choose the avatar.",
  /* ---- Bienvenida / tutorial ---- */
  "❓ Cómo jugar":"❓ How to play","❓ Tutorial":"❓ Tutorial","▶️ Completar tutorial":"▶️ Do the tutorial","Completá el tutorial al comenzar":"Complete the tutorial at the start",
  "Girá la ruleta":"Spin the wheel","Girá la ruleta para descubrir qué te toca:":"Spin the wheel to see what you get:",
  "💰 Dinero: se suma a tu acumulado.":"💰 Money: it's added to your total.","💥 Quiebra: perdés todo el dinero acumulado.":"💥 Bankrupt: you lose all the money you collected.",
  "⏭️ Perdés el turno: pasa al siguiente jugador.":"⏭️ Lose a turn: it passes to the next player.",
  "Si te toca dinero, elegí una consonante para revelar las letras de la frase.":"If you land on money, pick a consonant to reveal letters of the phrase.",
  "También podés:":"You can also:","Comprar una vocal.":"Buy a vowel.","Pedir una pista (disponible una sola vez por partida).":"Ask for a hint (only once per match).",
  "Adiviná la frase":"Guess the phrase",
  "Con las letras que van saliendo, tratá de descubrirla. Tocá \"Resolver\" para arriesgarte y decir la frase completa cuando quieras.":"Use the letters that appear to figure it out. Tap \"Resolver\" (Solve) whenever you want to try the full phrase.",
  "Jugás solo en tu celular, contra la máquina, avanzando por el Mapa de Uruguay. Elegís 3, 5 o 7 rondas y arrancás al toque.":"You play alone on your phone against the computer, moving across the Map of Uruguay. Choose 3, 5 or 7 rounds and start right away.",
  "Sellos, sobres y colecciones":"Stamps, packs and collections","Cada ciudad tiene un pasaporte con 5 sellos:":"Each city has a passport with 5 stamps:",
  "Ganás una partida → sumás un sello.":"Win a match → get a stamp.","El último sello es especial: se gana venciendo al rival de esa ciudad.":"The last stamp is special: you get it by beating that city's rival.",
  "Cada vez que acertás 3 frases en esa ciudad (no hace falta ganar la partida) te regalan un sobre.":"Every time you guess 3 phrases in that city (you don't need to win the match) you get a pack.",
  "Cada sobre te da un coleccionable nuevo, hasta juntarlos todos.":"Each pack gives you a new collectible, until you have them all.",
  "Te empareja al instante con otro jugador conectado, cada uno desde su propio celular.":"Instantly matches you with another online player, each on their own phone.",
  "Creás una sala y le pasás el código a un amigo para jugar 1 contra 1 a la distancia.":"Create a room and send the code to a friend to play 1 vs 1 remotely.",
  "Para jugar todos juntos: una pantalla grande hace de tablero y cada uno juega desde su celular.":"To play all together: a big screen is the board and everyone plays from their phone.",
  "¡Bienvenido! Seguí las indicaciones en pantalla para aprender a jugar.":"Welcome! Follow the on-screen tips to learn how to play.",
  "Tocá acá para girar la ruleta.":"Tap here to spin the wheel.","Elegí la consonante M.":"Pick the consonant M.","¡Mirá! Ya juntaste esta plata en la ronda.":"Look! You already collected this money in the round.",
  "Con esa plata podés comprar una vocal por $250. Tocá acá.":"With that money you can buy a vowel for $250. Tap here.","Elegí la vocal A.":"Pick the vowel A.",
  "¿Te trabaste? Pedí una pista (gratis en el tutorial).":"Stuck? Ask for a hint (free in the tutorial).","Ahora resolvé: escribí la frase completa y confirmá.":"Now solve it: type the full phrase and confirm.",
  "🎉 ¡Aprendiste a jugar!":"🎉 You learned how to play!",
  "Ya sabés girar, comprar vocales, pedir pistas y resolver. Desbloqueaste el logro Primer tutorial: +150 🪙.":"You now know how to spin, buy vowels, ask for hints and solve. You unlocked the First tutorial achievement: +150 🪙.",
  "Primer tutorial":"First tutorial","Primeros pasos":"First steps",
  /* ---- Partida ---- */
  "Girar":"Spin","GIRAR":"SPIN","🎡 GIRAR":"🎡 SPIN","Girando…":"Spinning…","Resolver":"Solve","RESOLVER":"SOLVE","Pista":"Hint","💡 Pista":"💡 Hint",
  "Comprar vocal $#":"Buy vowel $#","Decí la frase":"Say the phrase","escribí la frase completa":"type the full phrase","Quiebra":"Bankrupt","Pierde turno":"Lose a turn","PIERDE TURNO":"LOSE A TURN",
  "Comodín":"Wild card","Ronda Bonus":"Bonus Round","⭐ RONDA BONUS":"⭐ BONUS ROUND","Toss-Up":"Toss-Up","⚡ PRUEBA DE VELOCIDAD":"⚡ SPEED ROUND","Prueba de velocidad":"Speed round",
  "Poné a prueba tu velocidad":"Test your speed","Las letras aparecen solas. Resolvé antes de que se termine el tiempo.":"Letters appear by themselves. Solve before time runs out.",
  "Resolvé sin límite de tiempo":"Solve with no time limit","Jugador":"Player","Jugador 1":"Player 1","Jugador 2":"Player 2","Jugador 1 resuelve":"Player 1 solves","Jugador 2 resuelve":"Player 2 solves",
  "Máquina (en pausa)":"Computer (paused)","Otro jugador":"Another player","Seguís vos.":"Your turn again.",
  "gira la ruleta.":"spins the wheel.","compra una vocal.":"buys a vowel.","cree saber la frase y va a resolver.":"thinks they know the phrase and will solve.",
  "elige la consonante":"picks the consonant","elige la vocal":"picks the vowel",": girar, comprar vocal o resolver.":": spin, buy a vowel or solve.",
  "Le toca a":"It's the turn of",". Girá para pedir una consonante.":". Spin to call a consonant.",
  "Girá para pedir una consonante.":"Spin to call a consonant.",". Pasa el turno.":". The turn passes.","Pasa el turno.":"The turn passes.","pasa el turno":"the turn passes",
  "No quedan consonantes: resolvé la frase para seguir.":"No consonants left: solve the phrase to continue.",
  "¿Seguro que querés abandonar la partida? Se cuenta como partida perdida.":"Are you sure you want to quit the match? It counts as a loss.",
  "¿Salir del entrenamiento? No afecta vidas, monedas ni progreso.":"Leave the training? It doesn't affect lives, coins or progress.",
  "¡Acertaste una frase!":"You guessed a phrase!","¡RESUELTO!":"SOLVED!","Ganaste":"You won","¡Ganaste":"You won","Te ganó":"You lost to","Partida terminada":"Match over","Partida terminada.":"Match over.",
  "Jugar de nuevo":"Play again","🔁 Jugar de nuevo":"🔁 Play again","🗺️ Volver al mapa":"🗺️ Back to map","📤 Compartir resultado":"📤 Share result","🚩 Reportar frase repetida":"🚩 Report repeated phrase",
  "¡Gracias! La marcamos como repetida.":"Thanks! We marked it as repeated.","Elegí la modalidad de la partida:":"Choose the match mode:","Elegir modalidad":"Choose mode",
  "Clásica":"Classic","Normal":"Normal","Empezar partida":"Start match","Comenzar partida":"Start match","Arrancando la partida…":"Starting the match…",
  "3 rondas":"3 rounds","5 rondas":"5 rounds","7 rondas":"7 rounds","# rondas":"# rounds","Ronda":"Round",
  "Dale, vamos que se puede!":"Come on, you can do it!","Dale que la sacás":"Come on, you'll get it","Uy, casi la tenía":"Oops, I almost had it","Ese lo sabía seguro":"I knew that one for sure",
  "Ahora me toca a mí 😏":"My turn now 😏","Jaja buena esa":"Haha nice one","Qué frase rara jaja":"What a weird phrase haha","Te tocó una difícil esa frase":"You got a hard one",
  "Vamos arriba loco":"Let's go, mate","está bueno":"nice","Las sabías todas":"You knew them all",
  /* ---- Mapa / pasaporte / colecciones ---- */
  "Abrir pasaporte":"Open passport","Cerrar pasaporte":"Close passport","Abrir colección":"Open collection","🎒 Colección":"🎒 Collection","🏅 Pasaporte":"🏅 Passport",
  "# / # sellos":"# / # stamps","# / # encontrados":"# / # found","# / # desbloqueados":"# / # unlocked","ABRIR SOBRE":"OPEN PACK","ABRIR AHORA":"OPEN NOW","GUARDAR PARA DESPUÉS":"SAVE FOR LATER",
  "Abriendo…":"Opening…","✨ NUEVO COLECCIONABLE":"✨ NEW COLLECTIBLE","♻️ COLECCIONABLE REPETIDO":"♻️ REPEATED COLLECTIBLE","¡Sobre sorpresa!":"Surprise pack!",
  "Entrar al mapa Argentina":"Enter the Argentina map","🔒 Continuar expansión":"🔒 Continue expansion","CONTINUAR EXPANSIÓN":"CONTINUE EXPANSION",
  "🔒 Muy pronto vas a poder cruzar el Río de la Plata y jugar en Argentina.":"🔒 Soon you'll be able to cross the Río de la Plata and play in Argentina.",
  "¡COMPLETASTE URUGUAY!":"YOU COMPLETED URUGUAY!","¡Gracias por jugar el Mapa de Uruguay! 🧉":"Thanks for playing the Map of Uruguay! 🧉",
  "Recorriste las 21 ciudades y llenaste tu pasaporte entero.":"You visited all 21 cities and filled your whole passport.",
  "CONTINUAR AL MAPA →":"CONTINUE TO MAP →","SEGUIR JUGANDO":"KEEP PLAYING","DESAFÍO DE LOCALIDAD":"CITY CHALLENGE","ENTRENAMIENTO":"TRAINING","ENTRENAMIENTOS":"TRAININGS",
  "Entrenar ›":"Train ›","3 rondas · Reintentá hasta ganar · Cada derrota cuesta 1 vida":"3 rounds · Retry until you win · Each loss costs 1 life",
  "5 rondas · Reintentá hasta ganar · Cada derrota cuesta 1 vida":"5 rounds · Retry until you win · Each loss costs 1 life","4 rondas · Ganá más de la mitad para superarlo":"4 rounds · Win more than half to pass",
  "JUGAR ❤️ #":"PLAY ❤️ #","🗺️ Todavía no empezó el mapa ·":"🗺️ Hasn't started the map yet ·","🗺️ Va por":"🗺️ Currently in",
  /* ---- Carteles diarios / eventos ---- */
  "🎁 ¡NUEVO PREMIO DIARIO!":"🎁 NEW DAILY PRIZE!","Premio directo de hoy":"Today's direct prize","Seguí jugando ya":"Keep playing now","Ir a Tienda":"Go to Shop","Ir a Eventos":"Go to Events",
  "¡Jugá los Eventos!":"Play the Events!","Jugá los Eventos":"Play the Events","Cada evento que jugás te da 🎟️":"Every event you play gives you 🎟️",
  "Jugá 3 rondas contra la máquina. Si ganás, recibís 1 vida, 100 monedas y un premio chico directo: coleccionable, marco o puntero. Un solo intento por día.":"Play 3 rounds against the computer. If you win, you get 1 life, 100 coins and a small direct prize: collectible, frame or pointer. One try per day.",
  "🎉 ¡EVENTO DE FIN DE SEMANA!":"🎉 WEEKEND EVENT!","EVENTO DE FIN DE SEMANA":"WEEKEND EVENT","Disponible sábados y domingos · 5 rondas":"Available Saturdays and Sundays · 5 rounds",
  "Este evento solo está disponible sábado y domingo.":"This event is only available on Saturday and Sunday.","🏆 ¡NUEVO DESAFÍO!":"🏆 NEW CHALLENGE!",
  "Ganá partidas seguidas contra la Máquina y subí la escalera de premios.":"Win matches in a row against the computer and climb the prize ladder.",
  "✓ Completado · Volvé mañana":"✓ Completed · Come back tomorrow","✓ Completado · Volvé el próximo fin de semana":"✓ Completed · Come back next weekend",
  "⏳ Termina en":"⏳ Ends in","Empieza en":"Starts in","Evento terminado.":"Event finished.","¡Evento completado!":"Event completed!","Perdiste el evento":"You lost the event","Volver a Eventos":"Back to Events","Volver a Torneos":"Back to Tournaments",
  "Sumá tickets para el Torneo":"Collect tickets for the Tournament","🎟️ Ganá un ticket y entrá a Torneos por premios increíbles":"🎟️ Win a ticket and join Tournaments for amazing prizes",
  "Se gana jugando los Eventos":"You earn it by playing Events","y competir por premios increíbles.":"and compete for amazing prizes.","para entrar a los":"to enter the",
  "🎡 Ruleta de premios":"🎡 Prize wheel","Girá una vez por día y ganá premios.":"Spin once a day and win prizes.","Sortear ahora":"Spin now","🎡 Tenés otro giro disponible":"🎡 You have another spin available",
  "😅 ¡Sin premio esta vez! Seguí participando mañana, o comprá un giro extra.":"😅 No prize this time! Try again tomorrow, or buy an extra spin.","🪙 Te faltan monedas para el giro extra":"🪙 Not enough coins for the extra spin",
  "🎟️ Comprar giro extra — 🪙 #":"🎟️ Buy extra spin — 🪙 #","🎯 Objetivos diarios":"🎯 Daily goals","Los objetivos diarios se reinician en":"Daily goals reset in",
  "PREMIO SORPRESA":"SURPRISE PRIZE","premio sorpresa":"surprise prize","🎁 premio sorpresa":"🎁 surprise prize","🎉 ¡RECIBISTE!":"🎉 YOU GOT!","❤️ ¡VIDA EXTRA!":"❤️ EXTRA LIFE!","🪙 ¡MONEDAS EXTRA!":"🪙 EXTRA COINS!",
  "¡Logro desbloqueado!":"Achievement unlocked!","🏅 Logros":"🏅 Achievements","🏆 Mis récords":"🏆 My records",
  /* ---- Tienda ---- */
  "🛍️ Tienda":"🛍️ Shop","💳 Ofertas diarias":"💳 Daily deals","🎁 Packs":"🎁 Packs","Paquete chico":"Small pack","Monedas gratis":"Free coins","O gratis":"Or free",
  "✉️ Sobres de colección 🔻":"✉️ Collection packs 🔻","Sobres de colección":"Collection packs","🖼️ Marcos de avatar 🔻":"🖼️ Avatar frames 🔻","🖼️ Marcos de tablero 🔻":"🖼️ Board frames 🔻",
  "🎡 Marcos de ruleta 🔻":"🎡 Wheel frames 🔻","📍 Punteros 🔻":"📍 Pointers 🔻","🎲 Tableros 🔻":"🎲 Boards 🔻","🧑‍🎤 Avatares premium 🔻":"🧑‍🎤 Premium avatars 🔻","Avatares premium":"Premium avatars",
  "🛡️ Escudos de la ruleta":"🛡️ Wheel shields","Escudos de la ruleta":"Wheel shields","Escudo":"Shield","Escudo Quiebra":"Bankrupt Shield","Escudo Pierde Turno":"Lose-a-Turn Shield",
  "Escudo Detener Tiempo":"Stop-Time Shield","Escudo Saltar Toss-up":"Skip Toss-up Shield","Te salva de perder la plata":"Saves you from losing your money","Te salva de perder el turno":"Saves you from losing your turn",
  "Te saltea la Prueba de Velocidad":"Skips the Speed Round for you","Comprar escudos ahora":"Buy shields now","🛡️ Usar escudo":"🛡️ Use shield","🪙 Salvarme ahora":"🪙 Save me now",
  "Comprálos en la Tienda y salvate cuando la ruleta caiga en":"Buy them in the Shop and save yourself when the wheel lands on",
  "Solo sirven en Eventos y en ¡Jugar ahora!. Si tenés uno guardado, cuando caigas en Quiebra o Pierde turno vas a poder usarlo para salvarte. Si no tenés, podés salvarte en el momento pagando monedas.":"They only work in Events and in Play now!. If you have one saved, when you land on Bankrupt or Lose a turn you can use it to save yourself. If not, you can save yourself on the spot by paying coins.",
  "Vida instantánea":"Instant life","Vidas llenas al instante":"Full lives instantly","Vidas infinitas 24hs":"Unlimited lives 24h","Vidas infinitas 30 min":"Unlimited lives 30 min",
  "Vidas infinitas por 24hs":"Unlimited lives for 24h","Vidas infinitas por 30 min":"Unlimited lives for 30 min","Jugá sin límite por un día":"Play without limits for a day","Jugá sin límite un rato":"Play without limits for a while",
  "Jugá todo el día sin límite":"Play all day without limits","Para cuando no tenés monedas":"For when you're out of coins","Sin publicidad":"No ads","Sacá los anuncios para siempre":"Remove ads forever",
  "Listo, sin anuncios para siempre":"Done, no ads forever","Entrada completa a un Torneo":"Full entry to a Tournament","🎟️ Tickets de torneo":"🎟️ Tournament tickets","# ticket de torneo":"# tournament ticket",
  "# tickets de torneo":"# tournament tickets","Un sobre para tu colección — 1 por día":"A pack for your collection — 1 per day","Marco de avatar":"Avatar frame","Marco de tablero":"Board frame",
  "Marcos de ruleta":"Wheel frames","Marcos de tablero":"Board frames","Sin marco":"No frame","Sin puntero especial":"No special pointer","Marco anterior":"Previous frame","Marco siguiente":"Next frame",
  "Puntero anterior":"Previous pointer","Puntero siguiente":"Next pointer","Ruleta anterior":"Previous wheel","Ruleta siguiente":"Next wheel","Diseño anterior":"Previous design","Diseño siguiente":"Next design",
  "EQUIPADO ✓":"EQUIPPED ✓","No te alcanzan las monedas.":"You don't have enough coins.","No tenés suficientes monedas.":"You don't have enough coins.","No se pudo completar la compra":"The purchase couldn't be completed",
  "Lo compraste en la tienda.":"You bought it in the shop.","Disponible cuando el juego esté en la Play Store":"Available when the game is on the Play Store",
  "Disponible solo en la app instalada desde Google Play":"Only available in the app installed from Google Play","Ganás 1 cada vez que acertás una frase":"You earn 1 every time you guess a phrase",
  "Monedas: se ganan jugando y sirven para comprar en la Tienda":"Coins: you earn them by playing and use them to buy in the Shop","❤️ Vidas llenas":"❤️ Full lives",
  /* ---- Social / ranking / invitaciones ---- */
  "👥 Usuarios":"👥 Players","Todos los que jugaron, se hayan anotado al ranking o no.":"Everyone who played, whether they joined the ranking or not.","Invitar":"Invite",
  "📤 Invitar amigos":"📤 Invite friends","Copiar invitación":"Copy invitation","Invitación copiada":"Invitation copied","Copiado. ¡Pegalo donde quieras!":"Copied. Paste it anywhere!",
  "Enviar invitación por WhatsApp":"Send invitation via WhatsApp","Todavía no hay usuarios.":"No players yet.","Todavía no hay nadie más — invitá amigos.":"Nobody else yet — invite friends.",
  "No se pudo cargar. Revisá tu conexión.":"Couldn't load. Check your connection.","Cargando…":"Loading…","# jugadores":"# players","conectado ahora":"online now",
  "Registrándote en Social…":"Registering you in Social…","⚠️ Vos todavía no aparecés":"⚠️ You don't appear yet","🥇 Ranking de amigos":"🥇 Friends ranking","Entrar al ranking":"Join the ranking",
  "Tu apodo":"Your nickname","✏️ Cambiar apodo":"✏️ Change nickname","Elegí un apodo para aparecer en el ranking junto a todos los que jueguen.":"Choose a nickname to appear in the ranking with everyone who plays.",
  "Ese apodo ya lo usa otro jugador. Probá otro.":"That nickname is already taken. Try another one.","Elegí un apodo propio para el ranking.":"Choose your own nickname for the ranking.",
  "El ranking no está disponible ahora mismo.":"The ranking isn't available right now.","Unite al ranking de amigos":"Join the friends ranking","🎮 ¡Te invitaron a jugar!":"🎮 You've been invited to play!",
  "te invitó a una partida en línea.":"invited you to an online match.","🎮 Último juego:":"🎮 Last game:","recién":"just now","ayer":"yesterday",
  "Crear sala":"Create room","Entrar con código":"Join with code","Crear sala o entrar con código":"Create a room or join with a code","Código":"Code","Pasale este código a la otra persona":"Give this code to the other person",
  "Entrar a la sala":"Enter the room","Sala lista. Esperando al otro jugador…":"Room ready. Waiting for the other player…","El código tiene 4 caracteres.":"The code has 4 characters.",
  "Pedile el código a quien creó la sala.":"Ask the person who created the room for the code.","Conectando…":"Connecting…","Conectando con jugadores online":"Connecting with online players",
  "🌐 Buscando rival…":"🌐 Looking for a rival…","🌐 Jugar online":"🌐 Play online","👥 Jugar con amigos":"👥 Play with friends","📺 Sala TV / Familia":"📺 TV Room / Family",
  "Escribí un mensaje…":"Type a message…","💬 Chat de sala":"💬 Room chat","Chat de sala":"Room chat",
  "No se pudo conectar. Probá con otra red (datos del celular).":"Couldn't connect. Try another network (mobile data).",
  "No se pudo conectar a internet para la sala. Probá con otra red (datos del celular).":"Couldn't connect to the internet for the room. Try another network (mobile data).",
  "No se pudo conectar a internet para invitar. Probá con otra red (datos del celular).":"Couldn't connect to the internet to invite. Try another network (mobile data).",
  "No se pudo enviar, probá de nuevo.":"Couldn't send, try again.","No se pudo enviar, revisá tu conexión.":"Couldn't send, check your connection.","No se pudo cargar (¿sin internet?).":"Couldn't load (no internet?).",
  "📲 App de Play Store":"📲 Play Store app","🌐 Juega en el navegador":"🌐 Plays in the browser","🌐 Instalada desde el navegador":"🌐 Installed from the browser","❔ Sin dato (todavía no abrió la versión nueva)":"❔ No data (hasn't opened the new version yet)",
  /* ---- Instalar / compartir ---- */
  "Instalá Girá y Adiviná":"Install Girá y Adiviná","Para jugar mejor (a pantalla completa, sin barra del navegador) agregalo a tu pantalla de inicio:":"For a better experience (full screen, no browser bar) add it to your home screen:",
  "Agregar a pantalla de inicio":"Add to Home Screen","Agregar":"Add","Abrir en Safari":"Open in Safari","Tocá":"Tap","Tocá el botón":"Tap the button","arriba y elegí":"at the top and choose","de Safari":"in Safari",
  "Si abriste este link desde WhatsApp, tocá":"If you opened this link from WhatsApp, tap","— listo, ya tenés tu ícono":"— done, you now have your icon","Tocá para continuar":"Tap to continue",
  "Imagen descargada. ¡Compartila donde quieras!":"Image downloaded. Share it anywhere!","📤 Compartir":"📤 Share",
  /* ---- Extensiones (solo menús comunes) ---- */
  "¡Lista!":"Ready!","# + # de regalo":"# + # bonus","Pista (gratis)":"Hint (free)","Pista (gratis, te quedan #)":"Hint (free, # left)","Pista 🪙#":"Hint 🪙#","Pista 🪙 #":"Hint 🪙 #","Pista usada":"Hint used",
  "Tutorial":"Tutorial","Idioma / Language: Español":"Idioma / Language: Español",
  /* ---- Logros ---- */
  "Con identidad":"With identity","Casi campeón":"Almost champion","Campeona del Uruguay":"Champion of Uruguay","Con suerte":"Lucky","¡Pozo grande!":"Jackpot!","Comprador":"Shopper",
  "Ahorrista":"Saver","En la cima":"On top","Primer hallazgo fugaz":"First quick find","Ojo de lince":"Eagle eye","Contra el reloj":"Against the clock","Primera palabra en rueda":"First word on the wheel",
  "Base veloz":"Fast base word","Rueda perfecta":"Perfect wheel","Palabra descubierta":"Word discovered","Intuición veloz":"Quick intuition","Siete días seguidos":"Seven days in a row",
  "Primera letra del Rosco":"First Rosco letter","Vuelta perfecta":"Perfect round","Rosco relámpago":"Lightning Rosco","¡Está en el panel!":"It's on the board!","Panel impecable":"Flawless board",
  "Elegí tu nombre y tu avatar":"Choose your name and avatar","Superá el Paso 1 de Durazno":"Pass Step 1 of Durazno","Superá los 4 pasos de Durazno":"Pass the 4 steps of Durazno",
  "Girá la ruleta de premios":"Spin the prize wheel","Ganá el premio mayor de la ruleta":"Win the wheel's top prize","Comprá algo en la tienda":"Buy something in the shop","Juntá 1000 monedas":"Collect 1000 coins",
  "Llegá al 1er puesto del ranking de amigos":"Reach 1st place in the friends ranking","Entrá al Top 3 del ranking de amigos":"Get into the Top 3 of the friends ranking",
  "Encontrá una palabra en Sopa Fugaz":"Find a word in Sopa Fugaz","Encontrá 10 palabras en Sopa Fugaz":"Find 10 words in Sopa Fugaz",
  "Superá una ronda de Sopa Fugaz con 10 segundos de sobra":"Beat a Sopa Fugaz round with 10 seconds to spare","Encontrá una palabra en Rueda de Letras":"Find a word in Rueda de Letras",
  "Encontrá 15 palabras en Rueda de Letras":"Find 15 words in Rueda de Letras","Encontrá la palabra base en menos de 10 segundos":"Find the base word in less than 10 seconds","Completá una rueda sin errores":"Complete a wheel without mistakes",
  "Ganá tu primera Palabra Secreta":"Win your first Palabra Secreta","Descubrí la palabra en dos intentos":"Guess the word in two tries","Ganá Palabra Secreta siete días seguidos":"Win Palabra Secreta seven days in a row",
  "Acertá una palabra en El Rosco":"Get a word right in El Rosco","Acertá todas las letras de un Rosco":"Get every letter of a Rosco right","Acertá todo el Rosco con más de 30 segundos de sobra":"Finish the whole Rosco with more than 30 seconds to spare",
  "Encontrá una respuesta en 100 Rioplatenses":"Find an answer in 100 Rioplatenses","Completá un panel de 100 Rioplatenses sin errores":"Complete a 100 Rioplatenses board without mistakes",
  "Completá las tres rondas de 100 Rioplatenses sin errores":"Complete the three 100 Rioplatenses rounds without mistakes","Derrotá a La Campeona y terminá el mapa":"Beat La Campeona and finish the map",
  "Se completa una sola vez":"Can only be completed once","Completá una colección":"Complete a collection","Abrí 1 sobre de colección":"Open 1 collection pack",
  /* ---- Objetivos diarios ---- */
  "Jugá # partidas":"Play # matches","Ganá # partida":"Win # match","Ganá # partidas seguidas":"Win # matches in a row","Comprá # vocal":"Buy # vowel","Girá la rueda # veces":"Spin the wheel # times",
  "Jugá una Rueda de Letras":"Play a Rueda de Letras","Jugá una ronda de Sopa Fugaz":"Play a round of Sopa Fugaz","Jugá una ronda de 100 Rioplatenses":"Play a round of 100 Rioplatenses",
  "Resolvé la Palabra Secreta de hoy":"Solve today's Palabra Secreta","Respondé # letras del Rosco":"Answer # Rosco letters","Reclamar":"Claim",
  "⟵ Extensiones":"⟵ Extensions","Jugar con un amigo 👥":"Play with a friend 👥","Empezar":"Start","Nivel":"Level","Puntos":"Points","Mejor":"Best","Tiempo":"Time","Jugar otra":"Play another"
  };
  /* Frases que empiezan igual y siguen con un dato. */
  const PREFIJOS=[
    [/^Ronda (\d+) de (\d+)/,"Round $1 of $2"],[/^Hace (\d+) min/,"$1 min ago"],[/^hace (\d+) min/,"$1 min ago"],[/^hace (\d+) h/,"$1 h ago"],[/^hace (\d+) días/,"$1 days ago"],
    [/^Tu avance: (.*)\. Acá ves por qué ciudad del juego va cada persona, no dónde vive\.$/,"Your progress: $1. Here you see which game city each person is in, not where they live."],[/^Tu avance: /,"Your progress: "],[/^Hay (\d+) «/,"There are $1 «"],[/^Tenés (\d+)/,"You have $1"]
  ];
  const norm=t=>t.replace(/\s+/g," ").trim();
  const MAPA=new Map();for(const k in EN)MAPA.set(norm(k),EN[k]);
  const PREFIJO_RE=/^[\s\p{Extended_Pictographic}️‍]+/u;
  function traducirTexto(t){
    if(!t||!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(t))return null;
    const ini=t.match(/^\s*/)[0],fin=t.match(/\s*$/)[0],n=norm(t);
    let r=MAPA.get(n);
    if(r===undefined){const m=n.match(PREFIJO_RE);if(m){const resto=MAPA.get(n.slice(m[0].length));if(resto!==undefined)r=m[0]+resto;}}
    if(r===undefined&&/\d/.test(n)){const nums=n.match(/\d+(?:[.,]\d+)*/g),plantilla=n.replace(/\d+(?:[.,]\d+)*/g,"#");
      let p=MAPA.get(plantilla);if(p===undefined){const m=plantilla.match(PREFIJO_RE);if(m){const resto=MAPA.get(plantilla.slice(m[0].length));if(resto!==undefined)p=m[0]+resto;}}
      if(p!==undefined){let i=0;r=p.replace(/#/g,()=>nums[i++]||"");}}
    if(r===undefined)for(const [re,rep] of PREFIJOS)if(re.test(n)){r=n.replace(re,rep);break;}
    return r===undefined||r===n?null:ini+r+fin;
  }
  const SALTEAR="#frase,.chat-msg,script,style,textarea";
  function attrs(el){for(const a of ["placeholder","title","aria-label"])if(el.hasAttribute(a)){const v=el.getAttribute(a),r=traducirTexto(v);if(r!==null&&r!==v)el.setAttribute(a,r);}
    if(el.tagName==="INPUT"&&(el.type==="button"||el.type==="submit")){const r=traducirTexto(el.value);if(r!==null)el.value=r;}}
  function recorrer(el){for(let c=el.firstChild;c;c=c.nextSibling){
    if(c.nodeType===3){const r=traducirTexto(c.nodeValue);if(r!==null&&r!==c.nodeValue)c.nodeValue=r;}
    else if(c.nodeType===1&&!c.matches(SALTEAR)){attrs(c);recorrer(c);}}}
  function nodo(n){
    if(n.nodeType===3){const p=n.parentElement;if(!p||p.closest(SALTEAR))return;const r=traducirTexto(n.nodeValue);if(r!==null&&r!==n.nodeValue)n.nodeValue=r;return;}
    if(n.nodeType!==1||n.closest(SALTEAR))return;
    attrs(n);recorrer(n);
  }
  /* El cartel de bienvenida es una imagen con texto en español: en inglés
     se dibuja una tarjeta equivalente (los botones invisibles de encima
     quedan en el mismo lugar). Los adornos con letra en español se ocultan. */
  const css=document.createElement("style");
  css.textContent='.deco-mas-disfrutar,.deco-pequenos-desafios{visibility:hidden}'+
   '.bv-en{position:relative;aspect-ratio:1008/1467;width:100%;border-radius:20px;border:2px solid #8A5CC7;background:radial-gradient(circle at 50% 30%,#3E2266,#1E1033 75%);color:#fff;font-family:inherit;text-align:center;pointer-events:none;overflow:hidden}'+
   '.bv-en .bv-x{position:absolute;left:86.5%;top:3%;width:11%;aspect-ratio:1;border-radius:50%;background:#FFFFFF22;display:grid;place-items:center;font-size:1.1rem}'+
   '.bv-en h3{position:absolute;top:7%;left:0;right:0;margin:0;font-family:"Archivo Black",sans-serif;font-size:1.55rem;line-height:1.1}.bv-en h3 b{display:block;color:#F5B301;font-size:2.1rem}.bv-en h3 small{display:block;font-family:inherit;font-size:.95rem;color:#E9D9FF;margin-top:4px}'+
   '.bv-en .bv-pasos{position:absolute;top:28.5%;left:4%;width:92%;height:31%;display:flex;gap:3%}.bv-en .bv-paso{flex:1 1 0;min-width:0;box-sizing:border-box;background:#FFFFFF10;border:1px solid #FFFFFF26;border-radius:14px;padding:6% 4%;display:flex;flex-direction:column;align-items:center;gap:4px}'+
   '.bv-en .bv-paso i{font-style:normal;font-size:2.3rem}.bv-en .bv-paso b{color:#F5B301;font-size:.8rem}.bv-en .bv-paso span{font-size:.63rem;color:#E9D9FF;line-height:1.25}'+
   '.bv-en .bv-cinta{position:absolute;top:62.5%;left:8%;right:8%;padding:2.2% 3%;border-radius:12px;border:1px solid #37D6C055;background:#FFFFFF0D;font-size:.72rem;color:#C7FFF4}'+
   '.bv-en .bv-b1{position:absolute;left:6.5%;top:70.5%;width:87%;height:10%;border-radius:16px;background:linear-gradient(#FF4FA3,#E5197C);display:grid;place-items:center;font-weight:900;font-size:1.25rem;box-shadow:0 6px 0 #9C0F55}'+
   '.bv-en .bv-b2{position:absolute;left:12%;top:83%;width:76%;height:5.5%;border-radius:12px;border:1px solid #FFFFFF40;display:grid;place-items:center;font-weight:800;font-size:.85rem}'+
   '.bv-en .bv-pie{position:absolute;top:93.5%;left:0;right:0;font-size:.75rem;color:#FF8CC6}';
  document.head.appendChild(css);
  document.addEventListener("DOMContentLoaded",()=>{try{
    const img=document.querySelector('#capaBienvenida img[src*="bienvenida"]');if(!img)return;
    const d=document.createElement("div");d.className="bv-en";
    d.innerHTML='<span class="bv-x">✕</span><h3>Learn in<b>30 seconds</b><small>This is how you play</small></h3>'+
      '<div class="bv-pasos"><div class="bv-paso"><i>🎡</i><b>Spin the wheel</b><span>Find prizes or avoid losing your turn.</span></div>'+
      '<div class="bv-paso"><i>🔤</i><b>Pick a letter</b><span>Reveal the phrase little by little.</span></div>'+
      '<div class="bv-paso"><i>🏆</i><b>Guess and win</b><span>Solve it before your rival to earn coins.</span></div></div>'+
      '<div class="bv-cinta">⚡ Fun phrases, rivalry and lots of coins. Ready to play?</div>'+
      '<div class="bv-b1">▶ Start tutorial</div><div class="bv-b2">Play without tutorial</div><div class="bv-pie">See you at the wheel! ♡</div>';
    img.replaceWith(d);
  }catch(e){}});
  window.gyaTraducir=t=>traducirTexto(String(t))??String(t);
  /* Cartelitos del navegador (alert/confirm/prompt). */
  for(const f of ["alert","confirm","prompt"]){const orig=window[f];if(typeof orig==="function")window[f]=function(msg,...r){return orig.call(window,msg==null?msg:String(msg).split("\n").map(l=>traducirTexto(l)??l).join("\n"),...r);};}
  const obs=new MutationObserver(lista=>{for(const m of lista){
    if(m.type==="characterData")nodo(m.target);
    else if(m.type==="attributes")nodo(m.target);
    else m.addedNodes.forEach(nodo);}});
  obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label"]});
  document.addEventListener("DOMContentLoaded",()=>{if(document.body)nodo(document.body);});
})();
