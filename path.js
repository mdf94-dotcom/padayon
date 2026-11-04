'use strict';
/* The learning path. Every source (building blocks, grammar, the phrase and word decks, conversation lines,
   the Mega-deck) is placed into five stages that build on each other. Inside a stage the sources are interleaved
   so each day mixes a building block, a phrase, a word and so on. A stage opens only after 80% of the one
   before it is learned (answered right on at least two separate days), so new material never outruns mastery.
   Selectors: f/g/p = unit indexes, d = conversation indexes, w = [from, to) word ranks, e = extra phrases,
   m = Mega-deck topic names (a trailing number range like 'Short Phrases 1-10' picks those parts). */
const STAGES = [
  { ceb: 'Unang lakang', name: 'First steps', level: 'Beginner (A1)',
    can: 'Greet people at any time of day, say how you are, introduce yourself, and use I / you / he-she / we.',
    f: [0, 1], g: [0], p: [0, 1, 2], d: [0, 1], w: [0, 100], e: [],
    m: ['Pronouns', 'Demonstratives', 'Basic Greetings', 'Common Courtesies', 'Addressing Someone', 'Numbers 1'] },
  { ceb: 'Adlaw-adlaw', name: 'Everyday life', level: 'Beginner (A1)',
    can: 'Talk about family, food, likes and wants, ask simple questions, and handle days, months and time.',
    f: [2, 3, 4], g: [1], p: [3, 4, 5, 6], d: [2, 3, 8, 9, 16, 21], w: [100, 300], e: [...Array.from({ length: 24 }, (_, i) => i + 1), ...Array.from({ length: 16 }, (_, i) => i + 25)], x: ['w457', 'w756', 'w499', 'w522', 'w652'],
    m: ['Visiting a Home', 'Asking Peers for Info', 'Meal Time', 'A1 - 100 Words', 'Everyday sayings', 'Common expressions 1', 'Family Relations',
      'Numbers 2', 'Days of the week', 'Months', 'Time', 'Conjunctions', 'Enclitics (little words)', 'Question words'] },
  { ceb: 'Sa gawas', name: 'Out and about', level: 'Elementary (A2)',
    can: 'Shop and haggle, ask and give directions, talk about the weather and how you feel, and say what you will do, did, and are doing.',
    f: [5, 6], g: [2], p: [7, 8, 9, 10], d: [4, 6, 10, 11, 12, 17, 20, 22], w: [300, 550], e: [],
    m: ['Time Expressions', 'Time Relation 1-3', 'Asking For/Giving Directions', 'Direction Words and Expressions', 'Buying at the Market', 'Shopping at the Store',
      'How much? How many? 1-2', 'Money', 'Weather', 'Physical Discomforts 1-2', 'Colours', 'Describing People', 'Describing Objects', 'Verb Roots 1-4',
      'A2 - 100 Words 1-2', 'Looking for a Person', 'Making a Telephone Call', 'Lending and Borrowing', 'Common expressions 2', 'Short Phrases 1-10'] },
  { ceb: 'Panag-istorya', name: 'Real conversations', level: 'Intermediate (B1)',
    can: 'Keep a conversation going without switching to English: invite and decline, tease and joke, compare, describe people and places, and follow everyday talk.',
    f: [], g: [], p: [11, 12, 13], d: [5, 7, 13, 14, 15, 18, 19, 23], w: [550, 800], e: [0],
    m: ['Extending an Invitation', 'Extending an Invitation to a Party', 'Refusing an Invitation', 'Invitational Expressions', 'Expressing Annoyance, etc.', 'Friendly Bantering',
      'Expressing Faith/Resignation', 'Making Concessions', 'Expressing Appreciation/Praise', 'Miscellaneous Expressions', 'Verbs + Conjugations 1-6', 'Action Words',
      'Adjectives', 'Expressing Quantity', 'Comparisons', 'Personality', '100 Daily Phrases 1-4', 'Short Phrases 11-29', 'Feelings', 'Body parts 1-2', 'More body parts',
      'Parts of a house', 'Things at home 1-4', 'Clothes', 'Fruits and vegetables 1-3', 'Tastes', 'Places', 'On the road', 'Friendship'] },
  { ceb: 'Hanas', name: 'Fluent and fast', level: 'Upper intermediate (B2)',
    can: 'Follow fast native speech, read and talk about news and ideas, and have the words for almost anything around you.',
    f: [], g: [], p: [], d: [], w: [800, 1002], e: [], m: ['*'] }
];
const PATH_GATE = 0.8;      // share of a stage that must be learned before the next one opens
const PATH_LAG_DAYS = 7;    // rough extra days to master a stage's last cards after they're introduced
