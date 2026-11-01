(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pc=id=>`<svg viewBox="0 0 40 40"><use href="#${id}"/></svg>`;
const norm=s=>String(s).replace(/[+#]/g,"");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const addDays=(k,n)=>{const [y,m,d]=k.split("-").map(Number);return dayKey(new Date(y,m-1,d+n))};
const INTERVALS=[0,1,3,7,14,30,60];
const PIECE_VAL={p:1,n:3,b:3,r:5,q:9,k:0};

/* ---------------- content index ---------------- */
const UNITS=window.UNITS, LESSONS=UNITS.flatMap((u,ui)=>u.lessons.map(l=>(l.unit=ui,l)));
const PZ={};LESSONS.forEach(l=>(l.puzzles||[]).forEach(p=>{PZ[p.id]=p;p.lesson=l.id}));
LESSONS.forEach(l=>{if(l.refs)l.puzzles=l.refs.map(r=>Object.assign({},PZ[r],{id:l.id+"~"+r,ref:r,prompt:"Find the best move.",hint:PZ[r].hint}))});
const TACTIC_IDS=Object.keys(PZ).filter(k=>!PZ[k].drill);
const OPEN=window.OPENINGS.map(o=>{const toks=[];o.moves.replace(/([^\s{}]+)|\{([^}]*)\}/g,(m,mv,note)=>{if(mv)toks.push({san:mv,note:""});else if(toks.length)toks[toks.length-1].note=note.trim();return""});return Object.assign(o,{seq:toks})});
const OP={};OPEN.forEach(o=>{OP[o.id]=o;o.notes=(window.OPENING_NOTES||{})[o.id]||null});

/* ---------------- storage ---------------- */
const LS="bbchess-v2";
window.addEventListener("storage",e=>{if(e.key===LS&&!SESS){try{const s=JSON.parse(e.newValue);if(s&&s.v===2&&(s.updated||0)>(Store.d.updated||0)){Store.d=Object.assign(blank(),s);rerender()}}catch(_){}}});
const blank=()=>({v:2,updated:0,current:LESSONS[0].id,solved:{},failed:{},checks:{},srs:{},lines:{},days:{},rush:{best:0,runs:0},level:3,coach:true,rating:775,peak:974,games:[],lastLine:null});
const Store={d:blank(),ref:null,saving:null,dirty:false,
 async init(){
  try{const s=JSON.parse(localStorage.getItem(LS)||"null");if(s&&s.v===2)this.d=Object.assign(blank(),s)}catch(e){}
  try{const old=JSON.parse(localStorage.getItem("bbchess-v1")||"null");if(old&&old.solved&&!this.d.updated){Object.assign(this.d.solved,old.solved);Object.assign(this.d.checks,old.checks||{})}}catch(e){}
  if(!this.d.updated&&window.CHESS_SEED){this.d=Object.assign(blank(),window.CHESS_SEED);this.local()}
  this.connect();
 },
 async connect(){
  // Sign-in and sync are shared with the rest of the practice site (same Google account as Padayon).
  if(!window.Cloud){sync("Saved in this browser");return}
  Cloud.on(c=>{
   if(!c.user){this.signed=false;sync(c.available?"Saved in this browser":"Saved in this browser");return}
   this.signed=true;
   if(c.data){
    const remote=c.get("chess");
    if(remote&&(remote.updated||0)>(this.d.updated||0)){this.d=Object.assign(blank(),remote);this.local();if(!SESS&&!(Game&&!Game.over))rerender()}
    else if((this.d.updated||0)>((remote&&remote.updated)||0))this.push();
   }
   sync("Synced to your account");
  });
 },
 local(){try{localStorage.setItem(LS,JSON.stringify(this.d))}catch(e){}},
 save(){this.d.updated=Date.now();this.local();this.dirty=true;clearTimeout(this.t);this.t=setTimeout(()=>this.push(),1500)},
 async push(){
  if(!this.signed||!window.Cloud)return;if(this.saving){this.again=true;return}
  this.saving=true;this.dirty=false;
  const d=Object.assign({},this.d);d.games=d.games.slice(-40);await Cloud.save("chess",d);
  this.saving=false;if(this.again){this.again=false;this.push()}
 }};
function sync(t){const s=$("#sync");if(s)s.textContent=t}
const D=()=>Store.d;
function today(){const k=dayKey();if(!D().days[k])D().days[k]={warm:0,warmDone:false,opening:false,game:false};return D().days[k]}
function streak(){let n=0,k=dayKey();const ok=d=>d&&(d.session||(d.warmDone&&(d.opening||d.game)));if(!ok(D().days[k]))k=addDays(k,-1);while(ok(D().days[k])){n++;k=addDays(k,-1)}return n}

/* SRS */
function srsGrade(id,good){const r=D().srs[id]||{box:0,due:dayKey()};if(good){r.box=Math.min(r.box+1,INTERVALS.length-1)}else r.box=0;r.due=addDays(dayKey(),good?INTERVALS[r.box]:0);r.seen=(r.seen||0)+1;D().srs[id]=r}
function lineGrade(id,perfect){const r=D().lines[id]||{box:0,due:dayKey(),reps:0};r.reps++;r.box=perfect?Math.min(r.box+1,INTERVALS.length-1):0;r.due=addDays(dayKey(),perfect?Math.max(1,INTERVALS[r.box]):1);r.last=dayKey();D().lines[id]=r}

/* ---------------- engine ---------------- */
const Engine={w:null,q:Promise.resolve(),cb:null,ok:true,
 src:"https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.asm.js",
 start(){if(this.w||!this.ok)return;try{const u=URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(this.src)});`],{type:"text/javascript"}));
  this.w=new Worker(u);this.w.onmessage=e=>{const l=String(e.data);if(this.cb)this.cb(l)};
  this.w.onerror=()=>{this.ok=false;if(this.cb)this.cb("bestmove (none)")};this.w.postMessage("uci");this.w.postMessage("isready")}catch(e){this.ok=false}},
 search(fen,{depth=10,multipv=1,skill=20}={}){
  this.start();
  const job=()=>new Promise(res=>{
   if(!this.ok||!this.w)return res(null);
   const lines={};let done=false;
   const timer=setTimeout(()=>{if(!done){this.w.postMessage("stop")}},12000);
   this.cb=l=>{
    if(l.startsWith("info")&&l.includes(" pv ")){const mp=l.match(/multipv (\d+)/);
      const sm=l.match(/score (cp|mate) (-?\d+)/),pv=l.match(/ pv (.+)$/);if(sm&&pv){const k=mp?+mp[1]:1;lines[k]={kind:sm[1],v:+sm[2],pv:pv[1].split(" ")}}}
    else if(l.startsWith("bestmove")){done=true;clearTimeout(timer);this.cb=null;const best=l.split(" ")[1];
      const arr=Object.keys(lines).sort((a,b)=>a-b).map(k=>lines[k]);res({best:best&&best!=="(none)"?best:null,lines:arr})}
   };
   const w=this.w;w.postMessage("setoption name Skill Level value "+skill);w.postMessage("setoption name MultiPV value "+multipv);w.postMessage("position fen "+fen);w.postMessage("go depth "+depth);
  });
  const p=this.q.then(job,job);this.q=p.catch(()=>{});return p;
 }};
const cpOf=l=>!l?0:l.kind==="mate"?(l.v>0?10000-l.v*10:-10000-l.v*10):l.v;
const uciToMove=(g,u)=>u?g.moves({verbose:true}).find(m=>m.from===u.slice(0,2)&&m.to===u.slice(2,4)&&(!m.promotion||m.promotion===(u[4]||"q"))):null;

const LEVELS=[
 {n:1,label:"Rookie",elo:"≈400",depth:1,skill:0,rand:.5,top:8},
 {n:2,label:"Beginner",elo:"≈600",depth:2,skill:0,rand:.3,top:5},
 {n:3,label:"Casual",elo:"≈800",depth:3,skill:1,rand:.17,top:4},
 {n:4,label:"Club",elo:"≈1000",depth:5,skill:4,rand:.09,top:3},
 {n:5,label:"Strong club",elo:"≈1200",depth:7,skill:8,rand:.05,top:3},
 {n:6,label:"Tournament",elo:"≈1500",depth:10,skill:13,rand:.02,top:2},
 {n:7,label:"Expert",elo:"≈1800",depth:12,skill:18,rand:0,top:1}];
async function botMove(g,lvl){
 const L=LEVELS[lvl-1];
 const r=await Engine.search(g.fen(),{depth:L.depth,multipv:L.top,skill:L.skill});
 const legal=g.moves({verbose:true});
 if(!r||!r.best)return legal[Math.floor(Math.random()*legal.length)];
 if(Math.random()<L.rand&&r.lines.length>1){const pick=r.lines[1+Math.floor(Math.random()*(r.lines.length-1))];const m=uciToMove(g,pick.pv[0]);if(m)return m}
 return uciToMove(g,r.best)||legal[0];
}

/* ---------------- board ---------------- */
const ANN_COL={good:"var(--good)",bad:"var(--bad)",warn:"var(--warn)",acc:"#3b7dd8",mine:"var(--fg)"};
let LABELS=true;
class Board{
 constructor(el,o={}){this.el=el;el.classList.add("board");el.innerHTML='<div class="squares"></div><div class="pieces"></div><svg class="ann" viewBox="0 0 800 800" aria-hidden="true"></svg>';
  this.sqEl=el.children[0];this.pcEl=el.children[1];this.annEl=el.children[2];el._board=this;this.o=o;this.g=new Chess();this.flip=false;this.sel=null;this.marks={};this.last=null;this.els={};this.down=null;this.ann={};this.peekAnn=null;
  this.sqEl.addEventListener("pointerdown",e=>{const s=e.target.closest(".sq");if(s)this.press(s.dataset.s)});
  this.sqEl.addEventListener("pointerup",e=>{const t=document.elementFromPoint(e.clientX,e.clientY);const s=t&&t.closest&&t.closest(".sq");if(s&&this.down&&s.dataset.s!==this.down)this.release(s.dataset.s);this.down=null});
  this.sqEl.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){const s=e.target.closest(".sq");if(s){e.preventDefault();this.press(s.dataset.s)}}});
 }
 set(g,{flip,last=null}={}){this.g=g;if(flip!==undefined)this.flip=flip;this.sel=null;this.marks={};this.last=last;this.ann={};this.peekAnn=null;this.drawSquares();this.drawPieces()}
 name(r,c){return"abcdefgh"[c]+(8-r)}
 pos(s){let c="abcdefgh".indexOf(s[0]),r=8-+s[1];if(this.flip){c=7-c;r=7-r}return[c,r]}
 mark(map){this.marks=map||{};this.drawSquares()}
 // ann: {arrows:[{from,to,c}], rings:[{sq,c}], fills:[{sq,c}]}
 annotate(a){this.ann=a||{};this.drawAnn()}
 peek(a){this.peekAnn=a;this.drawAnn()}
 unpeek(){this.peekAnn=null;this.drawAnn()}
 drawAnn(){
  const parts=[],ctr=s=>{const[c,r]=this.pos(s);return[c*100+50,r*100+50]};
  const draw=(a,peek)=>{if(!a)return;
   (a.fills||[]).forEach(f=>{const[c,r]=this.pos(f.sq);parts.push(`<rect x="${c*100}" y="${r*100}" width="100" height="100" fill="${ANN_COL[f.c]||f.c}" opacity="${peek?.55:.4}"/>`)});
   (a.rings||[]).forEach(f=>{const[x,y]=ctr(f.sq);parts.push(`<circle cx="${x}" cy="${y}" r="43" fill="none" stroke="${ANN_COL[f.c]||f.c}" stroke-width="8" opacity=".9"/>`)});
   (a.arrows||[]).forEach(f=>{if(!f.from||!f.to||f.from===f.to)return;const[x1,y1]=ctr(f.from),[x2,y2]=ctr(f.to);const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
    const hx=x2-ux*10,hy=y2-uy*10,bx=hx-ux*38,by=hy-uy*38,px=-uy,py=ux,col=ANN_COL[f.c]||f.c;
    parts.push(`<g opacity="${f.dim?.45:.82}"><line x1="${x1+ux*18}" y1="${y1+uy*18}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="17" stroke-linecap="round"/><polygon points="${hx},${hy} ${bx+px*26},${by+py*26} ${bx-px*26},${by-py*26}" fill="${col}"/></g>`)});
  };
  draw(this.ann,false);draw(this.peekAnn,true);this.annEl.innerHTML=parts.join("");
 }
 drawSquares(){
  const g=this.g,tg=this.sel?g.moves({square:this.sel,verbose:true}):[];let ck=null;
  if(g.in_check()){const b=g.board();for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p&&p.type==="k"&&p.color===g.turn())ck=this.name(r,c)}}
  const labels=LABELS&&!this.o.noLabels;let h="";
  for(let rr=0;rr<8;rr++)for(let cc=0;cc<8;cc++){
   const r=this.flip?7-rr:rr,c=this.flip?7-cc:cc,s=this.name(r,c),p=g.get(s);const cl=["sq",(r+c)%2?"d":"l"];
   if(this.last&&(this.last.from===s||this.last.to===s))cl.push("last");
   if(this.marks[s])cl.push(this.marks[s]);
   if(this.sel===s)cl.push("sel");if(ck===s)cl.push("check");
   const t=tg.find(m=>m.to===s);if(t){cl.push("tgt");if(t.captured)cl.push("cap")}
   const lab=s+(p?` ${p.color==="w"?"white":"black"} ${{k:"king",q:"queen",r:"rook",b:"bishop",n:"knight",p:"pawn"}[p.type]}`:"");
   const inner=labels?`<span class="sl">${s}</span>`:this.o.noLabels?"":`${rr===7?`<span class="cf">${"abcdefgh"[c]}</span>`:""}${cc===0?`<span class="cr">${8-r}</span>`:""}`;
   h+=`<button class="${cl.join(" ")}" data-s="${s}" aria-label="${lab}">${inner}</button>`;
  }
  this.sqEl.innerHTML=h;
 }
 place(el,s){const[c,r]=this.pos(s);el.style.transform=`translate(${c*100}%,${r*100}%)`}
 drawPieces(){this.pcEl.innerHTML="";this.els={};this.g.board().forEach((row,r)=>row.forEach((p,c)=>{if(!p)return;const s=this.name(r,c),el=document.createElement("div");el.className="piece";el.innerHTML=pc(p.color+p.type);this.place(el,s);this.pcEl.appendChild(el);this.els[s]=el}));this.drawAnn()}
 redraw(){this.drawSquares();this.drawPieces()}
 animate(m){
  const E=this.els,cap=m.captured?(m.flags.includes("e")?m.to[0]+m.from[1]:m.to):null;
  if(cap&&E[cap]){const x=E[cap];x.classList.add("gone");setTimeout(()=>x.remove(),220);delete E[cap]}
  const el=E[m.from];if(!el){this.drawPieces();return}delete E[m.from];this.place(el,m.to);E[m.to]=el;
  if(m.promotion)el.innerHTML=pc(m.color+m.promotion);
  if(m.flags.includes("k")||m.flags.includes("q")){const rk=m.color==="w"?"1":"8",[f,t]=m.flags.includes("k")?["h"+rk,"f"+rk]:["a"+rk,"d"+rk];const re=E[f];if(re){delete E[f];this.place(re,t);E[t]=re}}
 }
 applied(m){this.last=m;this.sel=null;this.marks={};this.ann={};this.peekAnn=null;this.animate(m);this.drawSquares();this.drawAnn()}
 undone(){this.last=null;this.sel=null;this.ann={};this.drawSquares();this.drawPieces()}
 press(s){
  if(this.o.onSquare){this.o.onSquare(s);return}
  if(this.o.canMove&&!this.o.canMove())return;
  const g=this.g,p=g.get(s);
  if(this.sel&&this.sel!==s){const m=g.moves({square:this.sel,verbose:true}).find(x=>x.to===s);if(m){const from=this.sel;this.sel=null;this.o.onMove&&this.o.onMove({from,to:s,promotion:"q"});return}}
  if(p&&p.color===g.turn()){this.sel=s;this.down=s}else this.sel=null;
  this.drawSquares();
 }
 release(s){if(this.o.onSquare||!this.sel)return;const m=this.g.moves({square:this.sel,verbose:true}).find(x=>x.to===s);if(m){const from=this.sel;this.sel=null;this.o.onMove&&this.o.onMove({from,to:s,promotion:"q"})}}
 shake(){this.el.classList.add("shake");setTimeout(()=>this.el.classList.remove("shake"),400)}
}
function fbHTML(kind,title,html){const ic={ok:"✓",no:"✕",go:"→",warn:"!"}[kind]||"i";return`<span class="ic" aria-hidden="true">${ic}</span><div>${title?`<b>${title}</b>`:""}${html||""}</div>`}
function setFb(el,kind,title,html){el.className="fb "+(kind||"");el.innerHTML=fbHTML(kind,title,html)}
function gameFrom(p){let g,last=null;if(p.moves){g=new Chess();p.moves.split(" ").forEach(m=>{last=g.move(m)})}else g=new Chess(p.fen);return{g,last}}

const times=n=>n===1?"once":n===2?"twice":`${n} times`;
// Looks at the opponent's best reply after your move and explains what it wins, in plain words.
function lossReason(fenAfter,pv,me){
 const g=new Chess(fenAfter);const line=lineFrom(fenAfter,pv,1);const mv=line[0];if(!mv)return null;g.move(mv.san);
 const PV={p:1,n:3,b:3,r:5,q:9,k:100};
 if(mv.captured&&PV[mv.captured]>=3)return{mv,sq:mv.to,text:`they can answer ${moveChipHTML(mv)} (orange arrow) and take your ${PWORD[mv.captured]}.`};
 const L=loosePieces(g,me).filter(x=>PV[x.type]>=3).sort((a,b)=>PV[b.type]-PV[a.type]);
 if(L.length){const x=L[0];const why=x.d===0?"and nothing protects it":x.a>x.d?`${times(x.a)} and protected only ${times(x.d)}`:"by a cheaper piece";
  return{mv,sq:x.sq,text:`they can answer ${moveChipHTML(mv)} (orange arrow). Then your ${PWORD[x.type]} on ${x.sq} (red circle) is attacked ${why}, so you'd lose it.`}}
 if(mv.captured)return{mv,sq:mv.to,text:`they can answer ${moveChipHTML(mv)} (orange arrow) and take your pawn.`};
 return{mv,sq:null,text:`their best answer is ${moveChipHTML(mv)} (orange arrow).`};
}
/* ---------------- square & move chips ---------------- */
// Turns square names (e5) and moves (Qg5, Nxd4, O-O) inside text into chips with piece pictures.
// Hovering or tapping a chip lights up that spot on the linked board.
const PWORD={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const REF_RE=/(?<![A-Za-z0-9])(?:\.\.\.|…)?(O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8](?:=[QRBN])?[+#]?)(?![A-Za-z0-9])/g;
function resolveSan(tok,fens){
 const clean=norm(tok);
 for(const f of fens||[]){if(!f)continue;const parts=f.split(" ");
  for(const t of [parts[1],parts[1]==="w"?"b":"w"]){const g=new Chess();const ff=[parts[0],t,parts[2],t===parts[1]?parts[3]:"-",parts[4],parts[5]].join(" ");if(!g.load(ff))continue;
   const m=g.moves({verbose:true}).find(x=>norm(x.san)===clean);if(m)return m}}
 return null;
}
function moveChipHTML(m,extraClass=""){
 const castle=m.flags&&(m.flags.includes("k")||m.flags.includes("q"));
 const words=castle?`${m.color==="w"?"White":"Black"} castles`:`${m.color==="w"?"White":"Black"} ${PWORD[m.piece]} ${m.captured?"takes the "+PWORD[m.captured]+" on":"to"} ${m.to}${m.san.includes("#")?", checkmate":m.san.includes("+")?", check":""}`;
 const body=castle?`${pc(m.color+"k")}<span>castles</span>`:`${pc(m.color+(m.promotion||m.piece))}<span>${m.captured?"×":""}${m.to}</span>${m.san.includes("#")?"<em>mate</em>":m.san.includes("+")?"<em>+</em>":""}`;
 return `<span class="ref mv ${extraClass}" tabindex="0" data-from="${m.from}" data-to="${m.to}" title="${esc(words)}" aria-label="${esc(words)}">${body}</span>`;
}
function chipify(root,ctx){
 if(!root)return;const fens=typeof ctx.fens==="function"?ctx.fens():(ctx.fens||[]);
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest("button,a,.ref,svg,script,style,.nochip")?NodeFilter.FILTER_REJECT:REF_RE.test(n.nodeValue)?(REF_RE.lastIndex=0,NodeFilter.FILTER_ACCEPT):NodeFilter.FILTER_SKIP});
 const nodes=[];while(walk.nextNode())nodes.push(walk.currentNode);
 nodes.forEach(n=>{const txt=n.nodeValue;let html="",last=0;REF_RE.lastIndex=0;let mm;
  while((mm=REF_RE.exec(txt))){const tok=mm[1];html+=esc(txt.slice(last,mm.index));last=mm.index+mm[0].length;
   const isMove=/^[KQRBNO]|x|=/.test(tok);
   if(isMove){const m=resolveSan(tok,fens);
    if(m)html+=moveChipHTML(m);
    else{const to=(tok.match(/[a-h][1-8]/g)||[]).pop();const pl=/^[KQRBN]/.test(tok)?tok[0].toLowerCase():tok.startsWith("O")?"k":"p";
     html+=`<span class="ref mv" tabindex="0" data-to="${to||""}" title="${esc(PWORD[pl]+(to?" to "+to:""))}">${pc((ctx.color||"w")+pl)}<span>${tok.startsWith("O")?"castles":(tok.includes("x")?"×":"")+(to||"")}</span></span>`}}
   else html+=`<span class="ref sq" tabindex="0" data-sq="${tok.slice(0,2)}" title="Square ${tok.slice(0,2)}">${tok.slice(0,2)}</span>${esc(tok.slice(2))}`;
  }
  html+=esc(txt.slice(last));const span=document.createElement("span");span.innerHTML=html;n.replaceWith(...span.childNodes)});
 if(root._chipBound)return;root._chipBound=true;
 const annFor=el=>el.classList.contains("sq")?{fills:[{sq:el.dataset.sq,c:"acc"}],rings:[{sq:el.dataset.sq,c:"acc"}]}:el.dataset.from?{arrows:[{from:el.dataset.from,to:el.dataset.to,c:"acc"}]}:{fills:[{sq:el.dataset.to,c:"acc"}]};
 const bd=()=>root._chipCtx&&root._chipCtx.board&&root._chipCtx.board();
 root.addEventListener("mouseover",e=>{const r=e.target.closest(".ref");const b=bd();if(r&&b)b.peek(annFor(r))});
 root.addEventListener("mouseout",e=>{const r=e.target.closest(".ref");const b=bd();if(r&&b&&!r.classList.contains("pinned"))b.unpeek()});
 root.addEventListener("focusin",e=>{const r=e.target.closest(".ref");const b=bd();if(r&&b)b.peek(annFor(r))});
 root.addEventListener("focusout",e=>{const r=e.target.closest(".ref");const b=bd();if(r&&b)b.unpeek()});
 root.addEventListener("click",e=>{const r=e.target.closest(".ref");const b=bd();if(!r||!b)return;const was=r.classList.contains("pinned");$$(".ref.pinned").forEach(x=>x.classList.remove("pinned"));
  if(was)b.unpeek();else{r.classList.add("pinned");b.peek(annFor(r));if(window.innerWidth<1080)b.el.scrollIntoView({behavior:"smooth",block:"center"})}});
}
function linkChips(root,ctx){if(!root)return;root._chipCtx=ctx;chipify(root,ctx)}

/* ---------------- puzzle runner ---------------- */
// opts: {onResult(id, correct, firstTry), next:{label,fn}}
function moveFace(m){const castle=m.flags&&(m.flags.includes("k")||m.flags.includes("q"));
 return castle?`${pc(m.color+"k")}<span>castles</span>`:`${pc(m.color+(m.promotion||m.piece))}<span>${m.captured?"×":""}${m.to}</span>${m.san.includes("#")?"<em>mate</em>":m.san.includes("+")?"<em>+</em>":""}`}
function runPuzzle(host,p,opts={}){
 if(p.drill&&p.drill.type==="coords")return runCoords(host,p,opts);
 host.innerHTML=`<div class="ptop"><div class="pdots"></div><div class="side"></div></div>
  <p class="prompt"></p><div class="bd"></div><div class="thinking"></div><div class="fb"></div>
  <div class="acts"><button class="btn sm hintb">Hint</button><button class="btn sm retry">Try again</button><button class="btn sm showb">Show me</button><button class="btn sm askc coachonly">Ask the coach</button><button class="btn sm primary grow nextb" hidden></button></div>`;
 if(opts.dots)opts.dots($(".pdots",host));
 const fb=$(".fb",host),think=$(".thinking",host);let S;
 $(".askc",host).onclick=()=>openCoach();
 const board=new Board($(".bd",host),{canMove:()=>S&&!S.over&&!S.busy&&S.g.turn()===S.me,onMove:mv=>play(mv)});
 const ctx={board:()=>board,fens:()=>[S.g.fen(),S.start],color:"w"};
 const fbSet=(k,t,h)=>{setFb(fb,k,t,h);ctx.color=S.me;linkChips(fb,ctx)};
 let tries=0;
 function start(){
  const{g,last}=gameFrom(p);S={g,me:g.turn(),step:0,over:false,busy:false,moves:0,start:g.fen(),ref:S&&S.start===g.fen()?S.ref:undefined};
  $(".side",host).innerHTML=`<i class="${S.me}"></i>You play ${S.me==="w"?"White":"Black"}`;
  const pr=$(".prompt",host);pr.textContent=opts.mode==="blind"||opts.mode==="timed"?`Find the best move for ${S.me==="w"?"White":"Black"}.`:p.prompt;ctx.color=S.me;linkChips(pr,ctx);
  S.hinted=false;S.t0=Date.now();clearInterval(S.tick);
  board.set(g,{flip:S.me==="b",last});
  const ans=p.line?p.line[0]:p.accept&&p.accept[0];
  setCoach(()=>({key:"pz:"+(p.ref||p.id),title:p.drill?"Drill: "+p.prompt:"Puzzle: "+p.prompt,board:()=>board,fen:S.g.fen(),me:S.me,puzzle:!S.over&&!p.drill,
   extra:`${p.drill?"This is an endgame drill against the engine.":`Puzzle task: ${p.prompt}${ans?` (Answer, keep secret unless asked: ${ans}.)`:""}`}`,history:[],
   quick:p.drill?["How do I make progress here?","What's the technique for this endgame?"]:["Give me a hint","What are they threatening?","Show me the answer and explain it"]}));
  $(".nextb",host).hidden=true;think.textContent=p.drill?`Moves left: ${p.drill.max}`:"";
  $(".hintb",host).hidden=!(p.hint&&p.hint.length);$(".showb",host).hidden=!!p.drill;
  fbSet("",null,p.drill?"The computer defends. Click a piece, then its square, or drag it.":(last?"Yellow shows the move your opponent just made.":"Click a piece, then click where it goes. Dragging works too."));
  if(opts.mode==="guided"&&p.hint&&p.hint.length){board.annotate({rings:p.hint.map(q=>({sq:q,c:"acc"}))});fbSet("go","New puzzle, with a hint","Look at the circled squares. "+(last?"Yellow shows your opponent's last move.":""))}
  if(opts.timer){const tk=()=>{if(!document.contains(host)||S.over){clearInterval(S.tick);return}const left=Math.max(0,opts.timer-Math.floor((Date.now()-S.t0)/1000));think.textContent=left?`${left}s for full XP`:"Over 30s: still solve it";};tk();S.tick=setInterval(tk,500)}
 }
 $(".hintb",host).onclick=()=>{S.hinted=true;board.annotate({rings:(p.hint||[]).map(s=>({sq:s,c:"acc"}))});fbSet("",null,"Look at the circled squares.")};
 $(".retry",host).onclick=()=>{start()};
 $(".showb",host).onclick=()=>{start();S.hinted=true;S.shown=true;const g=S.g;let mv;const san=p.line?p.line[0]:(p.accept&&p.accept[0]);
  if(san)mv=g.moves({verbose:true}).find(m=>norm(m.san)===norm(san));
  if(!mv&&p.mate)mv=g.moves({verbose:true}).find(m=>{g.move(m);const x=g.in_checkmate();g.undo();return x});
  if(!mv&&p.anyBut)mv=g.moves({verbose:true}).find(m=>!p.anyBut.map(norm).includes(norm(m.san)));
  if(mv){board.annotate({arrows:[{from:mv.from,to:mv.to,c:"good"}]});fbSet("go","Here's a good move","Follow the green arrow. Play it to see the explanation.")}
  tries++;};
 function finish(ok,title,msg){S.over=true;if(ok&&S.shown){title="That's the answer";msg=msg+" Since you looked at the answer, it will come back for another try."}fbSet(ok?"ok":"no",title,msg);if(!ok)board.shake();
  clearInterval(S.tick);if(opts.onResult)opts.onResult(p.ref||p.id,ok&&!S.shown,tries===0,S.hinted,opts.timer?(Date.now()-S.t0)/1000>opts.timer:false);tries++;
  const nb=$(".nextb",host);if(ok&&opts.next){nb.hidden=false;nb.textContent=opts.next.label;nb.onclick=opts.next.fn}else if(!ok&&opts.next&&opts.skip){nb.hidden=false;nb.textContent="Skip →";nb.onclick=opts.next.fn}}
 // A move that isn't on the answer list: let the engine judge it instead of assuming it's wrong.
 async function judge(res){
  const g=S.g;S.busy=true;think.textContent="Checking your move…";
  if(S.ref===undefined){const r0=await Engine.search(S.start,{depth:12});S.ref=r0&&r0.lines[0]?cpOf(r0.lines[0]):null}
  const r1=await Engine.search(g.fen(),{depth:12});S.busy=false;think.textContent="";
  if(!document.contains(board.el))return;
  const after=r1&&r1.lines[0]?-cpOf(r1.lines[0]):null;
  if(S.ref!=null&&after!=null&&S.ref-after<120){
   const alt=(p.accept||[])[0],am=alt&&resolveSan(alt,[S.start]);
   return finish(true,"That works too",`Your move keeps everything safe.${am?` Another strong option was ${moveChipHTML(am)}.`:""} ${p.ok}`)}
  const loss=S.ref!=null&&after!=null?S.ref-after:0;
  const lr=r1&&r1.lines[0]?lossReason(g.fen(),r1.lines[0].pv,S.me):null;
  if(lr)board.annotate({arrows:[{from:lr.mv.from,to:lr.mv.to,c:"warn"}],rings:lr.sq?[{sq:lr.sq,c:"bad"}]:[]});
  const why=lr?`After your move, ${lr.text}${lr.sq?"":` Your position gets about ${(Math.min(loss,999)/100).toFixed(1)} points worse.`}`:(p.no||"");
  finish(false,"Not that one",`${why} Press Try again, or Show me.`);
 }
 async function play(mv){
  const g=S.g,res=g.move(mv);if(!res)return;board.applied(res);
  if(p.drill)return drillStep(res);
  const lastStep=!p.line||S.step>=p.line.length-1;let right;
  if(p.line)right=norm(p.line[S.step])===norm(res.san)||(lastStep&&p.mate&&g.in_checkmate());
  else if(p.mate)right=g.in_checkmate();
  else if(p.anyBut)right=!p.anyBut.map(norm).includes(norm(res.san));
  else right=(p.accept||[]).map(norm).includes(norm(res.san));
  if(!right){const w=p.wrong&&p.wrong[norm(res.san)];if(w)return finish(false,"Not that one",w);
   if(!p.exact&&!p.mate&&!p.line&&!p.anyBut&&Engine.ok)return judge(res);
   return finish(false,"Not that one",p.no)}
  if(p.line&&S.step+1<p.line.length){S.step++;S.busy=true;fbSet("go","Good move","Watch the reply…");await sleep(650);
   const r=g.move(p.line[S.step]);board.applied(r);S.step++;S.busy=false;
   if(S.step>=p.line.length)return finish(true,"Correct",p.ok);
   return fbSet("go","They answered",`They played ${moveChipHTML(r)}. Your move again. Finish it.`)}
  finish(true,"Correct",p.ok);
 }
 async function drillStep(res){
  const g=S.g,d=p.drill;S.moves++;
  if(d.type==="mate"&&g.in_checkmate())return finish(true,"Checkmate!",`Done in ${S.moves} moves. Repeat this drill on another day until it's automatic.`);
  if(g.in_stalemate())return finish(false,"Stalemate","The king had no moves and wasn't in check, so the game is a draw. Leave it a square until your final check.");
  if(g.in_draw())return finish(false,"Draw","That position is a draw. Try again.");
  if(d.type==="promote"&&res.promotion){S.busy=true;think.textContent="Computer is thinking…";const r=await Engine.search(g.fen(),{depth:10});S.busy=false;
   const m=r&&uciToMove(g,r.best);if(m){const x=g.move(m);board.applied(x);if(x.to===res.to)return finish(false,"Queen lost","The new queen was captured right away. Make sure the promotion square is protected or out of reach.")}
   return finish(true,"Promoted!",`New queen, and it's safe. Done in ${S.moves} moves.`)}
  if(S.moves>=d.max)return finish(false,"Out of moves",`You used all ${d.max} moves. Try again, following the steps in the lesson.`);
  S.busy=true;think.textContent="Computer is thinking…";
  const r=await Engine.search(g.fen(),{depth:11});S.busy=false;
  const m=r&&uciToMove(g,r.best);if(!m){return finish(false,"Engine unavailable","The computer couldn't load in this view. Try reloading the page.")}
  const x=g.move(m);board.applied(x);
  think.textContent=`Moves left: ${d.max-S.moves}`;
  if(x.captured&&x.captured!=="p")return finish(false,"Piece lost","The king captured your piece. Keep your pieces protected or far from the enemy king.");
  if(x.captured==="p"&&d.type==="promote"&&!g.board().flat().some(q=>q&&q.type==="p"&&q.color===S.me))return finish(false,"Pawn lost","The king won your last pawn. Keep your king in front of it.");
  if(g.in_draw())return finish(false,"Draw","The position became a draw. Try again.");
 }
 start();
 return {restart:start,board:()=>board,fen:()=>S.g.fen()};
}

// Square-finding drill: names are hidden, click the square shown.
function runCoords(host,p,opts={}){
 const best=D().coords||(D().coords={w:0,b:0});
 host.innerHTML=`<div class="ptop"><div class="pdots"></div><div class="row"><button class="btn sm cw">From White's side</button><button class="btn sm cb">From Black's side</button></div></div>
  <p class="prompt">${opts.count?`Click the square named below. ${opts.count} squares.`:"Click the square named below. Get as many as you can in 30 seconds."}</p>
  <div class="target" aria-live="polite"><span class="tsq">Ready?</span><span class="tinfo">Square names are hidden for this drill.</span></div>
  <div class="bd"></div><div class="fb"></div>
  <div class="acts"><button class="btn primary go">Start</button><button class="btn sm primary grow nextb" hidden></button></div>`;
 if(opts.dots)opts.dots($(".pdots",host));
 let side="w",running=false,score=0,miss=0,target=null,end=0,timer=null;
 const board=new Board($(".bd",host),{noLabels:true,onSquare:s=>hit(s)});board.set(new Chess(),{flip:false});
 const fb=$(".fb",host);
 const sideUI=()=>{$(".cw",host).classList.toggle("primary",side==="w");$(".cb",host).classList.toggle("primary",side==="b");setFb(fb,"",null,`Best from ${side==="w"?"White":"Black"}'s side: ${best[side]}. Score 10 or more to complete the drill.`)};
 $(".cw",host).onclick=()=>{if(running)return;side="w";board.set(new Chess(),{flip:false});sideUI()};
 $(".cb",host).onclick=()=>{if(running)return;side="b";board.set(new Chess(),{flip:true});sideUI()};
 const info=()=>{$(".tinfo",host).textContent=running?(opts.count?`${score+miss} of ${opts.count} · ${score} right`:`${Math.max(0,Math.ceil((end-Date.now())/1000))}s left · ${score} found${miss?` · ${miss} missed`:""}`):"Square names are hidden for this drill."};
 function pick(){let s;do{s="abcdefgh"[Math.random()*8|0]+(1+(Math.random()*8|0))}while(s===target);target=s;$(".tsq",host).textContent=s}
 function hit(s){if(!running)return;if(s===target){score++;board.annotate({fills:[{sq:s,c:"good"}]});if(opts.count&&score+miss>=opts.count)return stop();pick()}else{miss++;board.annotate({fills:[{sq:s,c:"bad"}],rings:[{sq:target,c:"good"}]});if(opts.count&&score+miss>=opts.count)return stop();pick()}info()}
 function stop(){running=false;clearInterval(timer);if(opts.count){$(".go",host).hidden=true;opts.onDone&&opts.onDone(score);return}const rec=score>best[side];if(rec)best[side]=score;Store.save();$(".go",host).hidden=false;$(".go",host).textContent="Go again";
  $(".tsq",host).textContent=`${score}`;info();
  setFb(fb,score>=10?"ok":"go",`${score} squares${rec?", a new best":""}`,`Best from ${side==="w"?"White":"Black"}'s side: ${best[side]}. ${score>=10?"Try the other side next.":"Score 10 or more to complete the drill."}`);
  if(score>=10&&opts.onResult)opts.onResult(p.id,true,true);
  const nb=$(".nextb",host);if(score>=10&&opts.next){nb.hidden=false;nb.textContent=opts.next.label;nb.onclick=opts.next.fn}}
 $(".go",host).onclick=()=>{running=true;score=0;miss=0;end=Date.now()+(opts.count?60000:30000);$(".go",host).hidden=true;board.annotate({});pick();info();
  timer=setInterval(()=>{if(!document.contains(host)){clearInterval(timer);return}info();if(Date.now()>=end)stop()},250)};
 sideUI();
 return {restart:()=>{},board:()=>board,fen:()=>board.g.fen()};
}

/* ---------------- router ---------------- */
const TABS=[["today","Today"],["learn","Learn"],["openings","Openings"],["puzzles","Puzzles"],["play","Play"],["progress","Progress"]];
let route="today",routeArg=null;
function go(r,arg){route=r;routeArg=arg||null;if(location.hash!=="#"+r)history.replaceState(null,"","#"+r);render();window.scrollTo({top:0})}
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(route==="session"&&SESS)return;if(TABS.some(t=>t[0]===h)&&h!==route){route=h;routeArg=null;render()}});
function rerender(){render()}
const BOARDS=new Set();
function renderBar(){
 const lb=$("#lbl");if(lb){lb.textContent=LABELS?"Square names: on":"Square names: off";lb.classList.toggle("on",LABELS);lb.onclick=()=>{LABELS=!LABELS;D().labels=LABELS;Store.save();renderBar();$$(".board").forEach(el=>{const b=el._board;if(b)b.drawSquares()})}}
 $("#tabs").innerHTML=TABS.map(([k,t])=>`<button class="tab${route===k?" on":""}" data-k="${k}">${t}</button>`).join("");
 $$("#tabs .tab").forEach(b=>b.onclick=()=>go(b.dataset.k));
 const n=streak();$("#streak").innerHTML=`<b>${n}</b> day${n===1?"":"s"}`;const xc=$("#xpchip");if(xc)xc.innerHTML=xpChip();
}
function render(){renderBar();setCoach(null);const v=$("#view");v.innerHTML="";({today:vToday,session:vSession,learn:vLearn,openings:vOpenings,puzzles:vPuzzles,play:vPlay,progress:vProgress})[route](v,routeArg)}

/* ---------------- patterns ---------------- */
const PAT={hung:{t:"Hung a piece",tip:"Left something undefended and it got taken.",lesson:"safety"},
 missedTactic:{t:"Missed a tactic",tip:"A capture or fork won material and you didn't play it.",lesson:"forks"},
 allowedMate:{t:"Allowed a mate",tip:"Missed a mating threat against your king.",lesson:"guard"},
 missedMate:{t:"Missed a mate",tip:"You had checkmate and didn't play it.",lesson:"patterns"},
 other:{t:"Other big mistakes",tip:"Position got much worse without dropping material right away.",lesson:"think"}};
function patternTotals(n=20){const t={hung:0,missedTactic:0,allowedMate:0,missedMate:0,other:0};const gs=D().games.filter(g=>g.review).slice(-n);gs.forEach(g=>Object.keys(t).forEach(k=>t[k]+=(g.review.types[k]||0)));return{t,games:gs.length}}
function topPattern(){const{t,games}=patternTotals(10);if(!games)return null;const k=Object.keys(t).sort((a,b)=>t[b]-t[a])[0];return t[k]?{k,n:t[k],games}:null}

/* ---------------- TODAY ---------------- */
function warmupSet(){
 const td=dayKey();const due=Object.entries(D().srs).filter(([id,r])=>PZ[id]&&!PZ[id].drill&&r.due<=td).sort((a,b)=>a[1].box-b[1].box).map(e=>e[0]);
 const curIdx=LESSONS.findIndex(l=>l.id===D().current);
 const unlocked=TACTIC_IDS.filter(id=>{const li=LESSONS.findIndex(l=>l.id===PZ[id].lesson);return li<=Math.max(curIdx,3)});
 const fresh=unlocked.filter(id=>!D().srs[id]);
 const seed=[...td].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7);const rnd=i=>((seed*(i+11)*2654435761)>>>0)%1000;
 const shuffled=a=>a.map((x,i)=>[rnd(i),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
 const set=[...due.slice(0,4)];shuffled(fresh).forEach(id=>{if(set.length<6&&!set.includes(id))set.push(id)});
 shuffled(unlocked).forEach(id=>{if(set.length<6&&!set.includes(id))set.push(id)});
 return set.slice(0,6);
}
function lineOfDay(){const td=dayKey();
 const due=OPEN.filter(o=>D().lines[o.id]&&D().lines[o.id].due<=td).sort((a,b)=>D().lines[a.id].box-D().lines[b.id].box);
 if(due.length)return due[0];const nw=OPEN.find(o=>!D().lines[o.id]);if(nw)return nw;
 return OPEN.slice().sort((a,b)=>D().lines[a.id].due<D().lines[b.id].due?-1:1)[0]}
/* ---------------- progression (Padayon-style) ---------------- */
// Every puzzle is a card with a level (0-6). A daily session mixes due reviews with a few new
// cards. New cards are taught first, then practiced with a hint. As a card levels up the
// exercise gets harder: hint shown, then the plain puzzle, then "find the best move" with no
// topic label, then against a 30-second clock. Misses come back later in the same session.
const LEVEL_NAMES=["New","Seen","Learned","Strong","Strong","Mastered","Mastered"];
const settings=()=>Object.assign({newPer:3,goal:60},D().settings||{});
function addXP(n){const k=dayKey();D().xp=D().xp||{};D().xp[k]=(D().xp[k]||0)+n;Store.save();const x=$("#xpchip");if(x)x.innerHTML=xpChip()}
const xpToday=()=>(D().xp||{})[dayKey()]||0;
function xpChip(){const g=settings().goal,x=xpToday();return`<b>${x}</b>/${g} XP`}
function grade3(id,q){const r=D().srs[id]||{box:0,due:dayKey(),seen:0};
 if(q===2)r.box=Math.min(r.box+1,INTERVALS.length-1);else if(q===0)r.box=Math.max(0,r.box-2);
 r.due=addDays(dayKey(),q===0?1:Math.max(1,INTERVALS[r.box]));r.seen=(r.seen||0)+1;D().srs[id]=r;
 if(q>0)D().solved[id]=true;else D().failed[id]=(D().failed[id]||0)+1}
const unitCards=u=>u.lessons.flatMap(l=>(l.puzzles||[]).filter(p=>!p.drill&&!String(p.id).includes("~")).map(p=>p.id));
const ALL_CARDS=UNITS.flatMap(unitCards);
const learnedOf=ids=>ids.filter(id=>D().srs[id]&&D().srs[id].box>=2).length;
const seenOf=ids=>ids.filter(id=>D().srs[id]).length;
function dueCards(){const td=dayKey();return Object.entries(D().srs).filter(([id,r])=>PZ[id]&&!PZ[id].drill&&r.due<=td).sort((a,b)=>a[1].box-b[1].box||(a[1].due<b[1].due?-1:1)).map(e=>e[0])}
function newLeft(){const nd=D().newDay||{};return nd.d===dayKey()?Math.max(0,settings().newPer-nd.n):settings().newPer}
function pickNewCards(){let order=ALL_CARDS;const f=D().focus;if(f!=null&&UNITS[f])order=unitCards(UNITS[f]).concat(ALL_CARDS);
 const out=[];for(const id of order){if(out.length>=newLeft())break;if(!D().srs[id]&&!out.includes(id))out.push(id)}return out}
function modeFor(box){return box<=1?"plain":box<=3?"blind":"timed"}
function shuffleA(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function buildSession(){
 const q=shuffleA(dueCards().slice(0,12).map(id=>({k:"pz",id,mode:modeFor(D().srs[id].box)})));
 // New cards go in as one block, in course order: each lesson's idea is taught right before its first puzzle.
 const taught=new Set(),block=[];
 for(const id of pickNewCards()){const L=PZ[id].lesson;if(!taught.has(L)){taught.add(L);block.push({k:"teach",lesson:L})}block.push({k:"pz",id,mode:"guided",fresh:true})}
 q.splice(Math.floor(Math.random()*(Math.min(q.length,4)+1)),0,...block);
 if(q.filter(x=>x.k==="pz").length<4){shuffleA(Object.keys(D().srs).filter(id=>PZ[id]&&!PZ[id].drill&&!q.some(x=>x.id===id))).slice(0,4).forEach(id=>q.push({k:"pz",id,mode:modeFor(D().srs[id].box)}))}
 const line=lineOfDay();if(line)q.splice(Math.floor(q.length*.6),0,{k:"line",id:line.id});
 const c=D().coords||{};if((c.w||0)<15||(c.b||0)<15)q.unshift({k:"sq"});
 return q;
}

/* ---- the session screen ---- */
let SESS=null;
function startSession(){SESS={q:buildSession(),i:0,xp:0,right:0,total:0,graded:new Set(),requeued:new Set(),fresh:new Set(),ups:0};go("session")}
window.startSession=()=>{if(!SESS)startSession()}; // lets the Daily Practice home start today's session
function vSession(v){
 if(!SESS){go("today");return}
 if(SESS.i>=SESS.q.length)return sessionSummary(v);
 const it=SESS.q[SESS.i];
 v.innerHTML=`<div class="sess"><div class="sbar"><button class="btn sm" id="squit" aria-label="End session">✕ End</button><div class="sprog"><i style="width:${SESS.i/SESS.q.length*100}%"></i></div><span class="pill acc">+${SESS.xp} XP</span></div>
  <div class="panel" id="sx"></div><div class="sfoot" id="sfoot" hidden></div></div>`;
 $("#squit").onclick=()=>{if(SESS.total>0)sessionSummary(v);else{SESS=null;go("today")}};
 const host=$("#sx"),foot=(k,title,body,btn="Continue")=>{const f=$("#sfoot");f.hidden=false;f.className="sfoot "+k;f.innerHTML=`<div><div class="verdict">${title}</div>${body?`<div class="small">${body}</div>`:""}</div><button class="btn primary" id="scont">${btn}</button>`;$("#scont").onclick=()=>{SESS.i++;vSession(v)};$("#scont").focus({preventScroll:true});f.scrollIntoView({behavior:"smooth",block:"nearest"})};
 if(it.k==="teach"){const L=LESSONS.find(l=>l.id===it.lesson);
  host.innerHTML=`<div class="eyebrow">New idea · ${esc(UNITS[L.unit].name)}</div><h2 class="steach">${esc(L.title)}</h2><p class="key">${L.key}</p><div class="reading tbody">${L.body}</div>`;
  linkChips(host,{board:()=>null,fens:()=>[]});
  SESS.xp+=2;addXP(2);foot("go","Read it, then try it",`Next you'll try a puzzle on this idea, with a hint.`,"Got it");return}
 if(it.k==="sq"){runCoords(host,{id:"dr-coords"},{count:6,onDone:(n)=>{SESS.xp+=n;addXP(n);foot(n>=5?"ok":"go",`${n} of 6 squares`,n>=5?"Nice. Square names make every explanation easier.":"Keep at it. This comes back each session until it's easy.")}});return}
 if(it.k==="line"){const o=OP[it.id];runLine(host,o,{onDone:(perfect,mistakes,learn)=>{const g=perfect?10:learn?6:4;SESS.xp+=g;addXP(g);if(!learn)lineGrade(o.id,perfect);else{lineGrade(o.id,false)}today().opening=true;Store.save();
  foot(perfect||learn?"ok":"go",learn?"New line learned":perfect?"Perfect from memory":`${mistakes} slip${mistakes===1?"":"s"}`,learn?"It'll come back tomorrow, from memory this time.":perfect?"It'll come back in a few days.":"It'll come back tomorrow.")}});return}
 // puzzle card
 const p=PZ[it.id],box=(D().srs[it.id]||{}).box||0;
 const label=it.again?"Try it again":it.mode==="guided"?"New · with a hint":it.mode==="plain"?"Level: "+LEVEL_NAMES[box]:it.mode==="blind"?"No topic given":"Beat the clock";
 runPuzzle(host,p,{mode:it.mode,timer:it.mode==="timed"?30:0,dots:el=>el.innerHTML=`<span class="pill">${label}</span>`,
  onResult:(id,ok,first,hinted,slow)=>{
   if(SESS.graded.has(it.id+":"+SESS.i))return;SESS.graded.add(it.id+":"+SESS.i);
   const q=!ok?0:(hinted&&it.mode!=="guided")||slow||!first?1:2;SESS.total++;
   const was=(D().srs[it.id]||{box:0}).box;
   if(it.fresh){if(!D().srs[it.id]){D().srs[it.id]={box:0,due:dayKey(),seen:0};const nd=D().newDay&&D().newDay.d===dayKey()?D().newDay:{d:dayKey(),n:0};nd.n++;D().newDay=nd}
    const r=D().srs[it.id];if(q>0){r.box=Math.max(r.box,1);r.due=addDays(dayKey(),1);D().solved[it.id]=true}else r.due=dayKey()}
   else if(!SESS.fresh.has(it.id))grade3(it.id,q);
   if(it.fresh)SESS.fresh.add(it.id);
   const now=(D().srs[it.id]||{box:0}).box;if(now>was&&now>=2)SESS.ups++;
   if(q>0){SESS.right++;const g=q===2?10:6;SESS.xp+=g;addXP(g)}
   if(q===0&&!SESS.requeued.has(it.id)){SESS.requeued.add(it.id);SESS.q.splice(Math.min(SESS.q.length,SESS.i+3),0,{k:"pz",id:it.id,mode:"plain",again:true})}
   Store.save();
   foot(q===2?"ok":q===1?"go":"no",q===2?`Correct · +10 XP`:q===1?`Got it · +6 XP`:"Not yet",
    q===2?(now>was?`Level up: ${LEVEL_NAMES[now]}.`:""):q===1?(slow?"Correct, but over the 30 seconds. Speed comes with repetition.":"You used a hint or a second try, so it stays at this level."):"It'll come back later in this session, and again tomorrow.");
  }});
}
function sessionSummary(v){
 const s=SESS;const acc=s.total?Math.round(s.right/s.total*100):0;const t=today();t.session=true;Store.save();renderBar();try{ if (window.parent !== window) window.parent.postMessage({practice:'done', app:'chess'}, location.origin); }catch(e){}
 v.innerHTML=`<div class="sess"><div class="panel summary"><div class="eyebrow">Session done</div><h2 style="font-size:32px">${xpToday()>=settings().goal?"Goal reached. Brick by brick.":"Nice work."}</h2>
  <div class="sumgrid"><div><b>${s.xp}</b><span>XP earned</span></div><div><b>${acc}%</b><span>Correct</span></div><div><b>${s.ups}</b><span>Leveled up</span></div></div>
  <p class="muted">Missed puzzles come back tomorrow. Next on today's plan: a practice game from today's opening.</p>
  <div class="row" style="justify-content:center"><button class="btn primary" id="sg">Play a practice game</button><button class="btn" id="sh">Back to Today</button></div></div></div>`;
 SESS=null;$("#sg").onclick=()=>{const l=lineOfDay();go("play",{opening:l.id,daily:true})};$("#sh").onclick=()=>go("today");
}

// Compact opening-line runner used inside sessions.
function runLine(host,o,opts={}){
 const learn=!D().lines[o.id];let g=new Chess(),ply=0,mistakes=0,done=false;const fin=new Chess();o.seq.forEach(t=>fin.move(t.san));
 host.innerHTML=`<div class="ptop"><div><div class="eyebrow">Opening · ${esc(o.group)}</div><h3 style="margin-top:2px">${esc(o.name)}</h3></div><div class="side"><i class="${o.side}"></i>You play ${o.side==="w"?"White":"Black"}</div></div>
  <p class="prompt">${learn?"New line: follow the green arrows and read why each move is played.":"Play your moves from memory."}</p><div class="bd"></div><div class="note" id="lnote">${learn?"":"Press Hint if you're stuck. It counts as a slip."}</div><div class="acts"><button class="btn sm lh">Hint</button></div>`;
 const board=new Board($(".bd",host),{canMove:()=>!done&&g.turn()===o.side,onMove:mv=>user(mv)});board.set(g,{flip:o.side==="b"});
 const note=html=>{const el=$("#lnote",host);el.innerHTML=html;linkChips(el,{board:()=>board,fens:()=>[g.fen(),fin.fen()],color:o.side})};
 const hint=()=>{if(ply>=o.seq.length)return;const m=g.moves({verbose:true}).find(x=>norm(x.san)===norm(o.seq[ply].san));if(m)board.annotate({arrows:[{from:m.from,to:m.to,c:"good"}]})};
 $(".lh",host).onclick=()=>{if(!learn)mistakes++;hint()};
 const noteFor=i=>{const t=o.seq[i],m=g.history({verbose:true})[i];if(t&&t.note&&m)note(`${moveChipHTML(m,"lead")} <span>${esc(t.note)}</span>`)};
 async function advance(){while(ply<o.seq.length&&g.turn()!==o.side){await sleep(ply===0?250:500);if(!document.contains(board.el))return;board.applied(g.move(o.seq[ply].san));ply++;noteFor(ply-1)}
  if(ply>=o.seq.length){done=true;opts.onDone&&opts.onDone(!learn&&mistakes===0,mistakes,learn);return}if(learn)hint()}
 function user(mv){const r=g.move(mv);if(!r)return;if(norm(r.san)!==norm(o.seq[ply].san)){g.undo();mistakes++;board.undone();board.shake();note(`<span class="nochip">${moveFace(r)}</span> <span>Not the line's move. Try again${learn?"":" or press Hint"}.</span>`);if(learn)hint();return}
  board.applied(r);ply++;noteFor(ply-1);advance()}
 advance();
}

/* ---- Today: the progression home ---- */
function ringSvg(v,goal){const r=36,c=2*Math.PI*r,f=Math.min(1,v/goal);return`<svg class="ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="8"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-f)}" transform="rotate(-90 42 42)"/></svg>`}
function vToday(v){
 const t=today(),st=settings(),xp=xpToday(),due=dueCards().length,nw=pickNewCards().length,line=lineOfDay(),lv=LEVELS[D().level-1];
 const items=[["session","Daily session","Reviews plus new puzzles. Ticks itself when you finish.",!!t.session,true],
  ["game",`Practice game vs ${lv.label}`,"From today's opening line, with an automatic review after. Ticks itself.",!!t.game,true],
  ["real1","One rated 10-minute game on chess.com","Do your move routine every move: their threat, your checks and captures, then the safety check.",!!t.real1,false],
  ["real2","Review that game","Paste it into Play → Review a real chess.com game, or use chess.com's Game Review.",!!t.real2,false]];
 const done=items.filter(x=>x[3]).length;const tp=topPattern();
 const unitRow=(u,i)=>{const ids=unitCards(u);if(!ids.length)return"";const l=learnedOf(ids),sn=seenOf(ids);
  return`<div class="unit${D().focus===i?" focus":""}"><div class="nm"><b>${esc(u.name)}</b> <span class="muted">${l} of ${ids.length} learned</span></div><button class="btn sm" data-focus="${i}">${D().focus===i?"Focused":"Focus"}</button><div class="ubar" title="${l} learned, ${sn} started of ${ids.length}"><i class="s" style="width:${sn/ids.length*100}%"></i><i style="width:${l/ids.length*100}%"></i></div></div>`};
 const gm=gameMoments().filter(x=>!x.m.solved).length,rushBest=D().rush.best,c=D().coords||{},lines=Object.values(D().lines).filter(x=>x.box>=2).length;
 const allL=learnedOf(ALL_CARDS);
 v.innerHTML=`<div class="home">
  <section class="hero"><div><div class="eyebrow" style="color:inherit;opacity:.8">${new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</div>
   <h2>${xp>=st.goal?"Goal reached. Brick by brick.":"Today's session"}</h2>
   <p>${due} review${due===1?"":"s"} due · ${nw} new puzzle${nw===1?"":"s"} · 1 opening line · about ${Math.max(6,Math.round((Math.min(due,12)+nw*2+3)*0.8))} min</p></div>
   <div class="ringwrap">${ringSvg(xp,st.goal)}<span class="ringtxt">${xp}<small>/ ${st.goal} XP</small></span></div>
   <div class="hero-actions"><button class="btn" id="start">${t.session?"Do another session":"Start session"}</button></div></section>
  <section class="card"><div class="row" style="justify-content:space-between"><h3>Today's plan</h3><span class="muted">${done} of ${items.length}</span></div>
   ${items.map(([k,b,d,on,auto])=>`<div class="pcheck"><button class="box${on?" on":""}" data-plan="${k}" ${auto?'disabled title="Ticks itself"':""} aria-label="${esc(b)}">${on?"✓":""}</button><div><b>${esc(b)}</b><span class="muted">${esc(d)}</span></div></div>`).join("")}</section>
  <section class="drills">
   <button class="drill" data-go="play"><span class="eyebrow">Play</span><span class="big">${lv.elo}</span><b>Practice game</b><span class="muted">vs ${lv.label}, from any opening</span></button>
   <button class="drill" data-go="openings"><span class="eyebrow">Openings</span><span class="big">${lines}/${OPEN.length}</span><b>Your repertoire</b><span class="muted">Lines you know from memory</span></button>
   <button class="drill" data-go="rush"><span class="eyebrow">Speed</span><span class="big">${rushBest}</span><b>Puzzle Rush</b><span class="muted">Best score in 3 minutes</span></button>
   <button class="drill" data-go="games"><span class="eyebrow">Your games</span><span class="big">${gm}</span><b>Fix your mistakes</b><span class="muted">Positions from your reviewed games</span></button>
   <button class="drill" data-go="squares"><span class="eyebrow">Board</span><span class="big">${Math.min(c.w||0,c.b||0)}</span><b>Square names</b><span class="muted">Goal: 15 from each side</span></button>
   <button class="drill" data-go="endgame"><span class="eyebrow">Technique</span><span class="big">${Object.values(PZ).filter(x=>x.drill&&x.drill.type!=="coords").length}</span><b>Endgame drills</b><span class="muted">Checkmates and pawn endings</span></button>
  </section>
  ${tp?`<section class="card focusc"><div class="eyebrow">Your pattern to fix</div><h3 style="margin-top:4px">${PAT[tp.k].t}: ${tp.n} times in your last ${tp.games} reviewed game${tp.games>1?"s":""}</h3><p class="muted" style="margin:6px 0 10px">${PAT[tp.k].tip}</p><button class="btn sm primary" id="tpp">Practice those positions</button></section>`:""}
  <section class="card"><div class="row" style="justify-content:space-between"><h3>Course</h3><span class="muted">${allL} of ${ALL_CARDS.length} puzzles learned</span></div>
   <p class="muted" style="margin:4px 0 6px;font-size:14px">New puzzles come in this order. Focus a unit to pull its puzzles to the front. The light bar is started, the dark bar is learned.</p>
   ${UNITS.map(unitRow).join("")}</section>
  <section class="card"><h3>Settings</h3>
   <div class="setrow"><span class="eyebrow">New puzzles per day</span><div class="seg" data-set="newPer">${[2,3,5,8].map(n=>`<button class="${st.newPer===n?"on":""}" data-v="${n}">${n}</button>`).join("")}</div></div>
   <div class="setrow"><span class="eyebrow">Daily XP goal</span><div class="seg" data-set="goal">${[30,60,100,150].map(n=>`<button class="${st.goal===n?"on":""}" data-v="${n}">${n}</button>`).join("")}</div></div>
   <p class="muted" style="margin:0;font-size:13.5px">XP: 10 for a puzzle on the first try, 6 with a hint or second try, 10 for an opening line from memory, 20 for a finished practice game, 2 per Puzzle Rush solve.</p></section>
 </div>`;
 $("#start").onclick=startSession;
 $$("[data-plan]",v).forEach(b=>b.onclick=()=>{t[b.dataset.plan]=!t[b.dataset.plan];Store.save();vToday(v)});
 $$("[data-set]",v).forEach(g=>$$("button",g).forEach(b=>b.onclick=()=>{D().settings=Object.assign(settings(),{[g.dataset.set]:+b.dataset.v});Store.save();vToday(v);renderBar()}));
 $$("[data-focus]",v).forEach(b=>b.onclick=()=>{const i=+b.dataset.focus;D().focus=D().focus===i?null:i;Store.save();vToday(v)});
 $$("[data-go]",v).forEach(b=>b.onclick=()=>{const k=b.dataset.go;
  if(k==="play")go("play");else if(k==="openings")go("openings");else if(k==="rush")go("puzzles",{rush:true});else if(k==="games")go("puzzles",{fromAll:true});
  else if(k==="squares"){D().current="squares";Store.save();go("learn")}else if(k==="endgame"){D().current="kq";Store.save();go("learn")}});
 if(tp)$("#tpp").onclick=()=>go("puzzles",{fromGames:tp.k});
}

/* ---------------- LEARN ---------------- */
function lessonDone(l){if(l.puzzles)return l.puzzles.every(p=>D().solved[p.ref||p.id]&&(!l.review||D().solved[p.id]));return(l.checklist||[]).every((_,i)=>D().checks[l.id+":"+i])}
function vLearn(v){
 const idx=Math.max(0,LESSONS.findIndex(l=>l.id===D().current)),l=LESSONS[idx];
 const n=LESSONS.filter(lessonDone).length;let k=0;
 const rail=`<div class="rail-prog"><div class="eyebrow">Course progress</div><div style="font-family:var(--f-display);font-weight:700;font-size:18px">${n} of ${LESSONS.length} lessons</div><div class="meter" style="margin-top:8px"><i style="width:${n/LESSONS.length*100}%"></i></div></div>`+
  UNITS.map((u,ui)=>`<div class="unit-h eyebrow">${ui+1} · ${u.name}</div>`+u.lessons.map(x=>{k++;return`<button class="lbtn${x.id===l.id?" on":""}${lessonDone(x)?" done":""}" data-id="${x.id}"><span class="n"><span>${k}</span></span><span>${esc(x.title)}</span></button>`}).join("")).join("");
 const panel=l.puzzles?`<aside class="panel sticky first" id="lp"></aside>`:`<aside class="panel sticky"><div class="eyebrow">Tick these off as you do them</div><div class="checks">${l.checklist.map((c,i)=>`<label class="check"><input type="checkbox" id="ck-${l.id}-${i}" data-i="${i}" ${D().checks[l.id+":"+i]?"checked":""}><span>${esc(c)}</span></label>`).join("")}</div></aside>`;
 v.innerHTML=`<div class="learn"><nav class="rail" aria-label="Lessons">${rail}</nav><div style="min-width:0">
  <div class="lhead"><div class="eyebrow">Unit ${l.unit+1} · ${esc(UNITS[l.unit].name)} · Lesson ${idx+1} of ${LESSONS.length}</div><h2>${esc(l.title)}</h2></div>
  <div class="grid2"><div class="reading"><p class="key">${l.key}</p>${l.body}<div class="hw"><div class="ico">${pc("wp")}</div><div><span class="eyebrow">Practice</span><p>${l.hw}</p></div></div></div>${panel}</div>
  <div class="lnav">${idx>0?`<button class="btn" id="pv">← ${esc(LESSONS[idx-1].title)}</button>`:"<span></span>"}${idx<LESSONS.length-1?`<button class="btn primary" id="nx">Next: ${esc(LESSONS[idx+1].title)} →</button>`:"<span></span>"}</div></div></div>`;
 $$(".lbtn",v).forEach(b=>b.onclick=()=>{D().current=b.dataset.id;Store.save();go("learn")});
 if(idx>0)$("#pv").onclick=()=>{D().current=LESSONS[idx-1].id;Store.save();go("learn")};
 if(idx<LESSONS.length-1)$("#nx").onclick=()=>{D().current=LESSONS[idx+1].id;Store.save();go("learn")};
 $$(".check input",v).forEach(c=>c.onchange=()=>{D().checks[l.id+":"+c.dataset.i]=c.checked;Store.save()});
 if(l.puzzles){let i=Math.max(0,l.puzzles.findIndex(p=>!D().solved[p.id]));if(i<0)i=0;
  const host=$("#lp");let api=null;
  const open=j=>{i=j;const p=l.puzzles[i];
   api=runPuzzle(host,p,{dots:el=>{el.innerHTML=l.puzzles.map((q,j2)=>`<button class="pdot${j2===i?" on":""}${D().solved[q.id]?" solved":""}" data-j="${j2}">${j2+1}</button>`).join("");$$(".pdot",el).forEach(b=>b.onclick=()=>open(+b.dataset.j))},
    onResult:(id,ok,first)=>{if(ok){if(!D().solved[p.id])addXP(5);D().solved[p.id]=true;D().solved[id]=true}else D().failed[id]=(D().failed[id]||0)+1;if(!p.drill)srsGrade(id,ok&&first);Store.save();
      if(ok){$$(".pdot",host)[i]?.classList.add("solved");if(lessonDone(l)){const b=$$(".lbtn",v).find(x=>x.dataset.id===l.id);b&&b.classList.add("done")}}},
    next:{label:i<l.puzzles.length-1?"Next puzzle →":(idx<LESSONS.length-1?"Next lesson →":"Done"),fn:()=>{if(i<l.puzzles.length-1)open(i+1);else if(idx<LESSONS.length-1){D().current=LESSONS[idx+1].id;Store.save();go("learn")}}}})};
  open(i);linkChips($(".reading",v),{board:()=>api&&api.board(),fens:()=>api?[api.fen()]:[],color:"w"})}
}

/* ---------------- OPENINGS ---------------- */
function notesHTML(o){const n=o.notes;if(!n)return"";return`<div class="onotes"><div class="why good"><span class="eyebrow">Why this line works</span><ul>${n.ideas.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
 <div class="why next"><span class="eyebrow">Your plan after the line</span><p>${esc(n.plan)}</p></div>
 <div class="why bad"><span class="eyebrow">Watch out for</span><ul>${n.watch.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>`}
function vOpenings(v,arg){
 let cur=OP[(arg&&arg.line)||D().lastLine]||OPEN[0];const daily=arg&&arg.daily;
 const groups=[...new Set(OPEN.map(o=>o.group))];const td=dayKey();
 const boxes=b=>`<span class="boxes" title="Memory strength">${[1,2,3,4,5].map(i=>`<i class="${b>=i?"on":""}"></i>`).join("")}</span>`;
 v.innerHTML=`<div class="vhead"><div><div class="eyebrow">Your repertoire · ${OPEN.length} lines</div><h1>Openings</h1><p>Play your side of each line from memory. The computer plays the other side. When the line ends, keep playing the position against the computer. That's how you learn what the moves are for.</p></div></div>
  <div class="grid2"><div class="olist">${groups.map(gr=>`<div class="ogroup"><div class="eyebrow">${gr}</div>${OPEN.filter(o=>o.group===gr).map(o=>{const r=D().lines[o.id];const st=!r?'<span class="pill">New</span>':r.due<=td?'<span class="pill warn">Due</span>':boxes(r.box);return`<button class="oitem${o.id===cur.id?" on":""}" data-id="${o.id}"><span><b>${esc(o.name)}</b><small>${o.seq.length} moves · you play ${o.side==="w"?"White":"Black"}</small></span>${st}</button>`}).join("")}</div>`).join("")}</div>
  <aside class="panel sticky first" id="op"></aside></div>`;
 $$(".oitem",v).forEach(b=>b.onclick=()=>{go("openings",{line:b.dataset.id})});
 const host=$("#op");D().lastLine=cur.id;
 let g,ply,mistakes,learn,board;const fin=new Chess();cur.seq.forEach(t=>fin.move(t.san));const finFen=fin.fen();
 function start(mode){learn=mode==="learn";g=new Chess();ply=0;mistakes=0;
  host.innerHTML=`<div class="ptop"><div><div class="eyebrow">${esc(cur.group)}</div><h3 style="margin-top:2px">${esc(cur.name)}</h3></div><div class="side"><i class="${cur.side}"></i>You play ${cur.side==="w"?"White":"Black"}</div></div>
   <p class="muted owhy" style="margin:0;font-size:14.5px">${esc(cur.why)}</p>
   <div class="row"><button class="btn sm ${learn?"primary":""}" id="ml">Learn (shows the move)</button><button class="btn sm ${!learn?"primary":""}" id="mt">Test (from memory)</button></div>
   <div class="bd"></div><div class="note" id="note">${learn?"The green arrow shows your next move. Read the note after each move.":"No hints. If you play something else, you'll get another try."}</div>
   <div class="moves" id="mv"></div><div class="acts"><button class="btn sm" id="hint">Hint</button><button class="btn sm" id="rs">Restart</button><button class="btn sm coachonly" id="oask">Ask the coach</button></div><div id="after"></div>${notesHTML(cur)}`;
  board=new Board($(".bd",host),{canMove:()=>ply<cur.seq.length&&g.turn()===cur.side,onMove:mv=>userMove(mv)});board.set(g,{flip:cur.side==="b"});
  const octx={board:()=>board,fens:()=>[g.fen(),finFen],color:cur.side};linkChips($(".owhy",host),octx);linkChips($(".onotes",host),octx);
  $("#ml").onclick=()=>start("learn");$("#mt").onclick=()=>start("test");$("#rs").onclick=()=>start(learn?"learn":"test");
  $("#hint").onclick=()=>{mistakes++;showHint()};$("#oask").onclick=()=>openCoach();
  setCoach(()=>({key:"op:"+cur.id,title:"Opening: "+cur.name,board:()=>board,fen:g.fen(),me:cur.side,history:g.history(),
   extra:`They are practicing this opening line as ${cur.side==="w"?"White":"Black"}: ${cur.seq.map(t=>t.san).join(" ")}. Why it's played: ${cur.why}${cur.notes?` Plan after the line: ${cur.notes.plan}`:""} ${ply<cur.seq.length?`The line's next move here is ${cur.seq[ply].san}${cur.seq[ply].note?" ("+cur.seq[ply].note+")":""}.`:"The line is finished."}`,
   quick:["Why is this move played?","What does my opponent want here?","What's my plan after the line?"]}));
  advance();
 }
 function moveList(){const el=$("#mv");const h=g.history({verbose:true});el.innerHTML=h.map((m,i)=>`<span class="mvchip${i===h.length-1?" cur":""}" title="${esc(m.san)}">${moveFace(m)}</span>`).join("")}
 function showHint(){if(ply>=cur.seq.length)return;const m=g.moves({verbose:true}).find(x=>norm(x.san)===norm(cur.seq[ply].san));if(m)board.annotate({arrows:[{from:m.from,to:m.to,c:"good"}]})}
 async function advance(){
  moveList();
  while(ply<cur.seq.length&&g.turn()!==cur.side){await sleep(ply===0?250:450);const r=g.move(cur.seq[ply].san);board.applied(r);ply++;moveList();noteFor(ply-1)}
  if(ply>=cur.seq.length)return done();
  if(learn)showHint();
 }
 function noteFor(i){const t=cur.seq[i],m=g.history({verbose:true})[i];if(!t||!t.note||!m)return;const el=$("#note");el.innerHTML=`${moveChipHTML(m,"lead")} <span>${esc(t.note)}</span>`;linkChips(el,{board:()=>board,fens:()=>[g.fen(),finFen],color:m.color})}
 function userMove(mv){
  const exp=cur.seq[ply];const r=g.move(mv);if(!r)return;
  if(norm(r.san)!==norm(exp.san)){g.undo();mistakes++;board.undone();board.shake();$("#note").innerHTML=`<span class="nochip">${moveFace(r)}</span> <span>Not the line's move. It might even be fine, but practice the book move here. Try again${learn?"":" or press Hint"}.</span>`;if(learn)showHint();return}
  board.applied(r);ply++;noteFor(ply-1);advance();
 }
 function done(){
  const perfect=!learn&&mistakes===0;
  if(!learn){lineGrade(cur.id,perfect);today().opening=true;addXP(perfect?10:6);Store.save();renderBar()}
  const lv=LEVELS[D().level-1];
  $("#after").innerHTML=`<div class="fb ${perfect?"ok":"go"}">${fbHTML(perfect?"ok":"go",learn?"Line complete":perfect?"Perfect from memory":"Line complete",learn?"Now switch to Test and play it from memory.":perfect?"It'll come back in a few days to stay fresh.":`${mistakes} slip${mistakes===1?"":"s"}. It'll come back tomorrow.`)}</div>
   <div class="acts" style="margin-top:10px"><button class="btn primary" id="pl">Play it out vs ${lv.label} →</button>${learn?'<button class="btn" id="tt">Test me</button>':'<button class="btn" id="nd">Next due line</button>'}</div>`;
  $("#pl").onclick=()=>go("play",{opening:cur.id,daily});
  if(learn)$("#tt").onclick=()=>start("test");else $("#nd").onclick=()=>go("openings",{line:lineOfDay().id});
 }
 start(D().lines[cur.id]?"test":"learn");
}

/* ---------------- PUZZLES ---------------- */
function vPuzzles(v,arg){
 const missed=Object.keys(D().failed).filter(id=>PZ[id]&&!PZ[id].drill&&(D().srs[id]?D().srs[id].box<2:true));
 const solved=TACTIC_IDS.filter(id=>D().solved[id]).length;
 const gm=gameMoments(),byT={};gm.forEach(x=>byT[x.m.type]=(byT[x.m.type]||0)+1);
 v.innerHTML=`<div class="vhead"><div><div class="eyebrow">${solved} of ${TACTIC_IDS.length} solved</div><h1>Puzzles</h1><p>Puzzle Rush trains speed: solve as many as you can in 3 minutes. Three misses and it's over.</p></div></div>
  <div class="grid2"><div style="display:flex;flex-direction:column;gap:14px">
   <div class="card"><div class="eyebrow">Puzzle Rush</div><h3 style="margin-top:4px">Best score: ${D().rush.best}</h3><p class="muted" style="margin:6px 0 12px">Mixed puzzles from the whole course. Go fast, but do the safety check anyway.</p><button class="btn primary" id="rush">Start a 3-minute rush</button></div>
   <div class="card"><div class="eyebrow">Missed puzzles</div><h3 style="margin-top:4px">${missed.length} to fix</h3><p class="muted" style="margin:6px 0 12px">These come back until you solve them on the first try.</p><button class="btn" id="miss" ${missed.length?"":"disabled"}>Practice missed puzzles</button></div>
   ${(D().blind||[]).some(b=>b.ex.length)?`<div class="card coachonly"><div class="eyebrow">Your blind spots</div><h3 style="margin-top:4px">Positions where you missed something</h3><p class="muted" style="margin:6px 0 10px">Saved by the coach from your chats, your think-out-loud moves and your game reviews.</p><div class="chips">${D().blind.filter(b=>b.ex.length).map((b,i)=>`<button class="chip" data-b="${i}">${esc(b.tag)} · ${b.ex.length}</button>`).join("")}</div></div>`:""}
   <div class="card"><div class="eyebrow">From your games</div><h3 style="margin-top:4px">${gm.filter(x=>!x.m.solved).length} positions to fix</h3><p class="muted" style="margin:6px 0 10px">Every mistake from your reviewed practice games becomes a puzzle here. Pick the pattern you want to work on.</p>${Object.keys(byT).length?`<div class="chips">${Object.keys(PAT).filter(k=>byT[k]).map(k=>`<button class="chip bad" data-k="${k}">${PAT[k].t} · ${byT[k]}</button>`).join("")}</div>`:'<p class="muted" style="margin:0">Play a practice game and open its review first.</p>'}</div>
   <div class="card"><div class="eyebrow">More practice outside</div><div class="row" style="margin-top:8px"><a class="btn sm" href="https://www.chess.com/puzzles" target="_blank" rel="noopener">Chess.com Puzzles ↗</a><a class="btn sm" href="https://lichess.org/training/themes" target="_blank" rel="noopener">Lichess themes ↗</a><a class="btn sm" href="https://lichess.org/storm" target="_blank" rel="noopener">Lichess Puzzle Storm ↗</a></div></div>
  </div><aside class="panel sticky first" id="pz"><div class="eyebrow">Board</div><p class="muted" style="margin:0">Pick a mode on the left.</p></aside></div>`;
 $("#rush").onclick=rush;$("#miss").onclick=()=>series(missed.slice(0,10),"Missed puzzles");
 $$(".chip[data-k]",v).forEach(c=>c.onclick=()=>fromGames(c.dataset.k));
 if(arg&&arg.fromGames)setTimeout(()=>fromGames(arg.fromGames),0);
 if(arg&&arg.rush)setTimeout(rush,0);
 if(arg&&arg.fromAll)setTimeout(()=>{const k=Object.keys(PAT).find(x=>gameMoments(x).some(y=>!y.m.solved));if(k)fromGames(k);else $("#pz").innerHTML='<p class="muted" style="margin:0">No positions to fix yet. Play a practice game or paste a chess.com game, then open its review.</p>'},0);
 const withEx=(D().blind||[]).filter(b=>b.ex.length);
 $$(".chip[data-b]",v).forEach(c=>c.onclick=()=>blindSeries([withEx[+c.dataset.b]]));
 if(arg&&arg.blind)setTimeout(()=>blindSeries(withEx),0);
 function blindSeries(bs){const list=[];bs.forEach(b=>b.ex.forEach((e,k)=>list.push({id:"bs:"+b.k+":"+k,fen:e.fen,prompt:`Blind spot: ${b.tag}. Find the best move.`,accept:[e.best],ok:"That's the idea. Keep looking for this in your games.",no:"Not quite."})));
  const host=$("#pz");let i=0;if(!list.length)return;
  const next=()=>{if(i>=list.length){host.innerHTML='<div class="eyebrow">Blind spots</div><h3>Set finished</h3><p class="muted">These stay here so you can come back to them.</p>';return}
   runPuzzle(host,list[i],{skip:true,dots:el=>el.innerHTML=`<span class="pill">Blind spots · ${i+1}/${list.length}</span>`,next:{label:"Next →",fn:()=>{i++;next()}}})};
  next();host.scrollIntoView({behavior:"smooth",block:"start"})}
 function fromGames(k){const list=gameMoments(k);const host=$("#pz");let i=0;if(!list.length){host.innerHTML='<p class="muted">No positions of that type yet.</p>';return}
  const next=()=>{if(i>=list.length){host.innerHTML=`<div class="eyebrow">${PAT[k].t}</div><h3>Set finished</h3><p class="muted">${list.filter(x=>x.m.solved).length} of ${list.length} fixed. Anything you missed stays here for next time.</p>`;return}
   const {rec,m}=list[i];trainMoment(host,rec,m,{label:`${PAT[k].t} · ${i+1} of ${list.length}`,next:()=>{i++;next()}})};
  next();host.scrollIntoView({behavior:"smooth",block:"start"})}
 function series(ids,title){const host=$("#pz");let i=0;const next=()=>{if(i>=ids.length){host.innerHTML=`<div class="eyebrow">${title}</div><h3>Set finished</h3>`;return}
  runPuzzle(host,PZ[ids[i]],{skip:true,dots:el=>el.innerHTML=`<span class="pill">${title} · ${i+1}/${ids.length}</span>`,onResult:(id,ok,first)=>{srsGrade(id,ok&&first);if(ok){D().solved[id]=true;if(first)delete D().failed[id]}Store.save()},next:{label:"Next →",fn:()=>{i++;next()}}})};next()}
 function rush(){const host=$("#pz");const pool=TACTIC_IDS.slice().sort(()=>Math.random()-.5);let i=0,score=0,miss=0,end=Date.now()+180000,over=false;
  const tick=setInterval(()=>{const left=Math.max(0,end-Date.now());const el=$(".pill.rush",host);if(el)el.textContent=`${Math.ceil(left/1000)}s · ${score} solved · ${"✕".repeat(miss)}`;if(!left)stop()},250);
  function stop(){if(over)return;over=true;clearInterval(tick);D().rush.runs++;const best=score>D().rush.best;if(best)D().rush.best=score;Store.save();
   host.innerHTML=`<div class="eyebrow">Puzzle Rush</div><h3 style="font-size:32px">${score} solved</h3><p class="muted">${best?"New best score.":`Best: ${D().rush.best}`}</p><div class="row"><button class="btn primary" id="again">Go again</button></div>`;$("#again").onclick=rush}
  function next(){if(over)return;if(i>=pool.length)return stop();
   runPuzzle(host,PZ[pool[i]],{dots:el=>el.innerHTML=`<span class="pill acc rush">180s</span>`,onResult:(id,ok,first)=>{if(over)return;if(ok&&first){score++;addXP(2)}else miss++;srsGrade(id,ok&&first);Store.save();if(miss>=3)return setTimeout(stop,600);setTimeout(()=>{i++;next()},ok?500:1100)}})}
  next()}
}

/* ---------------- PLAY ---------------- */
let Game=null;
function vPlay(v,arg){
 if(arg&&arg.opening){setupGame({opening:arg.opening,color:OP[arg.opening].side,daily:arg.daily});}
 if(arg&&arg.fen){setupGame({fen:arg.fen,color:arg.color,from:arg.from});}
 if(arg&&arg.review!==undefined){return reviewView(v,arg.review)}
 const lv=D().level;
 v.innerHTML=`<div class="vhead"><div><div class="eyebrow">Practice games</div><h1>Play the computer</h1><p>Take your time. These games are for building habits, not speed. Coach mode warns you before a move that drops material.</p></div></div>
  <div class="grid2"><div style="display:flex;flex-direction:column;gap:14px;min-width:0">
   <div class="card"><div class="setup">
    <label class="fld">Opponent<select id="lvl">${LEVELS.map(L=>`<option value="${L.n}" ${L.n===lv?"selected":""}>${L.n}. ${L.label} (${L.elo})</option>`).join("")}</select></label>
    <label class="fld">Start from<select id="start"><option value="std">Normal start</option>${OPEN.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join("")}</select></label>
    <label class="fld">You play<select id="col"><option value="w">White</option><option value="b">Black</option><option value="r">Random</option></select></label>
   </div><label class="toggle"><input type="checkbox" id="coach" ${D().coach?"checked":""}><span><b>Coach mode</b><br><span class="muted">Before a move that loses material, you get a warning and a chance to take it back.</span></span></label>
   <div class="row" style="margin-top:12px"><button class="btn primary" id="new">New game</button></div></div>
   <div class="card"><div class="eyebrow">Moves</div><div class="movelist" id="ml"></div></div>
   <div class="card" id="imp"><div class="eyebrow">Review a real chess.com game</div><h3 style="margin-top:4px">Paste a game, get the same review</h3>
    <p class="muted" style="margin:6px 0 10px;font-size:14.5px">On chess.com, open the game, then Share, then PGN, then Copy. Paste it here. Your username is matched to pick your color.</p>
    <textarea id="pgn" rows="4" placeholder="[Event &quot;Live Chess&quot;] ... 1. e4 e5 2. Nf3 ..."></textarea>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="impgo">Review this game</button><span class="muted" id="impmsg" style="font-size:13.5px"></span></div></div>
   <div class="card" id="recent"></div>
  </div><aside class="panel sticky first" id="gp"></aside></div>`;
 $("#coach").onchange=e=>{D().coach=e.target.checked;Store.save()};
 $("#lvl").onchange=e=>{D().level=+e.target.value;Store.save()};
 $("#start").onchange=e=>{const o=OP[e.target.value];if(o)$("#col").value=o.side};
 $("#new").onclick=()=>{const st=$("#start").value;let c=$("#col").value;if(c==="r")c=Math.random()<.5?"w":"b";setupGame(st==="std"?{color:c}:{opening:st,color:c});drawGame()};
 if(Game&&Game.opening)$("#start").value=Game.opening;if(Game)$("#col").value=Game.color;
 recentList();
 $("#impgo").onclick=()=>{const msg=$("#impmsg");const rec=importPgn($("#pgn").value);if(rec.wait)return;if(rec.error){msg.textContent=rec.error;return}
  D().games.push(rec);if(D().games.length>60)D().games=D().games.slice(-60);today().real2=true;Store.save();go("play",{review:rec.id})};
 if(!Game)setupGame({color:"w"});drawGame();
}
function setupGame({opening,color="w",fen,daily,from}){
 const g=fen?new Chess(fen):new Chess();
 if(opening)OP[opening].seq.forEach(t=>g.move(t.san));
 Game={id:Date.now(),g,color,opening:opening||null,startFen:fen||null,start:new Chess().fen(),level:D().level,over:false,result:null,busy:false,daily:!!daily,from:from||null,takebacks:0,saved:false,bookPly:g.history().length};
}
function material(g){const c={w:0,b:0};g.board().flat().forEach(p=>{if(p)c[p.color]+=PIECE_VAL[p.type]});return c}
function drawGame(){
 const host=$("#gp");if(!host)return;const G=Game,L=LEVELS[G.level-1];
 host.innerHTML=`<div class="ptop"><div class="side"><i class="${G.color==="w"?"b":"w"}"></i>${L.label} (${L.elo})</div><span class="pill">${G.opening?esc(OP[G.opening].name):G.from?"From your review":"Normal start"}</span></div>
  <div class="mat" id="matT"></div><div class="bd" style="position:relative"></div><div class="mat" id="matB"></div>
  <div class="thinking" id="th"></div><div class="fb" id="gfb"></div>
  <div class="thinkbox coachonly" id="thinkbox" ${D().think?"":"hidden"}><label for="thinkta" class="eyebrow">Think out loud, then move</label><textarea id="thinkta" rows="2" placeholder="What did they just threaten? What will you play, and why?"></textarea></div>
  <div id="thinkres"></div>
  <div class="acts"><button class="btn sm" id="tb">Take back</button><button class="btn sm" id="fl">Flip board</button><button class="btn sm coachonly" id="gask">Ask the coach</button><button class="btn sm coachonly${D().think?" primary":""}" id="thk">Think out loud: ${D().think?"on":"off"}</button><button class="btn sm warn grow" id="rsn">Resign</button></div>`;
 const board=new Board($(".bd",host),{canMove:()=>!G.over&&!G.busy&&!G.coachPending&&G.g.turn()===G.color,onMove:mv=>human(mv)});
 G.board=board;board.set(G.g,{flip:G.color==="b",last:lastMove(G.g)});
 $("#fl").onclick=()=>{board.flip=!board.flip;board.drawSquares();board.drawPieces()};
 $("#tb").onclick=()=>{if(G.busy||G.over)return;const h=G.g.history();if(h.length<=G.bookPly)return;G.g.undo();if(G.g.turn()!==G.color&&G.g.history().length>G.bookPly)G.g.undo();if(G.g.turn()!==G.color)return;G.takebacks++;board.set(G.g,{last:lastMove(G.g)});info()};
 $("#rsn").onclick=()=>{if(G.over)return;endGame(G.color==="w"?"0-1":"1-0","You resigned")};
 $("#gask").onclick=()=>openCoach();
 $("#thk").onclick=()=>{D().think=!D().think;Store.save();$("#thinkbox").hidden=!D().think;const b=$("#thk");b.textContent=`Think out loud: ${D().think?"on":"off"}`;b.classList.toggle("primary",!!D().think);if(D().think)$("#thinkta").focus()};
 setCoach(()=>({key:"game:"+G.id,title:`Practice game vs ${L.label}`,board:()=>G.board,fen:G.g.fen(),me:G.color,history:G.g.history(),
  extra:`A practice game against the computer at ${L.label} strength (${L.elo}).${G.opening?` It started from the ${OP[G.opening].name} line.`:""}`,
  quick:["What are they threatening?","What should I look for here?","Is my position good or bad, and why?"]}));
 info();
 if(G.over)showEnd();else if(G.g.turn()!==G.color)setTimeout(bot,350);
 else{const n=G.opening&&OP[G.opening].notes;const gf=()=>{linkChips($("#gfb"),{board:()=>G.board,fens:()=>[G.g.fen()],color:G.color})};setTimeout(gf,0);setFb($("#gfb"),G.bookPly&&G.g.history().length===G.bookPly?"go":"",G.bookPly&&G.g.history().length===G.bookPly?"Opening done. Your plan:":null,G.bookPly&&G.g.history().length===G.bookPly?`${n?esc(n.plan)+" ":""}Before each move: what did they attack, and what does my move leave undefended?`:"Your move.")}
}
function lastMove(g){const h=g.history({verbose:true});return h[h.length-1]||null}
function info(){const G=Game,ml=$("#ml");if(ml){const h=G.g.history({verbose:true});let s="";for(let i=0;i<h.length;i+=2)s+=`<span class="no">${i/2+1}.</span><span class="mvchip" title="${esc(h[i].san)}">${moveFace(h[i])}</span><span class="mvchip" title="${h[i+1]?esc(h[i+1].san):""}">${h[i+1]?moveFace(h[i+1]):""}</span>`;ml.innerHTML=s;ml.scrollTop=ml.scrollHeight}
 const m=material(G.g),me=G.color,op=me==="w"?"b":"w",d=m[me]-m[op];
 const t=$("#matT"),b=$("#matB");if(t)t.textContent=d<0?`+${-d}`:"";if(b)b.textContent=d>0?`You +${d}`:d===0?"Material even":""}
async function human(mv){
 const G=Game;if(G.over||G.busy)return;
 if(D().think&&COACH_OK!==false){const ta=$("#thinkta"),said=ta&&ta.value.trim();
  if(!said){G.board.drawSquares();G.board.shake();setFb($("#gfb"),"warn","Think out loud first","Type one line before you move: what did they just threaten, and why are you playing your move? Or turn Think out loud off.");if(ta)ta.focus();return}
  G.pendingThink={fenBefore:G.g.fen(),said,lastMove:(lastMove(G.g)||{}).san||""}}
 if(D().coach){G.busy=true;$("#th").textContent="Coach is checking your move…";
  const before=await Engine.search(G.g.fen(),{depth:8});const r=G.g.move(mv);const after=await Engine.search(G.g.fen(),{depth:8});G.busy=false;$("#th").textContent="";
  if(before&&after&&before.lines[0]&&after.lines[0]){const loss=cpOf(before.lines[0])+cpOf(after.lines[0]);
   if(loss>=250&&!G.g.in_checkmate()){G.g.undo();return coachWarn(mv,r,after,loss)}}
  G.g.undo();
 }
 commit(mv);
}
function coachWarn(mv,r,after,loss){
 const G=Game;const reply=uciToMove((()=>{const t=new Chess(G.g.fen());t.move(mv);return t})(),after.best);
 const mate=after.lines[0].kind==="mate"&&after.lines[0].v>0;G.coachPending=true;G.coachSaves=(G.coachSaves||0)+1;
 G.board.annotate({arrows:[{from:r.from,to:r.to,c:"bad"}].concat(reply?[{from:reply.from,to:reply.to,c:"warn"}]:[]),rings:reply&&reply.captured?[{sq:reply.to,c:"bad"}]:[]});
 const f=$("#gfb");
 setFb(f,"warn",`Coach: careful with that move`,`<span class="nochip">${moveChipHTML(r)}</span> (red arrow) ${mate?"lets your opponent force checkmate.":reply&&reply.captured?`lets them answer ${moveChipHTML(reply)} (orange arrow) and take your ${PWORD[reply.captured]}.`:"gives your opponent a big advantage."} Do the safety check: what does your move leave undefended?
  <div class="row" style="margin-top:10px"><button class="btn sm primary" id="cwb">Take it back</button><button class="btn sm" id="cwp">Play it anyway</button></div>`);
 linkChips(f,{board:()=>G.board,fens:()=>[G.g.fen()]});
 $("#cwb").onclick=()=>{G.coachPending=false;G.board.annotate({});G.board.drawSquares();setFb(f,"",null,"Taken back. Find a safer move.")};
 $("#cwp").onclick=()=>{G.coachPending=false;G.coachSaves--;G.board.annotate({});commit(mv)};
}
function commit(mv){const G=Game;const r=G.g.move(mv);if(!r)return;G.board.applied(r);info();
 if(G.pendingThink){const pt=G.pendingThink;G.pendingThink=null;const ta=$("#thinkta");if(ta)ta.value="";showThinking(pt,r)}
 if(checkEnd())return;setTimeout(bot,250)}
async function showThinking(pt,r){
 const el=$("#thinkres");if(!el)return;const slot=document.createElement("div");slot.innerHTML=`<div class="fb">${fbHTML("","Coach is reading your thinking…",`On ${esc(r.san)}: “${esc(pt.said)}”`)}</div>`;el.prepend(slot);
 while(el.children.length>3)el.lastChild.remove();
 const res=await gradeThinking({fenBefore:pt.fenBefore,move:r,said:pt.said,me:Game.color,lastMove:pt.lastMove});
 if(!res.error){const t=today();t.think=(t.think||0)+1;D().thinkLog=(D().thinkLog||[]).concat([{d:dayKey(),s:+res.score||0}]).slice(-200);Store.save();renderBar()}
 slot.innerHTML=thinkCard(res,r.san);linkChips(slot,{board:()=>Game.board,fens:()=>[pt.fenBefore],color:Game.color});
}
async function bot(){
 const G=Game;if(G.over||G.g.turn()===G.color||G.thinking)return;G.thinking=true;G.busy=true;const th=$("#th");if(th)th.textContent="Computer is thinking…";
 const t0=Date.now();const m=await botMove(G.g,G.level);await sleep(Math.max(0,450-(Date.now()-t0)));
 G.thinking=false;if(G!==Game)return;G.busy=false;const th2=$("#th");if(th2)th2.textContent="";
 const r=G.g.move({from:m.from,to:m.to,promotion:m.promotion||"q"});if(G.board&&document.contains(G.board.el))G.board.applied(r);info();
 if(!checkEnd()){const f=$("#gfb");if(f){setFb(f,"",null,r.captured?`They played ${moveChipHTML(r)} and took your ${PWORD[r.captured]}. Can you take back, and is it safe?`:r.san.includes("+")?`${moveChipHTML(r)} Check! Capture the checking piece, block it, or move your king.`:`They played ${moveChipHTML(r)}. What does it attack now?`);linkChips(f,{board:()=>G.board,fens:()=>[G.g.fen()]})}}
}
function checkEnd(){const g=Game.g;if(g.in_checkmate())return endGame(g.turn()==="w"?"0-1":"1-0","Checkmate"),true;
 if(g.in_stalemate())return endGame("1/2-1/2","Stalemate"),true;if(g.insufficient_material())return endGame("1/2-1/2","Not enough material to mate"),true;
 if(g.in_threefold_repetition())return endGame("1/2-1/2","Threefold repetition"),true;if(g.in_draw())return endGame("1/2-1/2","Fifty-move rule"),true;return false}
function endGame(result,why){
 const G=Game;G.over=true;G.result=result;G.why=why;
 const mine=G.color==="w"?"1-0":"0-1",score=result===mine?1:result==="1/2-1/2"?.5:0;G.score=score;
 if(!G.saved){G.saved=true;const rec={id:Date.now(),date:dayKey(),color:G.color,level:G.level,opening:G.opening,result,why,score,start:G.startFen,pgn:G.g.pgn(),moves:G.g.history(),bookPly:G.bookPly,coach:D().coach,coachSaves:G.coachSaves||0,takebacks:G.takebacks,review:null};
  D().games.push(rec);if(D().games.length>60)D().games=D().games.slice(-60);G.rec=rec;today().game=true;addXP(20);
  const same=D().games.filter(x=>x.level===G.level).slice(-3);
  if(score===1&&same.length>=2&&same.slice(-2).every(x=>x.score===1)&&G.level<7)G.levelUp=true;
  if(score===0&&same.length>=3&&same.every(x=>x.score===0)&&G.level>1)G.levelDown=true;
  Store.save();renderBar()}
 showEnd();
}
function showEnd(){const G=Game,f=$("#gfb");if(!f)return;
 const t=G.score===1?"You won":G.score===.5?"Draw":"You lost";
 setFb(f,G.score===1?"ok":G.score===.5?"go":"no",`${t} · ${esc(G.why)}`,`<div class="row" style="margin-top:8px"><button class="btn sm primary" id="rv">Review this game →</button><button class="btn sm" id="ag">Rematch</button>${G.levelUp?`<button class="btn sm" id="lu">Move up to level ${G.level+1}</button>`:""}${G.levelDown?`<button class="btn sm" id="ld">Drop to level ${G.level-1}</button>`:""}</div>${G.levelUp?'<p style="margin:8px 0 0">Three wins in a row at this level. Time for a tougher opponent.</p>':""}`);
 $("#rv").onclick=()=>go("play",{review:G.rec.id});
 $("#ag").onclick=()=>{setupGame({opening:G.opening,color:G.color,fen:G.startFen,from:G.from});drawGame()};
 if(G.levelUp)$("#lu").onclick=()=>{D().level=G.level+1;Store.save();setupGame({opening:G.opening,color:G.color});go("play")};
 if(G.levelDown)$("#ld").onclick=()=>{D().level=G.level-1;Store.save();setupGame({opening:G.opening,color:G.color});go("play")};
}
function importPgn(txt){
 txt=String(txt||"").trim();if(!txt)return{error:"Paste a PGN first."};
 const g=new Chess();if(!g.load_pgn(txt,{sloppy:true}))return{error:"That doesn't look like a PGN. On chess.com use Share, then PGN, then Copy."};
 const h=g.header(),user=(D().username||"Freakhail").toLowerCase();const moves=g.history();if(moves.length<4)return{error:"That game is too short to review."};
 let color=(h.White||"").toLowerCase()===user?"w":(h.Black||"").toLowerCase()===user?"b":null;
 if(!color){color=$("#impcol")?$("#impcol").value:null;if(!color){$("#impmsg").innerHTML=`Which side were you? <select id="impcol"><option value="w">White (${esc(h.White||"?")})</option><option value="b">Black (${esc(h.Black||"?")})</option></select> then press Review again.`;return{wait:true}}}
 const res=h.Result||"*",mine=color==="w"?"1-0":"0-1",score=res===mine?1:res==="1/2-1/2"?.5:0;
 const date=(h.Date||"").replace(/\./g,"-");
 return{id:Date.now(),date:/^\d{4}-\d{2}-\d{2}$/.test(date)?date:dayKey(),color,level:0,source:"chess.com",opp:color==="w"?h.Black:h.White,opening:null,result:res,why:h.Termination?h.Termination.replace(/^.* won /,"Won ").replace(/^.* - /,""):res,score,start:h.FEN||null,pgn:txt,moves,bookPly:0,coach:false,coachSaves:0,takebacks:0,review:null};
}
function recentList(){const el=$("#recent");if(!el)return;const gs=D().games.slice(-6).reverse();
 el.innerHTML=`<div class="eyebrow">Recent games</div>`+(gs.length?`<div class="tblw"><table class="tbl"><thead><tr><th>Date</th><th>Start</th><th>Opponent</th><th>Result</th><th>Blunders</th><th></th></tr></thead><tbody>${gs.map(x=>`<tr><td>${x.date.slice(5)}</td><td>${x.opening?esc(OP[x.opening].name.split(":")[0]):"Normal"}</td><td>${x.source?esc(x.opp||"chess.com"):"Level "+x.level}</td><td>${x.score===1?'<span class="pill good">Won</span>':x.score===.5?'<span class="pill">Draw</span>':'<span class="pill bad">Lost</span>'}</td><td>${x.review?x.review.blunders:"–"}</td><td><button class="btn sm" data-r="${x.id}">${x.review?"Open":"Review"}</button></td></tr>`).join("")}</tbody></table></div>`:`<p class="muted" style="margin:6px 0 0">Your games show up here with their reviews.</p>`);
 $$("[data-r]",el).forEach(b=>b.onclick=()=>go("play",{review:+b.dataset.r}))}

/* ---------------- REVIEW ---------------- */
const PNAME={p:"pawn",n:"knight",b:"bishop",r:"rook",q:"queen",k:"king"};
const AVAL={p:1,n:3,b:3,r:5,q:9,k:100};
const rcSq=(r,c)=>"abcdefgh"[c]+(8-r);
const fullmove=fen=>+(fen.split(" ")[5]||1);
// Pieces of `color` that attack square `sq` (pure geometry, ignores pins).
function attackers(g,sq,color){
 const b=g.board(),tr=8-+sq[1],tc="abcdefgh".indexOf(sq[0]),out=[];
 const at=(r,c)=>(r>=0&&r<8&&c>=0&&c<8)?b[r][c]:null;
 const pr=color==="w"?tr+1:tr-1;
 [tc-1,tc+1].forEach(c=>{const p=at(pr,c);if(p&&p.color===color&&p.type==="p")out.push({sq:rcSq(pr,c),type:"p"})});
 [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([dr,dc])=>{const p=at(tr+dr,tc+dc);if(p&&p.color===color&&p.type==="n")out.push({sq:rcSq(tr+dr,tc+dc),type:"n"})});
 for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
  if(!dr&&!dc)continue;
  const k=at(tr+dr,tc+dc);if(k&&k.color===color&&k.type==="k")out.push({sq:rcSq(tr+dr,tc+dc),type:"k"});
  const diag=dr!==0&&dc!==0;let r=tr+dr,c=tc+dc;
  while(r>=0&&r<8&&c>=0&&c<8){const p=b[r][c];if(p){if(p.color===color&&(p.type==="q"||p.type===(diag?"b":"r")))out.push({sq:rcSq(r,c),type:p.type});break}r+=dr;c+=dc}
 }
 return out;
}
// Pieces of `color` that are attacked and either undefended or attacked by something cheaper.
function loosePieces(g,color){
 const opp=color==="w"?"b":"w",out=[];
 g.board().forEach((row,r)=>row.forEach((p,c)=>{
  if(!p||p.color!==color||p.type==="k")return;const s=rcSq(r,c);
  const A=attackers(g,s,opp);if(!A.length)return;const Dd=attackers(g,s,color);
  const minA=Math.min(...A.map(a=>AVAL[a.type]));
  if(!Dd.length||minA<AVAL[p.type]||A.length>Dd.length)out.push({sq:s,type:p.type,defended:Dd.length>0,a:A.length,d:Dd.length});
 }));
 return out;
}
const mdiff=(g,me)=>{const m=material(g);return m[me]-m[me==="w"?"b":"w"]};
function lineFrom(fen,pv,n=8){const g=new Chess(fen),out=[];for(const u of (pv||[]).slice(0,n)){const m=uciToMove(g,u);if(!m)break;out.push(g.move(m))}return out}
function afterLine(fen,line){const g=new Chess(fen);line.forEach(m=>g.move(m.san));return g}
function swingOf(fen,line,me){const g=new Chess(fen),d0=mdiff(g,me);line.forEach(m=>g.move(m.san));return mdiff(g,me)-d0}
function targetsOf(g,sq,color){const opp=color==="w"?"b":"w",out=[];g.board().forEach((row,r)=>row.forEach((p,c)=>{if(!p||p.color!==opp)return;const s=rcSq(r,c);if(attackers(g,s,color).some(a=>a.sq===sq))out.push({sq:s,type:p.type,defended:attackers(g,s,opp).length>0})}));return out}
// After move m has been played in g: does the moved piece attack two worthwhile targets?
function threatsOf(g,m){const val=AVAL[m.promotion||m.piece];return targetsOf(g,m.to,m.color).filter(x=>x.type==="k"||AVAL[x.type]>val||!x.defended)}
function forkOf(g,m){const t=threatsOf(g,m);return t.length>=2&&t.some(x=>x.type!=="p")?t:null}
const nameList=ts=>ts.map(t=>t.type==="k"?"king":`${PNAME[t.type]} on ${t.sq}`).join(" and ");
function evalTxt(cp,mate){
 if(mate!=null&&mate!==0)return mate>0?`you have a forced checkmate in ${mate}`:`your opponent has a forced checkmate in ${-mate}`;
 const a=Math.abs(cp)/100;if(a<0.5)return"the position is about even";
 const w=a<1.3?"slightly better":a<2.5?"better, by about a pawn or two":a<4.5?"clearly better, about a piece ahead":a<7?"much better, about a rook ahead":"winning";
 return `${cp>0?"you're":"your opponent is"} ${w}`;
}
const evNum=(cp,mate)=>mate!=null&&mate!==0?(mate>0?`Mate in ${mate}`:`Mated in ${-mate}`):`${cp>0?"+":""}${(cp/100).toFixed(1)}`;
function lineLabels(fen,line){const p=fen.split(" ");let n=+p[5]||1,t=p[1];return line.map((m,i)=>{const lab=t==="w"?`${n}.`:(i===0?`${n}…`:"");if(t==="b")n++;t=t==="w"?"b":"w";return{lab,san:m.san}})}

function whyBad(m,me){
 const gB=new Chess(m.fen);const mv=gB.move(m.san);const gA=new Chess(gB.fen());
 const ref=lineFrom(gA.fen(),m.refPv);const r0=ref[0];const out=[];
 const looseB=loosePieces(new Chess(m.fen),me).map(x=>x.sq);
 const getsMated=m.mateA!=null&&m.mateA<0;
 if(getsMated)out.push(`It lets your opponent force checkmate${r0?`, starting with ${r0.san}`:""}.`);
 else if(m.mateB!=null&&m.mateB>0)out.push("You had a forced checkmate here, and this move lets it slip.");
 if(r0&&!getsMated){
  if(r0.captured){
   const sq=r0.to,defd=attackers(gA,sq,me).length>0;let s=`Their best answer is ${r0.san}, taking your ${PNAME[r0.captured]} on ${sq}.`;
   if(sq===mv.to)s+=defd?" You moved it to a square where the trade doesn't work out for you.":" You moved it to a square where nothing protects it.";
   else if(looseB.includes(sq))s+=" That piece was already under attack, and your move didn't save it.";
   else if(attackers(new Chess(m.fen),sq,me).some(a=>a.sq===mv.from))s+=` Your ${PNAME[mv.piece]} on ${mv.from} was protecting it, and it moved away.`;
   else if(!defd)s+=" Nothing protects it.";
   out.push(s);
  }else{
   const gR=new Chess(gA.fen());const rr=gR.move(r0.san);const th=threatsOf(gR,rr);
   if(th.length>=2)out.push(`It allows ${r0.san}, which attacks your ${nameList(th)} at the same time. You can't save everything.`);
   else if(th.length===1&&th[0].type!=="k")out.push(`It allows ${r0.san}, which attacks your ${nameList(th)}${th[0].defended?"":", and nothing protects it"}.`);
   else if(r0.san.includes("+"))out.push(`It allows ${r0.san}, with check, and that starts a strong attack.`);
   else out.push(`Their best answer is ${r0.san}.`);
  }
 }
 const sw=swingOf(gA.fen(),ref,me);
 if(sw<=-2&&!getsMated)out.push(`If they play it right, you lose about ${-sw} points of material over the next few moves.`);
 out.push(`After your move, ${evalTxt(m.evA,m.mateA)}${m.mateA!=null&&m.mateA!==0?"":` (${evNum(m.evA,m.mateA)})`}.`);
 return out.join(" ");
}
function whyGood(m,me){
 const best=lineFrom(m.fen,m.bestPv);const b0=best[0];if(!b0)return"";
 const gB=new Chess(m.fen),out=[];
 if(m.mateB!=null&&m.mateB>0)out.push(`${b0.san} starts a forced checkmate in ${m.mateB}.`);
 else{
  if(gB.in_check())out.push(`${b0.san} gets you out of check${b0.piece==="k"?" by moving your king":b0.captured?" by capturing the piece giving check":" by blocking it"}.`);
  if(b0.captured){const defd=attackers(gB,b0.to,me==="w"?"b":"w").length>0,cn=PNAME[b0.captured],pn=PNAME[b0.piece],ck=b0.san.includes("+")?" with check":"";
   const recap=best[1]&&best[1].to===b0.to&&best[1].captured;
   if(!defd)out.push(`${b0.san} wins the ${cn} on ${b0.to}${ck} for free, because nothing protects it.`);
   else if(!recap)out.push(`${b0.san} wins the ${cn} on ${b0.to}${ck}, and your opponent can't safely take back.`);
   else if(AVAL[b0.captured]>AVAL[b0.piece])out.push(`${b0.san} takes the ${cn} on ${b0.to}. Even after they take back, you come out ahead, because your ${pn} is worth less.`);
   else if(AVAL[b0.captured]===AVAL[b0.piece])out.push(`${b0.san} trades your ${pn} for their ${cn} on ${b0.to}.`);
   else out.push(`${b0.san} gives up your ${pn} for their ${cn} on ${b0.to}, on purpose.`)}
  const g1=new Chess(m.fen);const r=g1.move(b0.san);const fk=forkOf(g1,r);
  if(fk)out.push(`${b0.captured?"It also":b0.san} attacks the ${nameList(fk)} at the same time, so your opponent can't save everything.`);
  else if(b0.san.includes("+")&&!b0.captured&&!gB.in_check())out.push(`${b0.san} gives check, so your opponent has to deal with that first.`);
  const L1=loosePieces(g1,me);
  const saved=loosePieces(gB,me).filter(x=>!L1.some(y=>x.sq===b0.from?y.sq===b0.to:y.sq===x.sq));
  if(saved.length&&!b0.captured&&!gB.in_check())out.push(saved[0].sq===b0.from?`${b0.san} moves your attacked ${PNAME[saved[0].type]} to safety.`:`${b0.san} protects your ${PNAME[saved[0].type]} on ${saved[0].sq}, which was under attack.`);
  const sw=swingOf(m.fen,best,me);if(sw>=2)out.push(`Following the engine's line, you come out about ${sw} points ahead.`);
  if(!out.length)out.push(`${b0.san} keeps your pieces safe and improves your position. The gain here is about position, not winning material right away.`);
  const gA=new Chess(m.fen);gA.move(m.san);const r0=lineFrom(gA.fen(),m.refPv,1)[0];
  if(r0&&norm(r0.san)!==norm(b0.san)){const g2=new Chess(m.fen);g2.move(b0.san);const lg=g2.moves({verbose:true}).find(x=>x.from===r0.from&&x.to===r0.to);
   let still=false;if(lg){const g3=new Chess(g2.fen());const x=g3.move(lg);still=(m.mateA!=null&&m.mateA<0)?g3.in_checkmate():!!((x.captured&&AVAL[x.captured]>=3)||forkOf(g3,x))}
   if(!still)out.push(`Unlike ${m.san}, it doesn't hand your opponent ${r0.san}.`)}
 }
 out.push(`With it, ${evalTxt(m.evB,m.mateB)}${m.mateB!=null&&m.mateB!==0?"":` (${evNum(m.evB,m.mateB)})`}.`);
 return out.join(" ");
}
function nextSteps(m,me){
 const best=lineFrom(m.fen,m.bestPv);if(!best.length)return[];
 if(m.mateB!=null&&m.mateB>0)return["Keep playing the forcing moves in this line until it's checkmate. Every move is a check or a capture, so calculate each one before you play it."];
 const g=afterLine(m.fen,best),out=[];
 const loose=loosePieces(g,me);if(loose.length)out.push(`Watch your ${PNAME[loose[0].type]} on ${loose[0].sq}. It's still under attack at the end of this line.`);
 const d=mdiff(g,me);
 if(d>=3)out.push("You'd be ahead in material, so trade pieces (especially queens) and keep everything protected.");
 else if(d<=-3)out.push("You'd still be behind in material, so avoid trades and look for tactics.");
 const rights=g.fen().split(" ")[2],k=g.get(me==="w"?"e1":"e8");
 if(k&&k.type==="k"&&k.color===me&&(me==="w"?/[KQ]/:/[kq]/).test(rights))out.push("Castle soon to get your king safe.");
 const home=me==="w"?{b1:"n",g1:"n",c1:"b",f1:"b"}:{b8:"n",g8:"n",c8:"b",f8:"b"};
 const und=Object.entries(home).filter(([s,t])=>{const p=g.get(s);return p&&p.color===me&&p.type===t}).map(([s,t])=>`${PNAME[t]} on ${s}`);
 if(und.length)out.push(`Bring out your ${und.slice(0,2).join(" and ")} so every piece is working.`);
 const open="abcdefgh".split("").filter(f=>{for(let r=1;r<=8;r++){const p=g.get(f+r);if(p&&p.type==="p")return false}return true});
 const rooks=[];g.board().forEach(row=>row.forEach((p,c)=>{if(p&&p.color===me&&p.type==="r")rooks.push("abcdefgh"[c])}));
 if(open.length&&rooks.length&&!rooks.some(f=>open.includes(f)))out.push(`Put a rook on the open ${open[0]}-file.`);
 if(!out.length)out.push("Keep doing the safety check every move, and improve whichever piece is doing the least.");
 return out.slice(0,3);
}

async function analyse(rec,onProg){
 const g=rec.start?new Chess(rec.start):new Chess();const evals=[];const fens=[g.fen()];const sans=[];
 const tmp=new Chess(g.fen());rec.moves.forEach(m=>{const r=tmp.move(m);sans.push(r);fens.push(tmp.fen())});
 for(let i=0;i<fens.length;i++){const t=new Chess(fens[i]);
  if(t.game_over())evals.push({cp:t.in_checkmate()?-10000:0,mate:null,best:null,pv:[]});
  else{const r=await Engine.search(fens[i],{depth:9});const l=r&&r.lines[0];evals.push({cp:l?cpOf(l):0,mate:l&&l.kind==="mate"?l.v:null,best:r&&r.best,pv:l?l.pv:[]})}
  onProg&&onProg(i+1,fens.length)}
 const moments=[];const types={hung:0,missedTactic:0,allowedMate:0,missedMate:0,other:0};let bl=0,mi=0,ina=0,first=null;
 for(let i=0;i<sans.length;i++){const mv=sans[i];if(mv.color!==rec.color||i<(rec.bookPly||0))continue;
  const before=evals[i].cp,after=-evals[i+1].cp,loss=before-after;
  const cls=loss>=250?"blunder":loss>=120?"mistake":loss>=60?"inaccuracy":null;
  const bg=new Chess(fens[i]);const bestMv=uciToMove(bg,evals[i].best);
  if(bestMv&&norm(bestMv.san)===norm(mv.san))continue;
  if(!cls)continue;
  const ag=new Chess(fens[i+1]);const rep=uciToMove(ag,evals[i+1].best);
  let type="other";
  if(before>=9000&&after<9000)type="missedMate";
  else if(after<=-9000&&before>-9000)type="allowedMate";
  else if(rep&&rep.captured&&PIECE_VAL[rep.captured]>=3)type="hung";
  else if(bestMv&&(bestMv.captured||bestMv.san.includes("+")))type="missedTactic";
  else if(rep&&rep.captured)type="hung";
  if(cls==="blunder"){bl++;types[type]++;if(first===null)first=fullmove(fens[i])}else if(cls==="mistake"){mi++;if(type!=="other")types[type]++}else ina++;
  moments.push({ply:i,fen:fens[i],san:mv.san,from:mv.from,to:mv.to,cls,type,loss,
   best:bestMv?bestMv.san:null,bestFrom:bestMv&&bestMv.from,bestTo:bestMv&&bestMv.to,reply:rep?rep.san:null,
   bestPv:(evals[i].pv||[]).slice(0,10),refPv:(evals[i+1].pv||[]).slice(0,10),
   evB:before,evA:after,mateB:evals[i].mate,mateA:evals[i+1].mate!=null?-evals[i+1].mate:null})}
 return{v:2,blunders:bl,mistakes:mi,inacc:ina,types,first,moments,evals:evals.map(e=>Math.max(-1000,Math.min(1000,e.cp)))};
}

let playTok=0;
async function playLine(board,fen,line,colorFor){const tok=++playTok;const g=new Chess(fen);board.set(g,{last:null});
 for(let k=0;k<line.length;k++){await sleep(800);if(tok!==playTok||!document.contains(board.el))return;const r=g.move(line[k].san);board.applied(r);board.annotate({arrows:[{from:r.from,to:r.to,c:colorFor?colorFor(k,r):"acc"}]})}}
function badTargets(m,me){const gA=new Chess(m.fen);gA.move(m.san);const r0=lineFrom(gA.fen(),m.refPv,1)[0];if(!r0)return{reply:null,sq:[]};
 if(r0.captured)return{reply:r0,sq:[r0.to]};const gR=new Chess(gA.fen());const rr=gR.move(r0.san);return{reply:r0,sq:threatsOf(gR,rr).map(t=>t.sq)}}
function goodTargets(m,me){const b0=lineFrom(m.fen,m.bestPv,1)[0];if(!b0)return{best:null,sq:[]};const sq=[];if(b0.captured)sq.push(b0.to);
 const g1=new Chess(m.fen);const r=g1.move(b0.san);const fk=forkOf(g1,r);if(fk)fk.forEach(t=>{if(!sq.includes(t.sq))sq.push(t.sq)});return{best:b0,sq}}

// A position from one of your games, as a puzzle: find a better move than the one you played.
function trainMoment(host,rec,m,opts={}){
 const me=rec.color,best=lineFrom(m.fen,m.bestPv);
 const cue={hung:"Something is in danger here. Find the safe move.",missedTactic:"There's a way to win material here. Find it.",allowedMate:"Your opponent has a dangerous threat. Stop it.",missedMate:"There's a checkmate here. Find the first move.",other:"Find a stronger move than the one you played."}[m.type];
 host.innerHTML=`<div class="ptop"><span class="pill ${m.cls==="blunder"?"bad":"warn"}">${PAT[m.type].t}</span><div class="side"><i class="${me}"></i>You play ${me==="w"?"White":"Black"}</div></div>
  <p class="prompt">${esc(cue)}</p><p class="muted tsub" style="margin:-6px 0 0;font-size:14px">${opts.label?esc(opts.label)+" · ":""}Your game on ${esc(rec.date)}, move ${fullmove(m.fen)}. You played <span class="nochip">${moveChipHTML(new Chess(m.fen).move(m.san))}</span>.</p>
  <div class="bd"></div><div class="thinking"></div><div class="fb"></div>
  <div class="acts"><button class="btn sm th">Hint</button><button class="btn sm tr">Try again</button><button class="btn sm ts">Show answer</button>${opts.back?'<button class="btn sm tb">← Back</button>':""}<button class="btn sm primary grow tn" hidden></button><button class="btn sm tl" hidden>▶ Show the line</button></div>`;
 const fb=$(".fb",host),th=$(".thinking",host);let g,busy=false,done=false,tries=0;
 const board=new Board($(".bd",host),{canMove:()=>!busy&&!done&&g.turn()===me,onMove:mv=>attempt(mv)});
 const tctx={board:()=>board,fens:()=>[m.fen,g.fen()],color:me};linkChips($(".tsub",host),tctx);
 const say=(k,t,h)=>{setFb(fb,k,t,h);linkChips(fb,tctx)};
 const nextBtn=label=>{const b=$(".tn",host);if(!opts.next){b.hidden=true;return}b.hidden=false;b.textContent=label;b.onclick=opts.next};
 function reset(){playTok++;g=new Chess(m.fen);done=false;busy=false;board.set(g,{flip:me==="b",last:null});th.textContent="";$(".tl",host).hidden=true;
  setCoach(()=>({key:"tm:"+m.fen,title:"From your game: find a better move",board:()=>board,fen:g.fen(),me,puzzle:!done,history:[],extra:`In the real game the learner played ${m.san} here, which was a ${m.cls}. They're trying to find a better move. (Better move, keep secret unless asked: ${m.best||"?"}.)`,quick:["Give me a hint","What should I notice first?","Show me the answer and explain it"]}));
  say("",null,"Play the move you think is best. Start with the safety check: what is attacked, and what is undefended?");nextBtn("Skip →")}
 function reveal(){opts.onReveal&&opts.onReveal();const t=$(".tl",host);t.hidden=!best.length;t.onclick=()=>playLine(board,m.fen,best,(k,r)=>r.color===me?"good":"warn")}
 function win(exact){done=true;m.solved=true;Store.save();
  say("ok",exact?"That's the move":"That works too",`${exact||!best[0]?"":`The engine's top choice was ${moveChipHTML(best[0])}, but yours is about as good. `}${esc(whyGood(m,me))}`);
  reveal();nextBtn("Next →");opts.onResult&&opts.onResult(true,tries)}
 async function attempt(mv){
  const r=g.move(mv);if(!r)return;board.applied(r);tries++;
  if(best[0]&&norm(r.san)===norm(best[0].san))return win(true);
  if(g.in_checkmate())return win(false);
  busy=true;th.textContent="Checking your move…";
  const res=await Engine.search(g.fen(),{depth:11});busy=false;th.textContent="";
  if(!document.contains(board.el))return;
  const myEv=res&&res.lines[0]?-cpOf(res.lines[0]):-10000;const d=m.evB-myEv;
  if(d<70)return win(false);
  const rep=res&&uciToMove(g,res.best);done=true;
  const lr=res&&res.lines[0]?lossReason(g.fen(),res.lines[0].pv,me):null;
  say("no","Not quite",`${lr?`After your move, ${lr.text} `:""}${d>=2000?"That lets the win slip away.":lr&&lr.sq?"":`That's about ${(d/100).toFixed(1)} points worse than the best move.`} Press Try again.`);board.shake();
  if(lr)board.annotate({arrows:[{from:lr.mv.from,to:lr.mv.to,c:"warn"}],rings:lr.sq?[{sq:lr.sq,c:"bad"}]:[]});
  opts.onResult&&opts.onResult(false,tries);
  }
 $(".th",host).onclick=()=>{if(m.bestFrom){board.annotate({rings:[{sq:m.bestFrom,c:"acc"}]});say("",null,"The circled piece has the best move.")}};
 $(".tr",host).onclick=reset;
 $(".ts",host).onclick=()=>{reset();if(!best[0])return;done=true;const gt=goodTargets(m,me);board.annotate({arrows:[{from:best[0].from,to:best[0].to,c:"good"}],rings:gt.sq.map(q=>({sq:q,c:"good"}))});
  say("go","The answer: follow the green arrow",esc(whyGood(m,me)));reveal();nextBtn("Next →")};
 if(opts.back)$(".tb",host).onclick=opts.back;
 reset();
 return {board};
}

function gameMoments(type){const out=[];D().games.forEach(rec=>{if(!rec.review||rec.review.v!==2)return;rec.review.moments.forEach(m=>{if(m.cls==="inaccuracy"||!m.bestPv||!m.bestPv.length)return;if(type&&m.type!==type)return;out.push({rec,m})})});
 return out.sort((a,b)=>(a.m.solved?1:0)-(b.m.solved?1:0)||b.rec.id-a.rec.id)}

function sumHTML(r){return`<div class="sumbox"><div class="eyebrow">Coach's takeaways</div>${r.did_well?`<p><b>Did well:</b> ${esc(r.did_well)}</p>`:""}<ol>${(r.takeaways||[]).map(t=>`<li>${esc(t)}</li>`).join("")}</ol>${r.habit?`<p><b>Next 3 games:</b> ${esc(r.habit)}</p>`:""}</div>`}
function evalGraph(R,rec,key){
 const st=rec.start?rec.start.split(" ")[1]:"w",me=rec.color,W=600,H=96;
 const ev=R.evals.map((e,i)=>{const turn=i%2===0?st:(st==="w"?"b":"w");return Math.max(-800,Math.min(800,turn===me?e:-e))});
 const n=Math.max(1,ev.length-1),x=i=>(i/n*W).toFixed(1),y=e=>(H/2-e/800*(H/2-6)).toFixed(1);
 const pts=ev.map((e,i)=>`${x(i)},${y(e)}`).join(" ");
 const dots=key.map((m,i)=>`<circle class="gdot" data-i="${i}" cx="${x(m.ply+1)}" cy="${y(ev[m.ply+1]||0)}" r="6" fill="${m.cls==="blunder"?"var(--bad)":"var(--warn)"}" stroke="var(--surface)" stroke-width="2"><title>Move ${fullmove(m.fen)}: ${esc(m.san)}</title></circle>`).join("");
 return `<svg class="evgraph" viewBox="0 0 ${W} ${H}" role="img" aria-label="How the advantage changed during the game"><rect x="0" y="0" width="${W}" height="${H/2}" fill="var(--good-soft)" opacity=".5"/><rect x="0" y="${H/2}" width="${W}" height="${H/2}" fill="var(--bad-soft)" opacity=".5"/><line x1="0" x2="${W}" y1="${H/2}" y2="${H/2}" stroke="var(--line)"/><polyline points="${pts}" fill="none" stroke="var(--fg)" stroke-width="2" stroke-linejoin="round"/>${dots}</svg>`;
}

async function reviewView(v,id){
 const rec=D().games.find(x=>x.id===id);if(!rec){go("play");return}
 const me=rec.color;
 v.innerHTML=`<div class="vhead"><div><div class="eyebrow">Game review · ${rec.date} · ${rec.source?`chess.com vs ${esc(rec.opp||"?")}`:`level ${rec.level}`} · ${rec.opening?esc(OP[rec.opening].name):rec.source?"your real game":"normal start"}</div><h1>${rec.score===1?"Win":rec.score===.5?"Draw":"Loss"}: ${esc(rec.why)}</h1></div><button class="btn" id="back">← Back to Play</button></div>
  <div class="grid2"><div style="display:flex;flex-direction:column;gap:14px;min-width:0" id="rl"><div class="card"><div class="eyebrow">Analyzing</div><div class="meter" style="margin-top:10px"><i id="prg" style="width:0%"></i></div><p class="muted" id="prt" style="margin:8px 0 0">The engine is checking every move you played…</p></div></div>
  <aside class="panel sticky first" id="rp"></aside></div>`;
 $("#back").onclick=()=>go("play");
 const startG=()=>rec.start?new Chess(rec.start):new Chess();
 let board,ply=rec.moves.length,inTrainer=false,trainerBoard=null;const curBoard=()=>inTrainer&&trainerBoard?trainerBoard:board;
 function basePanel(){inTrainer=false;$("#rp").innerHTML=`<div class="bd"></div><div class="fb" id="rfb"></div><div class="acts"><button class="btn sm" id="prev">← Move</button><button class="btn sm" id="nextm">Move →</button><button class="btn sm primary grow" id="retry">Play on from here</button></div>`;
  board=new Board($("#rp .bd"),{canMove:()=>false});
  $("#prev").onclick=()=>show(ply-1);$("#nextm").onclick=()=>show(ply+1);$("#retry").onclick=()=>playFrom(ply)}
 const ensureBase=()=>{if(inTrainer||!document.contains(board.el))basePanel()};
 function show(p){ensureBase();playTok++;ply=Math.max(0,Math.min(rec.moves.length,p));const g=startG();let last=null;rec.moves.slice(0,ply).forEach(m=>last=g.move(m));board.set(g,{flip:me==="b",last});
  setFb($("#rfb"),"",null,`Position after move ${Math.ceil(ply/2)} of ${Math.ceil(rec.moves.length/2)}. Use the arrows to step through the game.`)}
 function playFrom(p){const g=startG();rec.moves.slice(0,p).forEach(m=>g.move(m));if(g.turn()!==me&&p>0)g.undo();go("play",{fen:g.fen(),color:me,from:rec.id})}
 basePanel();show(rec.moves.length);
 if(!rec.review||rec.review.v!==2){
  if(!Engine.ok){$("#prt").textContent="The engine couldn't load in this view, so the review isn't available here.";return}
  rec.review=await analyse(rec,(a,b)=>{const p=$("#prg");if(p)p.style.width=(a/b*100)+"%";const t=$("#prt");if(t)t.textContent=`Checking position ${a} of ${b}…`});Store.save()}
 if(!$("#rl"))return;
 const R=rec.review;let key=R.moments.filter(m=>m.cls!=="inaccuracy");const onlyInacc=!key.length&&R.moments.length;if(onlyInacc)key=R.moments.slice();
 let filter=null,cur=-1;const revealed=new Set();
 const counts={};key.forEach(m=>counts[m.type]=(counts[m.type]||0)+1);
 const chips=Object.keys(PAT).filter(k=>counts[k]).map(k=>`<button class="chip bad" data-k="${k}">${PAT[k].t} · ${counts[k]}</button>`).join("");
 $("#rl").innerHTML=`<div class="card"><div class="stats" style="margin:0"><div class="stat"><b>${R.blunders}</b><span>Blunders</span></div><div class="stat"><b>${R.mistakes}</b><span>Mistakes</span></div><div class="stat"><b>${R.inacc}</b><span>Inaccuracies</span></div><div class="stat"><b>${R.first?R.first:"–"}</b><span>First blunder, move</span></div></div>
   ${chips?`<div class="chips"><button class="chip on" data-k="">All · ${key.length}</button>${chips}</div><p class="muted" style="margin:8px 0 0;font-size:13.5px">Click a mistake type to practice those positions: find what you should have played.</p>`:`<p style="margin:12px 0 0">${onlyInacc?"No blunders or mistakes, only small inaccuracies.":"No mistakes. That's the habit working."}</p>`}
   <div class="coachonly csum" id="csum">${rec.coachSum?sumHTML(rec.coachSum):`<button class="btn sm primary" id="csumb">Get the coach's takeaways</button>`}</div>
   ${rec.coachSaves?`<p class="muted" style="margin:10px 0 0;font-size:14px">Coach mode stopped ${rec.coachSaves} blunder${rec.coachSaves>1?"s":""} before you played ${rec.coachSaves>1?"them":"it"}. The goal is to catch those yourself.</p>`:""}</div>
  <div class="card"><div class="eyebrow">How the game went</div>${evalGraph(R,rec,key)}<p class="muted" style="margin:4px 0 0;font-size:13px">Above the middle line you're better, below it your opponent is. Dots are your mistakes; click one to open it.</p></div>
  ${key.length?`<div class="card" id="detail"></div>`:""}
  <div class="card"><div class="eyebrow">Key moments</div><div class="moments" id="mlist" style="margin-top:10px"></div></div>`;

 const sb=$("#csumb");if(sb)sb.onclick=async()=>{sb.disabled=true;sb.textContent="The coach is reading the game…";const r=await coachSummary(rec);
  if(r.error){sb.disabled=false;sb.textContent="Get the coach's takeaways";$("#csum").insertAdjacentHTML("beforeend",`<p class="muted">${esc(r.error)}</p>`);return}
  rec.coachSum=r;Store.save();$("#csum").innerHTML=sumHTML(r)};
 function lineBtns(fen,line,tag){return line.map((x,k)=>`<button class="lm${tag==="ref"&&k===0?" mine":""}" data-l="${tag}" data-k="${k}" title="${esc(x.san)}">${moveFace(x)}</button>`).join("")}
 const lineCol=(tag,k,r)=>tag==="best"?(r.color===me?"good":"warn"):(k===0?"bad":r.color===me?"acc":"warn");
 function renderList(){
  const items=key.map((m,i)=>({m,i})).filter(x=>!filter||x.m.type===filter);
  $("#mlist").innerHTML=items.length?items.map(({m,i})=>`<button class="moment${i===cur?" on":""}" data-i="${i}"><span class="pill ${m.cls==="blunder"?"bad":"warn"}">${m.cls}</span><span><b class="mhead">Move ${fullmove(m.fen)}: <span class="mvchip">${moveFace(new Chess(m.fen).move(m.san))}</span>${m.solved?' <span class="fixed">✓ fixed</span>':""}</b><p>${esc(PAT[m.type].t)}. Click to see why.</p></span></button>`).join(""):'<p class="muted" style="margin:0">Nothing big to fix. Try the next level up.</p>';
  $$(".moment",$("#mlist")).forEach(b=>b.onclick=()=>openMoment(+b.dataset.i,false));
 }
 function renderDetail(i,practice){
  const m=key[i],el=$("#detail");if(!el)return;
  const best=lineFrom(m.fen,m.bestPv);const userMv=new Chess(m.fen).move(m.san);const gA=new Chess(m.fen);gA.move(m.san);
  const ref=[userMv,...lineFrom(gA.fen(),m.refPv,7)];
  const show=!practice||revealed.has(i);const L=LESSONS.find(l=>l.id===PAT[m.type].lesson);
  el.innerHTML=`<div class="dhead"><div style="min-width:0"><div class="eyebrow">Move ${fullmove(m.fen)} · ${m.cls} · ${PAT[m.type].t}</div><h3 style="margin-top:4px">${show&&best[0]?`You played ${esc(m.san)}. Better was ${esc(best[0].san)}.`:`You played ${esc(m.san)}. Find a better move on the board.`}</h3></div>
    <div class="evbar"><span class="pill good" title="With the best move">Best ${evNum(m.evB,m.mateB)}</span><span class="pill bad" title="After your move">Yours ${evNum(m.evA,m.mateA)}</span></div></div>
   <div class="why bad"><span class="eyebrow">Why your move was worse</span><p>${esc(whyBad(m,me))}</p>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-see="bad">See it on the board</button></div>
    <div class="line"><span class="lab">What happens after it (tap a move):</span>${lineBtns(m.fen,ref,"ref")}<button class="btn sm" data-play="ref">▶ Play it</button></div></div>
   ${show&&best.length?`<div class="why good"><span class="eyebrow">Why the better move works</span><p>${esc(whyGood(m,me))}</p>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-see="good">See it on the board</button></div>
    <div class="line"><span class="lab">The better line (tap a move):</span>${lineBtns(m.fen,best,"best")}<button class="btn sm" data-play="best">▶ Play it</button></div></div>
    <div class="why next"><span class="eyebrow">Next steps from there</span><ul>${nextSteps(m,me).map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>`
   :`<div class="why good"><span class="eyebrow">The better move</span><p class="muted">Hidden until you solve it or press Show answer under the board.</p></div>`}
   <div class="row" style="margin-top:16px"><button class="btn coachonly" id="dask">Ask the coach about this</button>${practice&&!revealed.has(i)?"":`<button class="btn primary" id="dtry">${m.solved?"Practice it again":"Find the better move yourself"}</button>`}${L?`<button class="btn" id="dles">Lesson: ${esc(L.title)}</button>`:""}<button class="btn" id="dplay">Play on from here</button></div>`;
  const lines={ref:{fen:m.fen,line:ref},best:{fen:m.fen,line:best}};
  linkChips(el,{board:curBoard,fens:()=>[m.fen,gA.fen()],color:me});
  const rfb=(k,t,h)=>{setFb($("#rfb"),k,t,h);linkChips($("#rfb"),{board:curBoard,fens:()=>[board.g.fen(),m.fen],color:me})};
  $$(".lm",el).forEach(b=>b.onclick=()=>{ensureBase();playTok++;const tag=b.dataset.l,{fen,line}=lines[tag],k=+b.dataset.k;const g=new Chess(fen);let last=null;line.slice(0,k+1).forEach(x=>last=g.move(x.san));
   board.set(g,{flip:me==="b",last});board.annotate({arrows:[{from:last.from,to:last.to,c:lineCol(tag,k,last)}]});$$(".lm",el).forEach(x=>x.classList.toggle("on",x===b));
   rfb(tag==="best"?"ok":"warn",`Move ${k+1} of ${line.length}`,`${moveChipHTML(last)} ${tag==="best"?"in the line the engine recommends.":k===0?"is the move you played.":"is what follows after your move."}`)});
  $$("[data-play]",el).forEach(b=>b.onclick=()=>{ensureBase();const tag=b.dataset.play,{fen,line}=lines[tag];
   rfb(tag==="best"?"ok":"warn",tag==="best"?"Playing the better line":"Playing what happens after your move",tag==="best"?"Green arrows are your moves, orange arrows are your opponent's.":"Red arrow is your move, orange arrows are your opponent's.");playLine(board,fen,line,(k,r)=>lineCol(tag,k,r))});
  $$("[data-see]",el).forEach(b=>b.onclick=()=>{ensureBase();playTok++;
   if(b.dataset.see==="bad"){const t=badTargets(m,me);board.set(gA,{flip:me==="b",last:userMv});board.annotate({arrows:t.reply?[{from:t.reply.from,to:t.reply.to,c:"warn"}]:[],rings:t.sq.map(q=>({sq:q,c:"bad"}))});
    rfb("warn","After your move",`Yellow squares: the move you played. ${t.reply?`Orange arrow: their best answer, ${moveChipHTML(t.reply)}.`:""} ${t.sq.length?"Red circles: what it attacks.":""}`)}
   else{const t=goodTargets(m,me);board.set(new Chess(m.fen),{flip:me==="b",last:null});board.annotate({arrows:t.best?[{from:t.best.from,to:t.best.to,c:"good"}]:[],rings:t.sq.map(q=>({sq:q,c:"good"}))});
    rfb("ok","The better move",`Green arrow: ${t.best?moveChipHTML(t.best):"the better move"}. ${t.sq.length?"Green circles: what it goes after.":""}`)}
   if(window.innerWidth<1080)$("#rp").scrollIntoView({behavior:"smooth",block:"center"})});
  if($("#dtry",el))$("#dtry",el).onclick=()=>openMoment(i,true);
  $("#dask",el).onclick=()=>openCoach(show?"Explain simply why my move was a mistake, and what habit would have caught it.":"Give me a hint for this position without telling me the move.");
  if($("#dles",el))$("#dles",el).onclick=()=>{D().current=L.id;Store.save();go("learn")};
  $("#dplay",el).onclick=()=>playFrom(m.ply);
 }
 function viewMoment(i){
  ensureBase();playTok++;const m=key[i];const g=new Chess(m.fen);board.set(g,{flip:me==="b",last:null});
  board.annotate({arrows:[{from:m.from,to:m.to,c:"bad"}].concat(m.bestFrom?[{from:m.bestFrom,to:m.bestTo,c:"good"}]:[])});
  setFb($("#rfb"),"warn","Red arrow: your move",m.best?"Green arrow: the better move. Hover or tap any piece or square named on the left to find it here.":"")}
 function openMoment(i,practice){
  cur=i;renderList();renderDetail(i,practice);
  {const m=key[i];setCoach(()=>({key:"rv:"+rec.id+":"+i,title:`Review: move ${fullmove(m.fen)}, you played ${m.san}`,board:curBoard,fen:m.fen,me,history:rec.moves.slice(0,m.ply),puzzle:practice&&!revealed.has(i),
   extra:`In this ${rec.source?"real chess.com":"practice"} game the learner played ${m.san} here, a ${m.cls}. ${practice&&!revealed.has(i)?"They are now trying to find the better move themselves, so hint, don't tell.":`The engine's better move: ${m.best}. App's analysis: ${whyBad(m,me)} ${whyGood(m,me)}`}`,
   quick:practice&&!revealed.has(i)?["Give me a hint","What should I notice first?"]:["Why was my move a mistake?","What should I have noticed?","What's the plan after the better move?"]}))}
  if(practice){inTrainer=true;const m=key[i];
   trainerBoard=trainMoment($("#rp"),rec,m,{back:()=>{basePanel();openMoment(i,false)},onReveal:()=>{revealed.add(i);renderDetail(i,true);renderList()},
    next:(()=>{const rest=key.map((x,j)=>j).filter(j=>j!==i&&(!filter||key[j].type===filter)&&j>i);return rest.length?()=>openMoment(rest[0],true):null})()}).board;
  }else viewMoment(i);
  if(window.innerWidth<1080)$("#rp").scrollIntoView({behavior:"smooth",block:"start"});
 }
 $$(".chip",$("#rl")).forEach(c=>c.onclick=()=>{filter=c.dataset.k||null;$$(".chip",$("#rl")).forEach(x=>x.classList.toggle("on",x===c));
  const first=key.findIndex(m=>!filter||m.type===filter);if(first<0)return;
  if(filter){const unsolved=key.findIndex(m=>m.type===filter&&!m.solved);openMoment(unsolved>=0?unsolved:first,true)}else openMoment(first,false)});
 $$(".gdot",$("#rl")).forEach(d=>d.onclick=()=>openMoment(+d.dataset.i,false));
 renderList();if(key.length)openMoment(0,false);
}

/* ---------------- PROGRESS ---------------- */
function vProgress(v){
 const d=D(),gs=d.games,rev=gs.filter(g=>g.review);const W=gs.filter(g=>g.score===1).length,Lo=gs.filter(g=>g.score===0).length,Dr=gs.length-W-Lo;
 const{t,games}=patternTotals(20);const mx=Math.max(1,...Object.values(t));
 const bl=rev.slice(-20).map(g=>g.review.blunders);const sp=bl.length>1?bl.map((b,i)=>`${i/(bl.length-1)*300},${56-Math.min(6,b)/6*52}`).join(" "):"";
 const r=d.rating;let bricks="";for(let i=0;i<16;i++){const lo=700+i*50;bricks+=`<div class="brk${r>lo?" on":""}${d.peak>=lo&&d.peak<lo+50?" peak":""}${[1000,1200,1400].includes(lo+50)?" ms":""}" title="${lo}–${lo+50}"></div>`}
 const linesKnown=Object.values(d.lines).filter(x=>x.box>=2).length;
 v.innerHTML=`<div class="vhead"><div><div class="eyebrow">Your progress</div><h1>Road to 1000, then beyond</h1><p>Milestones at 1000, 1200 and 1400. Update your chess.com 10-minute rating whenever it changes.</p></div></div>
  <div class="card" style="margin-bottom:20px"><div class="row" style="justify-content:space-between"><div class="eyebrow">Chess.com rating</div><label class="row" style="font-size:14px;font-weight:700">Current <input type="number" id="rt" value="${r}" min="100" max="3000" style="width:90px"></label></div>
   <div class="bricks" style="margin-top:12px">${bricks}</div><div class="brk-scale"><span>700</span><span>1000</span><span>1200</span><span>1500</span></div>
   <p class="muted" style="margin:8px 0 0;font-size:13px">Each brick is 50 points. The outlined brick is your best so far (${d.peak}). Underlined bricks are milestones.</p></div>
  <div class="stats">
   <div class="card stat"><b>${LESSONS.filter(lessonDone).length}/${LESSONS.length}</b><span>Lessons done</span></div>
   <div class="card stat"><b>${TACTIC_IDS.filter(id=>d.solved[id]).length}/${TACTIC_IDS.length}</b><span>Puzzles solved</span></div>
   <div class="card stat"><b>${linesKnown}/${OPEN.length}</b><span>Opening lines memorized</span></div>
   <div class="card stat"><b>${d.rush.best}</b><span>Puzzle Rush best</span></div>
   <div class="card stat"><b>${W}–${Dr}–${Lo}</b><span>Practice games W–D–L</span></div>
   <div class="card stat"><b>${streak()}</b><span>Day streak</span></div></div>
  <div class="grid2"><div style="display:flex;flex-direction:column;gap:14px;min-width:0">
   <div class="card"><div class="eyebrow">Your mistake patterns · last ${games} reviewed games</div>${games?Object.keys(t).map(k=>`<button class="pat patb" data-k="${k}" ${t[k]?"":"disabled"}><span>${PAT[k].t}</span><span class="barw"><i style="width:${t[k]/mx*100}%"></i></span><b>${t[k]}</b></button>`).join(""):'<p class="muted" style="margin:6px 0 0">Play and review a practice game to start tracking.</p>'}
    ${games?`<p class="muted" style="font-size:14px;margin:10px 0 0">The longest bar is what's costing you the most games. Click a bar to practice those exact positions from your games.</p>`:""}</div>
   <div class="card"><div class="eyebrow">Blunders per game · trend</div>${sp?`<svg class="spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-label="Blunders per game"><line x1="0" y1="56" x2="300" y2="56" stroke="var(--line)"/><polyline points="${sp}" fill="none" stroke="var(--brick)" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg><p class="muted" style="margin:4px 0 0;font-size:13px">Lower is better. Goal: zero blunders in most games.</p>`:'<p class="muted" style="margin:6px 0 0">Shows up after two reviewed games.</p>'}</div>
   <div class="card"><div class="eyebrow">Free resources worth your time</div><div class="res" style="margin-top:10px">${window.RESOURCES.map(x=>`<a href="${x.u}" target="_blank" rel="noopener" class="card" style="box-shadow:none"><b>${esc(x.t)} ↗</b><p>${esc(x.d)}</p></a>`).join("")}</div></div>
  </div><aside class="panel"><div class="coachonly" style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">About you (the coach reads this)</div>
   <textarea id="about" rows="4">${esc(aboutMe())}</textarea>
   <label class="fld">chess.com username<input id="uname" value="${esc(d.username||"Freakhail")}" style="background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:8px 10px"></label>
   <div class="eyebrow" style="margin-top:8px">Blind spots the coach has noticed</div>${(d.blind||[]).length?`<ul class="blist">${d.blind.map((b,i)=>`<li><b>${esc(b.tag)}</b> <span class="pill">${b.n}×</span> <button class="linkbtn" data-rm="${i}">Remove</button></li>`).join("")}</ul>`:'<p class="muted" style="margin:0;font-size:14px">None yet. They appear as you ask the coach questions, think out loud, and get game takeaways.</p>'}</div>
   <div class="eyebrow" style="margin-top:12px">How the levels work</div>
   <p style="margin:0;font-size:14.5px">Three wins in a row at a level unlocks a button to move up. Three losses in a row offers a step down. Current level: <b>${LEVELS[d.level-1].label} (${LEVELS[d.level-1].elo})</b>. The ratings are rough estimates of a chess.com 10-minute player.</p>
   <div class="eyebrow" style="margin-top:8px">Weekly check-in with Claude</div><p style="margin:0;font-size:14.5px">Once a week, ask Claude to "review my last chess.com games." It reads your real games and adds lessons for whatever keeps going wrong.</p></aside></div>`;
 $$(".patb",v).forEach(b=>b.onclick=()=>go("puzzles",{fromGames:b.dataset.k}));
 if($("#about"))$("#about").onchange=e=>{d.about=e.target.value.trim();Store.save()};
 if($("#uname"))$("#uname").onchange=e=>{d.username=e.target.value.trim();Store.save()};
 $$("[data-rm]",v).forEach(b=>b.onclick=()=>{d.blind.splice(+b.dataset.rm,1);Store.save();vProgress(v)});
 $("#rt").onchange=e=>{const n=+e.target.value;if(n>0){d.rating=n;if(n>d.peak)d.peak=n;Store.save();vProgress(v)}};
}

/* ---------------- AI coach (Claude) ---------------- */
// Same approach as Padayon's tutor: Claude answers inside the page, every call carries the
// position facts and engine lines so it never has to guess, and replies come back as JSON
// so the page can draw the coach's arrows on the board and save blind spots.
let samplerP=null;let COACH_OK=false;
function sampler(){return Promise.resolve(null)} // AI coach switched off
const COLW={green:"good",red:"bad",orange:"warn",blue:"acc"};
const SQ_RE=/^[a-h][1-8]$/;
function sampleErr(e){const c=e&&e.code;return c==="rate_limited"?"The coach is busy or you've hit a usage limit. Try again in a minute.":c==="not_granted"||c==="sampling_disabled"?"The coach needs permission to ask Claude. Reload the page and allow it.":c==="invalid_json"?"The coach's answer came back garbled. Ask again.":c==="cancelled"?"Stopped.":c==="session_expired"?"Sign in to Claude again, then retry.":"The coach couldn't answer just now. Try again."}
function aboutMe(){const d=D();return d.about||"About 775 on chess.com 10-minute games (username Freakhail). Still learning the square names. Tends to hang pieces and miss the opponent's threats while attacking."}
function piecesInWords(g){const out={w:[],b:[]};g.board().forEach((row,r)=>row.forEach((p,c)=>{if(p)out[p.color].push(`${PWORD[p.type]} ${"abcdefgh"[c]}${8-r}`)}));return`White: ${out.w.join(", ")}\nBlack: ${out.b.join(", ")}`}
async function positionFacts(fen,me){
 const g=new Chess(fen),turn=g.turn(),sideName=c=>c==="w"?"White":"Black";
 const r=await Engine.search(fen,{depth:12,multipv:3});
 const lines=(r&&r.lines||[]).slice(0,3).map((l,i)=>{const ln=lineFrom(fen,l.pv,6);const v=cpOf(l)*(turn===me?1:-1);
  const ev=l.kind==="mate"?(l.v>0===(turn===me)?`learner can force mate in ${Math.abs(l.v)}`:`opponent can force mate in ${Math.abs(l.v)}`):`${v>0?"+":""}${(v/100).toFixed(1)} for the learner`;
  return`${i+1}. ${ln.map(m=>m.san).join(" ")}  (${ev})`});
 const loose=c=>loosePieces(g,c).map(x=>`${PWORD[x.type]} ${x.sq} (attacked ${x.a}x, defended ${x.d}x)`).join("; ")||"none";
 const mv=g.moves({verbose:true});
 return{text:`Position (FEN): ${fen}
${sideName(turn)} to move. The learner plays ${sideName(me)}.
${piecesInWords(g)}
${g.in_check()?sideName(turn)+" is in check.\n":""}Engine's top lines (trust these, they are computed):
${lines.join("\n")||"(engine unavailable)"}
Under-protected pieces: White: ${loose("w")}. Black: ${loose("b")}.
Checks available to ${sideName(turn)}: ${mv.filter(m=>m.san.includes("+")).map(m=>m.san).join(", ")||"none"}.
Captures available to ${sideName(turn)}: ${mv.filter(m=>m.captured).map(m=>m.san).join(", ")||"none"}.`,best:r&&r.best?uciToMove(g,r.best):null}
}
const COACH_STYLE=`How to write:
- Plain, friendly English for an adult beginner. Short sentences. 2 to 5 sentences unless asked for more.
- The learner doesn't know square names well yet. Always say the piece AND the square together ("your knight on e4", "their queen on d1"). Write moves in standard notation (Nf3, Bxf7+, O-O); the app turns them into clickable pictures and arrows.
- Only mention moves that appear in the engine lines or the legal captures/checks above. Never invent a move. Don't quote engine numbers unless asked; say "about a piece", "about a pawn".
- Teach the habit, not just the answer: what to ask yourself next time (their threats first, then checks, captures, attacks).`;
const COACH_JSON=`Reply with JSON only:
{"reply":"your answer",
 "arrows":[{"from":"e2","to":"e4","color":"green|red|orange|blue"}],
 "circles":[{"sq":"e4","color":"green|red|orange|blue"}],
 "blind_spot":"if this exchange shows a recurring weakness, a 3-8 word label for it (e.g. 'misses queen attacks on long diagonals'), else empty string"}
Use green for good moves, red for the learner's mistakes or pieces in danger, orange for the opponent's ideas, blue for squares to notice. At most 3 arrows and 3 circles.`;
function cleanAnn(r){const ok=x=>x&&SQ_RE.test(x.from||"")&&SQ_RE.test(x.to||"");return{arrows:(r.arrows||[]).filter(ok).slice(0,3).map(a=>({from:a.from,to:a.to,c:COLW[a.color]||"acc"})),rings:(r.circles||[]).filter(x=>x&&SQ_RE.test(x.sq||"")).slice(0,3).map(x=>({sq:x.sq,c:COLW[x.color]||"acc"}))}}
function addBlind(tag,fen,me,best){
 tag=String(tag||"").trim().replace(/[.]+$/,"");if(tag.length<4||tag.length>80)return;
 const d=D();d.blind=d.blind||[];const k=tag.toLowerCase();let b=d.blind.find(x=>x.k===k);
 if(!b){b={k,tag,n:0,ex:[]};d.blind.push(b)}b.n++;b.last=dayKey();
 if(fen&&best&&fen.split(" ")[1]===me&&!b.ex.some(e=>e.fen===fen)){b.ex.push({fen,me,best:best.san});b.ex=b.ex.slice(-6)}
 d.blind.sort((a,b2)=>b2.n-a.n);d.blind=d.blind.slice(0,30);Store.save();
}

// The chat drawer. Views register what's on their main board with setCoach().
let COACH_CTX=null;const THREADS={};let coachBusy=null;
function setCoach(fn){COACH_CTX=fn;const fb=$("#coachfab");if(fb)fb.hidden=!fn||COACH_OK===false;drawCoach()}
function coachDrawer(){
 let el=$("#coach");if(el)return el;
 el=document.createElement("aside");el.id="coach";el.className="coach";el.hidden=true;el.setAttribute("aria-label","Coach");
 el.innerHTML=`<div class="chead"><div style="min-width:0"><div class="eyebrow">Ask the coach</div><b id="ctitle"></b></div><button class="btn sm" id="cclose" aria-label="Close coach">Close</button></div>
  <div class="cbody" id="cbody"></div>
  <div class="cquick" id="cquick"></div>
  <div class="cfoot"><textarea id="cinput" rows="2" placeholder="Ask about this position…"></textarea><div class="row"><button class="btn primary" id="csend">Ask</button><button class="btn sm" id="cstop" hidden>Stop</button></div></div>`;
 document.body.appendChild(el);
 $("#cclose").onclick=()=>{el.hidden=true;document.body.classList.remove("coach-open")};
 const inp=$("#cinput");inp.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#csend").click()}};
 $("#csend").onclick=()=>{const t=inp.value.trim();if(!t)return;inp.value="";coachAsk(t)};
 $("#cstop").onclick=()=>{if(coachBusy)coachBusy.abort()};
 return el;
}
function openCoach(question){
 if(!COACH_CTX)return;const el=coachDrawer();el.hidden=false;document.body.classList.add("coach-open");
 drawCoach();if(question)coachAsk(question);else setTimeout(()=>$("#cinput")&&$("#cinput").focus(),50);
}
function drawCoach(){
 const el=$("#coach");if(!el||el.hidden)return;if(!COACH_CTX){$("#ctitle").textContent="Open a board to ask about it";$("#cbody").innerHTML='<p class="muted" style="margin:0">The coach answers questions about the board on screen. Open a puzzle, an opening, a game or a review.</p>';$("#cquick").innerHTML="";return}const c=COACH_CTX();const th=THREADS[c.key]||(THREADS[c.key]=[]);
 $("#ctitle").textContent=c.title;
 const body=$("#cbody");
 body.innerHTML=(th.length?"":`<p class="muted" style="margin:0;font-size:14.5px">Ask anything about the position on the board: what they're threatening, why a move is good or bad, or what to look for. The coach sees the board and the engine's analysis, and draws its answer on the board.</p>`)+
  th.map((m,i)=>m.role==="me"?`<div class="cmsg me">${esc(m.text)}</div>`:`<div class="cmsg them" data-i="${i}">${m.html||esc(m.text)}${m.ann&&(m.ann.arrows.length||m.ann.rings.length)?`<button class="linkbtn" data-show="${i}">Show on board</button>`:""}</div>`).join("")+
  (coachBusy?`<div class="cmsg them muted">Thinking…</div>`:"");
 $$(".cmsg.them",body).forEach(b=>linkChips(b,{board:c.board,fens:()=>[c.fen],color:c.me}));
 $$("[data-show]",body).forEach(b=>b.onclick=()=>{const m=th[+b.dataset.show];const bd=c.board&&c.board();if(bd&&document.contains(bd.el)){bd.annotate(m.ann);if(window.innerWidth<1080)bd.el.scrollIntoView({behavior:"smooth",block:"center"})}});
 body.scrollTop=body.scrollHeight;
 const q=c.quick||["What are they threatening?","What should I look for here?","What's the best move, and why?"];
 $("#cquick").innerHTML=q.map(t=>`<button class="chip" data-q="${esc(t)}">${esc(t)}</button>`).join("");
 $$("#cquick [data-q]").forEach(b=>b.onclick=()=>coachAsk(b.dataset.q));
 $("#csend").disabled=!!coachBusy;$("#cstop").hidden=!coachBusy;
}
async function coachAsk(question){
 if(coachBusy||!COACH_CTX)return;const c=COACH_CTX();const th=THREADS[c.key]||(THREADS[c.key]=[]);
 th.push({role:"me",text:question});coachBusy=new AbortController();drawCoach();
 const s=await sampler();
 if(!s){th.push({role:"them",text:"The AI coach is switched off in this version."});coachBusy=null;drawCoach();return}
 try{
  const facts=await positionFacts(c.fen,c.me);
  const hist=th.slice(-8,-1).map(m=>(m.role==="me"?"Learner: ":"Coach: ")+m.text).join("\n");
  const prompt=`You are a patient chess coach for one learner. About the learner: ${aboutMe()}
Their recurring blind spots so far: ${(D().blind||[]).slice(0,5).map(b=>b.tag).join("; ")||"none recorded yet"}.

Where they are in the app: ${c.title}
${c.extra?c.extra+"\n":""}${c.history&&c.history.length?`Moves so far: ${c.history.join(" ")}\n`:""}
${facts.text}

${hist?"Conversation so far:\n"+hist+"\n":""}The learner asks: "${question}"

${c.puzzle?"They are solving a puzzle. Give a hint that points at the idea (which piece, what to look at) and do NOT reveal the answer move unless they explicitly ask for the answer.\n":""}${COACH_STYLE}

${COACH_JSON}`;
  const r=await s.json(prompt,{cache:false,signal:coachBusy.signal});
  const ann=cleanAnn(r||{});const text=String((r&&r.reply)||"").trim()||"I don't have a good answer for that one.";
  th.push({role:"them",text,html:esc(text).replace(/\n+/g,"<br><br>"),ann});
  const bd=c.board&&c.board();if(bd&&document.contains(bd.el)&&(ann.arrows.length||ann.rings.length))bd.annotate(ann);
  if(r&&r.blind_spot)addBlind(r.blind_spot,c.fen,c.me,facts.best);
 }catch(e){th.push({role:"them",text:sampleErr(e)})}
 coachBusy=null;drawCoach();
}

// Think out loud: grade the learner's written reasoning for one move (Padayon's "Grade me", for chess).
async function gradeThinking({fenBefore,move,said,me,lastMove}){
 const s=await sampler();if(!s)return{error:"The AI coach is switched off in this version."};
 try{
  const facts=await positionFacts(fenBefore,me);
  const g=new Chess(fenBefore);const mv=g.move(move.san);const after=await Engine.search(g.fen(),{depth:11});
  const lr=after&&after.lines[0]?lossReason(g.fen(),after.lines[0].pv,me):null;
  const before=facts.best;const evB=await Engine.search(fenBefore,{depth:11});
  const loss=evB&&evB.lines[0]&&after&&after.lines[0]?cpOf(evB.lines[0])+cpOf(after.lines[0]):0;
  const prompt=`You grade a chess learner's thinking, the way a language tutor grades someone speaking out loud. About the learner: ${aboutMe()}
Before moving, they wrote what they were thinking. Grade the THINKING, not just the move: did they notice what the opponent's last move${lastMove?` (${lastMove})`:""} threatened, did they check their own pieces' safety, and does their reason for the move hold up?

${facts.text}

They played: ${mv.san}. It ${loss>=250?"is a serious mistake":loss>=120?"is a mistake":loss>=60?"is slightly inaccurate":"is fine (about as good as the best move)"}${before&&before.san!==mv.san?`; the engine's top move was ${before.san}`:""}.${lr&&lr.sq?` After it, the opponent's best answer is ${lineFrom(g.fen(),after.lines[0].pv,1)[0].san}.`:""}
What they wrote: "${said}"

${COACH_STYLE}

Reply with JSON only:
{"score":0-100,"verdict":"sharp"|"partly"|"missed",
 "saw_threat":true|false,
 "feedback":"2-4 sentences: what their thinking got right, then the single most useful thing they missed",
 "better_thought":"one sentence they could have said to themselves that leads to the right idea",
 "arrows":[{"from":"e2","to":"e4","color":"green|red|orange|blue"}],
 "circles":[{"sq":"e4","color":"green|red|orange|blue"}],
 "blind_spot":"3-8 word label if they missed something, else empty string"}
"sharp" = saw the key threat and the move/reason hold up. "partly" = some of it right. "missed" = missed the main threat or the reason is wrong.`;
  const r=await s.json(prompt,{cache:false});
  if(r&&r.blind_spot)addBlind(r.blind_spot,fenBefore,me,before);
  return{...r,ann:cleanAnn(r||{})};
 }catch(e){return{error:sampleErr(e)}}
}
function thinkCard(r,san){
 if(r.error)return`<div class="fb warn">${fbHTML("warn","Coach unavailable",esc(r.error))}</div>`;
 const sc=Math.max(0,Math.min(100,+r.score||0)),k=r.verdict==="sharp"?"ok":r.verdict==="partly"?"go":"no";
 return`<div class="thinkres fb ${k}"><span class="ic score">${sc}</span><div><b>${r.verdict==="sharp"?"Sharp thinking":r.verdict==="partly"?"Partly there":"Missed something"} · ${esc(san)}</b>${esc(r.feedback||"")}${r.better_thought?`<div class="better"><span class="eyebrow">Say this to yourself next time</span>${esc(r.better_thought)}</div>`:""}</div></div>`;
}

// Whole-game takeaways for a review.
async function coachSummary(rec){
 const s=await sampler();if(!s)return{error:"The AI coach is switched off in this version."};
 const R=rec.review,me=rec.color;
 const ms=R.moments.filter(m=>m.cls!=="inaccuracy").slice(0,6).map(m=>`Move ${fullmove(m.fen)}: played ${m.san} (${m.cls}, ${PAT[m.type].t}). Better: ${m.best||"?"}. ${whyBad(m,me).replace(/\s*After your move,.*$/,"")}`).join("\n");
 const prompt=`You are a chess coach summarizing one game for a learner. About the learner: ${aboutMe()}
Game: learner played ${me==="w"?"White":"Black"}${rec.opp?` against ${rec.opp}`:""}. Result: ${rec.score===1?"win":rec.score===.5?"draw":"loss"} (${rec.why}).
Moves: ${rec.moves.join(" ")}
Engine-checked mistakes:
${ms||"none"}
Their recurring blind spots so far: ${(D().blind||[]).slice(0,5).map(b=>b.tag).join("; ")||"none recorded yet"}.

${COACH_STYLE}

Reply with JSON only:
{"did_well":"one sentence about something they did well",
 "takeaways":["up to 3 short, concrete lessons from THIS game, most important first"],
 "habit":"one habit to practice in the next 3 games",
 "blind_spots":["0-3 labels of 3-8 words for recurring weaknesses this game shows"]}`;
 try{const r=await s.json(prompt,{cache:false});(r.blind_spots||[]).forEach(t=>addBlind(t));return r}catch(e){return{error:sampleErr(e)}}
}

/* ---------------- boot ---------------- */
(async()=>{await Store.init();LABELS=D().labels!==false;const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h))route=h;render();setTimeout(()=>Engine.start(),800);
 COACH_OK=false;document.body.classList.add("nocoach")})();
})();
