'use strict';
/* How a Bisaya sentence is put together. RULES are the guide (shown in "Sentence rules" and linked from every card that uses them).
   VERBS, STATES and PATTERNS power "Build sentences": real sentences made only from words the learner has learned. */

const RULES = [
  { id: 'first', title: 'The main word goes first', short: 'Start with what is happening or what something is like. The person comes after.',
    body: 'English starts with the person ("I am hungry"). Bisaya usually starts with the action or the description, then says who.',
    ex: [['Gutom ko', "I'm hungry", 'gutom (hungry) first, ko (I) after'], ['Mokaon si Ana', 'Ana will eat', 'the action first, then who'], ['Lami ang sabaw', 'The soup is delicious', 'the description first, then the thing']] },
  { id: 'ko', title: 'Ko, ka, ta go second', short: 'Ko, ka, ta, mi and mo never start a sentence. They sit right after the first word.',
    body: 'These short words (I, you, we, we-not-you, you all) slide in right behind the first word, whatever that word is: an action, dili or wala, a question word, or ganahan / gusto. That is why "Di ko mosimba" sounds natural and "Di mosimba ko" sounds off: people understand it, but the ko is in the wrong seat. To put "I" first, use the long form ako.',
    ex: [['Di ko mosimba', "I won't go to church", 'di is first, so ko comes right after it'], ['Asa ka moadto?', 'Where are you going?', 'asa is first, ka comes next'], ['Ganahan ko mokaon', 'I like to eat', 'ganahan is first, ko comes next'], ['Ako ang nagluto', "I'm the one who cooked", 'to start with "I", use ako']] },
  { id: 'little', title: 'Little words cling to the first word', short: 'Na, pa, ra, gyud, lang and kaayo stay next to the first word, and ko / ka usually follows them.',
    body: 'These little words add "already", "still", "only", "really", "just" and "very". They hug the first word of the sentence, and the short ko / ka comes right behind them.',
    ex: [['Wala pa ko kakaon', "I haven't eaten yet", 'wala + pa, then ko'], ['Kaon na ta', "Let's eat now", 'kaon + na, then ta'], ['Gikapoy kaayo ko', "I'm very tired", 'gikapoy + kaayo, then ko'], ['Gimingaw gyud ko nimo', 'I really miss you', 'gimingaw + gyud, then ko']] },
  { id: 'neg', title: 'Dili, wala, ayaw: three kinds of "no"', short: "Dili = won't / not. Wala = didn't / there isn't. Ayaw = don't (telling someone).",
    body: 'Dili (di) is for the future, habits, and what something is like. Wala (wa) is for things that didn\'t happen and things that aren\'t there. Ayaw is for telling someone not to do something. After dili and wala the action keeps its mo- form, and ko / ka still comes right after the "no" word.',
    ex: [['Dili ko mokaon', "I won't eat", 'future: dili'], ['Dili ko gutom', "I'm not hungry", 'what something is like: dili'], ['Wala ko mokaon', "I didn't eat", 'past: wala, and the action stays mo-'], ['Wala koy kwarta', "I don't have money", "isn't there: wala"], ['Ayaw kaon ana', "Don't eat that", 'telling someone: ayaw']] },
  { id: 'time', title: 'The front of the action tells the time', short: 'mo- = will, ni- = did, nag- = doing. Same root, new front.',
    body: 'Bisaya doesn\'t change the end of an action word for tense. It changes the front. Take any action root and swap the front.',
    ex: [['Mokaon ko', 'I will eat', 'mo- = will'], ['Nikaon ko', 'I ate', 'ni- (or mi-) = did'], ['Nagkaon ko', "I'm eating / I was eating", 'nag- = in the middle of it'], ['Magluto ko', "I'll cook", 'mag- = will, for planned or longer things']] },
  { id: 'nako', title: 'Ko becomes nako when the thing is the focus', short: 'With gi- and -on actions, "I" is nako, not ko. Nako after a thing also means "my".',
    body: 'When the sentence is about the thing (the mango, the food), the doer changes form: ko becomes nako, ka becomes nimo, siya becomes niya. The same forms after a thing mean "my, your, his/her". After ganahan, the person you like takes this form too.',
    ex: [['Gikaon nako ang mangga', 'I ate the mango', 'gi- puts the mango in focus, so nako'], ['Balay nako', 'My house', 'same as akong balay'], ['Ganahan ko nimo', 'I like you', 'ko likes, nimo is the one liked']] },
  { id: 'mark', title: 'Pointer words: ang, si, sa, og', short: 'Ang = the (the main one). Si = before a name. Sa = to / at / in. Og = a / some.',
    body: 'These little pointers come right before the thing they point at. Ug is "and" but people also use it like og.',
    ex: [['Moadto ko sa merkado', "I'll go to the market", 'sa = to'], ['Mopalit ko og isda', "I'll buy some fish", 'og = some / a'], ['Nagluto si Mama', 'Mom is cooking', 'si before a name'], ['Lami ang isda', 'The fish is delicious', 'ang = the']] },
  { id: 'desc', title: 'Describing: nga and kaayo', short: 'Describe + nga + thing. Very = kaayo, after the describing word.',
    body: 'Nga hooks a describing word to a thing. After a vowel it shrinks to -ng. Kaayo (very) comes after the describing word.',
    ex: [['Dako nga balay → dakong balay', 'Big house', 'nga shrinks to -ng'], ['Lami kaayo', 'Very delicious', 'kaayo after'], ['Init kaayo karon', "It's very hot now", 'kaayo stays with init']] },
  { id: 'ask', title: 'Questions', short: 'Question word first, then ka. For yes / no, add ba after ka.',
    body: 'Put the question word at the front: asa (where), unsa (what), kinsa (who), kanus-a (when), ngano (why), pila (how many). For a yes / no question, add ba, or just raise your voice at the end.',
    ex: [['Asa ka?', 'Where are you?', 'asa first, ka second'], ['Unsa imong ngalan?', "What's your name?", 'unsa first'], ['Gutom ka ba?', 'Are you hungry?', 'ba after ka makes it yes / no']] },
  { id: 'have', title: 'Have / there is: naa and wala + y', short: 'Naa koy… = I have… Wala koy… = I don\'t have… ko + y = koy.',
    body: 'Bisaya says "there is, to me" instead of "I have". Naa (there is) or wala (there isn\'t), then the person with a -y stuck on: koy, kay, siyay.',
    ex: [['Naa koy kwarta', 'I have money', 'naa + ko + y'], ['Wala kay pagkaon?', "Don't you have food?", 'wala + ka + y'], ['Naay tawo sa gawas', "There's someone outside", 'naa + y']] },
  { id: 'want', title: 'Want, like, need + an action', short: 'Gusto / ganahan / kinahanglan, then ko, then the mo- action.',
    body: 'To say you want, like or need to do something, start with gusto, ganahan or kinahanglan. Ko / ka goes right after it (rule 2), then the action in its mo- form.',
    ex: [['Gusto ko mokaon', 'I want to eat', 'gusto, ko, mo-action'], ['Ganahan ka molangoy?', 'Do you like to swim?', 'ganahan, ka, mo-action'], ['Kinahanglan ko mopauli', 'I need to go home', 'kinahanglan, ko, mo-action']] }
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
  { id: 'will', rule: 'time', need: [], uses: 'v', make: (p, v) => [[v[1], p[0]], `${cap(p[1])} will ${v[3]}`], decoy: (p, v) => [v[2]] },
  { id: 'did', rule: 'time', need: [], uses: 'v', make: (p, v) => [[v[2], p[0]], `${cap(p[1])} ${v[4]}`], decoy: (p, v) => [v[1]] },
  { id: 'wont', rule: 'ko', need: ['dili'], uses: 'v', make: (p, v) => [['Dili', p[0], v[1]], `${cap(p[1])} won't ${v[3]}`], decoy: (p, v) => ['wala'] },
  { id: 'didnt', rule: 'neg', need: ['wala'], uses: 'v', make: (p, v) => [['Wala', p[0], v[1]], `${cap(p[1])} didn't ${v[3]}`], decoy: (p, v) => ['dili', v[2]] },
  { id: 'now', rule: 'little', need: ['na'], uses: 'v', make: (p, v) => [[v[1], 'na', p[0]], `${cap(p[1])} will ${v[3]} now`], decoy: (p, v) => ['pa'] },
  { id: 'want', rule: 'want', need: ['gusto'], uses: 'v', make: (p, v) => [['Gusto', p[0], v[1]], `${cap(p[1])} ${p[3] ? 'wants' : 'want'} to ${v[3]}`], decoy: (p, v) => [v[2]] },
  { id: 'like', rule: 'want', need: ['ganahan'], uses: 'v', make: (p, v) => [['Ganahan', p[0], v[1]], `${cap(p[1])} ${p[3] ? 'likes' : 'like'} to ${v[3]}`], decoy: (p, v) => ['ako'] },
  { id: 'where', rule: 'ask', need: ['asa'], uses: 'v', pron: ['ka', 'siya', 'sila'], make: (p, v) => [['Asa', p[0], v[1] + '?'], `Where will ${p[1]} ${v[3]}?`], decoy: (p, v) => ['unsa'] },
  { id: 'state', rule: 'first', need: [], uses: 's', make: (p, s) => [[cap(s[0]), p[0]], `${cap(p[1])} ${p[2]} ${s[1]}`], decoy: (p, s) => [p[0] === 'ko' ? 'ako' : 'ko'] },
  { id: 'very', rule: 'little', need: ['kaayo'], uses: 's', make: (p, s) => [[cap(s[0]), 'kaayo', p[0]], `${cap(p[1])} ${p[2]} very ${s[1]}`], decoy: (p, s) => ['gyud'] },
  { id: 'notstate', rule: 'neg', need: ['dili'], uses: 's', make: (p, s) => [['Dili', p[0], s[0]], `${cap(p[1])} ${p[2]} not ${s[1]}`], decoy: (p, s) => ['wala'] },
  { id: 'askstate', rule: 'ask', need: ['ba'], uses: 's', pron: ['ka'], make: (p, s) => [[cap(s[0]), 'ka', 'ba?'], `Are you ${s[1]}?`], decoy: (p, s) => ['ko'] }
];
