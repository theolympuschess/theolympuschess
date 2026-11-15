/* =====================================================================
   OLYMPUS AI 4.2.2 — NATURAL-LANGUAGE VOCABULARY LAYER (ai-data-vocabulary.js)
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
  assigment: "assignment", asignment: "assignment", assignement: "assignment", assignmnt: "assignment",
  assigments: "assignments", asignments: "assignments", assignements: "assignments",
  payement: "payment", paymnt: "payment", peyment: "payment", payements: "payments", paymnts: "payments",
  tution: "tuition", tuision: "tuition", tuiton: "tuition",
  schedual: "schedule", shedule: "schedule", scedule: "schedule", schedul: "schedule",
  timming: "timing", timeing: "timing", timmings: "timings",
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
  hw: "how", ive: "i have", didnt: "did not", dont: "do not"
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
    perCategory[cat.id] = kept;
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
