const {
  useState,
  useRef,
  useEffect,
  useCallback
} = React;
function useSound(enabledRef) {
  const ctxRef = useRef(null);
  const ensure = () => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };
  const tone = (freq, start, dur, type = "sine", vol = 0.18) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime + start);
    g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(ctx.currentTime + start);
    o.stop(ctx.currentTime + start + dur + 0.05);
  };
  const play = useCallback(kind => {
    if (!enabledRef.current) return;
    const ctx = ensure();
    if (!ctx) return;
    if (kind === "right") {
      tone(523.25, 0, 0.16, "triangle");
      tone(659.25, 0.09, 0.16, "triangle");
      tone(783.99, 0.18, 0.26, "triangle");
    } else if (kind === "retry") {
      tone(330, 0, 0.18, "sine", 0.14);
      tone(247, 0.12, 0.22, "sine", 0.12);
    } else if (kind === "unlock") {
      tone(523, 0, 0.14, "triangle");
      tone(698, 0.1, 0.14, "triangle");
      tone(880, 0.2, 0.14, "triangle");
      tone(1046, 0.3, 0.34, "triangle");
    } else if (kind === "tap") {
      tone(440, 0, 0.06, "sine", 0.08);
    }
  }, [enabledRef]);
  return play;
}
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
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
function generateProblem(mode) {
  let a, b, op, answer, max;
  if (mode === "plus10") {
    a = rand(1, 8);
    b = rand(1, 10 - a);
    op = "+";
    answer = a + b;
    max = 10;
  } else if (mode === "minus10") {
    a = rand(3, 10);
    b = rand(1, a);
    op = "-";
    answer = a - b;
    max = 10;
  } else if (mode === "plusZ") {
    do {
      a = rand(2, 9);
      b = rand(2, 9);
    } while (a + b <= 10 || a + b > 18);
    op = "+";
    answer = a + b;
    max = 20;
  } else if (mode === "minusZ") {
    do {
      const r = rand(1, 9);
      b = rand(2, 9);
      a = r + b;
    } while (a < 11 || a > 20);
    op = "-";
    answer = a - b;
    max = 20;
  } else {
    const pick = shuffle(["plus10", "minus10", "plusZ", "minusZ", "plusZ", "minusZ"])[0];
    return generateProblem(pick);
  }
  return {
    a,
    b,
    op,
    answer,
    max,
    mode,
    options: makeOptions(answer, max)
  };
}
function getHint(p) {
  const {
    a,
    b,
    op,
    answer
  } = p;
  if (op === "+") {
    const toTen = 10 - a;
    if (a + b <= 10) return `Starte bei ${a} und zähle ${b} weiter: …${answer}.`;
    const rest = b - toTen;
    return `Erst bis zur Zehn: ${a} + ${toTen} = 10. Dann 10 + ${rest} = ${answer}.`;
  } else {
    if (a <= 10) return `Nimm ${b} von ${a} weg: …${answer}.`;
    const down = a - 10;
    if (b <= down) return `${a} − ${b} = ${answer}. Die Zehn bleibt heil!`;
    const rest = b - down;
    return `Erst bis zur Zehn: ${a} − ${down} = 10. Dann 10 − ${rest} = ${answer}.`;
  }
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
  name: "Mümmel",
  c1: "#56D9C0",
  c2: "#26B49A",
  horn: true,
  eyes: 2
}, {
  name: "Zacki",
  c1: "#FF9F1C",
  c2: "#E07B00",
  horn: true,
  eyes: 3
}, {
  name: "Schimmer",
  c1: "#9B8CFF",
  c2: "#6C5CE7",
  horn: false,
  eyes: 2
}];
const STARS_PER_CREATURE = 5;
function Creature({
  c,
  size = 96,
  locked = false,
  bob = false
}) {
  if (locked) {
    return React.createElement("svg", {
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
  }
  const eyeY = 50;
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
    cy: eyeY,
    r: "8",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "38",
    cy: eyeY + 1,
    r: "4",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "50",
    cy: eyeY - 4,
    r: "8",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "50",
    cy: eyeY - 3,
    r: "4",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "62",
    cy: eyeY,
    r: "8",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "62",
    cy: eyeY + 1,
    r: "4",
    fill: "#2A2342"
  })) : React.createElement(React.Fragment, null, React.createElement("circle", {
    cx: "40",
    cy: eyeY,
    r: "9",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "41",
    cy: eyeY + 1,
    r: "4.5",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "60",
    cy: eyeY,
    r: "9",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "61",
    cy: eyeY + 1,
    r: "4.5",
    fill: "#2A2342"
  })), React.createElement("path", {
    d: "M42 70 Q50 78 58 70",
    stroke: "#2A2342",
    strokeWidth: "3",
    fill: "none",
    strokeLinecap: "round"
  }), React.createElement("circle", {
    cx: "30",
    cy: "64",
    r: "5",
    fill: "#fff",
    opacity: "0.5"
  }), React.createElement("circle", {
    cx: "70",
    cy: "64",
    r: "5",
    fill: "#fff",
    opacity: "0.5"
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
  }, React.createElement("ellipse", {
    cx: "60",
    cy: "108",
    rx: "30",
    ry: "6",
    fill: "#000",
    opacity: "0.08"
  }), React.createElement("circle", {
    cx: "60",
    cy: "62",
    r: "42",
    fill: "#FFC93C"
  }), React.createElement("circle", {
    cx: "60",
    cy: "62",
    r: "42",
    fill: "#F2A900",
    opacity: "0.18"
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
    cx: mood === "think" ? 47 : 49,
    cy: "56",
    r: "5.5",
    fill: "#2A2342"
  }), React.createElement("circle", {
    cx: "73",
    cy: "54",
    r: "11",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: mood === "think" ? 73 : 75,
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
    fill: "#FFFFFF",
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
  const cells = [];
  for (let i = 0; i < 20; i++) {
    let state = "empty";
    if (op === "+") {
      if (i < a) state = "a";else if (i < a + b) state = "b";
    } else {
      if (i < a) state = i >= a - b ? "removed" : "a";
    }
    cells.push(state);
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
      className: `zh-dot zh-dot-${s}`,
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
  const colors = ["#FFC93C", "#FF6B6B", "#4ECDC4", "#7C5CDC", "#5AB2FF", "#A0E548"];
  return React.createElement("div", {
    className: "zh-confetti"
  }, Array.from({
    length: 26
  }).map((_, i) => React.createElement("span", {
    key: i,
    style: {
      left: `${rand(2, 96)}%`,
      background: colors[i % colors.length],
      animationDelay: `${rand(0, 300)}ms`,
      transform: `rotate(${rand(0, 360)}deg)`
    }
  })));
}
const HERO_MODE = {
  id: "mixed",
  label: "Bunt gemischt bis 20",
  emoji: "🎲",
  sub: "Plus & Minus – dein Haupt-Training",
  c: "#FFC93C"
};
const TARGET_MODES = [{
  id: "plusZ",
  label: "Plus über den Zehner",
  emoji: "➕",
  sub: "Zehnerübergang",
  c: "#FF8FAB"
}, {
  id: "minusZ",
  label: "Minus über den Zehner",
  emoji: "➖",
  sub: "Zehnerübergang",
  c: "#5AB2FF"
}, {
  id: "plus10",
  label: "Plus bis 10",
  emoji: "🌱",
  sub: "zum Aufwärmen",
  c: "#A0E548"
}, {
  id: "minus10",
  label: "Minus bis 10",
  emoji: "🍃",
  sub: "zum Aufwärmen",
  c: "#4ECDC4"
}];
function FriendProgress({
  stars,
  order
}) {
  const all = Math.min(Math.floor(stars / STARS_PER_CREATURE), CREATURES.length);
  const inLevel = all >= CREATURES.length ? STARS_PER_CREATURE : stars % STARS_PER_CREATURE;
  const pct = inLevel / STARS_PER_CREATURE * 100;
  const done = all >= CREATURES.length;
  const next = CREATURES[order[Math.min(all, CREATURES.length - 1)]];
  return React.createElement("div", {
    className: "zh-progress"
  }, React.createElement("div", {
    className: "zh-progmini"
  }, React.createElement(Creature, {
    c: next,
    size: 42,
    locked: !done
  })), React.createElement("div", {
    className: "zh-progbody"
  }, React.createElement("div", {
    className: "zh-progtop"
  }, React.createElement("span", null, done ? "Alle Freunde gesammelt!" : "Nächster Freund"), React.createElement("span", null, done ? "🎉" : `${STARS_PER_CREATURE - inLevel} ⭐`)), React.createElement("div", {
    className: "zh-bar"
  }, React.createElement("div", {
    className: "zh-barfill",
    style: {
      width: `${pct}%`
    }
  }))));
}
function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState(null);
  const [problem, setProblem] = useState(null);
  const [status, setStatus] = useState("idle");
  const [wrongPicks, setWrongPicks] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [session, setSession] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [unlocked, setUnlocked] = useState(null);
  const [order] = useState(() => shuffle(CREATURES.map((_, i) => i)));
  const soundOn = useRef(true);
  const [soundUi, setSoundUi] = useState(true);
  const play = useSound(soundOn);
  const newProblem = useCallback(m => {
    setProblem(generateProblem(m));
    setStatus("idle");
    setWrongPicks([]);
    setShowHelp(false);
  }, []);
  const startMode = m => {
    setMode(m);
    setSession(0);
    setStreak(0);
    newProblem(m);
    setScreen("play");
  };
  const handlePick = opt => {
    if (status === "right") return;
    if (opt === problem.answer) {
      play("right");
      setStatus("right");
      setSession(s => s + 1);
      setStreak(s => s + 1);
      setConfetti(true);
      setStars(prev => {
        const next = prev + 1;
        const before = Math.min(Math.floor(prev / STARS_PER_CREATURE), CREATURES.length);
        const after = Math.min(Math.floor(next / STARS_PER_CREATURE), CREATURES.length);
        if (after > before) {
          setTimeout(() => {
            play("unlock");
            setUnlocked(CREATURES[order[before]]);
          }, 700);
        }
        return next;
      });
      setTimeout(() => setConfetti(false), 1200);
      setTimeout(() => newProblem(mode), 1500);
    } else {
      play("retry");
      setStreak(0);
      setShowHelp(true);
      setWrongPicks(w => w.includes(opt) ? w : [...w, opt]);
    }
  };
  const unlockedCount = Math.min(Math.floor(stars / STARS_PER_CREATURE), CREATURES.length);
  if (screen === "home") {
    return React.createElement(Shell, {
      stars: stars,
      soundUi: soundUi,
      onSound: () => {
        soundOn.current = !soundOn.current;
        setSoundUi(soundOn.current);
      }
    }, React.createElement("div", {
      className: "zh-hero"
    }, React.createElement(Mascot, {
      size: 130
    }), React.createElement("h1", {
      className: "zh-title"
    }, "Numi"), React.createElement("p", {
      className: "zh-tag"
    }, "\xDCbe Plus und Minus bis 20 \u2013 in deinem Tempo, ganz ohne Stoppuhr.")), React.createElement(FriendProgress, {
      stars: stars,
      order: order
    }), React.createElement("button", {
      className: "zh-hcard",
      style: {
        "--c": HERO_MODE.c
      },
      onClick: () => {
        play("tap");
        startMode(HERO_MODE.id);
      }
    }, React.createElement("span", {
      className: "zh-hemoji"
    }, HERO_MODE.emoji), React.createElement("span", {
      className: "zh-modetext"
    }, React.createElement("strong", null, HERO_MODE.label), React.createElement("small", null, HERO_MODE.sub)), React.createElement("span", {
      className: "zh-go"
    }, "Los!")), React.createElement("p", {
      className: "zh-section"
    }, "Gezielt \xFCben"), React.createElement("div", {
      className: "zh-modes"
    }, TARGET_MODES.map(m => React.createElement("button", {
      key: m.id,
      className: "zh-modecard",
      style: {
        "--c": m.c
      },
      onClick: () => {
        play("tap");
        startMode(m.id);
      }
    }, React.createElement("span", {
      className: "zh-modeemoji"
    }, m.emoji), React.createElement("span", {
      className: "zh-modetext"
    }, React.createElement("strong", null, m.label), React.createElement("small", null, m.sub)), React.createElement("span", {
      className: "zh-go"
    }, "Los!")))), React.createElement("button", {
      className: "zh-collectbtn",
      onClick: () => {
        play("tap");
        setScreen("collection");
      }
    }, "\uD83C\uDFC6 Meine Freunde (", unlockedCount, "/", CREATURES.length, ")"), React.createElement(Styles, null));
  }
  if (screen === "collection") {
    const toNext = STARS_PER_CREATURE - stars % STARS_PER_CREATURE;
    return React.createElement(Shell, {
      stars: stars,
      soundUi: soundUi,
      onSound: () => {
        soundOn.current = !soundOn.current;
        setSoundUi(soundOn.current);
      }
    }, React.createElement("button", {
      className: "zh-back",
      onClick: () => {
        play("tap");
        setScreen("home");
      }
    }, "\u2039 Zur\xFCck"), React.createElement("h2", {
      className: "zh-h2"
    }, "Deine Zahlenmonster"), React.createElement("p", {
      className: "zh-tag"
    }, unlockedCount < CREATURES.length ? `Noch ${toNext} ⭐ bis zum nächsten Freund!` : "Wow! Du hast alle Freunde gesammelt! 🎉"), React.createElement("div", {
      className: "zh-grid"
    }, CREATURES.map((c, i) => {
      const open = order.indexOf(i) < unlockedCount;
      return React.createElement("div", {
        key: c.name,
        className: `zh-cardc${open ? " open" : ""}`
      }, React.createElement(Creature, {
        c: c,
        locked: !open,
        size: 84,
        bob: open
      }), React.createElement("span", null, open ? c.name : "???"));
    })), React.createElement(Styles, null));
  }
  if (screen === "done") {
    return React.createElement(Shell, {
      stars: stars,
      soundUi: soundUi,
      onSound: () => {
        soundOn.current = !soundOn.current;
        setSoundUi(soundOn.current);
      }
    }, React.createElement("div", {
      className: "zh-done"
    }, React.createElement(Mascot, {
      size: 120,
      mood: "right"
    }), React.createElement("h2", {
      className: "zh-h2"
    }, "Stark gemacht!"), React.createElement("p", {
      className: "zh-bigcount"
    }, session), React.createElement("p", {
      className: "zh-tag"
    }, "Aufgaben geschafft \uD83C\uDF89"), React.createElement("div", {
      className: "zh-donebtns"
    }, React.createElement("button", {
      className: "zh-primary",
      onClick: () => {
        play("tap");
        startMode(mode);
      }
    }, "Nochmal!"), React.createElement("button", {
      className: "zh-ghost",
      onClick: () => {
        play("tap");
        setScreen("home");
      }
    }, "Zur Auswahl"))), React.createElement(Styles, null));
  }
  const p = problem;
  return React.createElement(Shell, {
    stars: stars,
    soundUi: soundUi,
    onSound: () => {
      soundOn.current = !soundOn.current;
      setSoundUi(soundOn.current);
    }
  }, React.createElement(Confetti, {
    show: confetti
  }), React.createElement("div", {
    className: "zh-playtop"
  }, React.createElement("button", {
    className: "zh-back",
    onClick: () => {
      play("tap");
      setScreen("done");
    }
  }, "\u2039 Fertig"), React.createElement("div", {
    className: "zh-streak"
  }, streak >= 2 ? `🔥 ${streak} in Folge!` : `Aufgabe ${session + 1}`)), React.createElement(FriendProgress, {
    stars: stars,
    order: order
  }), React.createElement("div", {
    className: `zh-problem${status === "right" ? " pop" : ""}`
  }, React.createElement(Mascot, {
    size: 86,
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
      setShowHelp(s => !s);
    }
  }, showHelp ? "🙈 Hilfe aus" : "💡 Zeig mir's")), showHelp && React.createElement("div", {
    className: "zh-helpbox"
  }, React.createElement(TwentyFrame, {
    p: p,
    reveal: true
  }), React.createElement("p", {
    className: "zh-hinttext"
  }, getHint(p))), React.createElement("div", {
    className: "zh-options"
  }, p.options.map(opt => {
    const wrong = wrongPicks.includes(opt);
    const right = status === "right" && opt === p.answer;
    return React.createElement("button", {
      key: opt,
      disabled: wrong || status === "right",
      className: `zh-opt${wrong ? " wrong" : ""}${right ? " right" : ""}`,
      onClick: () => handlePick(opt)
    }, opt);
  })), status !== "right" && wrongPicks.length > 0 && React.createElement("p", {
    className: "zh-encour"
  }, "Fast! Schau ins Zwanzigerfeld und probier nochmal. \uD83D\uDCAA"), unlocked && React.createElement("div", {
    className: "zh-modal",
    onClick: () => setUnlocked(null)
  }, React.createElement("div", {
    className: "zh-modalcard",
    onClick: e => e.stopPropagation()
  }, React.createElement(Confetti, {
    show: true
  }), React.createElement("p", {
    className: "zh-tag"
  }, "Du hast einen neuen Freund!"), React.createElement(Creature, {
    c: unlocked,
    size: 120,
    bob: true
  }), React.createElement("h3", {
    className: "zh-h2"
  }, unlocked.name), React.createElement("button", {
    className: "zh-primary",
    onClick: () => setUnlocked(null)
  }, "Juhu! \uD83C\uDF89"))), React.createElement(Styles, null));
}
function Shell({
  children,
  stars,
  soundUi,
  onSound
}) {
  return React.createElement("div", {
    className: "zh-root"
  }, React.createElement("header", {
    className: "zh-header"
  }, React.createElement("div", {
    className: "zh-logo"
  }, "\u2B50 ", stars), React.createElement("button", {
    className: "zh-soundbtn",
    onClick: onSound,
    "aria-label": "Ton an/aus"
  }, soundUi ? "🔊" : "🔇")), React.createElement("main", {
    className: "zh-main"
  }, children));
}
function Styles() {
  return React.createElement("style", null, `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@600;700;800&display=swap');
* { box-sizing: border-box; }
.zh-root{
  min-height: 100vh;
  font-family: 'Nunito', system-ui, sans-serif;
  color: #3A2E5C;
  background: linear-gradient(180deg,#FFE9C7 0%,#FFD6E0 45%,#CDEFFF 100%);
  display:flex; flex-direction:column;
}
.zh-header{ display:flex; justify-content:space-between; align-items:center; padding:14px 18px; }
.zh-logo{ font-family:'Baloo 2'; font-weight:800; font-size:24px; color:#fff;
  background:#FFC93C; padding:6px 18px; border-radius:999px; box-shadow:0 5px 0 #E0A800; }
.zh-soundbtn{ border:none; background:#fff; width:46px; height:46px; border-radius:999px;
  font-size:20px; box-shadow:0 4px 0 #d9d2ec; cursor:pointer; }
.zh-soundbtn:active{ transform:translateY(3px); box-shadow:0 1px 0 #d9d2ec; }
.zh-main{ width:100%; max-width:560px; margin:0 auto; padding:6px 18px 40px; flex:1; }

/* HERO */
.zh-hero{ text-align:center; padding:6px 0 10px; }
.zh-title{ font-family:'Baloo 2'; font-weight:800; font-size:44px; margin:6px 0 4px;
  color:#7C5CDC; letter-spacing:.5px; text-shadow:0 3px 0 rgba(255,255,255,.7); }
.zh-tag{ font-weight:700; color:#6b5e8a; margin:4px 0 0; font-size:16px; }

/* MODE CARDS */
.zh-modes{ display:flex; flex-direction:column; gap:14px; margin-top:18px; }
.zh-modecard{ display:flex; align-items:center; gap:14px; text-align:left; cursor:pointer;
  border:none; background:#fff; border-radius:26px; padding:16px 18px;
  box-shadow:0 7px 0 var(--c); transition:transform .08s; }
.zh-modecard:active{ transform:translateY(4px); box-shadow:0 3px 0 var(--c); }
.zh-modeemoji{ font-size:34px; width:56px; height:56px; display:flex; align-items:center;
  justify-content:center; background:var(--c); border-radius:18px; }
.zh-modetext{ display:flex; flex-direction:column; flex:1; }
.zh-modetext strong{ font-family:'Baloo 2'; font-size:22px; color:#3A2E5C; }
.zh-modetext small{ font-weight:700; color:#9387b3; font-size:13px; }
.zh-go{ font-family:'Baloo 2'; font-weight:800; color:#fff; background:var(--c);
  padding:8px 16px; border-radius:999px; font-size:16px; }
.zh-collectbtn{ width:100%; margin-top:18px; border:none; cursor:pointer; font-family:'Baloo 2';
  font-weight:700; font-size:18px; color:#7C5CDC; background:#fff; padding:14px; border-radius:22px;
  box-shadow:0 6px 0 #E7E0F7; }
.zh-collectbtn:active{ transform:translateY(3px); box-shadow:0 3px 0 #E7E0F7; }

/* HERO MODE CARD */
.zh-hcard{ width:100%; display:flex; align-items:center; gap:16px; text-align:left; cursor:pointer;
  border:none; background:#fff; border-radius:30px; padding:20px; margin-top:16px;
  box-shadow:0 9px 0 var(--c); transition:transform .08s; }
.zh-hcard:active{ transform:translateY(5px); box-shadow:0 4px 0 var(--c); }
.zh-hemoji{ font-size:40px; width:68px; height:68px; display:flex; align-items:center;
  justify-content:center; background:var(--c); border-radius:22px; }
.zh-hcard .zh-modetext strong{ font-size:25px; }
.zh-section{ font-family:'Baloo 2'; font-weight:700; color:#9387b3; font-size:15px;
  margin:22px 4px 0; text-transform:uppercase; letter-spacing:1px; }

/* FRIEND PROGRESS */
.zh-progress{ display:flex; align-items:center; gap:12px; background:#fff; border-radius:22px;
  padding:12px 16px; margin-top:14px; box-shadow:0 6px 0 #ECE5FA; }
.zh-progmini{ flex-shrink:0; }
.zh-progbody{ flex:1; }
.zh-progtop{ display:flex; justify-content:space-between; font-family:'Baloo 2'; font-weight:700;
  font-size:14px; color:#7C5CDC; margin-bottom:6px; }
.zh-bar{ height:14px; background:#EFEAF9; border-radius:999px; overflow:hidden; }
.zh-barfill{ height:100%; background:linear-gradient(90deg,#FFC93C,#FF8FAB);
  border-radius:999px; transition:width .5s ease; }

/* PLAY */
.zh-playtop{ display:flex; justify-content:space-between; align-items:center; margin-top:4px; }
.zh-back{ border:none; background:transparent; font-family:'Baloo 2'; font-weight:700;
  font-size:18px; color:#7C5CDC; cursor:pointer; padding:6px 4px; }
.zh-streak{ font-family:'Baloo 2'; font-weight:700; color:#FF6B6B; background:#fff;
  padding:6px 14px; border-radius:999px; box-shadow:0 4px 0 #ffd9d9; font-size:15px; }
.zh-problem{ background:#fff; border-radius:30px; padding:18px; margin-top:14px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  box-shadow:0 9px 0 #ECE5FA; }
.zh-problem.pop{ animation:pop .5s ease; }
.zh-equation{ display:flex; align-items:center; gap:10px; font-family:'Baloo 2'; font-weight:800;
  font-size:52px; color:#3A2E5C; }
.zh-op{ color:#B8A9E0; }
.zh-blank{ min-width:64px; text-align:center; color:#FF6B6B;
  border-bottom:6px dotted #FFC93C; line-height:1; }
.zh-helprow{ text-align:center; margin-top:14px; }
.zh-help{ border:none; cursor:pointer; font-family:'Baloo 2'; font-weight:700; font-size:17px;
  color:#3A2E5C; background:#FFE08A; padding:10px 22px; border-radius:999px; box-shadow:0 5px 0 #F2C84B; }
.zh-help:active{ transform:translateY(3px); box-shadow:0 2px 0 #F2C84B; }

/* TWENTY FRAME */
.zh-helpbox{ background:#fff; border-radius:24px; padding:18px 16px; margin-top:14px;
  box-shadow:0 7px 0 #ECE5FA; }
.zh-frame{ width:100%; max-width:380px; margin:0 auto; display:flex; flex-direction:column; gap:clamp(4px,1.6vw,8px); }
.zh-row{ display:flex; gap:clamp(3px,1.4vw,6px); }
.zh-cell{ flex:1 1 0; aspect-ratio:1; border:2px solid #E3DBF5; border-radius:9px;
  display:flex; align-items:center; justify-content:center; background:#FBFAFF; }
.zh-cell.mid{ margin-left:clamp(7px,3.2vw,15px); }
.zh-dot{ width:72%; aspect-ratio:1; border-radius:999px; display:flex; align-items:center;
  justify-content:center; color:#fff; font-weight:800; font-size:clamp(9px,3vw,14px);
  animation:dropin .3s ease both; }
.zh-dot-a{ background:#FF6B6B; }
.zh-dot-b{ background:#5AB2FF; }
.zh-dot-removed{ background:#D7CEE8; }
.zh-hinttext{ font-weight:800; text-align:center; color:#7C5CDC; font-size:17px; margin:14px 0 0; }

/* OPTIONS */
.zh-options{ display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:18px; }
.zh-opt{ font-family:'Baloo 2'; font-weight:800; font-size:34px; color:#3A2E5C;
  border:none; cursor:pointer; background:#fff; padding:22px 0; border-radius:24px;
  box-shadow:0 7px 0 #D9CFF2; transition:transform .08s; }
.zh-opt:active{ transform:translateY(4px); box-shadow:0 3px 0 #D9CFF2; }
.zh-opt.wrong{ background:#FFE2E2; color:#E04848; box-shadow:0 7px 0 #F4B8B8;
  animation:shake .4s; opacity:.85; }
.zh-opt.right{ background:#C9F5E5; color:#1B9C6E; box-shadow:0 7px 0 #8FE3C4; }
.zh-opt:disabled{ cursor:default; }
.zh-encour{ text-align:center; font-weight:800; color:#7C5CDC; margin-top:16px; font-size:16px; }

/* COLLECTION */
.zh-h2{ font-family:'Baloo 2'; font-weight:800; font-size:30px; color:#7C5CDC; text-align:center; margin:8px 0; }
.zh-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:18px; }
.zh-cardc{ background:#fff; border-radius:22px; padding:12px 6px; text-align:center;
  box-shadow:0 6px 0 #ECE5FA; display:flex; flex-direction:column; align-items:center; }
.zh-cardc span{ font-family:'Baloo 2'; font-weight:700; color:#9387b3; margin-top:4px; }
.zh-cardc.open span{ color:#3A2E5C; }

/* DONE */
.zh-done{ text-align:center; margin-top:20px; background:#fff; border-radius:30px; padding:26px;
  box-shadow:0 9px 0 #ECE5FA; }
.zh-bigcount{ font-family:'Baloo 2'; font-weight:800; font-size:72px; color:#FFC93C; margin:0;
  text-shadow:0 4px 0 #F2C84B33; }
.zh-donebtns{ display:flex; flex-direction:column; gap:12px; margin-top:18px; }
.zh-primary{ font-family:'Baloo 2'; font-weight:800; font-size:22px; color:#fff; border:none;
  cursor:pointer; background:#FF6B6B; padding:16px; border-radius:22px; box-shadow:0 6px 0 #E04848; }
.zh-primary:active{ transform:translateY(3px); box-shadow:0 3px 0 #E04848; }
.zh-ghost{ font-family:'Baloo 2'; font-weight:700; font-size:18px; color:#7C5CDC; border:none;
  cursor:pointer; background:#F0EBFB; padding:14px; border-radius:22px; }

/* MODAL */
.zh-modal{ position:fixed; inset:0; background:rgba(58,46,92,.45); display:flex;
  align-items:center; justify-content:center; padding:24px; z-index:50; }
.zh-modalcard{ position:relative; background:#fff; border-radius:30px; padding:28px;
  text-align:center; max-width:330px; width:100%; box-shadow:0 14px 0 #c9bff0; }

/* ANIM */
.zh-bob{ animation:bob 2.4s ease-in-out infinite; }
@keyframes bob{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-7px) } }
@keyframes pop{ 0%{ transform:scale(1) } 40%{ transform:scale(1.06) } 100%{ transform:scale(1) } }
@keyframes shake{ 0%,100%{ transform:translateX(0) } 20%{ transform:translateX(-7px) } 40%{ transform:translateX(7px) } 60%{ transform:translateX(-5px) } 80%{ transform:translateX(5px) } }
@keyframes dropin{ 0%{ transform:translateY(-12px) scale(.4); opacity:0 } 100%{ transform:translateY(0) scale(1); opacity:1 } }

/* CONFETTI */
.zh-confetti{ position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:40; }
.zh-confetti span{ position:absolute; top:-12px; width:11px; height:16px; border-radius:3px;
  animation:fall 1.5s ease-in forwards; }
@keyframes fall{ to{ transform:translateY(110vh) rotate(540deg); opacity:.2 } }

@media (prefers-reduced-motion: reduce){
  .zh-bob,.zh-confetti span,.zh-dot,.zh-problem.pop,.zh-opt.wrong{ animation:none !important; }
}
@media (max-width:420px){
  .zh-equation{ font-size:42px; }
  .zh-opt{ font-size:30px; padding:18px 0; }
}
`);
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));