'use strict';
/* The Lucky Clovers. Binko-SR157 guides; the others drop in now and then to cheer.
   Lines stick to what the party knows from the table, nothing from behind the GM's curtain. */
const CAST = {
  binko: { name: 'Binko-SR157', img: 'img/binko.webp', cut: true },
  green: { name: 'Big Green', img: 'img/green.webp', cut: true },
  ollie: { name: 'Ollie', img: 'img/ollie.webp' },
  quickare: { name: 'Quickare', img: 'img/quickare.webp' },
  penn: { name: 'Penn', img: 'img/penn.webp' },
  triton: { name: 'Captain Triton', img: 'img/triton.webp' },
  cat: { name: 'Cat', img: 'img/cat.webp', cut: true }
};
const BINKO_NEXT = {
  session: 'Adventurer and Creator Binko here! First up: the daily session. Binko binks you are gonna do SOOO good!',
  convo: 'Conversation time! Real people, real talk. Binko LOVES people. Read it, then say your part out loud.',
  speed: 'SPEED ROUND! Binko cranked the turbines. Ears ready? It gets faster every time you get two right!',
  dict: 'Dictation! Catch every little word like a loose bolt: ko, na, pa, sa. Do not drop any!',
  shadow: 'Shadowing! Talk along with the voice, like a duet. Binko does this with the DJ set all the time.',
  pron: 'Pronunciation check! Binko\'s sensors are listening super duper closely.',
  build: 'Build time! Binko loves building. Take words you know and put them together YOUR way. Ko goes second, remember!',
  real: 'Real Bisaya from real people! Binko found it on the internet. Every word in it is one you know!',
  talk: 'Talk out loud! Call or chat with family in Bisaya, then tick it off. Binko binks you\'ve got this!',
  input: 'Ten minutes of real Bisaya! Put on a vlog or the radio and let it flow. No pausing to translate!',
  done: 'ALL DONE! Binko is SO proud of you. That is it for today. BINKO OUT!'
};
// more things Binko says on Today; a new one each time you come back to the Today tab
const BINKO_MORE = {
  session: ['BINKO REPORTING! Your daily session is fueled up and ready to launch!', 'Binko polished every new word himself. Some of them sparkle. Let\'s go!', 'Today\'s session has new words AND old friends. Binko loves a reunion!', 'Binko binks today is a GREAT day to learn Bisaya. Binko binks that every day.', 'Ding ding ding! Session time! Binko already did his warm-up stretches.', 'Fun fact from Binko: little words like ko and na make Bisaya sound real. Watch for them today!'],
  convo: ['Binko found a new conversation! Pretend Binko is the other person. Binko is very good at pretending.', 'Talk time! Say your lines out loud, even if the cat is listening.'],
  speed: ['VROOOM! The speed round is warmed up. Can your ears keep up with Binko\'s engine?', 'Fast Bisaya is real Bisaya. Lola talks at 2× speed, so let\'s practice!'],
  dict: ['Dictation! Binko\'s ears are giant microphones. Let\'s see if yours are better!', 'Type every word you hear. The little ones are sneaky. Binko caught three yesterday!'],
  shadow: ['Shadowing! Say it WITH the voice, like singing along to a song in the car.'],
  build: ['Binko has a new grammar gadget for you! Learn the rule, then build your own sentences.', 'Building sentences is like building robots. Binko would know!'],
  real: ['Real Bisaya from the internet! Binko only picks ones where you know every word.'],
  talk: ['Call someone and say something in Bisaya! Even "Kumusta ka?" counts. Binko believes in you!'],
  done: ['You finished EVERYTHING! Binko is doing a happy little spin.', 'All done for today! Want more? Rush is waiting, and Binko bets you can beat your best.', 'Mission complete! Binko filed it under AMAZING.', 'Done and done! Say today\'s phrase to someone before bed. Binko dares you!']
};
const BINKO_ANY = ['Psst. Tap ⚑ Sounds wrong? if a card ever looks off. Binko will tell the family!', 'Binko\'s stories are in Practice. Binko is the hero of all of them. Obviously.', 'Missed a day? Your streak freeze has your back once a week. Binko made it out of ice cubes.', 'Try Rush on the golden trophy! One miss and it\'s over, so focus like a robot.'];
// on Today, Binko shares a fun fact about Cebu; a new one each time you come back to the tab
// Cebu fun facts, each told by the Lucky Clover it suits best, in their own voice. Split evenly so nobody shows up more than the others.
const CLOVER_FACTS = {"green": ["Big Green tells a holy story. In 1565, a Spanish soldier named Juan de Camuz found the Santo Niño statue, an image of the Child Jesus, inside a burned house. It had first come to Cebu about 44 years before. Big Green says: a good finding.", "'Sutukil' is a Cebu seafood style. It joins three words: sugba (grilled), tuwa (soup) and kilaw (fresh fish soaked in vinegar). Three ways to eat fish. Big Green wants all three. Now.", "The Simala Shrine in Sibonga is a church that looks like a fairy-tale castle. A group of monks who came from Pampanga started it in 1998. Big Green would pray there to Mother Rhine. Quietly.", "Rosquillos are ring-shaped cookies with wavy edges. Margarita 'Titay' Frasco first made them in Liloan in 1907. People say President Sergio Osmeña named them. Big Green says: good name, better cookie.", "Lechon is a whole roasted pig. It is Cebu's most famous dish. Cebu-style lechon is stuffed with herbs like lemongrass, so many people eat it with no sauce at all. Big Green's stomach is rumbling.", "Bantayan Island in northern Cebu has a local dish called taguangkan. It is grilled chicken ovary, with tiny eggs still inside. Big Green is not picky. Big Green would try it.", "Anthony Bourdain, the American chef and travel-TV host, visited Cebu for his show No Reservations. He called the lechon, a whole roasted pig, the 'best pig ever.' Big Green agrees. Big Green has not tried it. Big Green agrees anyway.", "In Oslob, a town in southern Cebu, visitors can swim near whale sharks, the biggest fish in the ocean. Despite the name, they eat tiny plankton, not people. Big Green respects a big eater."], "quickare": ["I'll be! Lapu-Lapu City on Mactan Island is famous for handmade guitars and ukuleles, partner. Families there have been buildin' 'em for generations. Now that's a craft worth tippin' my top hat to.", "Reckon Cebu Island's a long, skinny critter. It's about 196 kilometers from north to south, but only about 32 kilometers across at its widest. Like a fancy necktie layin' in the sea!", "Lotta Cebuano words come from Spanish, partner. Like 'lamesa' (table), 'kutsara' (spoon), 'bintana' (window) and 'silya' (chair). Them's all the words you need for a fine supper, I reckon.", "Pungko-pungko is Cebu street food, like fried snacks and puso rice. The name comes from 'pungko,' meanin' to squat or sit low, 'cause diners sit on small low benches. Finally, seats built for a dwarf!", "Canyoneerin' is an adventure of jumpin', swimmin' and slidin' down a river canyon. It's a popular thing to do in Badian and Alegria in southwestern Cebu. Them's my kinda rocks, partner. Hold my hat!", "The Cebu Taoist Temple was built in 1972 by Cebu's Chinese community. It sits 110 meters up in the hills, and its entrance looks like a piece of the Great Wall of China. Now that's a fine house on a hill, partner.", "Cebu was the first capital of the Spanish colony in the Philippines, before the capital moved to Manila. That's why Cebu City's often called the oldest city in the country. Oldest and still kickin', partner!", "Fort San Pedro is a three-cornered Spanish fort by Cebu's harbor. It was first built of wood in 1565, and it's the oldest triangular fort of its kind in the Philippines. Three corners, partner. Reckon it's wearin' a tricorn hat."], "triton": ["Back in my day, there were trains! From the early 1900s until World War II, a railway ran along Cebu Island, linking Danao in the north to Argao in the south. Choo-choo, and a puff from my pipe.", "Here's a sailor's tale. According to the popular story, Malapascua Island got its name from Spanish sailors whose ship was wrecked by a storm there on Christmas Day. 'Mala Pascua' means 'bad Christmas.' Rough seas, rougher holiday.", "Cebu Province includes the main island plus 167 smaller islands and islets around it. That's a lot of beaches, and a lot of places to drop anchor. I'd need a hundred more years to visit them all.", "The Cebuano Wikipedia has more than 6 million articles, more than any other language except English. Most of them were written by computer programs called bots. Machines doing the writing? I'll drink some oil to that.", "June Mar Fajardo is a basketball star from Cebu, nicknamed 'The Kraken.' By 2025 he had won a record nine Most Valuable Player awards in the Philippine Basketball Association. A sea-monster name for a giant of the court. I approve, matey.", "Boljoon Church, in the southern Cebu town of Boljoon, was built of coral stone in the late 1700s. It also served as a watchtower against raiders coming from the sea. A church that keeps one eye on the waves. Smart.", "Colon Street in downtown Cebu City is known as the oldest street in the Philippines. It is named after Cristóbal Colón, the Spanish name of Christopher Columbus. Named for a sea captain. Naturally, I approve.", "The Cebu-Cordova Link Expressway, or CCLEX, opened in 2022. At 8.9 kilometers long, it is the longest bridge in the Philippines. That's a long walk for old legs like mine."], "cat": ["Mehhh-eh! (Cat says: Bantayan Island, off the northern tip of Cebu, is known as the 'egg basket' of the Visayas, because its farms produce about 2 million eggs a day! Cat counted. Cat lost count.)", "Meh! Meh! (Cat says: Sea turtles are often spotted swimming along the coral reefs of Moalboal, a seaside town on Cebu's west coast. Cat waves a hoof hello!)", "Meh... (Cat whispers: The Cebu flowerpecker is only about 11 to 12 centimeters long. It is one of the rarest birds in the world, with only around 100 left. Shh. Cat will not scare it.)", "Mehhh-mehhh! (Cat says: The black shama is a dark songbird with a sweet voice. It lives only on Cebu Island and nowhere else in the world. Cat is singing along.)", "Mehhh-eh! (Cat says: The Tañon Strait, between Cebu and Negros islands, is home to 11 kinds of marine mammals, including dolphins and whales. Splash! Cat stays on the boat.)", "Meh-meh-meh! (Cat says: Thousands of migrating birds from places as far as Siberia, China and Japan stop at Olango Island, near Mactan, each year to rest and eat. Hello, birdies!)", "Meh?! (Cat says: Off Malapascua Island in northern Cebu, divers can see thresher sharks, which have very long, whip-like tails. What a tail! Cat's tail is very small.)", "Mehhh-eh-eh! (Cat says: Near Moalboal, a town on Cebu's west coast, millions of sardines swim in a giant silvery swirl just off the beach. Cat watches. Cat gets dizzy. Cat sits down.)"], "penn": ["Nigel, listen to this. The Temple of Leah is a grand Roman-style building in the hills of Busay, Cebu City. Teodorico Adarna built it as a tribute to his late wife, Leah. Some people build temples for the ones they lost. I write journals.", "The Yap-Sandiego Ancestral House in Cebu City's Parian district dates back to the 1600s. It is one of the oldest Chinese-built houses in the Philippines. Old houses keep their secrets well. I respect that.", "Nigel, listen. Antonio Pigafetta, an Italian traveler on Ferdinand Magellan's voyage, kept a diary. It is one of the oldest written descriptions of Cebu. He wrote his journal too. Maybe someone reads mine one day.", "Visitors to the Cebu Taoist Temple climb 81 steps. There is one step for each of the 81 chapters of the main Taoist holy book. Count them as you go. Cat would try to skip some.", "Fort San Pedro, the old Spanish fort in Cebu City, has three corner towers called bastions. It has been a school, an army camp, and even a small zoo. A place that keeps changing its mask. I understand it.", "The first Sinulog parade, in 1980, was a small march of students. David Odilao Jr., a regional sports official, organized it. Now it draws huge crowds every January. One small march can gather a whole people.", "The name Sinulog comes from 'sulog,' the Cebuano word for a water current. The dance looks like water flowing forward and back. Watch long enough and the crowd becomes a river.", "The Santo Niño de Cebú is a small statue of the Child Jesus. In 1521 it was given to the wife of Rajah Humabon, Cebu's ruler. It is the oldest Christian image in the Philippines. Nigel, some gifts outlast everyone."], "ollie": ["The Cebu flowerpecker is a tiny, colorful bird found only on Cebu. People thought it was extinct for most of the 1900s, until it was rediscovered in 1992. A comeback story? Gorgeous. I adore a dramatic return.", "Lapulapu was a chieftain of Mactan Island. On April 27, 1521, he defeated Ferdinand Magellan's men in the Battle of Mactan. Magellan, the Portuguese explorer sailing for Spain, died in that fight. A local leader standing up to outsiders? My little rebel heart is blazing.", "Aguinid Falls in Samboan, a town in southern Cebu, has several levels. Visitors can climb them step by step, right through the water. Splashing up a waterfall? Dramatic. I love it.", "In Cebuano, 'adlaw' means both 'sun' and 'day,' and 'bulan' means both 'moon' and 'month.' Naturally, the sun gets top billing. All the best things glow.", "Pilita Corrales was born in Lahug, Cebu City, in 1939. She was a singer known as 'Asia's Queen of Songs,' famous for leaning far backward while she sang. Now that's stage presence. Teach me, queen.", "'Usahay' is a beloved Visayan love song. Its title comes from the Cebuano word for 'sometimes.' A love song called 'sometimes'? Honestly, that's every romance I've ever had.", "Tuslob buwa means 'dip in bubbles.' Diners dip puso, rice in a woven coconut-leaf pouch, into a bubbling pan of rich, savory sauce. A sizzling pan and a crowd around it? Pure drama.", "Monique Lhuillier is a fashion designer born in Cebu City. She makes wedding and evening gowns worn by stars like Taylor Swift and Reese Witherspoon. Gowns fit for stars? Darling, call her for me."]};
/* Who's talking on Today: Binko first, every time the app opens, with the day's plan. After that, each time you come back
   to Today a random Clover tells a fun fact. Speakers come from a shuffled bag so everyone gets the same number of turns,
   and each one works through their own facts in a shuffled order before repeating. */
const CLOVER_STYLE = {
  binko: { tag: '⍢ Binko-SR157 🔧', face: 'icon-192.png?v=full' },
  green: { tag: '🐊 Big Green', face: 'img/green-face.webp' },
  ollie: { tag: '🔥 Ollie', face: 'img/ollie-face.webp?v=4' },
  quickare: { tag: '🎩 Quickare', face: 'img/quickare-face.webp?v=4' },
  penn: { tag: '🎭 Penn', face: 'img/penn-face.webp?v=4' },
  triton: { tag: '⚓ Captain Triton', face: 'img/triton-face.webp?v=4' },
  cat: { tag: '🐐 Cat', face: 'img/cat-face.webp?v=4' }
};
const FACT_WHO = Object.keys(CLOVER_FACTS);
function lsGet(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
function nextFactTeller() {
  let bag = lsGet('padayon-clover-bag', []); const last = lsGet('padayon-clover-last', '');
  if (!bag.length) { bag = shuffle(FACT_WHO.slice()); if (bag[0] === last && bag.length > 1) bag.push(bag.shift()); }
  const who = bag.shift(); lsSet('padayon-clover-bag', bag); lsSet('padayon-clover-last', who);
  const L = CLOVER_FACTS[who]; let ord = lsGet('padayon-fact-' + who, []);
  if (!ord.length || ord.some(i => i >= L.length)) ord = shuffle(L.map((_, i) => i));
  const i = ord.shift(); lsSet('padayon-fact-' + who, ord);
  return { who, kick: 'Cebu fun fact!', html: esc(L[i]) };
}
// a character's speech bubble, themed and animated for that character
function cloverSays(who, html, big, kick) {
  const st = CLOVER_STYLE[who] || CLOVER_STYLE.binko;
  return `<div class="guide clover c-${who} ${big ? 'big' : ''}"><span class="cface" style="--face:url('${st.face}')"><img class="art face" src="${st.face}" alt="${esc(CAST[who] ? CAST[who].name : who)}"><i class="fx" aria-hidden="true"></i><i class="fx2" aria-hidden="true"></i></span><div class="bubble"><div class="bhead"><span class="who">${st.tag}</span>${kick ? `<span class="kick">${kick}</span>` : ''}</div><div class="bbody">${html}</div></div></div>`;
}
const BINKO_DONE = ['Log complete! Binko writes this one in the journal with a little doodle.', 'Woohoo! Another part tinkered and fixed!', 'Binko binks that went GREAT. Onward!'];
const CHEERS = {
  streak: [
    ['binko', 'BINKO BINKS THAT WAS PERFECT!'], ['binko', 'Super duper correct! Three in a row!'],
    ['green', 'Big Green is proud. Big Green is also hungry. Keep going.'], ['green', 'Mother Rhine smiles on you.'],
    ['ollie', 'Hot streak! Keep that flame steady.'], ['ollie', 'Clean work. Not a single wild surge.'],
    ['quickare', "Well I'll be! Them's your own words, nobody else's."], ['quickare', 'Fancy work, partner. Real fancy.'],
    ['penn', "Nigel would've liked that one."], ['penn', 'Cat approves. I approve, just quieter.'],
    ['triton', 'Steady as the sea. Onward, Clovers!'], ['triton', "Now that's a verse worth singing."],
    ['cat', 'Mehhh-eh-eh!'], ['cat', '*happy three-legged hop*']
  ],
  comeback: [
    ['green', 'See? Patched right up.'], ['triton', 'Every good song has a wrong note first.'],
    ['binko', 'Binko fixes things by breaking them first. You fixed it!'], ['quickare', 'Shook it off like a top hat in the wind.']
  ],
  rough: [
    ['green', 'Breathe. Big Green says slow down and look at the little words.'], ['triton', 'Rough waters. Take the next one slow, sailor.'],
    ['binko', 'Uh oh, loose bolt! Binko says: read the word-by-word, then try again.'], ['ollie', 'Deep breath. Fire burns better when you control it.']
  ],
  done: [
    ['green', 'A good meal of words today.'], ['quickare', 'Another notch on the hat!'], ['penn', "That's another mask's worth of words."],
    ['triton', 'Band practice over. Good show, Clover.'], ['ollie', 'Look at you, Wonderchild.'], ['cat', 'Mehh! (Cat is proud.)']
  ]
};
const castImg = (k, cls = '') => { const c = CAST[k]; return `<img class="art ${c.cut ? 'cut' : 'framed'} ${cls}" src="${c.img}" alt="${c.name}">`; };
// cameos use a face-and-shoulders crop so the character is easy to see at small sizes
const castFace = k => `<img class="face" src="img/${k}-face.webp?v=4" alt="${CAST[k].name}" width="72" height="72">`;
const pickLine = kind => CHEERS[kind][Math.floor(Math.random() * CHEERS[kind].length)];
function cameoHtml(kind) { const [k, line] = pickLine(kind); return `<div class="cameo">${castFace(k)}<div><div class="who">${CAST[k].name}</div><div class="line">${line}</div></div></div>`; }
function binkoSays(text, big) { return `<div class="guide ${big ? 'big' : ''}"><img class="art face" src="icon-192.png?v=full" alt="Binko-SR157"><div class="bubble"><span class="who">⍢ Binko-SR157 🔧</span>${text}</div></div>`; }

/* ---------- special moves: every few seconds the speaker on Today does something big, picked at random ---------- */
const SPECIALS = {
  binko: ['rainbow', 'spin', 'dj'],
  green: ['chomp', 'heal', 'evolve'],
  ollie: ['surge', 'flare', 'petals'],
  quickare: ['quickdraw', 'hattoss', 'fan'],
  penn: ['flip', 'echoes', 'shadow'],
  triton: ['rings', 'song', 'glitch'],
  cat: ['leap', 'bleat', 'headbutt']
};
const SP_LEN = { rainbow: 1600, spin: 900, dj: 1600, chomp: 900, heal: 1500, evolve: 1300, surge: 1200, flare: 1400, petals: 1700, quickdraw: 1000, hattoss: 1300, fan: 1100, flip: 1100, echoes: 1500, shadow: 1500, rings: 1800, song: 1700, glitch: 900, leap: 1000, bleat: 1100, headbutt: 1000 };
function spawnFx(host, ch, n, cls, spread) {
  for (let i = 0; i < n; i++) {
    const e = document.createElement('b'); e.className = 'pt ' + (cls || ''); e.textContent = ch[i % ch.length];
    const a = spread === 'up' ? (-Math.PI / 2 + (Math.random() - .5) * 1.4) : Math.random() * Math.PI * 2, d = 40 + Math.random() * 40;
    e.style.setProperty('--dx', Math.cos(a) * d + 'px'); e.style.setProperty('--dy', Math.sin(a) * d + 'px'); e.style.setProperty('--r', (Math.random() * 120 - 60) + 'deg');
    e.style.animationDelay = (i * (spread === 'seq' ? 220 : 60)) + 'ms'; host.appendChild(e); setTimeout(() => e.remove(), 2200);
  }
}
function pop(host, text, cls) { const e = document.createElement('b'); e.className = 'popword ' + (cls || ''); e.textContent = text; host.appendChild(e); setTimeout(() => e.remove(), 1300); }
function doSpecial(face, who, name) {
  if (!face || face.classList.contains('sp')) return;
  name = name || pick(SPECIALS[who] || []); if (!name) return;
  face.classList.add('sp', 'sp-' + name);
  const F = {
    rainbow: () => { const r = document.createElement('i'); r.className = 'rainbow-ring'; face.appendChild(r); setTimeout(() => r.remove(), 1600); spawnFx(face, ['✦', '★', '✧'], 8, 'rainbow'); },
    dj: () => spawnFx(face, ['♪', '♫', '♬'], 7, 'note', 'up'),
    chomp: () => pop(face, 'CHOMP!', 'green'),
    heal: () => spawnFx(face, ['✚'], 8, 'heal', 'up'),
    evolve: () => spawnFx(face, ['✦'], 8, 'gold'),
    surge: () => spawnFx(face, ['✦', '✸', '❋'], 12, 'surge'),
    flare: () => spawnFx(face, ['🔥'], 6, 'fire', 'up'),
    petals: () => spawnFx(face, ['❀', '✿'], 10, 'petal'),
    quickdraw: () => { setTimeout(() => { pop(face, 'BANG!', 'bang'); spawnFx(face, ['✸'], 5, 'flash'); }, 450); },
    hattoss: () => { const h = document.createElement('b'); h.className = 'hat'; h.textContent = '🎩'; face.appendChild(h); setTimeout(() => h.remove(), 1300); },
    fan: () => spawnFx(face, ['✸'], 3, 'flash', 'seq'),
    echoes: () => { for (let i = 0; i < 4; i++) { const g = document.createElement('i'); g.className = 'ghost'; g.style.setProperty('--a', (i * 90 + 45) + 'deg'); face.appendChild(g); setTimeout(() => g.remove(), 1500); } },
    rings: () => { for (let i = 0; i < 3; i++) { const g = document.createElement('i'); g.className = 'smokering'; g.style.animationDelay = i * 300 + 'ms'; face.appendChild(g); setTimeout(() => g.remove(), 1900); } },
    song: () => spawnFx(face, ['♪', '♫'], 6, 'note sea', 'up'),
    bleat: () => pop(face, 'MEHH!', 'cat'),
    headbutt: () => setTimeout(() => spawnFx(face, ['✸'], 4, 'flash'), 300)
  };
  (F[name] || (() => { }))();
  setTimeout(() => face.classList.remove('sp', 'sp-' + name), SP_LEN[name] || 1200);
}
let spTimer = null;
function startSpecials() {
  clearTimeout(spTimer);
  const loop = (first) => { spTimer = setTimeout(() => { const f = document.querySelector('.hero-guide .cface'), g = f && f.closest('.clover');
    if (!f || document.hidden || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return loop();
    doSpecial(f, (g.className.match(/c-(\w+)/) || [])[1]); loop(); }, first ? 1800 : 6000 + Math.random() * 4000); };
  loop(true);
}
/* Start on Today: Binko zooms in from the left and bumps whoever is talking off the card, then the session begins */
function binkoBump(then) {
  const f = document.querySelector('.hero-guide .cface');
  if (!f || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return then();
  clearTimeout(spTimer);
  const r = f.getBoundingClientRect(), self = /c-binko/.test(f.closest('.clover').className);
  const b = document.createElement('img'); b.src = 'img/binko.webp'; b.alt = ''; b.className = 'binko-run';
  b.style.top = (r.top + r.height / 2 - 48) + 'px'; b.style.setProperty('--to', (r.left - 30) + 'px');
  document.body.appendChild(b);
  setTimeout(() => { if (!self) f.classList.add('bumped'); else f.style.visibility = 'hidden'; b.classList.add('hit'); }, 330);
  setTimeout(() => { b.remove(); then(); }, 720);
}
