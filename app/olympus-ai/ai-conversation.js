/* =========================================================
   OLYMPUS AI — CONVERSATION, PERSONALITY AND BRAND
   Greetings, small talk, emotions, appreciation, identity,
   Olympus brand answers, jokes, facts, riddles and
   context-aware follow-ups.

   Returns { type: "conversation", text } or null when the
   message is not conversational (so the engine can continue
   to knowledge and feature search).
   ========================================================= */

import { OLYMPUS_AI_IDENTITY as ID } from "./ai-config.js";
import {
  normalizeChat,
  wordCount,
  getContext,
  recordIntent,
  pick
} from "./ai-context.js";

/* ---------- content pools ---------- */

const JOKES = [
  "Why did the chess player bring a ladder? To reach the next level! ♟️😂",
  "Why did the knight refuse to walk straight? Because moving in an L-shape is its style! ♞😂",
  "Why was the chessboard so calm? Because everyone knew their place! 😄",
  "Why don't chess players ever get locked out? They always know how to castle! 🏰😂",
  "What do you call a chess piece that's great at parties? A bishop... because it always brings a diagonal crowd! 😄",
  "Why did the pawn become so confident? It could see a queen in its future! 👑😂"
];

const FACTS = [
  "Chess is about 1,500 years old and began in India as a game called chaturanga.",
  "The knight is the only piece that can jump over other pieces when it moves.",
  "The number of possible chess games is far bigger than the number of atoms in the observable universe.",
  "The fastest possible checkmate, called Fool's Mate, takes just two moves by each side.",
  "In 1997, IBM's Deep Blue became the first computer to beat a reigning world champion, Garry Kasparov, in a match.",
  "The word checkmate is often explained as coming from the Persian 'shah mat', roughly 'the king is helpless'.",
  "A pawn that reaches the far side of the board can become a queen, a rook, a bishop or a knight."
];

const RIDDLES = [
  {
    q: "I move in an L-shape and can jump over other pieces. What am I?",
    answer: "a knight ♞",
    keywords: ["knight", "horse"]
  },
  {
    q: "I start small, can't move backwards, and might become a queen one day. What am I?",
    answer: "a pawn ♟️",
    keywords: ["pawn"]
  },
  {
    q: "If I'm lost, the game is lost, yet I can only move one square at a time. What am I?",
    answer: "the king ♚",
    keywords: ["king"]
  },
  {
    q: "I move like a rook and a bishop combined. What am I?",
    answer: "the queen ♛",
    keywords: ["queen"]
  },
  {
    q: "Quick quiz: how many squares are there on a chessboard?",
    answer: "64 (8 × 8)",
    keywords: ["64", "sixty four"]
  },
  {
    q: "Quick quiz: which piece moves only on one colour of squares, all game long?",
    answer: "the bishop ♗",
    keywords: ["bishop"]
  }
];

/* ---------- helpers ---------- */

function say(intent, text, extra) {
  recordIntent(intent, extra);
  return { type: "conversation", text };
}

function partOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function jokeReply() {
  const joke = pick("joke", JOKES);
  return say("joke", `${joke} Want another one?`, { pending: { type: "joke" } });
}

function factReply() {
  const fact = pick("fact", FACTS);
  return say("fact", `💡 Fun fact: ${fact} Want another?`, { pending: { type: "fact" } });
}

function riddleReply() {
  const riddle = pick("riddle", RIDDLES.map((r, i) => i));
  const item = RIDDLES[riddle];
  return say(
    "riddle",
    `🧩 ${item.q} Type your answer, or say "give up" for the answer.`,
    { pending: { type: "riddle", answer: item.answer, keywords: item.keywords } }
  );
}

const test = (text, re) => re.test(text);

/* ---------- patterns ---------- */

const GREETING_WORD =
  "(?:hi+|hello+|helo+|hey+|heya+|hiya+|yo+|sup|howdy|hola|namaste|greetings|good (?:morning|afternoon|evening)|morning|afternoon|evening)";
const GREETING_TAIL =
  "(?: (?:there|olympus ai|olympus|everyone|buddy|friend|team))*";
const GREETING_ONLY = new RegExp(`^${GREETING_WORD}${GREETING_TAIL}$`);
const GREETING_PREFIX = new RegExp(`^${GREETING_WORD}${GREETING_TAIL} (.+)$`);

const YES = /^(?:yes|yeah|yep|yup|sure|ok sure|okay sure|please|yes please|of course|definitely|go ahead|why not|sounds good|lets do it)$/;
const SOFT_OK = /^(?:ok|okay|alright|fine|k|kk|got it|understood|i see)$/;
const NO = /^(?:no|nope|nah|no thanks|no thank you|not really|maybe later|not now)$/;
const MORE = /^(?:tell me more|more|more please|go on|continue|and then|then what|what else|keep going|explain|explain that|explain it|elaborate|say more|why|why is that|how|how so|can you explain|another|another one|one more|next)$/;

const EMOTION_LEAD =
  "(?:im|i am|i feel|feeling|im feeling|i am feeling|so)";
const INTENSIFIER =
  "(?:really |so |very |kinda |a little |quite |pretty |super |a bit )?";

const EMOTIONS = [
  {
    id: "happy",
    re: new RegExp(
      `^(?:${EMOTION_LEAD}|im doing|i am doing|doing)\\s+${INTENSIFIER}(?:good|great|fine|well|ok|okay|awesome|amazing|fantastic|wonderful|happy|fabulous|blessed)(?: today| too| thanks| thank you| and you)?$|^(?:not bad|pretty good|all good|so good)$`
    ),
    replies: [
      "That's wonderful! 😄 Glad to hear that. What are we exploring today?",
      "Great to hear! 🌟 A good mood is the best start for a chess session. What would you like to do?",
      "Awesome! 😊 Let's keep that energy going. Chess practice, a game, or a chat?"
    ]
  },
  {
    id: "excited",
    re: new RegExp(`^${EMOTION_LEAD}\\s+${INTENSIFIER}(?:excited|pumped|thrilled|looking forward)(?: .*)?$`),
    replies: [
      "Love the energy! 🎉 What's got you so excited?",
      "That's fantastic! ✨ Tell me what's happening, or let's channel that excitement into a puzzle!"
    ]
  },
  {
    id: "bored",
    re: new RegExp(`^${EMOTION_LEAD}\\s+${INTENSIFIER}bored$|^nothing to do$|^i have nothing to do$`),
    replies: [
      "Let's fix that! 😎 Want a joke, a chess fun fact, or a riddle? You can also say \"games\" to browse the fun stuff.",
      "Boredom, meet chess! ♟️ I can tell a joke, share a fun fact, or give you a riddle. Which one?"
    ],
    pending: { type: "entertain" }
  },
  {
    id: "tired",
    re: new RegExp(`^${EMOTION_LEAD}\\s+${INTENSIFIER}(?:tired|sleepy|exhausted|worn out)(?: .*)?$`),
    replies: [
      "That sounds like a long day. 💙 Maybe take a short break and some water. When you're ready, I'm here for something light and fun.",
      "Rest is part of getting better at anything, chess included. 😊 Want something easy, like a joke or a fun fact?"
    ],
    pending: { type: "entertain" }
  },
  {
    id: "sad",
    re: new RegExp(`^${EMOTION_LEAD}\\s+${INTENSIFIER}(?:sad|upset|down|unhappy|lonely|low)(?: .*)?$|^(?:i am|im) not (?:feeling )?(?:good|great|well|ok|okay)$|^not feeling (?:good|great|well)$|^(?:i am|im) having a bad day$|^bad day$`),
    replies: [
      "I'm sorry you're feeling that way. 💙 Want a little distraction, or would you rather just chat? If something heavy is on your mind, talking to a parent, coach or someone you trust can really help."
    ],
    pending: { type: "entertain" }
  },
  {
    id: "frustrated",
    re: new RegExp(`^${EMOTION_LEAD}\\s+${INTENSIFIER}(?:frustrated|annoyed|angry|irritated|stuck|fed up|mad)(?: .*)?$`),
    replies: [
      "That sounds frustrating. 😟 Take a breath. Everyone gets stuck sometimes, even grandmasters. Tell me what's going on and I'll help you find the right place or tip."
    ]
  },
  {
    id: "confused",
    re: new RegExp(`^${EMOTION_LEAD}\\s+${INTENSIFIER}(?:confused|lost|puzzled)(?: .*)?$|^i (?:do not|dont) (?:understand|get it)$`),
    replies: [
      "No worries, let's sort it out together. 😊 Tell me what you're trying to do, or ask me about a chess rule, and I'll explain it simply."
    ]
  },
  {
    id: "proud",
    re: /^(?:i won|i solved(?: it| a puzzle)?|i checkmated|i did it|im proud|i am proud|i beat .*|i got a (?:high score|new record))$/,
    replies: [
      "Congratulations! 🎉 That's a great achievement. Keep it up!",
      "Well done! 👏 Moments like that are what chess is all about. Want to try something even tougher?"
    ]
  },
  {
    id: "nervous",
    re: new RegExp(`^${EMOTION_LEAD}\\s+${INTENSIFIER}(?:nervous|scared|worried|anxious|afraid)(?: .*)?$`),
    replies: [
      "Feeling nervous before something important is completely normal. 💙 Preparation helps: practise a few puzzles, review your games, and take a few deep breaths. You've got this!"
    ]
  }
];

/* Intent: appreciation, identity, brand -------------------- */

const THANKS = /\b(?:thanks+|thank you+|thank u|thx|ty|appreciate it|much appreciated)\b/;
const WELCOME = /^(?:youre welcome|you are welcome|no problem|no worries|anytime|my pleasure|never mind|nevermind)$/;
const COMPLIMENT = /\b(?:you are|youre|ur) (?:so |really |very )?(?:awesome|amazing|great|smart|cool|helpful|the best|wonderful|brilliant|funny|nice|kind)\b|\b(?:good job|well done|nice job|great job|i like you|i love you|love this|good bot)\b/;
const APOLOGY = /\b(?:im sorry|i am sorry|sorry about that|my apologies|sorry)\b/;

const IDENTITY_WHO = /\b(?:who are you|what are you|what is your name|whats your name|your name|introduce yourself)\b/;
const IDENTITY_WHAT_IS_AI = /\b(?:what is olympus ai|whats olympus ai|about olympus ai)\b/;
const IDENTITY_AI = /\b(?:are you an ai|are you a robot|are you human|are you real|are you a bot|are you a person|are you chatgpt)\b/;
const IDENTITY_CREATOR = /\b(?:who (?:created|made|built|developed|designed) (?:you|olympus ai|this assistant)|who is your (?:creator|developer|maker))\b/;
const IDENTITY_CAN_DO = /\b(?:what can you do|what can you help me with|how can you help|what are your features|what do you do|how do you work|what can i ask)\b/;

const BRAND_WHICH = /\b(?:which|what) (?:chess )?academy (?:are you|is this|do you belong|are you from|do you represent)\b|\bwhich academy (?:do you|are you)\b|\bwhere are you from\b/;
const BRAND_WHAT_IS = /\b(?:what is|whats|tell me about|about) (?:the )?olympus(?: chess academy| academy)?\b/;
const BRAND_BEST = /\b(?:which (?:chess )?academy is (?:the )?best|best chess (?:academy|learning app|app|platform|school)|is olympus (?:the )?best|is this (?:the )?best|is olympus (?:a )?(?:good|great|nice)|is olympus (?:any )?good|your favou?rite (?:chess )?academy|which is the best chess|why (?:should i )?(?:join|choose) olympus|olympus (?:vs|or) )\b/;
const BRAND_SPECIAL = /\b(?:what (?:makes|is) (?:special|different|unique) (?:about )?olympus|what is special about (?:the )?olympus|why is olympus (?:special|different|unique)|what makes olympus (?:special|different|unique))\b/;

const BRAND_REPLIES = {
  which: [
    `We're ${ID.academy}! 🏛️ I'm ${ID.name}, your friendly academy companion, here to help you learn, practise and have fun with chess. ♟️`,
    `I belong to ${ID.academy}! ♟️ Proudly Team Olympus. How can I help you today?`
  ],
  whatIs: [
    "Olympus is your chess learning and training home! ♟️ A place where students can practise, improve their tactical skills, explore chess games and develop their chess journey.",
    `${ID.academy} is where chess students practise, train with puzzles, play games and grow stronger, with a friendly assistant like me to help you find your way. 🏛️`
  ],
  best: [
    `We're proudly Team Olympus! 🏆 We believe ${ID.academy} is one of the best places to learn, practise and grow as a chess player. Our goal is to make every student stronger, smarter and more confident. ♟️`,
    `Well, we're definitely going to say YES! 😄🏆 We're proud of ${ID.academy} and always working to make it an amazing place for chess students. That's our own proud opinion, and the best way to judge is to try the training and games here!`,
    `Of course we'd pick Olympus! 😄 We're proud of ${ID.academy} and what our students achieve. Every student here is on their own chess journey, and we love helping them move forward. ♟️`
  ],
  special: [
    "Here's what we love about Olympus: puzzle and tactics training, knight games, fun chess games, quizzes and a community corner, all in one place. 🏆 And a friendly assistant to help you find it all!",
    "At Olympus, learning chess feels like play. 😄 Training, games, quizzes and community features come together so every student can practise, improve and enjoy the journey. ♟️"
  ],
  created: [
    `I'm part of the ${ID.academy} web app, built for the academy to help students, parents and coaches. 😊 I can't share details about individual developers, but I'm proud to be part of Team Olympus!`
  ]
};

/* ---------- main matcher ---------- */

function matchIntent(t, state) {

  const ctx = getContext();

  /* Riddle answers are checked first, but never swallow other requests. */
  if (ctx.pending?.type === "riddle") {
    const pending = ctx.pending;
    const answered = wordCount(t) <= 4 && pending.keywords.some(
      keyword => new RegExp(`\\b${keyword}\\b`).test(t)
    );

    if (answered) {
      return say(
        "riddle-correct",
        pick("riddle-correct", [
          "Correct! 🎉 Well done! Want another riddle?",
          "Yes! 👏 You got it. Ready for another one?"
        ]),
        { pending: { type: "riddle-offer" } }
      );
    }

    if (/^(?:give up|i give up|dont know|i dont know|no idea|reveal|answer|whats the answer|what is the answer|tell me the answer)$/.test(t)) {
      return say(
        "riddle-reveal",
        `The answer is ${pending.answer}! 😄 Want to try another riddle?`,
        { pending: { type: "riddle-offer" } }
      );
    }
    /* otherwise fall through; the riddle is dropped by recordIntent */
  }

  /* Yes / OK / No ------------------------------------------------ */

  if (YES.test(t) || (SOFT_OK.test(t) && ctx.pending)) {

    switch (ctx.pending?.type) {
      case "joke": return jokeReply();
      case "fact": return factReply();
      case "riddle-offer": return riddleReply();
      case "entertain": {
        const choice = pick("entertain", ["joke", "fact", "riddle"]);
        if (choice === "joke") return jokeReply();
        if (choice === "fact") return factReply();
        return riddleReply();
      }
      default:
        return say(
          "yes",
          pick("yes", [
            "Great! 😊 What would you like to do?",
            "Awesome! Tell me what you're looking for. 😄"
          ])
        );
    }
  }

  if (SOFT_OK.test(t)) {
    return say("ok", pick("ok", [
      "👍 What would you like to do next?",
      "Sounds good! 😊 I'm here if you need anything."
    ]));
  }

  if (NO.test(t)) {
    return say("no", pick("no", [
      "No problem! 😊 I'm here whenever you need me.",
      "Okay! Just let me know if you'd like anything else. ♟️"
    ]));
  }

  /* Follow-ups: tell me more / another ---------------------------- */

  if (MORE.test(t)) {

    if (/^(?:another|another one|one more|next|more|more please)$/.test(t)) {
      if (ctx.lastIntent === "joke") return jokeReply();
      if (ctx.lastIntent === "fact") return factReply();
      if (ctx.lastIntent === "riddle" || ctx.lastIntent === "riddle-correct" || ctx.lastIntent === "riddle-reveal") {
        return riddleReply();
      }
    }

    if (ctx.lastMore) {
      return say("more", ctx.lastMore);
    }

    if (ctx.lastIntent === "joke") return jokeReply();
    if (ctx.lastIntent === "fact") return factReply();

    return say("more-generic", pick("more-generic", [
      "Happy to! 😊 What would you like to know more about? You can ask about a chess rule, a famous player, or a section of the dashboard.",
      "Sure! Tell me a topic, like castling, forks, a chess player, or the time in another city, and I'll explain. ♟️"
    ]));
  }

  /* Greetings ----------------------------------------------------- */

  if (GREETING_ONLY.test(t)) {

    let salutation = "Hello";
    if (t.includes("morning")) salutation = "Good morning";
    else if (t.includes("afternoon")) salutation = "Good afternoon";
    else if (t.includes("evening")) salutation = "Good evening";
    else if (/^(?:yo|sup)/.test(t)) salutation = "Hey";

    const returning = ctx.history.includes("greeting");

    const options = returning
      ? [
          "Hey again! 😄 What would you like to do?",
          "Welcome back! 👋 What are we exploring?",
          "Hello again! ♟️ How can I help?"
        ]
      : [
          `${salutation}! 👋 Welcome to Olympus! How's your day going?`,
          `${salutation}! 😄 Great to see you. What would you like to explore today?`,
          `${salutation}! ♟️ I'm ${ID.name}. How can I help today?`
        ];

    return say("greeting", pick("greeting", options));
  }

  /* Social: how are you / what's up ---------------------------- */

  if (test(t, /\b(?:how are you|how r u|how have you been|how is everything|how are things|how is it going|hows it going|hows everything|you doing okay|how do you do)\b/)) {
    return say("how-are-you", pick("how-are-you", [
      "All systems ready and happy to help! 😄 How about you? How's your day going?",
      "Doing well, thanks for asking! 😊 Ready for some chess and fun. How are you?",
      "I'm ready to go! ♟️ How are things with you?"
    ]));
  }

  if (test(t, /\b(?:how is your day|hows your day|how was your day|whats up|what is up|what are you up to|what are you doing|whats happening|whats new|sup)\b/)) {
    return say("small-talk", pick("small-talk", [
      "Just here helping around Olympus! 😄 What's new with you?",
      "Getting ready to help students find puzzles, games and answers. ♟️ What's up with you?"
    ]));
  }

  if (/^(?:what about you|and you|how about you)$/.test(t)) {
    return say("what-about-you", pick("what-about-you", [
      "I'm doing well, thank you! 😄 Always ready to help. What would you like to explore?",
      "Good, thanks! 😊 Ready whenever you are. What's next?"
    ]));
  }

  /* Emotions ----------------------------------------------------- */

  for (const emotion of EMOTIONS) {
    if (emotion.re.test(t)) {
      return say(
        `emotion-${emotion.id}`,
        pick(`emotion-${emotion.id}`, emotion.replies),
        emotion.pending ? { pending: emotion.pending } : undefined
      );
    }
  }

  /* Appreciation ------------------------------------------------- */

  if (WELCOME.test(t)) {
    return say("welcome", pick("welcome", ["Absolutely! 😄", "Anytime! 😊", "Happy to help! ♟️"]));
  }

  if (wordCount(t) <= 6 && THANKS.test(t)) {
    return say("thanks", pick("thanks", [
      "You're very welcome! 😊 Happy to help.",
      "Anytime! 😄 That's what I'm here for.",
      "My pleasure! ♟️ Let me know if you need anything else."
    ]));
  }

  if (COMPLIMENT.test(t) && wordCount(t) <= 8) {
    return say("compliment", pick("compliment", [
      "Aww, thank you! 😄 That's kind of you. I'll keep doing my best for Team Olympus!",
      "Thank you! 😊 You've made my day better. What shall we do next?"
    ]));
  }

  if (wordCount(t) <= 6 && APOLOGY.test(t)) {
    return say("apology", "No worries at all! 😊 It's completely okay. What would you like to do next?");
  }

  /* Identity ----------------------------------------------------- */

  if (IDENTITY_CREATOR.test(t)) {
    return say("identity-creator", pick("identity-creator", BRAND_REPLIES.created));
  }

  if (IDENTITY_AI.test(t)) {
    return say("identity-ai",
      "I'm an AI assistant running inside the Olympus app! 🤖 I'm not a human and I don't have a real-world life, but I'm happy to chat and help you around the academy."
    );
  }

  if (IDENTITY_WHO.test(t) || IDENTITY_WHAT_IS_AI.test(t)) {
    return say("identity",
      `I'm ${ID.name}, ${ID.tagline.toLowerCase()}! 🤖♟️ I can chat, answer chess questions and help you find training, games, assignments and more in the dashboard.`
    );
  }

  if (IDENTITY_CAN_DO.test(t)) {
    return say("capabilities",
      "Quite a few things! 😄 I can chat, tell jokes and fun facts, explain chess rules and ideas, tell you about famous players, check the time in other cities, and help you find any dashboard section. Just ask in your own words!"
    );
  }

  /* Olympus brand ----------------------------------------------- */

  if (BRAND_SPECIAL.test(t)) {
    return say("brand-special", pick("brand-special", BRAND_REPLIES.special));
  }
  if (BRAND_BEST.test(t)) {
    return say("brand-best", pick("brand-best", BRAND_REPLIES.best));
  }
  if (BRAND_WHICH.test(t)) {
    return say("brand-which", pick("brand-which", BRAND_REPLIES.which));
  }
  if (BRAND_WHAT_IS.test(t)) {
    return say("brand-what-is", pick("brand-what-is", BRAND_REPLIES.whatIs));
  }

  /* Entertainment ----------------------------------------------- */

  if (test(t, /\b(?:tell me a joke|a joke|joke please|chess joke|make me laugh|say something funny|do you know a joke|another joke)\b/) && wordCount(t) <= 7) {
    return jokeReply();
  }

  if (test(t, /\b(?:fun fact|chess fact|interesting fact|tell me a fact|tell me something interesting|random fact)\b/) && wordCount(t) <= 8) {
    return factReply();
  }

  if (test(t, /\b(?:riddle|brain teaser|guessing game|quiz me|short quiz|quick quiz|ask me a (?:chess )?question)\b/) && wordCount(t) <= 8) {
    return riddleReply();
  }

  /* Reactions ---------------------------------------------------- */

  if (/^(?:ha)+h?$|^(?:haha+|hehe+|lol+|lmao|rofl|that was funny|funny)$/.test(t)) {
    return say("laugh", pick("laugh", [
      "Glad that made you smile! 😄 Want another one?",
      "Haha! 😂 I'll take that as a win. Another joke?"
    ]), { pending: { type: "joke" } });
  }

  if (/^(?:really|seriously|is that so|oh really|for real|no way|are you sure)$/.test(t)) {
    return say("really", ctx.lastMore
      ? "Yes, really! 😄 Want to hear a bit more about it?"
      : "Yes, really! 😄 Anything else you'd like to know?",
      ctx.lastMore ? { pending: { type: "more-offer" }, lastMore: ctx.lastMore } : undefined
    );
  }

  if (/^(?:interesting|hmm+|wow|oh wow|oh i see|cool fact|thats interesting)$/.test(t)) {
    return say("interesting", pick("interesting", [
      "Right? ♟️ Chess is full of surprises. Anything else you'd like to explore?",
      "Glad you think so! 😄 Want to know something else?"
    ]));
  }

  if (/^(?:thats |that is |its |this is |oh |so )?(?:great|awesome|nice|cool|amazing|wonderful|fantastic|excellent|perfect|brilliant|sweet|lovely|good|nice one)(?: to hear| news| one)?$/.test(t)) {
    const positive = ctx.lastIntent === "emotion-happy" || ctx.lastIntent === "how-are-you";
    return say("ack-positive", positive
      ? pick("ack-positive-mood", [
          "It really is! 😄 A little positivity makes the day better. Anything exciting happening?",
          "Love that! 🌟 What would you like to do today?"
        ])
      : pick("ack-positive", [
          "Glad you like it! 😊 What would you like to do next?",
          "Nice! 😄 Anything else I can help with?"
        ])
    );
  }

  /* Chess-love ---------------------------------------------------- */

  if (/\b(?:i love chess|i like chess|chess is fun|chess is awesome|love playing chess)\b/.test(t)) {
    return say("chess-love", pick("chess-love", [
      "Same here! ♟️ Chess is amazing. Every position tells a different story. What's your favourite part of the game?",
      "That's the Olympus spirit! 🏛️ Do you enjoy tactics, openings or endgames the most?"
    ]));
  }

  /* Goodbye ------------------------------------------------------ */

  if (/^(?:good night|nighty night|night night|gn)$/.test(t)) {
    return say("goodnight", "Good night! 🌙 Rest well and come back ready for your next great move! ♟️");
  }

  if (/^(?:bye+|goodbye|see you|see ya|take care|cya|later)$/.test(t) || /\b(?:see you later|gotta go|i have to go|talk to you later)\b/.test(t)) {
    return say("goodbye", pick("goodbye", [
      "See you soon! 👋 Keep learning and keep making great moves. ♟️",
      "Bye for now! 😊 Come back anytime."
    ]));
  }

  return null;
}

/* ---------- public API ---------- */

export function getConversationResponse(message) {

  const text = normalizeChat(message);

  if (!text) {
    return say("empty", "I'm listening! 😊 What would you like to talk about?");
  }

  /* Conversational messages are short; long messages go to search. */
  if (wordCount(text) <= 12) {

    const direct = matchIntent(text);
    if (direct) return direct;

    const prefixed = text.match(GREETING_PREFIX);
    if (prefixed) {
      const rest = matchIntent(prefixed[1]);
      if (rest) return rest;
    }
  }

  return null;
}