/**
 * ═══════════════════════════════════════════════════════════
 * FITNESS BUDDY — Main Application JavaScript
 * Handles: Chat, BMI, Calories, Workouts, Nutrition, Family, Progress
 * ═══════════════════════════════════════════════════════════
 */

"use strict";

// ─── App State ────────────────────────────────────────────────────────────────
const App = {
  profile: null,
  familyMembers: [],
  progressLog: JSON.parse(localStorage.getItem("fb_progress") || "[]"),
  workoutHistory: JSON.parse(localStorage.getItem("fb_workouts") || "[]"),
  currentMood: null,
  theme: localStorage.getItem("fb_theme") || "light",
  streak: parseInt(localStorage.getItem("fb_streak") || "0"),
};

// ─── Motivational Quotes ──────────────────────────────────────────────────────
const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Fitness Wisdom" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Fitness is not about being better than someone else. It's about being better than you used to be.", author: "Unknown" },
  { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
  { text: "Health is not just about what you're eating. It's also about what you're thinking and saying.", author: "Unknown" },
  { text: "Sweat is just fat crying. Keep going!", author: "Fitness Buddy" },
  { text: "Ek din mein nahi hota — consistency hi real power hai!", author: "Fitness Buddy" },
  { text: "Small progress is still progress. Celebrate every win.", author: "Fitness Buddy" },
  { text: "Don't wish for a good body. Work for it.", author: "Unknown" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Khana achha khao, exercise karo, aur khush raho — ye hi formula hai!", author: "Fitness Buddy" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "Every step forward is a step toward achieving something bigger.", author: "Brian Tracy" },
  { text: "Believe in yourself and all that you are.", author: "Christian D. Larson" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
];

// ─── DOM Ready ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  checkApiStatus();
  setupEventListeners();
  renderDailyChecklist();
  renderWeekChart();
  renderMacroChart();
  rotateQuote();
  prefillProfileFromStorage();
});

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────
function initTheme() {
  document.documentElement.setAttribute("data-theme", App.theme);
  updateThemeIcon();
}

function toggleTheme() {
  App.theme = App.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", App.theme);
  localStorage.setItem("fb_theme", App.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById("themeIcon");
  if (icon) icon.className = App.theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill";
}

// ─────────────────────────────────────────────────────────────────────────────
// API STATUS CHECK
// ─────────────────────────────────────────────────────────────────────────────
async function checkApiStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    const badge = document.getElementById("statusBadge");
    const text = badge?.querySelector(".status-text");
    if (data.watsonx_configured) {
      badge?.classList.add("online");
      if (text) text.textContent = "Watsonx AI Active";
    } else {
      badge?.classList.add("demo");
      if (text) text.textContent = "Demo Mode";
    }
  } catch {
    const badge = document.getElementById("statusBadge");
    const text = badge?.querySelector(".status-text");
    if (text) text.textContent = "Offline";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────────────────────
function setupEventListeners() {
  // Theme toggle
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);

  // Navigation tabs
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", e => {
      e.preventDefault();
      const tabId = tab.getAttribute("data-tab");
      switchTab(tabId);
      // Close mobile nav
      const navCollapse = document.getElementById("navMenu");
      if (navCollapse?.classList.contains("show")) {
        new bootstrap.Collapse(navCollapse).hide();
      }
    });
  });

  // Profile form
  document.getElementById("profileForm")?.addEventListener("submit", handleProfileSubmit);

  // Edit profile
  document.getElementById("editProfileBtn")?.addEventListener("click", showHeroSection);

  // Chat
  document.getElementById("sendBtn")?.addEventListener("click", sendChatMessage);
  document.getElementById("chatInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });
  document.getElementById("chatInput")?.addEventListener("input", autoResizeTextarea);
  document.getElementById("clearChat")?.addEventListener("click", clearChat);

  // Quick prompts
  document.querySelectorAll(".quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const msg = btn.getAttribute("data-msg");
      document.getElementById("chatInput").value = msg;
      sendChatMessage();
    });
  });

  // Quote rotation
  document.getElementById("newQuoteBtn")?.addEventListener("click", rotateQuote);

  // BMI Calculator
  document.getElementById("calcBmiBtn")?.addEventListener("click", handleBmiCalc);

  // Calorie Calculator
  document.getElementById("calcCaloriesBtn")?.addEventListener("click", handleCalorieCalc);

  // Workout generator
  document.getElementById("generateWorkoutBtn")?.addEventListener("click", handleGenerateWorkout);
  document.getElementById("daysRange")?.addEventListener("input", e => {
    document.getElementById("daysLabel").textContent = e.target.value;
  });
  document.querySelectorAll(".exercise-item").forEach(item => {
    item.addEventListener("click", () => {
      const ex = item.getAttribute("data-exercise");
      document.getElementById("chatInput").value = `Explain how to do ${ex} properly with sets, reps, and form tips`;
      switchTab("chat");
      sendChatMessage();
    });
  });

  // Meal plan generator
  document.getElementById("generateMealBtn")?.addEventListener("click", handleGenerateMealPlan);

  // Family
  document.getElementById("addFamilyBtn")?.addEventListener("click", handleAddFamilyMember);

  // Progress
  document.getElementById("saveProgressBtn")?.addEventListener("click", saveProgress);
  document.getElementById("clearProgressBtn")?.addEventListener("click", clearProgress);
  document.querySelectorAll(".mood-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      App.currentMood = btn.getAttribute("data-mood");
    });
  });

  // Save buttons
  document.getElementById("saveWorkoutBtn")?.addEventListener("click", () =>
    showToast("Workout plan saved! 💪", "success"));
  document.getElementById("saveMealBtn")?.addEventListener("click", () =>
    showToast("Meal plan saved! 🥗", "success"));
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll(".tab-pane-content").forEach(p => p.classList.add("d-none"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove("d-none");

  const activeTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add("active");

  // Refresh charts on dashboard tab
  if (tabId === "dashboard") {
    setTimeout(() => { renderWeekChart(); renderMacroChart(); }, 100);
  }
  if (tabId === "progress") {
    renderProgressHistory();
    renderWeightChart();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
async function handleProfileSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector("[type=submit]");
  setLoading(btn, true, "Saving...");

  const profile = {
    name: document.getElementById("profileName").value,
    age: document.getElementById("profileAge").value,
    weight: document.getElementById("profileWeight").value,
    height: document.getElementById("profileHeight").value,
    gender: document.getElementById("profileGender").value,
    activity: document.getElementById("profileActivity").value,
    goal: document.getElementById("profileGoal").value,
    diet: document.getElementById("profileDiet").value,
    fitness_level: document.getElementById("profileFitness").value,
    health_conditions: document.getElementById("profileHealth").value,
  };

  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();

    App.profile = profile;
    localStorage.setItem("fb_profile", JSON.stringify(profile));

    // Update welcome bar
    updateWelcomeBar(profile, data);

    // Show main app
    document.getElementById("heroSection").classList.add("d-none");
    document.getElementById("mainApp").classList.remove("d-none");

    // Inject greeting message
    injectGreeting(profile, data);

    // Update dashboard
    if (data.bmi) updateDashboard(data.bmi, data.calories);

    // Pre-fill calculators
    prefillCalculators(profile);

    showToast(data.message || `Welcome, ${profile.name}! 💪`, "success");
    setLoading(btn, false);
  } catch (err) {
    showToast("Error saving profile. Please try again.", "danger");
    setLoading(btn, false);
  }
}

function updateWelcomeBar(profile, data) {
  document.getElementById("welcomeName").textContent = `Hey ${profile.name}! 👋`;
  document.getElementById("welcomeStats").textContent =
    `${profile.fitness_level} · ${profile.goal.replace(/_/g, " ")}`;

  if (data.bmi) {
    document.getElementById("wBMI").innerHTML =
      `<i class="bi bi-heart-pulse me-1"></i>BMI: ${data.bmi.bmi} (${data.bmi.category})`;
    document.getElementById("wCalories").innerHTML =
      `<i class="bi bi-fire me-1"></i>TDEE: ${data.calories?.tdee || "—"} kcal`;
  }
  const goalMap = {
    weight_loss: "🔥 Weight Loss", muscle_gain: "💪 Muscle Gain",
    general_fitness: "🏃 General Fitness", endurance: "⚡ Endurance",
    flexibility: "🧘 Flexibility", sports: "🏅 Sports"
  };
  document.getElementById("wGoal").innerHTML =
    `<i class="bi bi-bullseye me-1"></i>${goalMap[profile.goal] || profile.goal}`;
}

function updateDashboard(bmi, calories) {
  if (!bmi) return;
  const bmiEl = document.getElementById("dashBMI");
  if (bmiEl) { bmiEl.textContent = bmi.bmi; bmiEl.style.color = bmi.color; }
  if (calories) {
    const tdeeEl = document.getElementById("dashTDEE");
    if (tdeeEl) tdeeEl.textContent = calories.tdee?.toLocaleString() || "—";
    renderMacroChart(calories);
  }
  document.getElementById("dashStreak").textContent = App.streak;
  document.getElementById("dashWorkouts").textContent =
    App.workoutHistory.length || App.progressLog.filter(p => p.workout).length;
}

function prefillCalculators(profile) {
  ["bmiWeight", "calWeight"].forEach(id => {
    const el = document.getElementById(id);
    if (el && profile.weight) el.value = profile.weight;
  });
  ["bmiHeight", "calHeight"].forEach(id => {
    const el = document.getElementById(id);
    if (el && profile.height) el.value = profile.height;
  });
  const calAge = document.getElementById("calAge");
  if (calAge && profile.age) calAge.value = profile.age;
  const calGender = document.getElementById("calGender");
  if (calGender && profile.gender) calGender.value = profile.gender;
  const calActivity = document.getElementById("calActivity");
  if (calActivity && profile.activity) calActivity.value = profile.activity;

  // Pre-fill workout and nutrition with profile goal
  const wGoal = document.getElementById("wGoalSelect");
  const nGoal = document.getElementById("nGoalSelect");
  if (wGoal && profile.goal) {
    const map = { weight_loss: "weight loss", muscle_gain: "muscle gain", general_fitness: "general fitness", endurance: "endurance", flexibility: "flexibility" };
    wGoal.value = map[profile.goal] || "general fitness";
  }
  if (nGoal && profile.goal) {
    const nmap = { weight_loss: "weight loss", muscle_gain: "muscle gain", general_fitness: "balanced health" };
    nGoal.value = nmap[profile.goal] || "balanced health";
  }
  const nDiet = document.getElementById("nDietSelect");
  if (nDiet && profile.diet) {
    const dmap = { vegetarian: "vegetarian", non_vegetarian: "non-vegetarian", vegan: "vegan", mixed: "mixed" };
    nDiet.value = dmap[profile.diet] || "mixed";
  }
  if (profile.fitness_level) {
    const wLevel = document.getElementById("wLevelSelect");
    if (wLevel) wLevel.value = profile.fitness_level;
  }
}

function prefillProfileFromStorage() {
  const saved = localStorage.getItem("fb_profile");
  if (!saved) return;
  try {
    const profile = JSON.parse(saved);
    const nameEl = document.getElementById("profileName");
    if (nameEl) nameEl.value = profile.name || "";
    const ageEl = document.getElementById("profileAge");
    if (ageEl) ageEl.value = profile.age || "";
    const weightEl = document.getElementById("profileWeight");
    if (weightEl) weightEl.value = profile.weight || "";
    const heightEl = document.getElementById("profileHeight");
    if (heightEl) heightEl.value = profile.height || "";
    if (profile.gender) document.getElementById("profileGender").value = profile.gender;
    if (profile.activity) document.getElementById("profileActivity").value = profile.activity;
    if (profile.goal) document.getElementById("profileGoal").value = profile.goal;
    if (profile.diet) document.getElementById("profileDiet").value = profile.diet;
    if (profile.fitness_level) document.getElementById("profileFitness").value = profile.fitness_level;
    const healthEl = document.getElementById("profileHealth");
    if (healthEl) healthEl.value = profile.health_conditions || "";
  } catch {}
}

function showHeroSection() {
  document.getElementById("heroSection").classList.remove("d-none");
  document.getElementById("mainApp").classList.add("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────────────────────
function injectGreeting(profile, data) {
  const greeting = `👋 **Namaste ${profile.name}!** Welcome to Fitness Buddy!

I'm your personal AI fitness coach, powered by IBM Watsonx Granite AI. Here's what I found about you:

${data.bmi ? `📊 **Your BMI:** ${data.bmi.bmi} — ${data.bmi.category}` : ""}
${data.calories ? `🔥 **Daily Calories (TDEE):** ${data.calories.tdee} kcal/day` : ""}
${data.calories ? `💪 **For ${profile.goal.replace(/_/g, " ")}:** Target ${data.calories.weight_loss}–${data.calories.tdee} kcal` : ""}

I'm ready to help you with personalized workout plans, Indian meal suggestions, and daily motivation. 

**What would you like to work on today?** 💪`;

  appendBotMessage(greeting);
}

async function sendChatMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const sendBtn = document.getElementById("sendBtn");
  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;

  appendUserMessage(message);
  const typingId = appendTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    removeTypingIndicator(typingId);

    if (data.response) appendBotMessage(data.response, data.timestamp);
    else appendBotMessage("⚠️ Sorry, I couldn't generate a response. Please try again.");
  } catch {
    removeTypingIndicator(typingId);
    appendBotMessage("⚠️ Connection error. Please check your internet connection and try again.");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

function appendUserMessage(text) {
  const container = document.getElementById("chatMessages");
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const html = `
    <div class="message-wrapper user-msg">
      <div class="msg-avatar user-avatar-chat"><i class="bi bi-person-fill"></i></div>
      <div>
        <div class="message-bubble user-bubble">${escapeHtml(text)}</div>
        <div class="msg-time">${time}</div>
      </div>
    </div>`;
  container.insertAdjacentHTML("beforeend", html);
  scrollChat();
}

function appendBotMessage(text, time = null) {
  const container = document.getElementById("chatMessages");
  const displayTime = time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatted = formatMessage(text);
  const html = `
    <div class="message-wrapper">
      <div class="msg-avatar bot-avatar"><i class="bi bi-robot"></i></div>
      <div>
        <div class="message-bubble bot-bubble">${formatted}</div>
        <div class="msg-time">${displayTime}</div>
      </div>
    </div>`;
  container.insertAdjacentHTML("beforeend", html);
  scrollChat();
}

function appendTypingIndicator() {
  const container = document.getElementById("chatMessages");
  const id = "typing_" + Date.now();
  const html = `
    <div class="message-wrapper" id="${id}">
      <div class="msg-avatar bot-avatar"><i class="bi bi-robot"></i></div>
      <div class="message-bubble bot-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
      </div>
    </div>`;
  container.insertAdjacentHTML("beforeend", html);
  scrollChat();
  return id;
}

function removeTypingIndicator(id) {
  document.getElementById(id)?.remove();
}

function scrollChat() {
  const container = document.getElementById("chatMessages");
  if (container) container.scrollTop = container.scrollHeight;
}

async function clearChat() {
  try {
    await fetch("/api/clear-chat", { method: "POST" });
    document.getElementById("chatMessages").innerHTML = "";
    showToast("Chat cleared! Fresh start 🌟", "info");
  } catch {
    document.getElementById("chatMessages").innerHTML = "";
  }
}

function formatMessage(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<strong>$1</strong>")
    .replace(/^[-•]\s+(.+)$/gm, "• $1")
    .replace(/^\d+\.\s+(.+)$/gm, "→ $1")
    .replace(/\n/g, "<br>");
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function autoResizeTextarea() {
  const ta = document.getElementById("chatInput");
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
}

// ─────────────────────────────────────────────────────────────────────────────
// BMI CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
async function handleBmiCalc() {
  const weight = document.getElementById("bmiWeight").value;
  const height = document.getElementById("bmiHeight").value;
  if (!weight || !height) { showToast("Please enter both weight and height.", "warning"); return; }

  const btn = document.getElementById("calcBmiBtn");
  setLoading(btn, true, "Calculating...");

  try {
    const res = await fetch("/api/bmi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: parseFloat(weight), height: parseFloat(height) }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, "danger"); return; }
    displayBmiResult(data, parseFloat(weight));
  } catch {
    showToast("Calculation error. Please try again.", "danger");
  } finally {
    setLoading(btn, false);
  }
}

function displayBmiResult(data, weight) {
  const resultEl = document.getElementById("bmiResult");
  resultEl.classList.remove("d-none");

  document.getElementById("bmiValue").textContent = data.bmi;
  document.getElementById("bmiValue").style.color = data.color;
  document.getElementById("bmiCategory").textContent = data.category;
  document.getElementById("bmiCategory").style.color = data.color;

  const adviceEl = document.getElementById("bmiAdvice");
  adviceEl.textContent = data.advice;
  adviceEl.className = "alert mt-3";
  const alertClass = { "Normal Weight": "alert-success", "Underweight": "alert-info", "Overweight": "alert-warning", "Obese": "alert-danger" };
  adviceEl.classList.add(alertClass[data.category] || "alert-secondary");

  document.getElementById("idealWeight").textContent = `${data.ideal_weight_min}–${data.ideal_weight_max} kg`;
  document.getElementById("currentWeight").textContent = `${weight} kg`;

  // Position needle (BMI scale: 10–45)
  const pct = Math.min(Math.max((data.bmi - 10) / 35 * 100, 2), 98);
  document.getElementById("bmiNeedle").style.left = `${pct}%`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CALORIE CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
async function handleCalorieCalc() {
  const weight = document.getElementById("calWeight").value;
  const height = document.getElementById("calHeight").value;
  const age    = document.getElementById("calAge").value;
  const gender = document.getElementById("calGender").value;
  const activity = document.getElementById("calActivity").value;

  if (!weight || !height || !age) { showToast("Please fill in all fields.", "warning"); return; }

  const btn = document.getElementById("calcCaloriesBtn");
  setLoading(btn, true, "Calculating...");

  try {
    const res = await fetch("/api/calories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: parseFloat(weight), height: parseFloat(height), age: parseInt(age), gender, activity }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, "danger"); return; }
    displayCalorieResult(data);
  } catch {
    showToast("Calculation error.", "danger");
  } finally {
    setLoading(btn, false);
  }
}

function displayCalorieResult(data) {
  const resultEl = document.getElementById("calorieResult");
  resultEl.classList.remove("d-none");

  document.getElementById("calBMR").textContent = data.bmr?.toLocaleString();
  document.getElementById("calTDEE").textContent = data.tdee?.toLocaleString();
  document.getElementById("calLoss").textContent = data.weight_loss?.toLocaleString();

  const total = data.protein_g * 4 + data.carbs_g * 4 + data.fat_g * 9;
  const pPct = Math.round(data.protein_g * 4 / total * 100);
  const cPct = Math.round(data.carbs_g * 4 / total * 100);
  const fPct = Math.round(data.fat_g * 9 / total * 100);

  document.getElementById("macroDisplay").innerHTML = `
    <div class="macro-row macro-protein">
      <div class="macro-label"><span>🥩 Protein</span><span>${data.protein_g}g (${pPct}%)</span></div>
      <div class="macro-progress"><div class="macro-fill" style="width:${pPct}%"></div></div>
    </div>
    <div class="macro-row macro-carbs">
      <div class="macro-label"><span>🌾 Carbohydrates</span><span>${data.carbs_g}g (${cPct}%)</span></div>
      <div class="macro-progress"><div class="macro-fill" style="width:${cPct}%"></div></div>
    </div>
    <div class="macro-row macro-fat">
      <div class="macro-label"><span>🥑 Healthy Fats</span><span>${data.fat_g}g (${fPct}%)</span></div>
      <div class="macro-progress"><div class="macro-fill" style="width:${fPct}%"></div></div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
async function handleGenerateWorkout() {
  const goal = document.getElementById("wGoalSelect").value;
  const level = document.getElementById("wLevelSelect").value;
  const location = document.querySelector("[name=location]:checked")?.value || "home";
  const days = parseInt(document.getElementById("daysRange").value);

  showLoadingOverlay("Generating your personalized workout plan...");

  try {
    const res = await fetch("/api/workout-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, level, location, days }),
    });
    const data = await res.json();
    hideLoadingOverlay();

    const resultEl = document.getElementById("workoutPlanResult");
    resultEl.innerHTML = `<div style="white-space:pre-wrap; line-height:1.7;">${formatMessage(data.plan)}</div>`;
    document.getElementById("saveWorkoutBtn")?.classList.remove("d-none");

    // Save to history
    App.workoutHistory.push({ date: new Date().toISOString(), goal, level, location, days });
    localStorage.setItem("fb_workouts", JSON.stringify(App.workoutHistory));

    showToast("Workout plan generated! 💪", "success");
  } catch {
    hideLoadingOverlay();
    showToast("Error generating plan. Please try again.", "danger");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEAL PLAN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
async function handleGenerateMealPlan() {
  const goal = document.getElementById("nGoalSelect").value;
  const diet_type = document.getElementById("nDietSelect").value;
  const calories = parseInt(document.getElementById("nCaloriesInput").value) || 2000;

  showLoadingOverlay("Crafting your 7-day Indian meal plan...");

  try {
    const res = await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, diet_type, calories }),
    });
    const data = await res.json();
    hideLoadingOverlay();

    const resultEl = document.getElementById("mealPlanResult");
    resultEl.innerHTML = `<div style="white-space:pre-wrap; line-height:1.7;">${formatMessage(data.plan)}</div>`;
    document.getElementById("saveMealBtn")?.classList.remove("d-none");

    showToast("Meal plan ready! 🥗", "success");
  } catch {
    hideLoadingOverlay();
    showToast("Error generating meal plan. Try again.", "danger");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function handleAddFamilyMember() {
  const name   = document.getElementById("fName").value.trim();
  const age    = document.getElementById("fAge").value;
  const gender = document.getElementById("fGender").value;
  const relation = document.getElementById("fRelation").value;
  const goal   = document.getElementById("fGoal").value;
  const health = document.getElementById("fHealth").value.trim();

  if (!name || !age) { showToast("Please enter name and age.", "warning"); return; }

  const member = { id: Date.now(), name, age: parseInt(age), gender, relation, goal, health };
  App.familyMembers.push(member);
  localStorage.setItem("fb_family", JSON.stringify(App.familyMembers));

  renderFamilyProfiles();
  showToast(`${name} added to family! 👨‍👩‍👧`, "success");

  // Reset form
  ["fName", "fAge", "fHealth"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
}

function renderFamilyProfiles() {
  const container = document.getElementById("familyProfiles");
  if (!container) return;

  if (App.familyMembers.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="bi bi-people"></i></div><p>Add family members to get personalized fitness advice!</p></div>`;
    return;
  }

  const colors = ["#4f46e5","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6"];
  const icons  = { child: "👧", spouse: "💑", parent: "🧑‍🦳", sibling: "🤝", grandparent: "👴" };

  container.innerHTML = `<div class="row g-3">` +
    App.familyMembers.map((m, i) => `
      <div class="col-12 col-md-6">
        <div class="family-member-card">
          <div class="d-flex align-items-center gap-3 mb-2">
            <div class="family-avatar" style="background:${colors[i % colors.length]}">
              ${m.name.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1">
              <div class="fw-600">${escapeHtml(m.name)} ${icons[m.relation] || "👤"}</div>
              <div class="text-muted small">${m.age} yrs · ${m.gender} · ${m.relation}</div>
            </div>
            <button class="btn btn-sm btn-outline-danger ms-auto" onclick="removeFamilyMember(${m.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
          <div class="d-flex gap-2 flex-wrap mb-2">
            <span class="stat-chip"><i class="bi bi-bullseye me-1"></i>${m.goal}</span>
            ${m.health ? `<span class="stat-chip"><i class="bi bi-heart me-1"></i>${escapeHtml(m.health)}</span>` : ""}
          </div>
          <button class="btn btn-sm btn-primary w-100 btn-animated" onclick="getFamilyAdvice(${m.id})">
            <i class="bi bi-robot me-1"></i>Get AI Fitness Advice
          </button>
        </div>
      </div>`).join("") + `</div>`;
}

function removeFamilyMember(id) {
  App.familyMembers = App.familyMembers.filter(m => m.id !== id);
  localStorage.setItem("fb_family", JSON.stringify(App.familyMembers));
  renderFamilyProfiles();
  showToast("Member removed.", "info");
}

async function getFamilyAdvice(id) {
  const member = App.familyMembers.find(m => m.id === id);
  if (!member) return;

  showLoadingOverlay(`Getting fitness advice for ${member.name}...`);

  try {
    const res = await fetch("/api/family-advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member }),
    });
    const data = await res.json();
    hideLoadingOverlay();

    // Switch to chat and show advice
    switchTab("chat");
    appendBotMessage(`**🏋️ Fitness Advice for ${member.name}:**\n\n${data.advice}`);
    showToast(`Advice ready for ${member.name}! 💪`, "success");
  } catch {
    hideLoadingOverlay();
    showToast("Error getting advice. Try again.", "danger");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS TRACKING
// ─────────────────────────────────────────────────────────────────────────────
function saveProgress() {
  const weight   = parseFloat(document.getElementById("logWeight").value);
  const workout  = document.querySelector("[name=workoutDone]:checked")?.value === "yes";
  const duration = parseInt(document.getElementById("logDuration").value) || 0;
  const water    = parseInt(document.getElementById("logWater").value) || 0;
  const notes    = document.getElementById("logNotes").value.trim();
  const mood     = App.currentMood;

  const entry = {
    date: new Date().toLocaleDateString("en-IN"),
    timestamp: Date.now(),
    weight: weight || null,
    workout,
    duration,
    water,
    mood,
    notes,
  };

  App.progressLog.push(entry);
  localStorage.setItem("fb_progress", JSON.stringify(App.progressLog));

  // Update streak
  if (workout) {
    App.streak++;
    localStorage.setItem("fb_streak", App.streak);
    document.getElementById("dashStreak").textContent = App.streak;
  }

  renderProgressHistory();
  renderWeightChart();

  // Reset form
  document.getElementById("logWeight").value = "";
  document.getElementById("logDuration").value = "";
  document.getElementById("logWater").value = "";
  document.getElementById("logNotes").value = "";
  document.querySelectorAll("[name=workoutDone]").forEach(r => r.checked = false);
  document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("active"));
  App.currentMood = null;

  showToast(workout ? "🔥 Progress saved! Keep going!" : "📝 Progress logged!", "success");
}

function renderProgressHistory() {
  const container = document.getElementById("progressHistory");
  if (!container) return;

  if (App.progressLog.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="bi bi-graph-up"></i></div><p>Start logging to see your progress!</p></div>`;
    return;
  }

  const moodEmoji = { great: "😄", good: "🙂", okay: "😐", tired: "😴" };

  container.innerHTML = [...App.progressLog].reverse().map(e => `
    <div class="progress-entry">
      <div class="progress-date">${e.date}</div>
      <div class="progress-details">
        ${e.workout ? "✅ Workout" : "❌ Rest day"}
        ${e.duration ? ` · ${e.duration} min` : ""}
        ${e.water ? ` · 💧${e.water} glasses` : ""}
        ${e.mood ? ` · ${moodEmoji[e.mood] || ""}` : ""}
        ${e.notes ? `<br><span class="text-muted">${escapeHtml(e.notes)}</span>` : ""}
      </div>
      ${e.weight ? `<div class="progress-weight">${e.weight} kg</div>` : ""}
    </div>`).join("");
}

function renderWeightChart() {
  const container = document.getElementById("weightChart");
  if (!container) return;

  const weightData = App.progressLog.filter(e => e.weight).slice(-14);
  if (weightData.length < 2) {
    container.innerHTML = `<div class="text-center text-muted py-4" style="font-size:0.875rem;">Log at least 2 weight entries to see your trend chart.</div>`;
    return;
  }

  const weights = weightData.map(e => e.weight);
  const labels  = weightData.map(e => e.date);
  const min = Math.floor(Math.min(...weights)) - 1;
  const max = Math.ceil(Math.max(...weights)) + 1;
  const range = max - min;
  const w = 500, h = 160, padL = 40, padR = 10, padT = 15, padB = 30;
  const iw = w - padL - padR;
  const ih = h - padT - padB;
  const step = iw / (weights.length - 1);

  const points = weights.map((v, i) => {
    const x = padL + i * step;
    const y = padT + ih - ((v - min) / range) * ih;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `${padL},${padT + ih} ` + points + ` ${padL + (weights.length - 1) * step},${padT + ih}`;

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="weight-chart-svg" style="overflow:visible;">
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#weightGrad)"/>
      <polyline points="${points}" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${weights.map((v, i) => {
        const x = padL + i * step;
        const y = padT + ih - ((v - min) / range) * ih;
        return `<circle cx="${x}" cy="${y}" r="4" fill="#4f46e5" stroke="white" stroke-width="2"/>
                <text x="${x}" y="${y - 8}" text-anchor="middle" font-size="9" fill="#475569">${v}</text>`;
      }).join("")}
      ${labels.filter((_, i) => i % 2 === 0 || i === labels.length - 1).map((l, idx) => {
        const origIdx = labels.indexOf(l);
        const x = padL + origIdx * step;
        return `<text x="${x}" y="${h - 5}" text-anchor="middle" font-size="8" fill="#94a3b8">${l.split("/").slice(0,2).join("/")}</text>`;
      }).join("")}
    </svg>`;
}

function clearProgress() {
  if (!confirm("Clear all progress data? This cannot be undone.")) return;
  App.progressLog = [];
  App.streak = 0;
  localStorage.removeItem("fb_progress");
  localStorage.setItem("fb_streak", "0");
  renderProgressHistory();
  renderWeightChart();
  document.getElementById("dashStreak").textContent = "0";
  showToast("Progress data cleared.", "info");
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD CHARTS
// ─────────────────────────────────────────────────────────────────────────────
function renderWeekChart() {
  const container = document.getElementById("weekChart");
  if (!container) return;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxHeight = 130;

  // Use real data if available, else sample
  const weekData = days.map((day, i) => {
    const log = App.progressLog[App.progressLog.length - 7 + i];
    return log ? (log.duration || (log.workout ? 30 : 0)) : Math.floor(Math.random() * 60 + 10);
  });

  const maxVal = Math.max(...weekData, 1);
  container.innerHTML = weekData.map((val, i) => {
    const h = Math.max((val / maxVal) * maxHeight, 4);
    return `
      <div class="week-bar-wrapper">
        <div class="week-min">${val}m</div>
        <div class="week-bar" style="height:${h}px" title="${days[i]}: ${val} min"></div>
        <div class="week-day">${days[i]}</div>
      </div>`;
  }).join("");
}

function renderMacroChart(calories = null) {
  const container = document.getElementById("macroChart");
  if (!container) return;

  const protein = calories?.protein_g || 120;
  const carbs   = calories?.carbs_g  || 250;
  const fat     = calories?.fat_g    || 55;
  const tdee    = calories?.tdee     || 2000;

  const total  = protein * 4 + carbs * 4 + fat * 9;
  const pPct   = Math.round(protein * 4 / total * 100);
  const cPct   = Math.round(carbs * 4 / total * 100);
  const fPct   = 100 - pPct - cPct;

  // SVG donut
  const size = 140, cx = 70, cy = 70, r = 50, stroke = 18;
  const circumference = 2 * Math.PI * r;
  const slices = [
    { pct: pPct, color: "#4f46e5", label: "Protein" },
    { pct: cPct, color: "#f59e0b", label: "Carbs" },
    { pct: fPct, color: "#ef4444", label: "Fats" },
  ];

  let offset = 0;
  const paths = slices.map(s => {
    const dash = (s.pct / 100) * circumference;
    const gap  = circumference - dash;
    const rotate = (offset / 100) * 360 - 90;
    offset += s.pct;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}"
              stroke-dasharray="${dash} ${gap}" stroke-dashoffset="0"
              transform="rotate(${rotate} ${cx} ${cy})" opacity="0.85"/>`;
  }).join("");

  container.innerHTML = `
    <div class="macro-circle-container">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
        ${paths}
      </svg>
      <div class="macro-ring-label">
        <div class="macro-ring-value">${tdee}</div>
        <div class="macro-ring-unit">kcal</div>
      </div>
    </div>
    <div class="macro-legend">
      ${slices.map((s, i) => `
        <div class="macro-legend-item">
          <div class="macro-dot" style="background:${s.color}"></div>
          <span>${s.label} ${[protein,carbs,fat][i]}g (${s.pct}%)</span>
        </div>`).join("")}
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────
function renderDailyChecklist() {
  const items = [
    { id: "cl1", text: "Morning stretch or yoga (5–10 min)" },
    { id: "cl2", text: "Drink 8 glasses of water" },
    { id: "cl3", text: "Eat a high-protein breakfast" },
    { id: "cl4", text: "Complete today's workout" },
    { id: "cl5", text: "Take a 10-min post-lunch walk" },
    { id: "cl6", text: "Avoid processed/junk food today" },
    { id: "cl7", text: "Sleep by 10:30 PM" },
    { id: "cl8", text: "Log today's progress" },
  ];

  const saved = JSON.parse(localStorage.getItem(`fb_checklist_${todayKey()}`) || "{}");
  const container = document.getElementById("dailyChecklist");
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="col-12 col-sm-6">
      <div class="checklist-item ${saved[item.id] ? "done" : ""}" data-id="${item.id}" onclick="toggleChecklistItem(this)">
        <div class="checklist-cb"></div>
        <span>${item.text}</span>
      </div>
    </div>`).join("");
}

function toggleChecklistItem(el) {
  el.classList.toggle("done");
  const id = el.getAttribute("data-id");
  const saved = JSON.parse(localStorage.getItem(`fb_checklist_${todayKey()}`) || "{}");
  saved[id] = el.classList.contains("done");
  localStorage.setItem(`fb_checklist_${todayKey()}`, JSON.stringify(saved));
}

function todayKey() { return new Date().toLocaleDateString("en-IN").replace(/\//g, "-"); }

// ─────────────────────────────────────────────────────────────────────────────
// MOTIVATIONAL QUOTES
// ─────────────────────────────────────────────────────────────────────────────
let quoteIndex = 0;
function rotateQuote() {
  quoteIndex = (quoteIndex + 1) % QUOTES.length;
  const q = QUOTES[quoteIndex];
  const qEl = document.getElementById("motivationQuote");
  const aEl = document.getElementById("motivationAuthor");
  if (qEl) { qEl.style.opacity = "0"; setTimeout(() => { qEl.textContent = `"${q.text}"`; qEl.style.opacity = "1"; }, 200); }
  if (aEl) aEl.textContent = q.author;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function showToast(message, type = "success") {
  const toast = document.getElementById("toastNotif");
  const msg   = document.getElementById("toastMsg");
  if (!toast || !msg) return;

  msg.textContent = message;
  toast.className = `toast align-items-center text-white border-0 bg-${type === "info" ? "info" : type === "warning" ? "warning" : type === "danger" ? "danger" : "success"}`;
  new bootstrap.Toast(toast, { delay: 3000 }).show();
}

function showLoadingOverlay(text = "Processing...") {
  const overlay = document.getElementById("loadingOverlay");
  const txtEl   = document.getElementById("loadingText");
  if (overlay) overlay.classList.remove("d-none");
  if (txtEl) txtEl.textContent = text;
}

function hideLoadingOverlay() {
  document.getElementById("loadingOverlay")?.classList.add("d-none");
}

function setLoading(btn, loading, text = "Loading...") {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn._origText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._origText || btn.innerHTML;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOAD SAVED FAMILY MEMBERS
// ─────────────────────────────────────────────────────────────────────────────
(function loadFamilyFromStorage() {
  const saved = localStorage.getItem("fb_family");
  if (saved) {
    try { App.familyMembers = JSON.parse(saved); }
    catch { App.familyMembers = []; }
  }
})();
