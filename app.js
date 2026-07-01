const {
  useState,
  useRef,
  useEffect,
  useCallback
} = React;
const APP_VERSION = "v13";
const KEY = "numi-save-v1";
const store = {
  get(def) {
    try {
      const v = localStorage.getItem(KEY);
      return v == null ? def : JSON.parse(v);
    } catch (e) {
      return def;
    }
  },
  set(val) {
    try {
      localStorage.setItem(KEY, JSON.stringify(val));
    } catch (e) {}
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  }
};
const defaultSave = () => ({
  v: 1,
  stars: 0,
  stages: {},
  last: null,
  best: 0,
  history: [],
  settings: {
    minutes: 5,
    sound: true,
    voice: false
  }
});
function useSound(onRef) {
  const ctxRef = useRef(null);
  const ensure = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };
  const tone = (f, s, d, t = "triangle", v = 0.16) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = t;
    o.frequency.setValueAtTime(f, ctx.currentTime + s);
    g.gain.setValueAtTime(0.0001, ctx.currentTime + s);
    g.gain.exponentialRampToValueAtTime(v, ctx.currentTime + s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + s + d);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime + s);
    o.stop(ctx.currentTime + s + d + 0.05);
  };
  return useCallback(kind => {
    if (!onRef.current) return;
    const ctx = ensure();
    if (!ctx) return;
    if (kind === "right") {
      tone(523, 0, .15);
      tone(659, .08, .15);
      tone(784, .16, .24);
    } else if (kind === "retry") {
      tone(330, 0, .18, "sine", .13);
      tone(247, .12, .22, "sine", .11);
    } else if (kind === "unlock") {
      tone(523, 0, .13);
      tone(698, .1, .13);
      tone(880, .2, .13);
      tone(1046, .3, .32);
    } else if (kind === "tap") {
      tone(440, 0, .05, "sine", .07);
    }
  }, [onRef]);
}
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pickFn = arr => arr[Math.floor(Math.random() * arr.length)];
const countTrue = a => a.filter(Boolean).length;
function makeOptions(answer, max) {
  const set = new Set([answer]);
  const near = shuffle([answer - 1, answer + 1, answer - 2, answer + 2, answer + 10, answer - 10, answer + 3]);
  for (const c of near) {
    if (set.size >= 4) break;
    if (c >= 0 && c <= max && c !== answer) set.add(c);
  }
  while (set.size < 4) {
    const c = rand(0, max);
    if (c !== answer) set.add(c);
  }
  return shuffle([...set]);
}
const gP10 = () => {
  const a = rand(1, 9),
    b = rand(1, 10 - a);
  return {
    a,
    b,
    op: "+",
    answer: a + b
  };
};
const gM10 = () => {
  const a = rand(2, 10),
    b = rand(1, a - 1);
  return {
    a,
    b,
    op: "-",
    answer: a - b
  };
};
const gP20 = () => {
  const a = rand(10, 17),
    oa = a % 10,
    b = rand(1, 9 - oa);
  return {
    a,
    b,
    op: "+",
    answer: a + b
  };
};
const gM20 = () => {
  const a = rand(11, 19),
    oa = a % 10,
    b = rand(1, oa);
  return {
    a,
    b,
    op: "-",
    answer: a - b
  };
};
const gP20Z = () => {
  let a, b;
  do {
    a = rand(2, 9);
    b = rand(2, 9);
  } while (a + b < 11 || a + b > 18);
  return {
    a,
    b,
    op: "+",
    answer: a + b
  };
};
const gM20Z = () => {
  let a, b, r;
  do {
    r = rand(1, 9);
    b = rand(2, 9);
    a = r + b;
  } while (a < 11 || a > 20);
  return {
    a,
    b,
    op: "-",
    answer: a - b
  };
};
const STAGES = [{
  id: "p10",
  n: 1,
  name: "Plus bis 10",
  icon: "➕",
  max: 10,
  gen: gP10
}, {
  id: "m10",
  n: 2,
  name: "Minus bis 10",
  icon: "➖",
  max: 10,
  gen: gM10
}, {
  id: "pm10",
  n: 3,
  name: "Plus & Minus bis 10",
  icon: "🔀",
  max: 10,
  gen: () => pickFn([gP10, gM10])()
}, {
  id: "p20",
  n: 4,
  name: "Plus bis 20 (ohne Übergang)",
  icon: "➕",
  max: 20,
  gen: gP20
}, {
  id: "m20",
  n: 5,
  name: "Minus bis 20 (ohne Übergang)",
  icon: "➖",
  max: 20,
  gen: gM20
}, {
  id: "p20z",
  n: 6,
  name: "Plus über den Zehner",
  icon: "➕",
  max: 20,
  gen: gP20Z
}, {
  id: "m20z",
  n: 7,
  name: "Minus über den Zehner",
  icon: "➖",
  max: 20,
  gen: gM20Z
}, {
  id: "pm20z",
  n: 8,
  name: "Plus & Minus mit Übergang",
  icon: "🔀",
  max: 20,
  gen: () => pickFn([gP20Z, gM20Z])()
}, {
  id: "pm20",
  n: 9,
  name: "Alles gemischt bis 20",
  icon: "🎲",
  max: 20,
  gen: () => pickFn([gP10, gM10, gP20, gM20, gP20Z, gM20Z])()
}];
const stageById = id => STAGES.find(s => s.id === id);
function fmtDuration(sec) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
function fmtDay(ts) {
  const d = new Date(ts);
  const now = new Date();
  const midnight = t => new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  const days = Math.round((midnight(now) - midnight(d)) / 86400000);
  if (days === 0) return "Heute";
  if (days === 1) return "Gestern";
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}
const makeProblem = stage => {
  const base = stage.gen();
  return {
    ...base,
    max: stage.max,
    options: makeOptions(base.answer, stage.max)
  };
};
function getHint(p) {
  const { a, b, op } = p;
  if (op === "+") {
    // 1) Verliebte Zahlen
    if (a + b === 10) return `Verliebte Zahlen! ${a} und ${b} ergeben zusammen die 10.`;
    // 2) Doppel
    if (a === b) return `Das ist ein Doppel: ${a} + ${a}.`;
    // 3) Zehner vollmachen – nur bei echtem Einer-Übergang (beide < 10), Ergebnis NICHT verraten
    if (a + b > 10 && a < 10 && b < 10) {
      const big = Math.max(a, b), small = Math.min(a, b);
      const toTen = 10 - big;        // was der Großen zur 10 fehlt
      const rest = small - toTen;    // Rest aus der kleinen Zahl
      return `Mach erst die 10 voll: ${big} braucht noch ${toTen}. Zerlege die ${small} in ${toTen} und ${rest}. Dann 10 und noch ${rest}.`;
    }
    // 4) Tausch-Trick
    if (b > a) return `Tausch-Trick: ${b} + ${a} ist genauso viel. Zähl ab ${b} noch ${a} weiter.`;
    // 5) Weiterzählen
    return `Zähl ab ${a} noch ${b} weiter.`;
  } else {
    // 1) Halbieren / Doppel
    if (a === 2 * b) return `Denk ans Doppel: ${b} + ${b} = ${a}.`;
    // 2) Ergänzen – nur bei kleiner Differenz (Ergebnis <= 3)
    if (a - b <= 3) return `Ergänzen: Zähl von ${b} hinauf bis ${a}. Wie viele Schritte sind das?`;
    // 3) Erst zur 10 – Ergebnis NICHT verraten
    if (a > 10 && a % 10 < b) {
      const down = a - 10, rest = b - down;
      return `Geh erst zur 10: ${a} − ${down} = 10. Dann noch ${rest} weniger.`;
    }
    // 4) Wegnehmen
    return `Nimm ${b} von ${a} weg.`;
  }
}
const MIN_TOTAL = 25,
  WINDOW = 20,
  NEED = 16,
  GOLD_STREAK = 10;
const blankStat = () => ({
  att: 0,
  ok: 0,
  recent: [],
  streakBest: 0,
  mastered: false,
  gold: false
});
const stat = (save, id) => save.stages[id] || blankStat();
function updateStageStat(st, firstTry, newStreak) {
  const att = st.att + 1;
  const ok = st.ok + (firstTry ? 1 : 0);
  const recent = [...st.recent, firstTry].slice(-WINDOW);
  const streakBest = Math.max(st.streakBest, newStreak);
  const mastered = st.mastered || att >= MIN_TOTAL && countTrue(recent) >= NEED;
  const gold = st.gold || streakBest >= GOLD_STREAK;
  return {
    att,
    ok,
    recent,
    streakBest,
    mastered,
    gold
  };
}
function computeUnlocked(stages) {
  const u = [];
  STAGES.forEach((s, i) => {
    if (stages[s.id] && stages[s.id].mastered) u.push(i);
  });
  const m = id => stages[id] && stages[id].mastered;
  if (m("p10") && m("m10") && m("pm10")) u.push(9);
  if (m("p20") && m("m20")) u.push(10);
  if (STAGES.every(s => stages[s.id] && stages[s.id].mastered)) u.push(11);
  return u;
}
function recommendedStage(stages) {
  const first = STAGES.find(s => !(stages[s.id] && stages[s.id].mastered));
  return first ? first.id : "pm20";
}
const CREATURES = [{
  name: "Blubbi",
  c1: "#FF8FAB",
  c2: "#FF5C8A",
  horn: false,
  eyes: 2
}, {
  name: "Wuschel",
  c1: "#7C5CDC",
  c2: "#5B3FB8",
  horn: true,
  eyes: 2
}, {
  name: "Kringel",
  c1: "#4ECDC4",
  c2: "#2FA39B",
  horn: false,
  eyes: 3
}, {
  name: "Pompon",
  c1: "#FFC93C",
  c2: "#F2A900",
  horn: true,
  eyes: 2
}, {
  name: "Tapsi",
  c1: "#5AB2FF",
  c2: "#2E86DE",
  horn: false,
  eyes: 2
}, {
  name: "Hops",
  c1: "#A0E548",
  c2: "#6FB52B",
  horn: true,
  eyes: 3
}, {
  name: "Glibsi",
  c1: "#FF6B6B",
  c2: "#E04848",
  horn: false,
  eyes: 2
}, {
  name: "Funki",
  c1: "#C77DFF",
  c2: "#9B4DEB",
  horn: true,
  eyes: 2
}, {
  name: "Knuddel",
  c1: "#FFB07C",
  c2: "#F08A4B",
  horn: false,
  eyes: 3
}, {
  name: "Sternchen",
  c1: "#FFD93D",
  c2: "#F2A900",
  horn: true,
  eyes: 2
}, {
  name: "Mümmel",
  c1: "#56D9C0",
  c2: "#26B49A",
  horn: true,
  eyes: 2
}, {
  name: "Schimmer",
  c1: "#9B8CFF",
  c2: "#6C5CE7",
  horn: false,
  eyes: 3
}];
function Creature({
  c,
  size = 96,
  locked = false,
  bob = false
}) {
  if (locked) return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    "aria-hidden": true
  }, React.createElement("circle", {
    cx: "50",
    cy: "55",
    r: "34",
    fill: "#E7E2F2"
  }), React.createElement("text", {
    x: "50",
    y: "68",
    textAnchor: "middle",
    fontSize: "34",
    fill: "#C3B9DC"
  }, "?"));
  return React.createElement("svg", {
    className: bob ? "zh-bob" : "",
    width: size,
    height: size,
    viewBox: "0 0 100 100"
  }, c.horn && React.createElement(React.Fragment, null, React.createElement("path", {
    d: "M34 26 L40 8 L46 26 Z",
    fill: c.c2
  }), React.createElement("path", {
    d: "M54 26 L60 8 L66 26 Z",
    fill: c.c2
  })), React.createElement("ellipse", {
    cx: "50",
    cy: "58",
    rx: "36",
    ry: "34",
    fill: c.c1
  }), React.createElement("ellipse", {
    cx: "50",
    cy: "72",
    rx: "30",
    ry: "22",
    fill: c.c2,
    opacity: "0.35"
  }), c.eyes === 3 ? React.createElement(React.Fragment, null, React.createElement("circle", {
    cx: "38",
    cy: "50",
    r: "8",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "38",
    cy: "51",
    r: "4",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "50",
    cy: "46",
    r: "8",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "50",
    cy: "47",
    r: "4",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "62",
    cy: "50",
    r: "8",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "62",
    cy: "51",
    r: "4",
    fill: "#2A2342"
  })) : React.createElement(React.Fragment, null, React.createElement("circle", {
    cx: "40",
    cy: "50",
    r: "9",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "41",
    cy: "51",
    r: "4.5",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "60",
    cy: "50",
    r: "9",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "61",
    cy: "51",
    r: "4.5",
    fill: "#2A2342"
  })), React.createElement("path", {
    d: "M42 70 Q50 78 58 70",
    stroke: "#2A2342",
    strokeWidth: "3",
    fill: "none",
    strokeLinecap: "round"
  }));
}
function Mascot({
  size = 110,
  mood = "happy"
}) {
  return React.createElement("svg", {
    className: "zh-bob",
    width: size,
    height: size,
    viewBox: "0 0 120 120"
  }, React.createElement("circle", {
    cx: "60",
    cy: "62",
    r: "42",
    fill: "#FFC93C"
  }), React.createElement("circle", {
    cx: "60",
    cy: "74",
    r: "26",
    fill: "#FFE08A"
  }), React.createElement("circle", {
    cx: "47",
    cy: "54",
    r: "11",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "49",
    cy: "56",
    r: "5.5",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "73",
    cy: "54",
    r: "11",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "75",
    cy: "56",
    r: "5.5",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "38",
    cy: "70",
    r: "6",
    fill: "#FF8FAB",
    opacity: "0.7"
  }), React.createElement("circle", {
    cx: "82",
    cy: "70",
    r: "6",
    fill: "#FF8FAB",
    opacity: "0.7"
  }), mood === "right" ? React.createElement("path", {
    d: "M48 72 Q60 88 72 72 Q60 80 48 72 Z",
    fill: "#E04848"
  }) : React.createElement("path", {
    d: "M50 74 Q60 84 70 74",
    stroke: "#2A2342",
    strokeWidth: "3.5",
    fill: "none",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M60 8 l3.4 7 7.6 1-5.5 5.4 1.3 7.6L60 32l-6.8 4 1.3-7.6L49 23l7.6-1z",
    fill: "#fff",
    stroke: "#F2A900",
    strokeWidth: "1.5"
  }));
}
function TwentyFrame({
  p,
  reveal
}) {
  const {
    a,
    b,
    op
  } = p;
  const love = op === "+" && a + b === 10;
  const cells = [];
  for (let i = 0; i < 20; i++) {
    let s = "empty";
    if (op === "+") {
      if (i < a) s = "a";else if (i < a + b) s = !love && a < 10 && i < 10 && a + b >= 10 ? "partner" : "b";
    } else {
      if (i < a) s = i >= a - b ? "removed" : "a";
    }
    cells.push(s);
  }
  const rows = [cells.slice(0, 10), cells.slice(10, 20)];
  return React.createElement("div", {
    className: "zh-frame",
    "aria-hidden": !reveal
  }, rows.map((row, r) => React.createElement("div", {
    className: "zh-row",
    key: r
  }, row.map((s, c) => {
    const i = r * 10 + c;
    return React.createElement("div", {
      key: i,
      className: `zh-cell${c === 5 ? " mid" : ""}`
    }, reveal && s !== "empty" && React.createElement("span", {
      className: `zh-dot zh-dot-${s}${love && s === "a" ? " love-a" : ""}${love && s === "b" ? " love-b" : ""}`,
      style: {
        animationDelay: `${i * 40}ms`
      }
    }, s === "removed" ? "✕" : ""));
  }))));
}
function Confetti({
  show
}) {
  if (!show) return null;
  const cols = ["#FFC93C", "#FF6B6B", "#4ECDC4", "#7C5CDC", "#5AB2FF", "#A0E548"];
  return React.createElement("div", {
    className: "zh-confetti"
  }, Array.from({
    length: 26
  }).map((_, i) => React.createElement("span", {
    key: i,
    style: {
      left: `${rand(2, 96)}%`,
      background: cols[i % cols.length],
      animationDelay: `${rand(0, 300)}ms`,
      transform: `rotate(${rand(0, 360)}deg)`
    }
  })));
}
function App() {
  const [save, setSaveState] = useState(() => store.get(defaultSave()));
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  const setSave = useCallback(upd => {
    setSaveState(prev => {
      const next = typeof upd === "function" ? upd(prev) : upd;
      store.set(next);
      return next;
    });
  }, []);
  const [screen, setScreen] = useState("home");
  const [problem, setProblem] = useState(null);
  const [status, setStatus] = useState("idle");
  const [wrong, setWrong] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakMsg, setStreakMsg] = useState(null);
  const [helpUsed, setHelpUsed] = useState(false);
  const [report, setReport] = useState(null);
  const [resetAsk, setResetAsk] = useState(false);
  const soundOn = useRef(save.settings.sound);
  const lockRef = useRef(false);
  const sessionRef = useRef({
    stageId: "p10",
    results: []
  });
  const stageIdRef = useRef("p10");
  const unlockedAtStart = useRef([]);
  const timeUpRef = useRef(false);
  const play = useSound(soundOn);
  useEffect(() => {
    soundOn.current = save.settings.sound;
  }, [save.settings.sound]);
  const minutes = save.settings.minutes;
  const timeUp = minutes > 0 && elapsed >= minutes * 60;
  useEffect(() => {
    timeUpRef.current = timeUp;
  }, [timeUp]);
  useEffect(() => {
    if (screen !== "play" || minutes === 0) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, minutes]);
  const newProblem = useCallback(() => {
    lockRef.current = false;
    setProblem(makeProblem(stageById(stageIdRef.current)));
    setStatus("idle");
    setWrong([]);
    setShowHelp(false);
    setHelpUsed(false);
  }, []);
  const startSession = stageId => {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
    stageIdRef.current = stageId;
    sessionRef.current = {
      stageId,
      results: [],
      startTs: Date.now()
    };
    unlockedAtStart.current = computeUnlocked(saveRef.current.stages);
    setElapsed(0);
    setDoneCount(0);
    setStreak(0);
    newProblem();
    setScreen("play");
  };
  const speak = text => {
    if (!save.settings.voice) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      u.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) {}
  };
  const finishSession = useCallback(() => {
    const sess = sessionRef.current;
    const done = sess.results.length;
    const correct = sess.results.filter(c => c === "clean").length;
    const cur = saveRef.current;
    const unlockedNow = computeUnlocked(cur.stages);
    const newFriends = unlockedNow.filter(i => !unlockedAtStart.current.includes(i));
    const prevDone = cur.last ? cur.last.done : null;
    const durationSec = Math.round((Date.now() - (sess.startTs || Date.now())) / 1000);
    setSave(prev => ({
      ...prev,
      last: {
        done,
        correct
      },
      best: Math.max(prev.best, done),
      history: done > 0 ? [{
        ts: Date.now(),
        stageId: sess.stageId,
        done,
        correct,
        durationSec
      }, ...(prev.history || [])].slice(0, 10) : (prev.history || [])
    }));
    setReport({
      done,
      correct,
      prevDone,
      newFriends,
      stageId: sess.stageId,
      results: sess.results
    });
    setScreen("report");
    if (newFriends.length) setTimeout(() => play("unlock"), 500);
    const fr = newFriends.length ? ` Du hast einen neuen Freund: ${CREATURES[newFriends[0]].name}.` : "";
    speak(`Du hast ${done} Aufgaben geschafft, ${correct} gleich richtig.${fr}`);
  }, [setSave]);
  const advance = useCallback(() => {
    if (timeUpRef.current) finishSession();else newProblem();
  }, [finishSession, newProblem]);
  const handlePick = opt => {
    if (status === "right" || lockRef.current) return;
    if (opt === problem.answer) {
      lockRef.current = true;
      const category = helpUsed ? "help" : (wrong.length === 0 ? "clean" : "retry");
      const clean = category === "clean";
      const newStreak = clean ? streak + 1 : 0;
      setStreak(newStreak);
      play("right");
      setStatus("right");
      setConfetti(true);
      sessionRef.current.results.push(category);
      setDoneCount(d => d + 1);
      const sid = stageIdRef.current;
      const prevSt = saveRef.current.stages[sid] || blankStat();
      const newSt = updateStageStat(prevSt, clean, newStreak);
      let bonus = 0;
      if (clean && newStreak > 0 && newStreak % 5 === 0) {
        bonus = 5;
        setStreakMsg(`🔥 ${newStreak} in Folge! +5 ⭐`);
        setTimeout(() => setStreakMsg(null), 1800);
      }
      setSave(prev => ({
        ...prev,
        stars: prev.stars + 1 + bonus,
        stages: {
          ...prev.stages,
          [sid]: newSt
        }
      }));
      setTimeout(() => setConfetti(false), 1100);
      setTimeout(advance, 1350);
    } else {
      play("retry");
      setShowHelp(true);
      setStreak(0);
      setWrong(w => w.includes(opt) ? w : [...w, opt]);
    }
  };
  const toggle = field => setSave(prev => ({
    ...prev,
    settings: {
      ...prev.settings,
      [field]: !prev.settings[field]
    }
  }));
  const setMinutes = m => setSave(prev => ({
    ...prev,
    settings: {
      ...prev.settings,
      minutes: m
    }
  }));
  const doReset = () => {
    store.clear();
    const d = defaultSave();
    setSaveState(d);
    saveRef.current = d;
    setResetAsk(false);
    setScreen("home");
  };
  const unlocked = computeUnlocked(save.stages);
  const recId = recommendedStage(save.stages);
  const recStage = stageById(recId);
  const Header = ({
    showGear = true
  }) => React.createElement("header", {
    className: "zh-header"
  }, React.createElement("div", {
    className: "zh-logo"
  }, "\u2B50 ", save.stars), React.createElement("div", {
    className: "zh-hright"
  }, React.createElement("button", {
    className: "zh-icbtn",
    onClick: () => toggle("sound"),
    "aria-label": "Ton"
  }, save.settings.sound ? "🔊" : "🔇"), showGear && React.createElement("button", {
    className: "zh-icbtn",
    onClick: () => {
      play("tap");
      setScreen("adult");
    },
    "aria-label": "Einstellungen"
  }, "\u2699\uFE0F")));
  if (screen === "home") {
    return React.createElement("div", {
      className: "zh-root"
    }, React.createElement(Header, null), React.createElement("main", {
      className: "zh-main"
    }, React.createElement("div", {
      className: "zh-hero"
    }, React.createElement(Mascot, {
      size: 120
    }), React.createElement("h1", {
      className: "zh-title"
    }, "Numi"), React.createElement("p", {
      className: "zh-tag"
    }, "\xDCbe Plus und Minus bis 20 \u2013 in deinem Tempo.")), React.createElement("button", {
      className: "zh-rec",
      onClick: () => {
        play("tap");
        startSession(recId);
      }
    }, React.createElement("span", {
      className: "zh-recicon"
    }, recStage.icon), React.createElement("span", {
      className: "zh-rectext"
    }, React.createElement("small", null, "Weiter geht's"), React.createElement("strong", null, recStage.name)), React.createElement("span", {
      className: "zh-recgo"
    }, "Los!")), React.createElement("p", {
      className: "zh-section"
    }, "Alle Stufen"), React.createElement("div", {
      className: "zh-stages"
    }, STAGES.map(s => {
      const st = stat(save, s.id);
      const badge = st.gold ? "⭐" : st.mastered ? "✓" : "";
      return React.createElement("button", {
        key: s.id,
        className: `zh-stile${st.gold ? " gold" : st.mastered ? " done" : ""}`,
        onClick: () => {
          play("tap");
          startSession(s.id);
        }
      }, React.createElement("span", {
        className: "zh-snum"
      }, s.n), React.createElement("span", {
        className: "zh-sname"
      }, s.name), badge && React.createElement("span", {
        className: "zh-sbadge"
      }, badge));
    })), React.createElement("button", {
      className: "zh-collectbtn",
      onClick: () => {
        play("tap");
        setScreen("collection");
      }
    }, "\uD83C\uDFC6 Meine Freunde (", unlocked.length, "/", CREATURES.length, ")"), React.createElement(Styles, null)));
  }
  if (screen === "collection") {
    const labels = [...STAGES.map(s => `Stufe ${s.n}`), "Alles bis 10", "Ohne Übergang", "Heft komplett"];
    return React.createElement("div", {
      className: "zh-root"
    }, React.createElement(Header, {
      showGear: false
    }), React.createElement("main", {
      className: "zh-main"
    }, React.createElement("button", {
      className: "zh-back",
      onClick: () => {
        play("tap");
        setScreen("home");
      }
    }, "\u2039 Zur\xFCck"), React.createElement("h2", {
      className: "zh-h2"
    }, "Deine Freunde"), React.createElement("p", {
      className: "zh-tag"
    }, "Jeder Freund kommt, wenn du eine Stufe sicher kannst."), React.createElement("div", {
      className: "zh-grid"
    }, CREATURES.map((c, i) => {
      const open = unlocked.includes(i);
      return React.createElement("div", {
        key: c.name,
        className: `zh-cardc${open ? " open" : ""}`
      }, React.createElement(Creature, {
        c: c,
        locked: !open,
        size: 78,
        bob: open
      }), React.createElement("span", null, open ? c.name : "???"), React.createElement("small", null, labels[i]));
    })), React.createElement(Styles, null)));
  }
  if (screen === "report") {
    const r = report;
    const maxv = Math.max(r.done, r.prevDone || 0, 1);
    const more = r.prevDone != null && r.done > r.prevDone;
    const celebrate = r.newFriends.length > 0 || r.done > 0 && r.correct / r.done >= 0.7;
    return React.createElement("div", {
      className: "zh-root"
    }, React.createElement(Header, {
      showGear: false
    }), React.createElement("main", {
      className: "zh-main"
    }, React.createElement(Confetti, {
      show: celebrate
    }), React.createElement("div", {
      className: "zh-card zh-report"
    }, React.createElement("div", {
      className: "zh-rhead"
    }, React.createElement(Mascot, {
      size: 56,
      mood: "right"
    }), React.createElement("h2", {
      className: "zh-h2"
    }, "Dein Bericht")), React.createElement("div", {
      className: "zh-bignum"
    }, r.done, React.createElement("small", null, "geschafft")), React.createElement("div", {
      className: `zh-repdots${r.results && r.results.length > 40 ? " small" : ""}`
    }, (r.results || []).slice(0, 80).map((cat, i) => React.createElement("span", {
      key: i,
      className: `zh-rdot ${cat}`
    }))), React.createElement("div", {
      className: "zh-dotlegend"
    }, React.createElement("span", {className: "zh-rdot clean"}), " allein  ", React.createElement("span", {className: "zh-rdot help"}), " mit Hilfe  ", React.createElement("span", {className: "zh-rdot retry"}), " nach Korrektur"), React.createElement("div", {
      className: "zh-rightlbl"
    }, r.correct, " gleich richtig \u2713"), r.prevDone != null && React.createElement("div", {
      className: "zh-compare"
    }, React.createElement("div", {
      className: "zh-bw"
    }, React.createElement("span", {
      className: "zh-bn",
      style: {
        color: "#9387b3"
      }
    }, r.prevDone), React.createElement("span", {
      className: "zh-bar old",
      style: {
        height: `${20 + r.prevDone / maxv * 80}px`
      }
    }), React.createElement("small", null, "letztes\xA0Mal")), more && React.createElement("div", {
      className: "zh-arrow"
    }, "\u25B2"), React.createElement("div", {
      className: "zh-bw"
    }, React.createElement("span", {
      className: "zh-bn",
      style: {
        color: "#FF6B6B"
      }
    }, r.done), React.createElement("span", {
      className: "zh-bar new",
      style: {
        height: `${20 + r.done / maxv * 80}px`
      }
    }), React.createElement("small", null, "heute"))), r.newFriends.length > 0 && React.createElement("div", {
      className: "zh-reveal"
    }, React.createElement("div", {
      className: "zh-sunburst",
      "aria-hidden": "true"
    }), React.createElement("div", {
      className: "zh-revtitle"
    }, "\uD83C\uDF89 Neuer Freund!"), React.createElement("div", {
      className: "zh-friendrow"
    }, r.newFriends.map(i => React.createElement("div", {
      key: i,
      className: "zh-friendone zh-popin"
    }, React.createElement(Creature, {
      c: CREATURES[i],
      size: r.newFriends.length > 1 ? 66 : 96,
      bob: true
    }), React.createElement("div", {
      className: "zh-fpill"
    }, CREATURES[i].name)))), React.createElement("span", {
      className: "zh-spark s1"
    }, "\u2728"), React.createElement("span", {
      className: "zh-spark s2"
    }, "\u2B50"), React.createElement("span", {
      className: "zh-spark s3"
    }, "\u2728"), React.createElement("span", {
      className: "zh-spark s4"
    }, "\u2B50")), save.settings.voice && React.createElement("button", {
      className: "zh-help",
      onClick: () => speak(`Du hast ${r.done} Aufgaben geschafft, ${r.correct} gleich richtig.`)
    }, "\uD83D\uDD08 Nochmal vorlesen"), React.createElement("div", {
      className: "zh-rbtns"
    }, React.createElement("button", {
      className: "zh-primary",
      onClick: () => {
        play("tap");
        startSession(r.stageId);
      }
    }, "Nochmal \u25B6"), React.createElement("button", {
      className: "zh-ghost",
      "aria-label": "Zur Startseite",
      onClick: () => {
        play("tap");
        setScreen("home");
      }
    }, React.createElement(Mascot, {
      size: 32
    })))), React.createElement(Styles, null)));
  }
  if (screen === "adult") {
    return React.createElement("div", {
      className: "zh-root"
    }, React.createElement(Header, {
      showGear: false
    }), React.createElement("main", {
      className: "zh-main"
    }, React.createElement("button", {
      className: "zh-back",
      onClick: () => {
        play("tap");
        setScreen("home");
      }
    }, "\u2039 Zur\xFCck"), React.createElement("h2", {
      className: "zh-h2"
    }, "F\xFCr Erwachsene"), React.createElement("div", {
      className: "zh-card zh-block"
    }, React.createElement("p", {
      className: "zh-blabel"
    }, "Sitzungsl\xE4nge"), React.createElement("div", {
      className: "zh-seg"
    }, [3, 5, 10, 0].map(m => React.createElement("button", {
      key: m,
      className: `zh-segbtn${minutes === m ? " on" : ""}`,
      onClick: () => setMinutes(m)
    }, m === 0 ? "Aus" : `${m} Min`))), React.createElement("div", {
      className: "zh-toggles"
    }, React.createElement("button", {
      className: `zh-tg${save.settings.sound ? " on" : ""}`,
      onClick: () => toggle("sound")
    }, save.settings.sound ? "🔊" : "🔇", " Ton"), React.createElement("button", {
      className: `zh-tg${save.settings.voice ? " on" : ""}`,
      onClick: () => toggle("voice")
    }, "\uD83D\uDD08 Vorlesen"))), React.createElement("div", {
      className: "zh-card zh-block"
    }, React.createElement("p", {
      className: "zh-blabel"
    }, "Lernstand"), STAGES.map(s => {
      const st = stat(save, s.id);
      return React.createElement("div", {
        key: s.id,
        className: "zh-statrow"
      }, React.createElement("span", {
        className: "zh-srn"
      }, s.n), React.createElement("span", {
        className: "zh-srname"
      }, s.name), React.createElement("span", {
        className: "zh-srstate"
      }, st.gold ? "⭐ Gold" : st.mastered ? "✓ sicher" : st.att ? `${st.ok}/${st.att}` : "–"));
    })), React.createElement("div", {
      className: "zh-card zh-block"
    }, React.createElement("p", {
      className: "zh-blabel"
    }, "Letzte \xDCbungen"), (save.history || []).length === 0 ? React.createElement("p", {
      className: "zh-histempty"
    }, "Noch keine \xDCbungen") : (save.history || []).map((h, i) => {
      const s = stageById(h.stageId);
      return React.createElement("div", {
        key: i,
        className: "zh-histrow"
      }, React.createElement("span", {
        className: "zh-histday"
      }, fmtDay(h.ts)), React.createElement("span", {
        className: "zh-histname"
      }, s ? s.name : h.stageId), React.createElement("span", {
        className: "zh-histdur"
      }, "⏱ ", fmtDuration(h.durationSec)), React.createElement("span", {
        className: "zh-histscore"
      }, h.correct, "/", h.done, " richtig"));
    })), React.createElement("button", {
      className: "zh-danger",
      onClick: () => setResetAsk(true)
    }, "Fortschritt zur\xFCcksetzen"), resetAsk && React.createElement("div", {
      className: "zh-modal",
      onClick: () => setResetAsk(false)
    }, React.createElement("div", {
      className: "zh-modalcard",
      onClick: e => e.stopPropagation()
    }, React.createElement("h3", {
      className: "zh-h2"
    }, "Wirklich alles zur\xFCcksetzen?"), React.createElement("p", {
      className: "zh-tag"
    }, "Sterne, Freunde und Lernstand werden gel\xF6scht."), React.createElement("div", {
      className: "zh-rbtns"
    }, React.createElement("button", {
      className: "zh-danger",
      onClick: doReset
    }, "Ja, l\xF6schen"), React.createElement("button", {
      className: "zh-ghost",
      onClick: () => setResetAsk(false)
    }, "Abbrechen")))), React.createElement("p", {
      className: "zh-version"
    }, `Numi ${APP_VERSION}`), React.createElement(Styles, null)));
  }
  if (!problem) return null;
  const p = problem;
  const timePct = minutes > 0 ? Math.min(100, elapsed / (minutes * 60) * 100) : 0;
  return React.createElement("div", {
    className: "zh-root"
  }, React.createElement(Header, {
    showGear: false
  }), React.createElement("main", {
    className: "zh-main"
  }, React.createElement(Confetti, {
    show: confetti
  }), React.createElement("div", {
    className: "zh-playtop"
  }, React.createElement("button", {
    className: "zh-back",
    onClick: () => {
      play("tap");
      finishSession();
    }
  }, "\u2039 Fertig"), React.createElement("div", {
    className: "zh-doneN"
  }, "Aufgabe ", doneCount + 1)), minutes > 0 && React.createElement("div", {
    className: "zh-timebar"
  }, React.createElement("div", {
    className: "zh-timefill",
    style: {
      width: `${timePct}%`
    }
  })), React.createElement("div", {
    className: `zh-card zh-problem${status === "right" ? " pop" : ""}`
  }, React.createElement(Mascot, {
    size: 80,
    mood: status === "right" ? "right" : "happy"
  }), React.createElement("div", {
    className: "zh-equation"
  }, React.createElement("span", null, p.a), React.createElement("span", {
    className: "zh-op"
  }, p.op), React.createElement("span", null, p.b), React.createElement("span", {
    className: "zh-op"
  }, "="), React.createElement("span", {
    className: "zh-blank"
  }, status === "right" ? p.answer : "?"))), React.createElement("div", {
    className: "zh-helprow"
  }, React.createElement("button", {
    className: "zh-help",
    onClick: () => {
      play("tap");
      setHelpUsed(true);
      setShowHelp(s => !s);
    }
  }, showHelp ? "🙈 Hilfe aus" : "💡 Zeig mir's")), showHelp && React.createElement("div", {
    className: "zh-card zh-helpbox"
  }, React.createElement(TwentyFrame, {
    p: p,
    reveal: true
  }), React.createElement("p", {
    className: "zh-hinttext"
  }, getHint(p))), React.createElement("div", {
    className: "zh-options"
  }, p.options.map(opt => {
    const w = wrong.includes(opt),
      ri = status === "right" && opt === p.answer;
    return React.createElement("button", {
      key: opt,
      disabled: w || status === "right",
      className: `zh-opt${w ? " wrong" : ""}${ri ? " right" : ""}`,
      onClick: () => handlePick(opt)
    }, opt);
  })), status !== "right" && wrong.length > 0 && React.createElement("p", {
    className: "zh-encour"
  }, "Fast! Schau ins Zwanzigerfeld und probier nochmal."), !streakMsg && React.createElement("div", {
    className: `zh-streakbar${streak >= 1 ? "" : " idle"}`
  }, streak >= 1 ? `🔥 ${streak} richtig in Folge` : "🔥 Sammle eine Serie"), streakMsg && React.createElement("div", {
    className: "zh-streakmsg"
  }, streakMsg), React.createElement(Styles, null)));
}
function Styles() {
  return React.createElement("style", null, `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@600;700;800&display=swap');
*{box-sizing:border-box}
.zh-root{min-height:100vh;font-family:'Nunito',system-ui,sans-serif;color:#3A2E5C;background:linear-gradient(180deg,#FFE9C7 0%,#FFD6E0 45%,#CDEFFF 100%);display:flex;flex-direction:column}
.zh-header{display:flex;justify-content:space-between;align-items:center;padding:14px 18px}
.zh-logo{font-family:'Baloo 2';font-weight:800;font-size:22px;color:#fff;background:#FFC93C;padding:6px 18px;border-radius:999px;box-shadow:0 5px 0 #E0A800}
.zh-hright{display:flex;gap:10px}
.zh-icbtn{border:none;background:#fff;width:46px;height:46px;border-radius:999px;font-size:20px;box-shadow:0 4px 0 #d9d2ec;cursor:pointer}
.zh-icbtn:active{transform:translateY(3px);box-shadow:0 1px 0 #d9d2ec}
.zh-main{width:100%;max-width:560px;margin:0 auto;padding:6px 18px 40px;flex:1}
.zh-hero{text-align:center;padding:6px 0 10px}
.zh-title{font-family:'Baloo 2';font-weight:800;font-size:44px;margin:6px 0 4px;color:#7C5CDC;text-shadow:0 3px 0 rgba(255,255,255,.7)}
.zh-tag{font-weight:700;color:#6b5e8a;margin:4px 0 0;font-size:15px}
.zh-card{background:#fff;border-radius:28px;box-shadow:0 9px 0 #ECE5FA}
.zh-rec{width:100%;display:flex;align-items:center;gap:14px;text-align:left;cursor:pointer;border:none;background:#fff;border-radius:28px;padding:18px;margin-top:14px;box-shadow:0 8px 0 #FFC93C}
.zh-rec:active{transform:translateY(4px);box-shadow:0 4px 0 #FFC93C}
.zh-recicon{font-size:34px;width:60px;height:60px;display:flex;align-items:center;justify-content:center;background:#FFE08A;border-radius:20px}
.zh-rectext{display:flex;flex-direction:column;flex:1}
.zh-rectext small{font-weight:700;color:#9387b3;font-size:13px}
.zh-rectext strong{font-family:'Baloo 2';font-size:clamp(16px,4vw,21px);color:#3A2E5C;line-height:1.1;hyphens:auto;overflow-wrap:break-word}
.zh-recgo{font-family:'Baloo 2';font-weight:800;color:#fff;background:#FF6B6B;padding:10px 18px;border-radius:999px;font-size:18px;box-shadow:0 4px 0 #E04848}
.zh-section{font-family:'Baloo 2';font-weight:700;color:#9387b3;font-size:14px;margin:22px 4px 8px;text-transform:uppercase;letter-spacing:1px}
.zh-stages{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.zh-stile{position:relative;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;border:none;background:#fff;border-radius:20px;padding:12px;box-shadow:0 6px 0 #ECE5FA}
.zh-stile:active{transform:translateY(3px);box-shadow:0 3px 0 #ECE5FA}
.zh-stile.done{box-shadow:0 6px 0 #BFE9D5}
.zh-stile.gold{box-shadow:0 6px 0 #FFD86B}
.zh-snum{font-family:'Baloo 2';font-weight:800;font-size:18px;color:#fff;background:#7C5CDC;width:30px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.zh-stile.done .zh-snum{background:#3FBF8F}.zh-stile.gold .zh-snum{background:#F2A900}
.zh-sname{font-family:'Baloo 2';font-weight:700;font-size:13px;line-height:1.15;color:#3A2E5C}
.zh-sbadge{position:absolute;top:8px;right:10px;font-size:15px}
.zh-collectbtn{width:100%;margin-top:18px;border:none;cursor:pointer;font-family:'Baloo 2';font-weight:700;font-size:18px;color:#7C5CDC;background:#fff;padding:14px;border-radius:22px;box-shadow:0 6px 0 #E7E0F7}
.zh-collectbtn:active{transform:translateY(3px);box-shadow:0 3px 0 #E7E0F7}
.zh-back{border:none;background:#fff;font-family:'Baloo 2';font-weight:700;font-size:18px;color:#7C5CDC;cursor:pointer;padding:8px 16px;border-radius:999px;box-shadow:0 4px 0 #E7E0F7}
.zh-back:active{transform:translateY(3px);box-shadow:0 1px 0 #E7E0F7}
.zh-h2{font-family:'Baloo 2';font-weight:800;font-size:28px;color:#7C5CDC;text-align:center;margin:8px 0}
/* PLAY */
.zh-playtop{display:flex;justify-content:space-between;align-items:center;margin-top:4px}
.zh-doneN{font-family:'Baloo 2';font-weight:700;color:#FF6B6B;background:#fff;padding:6px 14px;border-radius:999px;box-shadow:0 4px 0 #ffd9d9;font-size:15px}
.zh-timebar{height:12px;background:#fff;border-radius:999px;overflow:hidden;margin-top:12px;box-shadow:0 3px 0 #ECE5FA}
.zh-timefill{height:100%;background:linear-gradient(90deg,#FFC93C,#FF8FAB);transition:width 1s linear}
.zh-problem{padding:18px;margin-top:14px;display:flex;flex-direction:column;align-items:center;gap:6px}
.zh-problem.pop{animation:pop .5s ease}
.zh-equation{display:flex;align-items:center;gap:10px;font-family:'Baloo 2';font-weight:800;font-size:50px;color:#3A2E5C}
.zh-op{color:#B8A9E0}.zh-blank{min-width:60px;text-align:center;color:#FF6B6B;border-bottom:6px dotted #FFC93C;line-height:1}
.zh-helprow{text-align:center;margin-top:14px}
.zh-help{border:none;cursor:pointer;font-family:'Baloo 2';font-weight:700;font-size:16px;color:#3A2E5C;background:#FFE08A;padding:10px 22px;border-radius:999px;box-shadow:0 5px 0 #F2C84B}
.zh-help:active{transform:translateY(3px);box-shadow:0 2px 0 #F2C84B}
.zh-helpbox{padding:18px 16px;margin-top:14px}
.zh-frame{width:100%;max-width:380px;margin:0 auto;display:flex;flex-direction:column;gap:clamp(4px,1.6vw,8px)}
.zh-row{display:flex;gap:clamp(3px,1.4vw,6px)}
.zh-cell{flex:1 1 0;aspect-ratio:1;border:2px solid #E3DBF5;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#FBFAFF}
.zh-cell.mid{margin-left:clamp(7px,3.2vw,15px)}
.zh-dot{width:72%;aspect-ratio:1;border-radius:999px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:clamp(9px,3vw,14px);animation:dropin .3s ease both}
.zh-dot-a{background:#FF6B6B}.zh-dot-b{background:#5AB2FF}.zh-dot-partner{background:#FF8FAB;box-shadow:0 0 0 2px #fff,0 0 0 4px #FFB7C9}.zh-dot-removed{background:#D7CEE8}
.zh-dot.love-a{background:#FF8A8A;animation:love-a 3.6s ease-in-out infinite}
.zh-dot.love-b{background:#8AC5FF;animation:love-b 3.6s ease-in-out infinite}
@keyframes love-a{0%,100%{background:#FF8A8A}50%{background:#FF5C9E}}
@keyframes love-b{0%,100%{background:#8AC5FF}50%{background:#FF5C9E}}
.zh-hinttext{font-weight:800;text-align:center;color:#7C5CDC;font-size:16px;margin:14px 0 0;overflow-wrap:break-word;hyphens:auto}
.zh-options{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}
.zh-opt{font-family:'Baloo 2';font-weight:800;font-size:34px;color:#3A2E5C;border:none;cursor:pointer;background:#fff;padding:22px 0;border-radius:24px;box-shadow:0 7px 0 #D9CFF2}
.zh-opt:active{transform:translateY(4px);box-shadow:0 3px 0 #D9CFF2}
.zh-opt.wrong{background:#FFE2E2;color:#E04848;box-shadow:0 7px 0 #F4B8B8;animation:shake .4s;opacity:.85}
.zh-opt.right{background:#C9F5E5;color:#1B9C6E;box-shadow:0 7px 0 #8FE3C4}
.zh-encour{text-align:center;font-weight:800;color:#7C5CDC;margin-top:16px;font-size:16px}
.zh-streakbar{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px;font-family:'Baloo 2';font-weight:800;color:#FF6B6B;font-size:18px;background:#fff;padding:10px 16px;border-radius:999px;box-shadow:0 5px 0 #ffd9d9}
.zh-streakbar.idle{color:#B3A9CC;box-shadow:0 5px 0 #ECE5FA}
.zh-streakmsg{text-align:center;font-family:'Baloo 2';font-weight:800;color:#FFB000;font-size:17px;margin-top:10px;animation:pop .5s ease}
/* COLLECTION */
.zh-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.zh-cardc{background:#fff;border-radius:20px;padding:10px 4px;text-align:center;box-shadow:0 6px 0 #ECE5FA;display:flex;flex-direction:column;align-items:center}
.zh-cardc span{font-family:'Baloo 2';font-weight:700;color:#9387b3;margin-top:2px;font-size:14px}
.zh-cardc.open span{color:#3A2E5C}
.zh-cardc small{font-size:10px;color:#B3A9CC;font-weight:700}
/* REPORT */
.zh-report{padding:20px;margin-top:10px;text-align:center}
.zh-rhead{display:flex;align-items:center;justify-content:center;gap:8px}
.zh-bignum{font-family:'Baloo 2';font-weight:800;font-size:74px;line-height:1;color:#FFB000;text-shadow:0 4px 0 #f2c84b55;margin-top:4px;display:flex;flex-direction:column;align-items:center}
.zh-bignum small{font-family:'Baloo 2';font-weight:700;font-size:16px;color:#9387b3;margin-top:2px}
.zh-repdots{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:min(320px,90vw);margin:12px auto 0}
.zh-rdot{display:inline-block;width:22px;height:22px;border-radius:999px}.zh-rdot.g{background:#FFC93C}.zh-rdot.e{background:#EFEAF9}
.zh-rdot.clean{background:#FFC93C}.zh-rdot.help{background:#FF9F1C}.zh-rdot.retry{background:#E3DBF5}
.zh-repdots.small .zh-rdot{width:16px;height:16px}
.zh-dotlegend{display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;font-family:'Baloo 2';font-weight:700;font-size:13px;color:#9387b3;margin-top:8px}
.zh-dotlegend .zh-rdot{width:14px;height:14px}
.zh-rightlbl{font-family:'Baloo 2';font-weight:800;color:#1B9C6E;font-size:17px;margin-top:10px}
.zh-compare{display:flex;align-items:flex-end;justify-content:center;gap:22px;margin:16px 0 4px}
.zh-bw{display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.zh-bn{font-family:'Baloo 2';font-weight:800;font-size:18px;margin-bottom:4px}
.zh-bar{width:50px;border-radius:14px 14px 0 0}.zh-bar.old{background:#D9CFF2}.zh-bar.new{background:#FF8FAB}
.zh-bw small{font-family:'Baloo 2';font-weight:700;font-size:12px;color:#9387b3;margin-top:6px}
.zh-arrow{align-self:center;font-size:26px;color:#1B9C6E;margin-bottom:28px}
.zh-reveal{position:relative;overflow:hidden;background:#FBF7FF;border-radius:22px;padding:14px 12px 18px;margin-top:14px}
.zh-sunburst{position:absolute;top:54%;left:50%;width:300px;height:300px;transform:translate(-50%,-50%);background:repeating-conic-gradient(from 0deg,#FFE6A0 0deg 10deg,transparent 10deg 20deg);border-radius:50%;opacity:.55;animation:spin 16s linear infinite;-webkit-mask-image:radial-gradient(circle,#000 26%,transparent 66%);mask-image:radial-gradient(circle,#000 26%,transparent 66%);z-index:0}
.zh-revtitle{position:relative;z-index:1;font-family:'Baloo 2';font-weight:800;font-size:22px;color:#7C5CDC;text-align:center;margin-bottom:6px;animation:pop .6s ease}
.zh-friendrow{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
.zh-friendone{display:flex;flex-direction:column;align-items:center}
.zh-popin{animation:popin .7s cubic-bezier(.18,1.5,.5,1) both}
.zh-fpill{margin-top:8px;font-family:'Baloo 2';font-weight:800;font-size:17px;color:#fff;background:#FF6B6B;padding:4px 16px;border-radius:999px;box-shadow:0 4px 0 #E04848}
.zh-spark{position:absolute;font-size:20px;z-index:1;animation:twinkle 1.4s ease-in-out infinite}
.zh-spark.s1{top:12px;left:18px}.zh-spark.s2{top:18px;right:22px;animation-delay:.3s}
.zh-spark.s3{bottom:14px;left:30px;animation-delay:.6s}.zh-spark.s4{bottom:20px;right:28px;animation-delay:.9s}
@keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes popin{0%{transform:scale(0) rotate(-12deg);opacity:0}70%{transform:scale(1.12) rotate(4deg)}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes twinkle{0%,100%{transform:scale(.7);opacity:.4}50%{transform:scale(1.15);opacity:1}}
.zh-newbadge{position:absolute;top:8px;right:14px;background:#FF6B6B;color:#fff;font-family:'Baloo 2';font-weight:800;font-size:13px;padding:3px 12px;border-radius:999px}
.zh-fname{font-family:'Baloo 2';font-weight:800;font-size:18px;color:#3A2E5C;margin-top:4px}
.zh-rbtns{display:flex;gap:12px;margin-top:18px}
.zh-primary{flex:2;font-family:'Baloo 2';font-weight:800;font-size:22px;color:#fff;border:none;cursor:pointer;background:#FF6B6B;padding:16px;border-radius:22px;box-shadow:0 6px 0 #E04848}
.zh-primary:active{transform:translateY(3px);box-shadow:0 3px 0 #E04848}
.zh-ghost{flex:1;font-family:'Baloo 2';font-weight:700;font-size:24px;color:#7C5CDC;border:none;cursor:pointer;background:#F0EBFB;padding:14px;border-radius:22px;box-shadow:0 6px 0 #C9BFF0}
.zh-ghost:active{transform:translateY(3px);box-shadow:0 3px 0 #C9BFF0}
/* ADULT */
.zh-block{padding:16px 18px;margin-top:14px}
.zh-blabel{font-family:'Baloo 2';font-weight:700;color:#7C5CDC;margin:0 0 10px;font-size:16px}
.zh-version{text-align:center;color:#B7AECF;font-size:12px;margin:14px 0 4px}
.zh-seg{display:flex;gap:8px}
.zh-segbtn{flex:1;border:none;cursor:pointer;font-family:'Baloo 2';font-weight:700;font-size:15px;color:#7C5CDC;background:#F0EBFB;padding:12px 0;border-radius:14px}
.zh-segbtn.on{background:#7C5CDC;color:#fff}
.zh-toggles{display:flex;gap:8px;margin-top:10px}
.zh-tg{flex:1;border:none;cursor:pointer;font-family:'Baloo 2';font-weight:700;font-size:15px;color:#7C5CDC;background:#F0EBFB;padding:12px 0;border-radius:14px}
.zh-tg.on{background:#7C5CDC;color:#fff}
.zh-statrow{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #F0ECF8}
.zh-srn{font-family:'Baloo 2';font-weight:800;color:#fff;background:#B8A9E0;width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.zh-srname{flex:1;font-weight:700;font-size:13px;color:#3A2E5C}
.zh-srstate{font-family:'Baloo 2';font-weight:700;font-size:13px;color:#7C5CDC}
.zh-histrow{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #F0ECF8}
.zh-histday{font-family:'Baloo 2';font-weight:700;font-size:13px;color:#9387b3;width:60px;flex-shrink:0}
.zh-histname{flex:1;font-weight:700;font-size:13px;color:#3A2E5C;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zh-histdur{font-family:'Baloo 2';font-weight:700;font-size:13px;color:#7C5CDC;flex-shrink:0}
.zh-histscore{font-family:'Baloo 2';font-weight:700;font-size:13px;color:#1B9C6E;flex-shrink:0}
.zh-histempty{font-weight:700;color:#B3A9CC;font-size:14px;margin:4px 0}
.zh-danger{width:100%;margin-top:16px;border:none;cursor:pointer;font-family:'Baloo 2';font-weight:800;font-size:17px;color:#fff;background:#FF6B6B;padding:14px;border-radius:18px;box-shadow:0 5px 0 #E04848}
/* MODAL */
.zh-modal{position:fixed;inset:0;background:rgba(58,46,92,.45);display:flex;align-items:center;justify-content:center;padding:24px;z-index:50}
.zh-modalcard{position:relative;background:#fff;border-radius:28px;padding:26px;text-align:center;max-width:330px;width:100%;box-shadow:0 14px 0 #c9bff0}
/* ANIM */
.zh-bob{animation:bob 2.4s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@keyframes dropin{0%{transform:translateY(-12px) scale(.4);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
.zh-confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:40}
.zh-confetti span{position:absolute;top:-12px;width:11px;height:16px;border-radius:3px;animation:fall 1.5s ease-in forwards}
@keyframes fall{to{transform:translateY(110vh) rotate(540deg);opacity:.2}}
@media (prefers-reduced-motion:reduce){.zh-bob,.zh-confetti span,.zh-dot,.zh-dot.love-a,.zh-dot.love-b,.zh-problem.pop,.zh-opt.wrong,.zh-sunburst,.zh-popin,.zh-spark{animation:none!important}}
@media (max-width:420px){.zh-equation{font-size:42px}.zh-opt{font-size:30px;padding:18px 0}.zh-sname{font-size:12px}}
`);
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
