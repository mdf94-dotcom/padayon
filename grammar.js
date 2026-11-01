'use strict';
/* How a Bisaya sentence is put together. RULES are the guide (shown in "Sentence rules" and linked from every card that uses them).
   VERBS, STATES and PATTERNS power "Build sentences": real sentences made only from words the learner has learned. */

/* Each rule is taught like a lesson, from zero: a few small steps, then a quick drill.
   A rule is only used in "Build sentences" practice after the learner has passed its drill.
   steps: [explanation, [[Bisaya, English, how it works], ...]]
   quiz: {q, a: [right, wrong, wrong], why, w: words that must be learned for the question to be used} */
const RULES = [
  { id: 'first', title: 'Say the main thing first', short: 'Start with the main idea (hungry, tired, eat). Who it is comes after.',
    steps: [
      ['In English you start with the person: "I am hungry." In Bisaya you start with the main idea, then add who. It\'s like saying "Hungry, me."', [['Gutom ko', "I'm hungry", 'gutom = hungry, ko = I']]],
      ['There is no word for "am", "is" or "are". Two words make the whole sentence.', [['Gikapoy ka', "You're tired", 'gikapoy = tired, ka = you'], ['Gutom siya', "He/she is hungry", 'siya = he or she']]],
      ['Actions work the same way: the action word goes first, then who.', [['Mokaon ko', "I'll eat", 'mokaon = will eat, ko = I']]]],
    quiz: [
      { q: 'How do you say "I\'m hungry"?', a: ['Gutom ko', 'Ko gutom', 'Ako is gutom'], why: 'The main word (gutom) goes first, then ko.', w: ['gutom', 'ko'] },
      { q: '"Gikapoy ka" means…', a: ["You're tired", "I'm tired", 'Tired of you'], why: 'Gikapoy = tired, ka = you.', w: ['gikapoy', 'ka'] },
      { q: 'How do you say "I\'m tired"?', a: ['Gikapoy ko', 'Ko gikapoy', 'Ako gikapoy ko'], why: 'Main word first, then ko.', w: ['gikapoy', 'ko'] },
      { q: 'Which one is a whole sentence?', a: ['Gutom siya', 'Siya is gutom', 'Is gutom siya'], why: 'No "is" needed. Gutom siya = he/she is hungry.', w: ['gutom', 'siya'] },
      { q: '"Nalipay ko" means…', a: ["I'm happy", 'Make me happy', 'Are you happy?'], why: 'Nalipay = happy, ko = I.', w: ['nalipay', 'ko'] }] },
  { id: 'time', title: 'The front of an action tells when', short: 'mo- = will, ni- = did, nag- = doing right now. Same root, new front.',
    steps: [
      ['Every action has a plain root: kaon = eat. You stick a small piece on the FRONT to say when. English changes the end ("eat, ate"); Bisaya changes the front.', [['kaon → mokaon / nikaon', 'eat → will eat / ate', 'same root, different front']]],
      ['mo- means will or going to. ni- means you already did it.', [['Mokaon ko', 'I will eat', 'mo- = will'], ['Nikaon ko', 'I ate', 'ni- = did']]],
      ['nag- means you\'re in the middle of it.', [['Nagkaon ko', "I'm eating", 'nag- = doing it now']]]],
    quiz: [
      { q: 'How do you say "I ate"?', a: ['Nikaon ko', 'Mokaon ko', 'Nagkaon ko'], why: 'ni- = already did.', w: ['kaon', 'ko'] },
      { q: '"Mokaon ko" means…', a: ['I will eat', 'I ate', "I'm eating"], why: 'mo- = will.', w: ['kaon', 'ko'] },
      { q: '"I\'m eating right now"', a: ['Nagkaon ko', 'Nikaon ko', 'Mokaon ko'], why: 'nag- = in the middle of it.', w: ['kaon', 'ko'] },
      { q: '"Niadto ko" means…', a: ['I went', 'I will go', "I'm going"], why: 'ni- + adto (go) = went.', w: ['adto', 'ko'] },
      { q: '"Moinom ko" means…', a: ['I will drink', 'I drank', "I'm drinking"], why: 'mo- + inom (drink) = will drink.', w: ['inom', 'ko'] }] },
  { id: 'ko', title: 'Ko, ka, ta never go first', short: 'Ko, ka, ta, mi and mo always ride right behind the first word.',
    steps: [
      ['Ko (I), ka (you) and ta (we) are short, light words. They can\'t start a sentence, so they always sit right behind the first word.', [['Gutom ko', "I'm hungry", 'ko is second'], ['Asa ka?', 'Where are you?', 'asa (where) first, ka second']]],
      ['Even when the sentence is longer, ko still jumps in right after the first word. The rest comes after it.', [['Ganahan ko mokaon', 'I like to eat', 'ganahan first, then ko, then the action'], ['Asa ka moadto?', 'Where are you going?', 'asa, then ka, then the action']]],
      ['To put "I" first, or to answer with just "me", use the long word ako. Ikaw is the long "you".', [['Ako', 'Me', 'can stand alone'], ['Ikaw?', 'You?', 'can stand alone']]]],
    quiz: [
      { q: '"Where are you?"', a: ['Asa ka?', 'Ka asa?', 'Asa ikaw ka?'], why: 'Asa goes first, ka right behind it.', w: ['asa', 'ka'] },
      { q: '"I like to eat"', a: ['Ganahan ko mokaon', 'Ganahan mokaon ko', 'Ko ganahan mokaon'], why: 'Ko sits right after the first word (ganahan), before the action.', w: ['ganahan', 'ko', 'kaon'] },
      { q: '"Where are you going?"', a: ['Asa ka moadto?', 'Asa moadto ka?', 'Ka asa moadto?'], why: 'Ka comes right after asa, then the action.', w: ['asa', 'ka', 'adto'] },
      { q: 'Someone asks "Kinsa?" (Who?). Answer "Me!"', a: ['Ako!', 'Ko!', 'Ka!'], why: 'Ko can\'t stand alone. The long form ako can.', w: ['ako', 'ko', 'kinsa'] },
      { q: '"Are you hungry?"', a: ['Gutom ka?', 'Ka gutom?', 'Gutom ikaw ka?'], why: 'Gutom first, ka second.', w: ['gutom', 'ka'] }] },
  { id: 'neg', title: 'Dili, wala, ayaw: three ways to say no', short: "Dili = won't / not. Wala = didn't / don't have. Ayaw = don't! Ko comes right after them.",
    steps: [
      ['Dili (people often say just di) means not or won\'t. Put it first, and ko slides right behind it.', [['Dili ko mokaon', "I won't eat", 'dili, then ko, then the action'], ['Di ko gutom', "I'm not hungry", 'di = dili']]],
      ['Wala (or wa) means didn\'t, or there isn\'t any. After wala, the action keeps its mo- front.', [['Wala ko mokaon', "I didn't eat", 'wala + mo- action'], ['Wala', "There isn't any / No", 'on its own']]],
      ['Ayaw means "Don\'t!" when you tell someone not to do something.', [['Ayaw!', "Don't!", 'telling someone']]]],
    quiz: [
      { q: '"I won\'t eat"', a: ['Dili ko mokaon', 'Dili mokaon ko', 'Ko dili mokaon'], why: 'Dili first, ko right behind it, then the action.', w: ['dili', 'ko', 'kaon'] },
      { q: '"I didn\'t eat"', a: ['Wala ko mokaon', 'Dili ko mokaon', 'Wala mokaon ko'], why: 'Didn\'t = wala, and ko goes right after it.', w: ['wala', 'ko', 'kaon'] },
      { q: '"I\'m not hungry"', a: ['Dili ko gutom', 'Wala ko gutom', 'Gutom dili ko'], why: 'Not (how you are) = dili.', w: ['dili', 'ko', 'gutom'] },
      { q: 'Tell a kid "Don\'t!"', a: ['Ayaw!', 'Dili!', 'Wala!'], why: 'Ayaw is for telling someone not to.', w: ['ayaw'] },
      { q: '"I won\'t go"', a: ['Dili ko moadto', 'Wala ko moadto', 'Dili moadto ko'], why: "Won't = dili. Ko right after it.", w: ['dili', 'ko', 'adto'] }] },
  { id: 'little', title: 'Little add-on words', short: 'Na = now, pa = still, gyud = really, kaayo = very. They hug the first word; ko comes after them.',
    steps: [
      ['A few tiny words change the feel of a sentence: na = now / already, pa = still / yet, gyud = really, kaayo = very, ra = only, lang = just.', [['Gutom gyud ko', "I'm really hungry", 'gyud = really']]],
      ['They hug the first word, and ko / ka comes right after them.', [['Kaon na ta', "Let's eat now", 'kaon + na, then ta'], ['Gikapoy kaayo ko', "I'm very tired", 'gikapoy + kaayo, then ko']]]],
    quiz: [
      { q: '"I\'m very tired"', a: ['Gikapoy kaayo ko', 'Kaayo ko gikapoy', 'Ko gikapoy kaayo'], why: 'Kaayo hugs gikapoy, then ko.', w: ['gikapoy', 'kaayo', 'ko'] },
      { q: '"Let\'s eat now"', a: ['Kaon na ta', 'Ta kaon na', 'Na kaon ta'], why: 'Kaon + na first, then ta.', w: ['kaon', 'na', 'ta'] },
      { q: '"Gutom gyud ko" means…', a: ["I'm really hungry", "I'm a little hungry", "I'm not hungry"], why: 'Gyud = really.', w: ['gutom', 'gyud', 'ko'] },
      { q: '"Gutom pa ko" means…', a: ["I'm still hungry", "I'm hungry now", "I'm not hungry anymore"], why: 'Pa = still.', w: ['gutom', 'pa', 'ko'] }] },
  { id: 'want', title: 'Want, like, need + an action', short: 'Gusto / ganahan / kinahanglan, then ko, then the mo- action.',
    steps: [
      ['Gusto = want, ganahan = like, kinahanglan = need. Put one first, then ko right behind it (the "never first" rule), then the action with mo-.', [['Gusto ko mokaon', 'I want to eat', 'gusto, ko, mo-action'], ['Ganahan ka moinom?', 'Do you like to drink?', 'ganahan, ka, mo-action']]]],
    quiz: [
      { q: '"I want to eat"', a: ['Gusto ko mokaon', 'Gusto mokaon ko', 'Ko gusto mokaon'], why: 'Gusto, then ko, then the action.', w: ['gusto', 'ko', 'kaon'] },
      { q: '"Ganahan ka mokaon?" means…', a: ['Do you like to eat?', 'Did you eat?', "You're eating"], why: 'Ganahan = like, mo- = (to) eat.', w: ['ganahan', 'ka', 'kaon'] },
      { q: '"I need to go home"', a: ['Kinahanglan ko mopauli', 'Kinahanglan ko nipauli', 'Kinahanglan mopauli ko'], why: 'After kinahanglan, ko comes next and the action keeps mo-.', w: ['kinahanglan', 'ko', 'pauli'] }] },
  { id: 'ask', title: 'Asking questions', short: 'The question word goes first, then ka. For yes / no, add ba.',
    steps: [
      ['Put the question word at the front: asa = where, unsa = what, kinsa = who. Then ka right behind it.', [['Asa ka?', 'Where are you?', 'asa first'], ['Unsa ni?', 'What is this?', 'unsa first']]],
      ['For a yes / no question, just raise your voice at the end, or add ba after ka.', [['Gutom ka ba?', 'Are you hungry?', 'ba makes it a yes / no question']]]],
    quiz: [
      { q: '"What is this?"', a: ['Unsa ni?', 'Ni unsa?', 'Unsa ka?'], why: 'Unsa (what) first, ni (this) after.', w: ['unsa', 'ni'] },
      { q: '"Are you hungry?" with ba', a: ['Gutom ka ba?', 'Ba gutom ka?', 'Ka gutom ba?'], why: 'Ba comes after ka.', w: ['gutom', 'ka', 'ba'] },
      { q: '"Who is that?"', a: ['Kinsa na?', 'Na kinsa?', 'Kinsa ka?'], why: 'Kinsa (who) first. Kinsa ka? would be "Who are you?"', w: ['kinsa', 'na'] }] },
  { id: 'desc', title: 'Describing things', short: 'Describe + nga + thing. Very = kaayo, after the describing word.',
    steps: [
      ['To describe a thing, put the describing word, then nga, then the thing. Nga often shrinks to -ng.', [['Dako nga balay', 'A big house', 'dako = big, nga links them'], ['Dakong balay', 'A big house', 'nga shrunk to -ng']]],
      ['Very = kaayo, right after the describing word.', [['Lami kaayo', 'Very delicious', 'kaayo after lami']]]],
    quiz: [
      { q: '"Very delicious"', a: ['Lami kaayo', 'Kaayo lami', 'Lami nga kaayo'], why: 'Kaayo goes after the describing word.', w: ['lami', 'kaayo'] },
      { q: '"A big house"', a: ['Dako nga balay', 'Dako balay nga', 'Nga dako balay'], why: 'Describe + nga + thing.', w: ['dako', 'nga', 'balay'] },
      { q: '"Init kaayo" means…', a: ["It's very hot", "It's a bit hot", "It's not hot"], why: 'Kaayo = very.', w: ['init', 'kaayo'] }] },
  { id: 'have', title: 'Saying "I have"', short: 'Naa koy… = I have… Wala koy… = I don\'t have… (ko + y = koy)',
    steps: [
      ['Bisaya doesn\'t say "I have". It says "there is, to me": naa (there is), then ko with a -y stuck on (koy), then the thing.', [['Naa koy kwarta', 'I have money', 'naa + koy + thing']]],
      ['For "I don\'t have", swap naa for wala.', [['Wala koy kwarta', "I don't have money", 'wala + koy + thing']]]],
    quiz: [
      { q: '"I have money"', a: ['Naa koy kwarta', 'Naa ko kwarta y', 'Ko naa kwarta'], why: 'Naa, then koy (ko + y), then the thing.', w: ['naa', 'ko', 'kwarta'] },
      { q: '"I don\'t have money"', a: ['Wala koy kwarta', 'Dili koy kwarta', 'Wala ko kwarta naa'], why: "Don't have = wala + koy.", w: ['wala', 'ko', 'kwarta'] }] },
  { id: 'mark', title: 'Pointer words: sa, og, si, ang', short: 'Sa = to / at / in. Og = some / a. Si = before a name. Ang = the.',
    steps: [
      ['Small pointer words go right before the thing they point at. Sa = to, at, in. Og = some or a.', [['Moadto ko sa merkado', "I'll go to the market", 'sa = to'], ['Mopalit ko og isda', "I'll buy some fish", 'og = some']]],
      ['Si goes before a person\'s name. Ang = the.', [['Nagluto si Mama', 'Mom is cooking', 'si before a name'], ['Lami ang isda', 'The fish is delicious', 'ang = the']]]],
    quiz: [
      { q: '"I\'ll go to the market"', a: ['Moadto ko sa merkado', 'Moadto ko og merkado', 'Moadto sa ko merkado'], why: 'To a place = sa, right before the place.', w: ['adto', 'ko', 'sa', 'merkado'] },
      { q: '"Mom is cooking"', a: ['Nagluto si Mama', 'Nagluto ang si Mama', 'Si nagluto Mama'], why: 'Si goes right before a name.', w: ['luto', 'si'] },
      { q: '"I\'ll buy some fish"', a: ['Mopalit ko og isda', 'Mopalit ko si isda', 'Mopalit og ko isda'], why: 'Some = og, right before the thing.', w: ['palit', 'ko', 'og', 'isda'] }] },
  { id: 'nako', title: 'When ko becomes nako', short: 'With gi- actions, "I" becomes nako. Nako after a thing means "my".',
    steps: [
      ['Some sentences are about the THING, not the person: "the mango, I ate it." The action gets gi- in front, and ko changes to nako.', [['Gikaon nako ang mangga', 'I ate the mango', 'gi- action, so nako']]],
      ['Nako after a thing also means "my". Nimo = your / you.', [['Balay nako', 'My house', 'same as akong balay'], ['Ganahan ko nimo', 'I like you', 'the person you like is nimo']]]],
    quiz: [
      { q: '"I ate the mango"', a: ['Gikaon nako ang mangga', 'Gikaon ko ang mangga', 'Nikaon nako ang mangga'], why: 'With gi-, use nako.', w: ['kaon', 'nako', 'ang', 'mangga'] },
      { q: '"I like you"', a: ['Ganahan ko nimo', 'Ganahan ko ka', 'Ganahan nimo ko'], why: 'Ko likes, nimo is the one liked.', w: ['ganahan', 'ko', 'nimo'] },
      { q: '"My house"', a: ['Balay nako', 'Balay ko nako', 'Nako balay'], why: 'Nako after the thing = my.', w: ['balay', 'nako'] }] }
];
const RULE = Object.fromEntries(RULES.map((r, i) => [r.id, Object.assign(r, { n: i + 1 })]));

// [root, will form, did form, English, English past, English -ing]
const VERBS = [
  ['kaon', 'mokaon', 'nikaon', 'eat', 'ate', 'eating'], ['inom', 'moinom', 'niinom', 'drink', 'drank', 'drinking'], ['adto', 'moadto', 'niadto', 'go', 'went', 'going'],
  ['lakaw', 'molakaw', 'nilakaw', 'leave', 'left', 'leaving'], ['luto', 'moluto', 'niluto', 'cook', 'cooked', 'cooking'], ['palit', 'mopalit', 'nipalit', 'buy it', 'bought it', 'buying it'],
  ['trabaho', 'motrabaho', 'nitrabaho', 'work', 'worked', 'working'], ['dula', 'modula', 'nidula', 'play', 'played', 'playing'], ['basa', 'mobasa', 'nibasa', 'read', 'read', 'reading'],
  ['tan-aw', 'motan-aw', 'nitan-aw', 'watch', 'watched', 'watching'], ['tawag', 'motawag', 'nitawag', 'call', 'called', 'calling'], ['dagan', 'modagan', 'nidagan', 'run', 'ran', 'running'],
  ['langoy', 'molangoy', 'nilangoy', 'swim', 'swam', 'swimming'], ['kanta', 'mokanta', 'nikanta', 'sing', 'sang', 'singing'], ['sayaw', 'mosayaw', 'nisayaw', 'dance', 'danced', 'dancing'],
  ['pauli', 'mopauli', 'nipauli', 'go home', 'went home', 'going home'], ['tabang', 'motabang', 'nitabang', 'help', 'helped', 'helping'], ['hulat', 'mohulat', 'nihulat', 'wait', 'waited', 'waiting'],
  ['sulat', 'mosulat', 'nisulat', 'write', 'wrote', 'writing'], ['simba', 'mosimba', 'nisimba', 'go to church', 'went to church', 'going to church']
];
// [word, English] for things you can be
const STATES = [['gutom', 'hungry'], ['gikapoy', 'tired'], ['uhaw', 'thirsty'], ['nalipay', 'happy'], ['nasuko', 'angry'], ['nahadlok', 'scared'], ['nauwaw', 'shy'], ['busy', 'busy']];
// [Bisaya, English subject, English "be", 3rd person]
const PRONS = [['ko', 'I', 'am', 0], ['ka', 'you', 'are', 0], ['siya', 'he/she', 'is', 1], ['ta', 'we (all of us)', 'are', 0], ['mi', 'we (not you)', 'are', 0], ['sila', 'they', 'are', 0]];
const cap = s => s[0].toUpperCase() + s.slice(1);
const s3 = (v, third) => third ? v.replace(/^(\w+)/, w => w === 'go' ? 'goes' : /(s|sh|ch)$/.test(w) ? w + 'es' : w + 's') : v;
/* Each pattern: the words it needs, the rule it teaches, and how to build the Bisaya and English.
   v = verb row, s = state row, p = pronoun row. */
const PATTERNS = [
  { id: 'will', rules: ['first','time'], rule: 'time', need: [], uses: 'v', make: (p, v) => [[v[1], p[0]], `${cap(p[1])} will ${v[3]}`], decoy: (p, v) => [v[2]] },
  { id: 'did', rules: ['first','time'], rule: 'time', need: [], uses: 'v', make: (p, v) => [[v[2], p[0]], `${cap(p[1])} ${v[4]}`], decoy: (p, v) => [v[1]] },
  { id: 'wont', rules: ['time','ko','neg'], rule: 'ko', need: ['dili'], uses: 'v', make: (p, v) => [['Dili', p[0], v[1]], `${cap(p[1])} won't ${v[3]}`], decoy: (p, v) => ['wala'] },
  { id: 'didnt', rules: ['time','ko','neg'], rule: 'neg', need: ['wala'], uses: 'v', make: (p, v) => [['Wala', p[0], v[1]], `${cap(p[1])} didn't ${v[3]}`], decoy: (p, v) => ['dili', v[2]] },
  { id: 'now', rules: ['time','little'], rule: 'little', need: ['na'], uses: 'v', make: (p, v) => [[v[1], 'na', p[0]], `${cap(p[1])} will ${v[3]} now`], decoy: (p, v) => ['pa'] },
  { id: 'want', rules: ['time','ko','want'], rule: 'want', need: ['gusto'], uses: 'v', make: (p, v) => [['Gusto', p[0], v[1]], `${cap(p[1])} ${p[3] ? 'wants' : 'want'} to ${v[3]}`], decoy: (p, v) => [v[2]] },
  { id: 'like', rules: ['time','ko','want'], rule: 'want', need: ['ganahan'], uses: 'v', make: (p, v) => [['Ganahan', p[0], v[1]], `${cap(p[1])} ${p[3] ? 'likes' : 'like'} to ${v[3]}`], decoy: (p, v) => ['ako'] },
  { id: 'where', rules: ['time','ko','ask'], rule: 'ask', need: ['asa'], uses: 'v', pron: ['ka', 'siya', 'sila'], make: (p, v) => [['Asa', p[0], v[1] + '?'], `Where will ${p[1]} ${v[3]}?`], decoy: (p, v) => ['unsa'] },
  { id: 'state', rules: ['first'], rule: 'first', need: [], uses: 's', make: (p, s) => [[cap(s[0]), p[0]], `${cap(p[1])} ${p[2]} ${s[1]}`], decoy: (p, s) => [p[0] === 'ko' ? 'ako' : 'ko'] },
  { id: 'very', rules: ['first','little'], rule: 'little', need: ['kaayo'], uses: 's', make: (p, s) => [[cap(s[0]), 'kaayo', p[0]], `${cap(p[1])} ${p[2]} very ${s[1]}`], decoy: (p, s) => ['gyud'] },
  { id: 'notstate', rules: ['ko','neg'], rule: 'neg', need: ['dili'], uses: 's', make: (p, s) => [['Dili', p[0], s[0]], `${cap(p[1])} ${p[2]} not ${s[1]}`], decoy: (p, s) => ['wala'] },
  { id: 'askstate', rules: ['ask'], rule: 'ask', need: ['ba'], uses: 's', pron: ['ka'], make: (p, s) => [[cap(s[0]), 'ka', 'ba?'], `Are you ${s[1]}?`], decoy: (p, s) => ['ko'] }
];
