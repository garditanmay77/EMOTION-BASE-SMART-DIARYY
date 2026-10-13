const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const MOODS_FILE = path.join(DATA_DIR, "moods.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
for (const file of [USERS_FILE, MOODS_FILE]) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");
}
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8"); }

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret-before-deployment",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 }
}));
app.use(express.static(path.join(__dirname, "public")));

function requireLogin(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Please log in first." });
  next();
}

app.post("/api/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (name.length < 2 || username.length < 3 || password.length < 6) {
    return res.status(400).json({ error: "Name must be 2+ characters, username 3+ characters, and password 6+ characters." });
  }
  const users = readJson(USERS_FILE);
  if (users.some(u => u.username === username)) return res.status(409).json({ error: "That username already exists. Please log in." });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), name, username, passwordHash };
  users.push(user);
  writeJson(USERS_FILE, users);
  req.session.userId = user.id;
  res.json({ ok: true, user: { name: user.name, username: user.username } });
});

app.post("/api/login", async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = readJson(USERS_FILE).find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }
  req.session.userId = user.id;
  res.json({ ok: true, user: { name: user.name, username: user.username } });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", requireLogin, (req, res) => {
  const user = readJson(USERS_FILE).find(u => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: "Session expired. Please log in again." });
  res.json({ name: user.name, username: user.username });
});

app.get("/api/moods", requireLogin, (req, res) => {
  const moods = readJson(MOODS_FILE)
    .filter(m => m.userId === req.session.userId)
    .sort((a, b) => b.date.localeCompare(a.date));
  res.json(moods);
});

app.post("/api/moods", requireLogin, (req, res) => {
  const allowed = ["Happy", "Calm", "Okay", "Stressed", "Sad", "Angry", "Tired"];
  const mood = String(req.body.mood || "");
  const note = String(req.body.note || "").trim().slice(0, 1000);
  const date = String(req.body.date || new Date().toISOString().slice(0, 10));
  if (!allowed.includes(mood)) return res.status(400).json({ error: "Please select a valid mood." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "Please select a valid date." });
  const moods = readJson(MOODS_FILE);
  const entry = { id: Date.now().toString(), userId: req.session.userId, mood, note, date, createdAt: new Date().toISOString() };
  moods.push(entry);
  writeJson(MOODS_FILE, moods);
  res.json({ ok: true, entry });
});

app.post("/api/chat", requireLogin, (req, res) => {
  const message = String(req.body.message || "").trim().slice(0, 500);
  if (!message) return res.status(400).json({ error: "Write a message first." });
  const lower = message.toLowerCase();
  let reply = "Thanks for sharing that with me. Take one slow breath, relax your shoulders, and choose one small thing you can do for yourself right now.";
  if (/sad|dukhi|वाईट|रड|lonely|alone|upset/.test(lower)) {
    reply = "I'm sorry you're feeling this way. You don't have to fix everything at once. Try listening to a comforting song, drinking some water, or messaging someone you trust. Want to write one thing that has been weighing on you?";
  } else if (/stress|tension|anxious|घाबर|pressure|exam/.test(lower)) {
    reply = "That sounds stressful. Try this: breathe in gently for 4 counts and out for 6 counts, repeat 5 times, then pick just the next small task. A short walk or a break may help too.";
  } else if (/happy|good|छान|mast|great|excited/.test(lower)) {
    reply = "That's lovely! 🌟 Write down what made today good so you can look back at it later. What was the best part of your day?";
  } else if (/joke|funny| विनोद/.test(lower)) {
    reply = "Why did the computer go to the doctor? Because it had a virus! 😄";
  } else if (/song|music|गाण/.test(lower)) {
    reply = "Try a song that feels comforting to you, or search for an acoustic / lo-fi playlist. Pick music that suits your mood rather than forcing yourself to feel cheerful.";
  } else if (/help|support|मदत/.test(lower)) {
    reply = "I can listen and suggest simple mood-care ideas, but I'm not a therapist. If things feel overwhelming, please reach out to a trusted person or a qualified mental-health professional.";
  }
  res.json({ reply });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Emotion Base Smart Diary is running at http://localhost:${PORT}`));
