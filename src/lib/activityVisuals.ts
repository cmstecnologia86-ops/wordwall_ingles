export type VisualInfo = {
  key: string;
  title: string;
  emoji: string;
  accentA: string;
  accentB: string;
  sceneTop: string;
  sceneBottom: string;
};

const VISUALS: VisualInfo[] = [
  {
    key: "wake-up",
    title: "Wake up",
    emoji: "⏰",
    accentA: "#f59e0b",
    accentB: "#f97316",
    sceneTop: "🛏️  ⏰",
    sceneBottom: "☀️  🙂"
  },
  {
    key: "get-up",
    title: "Get up",
    emoji: "⬆️",
    accentA: "#22c55e",
    accentB: "#14b8a6",
    sceneTop: "🛏️",
    sceneBottom: "🙂  ⬆️"
  },
  {
    key: "wash",
    title: "Wash",
    emoji: "🧼",
    accentA: "#38bdf8",
    accentB: "#0ea5e9",
    sceneTop: "🧼  🚰",
    sceneBottom: "🙂  ✨"
  },
  {
    key: "shower",
    title: "Have a shower",
    emoji: "🚿",
    accentA: "#06b6d4",
    accentB: "#3b82f6",
    sceneTop: "🚿  💧",
    sceneBottom: "🙂"
  },
  {
    key: "get-dressed",
    title: "Get dressed",
    emoji: "👕",
    accentA: "#8b5cf6",
    accentB: "#ec4899",
    sceneTop: "👕  👖",
    sceneBottom: "🙂  ✅"
  },
  {
    key: "put-on",
    title: "Put on",
    emoji: "🧢",
    accentA: "#a855f7",
    accentB: "#f97316",
    sceneTop: "🧥  👟",
    sceneBottom: "🙂  ⬇️"
  },
  {
    key: "take-off",
    title: "Take off",
    emoji: "🧥",
    accentA: "#ef4444",
    accentB: "#f97316",
    sceneTop: "🙂",
    sceneBottom: "🧥  ⬇️"
  },
  {
    key: "get-undressed",
    title: "Get undressed",
    emoji: "🧺",
    accentA: "#fb7185",
    accentB: "#f43f5e",
    sceneTop: "👕  ⬇️",
    sceneBottom: "🙂"
  },
  {
    key: "catch-bus",
    title: "Catch the bus",
    emoji: "🚌",
    accentA: "#facc15",
    accentB: "#f59e0b",
    sceneTop: "🚌",
    sceneBottom: "🙂  🏫"
  },
  {
    key: "homework",
    title: "Do homework",
    emoji: "📚",
    accentA: "#60a5fa",
    accentB: "#2563eb",
    sceneTop: "✏️  📚",
    sceneBottom: "🙂"
  },
  {
    key: "go-bed",
    title: "Go to bed",
    emoji: "🌙",
    accentA: "#1d4ed8",
    accentB: "#312e81",
    sceneTop: "🛏️  🌙",
    sceneBottom: "😴"
  },
  {
    key: "breakfast",
    title: "Have breakfast",
    emoji: "🍳",
    accentA: "#f59e0b",
    accentB: "#ef4444",
    sceneTop: "🍳  🥛",
    sceneBottom: "🙂"
  },
  {
    key: "default",
    title: "Vocabulary",
    emoji: "🧠",
    accentA: "#0ea5e9",
    accentB: "#6366f1",
    sceneTop: "📘  ✨",
    sceneBottom: "🙂"
  }
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getVisualInfo(input: string) {
  const text = normalize(input);

  if (text.includes("wake up")) return VISUALS[0];
  if (text.includes("get up")) return VISUALS[1];
  if (text.includes("have a shower") || text.includes("shower")) return VISUALS[3];
  if (text.includes("wash")) return VISUALS[2];
  if (text.includes("get dressed")) return VISUALS[4];
  if (text.includes("put on")) return VISUALS[5];
  if (text.includes("take off")) return VISUALS[6];
  if (text.includes("get undressed") || text.includes("undressed")) return VISUALS[7];
  if (text.includes("catch the bus") || text.includes("bus")) return VISUALS[8];
  if (text.includes("do homework") || text.includes("homework")) return VISUALS[9];
  if (text.includes("go to bed") || text.includes("bed")) return VISUALS[10];
  if (text.includes("breakfast")) return VISUALS[11];

  return VISUALS[12];
}

export function makeVisualDataUri(input: string, label?: string) {
  const visual = getVisualInfo(input);
  const safeLabel = escapeXml(label || visual.title);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 720 480">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${visual.accentA}" />
        <stop offset="100%" stop-color="${visual.accentB}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="rgba(15,23,42,0.35)" />
      </filter>
    </defs>

    <rect width="720" height="480" rx="42" fill="#eaf4ff"/>
    <rect x="22" y="22" width="676" height="436" rx="34" fill="url(#g)" filter="url(#shadow)"/>

    <circle cx="125" cy="110" r="78" fill="rgba(255,255,255,0.18)" />
    <circle cx="610" cy="88" r="48" fill="rgba(255,255,255,0.16)" />
    <circle cx="595" cy="360" r="72" fill="rgba(255,255,255,0.12)" />

    <text x="360" y="125" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="white">${safeLabel}</text>

    <text x="360" y="255" text-anchor="middle" font-size="108">${visual.emoji}</text>
    <text x="360" y="315" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="white">${escapeXml(visual.sceneTop)}</text>
    <text x="360" y="370" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,0.95)">${escapeXml(visual.sceneBottom)}</text>

    <rect x="58" y="400" width="604" height="38" rx="19" fill="rgba(255,255,255,0.18)" />
    <text x="360" y="426" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="white">Learn • Look • Play</text>
  </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}