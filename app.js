const DAILY_TASK_SECTIONS = [
  {
    title: "Daily Tasks",
    tasks: [
      "Like Home",
      "Buy Ingredients",
      "Buy Flowers",
      "Check Kaching Puzzle collection",
      "Check Bob's Furniture",
      "Check Dorthee's Clothing Store",
      "Submit Bird Info Cards to Bailey",
      "Check Pets Section",
      "Check Lab Section",
      "Check Ticket Store Section",
      "Check Events",
      "Complete Daily Request"
    ]
  },
  {
    title: "Crops & Flowers",
    tasks: ["Tend your flowers (check breeds)", "Tend Crops and Fertilize"]
  },
  {
    title: "Animals",
    tasks: ["Feed the Animals Morning", "Feed the Animals Night"]
  },
  {
    title: "Pets",
    tasks: ["Train Pets", "Feed Pets", "Clean Pets", "Pet them"]
  },
  {
    title: "Smurfs",
    tasks: ["Assist to Events Quest", "Like Home", "Tend Plans & Fertilize", "Daily Interaction"]
  }
];

const DAILY_BASE_TASKS = DAILY_TASK_SECTIONS.flatMap((section) =>
  section.tasks.map((text) => ({ text, category: section.title, builtIn: true }))
);

const WEEKLY_BASE_TASKS = [
  "Complete Weekly Task/Events",
  "Buy Fertilizer & Planting Tools",
  "Buy Fishing Tools"
];

const CROP_PRESETS = [15, 60, 120, 240, 480, 720, 960];
const TIMBER_MS = 2 * 60 * 60 * 1000;
const TRUFFLE_MS = 15 * 60 * 1000;
const STORAGE_KEY = "heartopiaTrackerData_v2";
const MAX_STATIC_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_GIF_IMAGE_BYTES = 4 * 1024 * 1024;

const els = {
  profileUpload: document.getElementById("profileUpload"),
  profilePreview: document.getElementById("profilePreview"),
  bannerUpload: document.getElementById("bannerUpload"),
  bannerPreview: document.getElementById("bannerPreview"),
  bannerPlaceholder: document.getElementById("bannerPlaceholder"),
  bannerPosition: document.getElementById("bannerPosition"),
  playerName: document.getElementById("playerName"),
  playerUid: document.getElementById("playerUid"),
  editProfileBtn: document.getElementById("editProfileBtn"),
  saveProfileBtn: document.getElementById("saveProfileBtn"),
  dailyResetCountdown: document.getElementById("dailyResetCountdown"),
  dailyList: document.getElementById("dailyList"),
  weeklyList: document.getElementById("weeklyList"),
  customList: document.getElementById("customList"),
  newDailyTask: document.getElementById("newDailyTask"),
  addDailyTaskBtn: document.getElementById("addDailyTaskBtn"),
  newCustomTask: document.getElementById("newCustomTask"),
  addCustomTaskBtn: document.getElementById("addCustomTaskBtn"),
  resetDailyBtn: document.getElementById("resetDailyBtn"),
  resetWeeklyBtn: document.getElementById("resetWeeklyBtn"),
  timberCountdown: document.getElementById("timberCountdown"),
  truffleCountdown: document.getElementById("truffleCountdown"),
  timberCollectedBtn: document.getElementById("timberCollectedBtn"),
  truffleCollectedBtn: document.getElementById("truffleCollectedBtn"),
  cropPresetWrap: document.getElementById("cropPresetWrap"),
  customCropMins: document.getElementById("customCropMins"),
  startCustomCropBtn: document.getElementById("startCustomCropBtn"),
  cropTimersList: document.getElementById("cropTimersList"),
  eventTitle: document.getElementById("eventTitle"),
  eventStart: document.getElementById("eventStart"),
  eventEnd: document.getElementById("eventEnd"),
  addEventBtn: document.getElementById("addEventBtn"),
  eventsList: document.getElementById("eventsList"),
  weatherType: document.getElementById("weatherType"),
  weatherTime: document.getElementById("weatherTime"),
  addWeatherBtn: document.getElementById("addWeatherBtn"),
  weatherList: document.getElementById("weatherList"),
  checkItemTpl: document.getElementById("checkItemTpl")
};

const defaultState = {
  profile: {
    name: "Rainbow",
    uid: "",
    imageDataUrl: "",
    bannerDataUrl: "",
    bannerPosition: 50
  },
  dailyTasks: DAILY_BASE_TASKS.map((task) => ({ id: uid(), ...task, checked: false })),
  weeklyTasks: WEEKLY_BASE_TASKS.map((text) => ({
    id: uid(),
    text,
    category: "Weekly Tasks",
    checked: false,
    builtIn: true
  })),
  customTasks: [],
  timers: {
    timber: Date.now(),
    truffle: Date.now(),
    cropTimers: []
  },
  events: [],
  weather: [],
  lastDailyResetKey: "",
  lastWeeklyResetKey: ""
};

let state = load();
let profileEditMode = false;
let hasShownStorageWarning = false;

init();

function init() {
  ensureResets();
  renderAll();
  bind();
  setInterval(tickTimers, 1000);
}

function bind() {
  els.profileUpload.addEventListener("change", onProfileUpload);
  els.bannerUpload.addEventListener("change", onBannerUpload);

  els.bannerPosition.addEventListener("input", () => {
    state.profile.bannerPosition = Number(els.bannerPosition.value);
    save();
    applyBannerPosition();
  });

  els.editProfileBtn.addEventListener("click", () => {
    profileEditMode = true;
    renderProfileEditorState();
  });

  els.saveProfileBtn.addEventListener("click", () => {
    state.profile.name = els.playerName.value.trim() || "Rainbow";
    state.profile.uid = els.playerUid.value.trim();
    profileEditMode = false;
    save();
    renderProfileEditorState();
  });

  els.addDailyTaskBtn.addEventListener("click", () => {
    const text = els.newDailyTask.value.trim();
    if (!text) return;
    state.dailyTasks.push({ id: uid(), text, category: "Custom Daily", checked: false, builtIn: false });
    els.newDailyTask.value = "";
    saveAndRender();
  });

  els.addCustomTaskBtn.addEventListener("click", () => {
    const text = els.newCustomTask.value.trim();
    if (!text) return;
    state.customTasks.push({ id: uid(), text, category: "Custom Tasks", checked: false });
    els.newCustomTask.value = "";
    saveAndRender();
  });

  els.resetDailyBtn.addEventListener("click", () => {
    state.dailyTasks.forEach((task) => {
      task.checked = false;
    });
    state.lastDailyResetKey = getPhResetKey();
    saveAndRender();
  });

  els.resetWeeklyBtn.addEventListener("click", () => {
    state.weeklyTasks.forEach((task) => {
      task.checked = false;
    });
    state.lastWeeklyResetKey = getPhWeekKey();
    saveAndRender();
  });

  els.timberCollectedBtn.addEventListener("click", () => {
    state.timers.timber = Date.now();
    save();
    tickTimers();
  });

  els.truffleCollectedBtn.addEventListener("click", () => {
    state.timers.truffle = Date.now();
    save();
    tickTimers();
  });

  CROP_PRESETS.forEach((mins) => {
    const btn = document.createElement("button");
    btn.textContent = `${mins >= 60 ? mins / 60 + "h" : mins + "m"}`;
    btn.addEventListener("click", () => addCropTimer(mins));
    els.cropPresetWrap.appendChild(btn);
  });

  els.startCustomCropBtn.addEventListener("click", () => {
    const mins = Number(els.customCropMins.value);
    if (!Number.isFinite(mins) || mins <= 0) return;
    addCropTimer(mins);
    els.customCropMins.value = "";
  });

  els.addEventBtn.addEventListener("click", () => {
    const title = els.eventTitle.value.trim();
    const start = els.eventStart.value;
    const end = els.eventEnd.value;
    if (!title || !start || !end) return;
    state.events.push({ id: uid(), title, start, end });
    els.eventTitle.value = "";
    els.eventStart.value = "";
    els.eventEnd.value = "";
    saveAndRender();
  });

  els.addWeatherBtn.addEventListener("click", () => {
    const type = els.weatherType.value;
    const when = els.weatherTime.value;
    if (!when) return;
    state.weather.push({ id: uid(), type, when });
    els.weatherTime.value = "";
    saveAndRender();
  });
}

function renderAll() {
  renderProfile();
  renderChecklist(els.dailyList, state.dailyTasks, "daily");
  renderChecklist(els.weeklyList, state.weeklyTasks, "weekly");
  renderChecklist(els.customList, state.customTasks, "custom");
  renderCropTimers();
  renderEvents();
  renderWeather();
  tickTimers();
}

function renderProfile() {
  els.playerName.value = state.profile.name || "Rainbow";
  els.playerUid.value = state.profile.uid || "";

  if (state.profile.imageDataUrl) {
    els.profilePreview.src = state.profile.imageDataUrl;
    els.profilePreview.style.display = "block";
    document.querySelector(".avatar-placeholder").style.display = "none";
  }

  if (state.profile.bannerDataUrl) {
    els.bannerPreview.src = state.profile.bannerDataUrl;
    els.bannerPreview.style.display = "block";
    els.bannerPlaceholder.style.display = "none";
  }

  els.bannerPosition.value = String(state.profile.bannerPosition ?? 50);
  applyBannerPosition();
  renderProfileEditorState();
}

function renderProfileEditorState() {
  els.playerName.disabled = !profileEditMode;
  els.playerUid.disabled = !profileEditMode;
  els.saveProfileBtn.disabled = !profileEditMode;
  els.editProfileBtn.disabled = profileEditMode;
}

function renderChecklist(container, items, kind) {
  container.innerHTML = "";

  const unchecked = items.filter((item) => !item.checked);
  const completed = items.filter((item) => item.checked);

  renderChecklistSections(container, unchecked, kind);

  if (completed.length > 0) {
    const drawer = document.createElement("li");
    drawer.className = "completed-drawer";

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = `Completed (${completed.length})`;

    const completedList = document.createElement("ul");
    completedList.className = "checklist completed-list";

    renderChecklistSections(completedList, completed, kind);

    details.append(summary, completedList);
    drawer.appendChild(details);
    container.appendChild(drawer);
  }
}

function renderChecklistSections(container, items, kind) {
  if (!items.length) return;

  const groups = groupTasks(items, kind);
  const order = getGroupOrder(kind, groups);

  order.forEach((category) => {
    const sectionItems = groups.get(category) || [];
    if (!sectionItems.length) return;

    const separator = document.createElement("li");
    separator.className = "section-separator";
    separator.textContent = category;
    container.appendChild(separator);

    sectionItems.forEach((item) => {
      container.appendChild(makeChecklistItem(item, kind));
    });
  });
}

function groupTasks(items, kind) {
  const map = new Map();
  items.forEach((item) => {
    const category = resolveCategory(item, kind);
    if (!map.has(category)) {
      map.set(category, []);
    }
    map.get(category).push(item);
  });
  return map;
}

function getGroupOrder(kind, groups) {
  const keys = Array.from(groups.keys());
  if (kind === "daily") {
    const fixed = DAILY_TASK_SECTIONS.map((s) => s.title);
    const dynamic = keys.filter((k) => !fixed.includes(k));
    return [...fixed, ...dynamic];
  }
  if (kind === "weekly") {
    const dynamic = keys.filter((k) => k !== "Weekly Tasks");
    return ["Weekly Tasks", ...dynamic];
  }
  const dynamic = keys.filter((k) => k !== "Custom Tasks");
  return ["Custom Tasks", ...dynamic];
}

function resolveCategory(item, kind) {
  if (kind === "daily") return item.category || "Daily Tasks";
  if (kind === "weekly") return item.category || "Weekly Tasks";
  return item.category || "Custom Tasks";
}

function makeChecklistItem(item, kind) {
  const node = els.checkItemTpl.content.firstElementChild.cloneNode(true);
  const checkbox = node.querySelector("input[type=checkbox]");
  const textNode = node.querySelector(".task-text");
  const actions = node.querySelector(".row-actions");

  checkbox.checked = item.checked;
  textNode.textContent = item.text;

  checkbox.addEventListener("change", () => {
    item.checked = checkbox.checked;
    saveAndRender();
  });

  if (kind === "custom" || (kind === "daily" && !item.builtIn)) {
    const editBtn = document.createElement("button");
    editBtn.className = "secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      const next = prompt("Edit task", item.text);
      if (!next) return;
      item.text = next.trim();
      saveAndRender();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      if (kind === "custom") {
        state.customTasks = state.customTasks.filter((t) => t.id !== item.id);
      } else {
        state.dailyTasks = state.dailyTasks.filter((t) => t.id !== item.id);
      }
      saveAndRender();
    });

    actions.append(editBtn, delBtn);
  }

  return node;
}

function renderCropTimers() {
  els.cropTimersList.innerHTML = "";
  state.timers.cropTimers.forEach((timer) => {
    const li = document.createElement("li");
    li.className = "timer-item";

    const left = document.createElement("div");
    left.textContent = `${timer.label}: ${formatMs(Math.max(0, timer.durationMs - (Date.now() - timer.startedAt)))}`;

    const actions = document.createElement("div");
    actions.className = "row-actions";

    const reset = document.createElement("button");
    reset.textContent = "Collected";
    reset.className = "secondary";
    reset.addEventListener("click", () => {
      timer.startedAt = Date.now();
      saveAndRender();
    });

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "danger";
    del.addEventListener("click", () => {
      state.timers.cropTimers = state.timers.cropTimers.filter((t) => t.id !== timer.id);
      saveAndRender();
    });

    actions.append(reset, del);
    li.append(left, actions);
    els.cropTimersList.appendChild(li);
  });
}

function renderEvents() {
  els.eventsList.innerHTML = "";
  state.events.forEach((event) => {
    const li = document.createElement("li");
    li.className = "simple-item";
    li.innerHTML = `<span><strong>${escapeHtml(event.title)}</strong><br>${formatDate(event.start)} - ${formatDate(event.end)}</span>`;

    const actions = document.createElement("div");
    actions.className = "row-actions";

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.className = "secondary";
    edit.addEventListener("click", () => {
      const title = prompt("Event title", event.title);
      if (!title) return;
      const start = prompt("Event start (YYYY-MM-DDTHH:mm)", event.start);
      const end = prompt("Event end (YYYY-MM-DDTHH:mm)", event.end);
      if (!start || !end) return;
      event.title = title.trim();
      event.start = start;
      event.end = end;
      saveAndRender();
    });

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "danger";
    del.addEventListener("click", () => {
      state.events = state.events.filter((e) => e.id !== event.id);
      saveAndRender();
    });

    actions.append(edit, del);
    li.append(actions);
    els.eventsList.appendChild(li);
  });
}

function renderWeather() {
  els.weatherList.innerHTML = "";
  state.weather.forEach((weather) => {
    const li = document.createElement("li");
    li.className = "simple-item";
    li.innerHTML = `<span><strong>${weather.type}</strong><br>${formatDate(weather.when)}</span>`;

    const actions = document.createElement("div");
    actions.className = "row-actions";

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.className = "secondary";
    edit.addEventListener("click", () => {
      const type = prompt("Weather (Rainy/Snowy/Sunny/Rainbow/Aurora)", weather.type);
      const when = prompt("When (YYYY-MM-DDTHH:mm)", weather.when);
      if (!type || !when) return;
      if (!["Rainy", "Snowy", "Sunny", "Rainbow", "Aurora"].includes(type)) return;
      weather.type = type;
      weather.when = when;
      saveAndRender();
    });

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "danger";
    del.addEventListener("click", () => {
      state.weather = state.weather.filter((w) => w.id !== weather.id);
      saveAndRender();
    });

    actions.append(edit, del);
    li.append(actions);
    els.weatherList.appendChild(li);
  });
}

function tickTimers() {
  ensureResets();

  const timberRemaining = TIMBER_MS - (Date.now() - state.timers.timber);
  const truffleRemaining = TRUFFLE_MS - (Date.now() - state.timers.truffle);

  els.timberCountdown.textContent = timberRemaining <= 0 ? "Ready now" : formatMs(timberRemaining);
  els.truffleCountdown.textContent = truffleRemaining <= 0 ? "Ready now" : formatMs(truffleRemaining);
  els.dailyResetCountdown.textContent = formatMs(getMsUntilNextPhReset());

  const rows = els.cropTimersList.querySelectorAll(".timer-item");
  rows.forEach((row, index) => {
    const timer = state.timers.cropTimers[index];
    if (!timer) return;
    const remaining = timer.durationMs - (Date.now() - timer.startedAt);
    row.firstChild.textContent = `${timer.label}: ${remaining <= 0 ? "Ready now" : formatMs(remaining)}`;
  });
}

function addCropTimer(minutes) {
  const mins = Math.round(minutes);
  const label = mins >= 60 ? `${mins / 60} hour crop` : `${mins} min crop`;
  state.timers.cropTimers.push({
    id: uid(),
    label,
    durationMs: mins * 60 * 1000,
    startedAt: Date.now()
  });
  saveAndRender();
}

function ensureResets() {
  const currentDailyKey = getPhResetKey();
  if (state.lastDailyResetKey !== currentDailyKey) {
    state.dailyTasks.forEach((t) => {
      t.checked = false;
    });
    state.lastDailyResetKey = currentDailyKey;
  }

  const currentWeekKey = getPhWeekKey();
  if (state.lastWeeklyResetKey !== currentWeekKey) {
    state.weeklyTasks.forEach((t) => {
      t.checked = false;
    });
    state.lastWeeklyResetKey = currentWeekKey;
  }

  save();
}

function getPhParts() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short"
  });

  const parts = {};
  fmt.formatToParts(now).forEach((p) => {
    if (p.type !== "literal") parts[p.type] = p.value;
  });

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: parts.weekday
  };
}

function getPhResetKey() {
  const ph = getPhParts();
  let date = `${ph.year}-${pad2(ph.month)}-${pad2(ph.day)}`;
  if (ph.hour < 7) {
    const d = new Date(Date.UTC(ph.year, ph.month - 1, ph.day));
    d.setUTCDate(d.getUTCDate() - 1);
    date = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }
  return date;
}

function getPhWeekKey() {
  const ph = getPhParts();
  const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(ph.weekday);
  const anchor = new Date(Date.UTC(ph.year, ph.month - 1, ph.day));

  let daysSinceReset = (dayIdx + 1) % 7;
  if (dayIdx === 6 && ph.hour < 7) {
    daysSinceReset = 7;
  }

  anchor.setUTCDate(anchor.getUTCDate() - daysSinceReset);
  return `${anchor.getUTCFullYear()}-W-${pad2(anchor.getUTCMonth() + 1)}-${pad2(anchor.getUTCDate())}`;
}

function getMsUntilNextPhReset() {
  const ph = getPhParts();
  const addDay = ph.hour >= 7 ? 1 : 0;
  const targetMs = Date.UTC(ph.year, ph.month - 1, ph.day + addDay, -1, 0, 0);
  return Math.max(0, targetMs - Date.now());
}

function onProfileUpload(e) {
  const file = e.target.files[0];
  if (!validateUploadFile(file, "profile picture")) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.profile.imageDataUrl = reader.result;
    saveAndRender();
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function onBannerUpload(e) {
  const file = e.target.files[0];
  if (!validateUploadFile(file, "banner")) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.profile.bannerDataUrl = reader.result;
    saveAndRender();
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function applyBannerPosition() {
  const pos = Number(state.profile.bannerPosition ?? 50);
  els.bannerPreview.style.objectPosition = `center ${pos}%`;
}

function saveAndRender() {
  save();
  renderAll();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    if (!hasShownStorageWarning) {
      alert("Upload failed to save. The image/GIF is likely too large for browser storage. Try a smaller file.");
      hasShownStorageWarning = true;
    }
    console.error(error);
    return false;
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const data = JSON.parse(raw);
    return mergeWithDefault(data);
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeWithDefault(data) {
  const merged = structuredClone(defaultState);
  return {
    ...merged,
    ...data,
    profile: { ...merged.profile, ...(data.profile || {}) },
    timers: {
      ...merged.timers,
      ...(data.timers || {}),
      cropTimers: data.timers?.cropTimers || []
    },
    dailyTasks:
      Array.isArray(data.dailyTasks) && data.dailyTasks.length
        ? normalizeDailyTasks(data.dailyTasks)
        : merged.dailyTasks,
    weeklyTasks:
      Array.isArray(data.weeklyTasks) && data.weeklyTasks.length
        ? data.weeklyTasks.map((task) => ({ ...task, category: task.category || "Weekly Tasks" }))
        : merged.weeklyTasks,
    customTasks:
      Array.isArray(data.customTasks) && data.customTasks.length
        ? data.customTasks.map((task) => ({ ...task, category: task.category || "Custom Tasks" }))
        : [],
    events: data.events || [],
    weather: data.weather || []
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validateUploadFile(file, label) {
  if (!file || !file.type.startsWith("image/")) return false;

  const isGif = file.type === "image/gif";
  const maxBytes = isGif ? MAX_GIF_IMAGE_BYTES : MAX_STATIC_IMAGE_BYTES;

  if (file.size > maxBytes) {
    const limitMb = (maxBytes / (1024 * 1024)).toFixed(0);
    alert(`Please use a smaller ${label}. Max size is ${limitMb}MB (${isGif ? "GIF" : "image"}).`);
    return false;
  }

  return true;
}

function normalizeDailyTasks(tasks) {
  const builtInByText = new Map();
  DAILY_BASE_TASKS.forEach((task) => {
    if (!builtInByText.has(task.text)) {
      builtInByText.set(task.text, []);
    }
    builtInByText.get(task.text).push(task.category);
  });

  return tasks.map((task) => {
    if (task.category) return task;
    if (task.text === "SMURFS: Like Home") {
      return { ...task, text: "Like Home", category: "Smurfs" };
    }
    const categories = builtInByText.get(task.text);
    const category = task.builtIn && categories ? categories[0] : "Custom Daily";
    return { ...task, category };
  });
}
