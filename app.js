const $ = id => document.getElementById(id);
const moodMeta = {
  Happy: { emoji: "😊", color: "#f1c75b" }, Calm: { emoji: "😌", color: "#82cdb5" },
  Okay: { emoji: "🙂", color: "#9b91e8" }, Stressed: { emoji: "😵‍💫", color: "#eea66b" },
  Sad: { emoji: "😔", color: "#82a9df" }, Angry: { emoji: "😠", color: "#e68c9a" },
  Tired: { emoji: "😴", color: "#b1a0d9" }
};
const jokes = [
  "Why did the computer go to the doctor? Because it had a virus! 😄",
  "Why was the maths book sad? It had too many problems. 📘",
  "What do you call a sleeping dinosaur? A dino-snore! 🦖",
  "Why did the student eat their homework? The teacher said it was a piece of cake! 🍰",
  "What did one wall say to the other wall? I'll meet you at the corner! 😆"
];
const music = {
  calm: "Try soft instrumental, rain sounds, or a gentle acoustic playlist. Take a slow breath while you listen.",
  happy: "Try an upbeat Bollywood, Marathi favourites, or feel-good pop playlist. Choose songs you already love.",
  sad: "Try comforting acoustic songs or a gentle playlist that lets you feel what you feel. You don't need to force a smile.",
  focus: "Try lo-fi beats, instrumental music, or quiet ambient sounds for a calm study session."
};
let authMode = "login", selectedMood = "", currentUser = null, allMoods = [];

function setAuthMode(mode) {
  authMode = mode;
  $("loginTab").classList.toggle("active", mode === "login");
  $("registerTab").classList.toggle("active", mode === "register");
  $("name").classList.toggle("hidden", mode !== "register");
  $("nameLabel").classList.toggle("hidden", mode !== "register");
  $("name").required = mode === "register";
  $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("authSubtitle").textContent = mode === "login" ? "Sign in to continue your diary." : "Start your personal mood diary.";
  $("authSubmit").innerHTML = mode === "login" ? 'Login <span>→</span>' : 'Create account <span>→</span>';
  $("authError").textContent = "";
}
$("loginTab").addEventListener("click", () => setAuthMode("login"));
$("registerTab").addEventListener("click", () => setAuthMode("register"));

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: "same-origin", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
$("authForm").addEventListener("submit", async e => {
  e.preventDefault(); $("authError").textContent = "";
  const body = { username: $("username").value, password: $("password").value };
  if (authMode === "register") body.name = $("name").value;
  try {
    const result = await api(authMode === "login" ? "/api/login" : "/api/register", { method: "POST", body: JSON.stringify(body) });
    currentUser = result.user; await showApp();
  } catch (err) { $("authError").textContent = err.message; }
});
$("logoutBtn").addEventListener("click", async () => {
  try { await api("/api/logout", { method: "POST", body: "{}" }); } catch {}
  $("appView").classList.add("hidden"); $("authView").classList.remove("hidden");
  $("password").value = ""; setAuthMode("login");
});

async function init() {
  try { currentUser = await api("/api/me"); await showApp(); } catch { /* logged out */ }
}
async function showApp() {
  $("authView").classList.add("hidden"); $("appView").classList.remove("hidden");
  $("welcomeText").textContent = `Hi, ${currentUser.name} ♡`;
  $("todayDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  $("reportMonth").value = new Date().toISOString().slice(0, 7);
  await loadMoods(); showPage("overview");
}
async function loadMoods() {
  try { allMoods = await api("/api/moods"); renderRecent(); renderDiary(); renderReport(); }
  catch (err) { console.error(err); }
}
function showPage(page) {
  document.querySelectorAll(".page").forEach(el => el.classList.add("hidden"));
  $(`page-${page}`).classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  if (page === "monthly") renderReport();
}
document.querySelectorAll(".nav-btn").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.goto)));

document.querySelectorAll(".mood-choice").forEach(btn => btn.addEventListener("click", () => {
  selectedMood = btn.dataset.mood;
  document.querySelectorAll(".mood-choice").forEach(b => b.classList.toggle("selected", b === btn));
  $("selectedMoodLabel").textContent = `${moodMeta[selectedMood].emoji} ${selectedMood} selected`;
  $("saveMoodBtn").disabled = false; $("moodError").textContent = "";
}));
$("saveMoodBtn").addEventListener("click", async () => {
  if (!selectedMood) return;
  $("saveMoodBtn").disabled = true; $("moodError").textContent = "";
  try {
    await api("/api/moods", { method: "POST", body: JSON.stringify({ mood: selectedMood, note: $("moodNote").value, date: new Date().toISOString().slice(0, 10) }) });
    $("moodNote").value = ""; selectedMood = "";
    document.querySelectorAll(".mood-choice").forEach(b => b.classList.remove("selected"));
    $("selectedMoodLabel").textContent = "Saved — thank you for checking in ♡";
    await loadMoods();
  } catch (err) { $("moodError").textContent = err.message; }
  finally { $("saveMoodBtn").disabled = !selectedMood; }
});
function entryHtml(m) {
  const meta = moodMeta[m.mood] || { emoji: "🌿" };
  return `<article class="entry-item"><div class="entry-emoji">${meta.emoji}</div><div class="entry-content"><div class="entry-top"><strong>${escapeHtml(m.mood)}</strong><span class="entry-date">${formatDate(m.date)}</span></div>${m.note ? `<p class="entry-note">${escapeHtml(m.note)}</p>` : '<p class="entry-note">No note added.</p>'}</div></article>`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }
function formatDate(value) { return new Date(value + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
function renderRecent() {
  const thisMonth = new Date().toISOString().slice(0, 7);
  $("monthCount").textContent = allMoods.filter(m => m.date.startsWith(thisMonth)).length;
  const recent = allMoods.slice(0, 4);
  $("recentEntries").innerHTML = recent.length ? recent.map(entryHtml).join("") : '<div class="empty-state">Your check-ins will appear here. Choose a mood to begin 🌱</div>';
}
function renderDiary() {
  $("allEntries").innerHTML = allMoods.length ? allMoods.map(entryHtml).join("") : '<div class="empty-state">No diary entries yet. Save your first mood check-in on the Overview page.</div>';
}
function renderReport() {
  if (!$("reportMonth").value) return;
  const month = $("reportMonth").value;
  const entries = allMoods.filter(m => m.date.startsWith(month));
  const counts = {};
  entries.forEach(m => counts[m.mood] = (counts[m.mood] || 0) + 1);
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  $("reportTotal").textContent = entries.length;
  $("reportTopMood").textContent = top ? `${moodMeta[top[0]].emoji} ${top[0]}` : "—";
  $("reportDays").textContent = new Set(entries.map(m => m.date)).size;
  $("reportEmpty").textContent = entries.length ? "Your report reflects only the check-ins you chose to save." : "No entries for this month yet. Your report will build as you record moods.";
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  $("moodBars").innerHTML = sorted.length ? sorted.map(([mood, count]) => `<div class="mood-bar-row"><span>${moodMeta[mood].emoji} ${mood}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(5, count / entries.length * 100)}%"></div></div><span class="bar-number">${count}</span></div>`).join("") : '<div class="empty-state">No mood data to chart yet.</div>';
}
$("refreshReport").addEventListener("click", renderReport);
$("reportMonth").addEventListener("change", renderReport);

$("newJokeBtn").addEventListener("click", () => {
  let next = jokes[Math.floor(Math.random() * jokes.length)];
  if (jokes.length > 1 && next === $("jokeText").textContent) next = jokes[(jokes.indexOf(next) + 1) % jokes.length];
  $("jokeText").textContent = next;
});
$("musicMood").addEventListener("change", () => $("musicSuggestion").textContent = music[$("musicMood").value]);
$("musicSearchBtn").addEventListener("click", () => {
  const q = { calm: "calm acoustic playlist", happy: "happy energetic playlist", sad: "comforting acoustic songs", focus: "lofi study beats" }[$("musicMood").value];
  window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(q), "_blank", "noopener,noreferrer");
});
$("chatForm").addEventListener("submit", async e => {
  e.preventDefault();
  const input = $("chatInput"), message = input.value.trim(); if (!message) return;
  appendChat(message, "user"); input.value = "";
  try { const result = await api("/api/chat", { method: "POST", body: JSON.stringify({ message }) }); appendChat(result.reply, "bot"); }
  catch (err) { appendChat("Sorry, I couldn't send that just now. Please try again.", "bot"); }
});
function appendChat(text, who) {
  const bubble = document.createElement("div"); bubble.className = `chat-bubble ${who}`; bubble.textContent = text;
  $("chatMessages").appendChild(bubble); $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
}
init();
