'use strict';
/* Real Bisaya: things real people said online, turned into a daily task.
   Tweets are shown with the official X embed and unlock only when every Bisaya word in them has been learned.
   English words, names and slang interjections are listed in REAL_SKIP so they don't block a tweet.
   Contractions are mapped to their full words (sakong = sa akong), so a tweet opens once those full words are learned.
   Clips are short timestamped bits of YouTube shows. Their Bisaya isn't written down anywhere we can check word by word,
   so a clip unlocks when the learner reaches its stage of the learning path. The English answer key is the show's own subtitles. */

const REAL_SKIP = new Set(('pwede pero pass okay lord god loves you dear crush reply move on importante happy graduate kalma sad friends ' +
  'profile pic personal proud para fight and next episode with bini colet hoy uy o sus inday mas boang naman kidnapon maka ma').split(' '));

// [x.com path, who, text, English, {contraction: 'full words'}, respond prompt, example reply]
const REAL_TWEETS = [
  ['/tjmusicmonterde/status/1315518671687544832', 'TJ Monterde', 'kung kita, kita gyud. kung dili, pwede kita gihapon?', "If it's meant to be us, it's really us. If not, can it still be us?", {}, 'Someone says this line to you. Answer yes: it can still be us.', 'Oo, kita gihapon.'],
  ['/Medyomaldito/status/875100904071901184', '@Medyomaldito', 'Gimingaw gyud ko nimo.', 'I really miss you.', {}, 'Reply: say you miss them too.', 'Gimingaw sad ko nimo.'],
  ['/Medyomaldito/status/988762291528089600', '@Medyomaldito', 'Hoy gimingaw ko nimo', 'Hey, I miss you', {}, 'Reply: ask where they are now.', 'Asa ka karon?'],
  ['/Medyomaldito/status/1078699632861954050', '@Medyomaldito', '"Ang akoa, akoa ra gyud na."', '"What\'s mine is mine alone."', {}, 'Point at your food and say "this is mine".', 'Akoa ni!'],
  ['/Medyomaldito/status/885810773049589760', '@Medyomaldito', '"Okay naman ko. Mingawon lang usahay."', '"I\'m okay. I just miss things sometimes."', { mingawon: 'gimingaw' }, 'A friend says this. Ask: "Are you okay?"', 'Okay ra ka?'],
  ['/Medyomaldito/status/990898437318033408', '@Medyomaldito', 'Pasalamat gyud ko ni Lord niabot ka nako.', "I'm truly thankful to the Lord that you came into my life.", { pasalamat: 'salamat' }, 'Say thank you very much to someone you love.', 'Salamat kaayo nimo.'],
  ['/Medyomaldito/status/1073436551894323200', '@Medyomaldito', 'God loves you, naa pa gyud ko.', "God loves you, and you've still got me too.", {}, 'Tell a friend: "I\'m just here."', 'Naa ra ko diri.'],
  ['/Medyomaldito/status/854757496392531968', '@Medyomaldito', '"Hilumon lagi ka?" O. Kay di man ko ganahan nimo.', '"You\'re the quiet type, huh?" Yeah. Because I don\'t like you.', {}, 'Now say the sweet version: "I like you."', 'Ganahan ko nimo.'],
  ['/Medyomaldito/status/768073598003097605', '@Medyomaldito', 'Dali ra gyud kaayo ka kidnapon. Ingnan ra\'g, "ngaon ta na!" Kuyog dayon ka.', 'You\'re so easy to kidnap. Just say "let\'s eat now!" and you come along right away.', { ingnan: 'ingon', "ra'g": 'ra', ngaon: 'mangaon' }, 'Invite someone: "Let\'s eat now."', 'Kaon na ta!'],
  ['/Medyomaldito/status/1073949024254709766', '@Medyomaldito', 'Dear crush, ako nalang pilia. Paspas ko mo reply. Bisag tog ko, mo reply ko nimo.', "Dear crush, just pick me. I reply fast. Even when I'm asleep, I'll reply to you.", { nalang: 'na lang', pilia: 'pili', tog: 'tulog', mo: 'mo' }, 'Text your crush: "Where are you?"', 'Asa ka?'],
  ['/Medyomaldito/status/833733483428065280', '@Medyomaldito', "Di gyud ko mutubag og BISAG ASA ug BISAG UNSA kung naa'y mangutana'g AHA MANGAON ug UNSAY GANAHAN KAONON.", 'I will never answer "anywhere" or "anything" when someone asks where we should eat and what I want to eat.', { "naa'y": 'naa', "mangutana'g": 'pangutana', aha: 'asa', kaonon: 'kaon', mutubag: 'tubag' }, 'Someone asks "Asa ta mangaon?" Answer with a real place.', 'Sa Jollibee ta.'],
  ['/Medyomaldito/status/964007354415988736', '@Medyomaldito', "Galisod ka'g move on kay gahuna huna ka nga wa na'y pareha niya. Pero sus Inday, daghan pa gyud kaayo. Mas maayo.", "You're struggling to move on because you think there's no one else like them. But oh Inday, there are so many more. Better ones.", { galisod: 'lisod', "ka'g": 'ka', gahuna: 'hunahuna', huna: 'hunahuna', wa: 'wala', "na'y": 'naa' }, 'Comfort a friend: "It\'s okay. There are many more."', 'Okay ra. Daghan pa.'],
  ['/Medyomaldito/status/925330218109112320', '@Medyomaldito', '"Unsa man gyud diay ta?" "Aynalang gud. Importante happy ta."', '"So what are we, really?" "Never mind. What matters is we\'re happy."', { aynalang: 'ayaw na lang', gud: 'gyud' }, 'Answer the question "Unsa man ta?" your way.', 'Magtiayon ta.'],
  ['/meunnie/status/1092029866185175041', '@meunnie', 'uy ganahan kaayo ko nimo :)', 'hey, I really like you :)', {}, 'Reply to this message.', 'Ganahan sad ko nimo!'],
  ['/meunnie/status/1114424434897477633', '@meunnie', 'gikapoy naman gyud ko uy', "I'm really tired now, ugh", {}, 'Tell them to rest first.', 'Pahulay sa.'],
  ['/meunnie/status/876412456607686656', '@meunnie', 'Lisod gyud kaayo basta way kwarta.', "It's really hard when you have no money.", {}, 'Agree with them.', 'Mao gyud!'],
  ['/meunnie/status/886458233052778496', '@meunnie', 'Daghan kaayo kog gusto buhaton sakong kinabuhi pero kapoy lang gyud', "There's so much I want to do with my life, but I'm just tired", { kog: 'ko', sakong: 'sa akong' }, 'Say one thing you want to do.', 'Gusto ko mobiyahe.'],
  ['/meunnie/status/969547994767831042', '@meunnie', 'maka graduate lagi ka. kalma lang gyud.', "you'll graduate, I promise. just stay calm.", {}, 'Encourage a friend: "You can do it."', 'Kaya nimo na!'],
  ['/meunnie/status/1137975022494949377', '@meunnie', 'BASTA BISAYA GWAPA KAAYO', "IF SHE'S BISAYA, SHE'S REALLY PRETTY", {}, 'Say it about the guys too.', 'Basta Bisaya, gwapo kaayo!'],
  ['/meunnie/status/1023586164769349632', '@meunnie', 'di gyud ko ganahan ma sad akong friends', "I really don't like it when my friends are sad", {}, 'Tell a sad friend: "Don\'t be sad."', 'Ayaw kaguol.'],
  ['/meunnie/status/1209339241399910400', '@meunnie', 'wa gyud ko kasabot aning paskoha bitaw', "I honestly don't get this Christmas at all", { wa: 'wala', kasabot: 'sabot', aning: 'ani', paskoha: 'pasko' }, 'Say "I don\'t understand."', 'Wala ko kasabot.'],
  ['/SikyuCebu/status/926803419830009856', '@SikyuCebu', 'Naa gyud uban gwapo/gwapa sa profile pic pero sa personal...buotan diay.', "Some people really are good-looking in their profile pic, but in person… turns out they're kind.", {}, 'Describe someone you know in two words.', 'Buotan ug gwapa.'],
  ['/ABSCBN/status/1813881023949857185', 'ABS-CBN', 'Basta bisaya, kusgan gyud! Fight lang and tan-aw na sa next episode with BINI Colet!', "If you're Bisaya, you're really strong! Just fight, and watch the next episode with BINI Colet!", {}, 'Say "We\'re strong!"', 'Kusgan ta!']
];

// {yt, from, to, show, stage (0-based path stage it opens at), en: subtitle lines, q: gist question, a: [right, wrong, wrong], say: respond prompt, ex: example reply}
const REAL_CLIPS = [
  { yt: '6ZpStgdGwvs', from: 0, to: 17, show: 'Kuan On One · Melai Cantiveros', stage: 0,
    en: ['A round of applause, my fellow Bisaya!', 'We heard all your requests, so here we are.', 'We finally made this show.', 'We will call you Kuanizens.', "I'm your Kuauntie.", 'And this is… Kuan On One!'],
    q: 'Who is Melai talking to at the start?', a: ['Her fellow Bisaya', 'Her teachers', 'People in Manila'],
    say: 'Melai says hi to the Bisaya watching. Greet her back.', ex: 'Kumusta, Melai!' },
  { yt: '6ZpStgdGwvs', from: 91, to: 98, show: 'Kuan On One · Melai & Kim Chiu', stage: 0,
    en: ["Anyway, let's start. How are you?", 'First of all, congratulations on your new show!'],
    q: 'What does Melai ask Kim?', a: ['How she is', 'Where she lives', 'If she is hungry'],
    say: 'Melai asks you the same thing. Answer her.', ex: 'Maayo man ko, salamat!' },
  { yt: '6ZpStgdGwvs', from: 64, to: 80, show: 'Kuan On One · Melai & Kim Chiu', stage: 1,
    en: ["My Miga! Let's give her a round of applause!", "Thank you very much for coming. I know you're busy, but…", "I'm never busy for you. You know that.", "In fact, when I got the invite, I didn't think twice."],
    q: 'What does Kim say back to Melai?', a: ["She's never too busy for her", "She can't stay long", 'She almost said no'],
    say: 'Thank someone very much for coming.', ex: 'Salamat kaayo sa pag-anhi!' },
  { yt: '6ZpStgdGwvs', from: 156, to: 172, show: 'Kuan On One · Melai & Kim Chiu', stage: 2,
    en: ['Well, I have no other choice but to be strong.', 'What else are we supposed to do?', 'We Bisaya are so strong, huh?', "That's true! We never give up.", "That's why I'm a proud Bisaya. We're really strong.", "And we're brave."],
    q: 'What do they say Bisaya people are like?', a: ['Strong and brave', 'Shy and quiet', 'Always late'],
    say: 'Say: "We Bisaya are strong."', ex: 'Kusgan gyud ta nga mga Bisaya.' },
  { yt: 'KdO3Khe0xtg', from: 78, to: 94, show: 'Kuan On One · Melai & BINI Colet', stage: 1,
    en: ['Hello.', 'Oh, we can speak Visayan here, right?', "Hi, ma'am.", '[MELAI] Don\'t call me "ma\'am"! What do you mean "ma\'am"?', 'Visayans often use "ma\'am," right?'],
    q: 'Why does Melai stop Colet?', a: ['Colet called her "ma\'am"', 'Colet spoke in English', 'Colet was late'],
    say: 'Ask: "Can we speak Bisaya here?"', ex: 'Pwede ta mag-Bisaya diri?' },
  { yt: 'KdO3Khe0xtg', from: 135, to: 147, show: 'Kuan On One · Melai & BINI Colet', stage: 0,
    en: ["Hi. Hi, guys! I'm Colet from Bohol.", 'I feel shy.', "Don't be shy because your host is nothing special.", 'Just kidding.'],
    q: 'How does Colet introduce herself?', a: ["She's Colet, from Bohol", "She's Colet, from Cebu", "She's Melai's cousin"],
    say: 'Introduce yourself the same way: your name and where you are from.', ex: 'Ako si Ana, taga Cebu ko.' },
  { yt: 'KdO3Khe0xtg', from: 147, to: 163, show: 'Kuan On One · Melai & BINI Colet', stage: 1,
    en: ["First, let's talk about your home in Bohol.", 'Where in Bohol are you from, BINI Colet?', 'Uh, in Tagbilaran. Right in the city.', "We live near each other, ma'am. I mean, Melai."],
    q: 'Where in Bohol is Colet from?', a: ['Tagbilaran, in the city', 'A small island', 'The mountains'],
    say: 'Someone asks "Taga asa ka?" Answer.', ex: 'Taga Cebu ko.' },
  { yt: 'KdO3Khe0xtg', from: 186, to: 198, show: 'Kuan On One · Melai & BINI Colet', stage: 2,
    en: ['So, how are you doing now?', "I'm doing much better now compared to when I started.", "I can handle it, ma'am-- Oh, I mean, Melai."],
    q: 'How is Colet doing now?', a: ['Much better than when she started', 'Tired and homesick', 'About to quit'],
    say: 'Say you are doing better now.', ex: 'Mas maayo na ko karon.' },
  { yt: 'KdO3Khe0xtg', from: 215, to: 237, show: 'Kuan On One · Melai & BINI Colet', stage: 3,
    en: ['I was alone and had a hard time explaining things in Tagalog.', "I didn't like talking in Tagalog because I really struggled.", "It's hard because you have to compose your sentences.", "Right. And I hated small talks because I'm an introvert.", "I'd translate first in my head what I wanted to say."],
    q: 'What was hard for Colet?', a: ['Speaking in Tagalog', 'Singing in English', 'Dancing'],
    say: 'Say: "It\'s hard, but I can do it."', ex: 'Lisod, pero kaya nako.' },
  { yt: 'avSZ5Z3aPl0', from: 20, to: 36, show: 'Kristina Ligaya · first vlog in Cebuano', stage: 1,
    en: ['Hello good afternoon! Welcome to our first vlog ever!', 'Come here!', 'Say Hi! Hi camera!', "Don't fool around."],
    q: 'What time of day does she greet you with?', a: ['Good afternoon', 'Good morning', 'Good evening'],
    say: 'Greet her back with the same greeting.', ex: 'Maayong hapon!' },
  { yt: 'avSZ5Z3aPl0', from: 110, to: 124, show: 'Kristina Ligaya · first vlog in Cebuano', stage: 3,
    en: ['So we were encouraged. And I asked my husband, "Why don\'t we try vlogging?"', '"Oh yeah? So what would possibly be your contents?" he asked', 'Well… what are our inclinations? Cooking… eating… and travels.'],
    q: 'What does she want to vlog about?', a: ['Cooking, eating and travel', 'Makeup and fashion', 'Games and music'],
    say: 'Say what you like to do: "I like to cook."', ex: 'Ganahan ko magluto.' }
];
