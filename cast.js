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
function binkoSays(text, big) { return `<div class="guide ${big ? 'big' : ''}">${castImg('binko')}<div class="bubble"><span class="who">⍢ Binko-SR157 🔧</span>${text}</div></div>`; }
