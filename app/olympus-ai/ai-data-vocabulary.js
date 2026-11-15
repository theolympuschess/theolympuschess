/* =====================================================================
   OLYMPUS AI 4.2.2 — EXPANDED 20K NATURAL-LANGUAGE VOCABULARY LAYER (ai-data-vocabulary.js)
   ---------------------------------------------------------------------
   Classification-only. This module contains NO database access, NO
   Supabase calls and NO student data. It only helps ai-data-tools.js
   recognise more ways of asking for information its existing handlers
   already provide. The handlers remain the sole source of answers.

   Vocabulary is stored as compact brace patterns, one per line:
       "my {class|batch} {timing|schedule}"  ->  4 distinct phrases
   and is expanded once at load time into a phrase index (Map).
   Matching is exact, word-boundary, n-gram based: no fuzzy matching.
   ===================================================================== */

const GAME_NAMES_FOR_VOCAB = ["pawn practice","knight practice","bishop practice","rook practice","queen practice","king practice","iq hunt","board recall","lab hunt","knight fog quest","iq trainer","defend the king","knight path","knight vs monster","escape","speed run","lava knight","knight gps","chess math","rainbow mania","find the queen","reach home","puzzle rush","quiz","board coordinates"];

const VOCAB_SOURCE = [
  {
    id: "student-report", intent: "student-report",
    noun: [
      "my {full|complete|entire|whole|total|overall} {report|student report|account report|academy report|profile report}",
      "my {entire|whole|full|complete} account {|details|summary|overview|information|record|report}",
      "my {account|student|academy|profile} {summary|overview|file|record|report}",
      "my {student|academy|account} {information|details|data|records}",
      "my personal {information|details|data}",
      "my {complete|full|entire|whole} {student information|academic details|academy details|history|record|profile|details|information|stats|statistics|data|records}",
      "my {overall|complete|total} {stats|statistics|academy status}",
      "my student progress card",
      "my report card",
      "my academy records",
      "my academy profile",
      "{complete|full|overall|whole} {student overview|account overview|account report|student report|academy report}",
      "all {my|the} {details|data|records|information|stats} {about me|of mine|i have|you have}",
      "all information {about me|available about me|available on my account}",
      "all my {details|data|records|information|account data|account details|account information|academy records|academy details}",
      "everything {about me|about my account|about my academy account|in my account|on my account|you have on my account}",
      "every {detail|record|piece of information} {about me|of mine|about my account}",
      "{full|complete} report {of mine|about me|on me|for me}",
      "{student|account} {overview|summary|file}",
    ],
    sentence: [
      "give me a summary of my whole account",
      "tell me everything about my academy account",
      "show me everything you have about my account",
      "i want to see all my academy details",
      "i want a complete report on myself",
      "can i get my full student report",
      "can i see everything about my account",
      "send me my complete report",
      "what is my overall academy status",
      "my overall status",
      "overall report",
      "full report",
      "complete report",
      "student report",
      "account report",
      "academy report",
      "my report",
      "my records",
      "my details",
      "show all my records",
      "show all my details",
      "show all my data",
      "show everything about me",
      "show me everything about me",
      "show my full report",
      "show my complete report",
      "show my student report",
      "show my account summary",
      "show my entire account",
      "i need my full account details",
      "i need my complete record",
      "give me all my academy records",
      "give me my complete student overview",
      "how is my account overall",
      "how is my overall account",
      "what is in my academy account",
      "what is in my student record",
      "everything about my progress at the academy",
      "all my academy information please",
      "my student information please",
      "full student report please",
      "complete report of my account please",
      "give my full report",
      "get my full report",
      "fetch my full report",
    ],
  },
  {
    id: "class-report", intent: "class-report",
    noun: [
      "my {class|batch|coaching|lesson|session|weekly|chess class|private class} {timing|timings|schedule|timetable|slots|details}",
      "my {class|batch|coaching|lesson|session} time",
      "my class {days|day|information|info|report|progress|count|package|plan|credits|renewal|subscription|allocation|balance|record}",
      "my {next|upcoming|first|coming} {class|lesson|session|class time|lesson time|class timing}",
      "my {remaining|pending|left} {classes|sessions|lessons|class credits|class slots}",
      "my {classes|sessions|lessons} {left|remaining|completed|pending}",
      "my {total|subscribed|completed|allotted|allocated} {classes|sessions|lessons|class credits}",
      "my {subscription|renewal|package|class package} {details|status|classes|plan|info|information}",
      "my {one to one|private|personal|individual|1 on 1} {classes|class|lessons|lesson|class timing|class schedule|sessions|coaching}",
      "my {weekly|regular|usual|fixed} {classes|class timings|class timing|lessons|sessions|timetable|schedule|slots}",
      "my {training|coaching|learning|chess|academy} {calendar|timetable|schedule|sessions|classes|timings|lessons}",
      "my {batch|class|coaching} {calendar|name|group|number}",
      "my {coaching|batch|class} {details|information|info}",
      "my {class|lesson|coaching|batch} {report|summary|overview}",
      "my {learning|chess} sessions",
      "my coaching",
      "my lessons",
      "my batch",
      "my batch details",
      "my timetable",
      "my schedule",
      "{class|batch|coaching|lesson} {timing|timings|schedule|details|time|timetable}",
      "{classes|sessions|lessons} {left|remaining}",
      "{remaining|pending} {classes|sessions|lessons}",
      "{next|upcoming} {class|lesson|session}",
      "{weekly|class} timetable",
      "batch {name|details|information|timing}",
      "class {package|plan|credits|allocation|renewal|subscription|progress}",
    ],
    sentence: [
      "when is my {next class|class|batch|next lesson|next session|next batch|class today|next coaching class|next online class}",
      "when are my {classes|next classes|lessons|sessions|batch classes}",
      "when do my {classes|lessons|sessions} {start|begin}",
      "when is the next {class|lesson|session}",
      "when is my class {today|tomorrow|this week}",
      "what time is my {class|next class|batch|lesson|session|coaching|class today}",
      "what time are my {classes|lessons|sessions}",
      "which {day|days} {is my class|are my classes|do i have class|is my batch|do i have coaching}",
      "which batch {am i in|am i assigned to|do i belong to|am i part of|is mine}",
      "what batch {am i in|am i assigned to|am i part of}",
      "what is my {batch|batch name|batch timing|class timing|class time|class schedule|class day|timetable|class package|subscription|class plan}",
      "what are my {class timings|class days|class timing|batch details|lesson timings|class details|class slots|weekly classes}",
      "how many {classes|sessions|lessons} {are left|are remaining|remain|remaining|are pending|do i have left|are left for me|do i have remaining|are left in my package|are left in my subscription|have i completed|are completed|do i have in total|are in my package|are in my subscription|do i have this month}",
      "how many {classes|sessions} {i have left|left for me|remaining for me|i have remaining|i have}",
      "how many classes {did i subscribe|did i buy|did i get in my package}",
      "do i have {a|any} {class|lesson|session} {today|tomorrow|this week}",
      "do i have {class|classes} {today|tomorrow|this week}",
      "do i have {class|classes} on {monday|tuesday|wednesday|thursday|friday|saturday|sunday}",
      "is there {a|any} {class|lesson|session} {today|tomorrow|this week}",
      "is there {class|classes} {today|tomorrow}",
      "is my class {today|tomorrow|on sunday|this week}",
      "will i have class {today|tomorrow|this week}",
      "tell me my {class timing|class schedule|batch details|batch name|next class|remaining classes}",
      "{show|give|tell} me my class {report|details|schedule|timing|timetable}",
      "{show|give} me my batch {name|details|timing}",
      "how many classes are there in my {package|subscription|plan}",
      "how many sessions are there in my {package|subscription}",
      "my class timing please",
      "when is my batch please",
      "which batch i am in",
      "what is my class timing sir",
      "my {next class|class timing|batch name|class timetable} please",
      "class timing please",
      "batch details please",
      "can you tell me my class {timing|schedule|timetable|details}",
      "i want to know my {class timing|class schedule|batch|batch name|remaining classes}",
      "i need my {class timing|class schedule|class timetable|batch details|class report}",
    ],
  },
  {
    id: "payments", intent: "payments",
    noun: [
      "my payment {history|details|record|records|summary|statement|status|confirmation|dates|proof|information|list}",
      "my {fee|fees} {details|information|history|status|statement|records|receipts|receipt|payment history|payments|record|summary}",
      "my tuition {fee|fees|payments|details|fee details|history|payment history|fee status}",
      "my {transaction|transactions} {history|details|records|list|statement|summary}",
      "my {installment|installments} {details|history|status|records|paid}",
      "my {receipt|receipts|invoice|invoices} {details|history|list|records}",
      "my {payments|receipts|transactions|invoices|bills|installments|fees|fee receipts}",
      "my {previous|past|recent|last|earlier|old} {payments|payment|fees paid|transactions|receipts|fee payments|installments}",
      "my total {payments|fees paid|amount paid|fees|spending|payment|money paid}",
      "my {amount|money|fees|fee} {paid|paid so far}",
      "my paid {amount|fees|money}",
      "my recorded {payments|amounts|fees|transactions}",
      "{the|my} {amount|money|fees|fee} {i paid|i have paid|paid by me|i paid so far}",
      "my {academy|class|coaching|monthly|course|chess} {fees|fee|charges|payments|fee details}",
      "{payment|fee|fees|tuition fee|tuition fees} {details|history|records|record|status|statement|summary|receipts|information}",
      "{fees|money|amount} paid {by me|so far|till now|until now}",
      "{payments|transactions|receipts|installments} {list|history|records}",
      "{academy|tuition} {charges|fees}",
      "payment {dates|proof|confirmation}",
      "fee {balance|due|dues|pending}",
      "{pending|remaining|outstanding} {fees|fee|dues|balance|payment|payments}",
      "{due|outstanding} {amount|fees|balance}",
    ],
    sentence: [
      "how much {did i pay|have i paid|have i paid so far|did i pay so far|money did i pay|money have i paid|have i spent|did i spend|did i pay till now|have i paid till now|did i pay in total}",
      "how much {fees|fee|money|amount} {paid|i paid|i have paid|have i paid|did i pay|did i pay so far|paid so far|paid till now}",
      "how much {i have paid|i paid|i spent|i have spent|i paid so far|i spent so far}",
      "how much amount {i paid|paid|have i paid|did i pay}",
      "what {have i paid|did i pay|have i paid so far|payments have i made|payments did i make|fees have i paid|fees did i pay}",
      "which payments {have i made|did i make|are recorded|are on my account}",
      "what was my last payment",
      "what is my last payment",
      "when {did i pay|did i last pay|did i pay my fees|did i pay last|was my last payment|was my last fee paid|was my last fee payment}",
      "{did i pay|have i paid|did i complete} {my|the} {fees|fee|tuition|installment|payment}",
      "have i paid {everything|all my fees|all my installments}",
      "{has|was|is} my {payment|fee|fees|installment} {recorded|received|updated|noted|added}",
      "is my {fee|fees|tuition} paid",
      "did my payment {go through|get recorded|get updated|reach the academy}",
      "show {me |}what i have paid so far",
      "show {me |}how much i have paid",
      "how much {do i owe|do i still owe|fee is left|fee is left to pay|fees are left|fee left to pay|fee i have left to pay|fees are pending|fee is pending|fee is due|is due|fees do i have to pay|fee do i have to pay|more do i have to pay|is pending}",
      "what is my {due amount|outstanding balance|fee balance|pending fee|pending fees|remaining fee|remaining fees|outstanding amount|balance fee|due fees}",
      "do i {owe any fees|have any dues|have any pending fees|have to pay anything|need to pay fees|have pending payments|owe the academy anything|owe anything}",
      "any {pending fees|fee due|dues|fees due|fee pending|fees pending|payment pending|pending payment|balance fee|installment pending|installment due}",
      "tell me how much {fee|fees} i have left to pay",
      "tell me how much {i paid|i have paid|i owe|i still owe}",
      "my {payment details|fee details|fee status|payment history|fee receipts|tuition fee details} please",
      "payment details please",
      "fee details please",
      "fees paid please",
      "can i see my {payments|payment history|fee details|fee receipts|transactions}",
      "can you show my {payments|payment history|fee details|fee receipts|transactions|fee statement}",
      "i want to see my {payments|payment history|fee details|fee receipts|transactions|fee statement}",
      "i need my {payment details|fee receipt|fee receipts|payment proof|payment history|fee statement}",
      "what is my fee status",
      "what are my fee details",
      "what are my payment details",
      "what is my payment status",
      "what is my tuition fee",
      "what did i pay last month",
      "how much did i pay {this month|last month|this year|in total|till date}",
      "how much have i paid {this month|last month|this year}",
    ],
  },
  {
    id: "attendance", intent: "attendance",
    noun: [
      "my attendance",
      "my class attendance",
      "my {attendance|class attendance} {record|records|history|report|details|status|percentage|percent|summary|sheet|count|this month|last month|today|data|list}",
      "my {presence|participation|class participation} {record|history|details|report|summary}",
      "my {absence|absences|absent} {record|report|history|details|days|count|summary}",
      "my class {absences|absence report|absence record|dates|history|days attended|presence|participation}",
      "my {missed|skipped} {classes|lessons|sessions|class records|class days|class dates}",
      "my {attended|present|absent} {classes|lessons|sessions|days|class days}",
      "my {days|classes|lessons|sessions} {present|absent|attended|missed|skipped}",
      "my {previous|past|earlier|old} class {dates|days|records}",
      "the {days|classes|lessons|sessions|dates} i {attended|missed|skipped|came|was present|was absent}",
      "{attendance|class attendance} {percentage|percent|record|records|history|report|details|status|summary|this month|last month|today}",
      "{missed|skipped} {classes|lessons}",
      "{absent|present} days",
      "days {absent|present|attended|missed}",
      "class participation",
      "{attended|missed} classes",
      "{presence|absence} record",
    ],
    sentence: [
      "how many {classes|lessons|sessions|days} {have i attended|did i attend|i attended|have i missed|did i miss|i missed|did i skip|have i skipped|was i absent|was i present|did i attend this month|did i miss this month|was i absent this month|was i present this month}",
      "how many times {was i present|was i absent|did i miss class|did i skip class|have i missed class|did i attend|have i been absent|did i come to class}",
      "how {often|regularly} {do i attend classes|do i attend class|did i attend|do i miss class|am i absent|do i come to class|do i attend}",
      "how regularly have i been attending my classes",
      "how regular am i {in classes|in class|in my classes|with my classes}",
      "which {classes|lessons|sessions|days|dates} {did i miss|did i skip|did i attend|was i absent|was i present|have i missed|have i skipped|did i come}",
      "which {class|day|session|lesson} did i {miss|skip}",
      "did i {miss|skip} {any|a} {classes|class|lessons|lesson|sessions|session}",
      "did i {miss|skip} {any|a} {class|lesson|session} {this month|last month|last week}",
      "did i attend {all|every} {classes|class|sessions|session|lessons}",
      "did i attend {class|my last class|my class} {today|yesterday}",
      "did i attend my last {class|lesson|session}",
      "did i come to {class|all my classes|every class} {today|yesterday|}",
      "was i {present|absent} {today|yesterday|in every session|in every class|in the last class|in all classes|on all days|last class|any day|any day this month}",
      "was i {present|absent} in {the last class|my last class|my last session|the last session}",
      "am i {regular|attending regularly|attending classes regularly|attending class regularly|attending all classes|missing classes|missing too many classes|present in all classes|regular in class|regular in my classes|regular with my classes|regular in attendance}",
      "have i been {missing lessons|missing classes|missing class|skipping classes|attending classes|attending regularly|regular|absent a lot|absent much|present regularly}",
      "have i {missed|skipped|attended} {any|every|all} {class|classes|lesson|lessons|session|sessions}",
      "how is my attendance {|looking|this month|so far|overall}",
      "hows my attendance",
      "is my attendance {okay|ok|good|fine|low|poor|enough|bad|safe}",
      "my attendance is okay",
      "tell me my {absence record|attendance record|attendance|attendance percentage|absent days|present days}",
      "tell me which {days|classes} i was {absent|present}",
      "tell me how many {classes|days} i {missed|attended}",
      "show the days i attended",
      "show the days i was absent",
      "show the classes i missed",
      "any {class|classes|session|sessions|lesson|lessons} missed",
      "any {class|classes} missed this month",
      "any {absence|absences} {|this month|last month}",
      "give me my class participation details",
      "give me my {attendance|attendance record|attendance report|attendance details}",
      "can i see my {attendance|attendance record|attendance history|attendance report}",
      "i want to see my {attendance|attendance record|attendance history}",
      "i need my {attendance|attendance report|attendance details|attendance record}",
      "i did not attend any class this month",
      "i didnt attend any class",
      "what is my attendance {percentage|percent|record|status}",
      "what are my {absences|absent days|present days}",
      "what is my absence record",
      "attendance please",
      "my attendance please",
      "my attendance details please",
      "attendance status please",
      "any class missed please",
      "total classes attended",
      "total classes missed",
      "total days present",
      "total days absent",
    ],
  },
  {
    id: "assignments", intent: "assignments",
    noun: [
      "my {homework|assignments|tasks|submissions|classwork|coursework|assigned work|task list|to do list|todo list}",
      "my homework {status|list|due|submissions|record|details|pending|summary}",
      "my assignment {record|status|list|details|summary|submissions}",
      "my {pending|unfinished|incomplete|completed|submitted|overdue|remaining|upcoming|assigned} {homework|assignments|assignment|work|tasks|submissions}",
      "my {pending|unfinished|incomplete|remaining} academy work",
      "my {overdue|late|missing} {homework|assignments|work|tasks|submissions}",
      "the {work|homework|tasks|assignments} {assigned to me|given to me|i have to complete|i have to submit|i need to submit|i need to complete|left for me}",
      "my {submission|submitted work} {status|record|history|list}",
      "{homework|assignment|assignments} {status|list|details|record|pending|due|left|summary}",
      "{pending|unfinished|incomplete|overdue|submitted|completed|upcoming|remaining} {homework|assignments|assignment|work|tasks|submissions}",
      "{tasks|work|assignments|homework} {pending|left|due|remaining|incomplete}",
      "homework {due|pending} {today|tomorrow|this week}",
    ],
    sentence: [
      "any {homework|assignments|assignment|work|tasks|task} {left|pending|due|remaining|incomplete|overdue}",
      "any {pending|overdue|unfinished|new} {work|homework|tasks|assignments|assignment}",
      "any homework {today|tomorrow|this week}",
      "any new {homework|assignment|assignments|task|tasks}",
      "do i have {any |}{homework|assignments|assignment|tasks|pending work|pending homework|pending assignments|overdue work|overdue homework|work to submit}",
      "do i have {any |}{homework|assignments|tasks} {today|tomorrow|this week|due}",
      "what {homework|assignments|tasks|work} {do i have|is pending|are pending|is due|are due|is left|are left|is overdue|are overdue|is incomplete|are incomplete|is due soon|do i have to do|do i have to submit}",
      "what {should i submit|do i need to submit|do i have to submit|do i need to complete|do i have to complete|have i submitted|have i not submitted|did i submit|did i not submit|should i submit today|is pending for me}",
      "which {homework|assignment|assignments|tasks|work} {is pending|are pending|is due|are due|is overdue|are overdue|is left|are left|did i submit|have i submitted|pending|is incomplete|are incomplete|have i completed|did i complete}",
      "which {homework|work|assignment|task} {is not submitted|is not done|is not complete|is incomplete}",
      "how many {assignments|homework|homeworks|tasks} {are pending|do i have|have i submitted|are overdue|are left|have i completed|are due|did i submit|are incomplete|are remaining|are not submitted}",
      "have i {completed|submitted|finished|done} {my|all my|the} {homework|work|assignments|assignment|tasks}",
      "did i {submit|complete|finish} {my|all my|the} {homework|assignment|assignments|work|tasks}",
      "is my {homework|assignment|work} {pending|done|submitted|complete|overdue|late|incomplete|finished}",
      "is any {homework|assignment|work|task} {pending|due|overdue|left}",
      "is there any {homework|assignment|assignments|pending work|task|tasks|work due} {today|tomorrow|pending|left|}",
      "tell me my {pending homework|pending work|pending assignments|homework status|assignment status|overdue assignments}",
      "show me my {homework|assignments|pending work|pending homework|submitted homework|overdue assignments|tasks}",
      "give me my {homework|assignment|assignments|homework list|assignment list|task list|pending work}",
      "can i see my {homework|assignments|pending work|submitted work|tasks}",
      "i want to see my {homework|assignments|pending work|submitted work|tasks}",
      "i need to know my {pending work|homework|assignments|pending homework|pending tasks}",
      "what work is left for me",
      "what work do i still have",
      "what is left to submit",
      "what is left to complete",
      "what is pending for me",
      "which homework pending",
      "which homework is pending please",
      "pending work please",
      "homework status please",
      "any homework left please",
      "my homework please",
      "my assignments please",
      "pending homework please",
      "what are my pending {assignments|tasks|homework|works}",
      "what is my homework status",
      "what is my assignment status",
    ],
  },
  {
    id: "games-report", intent: "games-report",
    noun: [
      "my {games|matches|chess games|chess matches}",
      "my {gaming|playing|chess game} {history|activity|record|records|report|stats|statistics|summary|results|performance}",
      "my game {history|activity|report|stats|statistics|summary|results|performance}",
      "my {recent|previous|past|last|latest|earlier} {games|matches|chess games|chess matches|game results|results}",
      "my total {games|matches|wins|losses|draws|games played|wins and losses}",
      "my {wins|losses|draws|win rate|win percentage|winning percentage|win loss record|win loss ratio|winning record|losing record|loss record}",
      "my overall {game record|gaming activity|game stats|gaming record|game performance|chess record|match record|results}",
      "my personal game records",
      "my {chess record|chess results|chess stats|chess statistics}",
      "{games|matches} {i played|i have played|i won|i lost|i drew|played}",
      "{game|gaming} {history|report|stats|statistics|summary|results}",
      "gaming {record|records}",
      "{wins|losses|draws} {record|summary|count}",
      "games played {by me|so far}",
    ],
    sentence: [
      "how many {games|matches} {have i played|did i play|i played|have i played so far|did i play so far|did i win|have i won|did i lose|have i lost|did i draw|have i drawn|i have played|i won|i lost|did i play this month|did i play in total}",
      "how many {wins|losses|draws} {do i have|have i got|did i get|i have|have i had}",
      "how many games {i have won|i have lost|i won|i lost}",
      "what {is my win rate|is my win percentage|is my total wins|is my win loss record|is my overall game record|games did i play|games have i played|are my game results|are my game stats|is my gaming history|is my playing history}",
      "which games {did i play|have i played|did i win|did i lose|have i won|have i lost}",
      "did i win my {last|latest|recent|previous} {game|match|games|matches}",
      "did i lose my {last|latest|recent|previous} {game|match|games|matches}",
      "did i win {any|many|most of} my {games|matches}",
      "have i won {any|many|most of} my {games|matches}",
      "how {am i doing|am i performing|am i playing} {in games|in my games|in matches|in chess games}",
      "how {is my game performance|is my gaming performance|is my game record|is my gaming|are my game results}",
      "hows my {game record|gaming|game performance|match record}",
      "how are my games going",
      "how are my results",
      "show {me |}my {games|game history|gaming history|game report|game stats|game results|recent games|wins|losses|draws|win rate}",
      "tell me my {gaming history|game stats|win rate|wins and losses|game results}",
      "give me my {game report|game history|game stats|gaming report|game summary}",
      "can i see my {games|game history|gaming history|game stats|recent games}",
      "i want to see my {games|game history|gaming history|game stats|recent games|wins and losses}",
      "games i played",
      "games i have played",
      "games i won",
      "games i lost",
      "games played",
      "my games played",
      "what games did i play",
      "what games have i played",
      "my game stats please",
      "my game history please",
      "my wins please",
      "my win rate please",
      "show games played",
      "list my games",
      "list all my games",
      "list my recent games",
    ],
  },
  {
    id: "vs-bot", intent: "vs-bot",
    noun: [
      "my {computer|bot|ai|engine|stockfish|solo|vs computer|vs bot|vs ai} {games|game history|matches|match history|record|wins|losses|draws|win rate|results|stats|game record|match record|performance}",
      "my games {against|vs|versus|with} {the computer|computer|the bot|bot|the ai|ai|stockfish|the engine|engine}",
      "my {solo chess|solo chess games|solo games|solo matches}",
      "my {previous|past|recent|latest|last} {computer|bot|ai|stockfish} {games|matches|results}",
      "my previous ai matches",
      "my {record|stats|statistics|results|win rate|wins|losses|performance} {against|vs|versus} {the computer|computer|the bot|bot|the ai|ai|stockfish|the engine}",
      "my computer {difficulty|difficulty levels|difficulty level|opponent|opponents|opponent record}",
      "my {strongest|hardest|toughest|best} computer opponent",
      "my {favorite|most played} computer difficulty",
      "my chess computer record",
      "{computer|bot|ai|stockfish|solo} {games|game history|matches|match history|record|results|wins|losses}",
      "games {against|vs|versus|with} {the computer|computer|bot|the bot|the ai|ai|stockfish|engine}",
      "computer {difficulty|match record|match history|game record|opponent}",
      "{vs computer|vs bot|vs ai} {games|record|history|stats|summary}",
      "solo chess games",
    ],
    sentence: [
      "how many {games|matches} {did i play|have i played|i played|did i win|have i won|did i lose|have i lost|did i draw|i have played|i won|i lost} {against|vs|versus|with} {the computer|computer|the bot|bot|the ai|ai|stockfish|the engine|engine}",
      "how many {games|matches} {against|vs|with} {the computer|computer|the bot|bot|the ai|ai|stockfish} {this month|last month|today|this week|in total|did i play}",
      "how many {computer|bot|ai|solo|stockfish} {games|matches} {did i play|have i played|this month|last month|today|this week|did i win|have i won|did i lose|have i lost|are there in my history}",
      "how many times {did i beat|have i beaten|did the computer beat|did the bot beat|did stockfish beat|did i lose to|did i defeat|have i defeated} {the computer|the bot|the ai|stockfish|me|the engine}",
      "{have i beaten|did i beat|have i defeated|did i defeat|did i win against|have i won against|did i lose to|have i lost to} {the computer|the bot|the ai|stockfish|the engine|computer|bot}",
      "what is my {record|win rate|winning percentage|score|result|performance|stats} {against|vs} {the computer|the bot|the ai|stockfish|the engine|computer|bot}",
      "which {computer difficulty|difficulty|bot difficulty|computer level|bot level} {did i play|do i play|have i played|did i play most|do i play most|have i played most|is my favorite}",
      "what {difficulty|computer difficulty|bot difficulty} {do i play most|did i play most|have i played most|do i usually play|did i play}",
      "what is the {strongest|hardest|toughest|highest} {computer|bot|ai|difficulty} {i beat|i have beaten|i defeated|i played}",
      "do i play more {against|vs} the computer",
      "show {me |}my {wins and losses|wins|losses|record|games|results|stats|match history|game history} {against|vs} {the computer|computer|the bot|bot|the ai|ai|stockfish}",
      "show {me |}my {computer|bot|ai|solo} {games|matches|results|record|history|stats|wins|losses|game history|match history}",
      "tell me my {computer|bot|ai} {game record|match record|win rate|wins|losses|results}",
      "give me my {computer|bot|ai} {game history|match history|record|stats}",
      "can i see my {computer|bot|ai} {games|matches|results|record|history}",
      "i want to see my {computer|bot|ai} {games|matches|results|record|history}",
      "my games against computer please",
      "computer games please",
      "bot games please",
      "my solo games please",
      "how many games i played with computer",
      "how many games i played against computer",
      "how many games vs computer",
      "games against stockfish",
      "games against the computer this month",
      "games against computer this month",
      "how many computer games this month",
      "how many bot games this month",
      "how many games against the computer this month",
      "did i win against stockfish",
    ],
  },
  {
    id: "live-match", intent: "live-match",
    noun: [
      "my {online|multiplayer|pvp|live|live multiplayer|friend|ranked|player versus player|human} {games|matches|match history|game history|record|history|wins|losses|draws|stats|statistics|results|game record|match record|victories|performance}",
      "my {online|multiplayer|pvp|live} chess {games|matches|history|record}",
      "my online chess history",
      "my games {against|with|vs} {friends|my friends|other students|other players|human players|human opponents|real players|humans|a friend|students}",
      "my {human opponent history|opponent history|previous opponents|opponents list|multiplayer opponents|pvp opponents|online opponents}",
      "my {previous|past|recent|latest|last} {pvp|online|multiplayer|live|friend|player versus player} {matches|games|results}",
      "my {friend matches|friend match history|live match record|live match history|live matches|live games|live game record}",
      "{online|multiplayer|pvp|live|friend|ranked} {matches|games|match history|game history|record|records|stats|statistics|results|history}",
      "games {against|with|vs} {friends|my friends|other students|other players|human players|human opponents|real players|humans|students}",
      "{human|real} opponents",
      "player versus player {games|matches|record|history|results}",
      "live match {record|history|results|stats}",
    ],
    sentence: [
      "how many {online|multiplayer|pvp|live|friend|ranked|player versus player} {matches|games} {did i play|have i played|did i win|have i won|did i lose|have i lost|did i draw|are there in my history|this month|i played|i won|i lost}",
      "how many {games|matches} {did i play|have i played|did i win|have i won|did i lose|have i lost|did i draw} {online|with friends|against friends|against other students|with other students|with other players|against human players|against real players|in multiplayer|in pvp|against humans}",
      "how many {pvp|multiplayer|online} {wins|losses|draws|victories} {do i have|have i got|did i get}",
      "what is my {online|multiplayer|pvp|live match|live|friend match} {record|win rate|stats|history|results|performance|game record}",
      "what is my record {against|with} {other students|friends|other players|human players|humans|real players}",
      "who {did i play online|did i play against online|were my opponents|did i play in my last online match|did i play in my last multiplayer game|was my last opponent|were my previous opponents|did i last play online}",
      "did i win my {last|latest|recent|previous} {online|multiplayer|pvp|live|friend} {match|game|games|matches}",
      "did i lose my {last|latest|recent|previous} {online|multiplayer|pvp|live|friend} {match|game|games|matches}",
      "have i won {any|many} {online|multiplayer|pvp|live} {matches|games}",
      "have i played {any|many} {online|multiplayer|pvp|live} {matches|games}",
      "show {me |}my {online|multiplayer|pvp|live|friend} {matches|games|record|history|results|stats|wins|losses}",
      "show {me |}my games {with|against|vs} {friends|other students|other players|human players|real players}",
      "tell me my {online|multiplayer|pvp|live} {record|history|stats|results|match record|game record}",
      "give me my {online|multiplayer|pvp|live} {record|history|stats|results|match history}",
      "can i see my {online|multiplayer|pvp|live} {matches|games|record|history|results}",
      "i want to see my {online|multiplayer|pvp|live} {matches|games|record|history|results}",
      "my online matches please",
      "my pvp record please",
      "my multiplayer record please",
      "my live match record please",
      "online matches please",
      "how many games i played online",
      "how many games i played with friends",
      "how many matches i played online",
      "any online matches played",
      "games with friends",
      "games with other students",
      "online games history",
      "pvp wins",
      "pvp losses",
      "online wins",
      "online victories",
      "multiplayer statistics",
    ],
  },
  {
    id: "mini-games", intent: "mini-games",
    noun: [
      "my {mini game|minigame|mini games|minigames|arcade|practice game} {records|record|scores|score|history|high scores|high score|results|performance|stats}",
      "my game {scores|score|high scores|high score}",
      "my {high|highest|best|top|personal best|personal record} {score|scores|result|results|record|records|performance|performances}",
      "my {high scores|best scores|top scores|personal bests|personal records|arcade scores|arcade records|practice scores|practice records|game high scores}",
      "my {mini games|minigames|arcade games|practice games}",
      "{high|highest|best|top} {score|scores}",
      "{personal|mini game|minigame|arcade|practice game} {records|record|scores|bests}",
      "game {scores|high scores}",
      "personal best",
      "personal bests",
    ],
    sentence: [
      "what {are my best game scores|are my best scores|is my best score|is my highest score|is my high score|is my personal best|is my personal record|is my best result|is my highest score in any game|are my high scores|are my personal records|are my top scores|are my mini game records|are my mini game scores|is my best performance}",
      "which {game is my best|game did i score highest in|mini game is my best|game has my highest score|game has my best score|mini game did i score highest in|game is my strongest|mini game has my top score}",
      "how much did i score in {mini games|my mini games|my best game|the mini games|practice games}",
      "show {me |}my {best scores|high scores|mini game records|mini game scores|top scores|personal records|personal bests|arcade scores|best results|highest scores|practice scores}",
      "show all my {high scores|best scores|mini game records|top scores}",
      "tell me my {best score|high score|highest score|personal best|best scores|high scores|mini game records}",
      "give me my {best scores|high scores|mini game records|top scores|personal bests}",
      "can i see my {best scores|high scores|mini game records|mini game scores|personal records}",
      "i want to see my {best scores|high scores|mini game records|mini game scores}",
      "i need my {best scores|high scores|mini game records|personal bests}",
      "list my {high scores|best scores|mini game records|top scores}",
      "my best score please",
      "my high scores please",
      "my mini game records please",
      "best scores please",
      "high scores please",
      "{high scores|best scores|mini game scores|mini game records|arcade scores|personal records|top scores}",
    ],
    perGame: [
      "my {best|highest|top} {G} {score|result|record}",
      "my {G} {high score|score|record|best score|best result|highest score|top score|personal best|result|results}",
      "{best|highest|top} {G} {score|result|record}",
      "{G} {high score|best score|highest score|personal best}",
      "my {best|highest|top} score in {G}",
      "my {score|record|result|best result|high score} in {G}",
      "what is my {best|highest|top} {G} {score|result|record}",
      "what is my {G} {high score|score|record|best score|highest score}",
      "what is my {best|highest|top} score in {G}",
      "what is my {high score|score|record|best result} in {G}",
      "how much did i score in {G}",
      "show {me |}my {G} {score|high score|record|best score}",
      "tell me my {best|high|highest} {G} score",
      "my {G} score please",
    ],
  },
  {
    id: "xp-history", intent: "xp-history",
    noun: [
      "my xp {|history|record|points|total|earned|gained|activity|log|details|report|summary|progress|status|breakdown|this month|today|this week|last month|received|collected}",
      "my {recent|total|earned|latest|monthly|daily|weekly} xp",
      "my {recent|latest} xp {activity|history|record|gains}",
      "my {experience points|experience record|experience history|experience|total experience points|experience earned|experience gained}",
      "my {earned points|points earned|points collected|points gained|points history|points this month|points record|activity points|progress points|level points|collected points}",
      "my {level progress|rating history|points from activities}",
      "points gained through activities",
      "xp {history|earned|gained|points|record|log|activity|total|this month|today|this week|summary}",
      "{total|recent|earned|latest|monthly} xp",
      "experience points",
      "{points|xp} {earned|collected|gained|received} {today|this month|this week|so far}",
      "{earned|collected} points",
    ],
    sentence: [
      "how much xp {did i earn|have i earned|did i get|did i receive|have i received|do i have|i have|i earned|have i gained|did i gain|did i collect|have i collected}",
      "how much xp {did i earn|did i get|did i receive|have i earned|did i gain} {this month|today|this week|last month|so far|in total|till now}",
      "how many {xp|xp points|experience points|points} {do i have|did i earn|have i earned|did i get|have i collected|did i collect|did i gain|have i gained|did i receive|have i received|i have}",
      "how many {xp|xp points|experience points|points} {did i earn|have i earned|did i get|did i gain} {this month|today|this week|last month}",
      "what is my {xp|total xp|xp history|xp record|xp total|xp points|xp status|experience points|xp balance}",
      "what {xp|points|experience points} {did i earn|did i get|have i collected|have i earned|did i receive|have i gained}",
      "where {did my xp come from|did i earn xp|did i get xp|did i get my points|did my points come from}",
      "how {did i earn xp|did i earn my points|did i get my xp|did i gain xp|did i get xp}",
      "show {me |}my {xp|xp history|xp record|xp points|xp activity|recent xp|total xp|xp log|experience points|points history|recent xp activity}",
      "tell me my {xp|total xp|xp history|xp points|experience points|xp earned}",
      "give me my {xp|xp history|xp record|xp points|xp report|experience points}",
      "can i see my {xp|xp history|xp record|xp points|xp activity}",
      "i want to see my {xp|xp history|xp record|xp points|xp activity}",
      "i need my {xp|xp history|xp record|xp report}",
      "my xp please",
      "xp history please",
      "my xp history please",
      "total xp please",
      "how much xp i have",
      "how much xp i earned",
      "how much xp i got",
      "my xp earned this month",
      "xp earned this month",
      "xp earned today",
      "xp earned this week",
    ],
  },
  {
    id: "puzzle-battle", intent: "puzzle-battle",
    noun: [
      "my puzzle battle {history|record|results|stats|statistics|score|scores|summary|performance|wins|losses|draws|games|matches|count}",
      "my puzzle battles",
      "my battle {history|record|results|stats|statistics|score|scores|wins|losses|draws|summary|performance}",
      "my battles {played|won|lost|drawn|count}",
      "my total battles",
      "my total {puzzle battles|puzzle duels|battle score|battle wins}",
      "my {puzzle duel|puzzle duels}",
      "my puzzle duel {record|history|results|stats|wins|losses}",
      "my puzzle competition {performance|results|record|history|stats}",
      "my opponent battles",
      "my battle opponents",
      "my {opponents|opponent history} in puzzle battle",
      "puzzle battle {history|record|results|stats|statistics|score|scores|summary|performance|wins|losses}",
      "puzzle battles",
      "puzzle duel {record|history|results|stats}",
      "puzzle duels",
      "battle {history|record|results|stats|statistics|score|summary}",
      "battles {won|lost|played|drawn}",
      "puzzle competition {performance|results|record}",
    ],
    sentence: [
      "how many {puzzle battles|battles|puzzle duels} {did i win|have i won|did i lose|have i lost|did i play|have i played|did i draw|have i drawn|do i have|i won|i lost|i played|are recorded|were played|did i complete|have i completed}",
      "how many {puzzle battle|battle} {wins|losses|draws|games} {do i have|have i got|did i get}",
      "how many times did i win {a|the} puzzle battle",
      "what is my {puzzle battle|battle|puzzle duel|puzzle competition} {record|score|stats|results|history|win rate|performance|summary|total score}",
      "what is my {best|highest|top|total|combined} {puzzle battle|battle} score",
      "what was my {best|highest|top} {puzzle battle|battle} score",
      "did i win my {last|latest|recent|previous} {puzzle battle|battle|puzzle duel}",
      "did i lose my {last|latest|recent|previous} {puzzle battle|battle|puzzle duel}",
      "did i win {any|many} {puzzle battles|battles|puzzle duels}",
      "have i won {any|many} {puzzle battles|battles|puzzle duels}",
      "have i {played|joined|completed} {any|a} {puzzle battle|puzzle battles|battle|puzzle duel}",
      "show {me |}my {puzzle battle|battle|puzzle duel} {history|record|results|stats|score|summary|wins|losses}",
      "show {me |}my {puzzle battles|battles|puzzle duels}",
      "tell me my {puzzle battle|battle} {record|score|results|stats|wins|losses|history}",
      "give me my {puzzle battle|battle} {record|history|results|stats|summary}",
      "can i see my {puzzle battle|battle} {record|history|results|stats}",
      "i want to see my {puzzle battle|battle} {record|history|results|stats}",
      "my puzzle battle record please",
      "my battle results please",
      "puzzle battle history please",
      "my battles please",
      "puzzle battle stats please",
    ],
  },
  {
    id: "live-puzzles", intent: "live-puzzles",
    noun: [
      "my {live classroom|classroom|live class|live|class} puzzle {attempts|history|activity|record|stats|statistics|performance|results|summary|solving|accuracy|practice}",
      "my {live classroom|classroom|live class} {puzzles|attempts|activity|performance|practice|tactics practice|training activity|practice activity|practice history|practice record|activity history|activity stats|activity record}",
      "my live puzzle {attempts|history|activity|record|stats|performance|accuracy}",
      "my classroom {training|tactics|solving} {activity|practice|history|record}",
      "the puzzles i solved in {class|the classroom|live class|the live classroom|my class}",
      "my puzzle solving attempts in class",
      "{live classroom|classroom|live class} puzzle {attempts|history|activity|record|stats|statistics|performance|results|accuracy}",
      "{live classroom|classroom|live class} {puzzles|attempts|activity|practice}",
      "live puzzle {attempts|history|activity|record|stats}",
      "puzzles solved in {class|the classroom|live class|the live classroom}",
    ],
    sentence: [
      "how many {classroom|live classroom|live class|live|class} puzzles {did i solve|have i solved|did i get right|did i attempt|have i attempted|did i complete|have i completed|did i get wrong}",
      "how many puzzles {did i solve|have i solved|did i attempt|have i attempted|did i complete|did i get right|did i get wrong} {in class|in the classroom|in live class|during class|during the live class|in the live classroom|in my classes}",
      "how many {correct|wrong} {answers|attempts|puzzles} {did i give|did i make|did i have|have i made|have i given|were mine} {in class|in the classroom|in live class|during class}",
      "how many {correct|wrong} {classroom puzzles|live puzzles|classroom attempts|live attempts}",
      "how many wrong attempts {in classroom puzzles|in live puzzles|in class}",
      "how {quickly|fast} {did i solve|do i solve|have i solved|am i solving} {classroom puzzles|puzzles in class|live puzzles|puzzles in the classroom|puzzles during class|live classroom puzzles}",
      "what is my {average solving time|average time|solving time|average solve time|average puzzle time} {in class|in classroom puzzles|in live puzzles|for classroom puzzles|in the classroom|for live puzzles}",
      "what is my {classroom|live classroom|live|class} puzzle {accuracy|record|stats|history|performance|attempts|activity|average time}",
      "what is my classroom puzzle summary",
      "show {me |}my {classroom|live classroom|live class|live} puzzle {attempts|history|activity|record|stats|performance|results}",
      "show {me |}my classroom {activity|attempts|practice|puzzles}",
      "tell me my {classroom|live classroom|live} puzzle {record|stats|accuracy|history|attempts}",
      "give me my {classroom|live classroom|live} puzzle {history|stats|record|activity}",
      "can i see my {classroom|live classroom|live} puzzle {attempts|history|activity|record|stats}",
      "i want to see my {classroom|live classroom|live} puzzle {attempts|history|activity|record|stats}",
      "my classroom puzzles please",
      "my live puzzle attempts please",
      "classroom puzzle attempts please",
      "how many classroom puzzles i solved",
      "how many puzzles i solved in class",
      "did i solve any puzzles in class",
      "did i solve puzzles in the classroom",
      "have i solved any live puzzles",
    ],
  },
  {
    id: "profile-rating", intent: "profile-rating",
    noun: [
      "my {elo|elo rating|elo score|current elo|olympus elo|chess elo|olympus rating|olympus score|olympus level|olympus points|chess rating|chess level|current rating|current level|current score|current tier|rating|rating breakdown|rating details|rating status|rating points|rating score|skill rating|skill level|strength rating|profile score|profile rating|profile level|puzzle rating|quiz rating|game rating|rating tier|composite rating|overall rating|rating level|level|tier|profile information|profile details}",
      "{elo|elo rating|olympus rating|olympus elo|current rating|current level|rating breakdown|rating status|skill rating|chess rating|profile score|puzzle rating|quiz rating|game rating|strength rating|skill level|rating details|current elo|rating points|rating tier}",
    ],
    sentence: [
      "what is my {elo|rating|olympus rating|current rating|current level|current elo|chess rating|skill level|tier|level|rating breakdown|profile score|rating status|puzzle rating|quiz rating|game rating|olympus level|olympus score|chess level|elo rating|skill rating|current tier|rating tier}",
      "whats my {elo|rating|level|olympus rating|current rating|tier|chess rating|skill level|current level|elo rating}",
      "what {level|tier|rating|elo|olympus rating} {am i|am i at|am i in|do i have|am i on}",
      "which {level|tier} {am i|am i in|am i at}",
      "how strong {am i|am i in chess|is my rating|am i at chess}",
      "how {high|good} is my {rating|elo|level}",
      "how good am i {in|at} chess",
      "how much is my {rating|elo|olympus rating}",
      "how many rating points {do i have|have i got|do i have now}",
      "how many points do i have in my rating",
      "what rating do i have",
      "what elo do i have",
      "what is my {puzzle|quiz|game} rating",
      "what are my ratings",
      "what is my rating {breakdown|details|status}",
      "show {me |}my {elo|rating|olympus rating|rating breakdown|current rating|skill level|current level|chess rating|profile score|elo rating|rating details|tier}",
      "tell me my {elo|rating|olympus rating|rating breakdown|current rating|skill level|current level|chess rating|elo rating|tier}",
      "give me my {elo|rating|olympus rating|rating breakdown|current rating|chess rating|elo rating|rating details}",
      "can i see my {elo|rating|olympus rating|rating breakdown|current rating|chess rating}",
      "i want to see my {elo|rating|olympus rating|rating breakdown|current rating|chess rating}",
      "i need my {elo|rating|olympus rating|rating breakdown|chess rating}",
      "check my {elo|rating|olympus rating|rating breakdown|chess rating|level}",
      "my elo please",
      "my rating please",
      "my olympus rating please",
      "my current level please",
      "my rating breakdown please",
      "show elo",
      "show rating",
      "show my elo",
      "show my rating",
      "how is my rating",
      "how is my elo",
      "hows my rating",
      "hows my elo",
      "how is my olympus rating",
      "what is the breakdown of my rating",
    ],
  },
  {
    id: "leaderboard", intent: "leaderboard",
    noun: [
      "{the|olympus|the olympus|academy|the academy} {leaderboard|rankings|ranking list|ranking|standings}",
      "{the current|current} {rankings|ranking list|leaderboard|ranking|standings}",
      "the full {leaderboard|rankings|ranking list}",
      "{the top|top} {players|students|ten players|ten students|twenty players|twenty students|five players|five students|three players|three students|10 players|10 students|20 players|20 students|5 players|3 players|10|20|5|ten|twenty|five}",
      "the {highest rated|highest rating|best|strongest|top rated|top ranked} {students|players}",
      "{highest rated|top rated|top ranked} {students|players}",
      "my {rank|current rank|ranking|current ranking|position|current position|leaderboard position|leaderboard rank|leaderboard ranking|leaderboard standing|competition ranking|competition rank|standing|current standing|academy rank|academy ranking|rank in the academy|rank among students|place on the leaderboard}",
      "my {rank|position|standing|place} {on the leaderboard|in the leaderboard|in the rankings|on the rankings|among students|in the academy|in the ranking list}",
      "leaderboard {position|rank|ranking|standing|list}",
    ],
    sentence: [
      "where {do i stand|do i stand on the leaderboard|do i stand in the rankings|do i rank|do i rank in the academy|do i rank among students|am i on the leaderboard|am i in the rankings|am i ranked|am i placed|am i standing|do i stand among students|do i stand in the academy}",
      "what {is my rank|is my current rank|is my ranking|is my position|is my leaderboard position|is my position on the leaderboard|is my standing|rank am i|rank am i in|rank am i on the leaderboard|position am i|position am i in|position am i on the leaderboard|is my rank on the leaderboard|is my current position|is my current ranking|is my rank in the academy}",
      "whats my {rank|ranking|position|leaderboard position|standing|current rank}",
      "how {is my ranking|is my rank|is my position|am i ranked|am i ranking|am i placed|is my leaderboard position|is my standing|is my rank looking}",
      "hows my {ranking|rank|position|leaderboard position}",
      "who {is number one|is number 1|is first|is first on the leaderboard|is on top|is on top of the leaderboard|is at the top|is leading|is leading the leaderboard|leads the leaderboard|is the top player|is the best player|is the best student|is the strongest player|is the highest rated student|is the highest rated player|has the highest rating|has the highest elo|is the top student|is rank 1|is ranked first|is ranked number one|is top|is the leader}",
      "who {is ahead of me|is above me|is ranked above me|is just above me|is just ahead of me|is right above me|is next above me|is leading me}",
      "who {are the top players|are the top students|are the top ten players|are the top 10 players|are the top ten students|are the top 20 players|are the top twenty players|are the highest rated students|are the highest rated players|are leading|are in the top ten|are in the top 10}",
      "show {me |}{the |}{top players|top students|top ten players|top 10 players|top ten students|top 10 students|top 10|top ten|top twenty|top 20|top five|top 5|leaderboard|full leaderboard|complete leaderboard|full rankings|rankings|current rankings|ranking list|top three|top 3|top players list|top rated students|highest rated students}",
      "give me {the |}{leaderboard|rankings|top players|top ten|top 10|top twenty|top 20|ranking list|full leaderboard|top five}",
      "tell me {the |}{leaderboard|rankings|top players|top ten|top 10|top ranking players}",
      "can i see {the |}{leaderboard|rankings|top players|top ten|top 10|ranking list|full leaderboard}",
      "i want to see {the |}{leaderboard|rankings|top players|top ten|top 10|ranking list}",
      "i need to know my {rank|ranking|position|standing}",
      "tell me my {rank|ranking|position|leaderboard position|current rank|standing}",
      "show {me |}my {rank|ranking|position|leaderboard position|current rank|standing|current position}",
      "my rank please",
      "my ranking please",
      "leaderboard please",
      "rankings please",
      "top players please",
      "top 10 please",
      "top ten please",
      "show leaderboard please",
      "who is number one please",
      "list the top {10|ten|20|twenty|5|five} {players|students}",
      "list the leaderboard",
      "list the rankings",
      "check my rank",
      "check my ranking",
      "check the leaderboard",
      "check the rankings",
    ],
  },
  {
    id: "progress-report", intent: "progress-report",
    noun: [
      "my {progress|progress report|overall progress|learning progress|chess progress|practice progress|training progress|academic progress|academy progress|progress card|progress summary|progress details|progress status|skill progress|skill development}",
      "my {training report|learning report|learning statistics|learning stats|learning summary|learning journey|chess journey|growth|growth report|improvement|improvement report|development|development report|chess development|performance|performance report|overall performance|academy performance|chess performance|activity report|activity summary|overall achievement|overall achievements|achievement report|achievements|training summary|training stats|practice summary|practice stats}",
      "{progress report|performance report|growth report|training report|improvement report|learning report|development report|achievement report|activity report}",
      "{learning|chess|overall|academic|academy} progress",
      "{training|practice|learning} summary",
    ],
    sentence: [
      "how {am i doing|am i doing in chess|am i doing in the academy|am i doing overall|am i performing|am i performing in chess|am i progressing|am i improving|well am i doing|well am i performing|well am i progressing|have i been doing|have i been performing|have i improved|much have i improved|much progress have i made|much have i progressed|much did i improve|am i doing in classes|am i doing at the academy|am i performing at the academy}",
      "how {is my progress|is my performance|is my improvement|is my development|is my growth|is my chess progress|is my learning going|is my learning progress|is my training going|is my practice going|is my overall performance|is my chess development|is my learning|is my chess going} {|so far|overall|lately}",
      "hows my {progress|performance|chess|improvement|development|growth|learning}",
      "have i {improved|been improving|made progress|progressed|grown} {|in chess|lately|recently|this month}",
      "am i {improving|making progress|progressing|doing well|doing okay|doing good|doing fine|learning well|growing|getting better|getting better at chess} {|in chess|lately|recently|this month}",
      "show {me |}my {progress|progress report|learning progress|chess progress|overall progress|performance report|growth report|training report|improvement report|achievements|overall performance|development report}",
      "tell me my {progress|progress report|learning progress|chess progress|overall progress|performance|overall performance|improvement}",
      "tell me about my {progress|performance|improvement|development|growth|learning progress}",
      "give me my {progress report|progress|performance report|growth report|training report|improvement report|learning report|development report}",
      "give my progress report",
      "can i see my {progress|progress report|learning progress|performance report|growth report|training report|improvement report|achievements}",
      "i want to see my {progress|progress report|learning progress|performance report|growth report|improvement report|achievements}",
      "i need my {progress report|performance report|growth report|training report|improvement report|learning report}",
      "i want to know my {progress|performance|improvement|development}",
      "my progress please",
      "progress report please",
      "my performance please",
      "my progress report please",
      "how am i doing please",
      "how is my progress please",
      "how am i doing sir",
      "what is my {progress|overall progress|learning progress|chess progress|performance|overall performance|improvement|development|growth|achievement}",
      "what are my {achievements|overall achievements|learning statistics}",
    ],
  },
  {
    id: "puzzle-report", intent: "puzzle-report",
    noun: [
      "my puzzle {report|stats|statistics|performance|activity|progress|record|records|history|summary|accuracy|solving stats|solving performance|solving history|solving record|solving accuracy|completion|results|rate}",
      "my {solving|puzzle solving|tactics solving} {history|performance|accuracy|record|stats|speed|rate}",
      "my {tactics|tactic} {report|stats|statistics|performance|progress|record|accuracy|history|summary}",
      "my {tactics training|practice|training practice} report",
      "my practice report",
      "my puzzles {solved|completed|attempted|record|summary}",
      "the puzzles i {solved|completed|attempted|got right|got wrong}",
      "puzzle {report|stats|statistics|performance|accuracy|completion|solving stats|solving performance|summary|record|history}",
      "{tactics|tactic} {report|stats|performance|progress|accuracy}",
      "puzzles {solved|completed|attempted}",
      "{solving|practice} {performance|report|accuracy}",
      "practice report",
    ],
    sentence: [
      "how many puzzles {did i solve|i solved|solved|have i completed|did i complete|did i get right|did i get wrong|have i attempted|did i attempt|did i fail|have i done|did i do|i have solved|i completed}",
      "how many puzzles {did i solve|did i complete} {so far|in total|till now|this month|overall}",
      "how {accurate am i in puzzles|accurate is my puzzle solving|accurate am i at puzzles|accurate am i in tactics|good am i at puzzles|good am i at tactics|good am i in puzzles|fast am i at puzzles}",
      "how {am i doing|am i performing|am i} {in|at} {puzzles|tactics|puzzle solving}",
      "how {is my puzzle performance|is my puzzle solving|is my puzzle accuracy|is my tactics performance|is my tactics progress|is my puzzle progress|are my puzzles going|is my solving}",
      "what is my {puzzle accuracy|puzzle solving accuracy|tactics accuracy|puzzle record|puzzle performance|puzzle stats|puzzle progress|tactics performance|solving accuracy|puzzle report|puzzle summary|puzzle completion rate}",
      "show {me |}my {puzzle report|puzzle stats|puzzle performance|puzzle accuracy|puzzle record|puzzle history|tactics report|tactics stats|puzzle progress|puzzle summary|solving stats|practice report}",
      "tell me my {puzzle report|puzzle stats|puzzle accuracy|puzzle performance|tactics performance|puzzle record|puzzle progress}",
      "give me my {puzzle report|puzzle stats|puzzle performance|tactics report|puzzle summary|practice report}",
      "can i see my {puzzle report|puzzle stats|puzzle performance|puzzle record|tactics report}",
      "i want to see my {puzzle report|puzzle stats|puzzle performance|puzzle record|tactics report}",
      "i need my {puzzle report|puzzle stats|puzzle performance|tactics report}",
      "my puzzle report please",
      "my puzzle stats please",
      "puzzle stats please",
      "puzzles solved please",
      "how many puzzles i solved",
      "how many puzzles solved",
      "how many puzzles i have solved",
      "puzzle accuracy please",
      "my tactics stats please",
    ],
  },
  {
    id: "announcements", intent: "announcements",
    noun: [
      "{the |}{academy|olympus|olympus academy} {announcements|announcement|notices|notice|updates|update|news|broadcasts|broadcast|messages|message|information|notice board|bulletin}",
      "{the |}{latest|recent|new|current|newest|important|today} {announcements|announcement|notices|notice|updates|update|news|messages|message|broadcast|broadcasts}",
      "{the |}{latest|recent|new|current|important} academy {announcements|announcement|notices|notice|updates|update|news|messages|message|broadcast|broadcasts|information}",
      "{the |}latest {news|updates|information|notice} {from the academy|from academy|from olympus|at the academy}",
      "new messages {from the academy|from academy|from olympus}",
      "the notice board",
      "the broadcast message",
      "latest broadcast message",
      "academy bulletin",
      "{important|new|latest} {notice|notices|announcement|announcements|update|updates}",
    ],
    sentence: [
      "any {new |latest |important |recent |}{announcement|announcements|notice|notices|update|updates|news|message|messages|broadcast|broadcasts}",
      "any {new |latest |important |}{announcement|notice|update|news|message} {today|from the academy|from academy|from olympus|at the academy}",
      "any {academy|olympus} {update|updates|news|announcement|announcements|notice|notices|message|messages|broadcast|broadcasts}",
      "any new {update|updates|message|messages|news|notice} {from the academy|from academy|in the academy}",
      "is there {any |a |an |}{new |latest |important |}{announcement|announcements|notice|notices|update|updates|news|message|broadcast}",
      "is there {any |}{new |important |}{announcement|notice|update|news|message} {today|from the academy|from academy|at the academy|in the academy}",
      "is there anything new {in|at} the academy",
      "is there any news {from|in|at} the academy",
      "did the academy {announce|post|send} anything",
      "did the academy {announce|post|send} anything new",
      "has the academy {announced|posted|sent} anything",
      "what {is happening|is going on|are the news|is new|is the news|is the latest news|is the latest update|is the latest announcement|is the latest notice|is the latest broadcast} {at|in|from} {the academy|academy|olympus|olympus academy}",
      "whats {happening|going on|new|the latest|the news} {at|in|from} {the academy|academy|olympus}",
      "what {announcements|notices|updates|messages|broadcasts|news} {are there|are available|do we have|are new|are out|are posted} {|today|now|in the academy}",
      "what are the latest {announcements|academy updates|academy notices|academy news|notices|updates|broadcasts}",
      "what is the latest {announcement|academy update|academy news|notice|update|academy notice|broadcast}",
      "what is the {academy news|academy update|latest academy information}",
      "show {me |}{the |}{announcements|latest announcements|academy announcements|academy notices|academy updates|latest announcement|academy news|latest academy updates|latest notices|notice board|broadcast message|latest news|new announcements|important notices}",
      "tell me {the |}{latest announcements|academy news|latest academy updates|latest news from the academy|academy updates|academy announcements|latest announcement}",
      "give me {the |}{latest announcements|academy news|latest academy updates|academy updates|academy notices}",
      "can i see {the |}{announcements|latest announcements|academy announcements|academy notices|academy updates|latest news}",
      "i want to see {the |}{announcements|latest announcements|academy announcements|academy notices|academy updates}",
      "i want to know the {latest announcements|academy news|latest updates|latest notice}",
      "i need to know the {latest announcements|academy news|latest updates|latest notice}",
      "announcements please",
      "academy news please",
      "any notice please",
      "any new announcement please",
      "any update please",
      "latest news please",
      "academy updates please",
      "check {announcements|notices|academy updates|academy news|the notice board}",
    ],
  },
];

// ---------------------------------------------------------------------
// Expanded natural-language coverage (4.2.3 vocabulary extension)
// Additive only: retains every original intent and handler contract.
// ---------------------------------------------------------------------
VOCAB_SOURCE.push(
  {
    id: "student-report", intent: "student-report",
    noun: [
      "my {student|academy|olympus} {account|profile|record|file|details|information|overview|summary|history}",
      "my {personal|complete|full|overall|entire} {student|academy|account} {profile|record|summary|overview|history|details}",
      "{student|academy|account} {profile|record|file|summary|overview} {for me|about me|of mine}",
      "all {available|stored|recorded|saved} {student|academy|account} {details|information|records|data}",
      "my {academy|student|account} {data|information|records} {in one place|in one report|together}",
      "my {complete|full|overall} {academy|student} {history|profile|record|account summary}",
      "everything recorded {about me|for my account|in my student profile}",
      "all details {connected to my account|linked to my profile|from my academy account}",
      "my {personal|student|academy} information {and records|and details|and history}",
      "my {overall|complete|full} student {overview|summary|profile|record}",
    ],
    sentence: [
      "{show|display|pull up|bring up|fetch|open} {my|the} {student|academy|account} {profile|record|details|information|summary|overview}",
      "{give|share|send|prepare|show} me my {complete|full|overall|entire} {student|academy|account} {report|summary|overview|profile}",
      "what {information|details|records|data} {do you have|are available|are recorded|are stored} {about me|on my account|for my profile}",
      "what does my {student|academy|account} profile {show|contain|include|say}",
      "what can you tell me about my {student|academy|olympus} account",
      "let me see my {whole|complete|full|overall} academy profile",
      "i would like to view my {student|account|academy} {report|profile|records|details}",
      "can you pull up all my {academy|student|account} information",
      "could you show me the details saved in my student account",
      "please display my complete academy record",
      "i want an overview of everything in my academy account",
      "where can i see my full student profile",
      "show all the information linked with my account",
      "fetch my complete student information",
      "get all my academy records together",
      "what is recorded in my academy profile",
      "can you give me an overall view of my student account",
      "i need to check my complete academy profile",
    ],
  },
  {
    id: "class-report", intent: "class-report",
    noun: [
      "my {weekly|regular|usual|upcoming|next|online|chess|coaching} {class|batch|lesson|session} {plan|calendar|schedule|timing|timetable|slots}",
      "my {class|batch|lesson|session} {booking|allocation|subscription|package|credit|count|remaining balance|plan details}",
      "my {unused|available|remaining|unattended} {class|lesson|session} {credits|slots|allowance}",
      "my {next|upcoming|scheduled|regular} {coaching|chess|online} {class|lesson|session}",
      "my {batch|class} {days|weekdays|time slots|weekly timings|calendar}",
      "{class|lesson|session} {credits|slots|allowance} {left|remaining|available}",
      "{coaching|chess|online} {class|lesson} {calendar|timetable|schedule|timings}",
      "my {private|individual|one to one|1 on 1} coaching {plan|package|schedule|timings|sessions}",
      "my {group|regular|weekly} batch {schedule|timings|calendar|details}",
    ],
    sentence: [
      "what day is my {regular|weekly|next|upcoming} {chess|online|coaching} {class|lesson|session}",
      "when does my {batch|class|lesson|session} {take place|happen|run|start|begin}",
      "when am i scheduled for {chess|coaching|online} {class|training|a lesson|a session}",
      "what is the time slot for my {next|upcoming|regular} {class|batch|lesson|session}",
      "which days am i supposed to attend {class|coaching|chess lessons}",
      "how many {class|lesson|session} {credits|slots} do i have {left|remaining|unused|available}",
      "how many coaching sessions are still available in my package",
      "how many classes have been used from my package",
      "how many sessions are included in my current plan",
      "when will my next coaching session be held",
      "do i have a scheduled chess lesson {today|tomorrow|this week}",
      "is my next class coming up {today|tomorrow|this week}",
      "am i assigned to a {morning|afternoon|evening} batch",
      "which coaching group have i been placed in",
      "what is the timetable for my batch",
      "please check my upcoming class schedule",
      "can you tell me the day and time of my next lesson",
      "show my remaining class credits and schedule",
      "i need to check my class package and remaining sessions",
      "when is my next online chess coaching session",
    ],
  },
  {
    id: "payments", intent: "payments",
    noun: [
      "my {fee|tuition|course|coaching|academy} {payment|transaction|receipt|invoice} {history|record|details|statement|proof|confirmation}",
      "my {paid|completed|successful|recorded} {fee|tuition|course} {payments|transactions|installments}",
      "my {payment|fee|transaction} {timeline|log|ledger|breakdown|summary}",
      "my {latest|most recent|previous|earlier|monthly} {fee|tuition|coaching} {payment|receipt|transaction}",
      "my {payment confirmation|transaction confirmation|fee acknowledgement|payment receipt}",
      "{fee|tuition|coaching} payment {proof|evidence|record|history|statement}",
      "{installment|instalment|monthly payment} {history|record|details|status|receipt}",
      "my {online|upi|bank|digital} payment {record|reference|receipt|confirmation}",
      "my {payment|fee} {amounts|dates|references|receipts|entries}",
    ],
    sentence: [
      "show me all the {fee|tuition|coaching|course} payments i have made",
      "list my {successful|completed|recorded} payments",
      "can you display my payment history month by month",
      "what payments are saved against my student account",
      "when was my {latest|most recent|previous} fee payment recorded",
      "what was the date of my last tuition payment",
      "how much money have i paid to the academy so far",
      "how much have i spent on my chess classes",
      "which fee installments have been paid already",
      "show the receipts available in my account",
      "do i have a receipt for my last payment",
      "can you find my latest payment confirmation",
      "please show my payment transaction details",
      "i want to verify whether my payment is recorded",
      "did the academy receive and record my fee payment",
      "check the payment entries linked to my account",
      "what fee transactions are available for me to view",
      "show my tuition fee payment statement",
      "tell me the total amount of payments recorded for me",
      "can i review the fee payments i made earlier",
      "is there a recorded entry for my recent installment",
      "what is the status of the payment i made recently",
    ],
  },
  {
    id: "attendance", intent: "attendance",
    noun: [
      "my {class|lesson|session} {presence|absence|participation} {history|record|summary|details|report}",
      "my {attendance|presence} {percentage|rate|trend|history|sheet|register|summary|record}",
      "my {missed|attended|skipped|absent} {class|lesson|session} {dates|days|history|record|count}",
      "my {monthly|weekly|recent|overall} attendance {summary|percentage|record|report|history}",
      "my {class|coaching|lesson} participation {rate|history|record|summary}",
      "{days|dates|sessions} of my {attendance|absence|presence}",
      "my {present|absent} {days|sessions|class count|attendance count}",
    ],
    sentence: [
      "how many sessions have i actually attended",
      "how many coaching classes did i not attend",
      "which dates was i away from class",
      "on which days was i marked present or absent",
      "can you show my attendance month wise",
      "what percentage of my classes have i attended",
      "am i attending most of my scheduled sessions",
      "have i been regular with my coaching classes",
      "how often have i been absent from lessons",
      "show me the dates of all the classes i missed",
      "show me the sessions i was present for",
      "give me a breakdown of my presence in class",
      "what does my recent class attendance look like",
      "how many lessons did i skip this month",
      "how many lessons did i join this month",
      "was i there for the previous coaching session",
      "was i absent in my last online class",
      "can you check my class participation history",
      "please show my monthly attendance record",
      "i want to review my present and absent days",
      "tell me if i have missed any scheduled classes",
    ],
  },
  {
    id: "assignments", intent: "assignments",
    noun: [
      "my {assigned|pending|completed|submitted|overdue} {chess|class|practice|academy} {work|task|homework|assignment|exercise}",
      "my {to do|todo|unfinished|incomplete|outstanding} {work|tasks|homework|assignments|submissions}",
      "my {submission|homework|assignment} {deadline|due date|completion status|submission status|history}",
      "my {workload|task list|homework list|assignment list|submission list}",
      "{practice|class|academy} {work|exercise|task} {given to me|assigned to me|left to finish}",
      "my {late|overdue|unsubmitted|not submitted} {tasks|homework|assignments|classwork}",
      "my {completed|finished|turned in|submitted} {tasks|homework|assignments|work}",
    ],
    sentence: [
      "what do i still need to finish for the academy",
      "what work has my coach assigned to me",
      "is there anything i need to turn in",
      "which tasks are waiting for my submission",
      "what should i complete before my next class",
      "have i turned in all the work i was given",
      "which assignments have not been turned in yet",
      "show everything that is still pending from my side",
      "do i have any unfinished chess exercises",
      "are there any tasks past their due date",
      "what is the next homework i should work on",
      "when do my current assignments need to be submitted",
      "how many tasks are still open for me",
      "which pieces of homework have i already completed",
      "please list my outstanding academy work",
      "check whether i have any work to submit today",
      "show the homework that is assigned but not completed",
      "what is left on my task list",
      "can you review my assignment submission status",
      "tell me what i have to complete this week",
    ],
  },
  {
    id: "games-report", intent: "games-report",
    noun: [
      "my {game|match|playing} {history|activity|record|statistics|stats|results|summary|performance}",
      "my {overall|total|recent|monthly|weekly} {gameplay|gaming|chess playing} {record|history|stats|results|summary}",
      "my {win|loss|draw} {count|percentage|rate|record|statistics|summary}",
      "my {played|finished|completed} {games|matches} {history|list|record|results}",
      "my {chess|game} {win loss|wins losses|victory defeat} {record|ratio|statistics}",
      "my {recent|latest|previous} playing {activity|results|history|record}",
    ],
    sentence: [
      "give me a breakdown of all the games i have played",
      "how many chess matches have i completed in total",
      "what is the total number of games in my history",
      "how many victories and defeats are in my record",
      "what percentage of my games have i won",
      "show my win loss and draw statistics",
      "can i review the matches i played recently",
      "how has my game record been lately",
      "what results have i got from my games",
      "am i winning more games than i am losing",
      "show the overall summary of my chess games",
      "list the matches recorded under my profile",
      "what is my total playing activity",
      "how many matches ended in a draw for me",
      "let me check my recent game results",
      "please pull up my complete game history",
      "how many games have i played up to now",
      "what does my win rate look like",
      "show my victories defeats and draws",
      "give me the statistics for my played matches",
    ],
  },
  {
    id: "vs-bot", intent: "vs-bot",
    noun: [
      "my {computer|engine|stockfish|chess bot|ai opponent|robot opponent} {match|game} {history|record|results|stats|statistics|performance}",
      "my {offline|solo|single player|computer controlled} chess {games|matches|record|history|results}",
      "my games against {an engine|a computer opponent|an ai opponent|a chess bot|stockfish}",
      "my {bot|computer|engine} opponent {level|strength|difficulty|record|history}",
      "{computer|engine|bot|stockfish} match {results|history|record|statistics|wins|losses}",
      "my {solo mode|single player mode|computer mode} {history|results|record|games}",
    ],
    sentence: [
      "how have i performed against computer opponents",
      "show the chess games i played versus the engine",
      "what is my record in single player chess",
      "how many matches have i played with the ai opponent",
      "how many times have i beaten the chess bot",
      "how many times did the computer defeat me",
      "what is my win percentage against stockfish",
      "which engine difficulty have i faced most often",
      "what is the toughest computer level i have beaten",
      "can i see my offline chess match history",
      "show my solo mode match results",
      "list all the games i played against a bot",
      "did i win my previous computer opponent game",
      "how many games did i lose to the engine",
      "have i drawn any games against the computer",
      "please check my ai opponent statistics",
      "i want to review my computer chess results",
      "give me my bot match performance summary",
      "what happened in my latest game against stockfish",
      "show the results of my single player matches",
    ],
  },
  {
    id: "live-match", intent: "live-match",
    noun: [
      "my {online|live|multiplayer|human opponent|player versus player|pvp} {chess|rated chess} {history|record|stats|results|performance}",
      "my {friend|friends|student|human} {matches|games|opponents|match history|game history}",
      "my {ranked|unranked|online} {multiplayer|human} {games|matches|results|record}",
      "my {head to head|versus player|player versus player} {record|history|results|statistics}",
      "{online|live|multiplayer|pvp} chess {wins|losses|draws|history|record|statistics}",
      "my games against {another student|other members|academy players|real opponents}",
    ],
    sentence: [
      "how am i doing in games against real people",
      "show all the online chess matches i have played",
      "who have i played against in multiplayer chess",
      "who was my opponent in the last live game",
      "how many games have i played with other students",
      "what is my record in player versus player chess",
      "how many live matches have i won or lost",
      "show my recent friend match results",
      "can i see my history against human opponents",
      "have i played any ranked online games",
      "what are my multiplayer win and loss numbers",
      "who are the players i have faced online",
      "please pull up my live chess match history",
      "give me the results of my human versus human games",
      "how many draws do i have in online matches",
      "what happened in my most recent multiplayer match",
      "show the opponents from my previous live games",
      "i want to check my pvp performance",
      "list the games i played with academy friends",
      "how successful have i been in online chess matches",
    ],
  },
  {
    id: "mini-games", intent: "mini-games",
    noun: [
      "my {arcade|mini game|minigame|practice game|chess mini game} {scoreboard|score history|personal best|best result|top result|records}",
      "my {game wise|game by game|individual game} {scores|records|high scores|personal bests}",
      "my {best|highest|top|maximum} score {in|for} {arcade games|mini games|practice games}",
      "my {score|record|performance} {on|for} {the mini games|the arcade games|the practice games}",
      "{arcade|mini game|minigame|practice game} {leaderboard|high score|personal record|best score}",
    ],
    sentence: [
      "which arcade game have i performed best in",
      "show my scores separately for each mini game",
      "what is the highest score i have ever made in a practice game",
      "which of my mini games has the best personal record",
      "can i check the records for every arcade challenge",
      "how many points did i get in my best mini game run",
      "show my personal best for each practice game",
      "what are my top results across the mini games",
      "list my highest scores in the arcade section",
      "which practice game gives me my best score",
      "what score have i achieved in each mini game",
      "how did i perform in the arcade challenges",
      "pull up my mini game scoreboard",
      "give me my game wise high score list",
      "i want to compare my records across practice games",
      "show the best result i have on every mini game",
      "what is my record in the chess mini games",
      "check my highest arcade scores",
    ],
    perGame: [
      "my {personal best|best run|highest result|top result} on {G}",
      "my score {for|on|in} {G}",
      "how did i do in {G}",
      "how well did i perform in {G}",
      "what record do i hold in {G}",
      "show my results for {G}",
      "my {G} performance history",
      "what is my top score on {G}",
      "have i played {G} before",
      "list my attempts at {G}",
    ],
  },
  {
    id: "xp-history", intent: "xp-history",
    noun: [
      "my {experience|xp|activity} {points|point balance|earnings|gains|collection|history|ledger|breakdown}",
      "my {daily|weekly|monthly|overall|recent} {experience points|xp gains|xp earnings|points earned}",
      "my {points|xp} {source|sources|earning history|activity log|reward history}",
      "my {total|current|accumulated|earned} {experience|xp} {points|score|amount|total}",
      "{experience|reward|activity} points {earned|received|collected|gained} {today|this week|this month}",
    ],
    sentence: [
      "where have all my experience points come from",
      "what activities have given me xp",
      "show how my xp has increased over time",
      "how many experience points have i collected in total",
      "what is the amount of xp earned during this week",
      "how many points did i collect from academy activities",
      "can you show my recent experience point gains",
      "which activities rewarded me with points",
      "how much experience have i accumulated so far",
      "what is my current xp total",
      "show my daily and monthly xp earnings",
      "give me a breakdown of the points i received",
      "why did my xp increase recently",
      "where did these points in my account come from",
      "please show my experience points activity log",
      "what rewards have added to my xp balance",
      "how many points did i gain from my recent activity",
      "let me review my xp collection history",
    ],
  },
  {
    id: "puzzle-battle", intent: "puzzle-battle",
    noun: [
      "my {puzzle|chess puzzle|tactical puzzle} {battle|duel|showdown|competition} {history|record|results|stats|statistics}",
      "my {head to head|one on one|1v1} puzzle {battle|duel|match} {record|history|results}",
      "my {battle|duel} {wins|losses|draws|victories|defeats|score|performance}",
      "my {puzzle battle|puzzle duel} {opponent|opponents|match list|scoreboard|win rate}",
      "{puzzle|tactics} battle {statistics|match history|score history|competition results}",
    ],
    sentence: [
      "how have i performed in head to head puzzle challenges",
      "show the one on one puzzle battles i have played",
      "who have i faced in puzzle battle mode",
      "what is my win loss record in puzzle duels",
      "how many puzzle competitions have i taken part in",
      "how many duels have i won against other students",
      "show my latest puzzle battle result",
      "what was the score in my previous puzzle duel",
      "can i review my puzzle battle opponents",
      "how many times have i been defeated in puzzle battles",
      "how many draws have i had in puzzle competitions",
      "give me my battle mode performance summary",
      "list my victories in puzzle battle",
      "show the history of my tactical duels",
      "i want to check my puzzle competition statistics",
      "what is my total score from puzzle battles",
      "have i played any one on one puzzle matches",
      "please pull up my duel results",
    ],
  },
  {
    id: "live-puzzles", intent: "live-puzzles",
    noun: [
      "my {classroom|live classroom|live lesson|coaching session} {puzzle solving|tactics practice|puzzle attempts|solving activity|puzzle results}",
      "my {teacher led|coach led|classroom} {puzzle|tactics} {attempts|practice|activity|history|performance}",
      "my {correct|incorrect|wrong|successful} {classroom|live class} {puzzle attempts|answers|solutions}",
      "my {live session|class session|classroom} {tactics|puzzle} {record|progress|accuracy|results}",
      "{in class|during class|in live class} {puzzle solving|tactics attempts|puzzle practice|chess puzzles}",
    ],
    sentence: [
      "how many tactics questions did i solve during coaching",
      "what puzzles have i attempted in the live classroom",
      "show my puzzle work from the live lessons",
      "how many classroom tactics answers were correct",
      "how many classroom puzzle answers were incorrect",
      "what is my success rate on puzzles solved during class",
      "how quickly do i solve puzzles in the live session",
      "can i see my live lesson puzzle attempts",
      "which classroom puzzles did i get wrong",
      "which tactics questions did i answer correctly in class",
      "give me the details of my in class puzzle practice",
      "show the activity from my teacher led puzzle sessions",
      "how many live class puzzles have i attempted so far",
      "what is my accuracy in classroom tactics practice",
      "please review my puzzle solving during live classes",
      "i want to check my live classroom puzzle performance",
      "list the puzzles i worked on with my coach",
      "show my correct and wrong attempts in class puzzles",
    ],
  },
  {
    id: "profile-rating", intent: "profile-rating",
    noun: [
      "my {olympus|academy|chess|skill|current} {rating|elo|level|strength|rank points|rating points}",
      "my {rating|elo|skill level} {breakdown|calculation|details|status|progress|score}",
      "my {current|present|latest|overall} {chess rating|olympus rating|skill rating|rating level|elo score}",
      "my {player|student|chess} {level|rating|strength|profile rating|skill score}",
      "{rating|elo|skill} {points|score|level|tier} {on my profile|in my account|for my account}",
      "my {overall|composite|academy} chess {rating|score|level|strength}",
    ],
    sentence: [
      "where does my current chess rating stand",
      "what rating is currently shown on my profile",
      "how many olympus rating points do i have right now",
      "what skill level has my account reached",
      "what is the current rating associated with my profile",
      "can you check my latest olympus rating",
      "show the rating and level saved in my account",
      "how strong is my current chess profile rating",
      "what tier am i currently placed in",
      "what level have i reached in the academy system",
      "how many skill points are shown for me",
      "please pull up my current rating details",
      "explain the rating information available on my profile",
      "what is my present chess strength score",
      "where can i see my olympus skill level",
      "tell me the rating points linked to my student profile",
      "i need to check my current rating and tier",
      "what level and rating do i have in olympus",
    ],
  },
  {
    id: "leaderboard", intent: "leaderboard",
    noun: [
      "{academy|olympus|student|chess} {rank table|ranking table|top list|standings table|leaderboard table}",
      "{top|highest ranked|leading|best performing} {academy students|chess students|players|members}",
      "my {place|standing|rank number|position number} {among students|in olympus|in the academy rankings}",
      "the {student|player|academy} {rankings|standings|top positions|rank list}",
      "{top scorers|highest scoring students|leading students|ranked students} {in the academy|on olympus}",
    ],
    sentence: [
      "what place am i holding among the academy students",
      "where am i placed compared with the other chess students",
      "show me the current order of ranked students",
      "who are the highest scoring students right now",
      "which students are leading the olympus rankings",
      "who is currently at the top of the student list",
      "can you display the academy top ranking table",
      "what position do i occupy among all players",
      "how far am i from the student ranked above me",
      "show the top performing chess students",
      "list the highest ranked members of the academy",
      "where do i appear in the current ranking table",
      "please show the latest student standings",
      "who has the highest olympus score",
      "who is leading the academy leaderboard today",
      "i want to compare my place with other students",
      "give me the top students in rank order",
      "check my position in the academy rankings",
    ],
  },
  {
    id: "progress-report", intent: "progress-report",
    noun: [
      "my {chess|learning|training|academy|student|overall} {growth|development|improvement|progress journey|progress summary|performance trend}",
      "my {learning|training|chess} {milestones|development|growth|improvement|progress history|performance summary}",
      "my {overall|recent|monthly|long term} {improvement|growth|development|learning progress|training progress}",
      "my {skill development|chess development|training progress|learning progress} {report|summary|review|overview}",
      "my {progress|improvement|development} {over time|this month|recently|so far}",
    ],
    sentence: [
      "am i getting better at chess over time",
      "how much have my chess skills improved recently",
      "what progress have i made since joining the academy",
      "show how my learning has developed over time",
      "how is my overall training coming along",
      "what improvements have i made in my chess journey",
      "can you review my development as a chess student",
      "how has my performance changed recently",
      "what milestones have i reached in my training",
      "am i making steady progress with my lessons",
      "give me an overview of my learning journey",
      "how much better have i become at chess",
      "what does my recent improvement look like",
      "show my overall growth as a student",
      "please provide a review of my academy progress",
      "how is my chess development going so far",
      "what areas show progress in my training record",
      "i want to understand my improvement over the last few weeks",
      "how am i progressing with my chess learning",
      "give me a summary of my training development",
    ],
  },
  {
    id: "puzzle-report", intent: "puzzle-report",
    noun: [
      "my {tactics|chess puzzle|puzzle solving|puzzle training} {accuracy|success rate|attempt history|solving record|results|statistics}",
      "my {solved|attempted|completed|correct|incorrect} {puzzle|tactics} {count|history|record|summary|statistics}",
      "my {puzzle|tactics} {success percentage|completion rate|accuracy rate|solving speed|attempt log}",
      "my {daily|weekly|monthly|overall} puzzle {practice|solving|accuracy} {summary|report|history|stats}",
      "{chess tactics|puzzle practice|puzzle solving} {accuracy|performance|progress|history|statistics}",
    ],
    sentence: [
      "how accurate am i when solving chess tactics",
      "what percentage of puzzles do i solve correctly",
      "how many puzzle attempts have i made overall",
      "how many tactics puzzles have i completed successfully",
      "show the number of puzzles i got right and wrong",
      "what is my correct answer rate in chess puzzles",
      "how fast am i solving the puzzles on average",
      "can i review my chess tactics solving history",
      "what is my puzzle completion percentage",
      "show my latest puzzle practice results",
      "how many puzzles have i attempted but not solved",
      "give me a breakdown of my puzzle accuracy",
      "what do my tactics solving statistics look like",
      "please pull up my puzzle practice report",
      "i want to check how well i solve chess puzzles",
      "how many puzzle questions have i answered correctly",
      "show my puzzle solving speed and accuracy",
      "what has my puzzle practice performance been like",
      "list my completed and attempted chess puzzles",
      "how is my tactics accuracy improving",
    ],
  },
  {
    id: "announcements", intent: "announcements",
    noun: [
      "{academy|olympus|coach|teacher} {notice|message|bulletin|circular|announcement|update|communication}",
      "{latest|recent|new|important|official} {academy|coach|teacher} {message|notice|circular|announcement|update}",
      "my {academy|class|coach} {notices|messages|updates|announcements}",
      "{class|batch|academy} {notice board|message board|bulletin board|updates}",
      "{official|important|urgent|recent} {academy notice|class notice|teacher message|coach update}",
    ],
    sentence: [
      "has the coach shared any new message",
      "did our teacher post any update for students",
      "what did the academy communicate recently",
      "are there any circulars from olympus",
      "show the messages sent by the academy",
      "what notices have been published for students",
      "has anything been posted on the academy notice board",
      "is there a new message from my coach",
      "please check for important class notices",
      "what are the latest instructions from the academy",
      "have there been any changes announced by olympus",
      "show the official updates available to students",
      "did the academy send any circular today",
      "what information has the teacher shared with the batch",
      "can i read the latest coach announcement",
      "are there any new batch messages for me",
      "i want to see recent academy communications",
      "please open the latest notice from olympus",
      "what should students know from the latest academy message",
      "show any important announcements i may have missed",
    ],
  }
);



// ---------------------------------------------------------------------
// Broad conversational templates (additional coverage)
// ---------------------------------------------------------------------
VOCAB_SOURCE.push(
  { id: "student-report", intent: "student-report", noun: [
    "{my|the} {student|academy|olympus} {profile|account|record|details|summary|overview}",
    "{my|the} {complete|full|overall|entire} {student|academy|account} report",
    "{student|academy|account} {information|details|records|data} {for my profile|about my account|available to me}",
  ], sentence: [
    "{show|display|pull up|open|fetch} my {student|academy|olympus} {profile|account|record|details|summary|overview}",
    "{give|send|prepare|show} my {full|complete|overall|entire} {student|academy|account} report",
    "what {student|academy|account} {details|records|information|data} are {available|saved|stored|recorded} {for me|on my profile}",
    "can you {show|display|fetch|open} the {full|complete|overall} details of my academy account",
    "i want to {view|check|review|see} my {complete|full|overall} student profile",
  ]},
  { id: "class-report", intent: "class-report", noun: [
    "my {class|batch|lesson|session} {time|timing|schedule|timetable|calendar|days|slots}",
    "my {private|individual|one to one|group|weekly} {class|coaching|lesson} {schedule|timings|package|plan}",
    "{class|batch|coaching} {credits|sessions|lessons|slots} {remaining|available|left}",
  ], sentence: [
    "{show|display|tell me|give me} my {class|batch|lesson|session} {time|timing|schedule|timetable|calendar|days}",
    "when is my {next|upcoming|regular|weekly|private|group} {chess|coaching|online} {class|lesson|session}",
    "how many {classes|lessons|sessions} {do i have|are left|remain} {in my package|in my plan|this month}",
    "what is the {time|timing|schedule|timetable} of my {next|upcoming|regular} {class|batch|lesson|session}",
    "can you {check|show|tell me} my {private|group|weekly|regular} coaching {schedule|timings|batch}",
  ]},
  { id: "payments", intent: "payments", noun: [
    "my {fee|tuition|course|coaching} {payments|transactions|receipts|installments}",
    "my {payment|fee|transaction} {history|details|record|statement|confirmation|receipt}",
    "{paid|recorded|completed} {fee|tuition|course} {payments|installments|transactions}",
  ], sentence: [
    "{show|display|list|pull up} my {fee|tuition|course|coaching} {payments|transactions|receipts|installments}",
    "how much {money|fees|tuition|amount} {have i paid|did i pay|have i paid so far} {this month|last month|in total|till now}",
    "when was my {last|latest|previous|most recent} {fee|tuition|course} {payment|installment|transaction} {recorded|received|made}",
    "can you {check|show|find|display} my {latest|previous|recent} payment {record|receipt|confirmation|details}",
    "which {fee|tuition|course} installments have i {paid|completed|made} {already|so far|till now}",
  ]},
  { id: "attendance", intent: "attendance", noun: [
    "my {attendance|presence|absence} {record|history|report|percentage|summary|details}",
    "my {monthly|weekly|recent|overall} class {attendance|presence|absence} {summary|record|report|history}",
    "my {attended|missed|absent|present} {class|lesson|session} {days|dates|count|history}",
  ], sentence: [
    "{show|display|list|check} my {attendance|presence|absence} {record|history|report|percentage|summary}",
    "how many {classes|lessons|sessions} {did i attend|have i attended|did i miss|have i missed} {this week|this month|last month|so far}",
    "which {classes|sessions|days|dates} was i {present|absent} {for|in|during}",
    "what is my {monthly|weekly|overall|recent} attendance {percentage|record|summary|history}",
    "can you {show|check|review} the dates of my {missed|attended|absent} classes",
  ]},
  { id: "assignments", intent: "assignments", noun: [
    "my {pending|completed|overdue|upcoming|submitted} {homework|assignments|tasks|work}",
    "my {homework|assignment|task} {deadline|due date|submission status|completion status|history}",
    "my {unfinished|incomplete|unsubmitted|outstanding} {chess|class|academy} {work|tasks|homework|assignments}",
  ], sentence: [
    "{show|display|list|check} my {pending|completed|overdue|upcoming|submitted} {homework|assignments|tasks|work}",
    "what {homework|assignments|tasks|classwork} {do i need to submit|do i need to finish|are still pending|are due}",
    "have i {completed|submitted|finished|turned in} {all|my|every} {homework|assignments|tasks}",
    "which {homework|assignments|tasks} are {still pending|not submitted|overdue|left to complete}",
    "can you {show|check|list} my {current|pending|upcoming} assignment {deadlines|tasks|homework}",
  ]},
  { id: "games-report", intent: "games-report", noun: [
    "my chess {history|games|game history|match history|results|stats|statistics|record}",
    "my {chess|game|match} {history|results|statistics|record|summary|activity}",
    "my {overall|total|recent|monthly|weekly} {gameplay|gaming|chess playing} {record|history|stats|results}",
    "my {win|loss|draw} {count|percentage|rate|record|statistics}",
  ], sentence: [
    "{show|display|list|review} my {chess|game|match} {history|results|statistics|record|summary}",
    "how many {games|matches} {have i played|did i play|have i won|did i win|have i lost|did i lose} {today|this week|this month|overall}",
    "what is my {overall|total|recent} {game|match|chess} {record|history|win rate|performance}",
    "can you {show|check|review} my {wins|losses|draws|game results|match statistics}",
    "how many {wins|losses|draws} do i have {overall|this month|this week|so far}",
  ]},
  { id: "vs-bot", intent: "vs-bot", noun: [
    "my {computer|engine|stockfish|bot} {games|matches|results|record|history|statistics}",
    "my {solo|offline|single player|computer} chess {history|record|results|matches}",
    "my {ai|computer|engine} opponent {level|strength|difficulty|results|record}",
  ], sentence: [
    "{show|display|list|review} my {computer|engine|stockfish|bot} {games|matches|results|record|history}",
    "how many {games|matches} did i play {against the computer|against stockfish|against a bot|against the engine}",
    "what is my {win rate|record|performance|result} against {stockfish|the computer|the engine|the bot}",
    "can you {check|show|review} my {solo|offline|single player} chess {games|matches|results}",
    "how many times did i {beat|defeat|lose to} {the computer|stockfish|the bot|the engine}",
  ]},
  { id: "live-match", intent: "live-match", noun: [
    "my {online|multiplayer|pvp|live} {games|matches|results|record|history|statistics}",
    "my {human|friend|student|online} opponent {history|list|record|matches}",
    "my {ranked|unranked|live|online} chess {games|matches|results|record}",
  ], sentence: [
    "{show|display|list|review} my {online|multiplayer|pvp|live} {games|matches|results|record|history}",
    "how many {online|multiplayer|live|pvp} {games|matches} {have i played|did i win|did i lose|did i draw}",
    "who was my {last|latest|previous|most recent} {online|live|multiplayer} opponent",
    "can you {show|check|review} my games against {friends|other students|human players|real opponents}",
    "what is my {online|multiplayer|pvp} {win rate|record|performance|match history}",
  ]},
  { id: "mini-games", intent: "mini-games", noun: [
    "my {mini game|minigame|arcade|practice game} {scores|records|high scores|results|personal bests}",
    "my {game wise|game by game|individual game} {scores|records|high scores|results}",
    "my {best|highest|top} {mini game|arcade|practice game} {score|record|result}",
  ], sentence: [
    "{show|display|list} my {mini game|minigame|arcade|practice game} {scores|records|high scores|results}",
    "what is my {best|highest|top} {score|record|result} in {mini games|arcade games|practice games}",
    "which {mini game|arcade game|practice game} has my {best|highest|top} score",
    "can you {show|check|compare} my {personal bests|high scores|records} across mini games",
  ], perGame: [
    "my {best|highest|top} {score|record|result} for {G}",
    "show my {score|record|result|personal best} on {G}",
    "what is my {score|record|best result} in {G}",
  ]},
  { id: "xp-history", intent: "xp-history", noun: [
    "my {xp|experience|activity} {points|earnings|gains|history|breakdown|total}",
    "my {daily|weekly|monthly|overall|recent} {xp|experience points|earned points} {history|activity|total|gains}",
    "my {points|xp} {earning history|activity log|reward history|collection record}",
  ], sentence: [
    "{show|display|list} my {xp|experience points|earned points} {history|activity|breakdown|total}",
    "how much {xp|experience|points} {did i earn|have i earned|did i gain|have i gained} {today|this week|this month|overall}",
    "where did my {xp|experience points|earned points} {come from|originate|come in}",
    "can you {show|check|review} my {recent|monthly|weekly|daily} xp {gains|earnings|activity}",
    "what is my {current|overall|total} {xp|experience points|earned points} balance",
  ]},
  { id: "puzzle-battle", intent: "puzzle-battle", noun: [
    "my {puzzle battle|puzzle duel|battle mode} {history|results|record|statistics|score}",
    "my {head to head|one on one|1v1} puzzle {battle|duel|competition} {record|history|results}",
    "my {battle|duel} {wins|losses|draws|victories|defeats|score}",
  ], sentence: [
    "{show|display|list} my {puzzle battle|puzzle duel|battle mode} {history|results|record|statistics}",
    "how many {puzzle battles|duels} {did i play|did i win|did i lose|have i completed} {today|this month|overall}",
    "who were my {puzzle battle|puzzle duel} {opponents|previous opponents|recent opponents}",
    "what is my {win rate|record|score|performance} in {puzzle battles|puzzle duels}",
    "can you {show|check|review} my {battle|duel} {wins|losses|draws|results}",
  ]},
  { id: "live-puzzles", intent: "live-puzzles", noun: [
    "my {live classroom|classroom|live class} {puzzle attempts|puzzle activity|solving history|tactics practice}",
    "my {teacher led|coach led|classroom} {puzzle|tactics} {attempts|practice|activity|history}",
    "my {classroom|live lesson|coaching session} {puzzle|tactics} {accuracy|results|performance}",
  ], sentence: [
    "{show|display|list} my {live classroom|classroom|live class} {puzzle attempts|puzzle activity|solving history|tactics practice}",
    "how many {puzzles|tactics questions} {did i solve|did i attempt|did i get right|did i get wrong} {in class|during class|in the live classroom}",
    "which {classroom|live class} {puzzles|tactics questions} did i {solve|miss|get wrong}",
    "can you {show|check|review} my {teacher led|coach led|classroom} puzzle {practice|attempts|results}",
    "what is my {accuracy|performance|solving speed} in classroom puzzles",
  ]},
  { id: "profile-rating", intent: "profile-rating", noun: [
    "my {olympus|chess|skill|current} {rating|elo|level|strength|score|tier}",
    "my {rating|elo|skill level} {breakdown|calculation|details|status|progress|score}",
    "my {current|present|latest|overall} {olympus rating|chess rating|skill rating|rating score|skill level}",
  ], sentence: [
    "{show|display|check} my {olympus|chess|skill} {rating|elo|level|score}",
    "what is my {current|latest|overall} {olympus rating|chess rating|skill level|rating score}",
    "how many {rating|elo|skill} {points|scores} do i have {right now|currently|at present}",
    "can you {show|check|explain} my {current|latest|overall} rating {details|breakdown|level}",
    "what {tier|level|rating} am i {currently|right now|at present} on",
  ]},
  { id: "leaderboard", intent: "leaderboard", noun: [
    "the {academy|olympus|student|chess} {leaderboard|rankings|standings|top students}",
    "the {top|leading|highest ranked|best performing} {academy students|chess students|players|members}",
    "my {place|standing|rank number|position} {among students|in olympus|in the academy rankings}",
  ], sentence: [
    "{show|display|list} the {academy|olympus|student} {leaderboard|rankings|standings|top students}",
    "who is {first|top|number one|ranked highest} on the {academy|olympus|student} leaderboard",
    "where am i {ranked|placed|positioned} in the {academy|olympus|student} rankings",
    "can you {show|check|display} my {rank|ranking|position|standing} among students",
    "who are the {top|leading|highest ranked|best performing} students in olympus",
  ]},
  { id: "progress-report", intent: "progress-report", noun: [
    "my {chess|learning|training|overall} {progress|improvement|growth|development|performance}",
    "my {learning|training|chess} {milestones|development|growth|improvement|progress summary}",
    "my {recent|monthly|overall|long term} {improvement|growth|development|learning progress}",
  ], sentence: [
    "{show|display|review} my {chess|learning|training|overall} {progress|improvement|growth|development|performance}",
    "how am i {progressing|improving|performing|developing} {in chess|with my training|at the academy|overall}",
    "what {progress|improvement|growth|development} have i made {recently|this month|so far|overall}",
    "can you {review|summarize|show} my {learning|chess|academy} {journey|development|progress}",
    "am i getting {better|stronger|more consistent} at chess {recently|over time|this month}",
  ]},
  { id: "puzzle-report", intent: "puzzle-report", noun: [
    "my {puzzle|tactics|solving} {accuracy|performance|history|statistics|results|record}",
    "my {puzzle|tactics} {success rate|completion rate|attempt log|solving speed|accuracy rate}",
    "my {daily|weekly|monthly|overall} puzzle {practice|solving|accuracy} {summary|report|history|stats}",
  ], sentence: [
    "{show|display|review} my {puzzle|tactics|solving} {accuracy|performance|history|statistics|results}",
    "how many {puzzles|tactics questions} {have i solved|did i solve|have i attempted|did i attempt} {today|this week|this month|overall}",
    "what percentage of {puzzles|tactics questions} have i {solved|answered correctly|completed successfully}",
    "can you {check|show|review} my {puzzle|tactics} {accuracy|attempts|results|solving history}",
    "how many {correct|incorrect|wrong} puzzle answers do i have {overall|this month|this week}",
  ]},
  { id: "announcements", intent: "announcements", noun: [
    "the {latest|new|recent|important} {academy|olympus|coach|teacher} {notices|announcements|messages|updates}",
    "my {academy|class|coach|teacher} {notices|messages|updates|announcements}",
    "the {class|batch|academy} {notice board|message board|bulletin board|updates}",
  ], sentence: [
    "{show|display|check} the {latest|new|recent|important} {academy|olympus|coach|teacher} {notices|announcements|messages|updates}",
    "has the {academy|coach|teacher} {posted|sent|shared|announced} any {new|recent|important} {message|notice|update|announcement}",
    "what {notices|messages|updates|announcements} have been {posted|shared|sent|published} {recently|today|this week}",
    "can you {show|check|open} the {latest|new|recent} {class|batch|academy} notice",
    "did olympus {send|share|post|publish} any {new|important|recent} student update",
  ]}
);


// ---------------------------------------------------------------------
// Pattern expansion (runs once at load)
// ---------------------------------------------------------------------
function expandPattern(pattern) {
  let out = [""];
  for (const part of pattern.split(/(\{[^}]*\})/)) {
    if (part.startsWith("{") && part.endsWith("}")) {
      const options = part.slice(1, -1).split("|");
      const next = [];
      for (const prefix of out) for (const option of options) next.push(prefix + option);
      out = next;
    } else {
      out = out.map(prefix => prefix + part);
    }
  }
  return out.map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Exact word-for-word spelling/short-form fixes. Applied AFTER the shared
// normalizeForUnderstanding() step, so they only add safety. No fuzzy matching.
const WORD_FIXES = Object.freeze({
  attendence: "attendance", atendance: "attendance", attendace: "attendance", attandance: "attendance",
  attendnce: "attendance", attndance: "attendance", attendencee: "attendance",
  assigment: "assignment", asignment: "assignment", assignement: "assignment", assignmnt: "assignment",
  assigments: "assignments", asignments: "assignments", assignements: "assignments",
  asgnment: "assignment", asgnmnt: "assignment", assignemnt: "assignment", assignemnts: "assignments",
  payement: "payment", paymnt: "payment", peyment: "payment", payements: "payments", paymnts: "payments",
  tution: "tuition", tuision: "tuition", tuiton: "tuition",
  schedual: "schedule", shedule: "schedule", scedule: "schedule", schedul: "schedule",
  timming: "timing", timeing: "timing", timmings: "timings", timetabel: "timetable", timetble: "timetable",
  achivement: "achievement", acheivement: "achievement", achivements: "achievements",
  progess: "progress", progres: "progress", prograss: "progress",
  statistcs: "statistics", statistic: "statistics", stastics: "statistics",
  reciept: "receipt", receit: "receipt", reciepts: "receipts",
  leaderbord: "leaderboard", leaderbaord: "leaderboard", leadrboard: "leaderboard",
  annoucement: "announcement", anouncement: "announcement", announcment: "announcement",
  annoucements: "announcements", anouncements: "announcements", announcments: "announcements",
  absense: "absence", absnce: "absence", clases: "classes", puzle: "puzzle", puzel: "puzzle",
  puzzel: "puzzle", puzles: "puzzles", batchs: "batches",
  pls: "please", plz: "please", plss: "please", u: "you", ur: "your", wat: "what", wats: "whats",
  hw: "how", ive: "i have", didnt: "did not", dont: "do not",
  homewrk: "homework", homwork: "homework", calender: "calendar", calandar: "calendar",
  puzzels: "puzzles", puzlles: "puzzles", battel: "battle", batle: "battle",
  minigame: "mini game", minigames: "mini games", rankng: "ranking",
  announcemnt: "announcement", announcments: "announcements"
});

// "i have" / "did not" expansions are handled below for phrases that contain them.
function tokenize(text) {
  const out = [];
  for (const word of normalizeText(text).split(" ")) {
    if (!word) continue;
    const fixed = WORD_FIXES[word] || word;
    for (const piece of fixed.split(" ")) out.push(piece);
  }
  return out;
}

// ---------------------------------------------------------------------
// Phrase index
// ---------------------------------------------------------------------
let INDEX = null;
let STATS = null;
let MAX_GRAM = 1;

function buildIndex() {
  const index = new Map();
  const perCategory = {};
  let totalExpanded = 0;
  let duplicates = 0;
  let conflicts = 0;

  for (const cat of VOCAB_SOURCE) {
    const phrases = new Set();
    for (const p of cat.noun || []) expandPattern(p).forEach(s => phrases.add(s));
    for (const p of cat.sentence || []) expandPattern(p).forEach(s => phrases.add(s));
    for (const p of cat.perGame || []) {
      for (const game of GAME_NAMES_FOR_VOCAB) expandPattern(p.replaceAll("{G}", game)).forEach(s => phrases.add(s));
    }
    let kept = 0;
    for (const raw of phrases) {
      totalExpanded++;
      // Phrases are stored in the same normalised form used for matching.
      const tokens = tokenize(raw);
      if (tokens.length < 2) continue; // single words are far too broad
      const key = tokens.join(" ");
      const existing = index.get(key);
      if (existing === undefined) {
        index.set(key, cat.intent);
        kept++;
        if (tokens.length > MAX_GRAM) MAX_GRAM = tokens.length;
      } else if (existing === cat.intent) {
        duplicates++;
      } else {
        conflicts++; // first category wins; reported in stats
      }
    }
    perCategory[cat.id] = (perCategory[cat.id] || 0) + kept;
  }
  STATS = Object.freeze({
    uniquePhrases: index.size,
    perCategory: Object.freeze(perCategory),
    expandedBeforeDedupe: totalExpanded,
    duplicatesWithinIntent: duplicates,
    crossIntentConflicts: conflicts,
    longestPhraseWords: MAX_GRAM
  });
  return index;
}

function getIndex() {
  if (!INDEX) INDEX = buildIndex();
  return INDEX;
}

export function getOlympusVocabularyStats() {
  getIndex();
  return STATS;
}

/** Exposed for tests/diagnostics only. Returns a copy of the phrase->intent map. */
export function getOlympusVocabularyEntries() {
  return new Map(getIndex());
}

// ---------------------------------------------------------------------
// Matching: longest-first, non-overlapping, word-boundary n-grams
// ---------------------------------------------------------------------
function findMatches(tokens) {
  const index = getIndex();
  const found = [];
  const top = Math.min(MAX_GRAM, tokens.length);
  for (let n = top; n >= 2; n--) {
    for (let start = 0; start + n <= tokens.length; start++) {
      const intent = index.get(tokens.slice(start, start + n).join(" "));
      if (intent) found.push({ start, length: n, intent });
    }
  }
  // Longest phrase wins; on a tie a specific intent beats a generic umbrella intent
  // (e.g. "my games" must not swallow "my games against the computer").
  const generic = i => (GENERIC_INTENTS.has(i) ? 1 : 0);
  found.sort((a, b) => b.length - a.length || generic(a.intent) - generic(b.intent) || a.start - b.start);
  const used = new Array(tokens.length).fill(false);
  const accepted = [];
  for (const m of found) {
    let free = true;
    for (let i = m.start; i < m.start + m.length; i++) if (used[i]) { free = false; break; }
    if (!free) continue;
    for (let i = m.start; i < m.start + m.length; i++) used[i] = true;
    accepted.push(m);
  }
  // A generic umbrella match ("my games", "my performance") must not hide a more
  // specific qualifier that sits right next to it ("... against the computer").
  const overlaps = (a, b) => a.start < b.start + b.length && b.start < a.start + a.length;
  for (let i = 0; i < accepted.length; i++) {
    const m = accepted[i];
    if (!GENERIC_INTENTS.has(m.intent)) continue;
    let best = null;
    for (const c of found) {
      if (GENERIC_INTENTS.has(c.intent) || !overlaps(c, m)) continue;
      const extendsBeyond = c.start < m.start || c.start + c.length > m.start + m.length;
      if (extendsBeyond && (!best || c.length > best.length)) best = c;
    }
    if (best) {
      for (let j = accepted.length - 1; j >= 0; j--) if (overlaps(accepted[j], best)) accepted.splice(j, 1);
      accepted.push(best);
      i = -1; // restart scan after the list changed
    }
  }
  return accepted.sort((a, b) => a.start - b.start);
}

const GENERIC_INTENTS = new Set(["games-report", "profile-rating", "progress-report", "student-report"]);
const SPECIFIC_GAME_INTENTS = ["vs-bot", "live-match", "mini-games", "puzzle-battle", "live-puzzles", "puzzle-report"];

/**
 * Returns { intents: string[], longest: number } or null.
 * `texts` are already-normalised question strings (e.g. after understanding).
 */
export function matchOlympusVocabulary(...texts) {
  let best = null;
  for (const text of texts) {
    if (!text) continue;
    const matches = findMatches(tokenize(text));
    if (!matches.length) continue;
    const covered = matches.reduce((sum, m) => sum + m.length, 0);
    if (!best || covered > best.covered) best = { matches, covered };
  }
  if (!best) return null;

  let intents = [];
  for (const m of best.matches) if (!intents.includes(m.intent)) intents.push(m.intent);
  const longest = Math.max(...best.matches.map(m => m.length));

  // Same precedence the original classifier applies.
  if (intents.includes("student-report")) intents = ["student-report"];
  else if (intents.includes("progress-report")) intents = ["progress-report"];
  else if (intents.includes("games-report") && intents.some(i => SPECIFIC_GAME_INTENTS.includes(i) && i !== "puzzle-report")) {
    intents = intents.filter(i => i !== "games-report");
  } else if (intents.includes("puzzle-report") && intents.length > 1) {
    intents = ["puzzle-report"];
  }
  return { intents, longest };
}

/**
 * Combine the original 4.2.1 classifier result with the vocabulary result.
 * - Original result is returned unchanged when the vocabulary has no opinion.
 * - Vocabulary result is used when the original classifier found nothing.
 * - When both exist and agree, the original result is returned unchanged.
 * - When they differ, a long (>=3 word) vocabulary phrase is treated as the
 *   more specific signal for single-intent answers; compound questions keep
 *   every intent the original classifier already found.
 */
export function resolveIntentsWithVocabulary({ rawText, understoodText, legacy }) {
  const hit = matchOlympusVocabulary(understoodText, rawText);
  if (!hit) return legacy;
  if (!legacy || !legacy.length) return hit.intents;

  // A question that names several subjects ("A and B", "A, B", "A plus B") keeps
  // every intent the original classifier found. A question with no such joiner
  // and one long, specific vocabulary phrase is a single-subject question.
  const compound = /,|&|\b(?:and|also|plus|along with|as well as)\b/.test(String(rawText) + " " + String(understoodText));
  if (!compound && hit.intents.length === 1 && hit.longest >= 3 && !legacy.includes("capabilities")) {
    return hit.intents;
  }

  const same = legacy.length === hit.intents.length && legacy.every(i => hit.intents.includes(i));
  if (same) return legacy;

  if (legacy.length === 1 && hit.intents.length === 1) {
    return hit.longest >= 3 ? hit.intents : legacy;
  }
  if (legacy.length > 1) {
    const merged = [...legacy];
    for (const i of hit.intents) if (!merged.includes(i)) merged.push(i);
    return merged;
  }
  // legacy single, vocabulary multi: compound question the vocabulary split.
  return hit.longest >= 3 ? hit.intents : legacy;
}
