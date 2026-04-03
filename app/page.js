"use client";
import { useState, useEffect, useRef } from "react";

const PLAYER_COLORS = [
  { name: "Crimson",  bg: "#7C0A02", text: "#FFD6D6", accent: "#FF4444" },
  { name: "Cobalt",   bg: "#0A1F7C", text: "#D6DFFF", accent: "#4488FF" },
  { name: "Emerald",  bg: "#0A5C2A", text: "#D6FFE4", accent: "#44FF88" },
  { name: "Amber",    bg: "#7C4A00", text: "#FFF0D6", accent: "#FFA833" },
  { name: "Violet",   bg: "#3D0A7C", text: "#EDD6FF", accent: "#AA44FF" },
  { name: "Teal",     bg: "#0A5C5C", text: "#D6FFFF", accent: "#33FFEE" },
  { name: "Rose",     bg: "#7C0A4A", text: "#FFD6EE", accent: "#FF44AA" },
  { name: "Slate",    bg: "#1A2A3A", text: "#D6E8FF", accent: "#88BBDD" },
  { name: "Olive",    bg: "#4A5C0A", text: "#F0FFD6", accent: "#AADD33" },
  { name: "Maroon",   bg: "#5C1A0A", text: "#FFE0D6", accent: "#FF6644" },
  { name: "Indigo",   bg: "#0A0A6A", text: "#D6D6FF", accent: "#6666FF" },
  { name: "Jade",     bg: "#0A4A3A", text: "#D6FFF5", accent: "#33FFCC" },
  { name: "Bronze",   bg: "#5C3A0A", text: "#FFF0D6", accent: "#DD9944" },
  { name: "Plum",     bg: "#5C0A5C", text: "#FFD6FF", accent: "#FF44FF" },
  { name: "Steel",    bg: "#2A3A4A", text: "#D6EEFF", accent: "#66AACC" },
  { name: "Sienna",   bg: "#6A2A0A", text: "#FFE8D6", accent: "#FF8855" },
  { name: "Navy",     bg: "#0A0A4A", text: "#D6D6FF", accent: "#4455FF" },
  { name: "Forest",   bg: "#1A4A1A", text: "#D6FFD6", accent: "#55CC55" },
  { name: "Copper",   bg: "#7C3A1A", text: "#FFEEDD", accent: "#EE8844" },
  { name: "Midnight", bg: "#0A0A1A", text: "#D6D6EE", accent: "#8888CC" },
];

const ACTION_CARDS = [
  {
    id: "steal", name: "STEAL", symbol: "⚔",
    color: "#CC0000", glow: "#FF3333",
    bg: "linear-gradient(135deg, #3A0000 0%, #7C0000 50%, #3A0000 100%)",
    border: "#CC0000", desc: "Take all tokens from one player", tagline: "What's yours is mine.",
  },
  {
    id: "share", name: "SHARE", symbol: "✦",
    color: "#00AACC", glow: "#33DDFF",
    bg: "linear-gradient(135deg, #002233 0%, #005577 50%, #002233 100%)",
    border: "#0099CC", desc: "Split tokens evenly with an ally", tagline: "Together we rise.",
  },
  {
    id: "grab", name: "GRAB & GO", symbol: "◆",
    color: "#BB8800", glow: "#FFD700",
    bg: "linear-gradient(135deg, #2A1A00 0%, #6A4400 50%, #2A1A00 100%)",
    border: "#CC9900", desc: "Take exactly one token and flee", tagline: "Greed is speed.",
  },
  {
    id: "ambush", name: "AMBUSH", symbol: "🗡",
    color: "#e5e6e5", glow: "#ffffff",
    bg: "linear-gradient(135deg, #585858 0%, #6f726f 50%, #6b6969 100%)",
    border: "#ffffff", desc: "Strike before anyone can react", tagline: "Strike from the shadows.",
  },
];

function GoldCoin({ size = 44 }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "radial-gradient(circle at 35% 30%, #FFF176, #FFD700 40%, #B8860B 80%, #7A5800)",
      boxShadow: `0 2px 6px rgba(0,0,0,0.6), inset 0 1px 3px rgba(255,255,200,0.5), 0 0 ${size/2}px rgba(255,215,0,0.4)`,
      border: "2px solid #B8860B", fontSize: size * 0.4,
    }}>⬡</span>
  );
}

export default function DeadLastGame() {
  const [nameInput, setNameInput]     = useState("");
  const [players, setPlayers]         = useState([]);
  const [started, setStarted]         = useState(false);
  const [zoomedCard, setZoomedCard]   = useState(null);
  const [shake, setShake]             = useState(false);

  // Gold coin state
  const [goldCount, setGoldCount]     = useState("");   // number of rolls input
  const [goldTotal, setGoldTotal]     = useState(0);    // cumulative coins
  const [goldLast, setGoldLast]       = useState(null); // coins from most recent roll
  const [goldSpinning, setGoldSpinning] = useState(false);
  const [goldShake, setGoldShake]     = useState(false);
  const [goldRolled, setGoldRolled]   = useState(false);

  const nameRef = useRef(null);

  const addPlayer = () => {
    const name = nameInput.trim();
    if (!name) return;
    if (players.length >= 20) { triggerShake(); return; }
    if (players.find(p => p.name.toLowerCase() === name.toLowerCase())) { triggerShake(); return; }
    setPlayers(prev => [...prev, { name, color: PLAYER_COLORS[prev.length] }]);
    setNameInput("");
    nameRef.current?.focus();
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };
  const removePlayer = (i) => setPlayers(prev => prev.filter((_, idx) => idx !== i));
  const handleKey = (e) => { if (e.key === "Enter") addPlayer(); };

  const openZoom  = (type, data) => setZoomedCard({ type, data });
  const closeZoom = () => setZoomedCard(null);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") closeZoom(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Roll goldCount times, each 0–3, sum and add to running total
  const handleGoldRoll = () => {
    const n = parseInt(goldCount, 10);
    if (!goldCount || isNaN(n) || n < 1) {
      setGoldShake(true);
      setTimeout(() => setGoldShake(false), 500);
      return;
    }
    setGoldSpinning(true);
    setTimeout(() => {
      let gained = 0;
      for (let i = 0; i < n; i++) gained += Math.floor(Math.random() * 4);
      setGoldLast(gained);
      setGoldTotal(prev => prev + gained);
      setGoldRolled(true);
      setGoldSpinning(false);
      setGoldCount("");
    }, 900);
  };

  const handleGoldKey = (e) => { if (e.key === "Enter") handleGoldRoll(); };

  const resetGold = () => {
    setGoldCount(""); setGoldTotal(0);
    setGoldLast(null); setGoldRolled(false); setGoldSpinning(false);
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body {
      background: #080808; font-family: 'Crimson Pro', serif;
      min-height: 100vh; color: #E8DCC8;
      -webkit-text-size-adjust: 100%; overflow-x: hidden;
    }
    .root {
      min-height: 100vh;
      background:
        radial-gradient(ellipse 80% 50% at 50% 0%, #1a0a0a, transparent 70%),
        radial-gradient(ellipse 60% 40% at 20% 100%, #0a0a1a, transparent 60%),
        #060606;
      padding: 0 0 80px;
    }
    .header { text-align: center; padding: 36px 16px 24px; }
    .header::after {
      content: ''; display: block; width: 160px; height: 1px;
      background: linear-gradient(90deg, transparent, #8B0000, transparent);
      margin: 16px auto 0;
    }
    .title {
      font-family: 'Cinzel Decorative', cursive;
      font-size: clamp(1.8rem, 10vw, 4rem); font-weight: 900;
      background: linear-gradient(180deg, #FFD700 0%, #CC8800 40%, #8B5500 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      filter: drop-shadow(0 0 24px rgba(200,120,0,0.4));
    }
    .subtitle {
      font-family: 'Cinzel', serif; font-size: clamp(0.55rem, 3vw, 0.85rem);
      letter-spacing: 0.35em; color: #8B6A4A; margin-top: 6px; text-transform: uppercase;
    }
    .setup { max-width: 520px; margin: 0 auto; padding: 0 16px; }
    .count-label {
      font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.25em;
      color: #5A4A3A; text-align: right; margin-bottom: 6px;
    }
    .input-row { display: flex; gap: 8px; margin-bottom: 14px; }
    .name-input {
      flex: 1; min-width: 0;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(139,90,60,0.4);
      border-radius: 6px; padding: 13px 14px;
      font-family: 'Crimson Pro', serif; font-size: 1rem; color: #E8DCC8;
      outline: none; transition: border-color 0.2s, box-shadow 0.2s; -webkit-appearance: none;
    }
    .name-input::placeholder { color: #5A4A3A; }
    .name-input:focus { border-color: #8B0000; box-shadow: 0 0 14px rgba(139,0,0,0.3); }
    .name-input.shake { animation: shake 0.4s ease; border-color: #FF4444; }
    @keyframes shake {
      0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px); }
      40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); }
    }
    .btn {
      font-family: 'Cinzel', serif; font-size: 0.72rem; letter-spacing: 0.18em;
      text-transform: uppercase; border: none; border-radius: 6px; padding: 13px 16px;
      cursor: pointer; transition: all 0.15s; white-space: nowrap;
      touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none;
    }
    .btn-add { background: linear-gradient(135deg, #5A0000, #8B0000); color: #FFD6D6; border: 1px solid #AA2222; }
    .btn-add:active { transform: scale(0.95); }
    .btn-start {
      width: 100%; background: linear-gradient(135deg, #3A2200, #6A4400, #3A2200);
      color: #FFD700; border: 1px solid #886600; font-size: 0.82rem; padding: 16px;
      letter-spacing: 0.3em; margin-top: 12px; position: relative; overflow: hidden;
    }
    .btn-start:active { transform: scale(0.98); }
    .btn-start:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
    .player-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; min-height: 30px; }
    .player-chip {
      display: flex; align-items: center; gap: 6px; padding: 5px 10px 5px 8px;
      border-radius: 4px; font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.08em;
      animation: chipIn 0.2s ease;
    }
    @keyframes chipIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
    .chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .chip-remove {
      background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 0.62rem;
      line-height: 1; padding: 0 0 0 3px; color: inherit; touch-action: manipulation;
      min-width: 20px; min-height: 20px; display: flex; align-items: center;
    }
    .chip-remove:active { opacity: 1; }
    .divider {
      display: flex; align-items: center; gap: 14px;
      margin: 28px auto; max-width: 520px; padding: 0 16px;
    }
    .divider-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #3A2A1A, transparent); }
    .divider-icon { color: #6A4A2A; font-size: 0.9rem; }
    .board { max-width: 860px; margin: 0 auto; padding: 0 10px; }
    .section-title {
      font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 0.38em;
      color: #5A4A3A; text-transform: uppercase; margin-bottom: 18px; text-align: center;
    }
    .cards-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 10px; margin-bottom: 36px;
    }
    @media (max-width: 360px) { .cards-grid { grid-template-columns: repeat(3, 1fr); gap: 7px; } }
    .player-card {
      aspect-ratio: 2/3; border-radius: 8px; border: 1px solid; cursor: pointer;
      position: relative; overflow: hidden; display: flex; flex-direction: column;
      align-items: center; justify-content: center; animation: cardDeal 0.35s ease both;
      touch-action: manipulation; -webkit-tap-highlight-color: transparent;
      transition: transform 0.18s; user-select: none;
    }
    @media (hover: hover) { .player-card:hover { transform: translateY(-5px) scale(1.03); z-index: 2; } }
    .player-card:active { transform: scale(0.96); }
    @keyframes cardDeal {
      from { opacity: 0; transform: translateY(20px) rotate(-2deg); } to { opacity: 1; transform: none; }
    }
    .player-card:nth-child(1){animation-delay:0.04s} .player-card:nth-child(2){animation-delay:0.08s}
    .player-card:nth-child(3){animation-delay:0.12s} .player-card:nth-child(4){animation-delay:0.16s}
    .player-card:nth-child(5){animation-delay:0.20s} .player-card:nth-child(n+6){animation-delay:0.24s}
    .card-watermark {
      position: absolute; font-size: 4rem; opacity: 0.07; font-family: 'Cinzel Decorative', cursive;
      font-weight: 900; top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none;
    }
    .card-corner {
      position: absolute; font-family: 'Cinzel', serif; font-size: 0.44rem; letter-spacing: 0.06em;
      opacity: 0.4; line-height: 1.3; text-align: center;
    }
    .card-corner.tl { top: 7px; left: 7px; }
    .card-corner.br { bottom: 7px; right: 7px; transform: rotate(180deg); }
    .card-name {
      font-family: 'Cinzel', serif; font-size: clamp(0.55rem, 2.8vw, 0.82rem); font-weight: 700;
      letter-spacing: 0.08em; text-align: center; text-transform: uppercase; padding: 0 7px;
      word-break: break-word; line-height: 1.4; position: relative; z-index: 1;
    }
    .card-color-label {
      font-family: 'Crimson Pro', serif; font-size: 0.54rem; letter-spacing: 0.16em;
      opacity: 0.5; margin-top: 5px; text-transform: uppercase; position: relative; z-index: 1;
    }
    .action-cards-row {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 8px; max-width: 560px; margin: 0 auto;
    }
    @media (max-width: 440px) {
      .action-cards-row { grid-template-columns: repeat(2, 1fr); max-width: 260px; gap: 10px; }
    }
    .action-card {
      aspect-ratio: 2/3; border-radius: 8px; border: 1px solid; cursor: pointer;
      position: relative; overflow: hidden; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 7px;
      animation: cardDeal 0.4s ease 0.5s both; touch-action: manipulation;
      -webkit-tap-highlight-color: transparent; transition: transform 0.18s; user-select: none;
    }
    @media (hover: hover) { .action-card:hover { transform: translateY(-6px) scale(1.04); } }
    .action-card:active { transform: scale(0.96); }
    .action-card-symbol {
      font-size: clamp(1.2rem, 5vw, 2rem); position: relative; z-index: 1;
      filter: drop-shadow(0 0 8px currentColor);
    }
    .action-card-name {
      font-family: 'Cinzel Decorative', cursive; font-size: clamp(0.4rem, 1.8vw, 0.65rem);
      font-weight: 700; letter-spacing: 0.06em; text-align: center;
      position: relative; z-index: 1; padding: 0 5px; line-height: 1.3;
    }
    .action-card-shine {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%);
      pointer-events: none;
    }

    /* ── GOLD SECTION ── */
    .gold-section { max-width: 400px; margin: 0 auto; padding: 0 16px; }
    .gold-box {
      border: 1px solid #886600; border-radius: 10px;
      background: linear-gradient(135deg, #1A1000, #2A1E00);
      padding: 22px 18px;
      box-shadow: 0 0 28px rgba(180,140,0,0.14), inset 0 1px 0 rgba(255,215,0,0.08);
    }
    .gold-title {
      font-family: 'Cinzel Decorative', cursive; font-size: 0.95rem; color: #FFD700;
      text-align: center; margin-bottom: 5px; filter: drop-shadow(0 0 10px rgba(255,215,0,0.35));
    }
    .gold-sub {
      font-family: 'Crimson Pro', serif; font-style: italic; font-size: 0.78rem;
      color: #8B7A3A; text-align: center; margin-bottom: 18px; line-height: 1.5;
    }

    /* running total display */
    .gold-total-row {
      background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.15);
      border-radius: 8px; padding: 14px 12px; margin-bottom: 14px; min-height: 72px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .gold-total-coins {
      display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; align-items: center;
    }
    .gold-overflow {
      font-family: 'Cinzel Decorative', cursive; font-size: 1.1rem; color: #FFD700;
      filter: drop-shadow(0 0 8px rgba(255,215,0,0.5));
    }
    .gold-total-label {
      display: flex; flex-direction: column; align-items: center; gap: 2px; width: 100%;
    }
    .gold-total-num {
      font-family: 'Cinzel Decorative', cursive; font-size: 1.8rem; color: #FFD700; line-height: 1;
      filter: drop-shadow(0 0 14px rgba(255,215,0,0.55));
    }
    .gold-total-text {
      font-family: 'Cinzel', serif; font-size: 0.58rem; letter-spacing: 0.3em;
      color: #8B7A3A; text-transform: uppercase;
    }
    .gold-last-gained {
      font-family: 'Crimson Pro', serif; font-size: 0.78rem; font-style: italic;
      color: #AACC55; margin-top: 2px; animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    /* input row */
    .gold-input-row { display: flex; gap: 8px; align-items: stretch; }
    .gold-input {
      flex: 1; min-width: 0;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(180,140,0,0.4);
      border-radius: 6px; padding: 13px 14px; font-family: 'Crimson Pro', serif;
      font-size: 1rem; color: #E8DCC8; outline: none;
      transition: border-color 0.2s, box-shadow 0.2s; -webkit-appearance: none;
      display: block;
    }
    .gold-input::placeholder { color: #5A4A2A; }
    .gold-input:focus { border-color: #FFD700; box-shadow: 0 0 12px rgba(255,215,0,0.18); }
    .gold-input.shake { animation: shake 0.4s ease; border-color: #FF4444; }

    .btn-gold {
      background: linear-gradient(135deg, #4A3000, #886600, #4A3000);
      color: #FFD700; border: 1px solid #AA8800;
      font-family: 'Cinzel', serif; font-size: 0.75rem; letter-spacing: 0.2em;
      text-transform: uppercase; padding: 13px 16px; border-radius: 6px;
      cursor: pointer; transition: all 0.15s; touch-action: manipulation;
      -webkit-tap-highlight-color: transparent; user-select: none; white-space: nowrap;
    }
    .btn-gold:active { transform: scale(0.96); }
    .btn-gold:disabled { opacity: 0.6; cursor: wait; }

    @keyframes coinSpin {
      0%   { transform: rotateY(0deg) scale(1.1); }
      50%  { transform: rotateY(180deg) scale(0.9); }
      100% { transform: rotateY(360deg) scale(1.1); }
    }
    .coin-spin { display: inline-block; animation: coinSpin 0.55s ease-in-out infinite; }

    .btn-reset {
      width: 100%; margin-top: 10px;
      background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.2);
      color: #886600; font-family: 'Cinzel', serif; font-size: 0.65rem;
      letter-spacing: 0.22em; text-transform: uppercase; padding: 10px;
      border-radius: 5px; cursor: pointer; transition: all 0.15s; touch-action: manipulation;
    }
    .btn-reset:active { transform: scale(0.97); background: rgba(255,215,0,0.1); }

    /* ── ZOOM ── */
    .zoom-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 200;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.18s ease; backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px); padding: 20px;
    }
    .zoom-wrapper { position: relative; display: inline-flex; flex-direction: column; align-items: center; }
    .zoom-card {
      width: min(250px, 68vw); aspect-ratio: 2/3; border-radius: 14px; border: 2px solid;
      position: relative; overflow: hidden; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
      animation: zoomIn 0.3s cubic-bezier(0.34,1.56,0.64,1); cursor: default;
    }
    @keyframes zoomIn {
      from { opacity:0; transform:scale(0.5) rotate(-4deg); } to { opacity:1; transform:none; }
    }
    .zoom-card .card-watermark { font-size: 7rem; }
    .zoom-card-name {
      font-family: 'Cinzel Decorative', cursive; font-size: clamp(0.85rem, 5vw, 1.4rem);
      font-weight: 900; letter-spacing: 0.08em; text-align: center; padding: 0 12px;
      position: relative; z-index: 1; word-break: break-word; line-height: 1.3;
    }
    .zoom-card-sub {
      font-family: 'Crimson Pro', serif; font-size: 0.85rem; font-style: italic;
      opacity: 0.6; text-align: center; position: relative; z-index: 1;
      padding: 0 14px; line-height: 1.4;
    }
    .zoom-card-symbol { font-size: 3.2rem; position: relative; z-index: 1; filter: drop-shadow(0 0 16px currentColor); }
    .zoom-tagline {
      font-family: 'Cinzel', serif; font-size: 0.62rem; letter-spacing: 0.2em;
      text-transform: uppercase; opacity: 0.7; position: relative; z-index: 1;
      padding: 0 12px; text-align: center;
    }
    .zoom-close {
      position: absolute; top: -44px; right: 0;
      background: none; border: 1px solid rgba(255,255,255,0.2); border-radius: 50%;
      width: 34px; height: 34px; color: rgba(255,255,255,0.6); font-size: 0.9rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s; touch-action: manipulation;
    }
    .zoom-close:active { background: rgba(255,255,255,0.15); transform: scale(0.95); }
    .zoom-hint {
      margin-top: 14px; font-family: 'Cinzel', serif; font-size: 0.52rem;
      letter-spacing: 0.28em; color: rgba(255,255,255,0.22); text-transform: uppercase;
    }
    .zoom-card .action-card-shine { display: block; }
    .reveal-zero { font-family: 'Crimson Pro', serif; font-style: italic; color: #5A4A2A; font-size: 0.85rem; }
  `;

  return (
    <>
      <style>{CSS}</style>
      <div className="root">

        {/* HEADER */}
        <header className="header">
          <div className="title">DEAD LAST</div>
          <div className="subtitle">The Betrayal Card Game</div>
        </header>

        {/* SETUP */}
        {!started && (
          <div className="setup">
            <div className="count-label">{players.length} / 20 PLAYERS</div>
            <div className="input-row">
              <input
                ref={nameRef}
                className={`name-input${shake ? " shake" : ""}`}
                placeholder="Enter player name…"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={handleKey}
                maxLength={24}
                autoComplete="off"
                autoCapitalize="words"
              />
              <button className="btn btn-add" onClick={addPlayer}>＋ ADD</button>
            </div>
            <div className="player-list">
              {players.map((p, i) => (
                <div key={i} className="player-chip"
                  style={{ background: p.color.bg, color: p.color.text, border: `1px solid ${p.color.accent}44` }}>
                  <span className="chip-dot" style={{ background: p.color.accent }} />
                  {p.name}
                  <button className="chip-remove" onClick={() => removePlayer(i)} style={{ color: p.color.text }}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn btn-start" onClick={() => { setStarted(true); resetGold(); }} disabled={players.length < 2}>
              ⚜ BEGIN THE GAME ⚜
            </button>
          </div>
        )}

        {/* BOARD */}
        {started && (
          <div className="board">

            {/* Player cards */}
            <div className="section-title">⚔ Players ⚔</div>
            <div className="cards-grid">
              {players.map((p, i) => (
                <div key={i} className="player-card" onClick={() => openZoom("player", p)}
                  style={{
                    background: `radial-gradient(ellipse at 35% 30%, ${p.color.accent}22, ${p.color.bg} 70%)`,
                    borderColor: p.color.accent + "66", color: p.color.text,
                    boxShadow: `0 3px 16px ${p.color.accent}1A, inset 0 1px 0 ${p.color.accent}2A`,
                  }}>
                  <div className="card-watermark" style={{ color: p.color.accent }}>{p.name[0].toUpperCase()}</div>
                  <div className="card-corner tl">{String(i+1).padStart(2,"0")}<br/>{p.color.name.toUpperCase()}</div>
                  <div className="card-corner br">{String(i+1).padStart(2,"0")}<br/>{p.color.name.toUpperCase()}</div>
                  <div className="card-name">{p.name}</div>
                  <div className="card-color-label">{p.color.name}</div>
                </div>
              ))}
            </div>

            <div className="divider">
              <div className="divider-line"/><div className="divider-icon">✦</div><div className="divider-line"/>
            </div>

            {/* Action cards */}
            <div className="section-title">⚜ Action Cards ⚜</div>
            <div className="action-cards-row">
              {ACTION_CARDS.map(ac => (
                <div key={ac.id} className="action-card" onClick={() => openZoom("action", ac)}
                  style={{
                    background: ac.bg, borderColor: ac.border + "99", color: ac.color,
                    boxShadow: `0 3px 20px ${ac.glow}22, inset 0 1px 0 ${ac.glow}18`,
                  }}>
                  <div className="action-card-shine"/>
                  <div className="action-card-symbol" style={{ color: ac.color }}>{ac.symbol}</div>
                  <div className="action-card-name"   style={{ color: ac.color }}>{ac.name}</div>
                </div>
              ))}
            </div>

            <div className="divider">
              <div className="divider-line"/><div className="divider-icon">⬡</div><div className="divider-line"/>
            </div>

            {/* GOLD COIN DRAW */}
            <div className="gold-section">
              <div className="section-title">⬡ Gold Coin Draw ⬡</div>
              <div className="gold-box">
                <div className="gold-title">Gold Coin Draw</div>
                <div className="gold-sub">
                  Enter how many times to roll, then tap Roll — each roll gives 0–3 coins, and they stack up!
                </div>

                {/* Running total */}
                <div className="gold-total-row">
                  <div className="gold-total-coins">
                    {goldTotal === 0
                      ? <span className="reveal-zero">No coins yet</span>
                      : <>
                          {Array.from({ length: Math.min(goldTotal, 12) }).map((_, i) => (
                            <GoldCoin key={i} size={36} />
                          ))}
                          {goldTotal > 12 && (
                            <span className="gold-overflow">+{goldTotal - 12}</span>
                          )}
                        </>
                    }
                  </div>
                  {goldRolled && (
                    <div className="gold-total-label">
                      <span className="gold-total-num">{goldTotal}</span>
                      <span className="gold-total-text">total coins</span>
                      {goldLast !== null && (
                        <span className="gold-last-gained" key={goldTotal}>
                          {goldLast > 0 ? `+${goldLast} this roll` : "±0 this roll"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Roll input */}
                <div className="gold-input-row">
                  <input
                    className={`gold-input${goldShake ? " shake" : ""}`}
                    type="number"
                    inputMode="numeric"
                    placeholder="# of rolls…"
                    value={goldCount}
                    onChange={e => setGoldCount(e.target.value)}
                    onKeyDown={handleGoldKey}
                    min="1" max="99"
                  />
                  <button className="btn-gold" onClick={handleGoldRoll} disabled={goldSpinning}>
                    {goldSpinning ? <span className="coin-spin">⬡</span> : "Roll ✦"}
                  </button>
                </div>

                {goldRolled && (
                  <button className="btn-reset" onClick={resetGold}>↺ Reset Coins</button>
                )}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 36 }}>
              <button className="btn btn-start" style={{ width: "auto", padding: "12px 32px" }}
                onClick={() => { setStarted(false); resetGold(); }}>
                ← Back to Setup
              </button>
            </div>
          </div>
        )}

        {/* ZOOM OVERLAY */}
        {zoomedCard && (
          <div className="zoom-overlay" onClick={closeZoom}>
            <div className="zoom-wrapper" onClick={e => e.stopPropagation()}>
              <button className="zoom-close" onClick={closeZoom}>✕</button>

              {zoomedCard.type === "player" && (() => {
                const p = zoomedCard.data;
                return (
                  <div className="zoom-card" style={{
                    background: `radial-gradient(ellipse at 30% 25%, ${p.color.accent}33, ${p.color.bg} 65%)`,
                    borderColor: p.color.accent, color: p.color.text,
                    boxShadow: `0 0 50px ${p.color.accent}55, 0 0 100px ${p.color.accent}1A`,
                  }}>
                    <div className="card-watermark" style={{ color: p.color.accent }}>{p.name[0].toUpperCase()}</div>
                    <div className="zoom-card-name" style={{ color: p.color.accent }}>{p.name}</div>
                    <div className="zoom-card-sub">{p.color.name} Team</div>
                    <div className="zoom-tagline" style={{ color: p.color.accent + "AA" }}>Trust No One</div>
                  </div>
                );
              })()}

              {zoomedCard.type === "action" && (() => {
                const ac = zoomedCard.data;
                return (
                  <div className="zoom-card" style={{
                    background: ac.bg, borderColor: ac.color, color: ac.color,
                    boxShadow: `0 0 50px ${ac.glow}55, 0 0 100px ${ac.glow}1A`,
                  }}>
                    <div className="action-card-shine"/>
                    <div className="zoom-card-symbol" style={{ color: ac.color }}>{ac.symbol}</div>
                    <div className="zoom-card-name"   style={{ color: ac.color }}>{ac.name}</div>
                    <div className="zoom-card-sub"    style={{ color: ac.color + "99" }}>{ac.desc}</div>
                    <div className="zoom-tagline"     style={{ color: ac.color + "BB" }}>{ac.tagline}</div>
                  </div>
                );
              })()}

              <div className="zoom-hint">Tap outside or ESC to close</div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
