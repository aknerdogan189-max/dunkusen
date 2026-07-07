const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class FakeClassList {
  add() {}
  remove() {}
  toggle() {}
  contains() { return false; }
}

class FakeElement {
  constructor() {
    this.classList = new FakeClassList();
    this.style = { setProperty() {} };
    this.dataset = {};
    this.children = [];
    this.hidden = false;
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
    this.offsetWidth = 320;
    this.offsetLeft = 0;
    this.offsetTop = 0;
    this.scrollLeft = 0;
    this.firstElementChild = new Proxy({}, { get: () => "" , set: () => true });
  }
  addEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  querySelector() { return new FakeElement(); }
  querySelectorAll() { return []; }
  scrollTo() {}
  scrollIntoView() {}
  focus() {}
  remove() {}
  getAttribute() { return ""; }
  getBoundingClientRect() {
    return { left: 0, right: 32, top: 0, bottom: 52, width: 32, height: 52 };
  }
}

const elementStore = new Map();
const document = {
  querySelector(selector) {
    if (!elementStore.has(selector)) elementStore.set(selector, new FakeElement());
    return elementStore.get(selector);
  },
  querySelectorAll() { return []; },
  createElement() { return new FakeElement(); },
};

const storage = new Map();
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};

const context = {
  console,
  document,
  localStorage,
  navigator: { vibrate() {} },
  Intl,
  Date,
  Math,
  JSON,
  Number,
  String,
  Array,
  Map,
  Set,
  Proxy,
  setTimeout() { return 1; },
  clearTimeout() {},
  requestAnimationFrame(callback) { callback(); return 1; },
};
context.window = {
  localStorage,
  setTimeout: context.setTimeout,
  clearTimeout: context.clearTimeout,
  requestAnimationFrame: context.requestAnimationFrame,
  scrollTo() {},
};
context.globalThis = context;

vm.createContext(context);
const root = __dirname;
vm.runInContext(fs.readFileSync(path.join(root, "goal-catalog.js"), "utf8"), context, { filename: "goal-catalog.js" });
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
vm.runInContext(`${appSource}
globalThis.__appTest = {
  goalTemplates,
  tasks,
  state,
  goalTracking,
  ensureGoalTask,
  ensureGoalTracking,
  getTodayOutcome,
  getContinuity,
  getDailySummary,
  summarizeRange,
  getCurrentStreak,
  getConsecutiveMisses,
  completeTodayStep,
  missTodayStep,
  applyGoalResize,
  toDateKey,
  shiftDateKey,
};`, context, { filename: "app.js" });

const app = context.__appTest;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// Hazır hedef: zor gün ilerlemeyi azaltmamalı ve yarına geri dönüş hazırlamalı.
const walkTask = app.ensureGoalTask("walk");
const walkProgress = app.goalTemplates.walk.progress;
app.state.activeTask = walkTask;
app.state.checkinGoal = "walk";
app.state.selectedMissReason = "energy";
document.querySelector("#missNote").value = "Bugün enerjim düşüktü.";
app.missTodayStep(walkTask);
assert(app.goalTemplates.walk.progress === walkProgress, "Zor gün hazır hedefin basamağını değiştirdi.");
assert(app.getTodayOutcome("walk")?.status === "missed", "Hazır hedefin zor gün sonucu kaydedilmedi.");
assert(app.ensureGoalTracking("walk").recovery, "Hazır hedef için geri dönüş adımı oluşturulmadı.");

// Hazır hedef: normal tamamlanma bir basamak artırmalı.
const readTask = app.ensureGoalTask("read");
const readProgress = app.goalTemplates.read.progress;
app.completeTodayStep(readTask);
assert(app.goalTemplates.read.progress === readProgress + 1, "Hazır hedef bir basamak ilerlemedi.");
assert(app.getTodayOutcome("read")?.status === "complete", "Hazır hedef tamamlanmış olarak kaydedilmedi.");

// Sonradan eklenen hedef: aynı tamamlama yolu ve aynı +1 ilerleme.
const customId = "custom-smoke";
app.goalTemplates[customId] = {
  id: customId,
  title: "Test hedefi",
  subtitle: "10 dakika · Her gün",
  progress: 1,
  accent: "90,227,174",
  trend: "İlk basamak",
  category: "custom",
  icon: "✦",
  rule: "10 dakika tamamla",
  amount: 10,
  unit: "dakika",
  frequency: "Her gün",
};
app.state.goals.push(customId);
app.ensureGoalTracking(customId).progress = 1;
const customTask = app.ensureGoalTask(customId);
app.completeTodayStep(customTask);
assert(app.goalTemplates[customId].progress === 2, "Sonradan eklenen hedef 1'den 2'ye çıkmadı.");
assert(app.getTodayOutcome(customId)?.status === "complete", "Sonradan eklenen hedef tamamlanmış olarak kaydedilmedi.");

// Üç zor gün algısı ve hedef küçültmede geçmişin korunması.
const tracking = app.ensureGoalTracking(customId);
tracking.events = [-2, -1, 0].map((offset) => ({
  date: app.shiftDateKey(app.toDateKey(), offset),
  status: "missed",
  reason: "hard",
  note: "",
  recovery: false,
}));
assert(app.getConsecutiveMisses(customId) === 3, "Üç zor gün üst üste algılanmadı.");
const beforeResizeProgress = app.goalTemplates[customId].progress;
app.applyGoalResize(customId);
assert(app.goalTemplates[customId].amount === 6, "Hedef önerilen ölçüde küçülmedi.");
assert(app.goalTemplates[customId].progress === beforeResizeProgress, "Hedef küçültme basamak geçmişini sildi.");

// Planlı dinlenme devamlılık yüzdesinin paydasına girmemeli.
tracking.events = [
  { date: app.shiftDateKey(app.toDateKey(), -1), status: "complete" },
  { date: app.toDateKey(), status: "rest", reason: "planned" },
];
assert(app.getContinuity(customId, 7) === 100, "Planlı dinlenme devamlılık yüzdesini düşürdü.");
assert(app.getDailySummary(app.toDateKey(), [customId]).status === "rest", "Planlı dinlenme analiz takviminde dinlenme görünmedi.");
const analysisSummary = app.summarizeRange(app.shiftDateKey(app.toDateKey(), -1), app.toDateKey(), [customId]);
assert(analysisSummary.score === 100, "Analiz motoru planlı dinlenmeyi başarı oranının paydasına ekledi.");
assert(app.getCurrentStreak([customId]) === 2, "Planlı dinlenme analiz serisini bozdu.");

console.log("Dünkü Sen smoke test: PASS");
