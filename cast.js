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
const CEBU_FACTS = ["Cebu City is nicknamed the Queen City of the South!", "Cebu City is the oldest city in the Philippines. The Spanish settled there in 1565, before Manila!", "Colon Street in Cebu City is the oldest street in the whole Philippines. Binko has walked it… in his dreams.", "Magellan's Cross in Cebu City was planted by Magellan's crew in 1521. It's kept inside a little chapel.", "In 1521, Lapu-Lapu, the chief of Mactan, beat Magellan in the Battle of Mactan. Binko salutes!", "Rajah Humabon was the ruler of Cebu when Magellan's ships arrived in 1521.", "The Santo Niño de Cebu is the oldest Christian image in the Philippines. It's kept at the Basilica del Santo Niño.", "Sinulog is Cebu's biggest festival, every third Sunday of January. The dance goes two steps forward, one step back!", "Anthony Bourdain said Cebu lechon was the best pig he ever had. Binko agrees, even though Binko can't eat.", "Fort San Pedro in Cebu City is the oldest and smallest triangular fort in the country.", "Cebu dried mangoes are famous all over the world. Binko keeps a bag in his chest compartment.", "In Oslob you can see whale sharks, called butanding. They're the biggest fish in the sea!", "Off Moalboal, millions of sardines swim in one giant swirling school, right near the shore!", "Malapascua Island is famous for thresher sharks, the sharks with super long tails.", "Kawasan Falls in Badian has bright turquoise water. Binko is not waterproof, so he just watches.", "Cebu Province is one big island plus more than 150 smaller ones!", "Puso is rice cooked inside a little pouch of woven coconut leaves. Perfect with lechon or barbecue!", "Tuslob buwa comes from Pasil, Cebu: you dip puso into bubbling, savory gravy. Tuslob means \"to dip\"!", "Sutukil is a Cebu favorite: SUgba (grilled), TUwa (soup) and KILaw (fish \"cooked\" in vinegar).", "Otap is a flaky, sugary Cebu pastry. Crumbs everywhere is part of the fun!", "Danggit, the crispy dried fish, is a classic Cebu pasalubong. Bantayan Island is famous for it.", "The Temple of Leah in Cebu City was built by a husband as a symbol of his love for his wife, Leah.", "Simala Shrine in Sibonga looks like a fairy-tale castle on a hill!", "Guitars handmade on Mactan Island are famous around the world. Binko plays air guitar.", "Sergio Osmeña, the fourth President of the Philippines, was from Cebu. Osmeña Circle is named after him!", "Bisaya, or Cebuano, has about 20 million native speakers. You're joining a BIG family!", "The Taoist Temple in Cebu City sits high on a hill with a view over the whole city.", "\"Padayon\" means \"keep going.\" That's the name of this app, and Binko's favorite word!", "Bantayan Island has white sand beaches and is known as a quiet island getaway north of Cebu.", "Cebuanos say \"Unsa man?\" a lot. It's like \"What's up?\" or \"What is it?\""];
function binkoToday(k, n) { return '<b>Cebu fun fact!</b> ' + CEBU_FACTS[(n || 0) % CEBU_FACTS.length]; }
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
const castFace = k => `<img class="face" src="img/${k}-face.webp" alt="${CAST[k].name}" width="72" height="72">`;
const pickLine = kind => CHEERS[kind][Math.floor(Math.random() * CHEERS[kind].length)];
function cameoHtml(kind) { const [k, line] = pickLine(kind); return `<div class="cameo">${castFace(k)}<div><div class="who">${CAST[k].name}</div><div class="line">${line}</div></div></div>`; }
function binkoSays(text, big) { return `<div class="guide ${big ? 'big' : ''}"><img class="art face" src="icon-192.png?v=full" alt="Binko-SR157"><div class="bubble"><span class="who">⍢ Binko-SR157 🔧</span>${text}</div></div>`; }
