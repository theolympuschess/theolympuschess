/* =========================================================
   OLYMPUS AI — OFFLINE KNOWLEDGE
   Chess rules, learning tips, terminology and a small
   country/capital/currency/language lookup.

   Chess entries only answer real question phrasing
   ("what is...", "how does...") so dashboard words like
   "tactics" or "puzzle" still go to feature search.
   ========================================================= */

import { normalizeChat } from "./ai-context.js";
import { findPlace } from "./ai-world-time.js";

const QUESTION_LEAD = /\b(?:what|whats|who|define|meaning|mean|explain|describe|tell me about|how does|how do|how can|how should|how to|how many|why|which)\b/;

const define = term =>
  new RegExp(`\\b(?:what is|whats|what are|what does|define|meaning of|explain|describe|tell me about)\\b.*\\b(?:${term})\\b|\\b(?:${term}) mean`);

/* ---------- chess knowledge ---------- */

const PIECE_MOVES = {
  rook: "A rook moves any number of squares in a straight line, forward, backward or sideways. ♜ It can't jump over other pieces.",
  bishop: "A bishop moves any number of squares diagonally. ♗ Each bishop stays on one colour of square for the whole game.",
  queen: "The queen moves any number of squares in a straight line or diagonally, like a rook and bishop combined. ♛ She's the strongest piece!",
  king: "The king moves one square in any direction. ♚ He can never move into check, and protecting him is the whole point of the game.",
  pawn: "A pawn moves forward one square (or two squares on its first move) but captures one square diagonally forward. ♟️ It can never move backwards."
};

const CHESS_ENTRIES = [
  {
    id: "knight-move",
    match: /\bknights? (?:move|moves|moving)\b|\bhow (?:does|do) (?:a |the )?knight\b|\bhow (?:does|do) (?:a |the )?horse move\b/,
    answer: "A knight moves in an 'L' shape: two squares in one direction, then one square sideways. ♞ It's the only piece that can jump over other pieces!",
    more: "Tip: a knight always lands on a square of the opposite colour to the one it started on. Knights are strongest near the centre, where they can reach up to eight squares."
  },
  {
    id: "piece-values",
    match: /\b(?:piece values?|value of (?:the )?pieces|how much is (?:a |the )?(?:queen|rook|bishop|knight|pawn) worth|how many points)\b/,
    answer: "A common guide: pawn = 1, knight = 3, bishop = 3, rook = 5, queen = 9. ♟️ The king has no value because losing him ends the game.",
    more: "These numbers are only a guide. Position, safety and tactics can matter more than raw points."
  },
  {
    id: "castling",
    match: define("castl(?:e|ing)"),
    answer: "Castling is a special move where the king and a rook move together in one turn. The king slides two squares towards the rook and the rook jumps to the other side of the king. 🏰 It keeps your king safe and brings the rook into play.",
    more: "Rules: neither piece may have moved before, there must be no pieces between them, the king can't be in check, and he can't pass through or land on an attacked square."
  },
  {
    id: "en-passant",
    match: define("en passant"),
    answer: "En passant ('in passing') is a special pawn capture. If an enemy pawn jumps two squares and lands right beside your pawn, you may capture it as if it had moved only one square, but only on your very next move.",
    more: "It only applies to pawns and only right after the two-square jump. If you wait a move, the chance is gone!"
  },
  {
    id: "checkmate",
    match: define("checkmate|mate"),
    answer: "Checkmate is when a king is in check and can't escape, by moving, capturing the attacker or blocking. The game ends and the side that delivered checkmate wins! ♚",
    more: "The fastest possible checkmate is Fool's Mate, which takes just two moves by each side, but only if someone plays very badly!"
  },
  {
    id: "stalemate",
    match: define("stalemate"),
    answer: "Stalemate is when it's your turn, your king is NOT in check, but you have no legal move. The game is a draw!",
    more: "Be careful when you're far ahead. A rushed move can let your opponent escape with a stalemate."
  },
  {
    id: "draw",
    match: define("draws?"),
    answer: "A draw is a game with no winner. It can happen by stalemate, agreement, threefold repetition, the fifty-move rule, or when neither side has enough pieces to checkmate. Each player gets half a point.",
    more: "Threefold repetition means the same position appears three times. The fifty-move rule applies when fifty moves pass without a pawn move or a capture."
  },
  {
    id: "promotion",
    match: define("promotion|promote|promoting"),
    answer: "Promotion happens when a pawn reaches the far side of the board. It must turn into a queen, rook, bishop or knight (never a king or pawn). Most players choose a queen! 👑",
    more: "Choosing a different piece is called underpromotion. A knight is sometimes best, for example to give an immediate check or fork."
  },
  {
    id: "fork",
    match: define("forks?"),
    answer: "A fork is when one piece attacks two or more enemy pieces at once, so your opponent can't save everything. Knights are famous for forks! ♞",
    more: "A knight attacking the king and queen together is often called a royal fork. Always check for forks before you move!"
  },
  {
    id: "pin",
    match: define("pins?|pinned"),
    answer: "A pin is when a piece can't move (or shouldn't) because it would expose a more valuable piece behind it. In an absolute pin, the piece behind is the king, so moving is illegal.",
    more: "Bishops, rooks and queens create pins because they move in lines. Attacking a pinned piece again is a great way to win it."
  },
  {
    id: "skewer",
    match: define("skewers?"),
    answer: "A skewer is like a reverse pin: you attack a valuable piece, it has to move, and you win the less valuable piece behind it.",
    more: "Skewers often happen with rooks, bishops and queens, usually against a king and a piece lined up behind it."
  },
  {
    id: "discovered",
    match: define("discovered (?:attack|check)|discovery"),
    answer: "A discovered attack happens when you move one piece and reveal an attack from another piece behind it. Two threats at once can be very powerful!",
    more: "If the revealed attack is on the king, it's a discovered check. A discovered check from one piece while another makes a threat can win a lot of material."
  },
  {
    id: "opposition",
    match: define("opposition"),
    answer: "Opposition is a king-and-pawn endgame idea. When two kings face each other with one empty square between them, the player who does NOT have to move holds the opposition and can push the other king back.",
    more: "Opposition decides many pawn endings. Learn it early, because it's one of the most useful endgame ideas."
  },
  {
    id: "improve",
    match: /\b(?:improve|get better|become better|get stronger|play better)\b.*\bchess\b|\bchess\b.*\b(?:improve|get better|get stronger)\b|\bhow (?:can|do|should) i (?:improve|get better)\b/,
    answer: "Here's a simple plan: 1) solve a few tactics puzzles every day, 2) play longer games and think before each move, 3) review your games to find your mistakes, 4) learn basic endgames and 5) study a few simple openings. Small steady practice beats long rare sessions! ♟️",
    more: "Check the Training section of the dashboard for puzzles and quizzes. Ask me about a specific skill, like calculation, endgames or avoiding blunders."
  },
  {
    id: "beginner-practice",
    match: /\bbeginners?\b.*\b(?:practi[cs]e|train|learn|start)\b|\bhow (?:should|do|can) (?:a )?beginners? (?:practi[cs]e|train|learn)\b|\bhow (?:to|do i) start (?:learning )?chess\b/,
    answer: "Beginners can start with: learn how the pieces move, practise checkmates (king + queen, king + rook), solve simple one-move and two-move puzzles daily, and play friendly games. Always check if your piece is safe before you move! 🌱",
    more: "After that, learn the basic opening ideas: control the centre, develop your knights and bishops, and castle early."
  },
  {
    id: "good-opening",
    match: /\b(?:good|best|great) openings?\b|\bwhich opening\b|\bopening (?:should|to) (?:i )?(?:play|learn|use)\b|\bwhat opening\b/,
    answer: "A good opening follows simple rules: fight for the centre with pawns, develop knights and bishops quickly, castle early, and don't move the same piece twice without a reason. Many beginners enjoy 1.e4 e5 positions like the Italian Game. ♟️",
    more: "Understanding ideas matters more than memorising long lines. The Study section of the dashboard has opening material."
  },
  {
    id: "calculation",
    match: /\b(?:improve|train|practi[cs]e|get better at|develop)\b.*\bcalculation\b|\bcalculation\b.*\b(?:improve|train|practi[cs]e)\b|\bhow (?:do|can|to) (?:i )?calculate\b/,
    answer: "To improve calculation: look at forcing moves first (checks, captures, threats), picture the board a few moves ahead, check your opponent's best replies, and practise solving puzzles without moving the pieces. Start with two or three moves and slowly go deeper. 🧠",
    more: "A useful habit is to double-check the final position before playing: is anything of mine hanging?"
  },
  {
    id: "positional",
    match: /\b(?:improve|learn|understand|develop)\b.*\b(?:positional|strategy|strategic)\b|\bpositional (?:play|understanding|chess)\b/,
    answer: "Positional play is about long-term advantages: good piece activity, a safe king, healthy pawn structure and control of key squares. Improve it by studying model games, asking 'where do my pieces want to go?' and learning common plans. ♟️",
    more: "Ask yourself each move: which is my worst-placed piece, and how can I improve it?"
  },
  {
    id: "blunders",
    match: /\b(?:stop|avoid|reduce|prevent|fix)\b.*\b(?:blunder|blundering|blunders|mistakes)\b|\bhow (?:do|can|to) (?:i )?(?:not )?blunder\b/,
    answer: "To blunder less: before every move, ask 1) What does my opponent threaten now? 2) Does my move leave anything undefended? 3) Are there checks, captures or threats I missed? Slow down on critical moves, and review your mistakes after games. 🛑",
    more: "Most blunders happen when we move fast or only look at our own plan. A simple safety check before each move helps a lot."
  },
  {
    id: "endgame-improve",
    match: /\b(?:improve|learn|study|practi[cs]e|get better at)\b.*\bendgames?\b|\bendgames? (?:training|practice|tips)\b/,
    answer: "To improve at endgames: learn basic checkmates, king and pawn endings (opposition!), rook endgames and the importance of an active king. Practise with small positions until the technique becomes automatic. 👑",
    more: "Remember: in the endgame the king becomes a strong piece, so bring it to the centre."
  },
  {
    id: "tournament-prep",
    match: /\b(?:prepare|preparation|prepping|get ready)\b.*\btournaments?\b|\btournaments?\b.*\b(?:prepare|preparation|tips)\b/,
    answer: "Tournament tips: sleep well, eat properly, arrive early, practise tactics and a few openings you know, and manage your clock. Write down your moves carefully, check your opponent's threats every move, and stay calm after a mistake. 🏆",
    more: "Review each game afterwards, win or lose. That's where the biggest improvement comes from."
  },
  {
    id: "fide",
    match: define("fide(?: rating)?"),
    answer: "FIDE is the international chess federation (Fédération Internationale des Échecs). A FIDE rating is a number that shows your playing strength in official rated games, calculated with the Elo system. Higher is stronger, and the Grandmaster title needs norms plus a rating of 2500 or more.",
    more: "Ratings go up when you beat stronger opponents and down when you lose to weaker ones. FIDE publishes official rating lists regularly."
  },
  {
    id: "elo",
    match: define("elo(?: rating)?"),
    answer: "An Elo rating is a number that estimates your chess strength. It is named after Arpad Elo, who created the system. You gain points when you win, lose points when you lose, and the amount depends on how strong your opponent is.",
    more: "FIDE uses the Elo system for official ratings. Online sites often use similar but separate rating systems, so the numbers can differ."
  },
  {
    id: "rapid",
    match: define("rapid(?: chess)?"),
    answer: "Rapid chess is a faster time control. Each player usually has about 10 to 60 minutes for the whole game. ⏱️ It's a nice balance between thinking time and excitement.",
    more: "Exact limits vary by organiser, so check your tournament's rules."
  },
  {
    id: "blitz",
    match: define("blitz(?: chess)?"),
    answer: "Blitz is fast chess. Each player usually has about 3 to 10 minutes for the whole game. ⚡ You need to think and move quickly!",
    more: "Blitz is great for practising pattern recognition, but slower games are better for learning to calculate deeply."
  },
  {
    id: "bullet",
    match: define("bullet(?: chess)?"),
    answer: "Bullet is super-fast chess. Each player usually gets only about 1 to 2 minutes for the entire game! 🚀",
    more: "Because it's so fast, bullet is more about speed and instinct than deep planning."
  },
  {
    id: "classical",
    match: define("classical(?: chess)?"),
    answer: "Classical chess is the slowest time control. Players usually get more than an hour each, so they can think deeply. 🧠 Most major championships are played this way.",
    more: "It's the best format for improving your thinking, because you have time to calculate and plan."
  },
  {
    id: "opening-term",
    match: define("opening|openings"),
    answer: "The opening is the first stage of a game, usually the first 10 to 15 moves. 🚀 The goals are to control the centre, develop your pieces and get your king safe, usually by castling.",
    more: "After the opening comes the middlegame, then the endgame."
  },
  {
    id: "middlegame",
    match: define("middlegame|middle game"),
    answer: "The middlegame is the stage after the opening, when most pieces are still on the board. ♟️ This is where plans, tactics and attacks usually decide the game.",
    more: "A good approach is to improve your worst piece and look for your opponent's weaknesses."
  },
  {
    id: "endgame-term",
    match: define("endgame|end game"),
    answer: "The endgame is the final stage, when few pieces remain. 👑 The king becomes more active, pawns become very important and promoting a pawn is often the goal.",
    more: "Studying the endgame is a great way to improve. Ask me how to practise endgames."
  },
  {
    id: "tactics",
    match: define("tactics?|tactical"),
    answer: "Tactics are short-term tricks that win material or checkmate, like forks, pins, skewers and discovered attacks. ⚔️ Solving puzzles every day is the best way to get sharper.",
    more: "Look for checks, captures and threats first. They're called forcing moves because your opponent must answer them."
  },
  {
    id: "strategy",
    match: define("strategy|strategic"),
    answer: "Strategy is long-term planning in chess: improving your pieces, controlling key squares, creating pawn weaknesses and choosing a plan. 🗺️ Tactics win material; strategy shapes the position.",
    more: "A simple strategic habit is to improve your worst piece each move when nothing urgent is happening."
  },
  {
    id: "initiative",
    match: define("initiative"),
    answer: "Having the initiative means you're making the threats and your opponent must keep responding. ⚡ It's a kind of momentum that can be worth more than a small material gain.",
    more: "Keep making useful threats, but don't spend it carelessly. Once you lose the initiative, your opponent takes over."
  },
  {
    id: "zugzwang",
    match: define("zugzwang"),
    answer: "Zugzwang (German for 'compulsion to move') is when any move you make worsens your position, but you must move anyway. 😬 It's common in endgames.",
    more: "It only exists because chess forces you to move. That's why keeping a spare waiting move can be so valuable."
  }
];

/* Single entry for "how does a rook/bishop/queen/king/pawn move". */
function pieceMoveAnswer(text) {
  const match = text.match(/\bhow (?:does|do) (?:a |the )?(rook|bishop|queen|king|pawn)s? move\b|\b(rook|bishop|queen|king|pawn)s? (?:movement|moves)\b/);
  const piece = match && (match[1] || match[2]);
  return piece ? PIECE_MOVES[piece] : null;
}

export function answerChessKnowledge(message) {
  const text = normalizeChat(message);

  if (!QUESTION_LEAD.test(text)) return null;

  const pieceText = pieceMoveAnswer(text);
  if (pieceText) {
    return { text: pieceText, more: null, topic: "piece-move" };
  }

  for (const entry of CHESS_ENTRIES) {
    if (entry.match.test(text)) {
      return { text: entry.answer, more: entry.more || null, topic: entry.id };
    }
  }

  return null;
}

/* ---------- countries: small verified lookup ---------- */

const COUNTRIES = [
  { name: "the United States", aliases: ["usa", "united states", "america", "u s", "u s a"], capital: "Washington, D.C.", currency: "US dollar", language: "English is the most widely spoken language" },
  { name: "the United Kingdom", aliases: ["uk", "united kingdom", "britain", "great britain", "england"], capital: "London", currency: "pound sterling", language: "English" },
  { name: "India", aliases: ["india"], capital: "New Delhi", currency: "Indian rupee", language: "Hindi and English are the main official languages, along with many regional languages like Bengali, Tamil and Telugu" },
  { name: "Japan", aliases: ["japan"], capital: "Tokyo", currency: "Japanese yen", language: "Japanese" },
  { name: "China", aliases: ["china"], capital: "Beijing", currency: "renminbi (yuan)", language: "Mandarin Chinese" },
  { name: "Germany", aliases: ["germany"], capital: "Berlin", currency: "euro", language: "German" },
  { name: "France", aliases: ["france"], capital: "Paris", currency: "euro", language: "French" },
  { name: "Italy", aliases: ["italy"], capital: "Rome", currency: "euro", language: "Italian" },
  { name: "Spain", aliases: ["spain"], capital: "Madrid", currency: "euro", language: "Spanish" },
  { name: "the Netherlands", aliases: ["netherlands", "holland"], capital: "Amsterdam", currency: "euro", language: "Dutch" },
  { name: "Switzerland", aliases: ["switzerland"], capital: "Bern", currency: "Swiss franc", language: "German, French, Italian and Romansh" },
  { name: "Norway", aliases: ["norway"], capital: "Oslo", currency: "Norwegian krone", language: "Norwegian" },
  { name: "Sweden", aliases: ["sweden"], capital: "Stockholm", currency: "Swedish krona", language: "Swedish" },
  { name: "Russia", aliases: ["russia"], capital: "Moscow", currency: "Russian ruble", language: "Russian" },
  { name: "Turkey", aliases: ["turkey"], capital: "Ankara", currency: "Turkish lira", language: "Turkish" },
  { name: "Canada", aliases: ["canada"], capital: "Ottawa", currency: "Canadian dollar", language: "English and French" },
  { name: "Australia", aliases: ["australia"], capital: "Canberra", currency: "Australian dollar", language: "English" },
  { name: "New Zealand", aliases: ["new zealand"], capital: "Wellington", currency: "New Zealand dollar", language: "English and Māori" },
  { name: "Brazil", aliases: ["brazil"], capital: "Brasília", currency: "Brazilian real", language: "Portuguese" },
  { name: "Argentina", aliases: ["argentina"], capital: "Buenos Aires", currency: "Argentine peso", language: "Spanish" },
  { name: "Mexico", aliases: ["mexico"], capital: "Mexico City", currency: "Mexican peso", language: "Spanish" },
  { name: "South Korea", aliases: ["south korea", "korea"], capital: "Seoul", currency: "South Korean won", language: "Korean" },
  { name: "Singapore", aliases: ["singapore"], capital: "Singapore", currency: "Singapore dollar", language: "English, Malay, Mandarin and Tamil" },
  { name: "the United Arab Emirates", aliases: ["uae", "united arab emirates"], capital: "Abu Dhabi", currency: "UAE dirham", language: "Arabic" },
  { name: "Egypt", aliases: ["egypt"], capital: "Cairo", currency: "Egyptian pound", language: "Arabic" },
  { name: "South Africa", aliases: ["south africa"], capital: "Pretoria (executive), Cape Town (legislative) and Bloemfontein (judicial)", currency: "South African rand", language: "11 official languages, including English, Zulu and Afrikaans" },
  { name: "Bangladesh", aliases: ["bangladesh"], capital: "Dhaka", currency: "Bangladeshi taka", language: "Bengali" },
  { name: "Nepal", aliases: ["nepal"], capital: "Kathmandu", currency: "Nepalese rupee", language: "Nepali" },
  { name: "Pakistan", aliases: ["pakistan"], capital: "Islamabad", currency: "Pakistani rupee", language: "Urdu and English are the official languages" }
];

const COUNTRY_INDEX = COUNTRIES
  .flatMap(country => country.aliases.map(alias => ({ alias, country })))
  .sort((a, b) => b.alias.length - a.alias.length);

function findCountry(text) {
  for (const { alias, country } of COUNTRY_INDEX) {
    if (new RegExp(`(?:^|\\s)${alias}(?=\\s|$)`).test(text)) return country;
  }
  return null;
}

export function answerCountryQuestion(message) {
  const text = normalizeChat(message);

  const asksCapital = /\bcapital(?: city)? of\b|\bcapital\b/.test(text);
  const asksCurrency = /\bcurrency\b|\bmoney (?:of|in|used in)\b/.test(text);
  const asksLanguage = /\blanguages? (?:is |are |do they )?(?:spoken|used|speak)?\b|\bspeak in\b|\bspoken in\b/.test(text);
  const asksWhichCountry = /\b(?:which|what) country\b/.test(text);

  if (!asksCapital && !asksCurrency && !asksLanguage && !asksWhichCountry) {
    return null;
  }

  /* "Which country is Tokyo in?" */
  if (asksWhichCountry) {
    const place = findPlace(message);
    if (place && place.kind === "city" && place.country) {
      return { text: `${place.name} is in ${place.country}. 🌍`, topic: "country" };
    }
    if (place && place.kind === "country") {
      return { text: `${place.name} is a country itself. 🌍 Did you mean to ask about one of its cities?`, topic: "country" };
    }
    return null;
  }

  /* Only handle clearly phrased country questions. */
  if (asksLanguage && !/\b(?:language|languages|speak|spoken)\b/.test(text)) return null;
  if (asksCapital && !/\bcapital\b/.test(text)) return null;

  const country = findCountry(text);

  if (!country) {
    if (/\b(?:capital of|currency of|currency in|language spoken in|languages spoken in|speak in|spoken in)\b/.test(text)) {
      return {
        text: "Hmm, that country isn't in my small built-in list yet. 🌍 Try a major country like Japan, Brazil or Germany.",
        topic: "country"
      };
    }
    return null;
  }

  if (asksCapital) {
    return { text: `The capital of ${country.name} is ${country.capital}. 🏛️`, topic: "country" };
  }
  if (asksCurrency) {
    return { text: `The currency of ${country.name} is the ${country.currency}. 💱`, topic: "country" };
  }
  if (asksLanguage) {
    return { text: `In ${country.name}: ${country.language}. 🗣️`, topic: "country" };
  }

  return null;
}