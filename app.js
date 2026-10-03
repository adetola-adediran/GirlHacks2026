const STORAGE_KEY = "enchanted-grove-garden-v1";
const DEFAULT_SEMESTER_END = "2026-12-18";
const petMoods = [
  "Your tiny sprout is ready to grow.",
  "Moss is proud of every little step.",
  "A little progress looks lovely on you.",
  "Your garden is growing beautifully."
];
const questIcons = ["✿", "☘", "✧", "❋", "❀"];
const accessories = [
  { id: "flower-crown", name: "Flower crown", icon: "✿", price: 20, description: "A little sunshine for their leafy ears." },
  { id: "acorn-cap", name: "Acorn cap", icon: "●", price: 35, description: "A woodland classic, custom-fitted." },
  { id: "moon-halo", name: "Moon halo", icon: "◔", price: 50, description: "For your very own forest star." }
];
const moods = {
  good: "Glad things feel sunny. Remember to take a little stretch, too.",
  okay: "That's a good place to be. One small step is plenty.",
  low: "Thanks for checking in. Be gentle with yourself; a little rest counts."
};
const FOCUS_SECONDS = 25 * 60;

const taskList = document.querySelector("#task-list");
const taskForm = document.querySelector("#task-form");
const toast = document.querySelector("#toast");
let garden = loadGarden();
document.querySelector("#world-pet-mount").append(document.querySelector(".pet-card"));
document.querySelector("#game-world").append(document.querySelector("#streak-card"));
document.querySelector(".topbar-right").append(
  document.querySelector("#points-balance").closest(".currency-pill"),
  document.querySelector("#rename-pet-button")
);
let toastTimer;
let timerRemaining = FOCUS_SECONDS;
let timerInterval = null;
let petIdleTimer = null;
let petGreetingTimer = null;

function loadGarden() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || !Array.isArray(saved.tasks)) {
      return createGarden();
    }
    const tasks = saved.tasks.filter((task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        Number.isInteger(task.xp) &&
        typeof task.completed === "boolean"
      );
    const legacyPoints = tasks.reduce((sum, task) => sum + (task.completed ? task.pointsEarned || task.xp : 0), 0);
    return {
      tasks,
      semesterEnd: typeof saved.semesterEnd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(saved.semesterEnd)
        ? saved.semesterEnd
        : DEFAULT_SEMESTER_END,
      petName: typeof saved.petName === "string" && saved.petName.trim()
        ? saved.petName.trim().slice(0, 24)
        : "Moss",
      points: Number.isSafeInteger(saved.points) && saved.points >= 0 ? saved.points : legacyPoints,
      ownedAccessories: Array.isArray(saved.ownedAccessories)
        ? saved.ownedAccessories.filter((id) => accessories.some((item) => item.id === id))
        : [],
      equippedAccessory: typeof saved.equippedAccessory === "string" &&
        accessories.some((item) => item.id === saved.equippedAccessory) &&
        Array.isArray(saved.ownedAccessories) &&
        saved.ownedAccessories.includes(saved.equippedAccessory)
        ? saved.equippedAccessory
        : "",
      wateringCount: Number.isSafeInteger(saved.wateringCount) && saved.wateringCount >= 0
        ? saved.wateringCount
        : 0,
      wateringDate: typeof saved.wateringDate === "string" ? saved.wateringDate : "",
      fireflyDate: typeof saved.fireflyDate === "string" ? saved.fireflyDate : "",
      checkinDate: typeof saved.checkinDate === "string" ? saved.checkinDate : "",
      checkinMood: typeof saved.checkinMood === "string" && moods[saved.checkinMood] ? saved.checkinMood : "",
      visitDates: Array.isArray(saved.visitDates)
        ? [...new Set(saved.visitDates.filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)))].slice(-7)
        : [],
      visitStreak: Number.isSafeInteger(saved.visitStreak) && saved.visitStreak > 0 ? saved.visitStreak : 0,
      lastVisitDate: typeof saved.lastVisitDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(saved.lastVisitDate)
        ? saved.lastVisitDate
        : ""
    };
  } catch (error) {
    console.error("Could not load your garden from this device:", error);
    return createGarden();
  }
}

function createGarden() {
  return {
    tasks: [],
    semesterEnd: DEFAULT_SEMESTER_END,
    petName: "Moss",
    points: 0,
    ownedAccessories: [],
    equippedAccessory: "",
    wateringCount: 0,
    wateringDate: "",
    fireflyDate: "",
    checkinDate: "",
    checkinMood: "",
    visitDates: [],
    visitStreak: 0,
    lastVisitDate: ""
  };
}

function saveGarden() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(garden));
  } catch (error) {
    console.error("Could not save your garden:", error);
    showToast("Your browser couldn't save this change. Check your storage settings.", true);
  }
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3800);
}

function xpTotals() {
  const totalXp = garden.tasks.reduce((sum, task) => sum + (task.completed ? task.xp : 0), 0);
  const level = Math.floor(totalXp / 100) + 1;
  return { totalXp, level, progress: totalXp % 100 };
}

function todayKey() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function dayOrdinal(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function recordDailyVisit() {
  const today = todayKey();
  if (garden.lastVisitDate === today) return;
  garden.visitStreak =
    garden.lastVisitDate && dayOrdinal(today) - dayOrdinal(garden.lastVisitDate) === 1
      ? garden.visitStreak + 1
      : 1;
  garden.lastVisitDate = today;
  garden.visitDates = [...garden.visitDates.filter((date) => date !== today), today].slice(-7);
  saveGarden();
}

function renderStreak() {
  const count = garden.visitStreak || 1;
  document.querySelector("#streak-count").textContent = String(count);
  document.querySelector("#streak-word").textContent = count === 1 ? "day" : "days";
  document.querySelector("#streak-message").textContent =
    count >= 7
      ? "A whole week of finding your way back. Look at you grow."
      : count > 1
        ? "Look at you, finding a little rhythm of your own."
        : "You showed up for your little corner of the world.";

  const strip = document.querySelector("#streak-week");
  const today = todayKey();
  const days = Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
  strip.replaceChildren(...days.map((date, index) => {
    const item = makeElement("li", `streak-day${garden.visitDates.includes(date) ? " has-visited" : ""}${date === today ? " is-today" : ""}`);
    item.setAttribute("aria-label", `${new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${garden.visitDates.includes(date) ? ", visited" : ""}${date === today ? ", today" : ""}`);
    item.append(
      makeElement("span", "streak-day-name", new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })),
      makeElement("span", "streak-day-mark", garden.visitDates.includes(date) ? "✿" : "·")
    );
    return item;
  }));
}

function greetPet(sprite) {
  window.clearTimeout(petIdleTimer);
  window.clearTimeout(petGreetingTimer);
  sprite.classList.remove("is-greeting", "is-curious", "is-sleepy");
  void sprite.offsetWidth;
  sprite.classList.add("is-greeting");
  petGreetingTimer = window.setTimeout(() => {
    sprite.classList.remove("is-greeting");
    schedulePetIdle();
  }, 1350);
}

function schedulePetIdle() {
  window.clearTimeout(petIdleTimer);
  const sprite = document.querySelector("#pet-sprite");
  if (document.visibilityState === "hidden" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  petIdleTimer = window.setTimeout(() => {
    if (!sprite.classList.contains("is-greeting")) {
      const expression = Math.random() < 0.55 ? "is-curious" : "is-sleepy";
      sprite.classList.add(expression);
      window.setTimeout(() => sprite.classList.remove(expression), 2100);
    }
    schedulePetIdle();
  }, 6200 + Math.random() * 4800);
}

function formatDueDate(value) {
  if (!value) return "No due date";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderTask(task, index) {
  const card = makeElement("article", `quest-card${task.completed ? " is-complete" : ""}`);
  const row = makeElement("div", "quest-main");
  const icon = makeElement("span", "quest-icon", task.completed ? "✓" : questIcons[index % questIcons.length]);
  icon.setAttribute("aria-hidden", "true");
  const copy = makeElement("div", "quest-copy");
  copy.append(makeElement("h3", "", task.title));
  const meta = makeElement("div", "quest-meta");
  const due = makeElement("span", "due-date", `${task.due && !task.completed ? "◷" : "·"} ${formatDueDate(task.due)}`);
  if (task.due && !task.completed && new Date(`${task.due}T23:59:59`) < new Date()) {
    due.classList.add("overdue");
  }
  meta.append(due);
  if (task.completed) meta.append(makeElement("span", "", "Verified by Gemini"));
  copy.append(meta);
  const xp = makeElement("span", "quest-xp", task.completed ? `+${task.xp} XP` : `${task.xp} XP`);
  row.append(icon, copy, xp);

  const actions = makeElement("div", "quest-actions");
  if (!task.completed) {
    const deleteButton = makeElement("button", "icon-button", "×");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));
    actions.append(deleteButton);
  }
  row.append(actions);
  card.append(row);

  if (!task.completed) {
    const proof = document.createElement("details");
    proof.className = "quest-proof";
    const summary = makeElement("summary", "", "Prove this quest & earn XP");
    const prompt = makeElement("p", "", `Tell ${garden.petName} what you did. Gemini will check whether your proof matches this quest.`);
    const evidence = document.createElement("textarea");
    evidence.maxLength = 2000;
    evidence.placeholder = "Share a short reflection, what you learned, or what you finished…";
    evidence.required = true;
    evidence.setAttribute("aria-label", `Evidence for ${task.title}`);
    const verifyButton = makeElement("button", "verify-button", "✧ Ask Gemini to verify");
    verifyButton.type = "button";
    verifyButton.addEventListener("click", () => verifyTask(task, evidence, verifyButton, proof));
    proof.append(summary, prompt, evidence, verifyButton);
    card.append(proof);
  }
  return card;
}

function renderTasks() {
  const filter = document.querySelector("#task-filter").value;
  const visibleTasks = garden.tasks.filter((task) => {
    if (filter === "open") return !task.completed;
    if (filter === "done") return task.completed;
    return true;
  });
  taskList.replaceChildren();
  if (visibleTasks.length === 0) {
    const empty = makeElement("div", "empty-state");
    const flower = makeElement("span", "", filter === "done" ? "♡" : "✿");
    flower.setAttribute("aria-hidden", "true");
    const message = makeElement("p", "", filter === "done" ? "Your blooms will appear here." : "A fresh patch of possibility.");
    const hint = makeElement("small", "", filter === "done" ? "Complete a quest and Moss will celebrate with you." : "Plant a quest to get your garden growing.");
    empty.append(flower, message, hint);
    taskList.append(empty);
  } else {
    visibleTasks.forEach((task) => taskList.append(renderTask(task, garden.tasks.indexOf(task))));
  }
  document.querySelector("#completed-count").textContent = String(garden.tasks.filter((task) => task.completed).length);
  const { totalXp, level, progress } = xpTotals();
  document.querySelector("#total-xp").textContent = String(totalXp);
  document.querySelector("#level-badge").textContent = `LVL ${level}`;
  document.querySelector("#xp-caption").textContent = `${progress} / 100 XP`;
  document.querySelector("#xp-fill").style.width = `${progress}%`;
  const progressBar = document.querySelector("#xp-progress");
  progressBar.setAttribute("aria-valuenow", String(progress));
  document.querySelector("#pet-mood").textContent =
    petMoods[Math.min(level - 1, petMoods.length - 1)].replace("Moss", garden.petName);
  const hint = document.querySelector("#pet-hint");
  hint.replaceChildren(
    document.createTextNode(
      level > 1
        ? `${garden.petName} is blooming at level ${level} `
        : `Complete a quest to help ${garden.petName} bloom `
    ),
    makeElement("span", "", "✿")
  );
  hint.lastElementChild.setAttribute("aria-hidden", "true");
  document.querySelector("#pet-name").textContent = garden.petName;
  document.querySelector("#pet-label").replaceChildren(
    document.createTextNode(garden.petName + " "),
    makeElement("span", "", "♡")
  );
  document.querySelector("#pet-svg-title").textContent = `${garden.petName}, your leafy forest friend`;
  document.querySelector("#pet-sprite").setAttribute("aria-label", `Say hello to ${garden.petName}`);
  document.querySelector("#world-pet-name").textContent = garden.petName;
  const openingTitle = document.querySelector("#opening-title");
  const titleEmphasis = makeElement("em", "", `${garden.petName}.`);
  openingTitle.replaceChildren(
    document.createTextNode("A little world,"),
    document.createElement("br"),
    document.createTextNode("just for "),
    titleEmphasis
  );
  document.querySelector("#opening-sprite").setAttribute("aria-label", `Say hello to ${garden.petName}`);
  document.querySelector("#opening-caption").textContent = `${garden.petName}'s little corner of the world`;
  const openingAccessory = accessories.find((item) => item.id === garden.equippedAccessory);
  document.querySelector("#opening-accessory").textContent = openingAccessory ? openingAccessory.icon : "";
  document.querySelector("#points-balance").textContent = String(garden.points);
  const equipped = accessories.find((item) => item.id === garden.equippedAccessory);
  document.querySelector("#accessory-overlay").textContent = equipped ? equipped.icon : "";
  document.querySelector("#accessory-overlay").setAttribute("aria-label", equipped ? equipped.name : "");
  renderShop();
  renderDailyActivities();
}

function renderShop() {
  const shop = document.querySelector("#shop-grid");
  shop.replaceChildren();
  for (const item of accessories) {
    const owned = garden.ownedAccessories.includes(item.id);
    const equipped = garden.equippedAccessory === item.id;
    const card = makeElement("article", `shop-item${owned ? " is-owned" : ""}`);
    const icon = makeElement("span", "shop-item-icon", item.icon);
    icon.setAttribute("aria-hidden", "true");
    const details = makeElement("div", "");
    details.append(makeElement("strong", "", item.name), makeElement("p", "", item.description));
    const action = makeElement(
      "button",
      `shop-button${equipped ? " is-equipped" : ""}`,
      equipped ? "Wearing" : owned ? "Equip" : `✦ ${item.price}`
    );
    action.type = "button";
    action.setAttribute("aria-label", equipped ? `${item.name} equipped` : owned ? `Equip ${item.name}` : `Buy ${item.name} for ${item.price} dewdrops`);
    action.disabled = equipped || (!owned && garden.points < item.price);
    action.addEventListener("click", () => {
      if (owned) {
        garden.equippedAccessory = item.id;
        showToast(`${item.name} looks wonderful on ${garden.petName}!`);
      } else if (garden.points >= item.price) {
        garden.points -= item.price;
        garden.ownedAccessories.push(item.id);
        garden.equippedAccessory = item.id;
        showToast(`${item.name} is yours! ${garden.petName} is all dressed up.`);
      }
      saveGarden();
      renderTasks();
    });
    card.append(icon, details, action);
    shop.append(card);
  }
}

function renderDailyActivities() {
  const today = todayKey();
  const waterButton = document.querySelector("#water-button");
  const watered = garden.wateringDate === today;
  waterButton.disabled = watered;
  waterButton.textContent = watered ? "✓ Garden watered today" : "Water the garden · earn 5 dewdrops";
  document.querySelector("#water-seed-button").setAttribute(
    "aria-label",
    watered ? "Your seed is watered for today" : "Water your seed and earn 5 dewdrops"
  );
  document.querySelector("#water-seed-button").classList.toggle("is-watered", watered);

  const checkinToday = garden.checkinDate === today;
  const careCount = Number(watered) + Number(checkinToday);
  document.querySelector("#pet-care-label").textContent = `${careCount} / 2`;
  document.querySelector("#pet-health-progress").setAttribute("aria-valuenow", String(careCount));
  document.querySelector("#pet-health-fill").style.width = `${careCount * 50}%`;
  document.querySelector("#wellness-footnote").textContent = checkinToday
    ? "Check-in complete for today. Be kind to yourself."
    : "Check in once a day for 5 dewdrops. Your answer stays on this device.";
  document.querySelectorAll(".mood-button").forEach((button) => {
    const selected = checkinToday && button.dataset.mood === garden.checkinMood;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#checkin-note").textContent =
    checkinToday && garden.checkinMood
      ? moods[garden.checkinMood]
      : "A sip of water and a little stretch can help.";

  const fireflyButton = document.querySelector("#firefly-button");
  fireflyButton.disabled = garden.fireflyDate === today;
  fireflyButton.setAttribute(
    "aria-label",
    fireflyButton.disabled ? "Today's firefly already visited" : "Catch a firefly and earn 2 dewdrops"
  );
  fireflyButton.querySelector(".spot-tip").textContent =
    fireflyButton.disabled ? "A firefly already visited today" : "Catch a firefly · 2 dewdrops";
}

function waterGarden() {
  const today = todayKey();
  if (garden.wateringDate === today) return;
  garden.wateringDate = today;
  garden.wateringCount += 1;
  garden.points += 5;
  saveGarden();
  renderTasks();
  showToast("Your seed feels loved! +5 dewdrops. Come back tomorrow to water again.");
}

function checkIn(mood) {
  const today = todayKey();
  const isNewCheckin = garden.checkinDate !== today;
  garden.checkinDate = today;
  garden.checkinMood = mood;
  if (isNewCheckin) garden.points += 5;
  saveGarden();
  renderTasks();
  showToast(isNewCheckin ? "Thanks for checking in. +5 dewdrops for taking a moment for you." : "Thanks for checking in with yourself.");
}

function catchFirefly() {
  if (garden.fireflyDate === todayKey()) return;
  garden.fireflyDate = todayKey();
  garden.points += 2;
  saveGarden();
  renderTasks();
  showToast("A little firefly left you 2 dewdrops.");
}

function renderTimer() {
  const minutes = Math.floor(timerRemaining / 60);
  const seconds = timerRemaining % 60;
  document.querySelector("#timer-display").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const elapsed = FOCUS_SECONDS - timerRemaining;
  document.querySelector("#timer-progress").setAttribute("aria-valuenow", String(elapsed));
  document.querySelector("#timer-fill").style.width = `${(elapsed / FOCUS_SECONDS) * 100}%`;
  document.querySelector("#timer-toggle").textContent = timerInterval ? "Pause focus" : "Begin focus";
}

function toggleTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    renderTimer();
    return;
  }
  if (timerRemaining === 0) timerRemaining = FOCUS_SECONDS;
  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    if (timerRemaining <= 0) {
      timerRemaining = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      garden.points += 10;
      saveGarden();
      renderTasks();
      showToast("Focus session complete! Take a stretch. +10 dewdrops for showing up.");
    }
    renderTimer();
  }, 1000);
  renderTimer();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = FOCUS_SECONDS;
  renderTimer();
}

function updateSemesterCountdown() {
  const input = document.querySelector("#semester-end");
  input.value = garden.semesterEnd;
  const end = new Date(`${garden.semesterEnd}T23:59:59`);
  const today = new Date();
  const days = Math.ceil((end - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86_400_000);
  document.querySelector("#days-left").textContent = String(Math.max(0, days));
  document.querySelector("#semester-message").textContent =
    days < 0 ? "A new season is just beginning." :
    days === 0 ? "Your semester journey ends today!" :
    "One little step at a time.";
}

function deleteTask(id) {
  garden.tasks = garden.tasks.filter((task) => task.id !== id);
  saveGarden();
  renderTasks();
  showToast("Quest gently removed from your garden.");
}

async function verifyTask(task, evidenceField, button, proof) {
  const evidence = evidenceField.value.trim();
  if (!evidence) {
    evidenceField.focus();
    showToast("Add a little proof first so Gemini can check your quest.", true);
    return;
  }

  button.disabled = true;
  button.textContent = "Gemini is checking…";
  try {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: task.title, evidence })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Gemini couldn't check this quest.");
    if (result.verified) {
      const currentTask = garden.tasks.find((item) => item.id === task.id);
      if (currentTask && !currentTask.completed) {
        currentTask.completed = true;
        currentTask.verifiedAt = new Date().toISOString();
        garden.points += task.xp;
        currentTask.pointsEarned = task.xp;
        saveGarden();
        renderTasks();
        showToast(`Quest verified! ${garden.petName} earned ${task.xp} XP and ${task.xp} dewdrops. ${result.reason}`);
      }
    } else {
      button.disabled = false;
      button.textContent = "✧ Ask Gemini to verify";
      showToast(`Not quite yet: ${result.reason}`, true);
      proof.open = true;
    }
  } catch (error) {
    button.disabled = false;
    button.textContent = "✧ Ask Gemini to verify";
    showToast(error.message || "Couldn't reach Gemini. Please try again.", true);
  }
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  garden.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    due: String(formData.get("due") || ""),
    xp: Number(formData.get("size")),
    completed: false,
    createdAt: new Date().toISOString()
  });
  saveGarden();
  renderTasks();
  taskForm.reset();
  document.querySelector("#task-size").value = "20";
  showToast("A new quest has taken root. Good luck!");
  document.querySelector("#task-title").focus();
});

document.querySelector("#task-filter").addEventListener("change", renderTasks);
let openToolTrigger = null;
function openTool(name, trigger) {
  const app = document.querySelector("#grove-app");
  const previousPane = app.dataset.openTool === "shop"
    ? document.querySelector(".shop-section")
    : document.querySelector(".garden-tools");
  if (previousPane && !previousPane.hidden) previousPane.setAttribute("aria-hidden", "true");
  const pane = name === "shop" ? document.querySelector(".shop-section") : document.querySelector(".garden-tools");
  const selectedCard = name === "shop" ? pane : pane.querySelector(`.${name}-card`);
  app.classList.add("is-tool-open");
  app.classList.toggle("is-shop-open", name === "shop");
  app.dataset.openTool = name;
  pane.hidden = false;
  pane.setAttribute("aria-hidden", "false");
  pane.setAttribute("role", "dialog");
  pane.setAttribute("aria-modal", "true");
  pane.setAttribute("aria-label", name === "shop" ? "Accessory nook" : selectedCard.querySelector("h2").textContent);
  document.querySelectorAll("[data-open-tool]").forEach((button) => {
    button.setAttribute("aria-expanded", String(button === trigger));
  });
  openToolTrigger = trigger;
  selectedCard.querySelector("[data-close-tool]").focus();
}
function closeTool() {
  const app = document.querySelector("#grove-app");
  const pane = app.dataset.openTool === "shop"
    ? document.querySelector(".shop-section")
    : document.querySelector(".garden-tools");
  if (pane) {
    pane.hidden = true;
    pane.setAttribute("aria-hidden", "true");
    pane.removeAttribute("role");
    pane.removeAttribute("aria-modal");
  }
  app.classList.remove("is-tool-open", "is-shop-open");
  delete app.dataset.openTool;
  document.querySelectorAll("[data-open-tool]").forEach((button) => button.setAttribute("aria-expanded", "false"));
  if (openToolTrigger) openToolTrigger.focus();
  openToolTrigger = null;
}
document.querySelectorAll("[data-open-tool]").forEach((button) => {
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => openTool(button.dataset.openTool, button));
});
document.querySelectorAll("[data-close-tool]").forEach((button) => button.addEventListener("click", closeTool));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector("#grove-app").classList.contains("is-tool-open")) {
    closeTool();
  }
});
document.querySelector("#rename-pet-button").addEventListener("click", () => {
  const name = window.prompt("What would you like to call your forest friend?", garden.petName);
  if (name === null) return;
  const cleanName = name.trim().slice(0, 24);
  if (!cleanName) {
    showToast("Your friend needs a name. Try a name with at least one letter.", true);
    return;
  }
  garden.petName = cleanName;
  saveGarden();
  renderTasks();
  showToast(`Hello, ${cleanName}! Your garden friend has a name.`);
});
document.querySelector("#pet-sprite").addEventListener("click", (event) => {
  greetPet(event.currentTarget);
  showToast(`${garden.petName} wiggles hello! ♡`);
});
document.addEventListener("visibilitychange", schedulePetIdle);
document.querySelector("#firefly-button").addEventListener("click", catchFirefly);
document.querySelector("#water-button").addEventListener("click", waterGarden);
document.querySelector("#water-seed-button").addEventListener("click", waterGarden);
document.querySelectorAll(".mood-button").forEach((button) => {
  button.addEventListener("click", () => checkIn(button.dataset.mood));
});
document.querySelector("#timer-toggle").addEventListener("click", toggleTimer);
document.querySelector("#timer-reset").addEventListener("click", resetTimer);
document.querySelector("#semester-end").addEventListener("change", (event) => {
  if (!event.target.value) return;
  garden.semesterEnd = event.target.value;
  saveGarden();
  updateSemesterCountdown();
});
document.querySelector("#today-label").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric"
});
const fireflyCursor = document.querySelector("#firefly-cursor");
let cursorFrame = 0;
document.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  if (!cursorFrame) {
    cursorFrame = requestAnimationFrame(() => {
      fireflyCursor.style.transform = `translate3d(${event.clientX - 10}px, ${event.clientY - 10}px, 0)`;
      fireflyCursor.classList.add("is-visible");
      cursorFrame = 0;
    });
  }
});
document.addEventListener("pointerover", (event) => {
  if (event.pointerType !== "mouse") return;
  fireflyCursor.classList.toggle("is-hovering", Boolean(event.target.closest("button, a, select, summary")));
});
document.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "mouse") fireflyCursor.classList.remove("is-visible", "is-hovering");
});
document.querySelectorAll(".sidebar-link").forEach((link) => {
  link.addEventListener("click", () => {
    preferredNavigation = link.getAttribute("href");
    document.querySelectorAll(".sidebar-link").forEach((item) => item.classList.remove("is-active"));
    link.classList.add("is-active");
  });
});
const navigationTargets = [
  ["#game-world", ".sidebar-link[href='#game-world']"],
  ["#focus-card", ".sidebar-link[href='#focus-card']"],
  ["#shop-title", ".sidebar-link[href='#shop-title']"],
  ["#quests-title", ".sidebar-link[href='#quests-title']"]
];
let navigationFrame = 0;
let preferredNavigation = null;
function updateActiveNavigation() {
  navigationFrame = 0;
  if (preferredNavigation) return;
  const marker = 120;
  const current = navigationTargets.filter(([selector]) =>
    document.querySelector(selector).getBoundingClientRect().top <= marker
  ).at(-1);
  if (!current) return;
  document.querySelectorAll(".sidebar-link").forEach((link) => link.classList.remove("is-active"));
  document.querySelector(current[1]).classList.add("is-active");
}
window.addEventListener("scroll", () => {
  if (navigationFrame) return;
  navigationFrame = requestAnimationFrame(updateActiveNavigation);
}, { passive: true });
function resumeScrollNavigation() {
  preferredNavigation = null;
  updateActiveNavigation();
}
window.addEventListener("wheel", resumeScrollNavigation, { passive: true });
window.addEventListener("touchstart", resumeScrollNavigation, { passive: true });
window.addEventListener("keydown", (event) => {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
    resumeScrollNavigation();
  }
});
updateActiveNavigation();
document.querySelector("#task-due").min = new Date().toISOString().slice(0, 10);
renderTasks();
recordDailyVisit();
renderStreak();
updateSemesterCountdown();
renderTimer();
schedulePetIdle();
