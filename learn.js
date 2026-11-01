'use strict';
/* Padayon teaching content: foundations (how words combine), memory tricks, "when to use it" notes,
   a word-by-word glossary for little words, confusable sets for hard answer choices, and conversations. */

/* ---------- Foundations: sentence frames you can swap words into ----------
   ceb/en: the model sentence. note: how it fits together. trick: a memory hook tied to English.
   combos: more sentences built on the same frame, used for "Build it" practice. */
const F_UNITS = [
  { ceb: 'Kinsa', name: 'Who: I, you, he/she, we, they', ids: [] },
  { ceb: 'Akoa', name: 'Whose: my, your, mine', ids: [] },
  { ceb: 'Naa / Wala', name: 'Have, there is, where it is', ids: [] },
  { ceb: 'Ganahan', name: 'Like and want', ids: [] },
  { ceb: 'Pangutana', name: 'Asking questions', ids: [] },
  { ceb: 'Kanus-a', name: 'When it happens: will, did, doing', ids: [] },
  { ceb: 'Unsa ka', name: 'Describing: very, big, nice', ids: [] }
];
const F = [
  { u: 0, ceb: 'Gutom ko', en: "I'm hungry", note: 'Ko = I. It goes after the first word, not at the start like English "I". Ako is the long, stressed form: "Ako?" = "Me?"',
    trick: 'Ko is the tail end of a-KO. Chop the head off and you get the short "I".', combos: [['Gikapoy ko', "I'm tired"], ['Okay ra ko', "I'm okay"], ['Gutom ko', "I'm hungry"]] },
  { u: 0, ceb: 'Gutom ka?', en: 'Are you hungry?', note: 'Ka = you (one person). Same spot as ko: right after the first word. Ikaw is the long form: "Ikaw?" = "You?"',
    trick: 'Ka sounds like the "ca" in "can you…?" Think: ka = you.', combos: [['Gikapoy ka?', 'Are you tired?'], ['Asa ka?', 'Where are you?'], ['Okay ra ka?', 'Are you okay?']] },
  { u: 0, ceb: 'Naa siya', en: 'He/She is here', note: 'Siya = he OR she. Bisaya has no gender in pronouns, so context tells you who.',
    trick: '"See ya" sounds like siya: you see ya, him or her, it doesn\'t matter.', combos: [['Asa siya?', 'Where is he/she?'], ['Gutom siya', 'He/She is hungry'], ['Gikapoy siya', 'He/She is tired']] },
  { u: 0, ceb: 'Kaon na ta', en: "Let's eat now", note: 'Two words for "we". Ta (kita) = we INCLUDING you. Mi (kami) = we but NOT you.',
    trick: 'TA = Together, All of us. MI = Me and my people, you\'re not in it.', combos: [['Lakaw na ta', "Let's go now"], ['Gutom mi', "We're hungry (not you)"], ['Gikapoy ta', "We're tired (all of us)"]] },
  { u: 0, ceb: 'Asa mo?', en: 'Where are you all?', note: 'Mo (kamo) = you all. Sila = they.',
    trick: 'Mo = MOre than one "you". Sila sounds like "see LA": they all went to LA.', combos: [['Asa sila?', 'Where are they?'], ['Gutom mo?', 'Are you all hungry?'], ['Naa sila', 'They are here']] },
  { u: 1, ceb: 'Akong balay', en: 'My house', note: 'Akong = my, imong = your, iyang = his/her. They go BEFORE the thing. The -ng at the end links to the next word.',
    trick: 'Ako (I) + ng = akong (my). The -ng is a hook that grabs the next word.', combos: [['Akong iro', 'My dog'], ['Imong balay', 'Your house'], ['Iyang trabaho', 'His/her job']] },
  { u: 1, ceb: 'Akoa ni', en: 'This is mine', note: 'Akoa = mine, imoha = yours, iyaha = his/hers. These stand alone without a noun after them.',
    trick: 'Ends in -a, stands alone: akoa, imoha, iyaha. Ends in -ng, needs a partner: akong, imong, iyang.', combos: [['Imoha ni', 'This is yours'], ['Kang kinsa ni?', 'Whose is this?'], ['Akoa na', 'That is mine']] },
  { u: 2, ceb: 'Naa koy iro', en: 'I have a dog', note: 'Naa = there is / is present. Koy = ko + y. "Naa koy…" is literally "there is, mine, a…" = I have.',
    trick: 'Naa sounds like "nah", but it means YES, it\'s there. Opposite of what an English ear expects.', combos: [['Naa koy trabaho', 'I have a job'], ['Naa koy kwarta', 'I have money'], ['Naa koy iring', 'I have a cat']] },
  { u: 2, ceb: 'Naa kay uyab?', en: 'Do you have a boyfriend/girlfriend?', note: 'Swap koy for kay (ka + y) and add a question tone: "Naa kay…?" = do you have…?',
    trick: 'Koy = I have, kay = you have. Just swap the middle letter, same as ko/ka.', combos: [['Naa kay iro?', 'Do you have a dog?'], ['Naa kay trabaho?', 'Do you have a job?'], ['Naa kay oras?', 'Do you have time?']] },
  { u: 2, ceb: 'Wala koy kwarta', en: "I don't have money", note: 'Wala = there isn\'t / none. Wala koy… = I don\'t have…',
    trick: '"Voilà!" shows you something. Wala shows you nothing.', combos: [['Wala koy oras', "I don't have time"], ['Wala koy uyab', "I don't have a boyfriend/girlfriend"], ['Wala kay kwarta?', "Don't you have money?"]] },
  { u: 2, ceb: 'Naa siya sa balay', en: 'He/She is at home', note: 'Naa + who + sa + place = someone is at a place. Sa covers at, in, on and to: one word for all of them.',
    trick: 'Sa = "at" with a Spanish accent. Use it wherever English would say at, in, on, or to.', combos: [['Naa ko sa trabaho', "I'm at work"], ['Naa siya sa kusina', 'He/She is in the kitchen'], ['Wala siya sa balay', "He/She isn't home"]] },
  { u: 3, ceb: 'Ganahan ko og kape', en: 'I like coffee', note: 'Ganahan ko og + thing = I like (thing). Og (also ug) comes before a general thing.',
    trick: 'Ganahan sounds like "gonna have". I\'m gonna have that, because I like it.', combos: [['Ganahan ko og manok', 'I like chicken'], ['Ganahan ko og iring', 'I like cats'], ['Ganahan ka og kape?', 'Do you like coffee?']] },
  { u: 3, ceb: 'Ganahan ko mokaon', en: 'I want to eat', note: 'Ganahan ko + mo-verb = I want to (do). The verb takes mo- because it hasn\'t happened yet.',
    trick: 'Like = ganahan + thing. Want to = ganahan + mo-action.', combos: [['Ganahan ko molakaw', 'I want to leave'], ['Ganahan ko moadto sa Cebu', 'I want to go to Cebu'], ['Ganahan ka mokaon?', 'Do you want to eat?']] },
  { u: 3, ceb: 'Dili ko ganahan', en: "I don't like it", note: 'Dili (not) comes first and pulls ko right after it: "Ganahan ko" becomes "Dili ko ganahan".',
    trick: 'Ko is a magnet: it always sticks to whatever word comes first in the sentence.', combos: [['Dili siya ganahan', "He/She doesn't like it"], ['Dili ko ganahan og kape', "I don't like coffee"], ['Dili ka ganahan?', "Don't you like it?"]] },
  { u: 4, ceb: 'Asa ka moadto?', en: 'Where are you going?', note: 'Question word first, then who, then the rest. Asa = where.',
    trick: 'Asa sounds like "ASAP": where do I need to be, ASAP?', combos: [['Asa ang iro?', 'Where is the dog?'], ['Asa siya?', 'Where is he/she?'], ['Asa ang kasilyas?', 'Where is the bathroom?']] },
  { u: 4, ceb: 'Unsa imong ngalan?', en: 'What is your name?', note: 'Unsa = what. In fast speech "unsa ang" becomes "unsay".',
    trick: 'Unsa sounds like "unsure": when you\'re unsure, ask unsa.', combos: [['Unsa ni?', 'What is this?'], ['Unsa imong trabaho?', 'What is your job?'], ['Unsa imong gikaon?', 'What did you eat?']] },
  { u: 4, ceb: 'Kinsa siya?', en: 'Who is he/she?', note: 'Kinsa = who, kanus-a = when, ngano = why, pila = how many, tagpila = how much (price).',
    trick: 'Kinsa = "kin? sa?" Which of my kin is that? Tagpila = what\'s on the price tag?', combos: [['Kanus-a ka moabot?', 'When will you arrive?'], ['Ngano man?', 'Why?'], ['Tagpila ni?', 'How much is this?']] },
  { u: 4, ceb: 'Gutom ka ba?', en: 'Are you hungry?', note: 'Ba turns a statement into a yes/no question. It sits right after ko/ka/siya.',
    trick: 'Ba = a raised eyebrow. Add it and you\'re asking.', combos: [['Layo ba?', 'Is it far?'], ['Tinuod ba?', 'Is it true?'], ['Naa ba siya?', 'Is he/she there?']] },
  { u: 5, ceb: 'Mokaon ko', en: 'I will eat', note: 'Mo- + action = will do it. Same root, different start, different time.',
    trick: 'MO = MOre to come. It hasn\'t happened yet.', combos: [['Moadto ko', 'I will go'], ['Molakaw siya', 'He/She will leave'], ['Mokaon ta', "We'll eat (all of us)"]] },
  { u: 5, ceb: 'Nikaon ko', en: 'I ate', note: 'Ni- (also mi-) + action = did it, done. Swap mo- for ni- to move it into the past.',
    trick: 'NI = Nailed It. It\'s finished.', combos: [['Niadto ko', 'I went'], ['Nilakaw siya', 'He/She left'], ['Nikaon na ka?', 'Have you eaten?']] },
  { u: 5, ceb: 'Nagkaon ko', en: "I'm eating", note: 'Nag- + action = happening now or was ongoing. Context tells you which.',
    trick: 'NAG like nagging: it keeps going and going.', combos: [['Nagtrabaho siya', 'He/She is working'], ['Nagluto si Mama', 'Mom is cooking'], ['Nagkaon pa ko', "I'm still eating"]] },
  { u: 5, ceb: 'Ayaw kahadlok', en: "Don't be afraid", note: 'Ayaw + feeling or action = don\'t…',
    trick: 'Ayaw sounds like "away": push it away, don\'t do it.', combos: [['Ayaw kabalaka', "Don't worry"], ['Ayaw kalimti', "Don't forget"], ['Ayaw kasuko', "Don't be angry"]] },
  { u: 6, ceb: 'Lami kaayo', en: 'Very delicious', note: 'Describing word + kaayo = very… Kaayo comes after, not before like English "very".',
    trick: 'Say the thing, then turn it up: lami… KAAYO!', combos: [['Dako kaayo', 'Very big'], ['Init kaayo', 'Very hot'], ['Nindot kaayo', 'Very nice']] },
  { u: 6, ceb: 'Nindot nga balay', en: 'A beautiful house', note: 'Nga links a describing word to a thing. After a vowel it shrinks to -ng and sticks on: dako + nga = dakong.',
    trick: 'Nga is glue. After a vowel the glue gets absorbed: dakong balay, gamayng iro.', combos: [['Dakong balay', 'A big house'], ['Gamay nga iring', 'A small cat'], ['Nindot nga adlaw', 'A nice day']] }
];
F.forEach((f, i) => F_UNITS[f.u].ids.push('f' + i));
const F_ORDER = F_UNITS.flatMap(u => u.ids);

/* ---------- "When to use it" notes for deck cards (by id) ---------- */
const NOTES = {
  p42: 'Use from when you wake up until about 11 am. Buntag = morning.',
  p0: 'Use around noon, roughly 11 am to 1 pm. Udto = noon (paniudto = lunch). Once lunch is over, switch to maayong hapon.',
  p1: 'Use from about 1 pm until it gets dark. Before that it\'s maayong udto; once it\'s dark, maayong gabii.',
  p2: 'Use as a hello once it\'s dark. It is a greeting, not "good night" before bed. For that, say maayong pagkatulog.',
  p3: 'Only when someone is going to sleep (pagkatulog = sleeping). To greet someone in the evening, use maayong gabii.',
  p4: 'Everyday thanks. Add kaayo (salamat kaayo) to make it "thank you very much".',
  p147: 'A bigger thanks than plain salamat. Kaayo = very.',
  p148: 'More formal, like "I\'m grateful to you." Good for elders or a speech.',
  p5: 'The answer to salamat. Literally "there\'s nothing to it."',
  p149: 'Sori is casual. Pasensya = sorry for a hassle or delay. Pasaylo = asking forgiveness for something you did wrong.',
  p151: 'For a small hassle you caused, like making someone wait.',
  p150: 'Stronger than pasensya: you\'re asking to be forgiven, not just apologizing for a hassle.',
  p11: 'Feelings with na- describe a state you\'re in: nasuko (angry), nalipay (happy), nahadlok (scared), naguol (sad).',
  p9: 'Nalipay = you became happy (because of something). Malipayon = a happy person in general.',
  p10: 'Nagguol = sad, grieving. For "I miss you", use gimingaw ko nimo instead.',
  p23: 'Sige = okay, sure, go ahead. Also how people wrap up a call: "Sige, babay."',
  p7: 'The everyday answer to kumusta. Ra = just: "just okay" is the normal polite reply, not a complaint.',
  p142: 'Said when YOU are the one leaving. When someone else leaves, tell them pag-amping (take care).',
  p145: 'Said to the person who is leaving or traveling.',
  p143: 'Casual "see you later" when you\'ll meet again the same day or soon. For tomorrow: kita ta ugma.',
  p141: 'Ugma = tomorrow. Swap in another day: kita ta sa Lunes (see you Monday).',
  p89: 'Diri = here, near me. Dinha = there, near you. Didto = over there, far from both of us.',
  p93: 'Didto = over there, far from both of us. Dinha is "there, near you"; diri is "here, near me".',
  p194: 'Wala = not there. Its opposite is naa (is there): "Naa siya" = he/she is here.',
  p192: 'Naa = is there / is present. Answer with "Naa" (yes, here) or "Wala" (not here).',
  p196: 'Wala nako can mean "I don\'t have it anymore" or "I no longer have it", depending on tone.',
  p162: 'Paniudto = lunch, and also "it\'s lunchtime". Same root as maayong udto (noon).',
  p105: 'Karon = now. "Karong adlawa" = today; "karong gabii" = tonight.',
  p94: 'Unya = later, or "and then" when telling a story.',
  p115: 'Ganahan = like or want. Gusto (from Spanish) means the same and is just as common.',
  p44: 'Unsa = what. In fast speech "unsa ang" becomes "unsay": "Unsay imong ngalan?"',
  p46: 'Kanus-a asks about a future or past time. For "what time", use unsang orasa.',
  p51: 'Tagpila = how much (price). Pila = how many (count).',
  p52: 'Pila = how many. For a price, use tagpila.',
  p47: 'Na here means "that, near you". The same sound also means "already", so context decides.'
};

/* ---------- memory tricks for deck cards (by id); the rest come from Gemini on request ---------- */
const TRICKS = {
  p42: 'Buntag sounds like "boon-tag": the morning is a boon, tag it before 11.',
  p0: 'Udto sounds like "noon-to": noon to 1 pm.',
  p1: 'Hapon sounds like "half on": half the day is gone, it\'s the afternoon.',
  p2: 'Gabii sounds like "gabby": evenings are for gabbing with family.',
  p3: 'Pagkatulog has "tulog" (sleep) inside. Tulog sounds like "too logged off".',
  p4: 'Salamat sounds like "salam(i) mat": say thanks for the salami on the mat.',
  p6: 'Kumusta comes from Spanish "¿cómo está?", how are you.',
  p8: 'Palihug sounds like "pa-lee-hug": say please and give a hug.',
  p11: 'Nasuko: picture someone so angry they "sue": na-SUE-ko.',
  p10: 'Nagguol sounds like "nag-ghoul": sad like a ghoul.',
  p12: 'Nahadlok: "had a lock" on the door because I was scared.',
  p23: 'Sige sounds like "seek": go ahead, seek it, okay.',
  p66: 'Balay sounds like "ballet": a ballet in the house.',
  p95: 'Iro sounds like "ear-oh": a dog\'s floppy ears.',
  p99: 'Iring sounds like "earring": a cat batting at your earring.',
  p100: 'Baboy sounds like "bad boy": the messy pig.',
  p96: 'Manok sounds like "man, knock": the rooster knocks you awake at dawn.',
  p61: 'Mahal = expensive, and also "dear/beloved": something dear costs a lot.',
  p82: 'Dako sounds like "da coat": da big coat.',
  p83: 'Gamay sounds like "gummy": small as a gummy bear.',
  p115: 'Ganahan sounds like "gonna have": I\'m gonna have it because I like it.',
  p89: 'Diri sounds like "dear-ee": here, near me, dear.',
  p93: 'Didto sounds like "did go": over there, where someone did go.',
  p125: 'Asa sounds like "ASAP": where do I need to be, ASAP?',
  p44: 'Unsa sounds like "unsure": when you\'re unsure, ask unsa.',
  p50: 'Ngano sounds like "nah, no?": why not?',
  p117: 'Gatas sounds like "got us": milk got us through childhood.'
};

/* ---------- word-by-word glossary for little words (overrides the deck's word list) ---------- */
const GLOSS = {
  ko: 'I', ka: 'you', siya: 'he/she', ta: 'we (incl. you)', mi: 'we (not you)', mo: 'you all', sila: 'they',
  ako: 'I/me', ikaw: 'you', kita: 'we (incl. you)', kami: 'we (not you)', kamo: 'you all',
  nako: 'by me / my', nimo: 'by you / your', niya: 'by him/her', nato: 'our (all of us)', namo: 'our (not you)', ninyo: 'your (all)', nila: 'their',
  akong: 'my', imong: 'your', iyang: 'his/her', atong: 'our (all of us)', among: 'our (not you)', inyong: 'your (all)', ilang: 'their',
  akoa: 'mine', imoha: 'yours', iyaha: 'his/hers',
  ang: 'the', sa: 'at/in/to/of', og: 'a/some · and', ug: 'a/some · and', nga: 'that (linker)', ng: 'linker',
  na: 'already/now · that', pa: 'still/yet', ba: '(yes/no question)', ra: 'just/only', lang: 'just', man: '(softener)', gyud: 'really', jud: 'really',
  diay: 'oh, so', sad: 'also', pud: 'also', sab: 'also', kaayo: 'very', mga: '(plural)', si: '(before a name)', ni: 'this · (of a name)',
  kini: 'this', kana: 'that (near you)', kadto: 'that (far/past)', to: 'that (far/past)', kanang: 'um, like',
  naa: 'there is / is here', wala: 'none / not', dili: 'not / no', di: 'not', mao: "that's it / is", diri: 'here', dinha: 'there (near you)', didto: 'over there',
  asa: 'where', unsa: 'what', unsay: 'what (the)', kinsa: 'who', ngano: 'why', 'kanus-a': 'when', pila: 'how many', tagpila: 'how much',
  kay: 'you have · because', koy: 'I have', siyay: 'he/she has', way: 'none', naay: 'there is a', walay: 'there is no', moy: 'you all have', miy: 'we have',
  karon: 'now', ron: 'now', ugma: 'tomorrow', gahapon: 'yesterday', ganina: 'earlier', unya: 'later/then', nya: 'later/then',
  maayong: 'good (greeting)', maayo: 'good', salamat: 'thanks', ganahan: 'like/want', gusto: 'want/like', palihug: 'please', oo: 'yes', sige: 'okay',
  gutom: 'hungry', gikapoy: 'tired', okay: 'okay', iro: 'dog', iring: 'cat', balay: 'house', kwarta: 'money', uyab: 'boyfriend/girlfriend', oras: 'time',
  trabaho: 'work/job', kape: 'coffee', manok: 'chicken', kusina: 'kitchen', lami: 'delicious', init: 'hot', nindot: 'nice/beautiful', dako: 'big', dakong: 'big (+ linker)',
  gamay: 'small', layo: 'far', duol: 'near', tinuod: 'true', kasilyas: 'bathroom', ngalan: 'name', lakaw: 'go/walk', kaon: 'eat', adlaw: 'day/sun', mama: 'mom', ma: 'mom',
  buntag: 'morning', udto: 'noon', hapon: 'afternoon', gabii: 'evening/night', amping: 'take care', 'pag-amping': 'take care',
  padulong: 'headed to', merkado: 'market', mamalit: 'will shop/buy', isda: 'fish', nikaon: 'ate', magluto: 'will cook', lutoon: 'will cook (it)',
  adobo: 'adobo', babay: 'bye', order: 'order', usa: 'one', 'kan-on': 'rice', tanan: 'everything', ania: 'here it is', sapayan: 'matter (walay sapayan = you\'re welcome)',
  'ig-agaw': 'cousin', nalipay: 'happy', nakaila: 'got to know', 'taga-asa': 'from where', pero: 'but', nagpuyo: 'living', singkwenta: 'fifty', mahal: 'expensive',
  hangyo: 'discount (haggle)', kwarenta: 'forty', kuhaon: 'will take (it)', balik: 'come back', buhaton: 'will do', nganong: 'why', nangutana: 'asked',
  moadto: 'will go', moapil: 'will join', unsang: 'what (+ linker)', orasa: 'time', alas: "o'clock", otso: 'eight', sayo: 'early', diha: 'there (where you are)',
  saysenta: 'sixty', ta: 'we (incl. you) / let\'s', kaon: 'eat', gutom: 'hungry', inyong: 'your (all)',
  kumusta: 'how are', ha: 'okay?', lagi: 'indeed', bitaw: 'right', kaha: 'I wonder', unta: 'hopefully', baya: 'you know', gani: 'again/even'
};
const AFFIX = [
  [/^nag-?/, 'nag- = doing / was doing'], [/^mag-?/, 'mag- = will (planned)'], [/^mo-?/, 'mo- = will'], [/^ni-?/, 'ni- = did'], [/^mi-?/, 'mi- = did'],
  [/^gi-?/, 'gi- = was done'], [/^na-?/, 'na- = became / is in a state'], [/^pag-?/, 'pag- = the act of'], [/^ka-?/, 'ka- = state / how much']
];

/* ---------- swap sets: words that are easy to mix up, used to build hard wrong answers ---------- */
const SWAPS = [
  ['ko', 'ka', 'siya', 'mi', 'ta', 'sila'], ['nako', 'nimo', 'niya', 'nato', 'nila'], ['akong', 'imong', 'iyang', 'atong', 'ilang'],
  ['akoa', 'imoha', 'iyaha'], ['ako', 'ikaw', 'siya'], ['koy', 'kay', 'siyay'], ['naa', 'wala'], ['diri', 'dinha', 'didto'],
  ['ni', 'na', 'to'], ['kini', 'kana', 'kadto'], ['ugma', 'gahapon', 'karon'], ['buntag', 'udto', 'hapon', 'gabii'],
  ['asa', 'unsa', 'kinsa', 'ngano', 'pila'], ['dili', 'wala'], ['dako', 'gamay'], ['layo', 'duol'], ['na', 'pa'], ['ra', 'gyud'],
  ['nalipay', 'nasuko', 'nahadlok', 'nauwaw'], ['salamat', 'palihug']
];
const SWAP_PREFIX = [['mo', 'ni', 'nag'], ['nag', 'mag']];

/* ---------- confusable groups: these are always offered against each other first ---------- */
const CONF = [
  ['p42', 'p0', 'p1', 'p2', 'p3'],
  ['p4', 'p147', 'p148', 'p5'],
  ['p149', 'p150', 'p151', 'p152'],
  ['p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17'],
  ['p141', 'p142', 'p143', 'p144', 'p145', 'p146'],
  ['p89', 'p93'], ['p192', 'p193', 'p194'], ['p196', 'p200', 'p158'], ['p197', 'p198', 'p199'],
  ['p44', 'p45', 'p46', 'p47', 'p48', 'p49', 'p50', 'p51', 'p52'], ['p82', 'p83'], ['p95', 'p99', 'p100', 'p96', 'p101', 'p104']
];

/* ---------- conversations: typical exchanges to practice chaining lines together ---------- */
const DIALOGS = [
  { title: 'Morning hello', ceb: 'Maayong buntag', a: 'Tita', b: 'You', lines: [
    ['a', 'Maayong buntag!', 'Good morning!', 'Before about 11 am, so buntag.'],
    ['b', 'Maayong buntag sad!', 'Good morning to you too!', 'Sad = too. Answer a greeting by repeating it + sad.'],
    ['a', 'Kumusta ka?', 'How are you?', 'Ka = you.'],
    ['b', 'Okay ra ko. Ikaw?', "I'm fine. You?", 'Ikaw? bounces the question back.'],
    ['a', 'Okay ra man. Salamat!', "I'm fine too. Thanks!", ''],
    ['b', 'Sige, pag-amping!', 'Okay, take care!', 'Pag-amping goes to the person heading off.']
  ] },
  { title: 'Are you hungry?', ceb: 'Gutom ka?', a: 'Sister', b: 'You', lines: [
    ['a', 'Gutom ka?', 'Are you hungry?', 'Gutom = hungry, ka = you.'],
    ['b', 'Oo, gutom ko. Ikaw?', "Yes, I'm hungry. You?", 'Ko = I. Swap ka for ko to answer about yourself.'],
    ['a', 'Gutom sad ko. Kaon na ta!', "I'm hungry too. Let's eat!", 'Ta = we, including you.'],
    ['b', 'Sige! Naa kay adobo?', 'Okay! Do you have adobo?', 'Naa kay…? = do you have…?'],
    ['a', 'Naa. Lami kaayo!', "Yes. It's really good!", 'Naa alone = yes, there is.'],
    ['b', 'Salamat!', 'Thanks!', '']
  ] },
  { title: 'Saying hi to a neighbor', ceb: 'Sa silingan', a: 'Neighbor', b: 'You', lines: [
    ['a', 'Maayong hapon!', 'Good afternoon!', 'It\'s after lunch, so hapon, not udto.'],
    ['b', 'Maayong hapon sad. Kumusta ka?', 'Good afternoon to you too. How are you?', 'Sad = too. Answer a greeting by repeating it + sad.'],
    ['a', 'Okay ra man ko. Ikaw?', "I'm fine. You?", 'Ikaw? bounces the question back. Very common.'],
    ['b', 'Maayo man. Asa ka padulong?', "Good. Where are you headed?", 'Asking where someone is going is a normal hello in the Philippines, not nosy.'],
    ['a', 'Sa merkado. Mamalit ko og isda.', "To the market. I'm going to buy fish.", 'Mamalit = will shop / buy.'],
    ['b', 'Ah, sige. Pag-amping!', 'Ah, okay. Take care!', 'Pag-amping goes to the person leaving.'],
    ['a', 'Salamat. Unya nasad!', 'Thanks. See you later!', '']
  ] },
  { title: 'Calling Mom', ceb: 'Sa telepono', a: 'Mom', b: 'You', lines: [
    ['b', 'Hello, Ma? Kumusta mo diha?', 'Hello, Mom? How are you all there?', 'Mo = you all. Diha = there (where you are).'],
    ['a', 'Okay ra mi. Nikaon na ka?', "We're fine. Have you eaten?", 'Asking if you\'ve eaten is a way of saying "I care about you."'],
    ['b', 'Wala pa. Magluto pa ko.', "Not yet. I still have to cook.", 'Wala pa = not yet. Pa = still.'],
    ['a', 'Unsa imong lutoon?', 'What are you going to cook?', 'Lutoon = will be cooked (from luto).'],
    ['b', 'Adobo. Ganahan ko og adobo.', 'Adobo. I like adobo.', 'Ganahan ko og + thing = I like (thing).'],
    ['a', 'Lami! Pag-amping diha, ha.', 'Yum! Take care over there, okay?', 'Ha at the end = "okay?", softening it.'],
    ['b', 'Oo, Ma. Sige, babay!', 'Yes, Mom. Okay, bye!', 'Sige, babay is how most calls end.']
  ] },
  { title: 'Ordering food', ceb: 'Sa kan-anan', a: 'Server', b: 'You', lines: [
    ['a', 'Maayong udto! Unsa inyong order?', "Good noon! What's your order?", 'Udto because it\'s around lunchtime.'],
    ['b', 'Naa pa moy adobo?', 'Do you still have adobo?', 'Naa pa = still have. Moy = you all have (the restaurant).'],
    ['a', 'Naa pa. Usa ka order?', 'We still do. One order?', 'Usa ka = one (counting).'],
    ['b', 'Oo, ug usa ka kan-on. Tagpila tanan?', 'Yes, and one rice. How much for everything?', 'Kan-on = cooked rice. Tagpila = how much.'],
    ['a', 'Saysenta tanan.', 'Sixty for everything.', 'Prices use Spanish numbers.'],
    ['b', 'Ania, salamat.', 'Here you go, thanks.', 'Ania = here it is (handing something over).'],
    ['a', 'Walay sapayan!', "You're welcome!", '']
  ] },
  { title: 'Meeting a new relative', ceb: 'Pagpaila', a: 'Cousin', b: 'You', lines: [
    ['a', 'Unsay imong ngalan?', "What's your name?", 'Unsay = unsa + ang.'],
    ['b', 'Ako si Ana. Ikaw?', "I'm Ana. And you?", 'Ako si + name = I am (name).'],
    ['a', 'Ako si Joy. Ig-agaw ko ni Ben.', "I'm Joy. I'm Ben's cousin.", 'Ig-agaw = cousin. Ni + name = of (name).'],
    ['b', 'Nalipay ko nga nakaila nimo.', "I'm happy to meet you.", 'Nga links the feeling to the reason.'],
    ['a', 'Ako sad! Taga-asa ka?', 'Me too! Where are you from?', 'Taga- = from (a place). Taga-asa = from where.'],
    ['b', 'Taga-Maryland ko. Ikaw?', "I'm from Maryland. You?", ''],
    ['a', 'Taga-Cebu ko, pero nagpuyo na ko sa Virginia.', "I'm from Cebu, but I live in Virginia now.", 'Nagpuyo = living. Na = now (already).'],
    ['b', 'Nindot!', 'Nice!', '']
  ] },
  { title: 'Bargaining at a stall', ceb: 'Pamalit', a: 'Seller', b: 'You', lines: [
    ['b', 'Tagpila ni?', 'How much is this?', 'Ni = this (near me).'],
    ['a', 'Singkwenta.', 'Fifty.', ''],
    ['b', 'Mahal man. Wala bay hangyo?', "That's pricey. No discount?", 'Hangyo = a request / haggle. Expected at markets.'],
    ['a', 'Sige, kwarenta na lang.', 'Okay, just forty then.', 'Na lang = just, then (settling).'],
    ['b', 'Sige, kuhaon nako.', "Okay, I'll take it.", 'Kuhaon = will be taken (from kuha).'],
    ['a', 'Salamat! Balik ha.', 'Thanks! Come back, okay?', '']
  ] },
  { title: 'Making plans', ceb: 'Pagplano', a: 'Friend', b: 'You', lines: [
    ['a', 'Unsay imong buhaton ugma?', 'What are you doing tomorrow?', 'Buhaton = will be done (from buhat, do).'],
    ['b', 'Wala man. Nganong nangutana ka?', 'Nothing much. Why do you ask?', 'Nganong = ngano + nga.'],
    ['a', 'Moadto mi sa beach. Gusto ka moapil?', "We're going to the beach. Want to join?", 'Mi = we (not you yet). Moapil = will join.'],
    ['b', 'Sige! Unsang orasa?', 'Sure! What time?', 'Unsang orasa = what time.'],
    ['a', 'Alas otso sa buntag.', 'Eight in the morning.', 'Clock times use Spanish numbers: alas otso.'],
    ['b', 'Sayo kaayo! Pero okay ra.', "That's so early! But it's fine.", 'Kaayo = very, after the word.'],
    ['a', 'Sige, kita ta ugma!', 'Okay, see you tomorrow!', 'Ta = we, including you.']
  ] }
];
