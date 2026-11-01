// Course content. Puzzle fields:
//  fen | moves (start from a real game)   prompt   hint: squares to glow
//  accept: [SAN...] any of these is right   line: [you, reply, you...] forced sequence
//  mate: true -> any checkmate counts on the final step   wrong: {SAN: why}   ok / no: feedback
//  drill: {type, maxMoves} -> play it out against the engine
(function(){
const G={
  soygroz:"https://www.chess.com/game/live/186118039434",
  mosman:"https://www.chess.com/game/live/186121272670",
  hhff:"https://www.chess.com/game/live/186121062608",
  sua:"https://www.chess.com/game/live/186120640616",
  jdct:"https://www.chess.com/game/live/186118654678",
  payam:"https://www.chess.com/game/live/186120133266",
  kritika:"https://www.chess.com/game/live/186119360458"
};
const pc=id=>`<svg viewBox="0 0 40 40" aria-hidden="true"><use href="#${id}"/></svg>`;
const mine=(t,l)=>`<div class="mine"><span class="eyebrow">From your games</span><p>${t} <a href="${l}" target="_blank" rel="noopener">Open the game ↗</a></p></div>`;
const link=(t,u)=>`<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`;
const more=(...ls)=>`<div class="more"><span class="eyebrow">Go deeper</span><ul>${ls.map(([t,u])=>`<li>${link(t,u)}</li>`).join("")}</ul></div>`;

window.UNITS=[
{name:"The rules that matter",lessons:[
 {id:"squares",title:"Learn the squares",
  key:"Every square has a name: a letter for the column and a number for the row.",
  body:`<ul><li><b>Letters a to h</b> are the columns, left to right from White's side. The a-column is on White's left.</li><li><b>Numbers 1 to 8</b> are the rows. Row 1 is White's back row and row 8 is Black's.</li><li>So <b>e4</b> means column e, row 4. It's the square White's king pawn usually jumps to on move one.</li><li>From Black's side everything flips: the a-column is on your right and row 8 is closest to you.</li></ul>
   <p>A few squares to anchor on. Kings start on e1 and e8. Queens start on d1 and d8. The weak squares next to each king are f2 and f7.</p>
   <p>You don't have to memorize this before moving on. The <b>Square names</b> switch at the top puts a label on every square of every board. And anywhere this course names a square or a move, you can hover over it or tap it to light it up on the board.</p>
   <p>The drill hides the labels. Click the square it names, as many as you can in 30 seconds. Do it once a day and the names stick within a couple of weeks.</p>`,
  hw:"Do the drill once a day until you score 15 or more from both sides. Then try turning square names off.",
  puzzles:[{id:"dr-coords",drill:{type:"coords"},prompt:"Find the squares",hint:[]}]},
 {id:"capture",title:"How pieces capture",
  key:"Every piece captures the way it moves, except the pawn.",
  body:`<ul><li><b>Rook</b>: straight lines, any distance.</li><li><b>Bishop</b>: diagonals, any distance.</li><li><b>Queen</b>: both.</li><li><b>Knight</b>: an L shape, two squares one way and one to the side. It jumps over pieces.</li><li><b>King</b>: one square any direction.</li><li><b>Pawn</b>: moves straight forward but captures one square <b>diagonally</b> forward. It can never capture straight ahead.</li></ul>
   <p>You know this already. These three puzzles are a five-second warm-up so the board feels natural before the real work.</p>`,
  hw:"No homework. Move on when these feel easy.",
  puzzles:[
   {id:"cap1",exact:true,fen:"4k3/8/8/8/5r2/8/8/2B1K3 w - - 0 1",prompt:"Take the rook with your bishop.",hint:["c1","f4"],accept:["Bxf4"],ok:"Bishops capture along diagonals, any distance.",no:"Follow your bishop's diagonal until you hit the rook."},
   {id:"cap2",exact:true,fen:"4k3/8/8/8/8/5q2/8/4K1N1 w - - 0 1",prompt:"Take the queen with your knight.",hint:["g1"],accept:["Nxf3"],ok:"The knight's L-jump lands right on the queen. +9.",no:"Your knight in the corner can jump to the queen's square."},
   {id:"cap3",exact:true,fen:"4k3/8/8/3nr3/4P3/8/8/6K1 w - - 0 1",prompt:"Your pawn can capture one of these two pieces. Which?",hint:["e4"],accept:["exd5"],ok:"Pawns capture diagonally. The rook right in front is safe from it.",no:"A pawn can't capture straight ahead. Look diagonally."}
  ]},
 {id:"check",title:"Check, checkmate, stalemate",
  key:"Check must be answered. Checkmate ends the game. Stalemate is a draw.",
  body:`<p>When your king is in <b>check</b>, you have three ways out:</p>
   <ul><li><b>Capture</b> the piece giving check.</li><li><b>Block</b> the line between it and your king.</li><li><b>Move</b> the king to a safe square.</li></ul>
   <p>If none of those work, it's <b>checkmate</b>. If it's your turn, you're not in check, but you have no legal move at all, it's <b>stalemate</b> and the game is a draw. Stalemate is how players who are way ahead throw away wins. You did it against kritikaknowsnoshi.</p>`,
  hw:"Nothing to play yet. Make sure you can explain the difference between checkmate and stalemate out loud.",
  puzzles:[
   {id:"chk1",exact:true,fen:"4k3/8/8/8/4r3/2N5/8/4K3 w - - 0 1",prompt:"You're in check. Pick the best of the three ways out.",hint:["e4"],accept:["Nxe4"],ok:"Capturing is best when you can. You got out of check and won a rook.",no:"You escaped, but you could have captured the checking piece."},
   {id:"chk2",fen:"k7/8/1K6/8/8/8/8/2Q5 w - - 0 1",prompt:"Checkmate in one. One queen move here is stalemate. Don't play it.",hint:["a8"],mate:true,wrong:{"Qc7":"Stalemate. Black has no moves and isn't in check, so it's a draw."},ok:"Checkmate. The king is in check and every escape square is covered.",no:"That doesn't give checkmate. Find a check where the king can't escape."}
  ]},
 {id:"special",title:"Castling, promotion, en passant",
  key:"Three special moves. Each one shows up in real games.",
  body:`<ul><li><b>Castling</b>: king moves two squares toward a rook, and the rook hops over. Only if neither has moved, nothing is between them, and the king isn't in check or passing through an attacked square. On the board here, tap the king and then the square two steps over.</li><li><b>Promotion</b>: a pawn reaching the last row becomes a queen (or another piece). This board always makes a queen.</li><li><b>En passant</b>: if an enemy pawn jumps two squares and lands right beside your pawn, you can capture it as if it had moved one. Only on the very next move.</li></ul>`,
  hw:"Castle in every game this week by move 10.",
  puzzles:[
   {id:"sp1",exact:true,fen:"4k3/8/8/8/8/8/5PPP/4K2R w K - 0 1",prompt:"Castle kingside.",hint:["e1","g1"],accept:["O-O"],ok:"King to safety, rook to the center. That's what castling is for.",no:"Tap the king, then the square two steps toward the rook."},
   {id:"sp2",exact:true,fen:"7k/P7/8/8/8/8/8/K7 w - - 0 1",prompt:"Make a queen.",hint:["a7"],accept:["a8=Q"],ok:"New queen, with check.",no:"Push the pawn to the last row."},
   {id:"sp3",exact:true,fen:"4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",prompt:"Black's pawn just jumped two squares next to yours. Capture it en passant.",hint:["d5","d6"],accept:["exd6"],ok:"En passant: your pawn lands behind theirs and removes it.",no:"Move your pawn diagonally to the square the black pawn skipped over."}
  ]}
]},
{name:"Stop giving pieces away",lessons:[
 {id:"values",title:"What the pieces are worth",
  key:"Every capture is a trade. Count the points before you make it.",
  body:`<div class="values">
     <div class="val">${pc("wp")}<b>1</b><small>Pawn</small></div><div class="val">${pc("wn")}<b>3</b><small>Knight</small></div><div class="val">${pc("wb")}<b>3</b><small>Bishop</small></div><div class="val">${pc("wr")}<b>5</b><small>Rook</small></div><div class="val">${pc("wq")}<b>9</b><small>Queen</small></div></div>
   <p>If you give up a knight (3) to win a rook (5), you're 2 points ahead. Give a rook for a knight and you're 2 behind.</p>
   <p>At your level the player with more points usually wins. You don't need deep plans yet. You need to collect more points than you give away.</p>`,
  hw:"Play 2 games. After each one, open Game Review and add up the points you gave away for nothing.",
  puzzles:[
   {id:"val1",fen:"rnbqkb1r/pppp1ppp/8/4n3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",prompt:"A black knight is standing where nothing protects it. Take it.",hint:["e5"],accept:["Nxe5"],ok:"Free knight, +3.",no:"Look for a black piece you can capture."},
   {id:"val2",fen:"rnbqkb1r/pppp1ppp/5n2/4p3/4Q3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 1",prompt:"You're Black. White's queen came out too early. Win it.",hint:["e4"],accept:["Nxe4"],ok:"+9. Nothing protected the queen.",no:"White's queen is standing right next to one of your pieces' jumps."}
  ]},
 {id:"safety",title:"The safety check",
  key:"Before every move: what did their move attack, and what will my move leave unprotected?",
  body:`<p>This is the most important habit in the course. It takes about five seconds, and in a 10-minute game you have time for it every move.</p>
   <ul><li><b>Their move.</b> Look at the piece they just moved and every square it now hits.</li><li><b>Your move.</b> Look at the piece you're about to move and what it was guarding.</li></ul>
   ${mine("White's queen had just moved up and you didn't check what it hit. You moved your bishop, lost the knight for free, and resigned four moves later.",G.soygroz)}
   <p>The yellow squares on each puzzle show your opponent's last move. Start every puzzle by asking what that move attacks.</p>`,
  hw:"Play 3 games and ask both questions before every move, even obvious ones. Goal: no free pieces lost before move 15.",
  puzzles:[
   {id:"saf1",moves:"e4 e5 Bc4 Nf6 Nf3 Qe7 b3 Nxe4 Ba3 d6 Qe2",prompt:"White's queen just moved. What is it attacking? Save that piece.",hint:["e2","e4"],accept:["Nf6","f5","Ng5","Nc5"],wrong:{"Bg4":"This is what you played in the game. The knight stays attacked and undefended."},ok:"The queen was hitting your undefended knight. Now it's safe.",no:"Your knight in the center is still attacked by the queen with nothing protecting it."},
   {id:"saf2",moves:"e4 e5 Nf3 Nf6 d4 Nc6 d5",prompt:"White's pawn just moved forward. What does it attack? Move that piece somewhere safe.",hint:["d5","c6"],accept:["Ne7","Nb8","Nb4","Na5"],ok:"The pawn was attacking your knight. You got it out without losing anything.",no:"That square isn't safe, or you left the knight where the pawn can take it."},
   {id:"saf3",moves:"e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Bc5 Nc3 d6 Bg5 h6",prompt:"Black's pawn just stepped forward. What does it attack? Deal with it.",hint:["h6","g5"],accept:["Bxf6","Bh4","Bd2","Be3","Bc1"],ok:"The pawn was hitting your bishop. You kept your points: either a fair trade or a safe retreat.",no:"Your bishop is still attacked by the pawn, or you dropped something else."}
  ]},
 {id:"defended",title:"Free piece or protected piece?",
  key:"Before you capture, ask: can they take back?",
  body:`<ul><li>If nothing can take back, the piece is <b>free</b>. Take it.</li><li>If they can, count. Taking a protected knight (3) with your rook (5) loses 2.</li></ul>
   ${mine("Your bishop moved away, and it was the only thing protecting the pawn beside your king. White took the pawn, and your pinned knight fell right after.",G.payam)}`,
  hw:"In 3 games, every time you want to capture, first point at everything that could take back.",
  puzzles:[
   {id:"def1",fen:"4k3/8/4p3/3n4/6b1/8/4BPPP/3R2K1 w - - 0 1",prompt:"You can capture the knight or the bishop. Which one is free?",hint:["d5","g4"],accept:["Bxg4"],wrong:{"Rxd5":"The pawn takes back your rook. You gave 5 to get 3."},ok:"Nothing protects the bishop. The knight had a pawn guarding it.",no:"Check which black piece has a defender."},
   {id:"def2",fen:"rnbqkb1r/pppp1ppp/5n2/8/4p3/2N5/PPPPQPPP/R1B1KBNR w KQkq - 0 1",prompt:"Black's pawn is attacked twice and defended once. Win it, in the right order.",hint:["e4"],line:["Nxe4","Nxe4","Qxe4+"],ok:"Two attackers beat one defender. Lead with the cheaper piece, and the queen collects last.",no:"Capture with the knight first. Taking with the queen first loses the queen."},
   {id:"def3",moves:"e4 e5 Nf3 Nc6 Bc4 d6",prompt:"Is Black's e5 pawn free? Decide, then make a good move.",hint:["e5","c6","d6"],anyBut:["Nxe5","Bxf7+"],wrong:{"Nxe5":"Two black pieces protect that pawn. You gave a knight for a pawn.","Bxf7+":"The king takes your bishop. You gave 3 for 1."},ok:"Right. That pawn is protected by Black's knight, so a calm developing move is better.",no:"That move hands something over. Look again."}
  ]},
 {id:"u2rev",title:"Unit review: hanging pieces",review:true,
  key:"No hints about the idea. Just find the best move.",
  body:`<p>These come from the whole unit, mixed. Do the safety check out loud on each one before moving.</p>`,
  hw:"Play 3 games. Count your free pieces lost. Write the number down and try to beat it tomorrow.",
  refs:["val2","saf1","def1","def2"]}
]},
{name:"Start the game right",lessons:[
 {id:"opening",title:"Opening rules",
  key:"Center pawn, knights and bishops out, castle. Queen stays home.",
  body:`<ul><li><b>Put a pawn in the center</b> on move one.</li><li><b>Bring out knights and bishops</b>, a new piece each move. Knights before bishops is a good default.</li><li><b>Castle early</b>, usually by move 8 to 10.</li><li><b>Keep the queen home</b> until your other pieces are out.</li><li><b>Leave the pawns in front of your castled king alone</b> unless you have a reason.</li><li><b>Don't grab pawns</b> on the edge while you're behind in development.</li></ul>
   ${mine("Your queen came out on move 3 and got chased. Later a pawn move opened a diagonal to your rook in the corner, and you lost it.",G.mosman)}
   <p>The <b>Openings</b> tab has your full repertoire. You play the moves yourself, and then you play the game out against the computer.</p>`,
  hw:"Do 2 opening drills in the Openings tab, then play both of them out against the computer.",
  puzzles:[
   {id:"op1",moves:"e4 e5 Nf3 Nc6",prompt:"Play a move that follows the opening rules.",hint:["f1","b1"],accept:["Bc4","Bb5","Nc3","d4","c3"],wrong:{"Qe2":"Early queen move. Bring out a knight or bishop first.","h3":"Edge pawn moves don't develop anything.","a3":"Edge pawn moves don't develop anything.","Ng5":"That moves the same knight twice, and it gets pushed back."},ok:"A new piece in the game or a pawn in the center. Exactly what the opening is for.",no:"Not terrible, but bring out a new knight or bishop, or add a pawn to the center."},
   {id:"op2",moves:"d4 d5 Nf3 Nf6 Bf4",prompt:"You're Black. Pick a good developing move.",hint:["e7","c7","b8"],accept:["e6","c5","Nc6","c6","Bf5","g6","Nbd7"],ok:"Good, natural development.",no:"Not the most useful. Free your bishop with ...e6, hit the center with ...c5, or bring out a piece."}
  ]},
 {id:"traps",title:"Traps you'll actually see",
  key:"At your rating, the same few traps win and lose games over and over.",
  body:`<p>These come up constantly in online games under 1000. Learn them once and you'll recognize them for good.</p>
   <ul><li><b>Scholar's Mate</b>: queen and bishop both aim at f7. Block the queen's line with ...g6, or defend with ...Qe7. Never ...Nf6 while the queen sits on h5.</li><li><b>Ruy Lopez Exchange trick</b>: after Bxc6 dxc6, if White grabs e5, the queen comes to d4 and hits two things.</li><li><b>Petrov copycat</b>: if Black copies White's knight capture on e5, a queen move to e2 wins a piece.</li><li><b>Blackburne Shilling</b>: a cheap trap for Black. If White grabs e5 too fast, the queen comes to g5 and hits two things at once.</li></ul>`,
  hw:"Play the 'Stopping Scholar's Mate' and 'Ruy Lopez Exchange' drills in the Openings tab.",
  puzzles:[
   {id:"tr1",moves:"e4 e5 Bc4 Nc6 Qh5",prompt:"White threatens checkmate on f7 next move. Stop it.",hint:["h5","c4","f7"],accept:["g6","Qe7","Qf6"],wrong:{"Nf6":"Queen takes f7. That's checkmate. The knight doesn't block the queen's line."},ok:"Mate stopped. Now develop with tempo by attacking that queen.",no:"White can still play queen takes f7 with checkmate."},
   {id:"tr2",moves:"e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 Nxe5",prompt:"White just grabbed your e5 pawn. Win it back.",hint:["d8"],accept:["Qd4"],ok:"The queen hits the knight and the e4 pawn at once. You get the pawn back.",no:"Use your queen to attack two things at once."},
   {id:"tr3",moves:"e4 e5 Nf3 Nf6 Nxe5 Nxe4",prompt:"Black copied you. Punish it.",hint:["d1","e4"],accept:["Qe2"],ok:"The queen attacks the knight. If it moves, your knight gives a discovered check and the queen on d8 falls.",no:"Line your queen up on the e-file with Black's knight and king."},
   {id:"tr4",moves:"e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5",prompt:"You're Black, and White just grabbed e5. Hit two things at once.",hint:["d8","g2"],accept:["Qg5"],ok:"The queen attacks the knight and the g2 pawn at the same time.",no:"Find a queen move that attacks the e5 knight and something else."}
  ]}
]},
{name:"Win pieces with tactics",lessons:[
 {id:"forks",title:"Forks",
  key:"One piece attacking two things at once. They can only save one.",
  body:`<p>Knights are the best forking pieces because their L-shaped attacks are easy to miss. Pawns and queens fork too. The best fork includes the king, because check has to be answered.</p>
   <p><b>How to look:</b> find two enemy pieces that are undefended or worth more than your attacker. Ask whether any of your pieces can reach a square that hits both.</p>
   ${more(["Lichess puzzles: forks only","https://lichess.org/training/fork"],["Chess.com Lessons (Tactics track)","https://www.chess.com/lessons"])}`,
  hw:"Do 10 chess.com puzzles. After each one, name the idea: fork, pin, skewer, or something else.",
  puzzles:[
   {id:"fk1",fen:"q3k3/5ppp/8/1N6/8/8/5PPP/6K1 w - - 0 1",prompt:"Find the knight jump that attacks the king and the queen together.",hint:["b5"],line:["Nc7+","Kd8","Nxa8"],ok:"Fork. The king stepped aside and the knight took the queen: +9.",no:"Try every square your knight can jump to."},
   {id:"fk2",fen:"r1bqk2r/pppp1ppp/3b1n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 1",prompt:"Pawns fork too. Push one so it hits two black pieces.",hint:["e4"],accept:["e5"],ok:"Bishop and knight both attacked. One falls.",no:"Find a pawn push that lands between two black pieces."},
   {id:"fk3",fen:"r5k1/p5pp/8/8/8/8/5PPP/3Q2K1 w - - 0 1",prompt:"Your queen can check the king and attack the loose rook at once.",hint:["d1","a8","g8"],line:["Qd5+","Kh8","Qxa8+"],ok:"Queen fork. Check first, then the rook comes off.",no:"Find a central queen square on the king's diagonal that also sees the corner rook."}
  ]},
 {id:"pins",title:"Pins",
  key:"A piece that can't move because something bigger is behind it.",
  body:`<ul><li>King behind it: the piece <b>can't legally move</b>.</li><li>Queen or rook behind it: moving it loses the bigger piece.</li></ul>
   <p>Once a piece is pinned, <b>attack it again</b>, often with a pawn. It can't run away.</p>
   ${mine("Your knight was pinned to your queen by a bishop. It couldn't move away, and it got captured.",G.payam)}
   ${more(["Lichess puzzles: pins only","https://lichess.org/training/pin"],["Lichess Practice (fundamental tactics)","https://lichess.org/practice"])}`,
  hw:"In 3 games, look for lines from the enemy king or queen that run through just one piece.",
  puzzles:[
   {id:"pn1",fen:"6k1/p5pp/8/3q4/8/1P6/5PPP/5BK1 w - - 0 1",prompt:"Black's queen and king share a diagonal. Pin the queen.",hint:["d5","g8"],line:["Bc4","Qxc4","bxc4"],ok:"The queen couldn't step aside. 3 for 9.",no:"Put your bishop on a protected square on the queen-king diagonal."},
   {id:"pn2",fen:"4k3/pp3ppp/2n5/1B6/3P4/8/PPP2PPP/4K3 w - - 0 1",prompt:"Black's knight is pinned to the king. Attack it again.",hint:["c6","d4"],accept:["d5"],ok:"The pinned knight can't run. It falls next move.",no:"Hit the pinned knight with something cheap, like a pawn."},
   {id:"pn3",fen:"4k3/8/8/4q3/8/8/5K2/R7 w - - 0 1",prompt:"Pin Black's queen to the king with your rook.",hint:["e5","e8"],accept:["Re1"],ok:"Pinned. The queen can take your rook, but your king takes back: 5 for 9.",no:"Put your rook on the queen's file, where your king protects it."}
  ]},
 {id:"skewers",title:"Skewers",
  key:"Attack the big piece first. When it moves, take the one behind it.",
  body:`<p>A skewer is a pin in reverse. The best ones are checks: the king must move, and the piece behind it is yours.</p>
   ${more(["Lichess puzzles: skewers only","https://lichess.org/training/skewer"])}`,
  hw:"Do 10 more chess.com puzzles. Name the idea before you touch a piece.",
  puzzles:[
   {id:"sk1",fen:"8/2k4q/8/8/8/8/6PP/R5K1 w - - 0 1",prompt:"King and queen on the same row. Check the king with the queen behind it.",hint:["c7","h7"],line:["Ra7+","Kd6","Rxh7"],ok:"Skewer. +9.",no:"Your rook can check along the row the king and queen share."},
   {id:"sk2",fen:"2r5/8/4k3/8/8/6P1/5P1P/5BK1 w - - 0 1",prompt:"Same idea with a bishop. Check so the rook is behind the king.",hint:["e6","c8"],line:["Bh3+","Kd6","Bxc8"],ok:"The king left the diagonal and the rook fell: +5.",no:"Find the diagonal through the king and the rook, and check from the far end."}
  ]},
 {id:"discovered",title:"Discovered attacks",
  key:"Move one piece out of the way and the piece behind it attacks.",
  body:`<p>When one of your pieces is lined up behind another, moving the front piece unleashes the back one. Now you have two attacks in one move: the piece that moved, and the piece behind it.</p>
   <p>The strongest version is <b>discovered check</b>. The king must deal with the check, so whatever the moving piece attacks is free.</p>
   ${more(["Lichess puzzles: discovered attacks","https://lichess.org/training/discoveredAttack"])}`,
  hw:"In your next games, notice whenever two of your pieces line up on a file, rank, or diagonal. That's a discovery waiting to happen.",
  puzzles:[
   {id:"dc1",fen:"6k1/6pp/1q6/3N4/8/8/B5PP/7K w - - 0 1",prompt:"Your bishop is hidden behind your knight, aimed at the king. Use it.",hint:["a2","d5","g8"],accept:["Nxb6+"],ok:"Discovered check from the bishop, and the knight grabs the queen. +9.",no:"Move the knight with a capture. The bishop behind it gives check."},
   {id:"dc2",fen:"4q1k1/5ppp/8/8/4N3/8/5PPP/4R1K1 w - - 0 1",prompt:"Your rook is behind your knight on the queen's file. Move the knight with check.",hint:["e1","e4","e8"],accept:["Nf6+"],ok:"Check from the knight, and the rook behind it now hits the queen. Black can't handle both.",no:"Find the knight move that gives check. That uncovers your rook."}
  ]},
 {id:"u4rev",title:"Unit review: tactics",review:true,key:"Mixed tactics, no labels. Find the idea yourself.",
  body:`<p>This is how real games feel: nobody tells you it's a fork. Look for checks, captures, and attacks on two things.</p>`,
  hw:"Do a 5-minute Puzzle Rush in the Puzzles tab. Try to beat your score each day.",
  refs:["fk3","pn2","sk2","dc1","fk2"]}
]},
{name:"Checkmate patterns",lessons:[
 {id:"backrank",title:"Back-rank mate",
  key:"A king boxed in by its own pawns can be mated on its back row.",
  body:`<p>When the three pawns in front of a castled king never move, the king has no escape square. A rook or queen landing on that back row is checkmate.</p>`,
  hw:"In every game, before grabbing a pawn far away, look at your own back row.",
  puzzles:[
   {id:"br1",fen:"6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",prompt:"Checkmate in one.",hint:["g8"],mate:true,ok:"The pawns trap their own king.",no:"Use your rook on the black king's row."},
   {id:"br2",fen:"2r3k1/5ppp/8/8/8/8/3R1PPP/3R2K1 w - - 0 1",prompt:"Black's rook guards the back row. Two rooks beat one. Mate in two.",hint:["d1","d2"],line:["Rd8+","Rxd8","Rxd8#"],mate:true,ok:"The first rook forced the trade; the second landed with mate.",no:"Check on the back row with a rook that has a partner behind it."}
  ]},
 {id:"guard",title:"Guard your own king first",
  key:"Most of your mates lost came while you were attacking somewhere else.",
  body:`${mine("You were up a piece, went to take a pawn on the far side, and got mated next to your king.",G.sua)}
   <ul><li><b>Make an escape square</b>: once the opening is over, push one pawn in front of your king one step.</li><li><b>Keep a rook or queen on your back row</b> while enemy rooks are on open lines.</li></ul>`,
  hw:"In 3 games, every time an enemy rook or queen lands on an open line, ask: can it reach my back row?",
  puzzles:[
   {id:"gd1",fen:"3r2k1/p4ppp/8/R7/8/8/5PPP/6K1 w - - 0 1",prompt:"There's a free pawn, but Black threatens something big. Stop it.",hint:["d8","d1"],accept:["h3","h4","g3","g4","f3","f4","Kf1","Ra1"],wrong:{"Rxa7":"Black's rook drops onto your back row. Checkmate.","Rd5":"That stops mate but hands over your rook.","Re5":"Your rook can block the check, but then Black trades it off and mates anyway."},ok:"Your king has air, or the back row is guarded.",no:"Black's rook can drop onto your back row with mate. Stop that first."}
  ]},
 {id:"queenmate",title:"King and queen mates",
  key:"Queen pushes the king to the edge. Your king walks up. Then mate.",
  body:`<ul><li>Box the enemy king toward the edge with your queen. Stay a knight's jump away so it keeps shrinking.</li><li>Walk your own king up to help.</li><li>Mate on the edge with the queen, protected by your king.</li></ul>
   <p><b>Before every queen move, check it isn't stalemate.</b> If the enemy king has no legal move and isn't in check, it's a draw.</p>
   ${more(["Lichess puzzles: mate in 1","https://lichess.org/training/mateIn1"],["Lichess Practice: checkmate drills","https://lichess.org/practice"])}`,
  hw:"Do the Queen mate drill in the Endgames unit until you can finish in under 15 moves.",
  puzzles:[
   {id:"qm1",fen:"4k3/8/4K3/8/8/8/8/Q7 w - - 0 1",prompt:"Your king is in place. Mate in one.",hint:["e8","a1"],mate:true,ok:"Back row covered by the queen, front squares by your king.",no:"Use the queen on the king's own row."},
   {id:"qm2",fen:"7k/Q7/6K1/8/8/8/8/8 w - - 0 1",prompt:"Mate in one. Careful: two queen moves here are stalemate.",hint:["h8","g6"],mate:true,wrong:{"Qf7":"Stalemate. Draw.","Qa2":"Stalemate. Draw."},ok:"Checkmate, not stalemate.",no:"That isn't checkmate. Give check with no escape."}
  ]},
 {id:"patterns",title:"More mates to recognize",
  key:"Smothered mate, the f7 attack, and the h7 attack.",
  body:`<ul><li><b>Scholar's pattern</b>: queen and bishop together on f7 (or f2). It's how many games under 800 end.</li><li><b>Queen and bishop on h7</b>: if the defending knight leaves f6, the queen lands on h7 protected by a bishop.</li><li><b>Smothered mate</b>: the king is surrounded by its own pieces, and a knight gives check that nothing can stop.</li><li><b>Two-rook ladder</b>: one rook guards a row, the other gives check on the next one.</li></ul>`,
  hw:"Play a practice game in the Play tab and look for one of these patterns.",
  puzzles:[
   {id:"pt1",moves:"e4 e5 Bc4 Nc6 Qh5 Nf6",prompt:"Black just made the classic mistake. Mate in one.",hint:["f7"],mate:true,ok:"Scholar's Mate. Now you know exactly what to watch for as Black.",no:"Queen and bishop both aim at one square next to the black king."},
   {id:"pt2",fen:"r1bq1rk1/pppp1ppp/2n5/7Q/8/3B4/PPP2PPP/RN2K1NR w KQ - 0 1",prompt:"No knight on f6 to defend. Mate in one.",hint:["h7","d3"],mate:true,ok:"Queen takes h7, protected by the bishop.",no:"Your queen and bishop both see one pawn next to the king."},
   {id:"pt3",fen:"6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",prompt:"The black king is boxed in by its own pieces. Mate in one.",hint:["g5"],mate:true,ok:"Smothered mate. Nothing can capture the knight or block a knight check.",no:"The knight can check a king that has no squares to move to."},
   {id:"pt4",fen:"7k/R7/8/8/8/8/8/1R4K1 w - - 0 1",prompt:"One rook already holds the 7th row. Mate in one with the other.",hint:["a7","b1"],mate:true,ok:"Ladder mate: one rook cuts off, the other gives check.",no:"Check on the back row with the rook that isn't already working."}
  ]},
 {id:"u5rev",title:"Unit review: checkmates",review:true,key:"Find the mate. Don't fall for stalemate.",
  body:`<p>Mixed checkmate patterns, no labels.</p>`,hw:"Do 10 mate-in-one or mate-in-two puzzles on chess.com.",
  refs:["pt2","br2","qm2","pt3","gd1"]}
]},
{name:"Endgames",lessons:[
 {id:"kq",title:"Drill: queen and king vs king",
  key:"Push the king to the edge with the queen, bring your king, mate.",
  body:`<p>The computer defends with the lone king. You have 20 moves. If you stalemate, the drill resets.</p>
   <ul><li>Put your queen a knight's jump from the enemy king. Every time it moves, follow it at a knight's jump.</li><li>Once it's on the edge, stop shrinking. Walk your king over.</li><li>Then mate.</li></ul>
   ${more(["Lichess Practice: piece checkmates","https://lichess.org/practice"])}`,
  hw:"Repeat this drill on 3 different days until it's automatic.",
  puzzles:[{id:"dr-kq",fen:"8/8/8/4k3/8/8/8/3QK3 w - - 0 1",prompt:"Checkmate the lone king within 20 moves.",drill:{type:"mate",max:20},hint:[]}]},
 {id:"kr",title:"Drill: rook and king vs king",
  key:"The rook cuts the king off. Your king pushes it back. Repeat.",
  body:`<p>Harder than the queen. You have 35 moves.</p>
   <ul><li>Use the rook to cut the king off along a row or column.</li><li>Walk your king to face the enemy king, with one square between them (this is called <b>opposition</b>).</li><li>When the kings face each other, check with the rook. The enemy king has to step back toward the edge.</li><li>If your rook is attacked, move it to the far side of its row.</li></ul>
   ${more(["Lichess Practice: piece checkmates","https://lichess.org/practice"])}`,
  hw:"Do this drill once a day for a week.",
  puzzles:[{id:"dr-kr",fen:"8/8/8/4k3/8/8/8/R3K3 w - - 0 1",prompt:"Checkmate with king and rook within 35 moves.",drill:{type:"mate",max:35},hint:[]}]},
 {id:"pawns",title:"Pawn endings",
  key:"Count the race. Then walk your king in front of your pawn.",
  body:`<p><b>The square rule</b>: draw a square from your pawn to its promotion row. If the enemy king can step into that square on its turn, it catches the pawn. If not, just push.</p>
   <p><b>King in front</b>: with king and pawn vs king, put your king in front of the pawn, not behind it. Your king clears the path, and the pawn follows.</p>
   ${more(["Lichess Practice: pawn endgames","https://lichess.org/practice"])}`,
  hw:"Do the pawn drill until you promote every time.",
  puzzles:[
   {id:"pw1",fen:"8/8/8/5k2/P7/8/8/4K3 w - - 0 1",prompt:"Can the black king catch your pawn? Make the winning move.",hint:["a4","f5"],accept:["a5"],ok:"The king is outside the pawn's square. It can't catch it.",no:"That gives the black king time to catch the pawn. Push now."},
   {id:"dr-kp",fen:"4k3/8/4K3/8/4P3/8/8/8 w - - 0 1",prompt:"Drill: promote your pawn without losing it. 15 moves.",drill:{type:"promote",max:15},hint:[]}
  ]}
]},
{name:"Win the won games",lessons:[
 {id:"keepit",title:"Don't give it back",
  key:"When you're ahead, your only job is to stop losing pieces.",
  body:`${mine("Your opponent gave you their queen on move 8 and you still lost. Over the next 20 moves your pieces got picked off one at a time.",G.jdct)}
   <p>When you're winning, the safety check matters even more, because your opponent is now hunting for tricks. Slow down and take your time.</p>`,
  hw:"Whenever you're ahead by 3 or more points, spend at least 10 seconds on every move.",
  puzzles:[{id:"kp1",moves:"e4 d5 exd5 Qd6 Nc3 Qe5+ Be2 Bg4 f3 Bh5 g4 Bg6 d4 Qg5 Bxg5 Nd7 Nb5 O-O-O Nxa7+ Kb8",prompt:"Your knight in the corner is attacked by the king. Save it.",hint:["a7"],accept:["Nb5"],wrong:{"Be3":"This is what you played. The king took the knight.","Nc6+":"The pawn takes your knight."},ok:"The knight escapes. You stay a queen up.",no:"Move the knight where nothing can reach it."}]},
 {id:"trade",title:"Trade when you're ahead",
  key:"Ahead? Swap equal pieces. Behind? Avoid trades.",
  body:`<p>Every equal trade makes your lead bigger by comparison. Up a rook with all the pieces on, things can still go wrong. Up a rook with almost nothing left, the win is easy.</p>`,
  hw:"Next time you're ahead, offer at least one queen or rook trade.",
  puzzles:[{id:"td1",exact:true,fen:"5rk1/pp3ppp/8/2p5/3q4/8/PP3PPP/R2Q1RK1 w - - 0 1",prompt:"You're up a rook. The queens face each other. Trade.",hint:["d1","d4"],line:["Qxd4","cxd4"],ok:"Queens off. Your extra rook will win.",no:"Take the queen trade."}]}
]},
{name:"How you play",lessons:[
 {id:"think",title:"Your move-by-move routine",
  key:"Their threat, my checks and captures, then the safety check.",
  body:`<p>Strong players don't think harder; they think in the same order every move. Use this one:</p>
   <ol class="steps"><li><b>What did they just do?</b> What does that piece attack now? Any threat?</li><li><b>Checks, captures, threats</b> for you. Do any of them win something?</li><li><b>Pick a move.</b> If nothing forcing works, improve your worst piece.</li><li><b>Safety check</b> before you let go: does my move leave anything unprotected? Can they check me or take something?</li></ol>
   <p>In a 10-minute game you have about 15 seconds a move. That's enough for all four steps on normal moves.</p>`,
  hw:"Play one practice game in the Play tab and say the four steps out loud on every move.",
  checklist:["I did the routine for every move of one full game.","I did it for three games in a row.","I caught myself about to blunder at least once."]},
 {id:"habits",title:"Session rules",
  key:"Protect your rating while the skills catch up.",
  body:`<p>On Oct 28 you started near 974 and ended at 775 after nine games in a row. Most of the drop came late, when the games got faster and the mistakes got bigger.</p>`,
  hw:"Follow these for a week, then check your rating.",
  checklist:["Play 10-minute games only, and use your clock.","Stop for the day after 2 losses in a row.","Do the Today routine here before your first rated game.","After every loss, find only your first big mistake in Game Review.","Come back weekly so Claude can review your chess.com games."]},
 {id:"review",title:"How to review your own games",
  key:"One loss, one lesson. Find the first big mistake and stop there.",
  body:`<ol class="steps"><li>Open the game on chess.com and click Game Review.</li><li>Find the <b>first</b> move marked as a blunder or mistake.</li><li>Before looking at the computer's move, ask: what was my opponent threatening? Did I do the safety check?</li><li>Name the reason in a few words: "hung a piece", "missed a fork", "ignored a threat".</li><li>If it keeps happening, that's your next lesson here.</li></ol>
   <p>Practice games in the Play tab get the same review automatically.</p>
   `,
  hw:"Review your last 3 losses this way.",
  checklist:["I reviewed 3 losses using these steps.","I wrote down the reason for each first mistake."]}
]},
{name:"Beyond 1000",lessons:[
 {id:"calc",title:"Calculate two moves deep",
  key:"Before a capture or check, ask: what happens after their best answer?",
  body:`<p>Under 1000, games are won by spotting free pieces. Above it, opponents stop hanging things outright. Now you win by looking one move further: <b>if I take here, what's left undefended?</b></p>
   <ul><li><b>Remove the defender.</b> If a piece or square is protected by just one enemy piece, capture that defender first.</li><li><b>Forcing moves first.</b> Look at checks, then captures, then threats, in that order. Forcing moves limit their replies, so you can actually calculate.</li><li><b>Count the whole sequence.</b> Add up every capture until the trades stop.</li></ul>
   ${more(["Lichess puzzles: removing the defender","https://lichess.org/training/capturingDefender"],["Lichess puzzles: mate in 2","https://lichess.org/training/mateIn2"])}`,
  hw:"Play 3 games at one level above your usual one in the Play tab.",
  puzzles:[
   {id:"cl1",fen:"5rk1/5ppp/5n2/6B1/7Q/3B4/5PPP/6K1 w - - 0 1",prompt:"Only one black piece defends h7. Get rid of it.",hint:["f6","h7"],accept:["Bxf6"],ok:"The knight was the only guard on h7. Now queen takes h7 is mate, and taking back on f6 with the pawn doesn't stop it.",no:"Find the piece that protects the square next to the king, and capture it."},
   {id:"cl2",fen:"r1b1k2r/pppp1ppp/2n5/2b1p3/2B1P1nq/2N2N2/PPPP1PPP/R1BQR1K1 b kq - 0 1",prompt:"You're Black and your pieces are all aimed at f2. Strike.",hint:["f2"],accept:["Bxf2+"],ok:"Bishop takes f2 with check. The attack on White's king crashes through.",no:"Use a check to start. Which piece can take on f2 with check?"}
  ]},
 {id:"rooks",title:"Rooks love open files",
  key:"Put rooks on files with no pawns. Then aim for the 7th row.",
  body:`<ul><li>A file with no pawns on it is <b>open</b>. A rook there controls the whole file.</li><li>Two rooks on the same open file (doubled) are even stronger.</li><li>A rook on your opponent's second row (your 7th) attacks pawns and traps the king.</li><li>In the endgame, put your rook <b>behind</b> passed pawns, yours or theirs.</li></ul>`,
  hw:"In every game this week, ask once the opening is over: which file is open? Get a rook there first.",
  puzzles:[
   {id:"rk1",exact:true,fen:"r4rk1/pp3ppp/2p5/8/8/2P5/PP3PPP/R4RK1 w - - 0 1",prompt:"Quiet position. Improve your worst pieces: put a rook where it does the most.",hint:["d1","e1"],accept:["Rfe1","Rae1","Rad1","Rfd1"],ok:"Your rook takes an open file before Black's does.",no:"Look for a file with no pawns on it, and put a rook there."},
   {id:"rk2",fen:"6k1/5ppp/8/8/8/8/5PPP/2R1R1K1 w - - 0 1",prompt:"Two rooks, open files, a king behind its pawns. Mate in one.",hint:["c1","e1"],mate:true,ok:"An open file to the back row is a highway for your rooks.",no:"Use an open file to reach the back row."}
  ]},
 {id:"structure",title:"Pawns, kings, and plans",
  key:"Passed pawns must be pushed. In the endgame, the king is a fighting piece.",
  body:`<ul><li><b>Passed pawn</b>: no enemy pawn can stop it. Push it, and support it with pieces.</li><li><b>Outside passed pawn</b>: a passed pawn far from the other pawns pulls the enemy king away, so your king can eat the rest.</li><li><b>Isolated and doubled pawns</b> are weak because no pawn can protect them. Aim your pieces at them.</li><li><b>Endgame king</b>: once the queens are off, bring your king to the center. It's worth about a rook.</li><li><b>Plan when nothing is happening</b>: improve your worst piece, then attack where you have more pawns or space.</li></ul>`,
  hw:"In your next 3 games, when queens come off, march your king toward the center right away.",
  puzzles:[{id:"dr-pass",fen:"8/5k2/8/1p6/1P6/8/6PP/6K1 w - - 0 1",prompt:"Drill: you have two kingside pawns against none. Make a queen within 40 moves.",drill:{type:"promote",max:40},hint:[]}]},
 {id:"lucena",title:"Rook endgames: the Lucena bridge",
  key:"Check the king away, then build a bridge with your rook on the 4th row.",
  body:`<p>Rook endgames are the most common endgame there is. This is the winning method every strong player knows:</p>
   <ol class="steps"><li>Your king is in front of your pawn, which is one step from promoting. Black's rook keeps checking your king from the side.</li><li><b>Check the enemy king</b> with your rook so it moves one more file away.</li><li><b>Move your rook to the 4th row</b> (the "bridge").</li><li>Step your king out. When the checks come, walk toward your rook and block a check with it.</li><li>Then the pawn promotes.</li></ol>`,
  hw:"Do this drill until you can promote 3 times in a row.",
  puzzles:[{id:"dr-luc",fen:"1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1",prompt:"Drill: the Lucena position. Promote your pawn and keep the new queen. 30 moves.",drill:{type:"promote",max:30},hint:["c1"]}]},
 {id:"ladder",title:"Drill: two-rook ladder mate",
  key:"One rook cuts off the king, the other checks it one row further. Climb.",
  body:`<p>The fastest way to finish a game when you have two rooks or a rook and a queen. Keep the rooks far from the king so it can't attack them.</p>`,
  hw:"Repeat until you can mate in under 10 moves.",
  puzzles:[{id:"dr-lad",fen:"8/8/8/3k4/8/8/R7/1R4K1 w - - 0 1",prompt:"Drill: mate with two rooks within 12 moves.",drill:{type:"mate",max:12},hint:[]}]}
]},
{name:"Final exam",lessons:[
 {id:"exam",title:"Final exam",review:true,
  key:"Everything mixed. Solve 10 without hints.",
  body:`<p>When you can clear this without mistakes on two different days, you have the skills a 1000 player needs. Then it's about doing them every move in real games.</p>`,
  hw:"Clear the exam twice, then play 10 rated games following your session rules.",
  refs:["saf1","def3","tr1","fk1","pn3","dc2","sk1","br2","qm2","kp1"]}
]}
];
window.RESOURCES=[
 {t:"Chess.com Lessons",u:"https://www.chess.com/lessons",d:"Structured video lessons. Start with the Beginner and Tactics tracks."},
 {t:"Chess.com Puzzles",u:"https://www.chess.com/puzzles",d:"Rated puzzles that adapt to you. Ten a day is plenty."},
 {t:"Lichess Practice",u:"https://lichess.org/practice",d:"Free interactive drills on checkmates, tactics, and endgames."},
 {t:"Lichess Puzzle Themes",u:"https://lichess.org/training/themes",d:"Puzzles sorted by theme, so you can drill only forks, only pins, and so on."},
 {t:"Lichess Coordinate Trainer",u:"https://lichess.org/training/coordinate",d:"Learn the square names fast. It helps you read lessons and game reviews."},
 {t:"Chess.com: Best openings for beginners",u:"https://www.chess.com/article/view/the-best-chess-openings-for-beginners",d:"Chess.com's own guide to beginner openings, including the Italian."}
];
})();
