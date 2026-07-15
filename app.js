const goalTemplates = {
  walk: {
    id: "walk", title: "Günlük yürüyüş", subtitle: "10.000 adım · Her gün",
    progress: 0, targetSteps: 100, accent: "102,229,255", trend: "Bugün 0. basamaktan başlıyorsun",
    category: "health", groupId: "health", icon: "⌁", rule: "10.000 adımı tamamla",
    amount: 10000, unit: "adım", frequency: "Her gün",
  },
  read: {
    id: "read", title: "Düzenli kitap oku", subtitle: "20 sayfa · Her gün",
    progress: 0, targetSteps: 100, accent: "175,112,255", trend: "Bugün 0. basamaktan başlıyorsun",
    category: "learning", groupId: "personal", icon: "▤", rule: "20 sayfa kitap oku",
    amount: 20, unit: "sayfa", frequency: "Her gün",
  },
  save: {
    id: "save", title: "Birikim yap", subtitle: "Hedef: ₺50.000",
    progress: 0, targetSteps: 100, accent: "90,227,174", trend: "Bugün 0. basamaktan başlıyorsun",
    category: "finance", groupId: "finance", icon: "₺", rule: "Hedef tutarının %1’ini biriktir",
    amount: 1, unit: "birikim adımı", frequency: "Her gün",
  },
  language: {
    id: "language", title: "Yeni bir dil öğren", subtitle: "20 dakika · Haftada 5 gün",
    progress: 0, targetSteps: 100, accent: "244,197,108", trend: "Bugün 0. basamaktan başlıyorsun",
    category: "learning", groupId: "learning", icon: "A", rule: "20 dakika odaklı çalışma yap",
    amount: 20, unit: "dakika", frequency: "Haftada 5 gün",
  },
};

const BUILT_IN_GROUPS = [
  { id: "health", name: "Sağlık", icon: "🟢", color: "90,227,174", builtIn: true },
  { id: "supplement", name: "Supplement", icon: "💊", color: "175,112,255", builtIn: true },
  { id: "finance", name: "Finans", icon: "💰", color: "90,227,174", builtIn: true },
  { id: "personal", name: "Kişisel gelişim", icon: "📚", color: "175,112,255", builtIn: true },
  { id: "sport", name: "Spor", icon: "🏋️", color: "244,197,108", builtIn: true },
  { id: "learning", name: "Öğrenme", icon: "🎓", color: "102,229,255", builtIn: true },
  { id: "mental", name: "Zihinsel", icon: "☼", color: "255,141,184", builtIn: true },
  { id: "academic", name: "Akademik", icon: "✎", color: "102,229,255", builtIn: true },
];

const tasks = [
  { id: "walk", goalId: "walk", title: "10.000 adım yürü", meta: "Sağlık · 6.420 / 10.000", baseMeta: "Sağlık · 10.000 adım", xp: 20, done: false },
  { id: "read", goalId: "read", title: "20 sayfa kitap oku", meta: "Öğrenme · 20 sayfa", baseMeta: "Öğrenme · 20 sayfa", xp: 15, done: false },
  { id: "save", goalId: "save", title: "Birikim adımını tamamla", meta: "Finans · Bugünkü küçük katkı", baseMeta: "Finans · Bugünkü küçük katkı", xp: 15, done: false },
];

const XP_PER_LEVEL = 100;
const CLEAN_START_CONSUMED_KEY = "dunku-sen-clean-start-consumed-v1";

function removeLocalAppData({ keepCleanStartFlag = false } = {}) {
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
      .filter(Boolean)
      .filter((key) => key.startsWith("dunku-sen-") || key.startsWith("note-"));
    keys.forEach((key) => {
      if (keepCleanStartFlag && key === CLEAN_START_CONSUMED_KEY) return;
      window.localStorage.removeItem(key);
    });
  } catch {
    // Depolama erişimi kapalıysa normal açılış devam eder.
  }
}

function hasLocalAppData() {
  try {
    return Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
      .filter(Boolean)
      .filter((key) => key !== CLEAN_START_CONSUMED_KEY)
      .some((key) => key.startsWith("dunku-sen-") || key.startsWith("note-"));
  } catch {
    return false;
  }
}

function prepareCleanStartFromUrl() {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const forceReset = params.get("reset") === "1";
    const cleanStart = params.get("new") === "1" || params.get("fresh") === "1";
    const alreadyConsumed = window.localStorage.getItem(CLEAN_START_CONSUMED_KEY) === "true";
    if (forceReset || (cleanStart && !alreadyConsumed)) {
      if (hasLocalAppData()) {
        window.alert("Bu cihazda Dünkü Sen verilerin var. Güvenlik için hiçbir veri silinmedi.");
      } else {
        removeLocalAppData({ keepCleanStartFlag: false });
        if (cleanStart && !forceReset) window.localStorage.setItem(CLEAN_START_CONSUMED_KEY, "true");
      }
    }
    if (forceReset || cleanStart) {
      ["reset", "new", "fresh"].forEach((key) => params.delete(key));
      const cleanUrl = `${url.pathname}${params.toString() ? `?${params}` : ""}${url.hash}`;
      window.history.replaceState({}, "", cleanUrl || "/");
    }
  } catch {
    // URL temizliği yapılamazsa uygulama yine açılır.
  }
}

prepareCleanStartFromUrl();

const state = {
  onboardingStep: 0,
  gender: window.localStorage.getItem("dunku-sen-gender") || "unspecified",
  goals: ["walk", "read", "save"],
  activeTask: null,
  activeGoal: null,
  checkinGoal: null,
  goalFilter: "all",
  groupFilter: "all",
  carouselIndex: 0,
  catalogCategory: "all",
  selectedCatalogGoal: null,
  selectedAccent: "102,229,255",
  newGoalId: null,
  milestoneGoalId: null,
  stepAnimation: null,
  selectedMissReason: null,
  resizeSuggestionGoalId: null,
  inviteGoalId: null,
  activeFriendId: null,
  analysisRange: 30,
  analysisGoal: "all",
  analysisGroup: "all",
  analysisMonth: null,
  calendarEditDate: null,
  xpBase: 0,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const onboarding = $("#onboarding");
const goalCarousel = $("#goalCarousel");
const carouselDots = $("#carouselDots");
const taskList = $("#taskList");
const toast = $("#toast");
const toastTitle = $("#toastTitle");
const toastText = $("#toastText");
const sheetBackdrop = $("#sheetBackdrop");
const checkinSheet = $("#checkinSheet");
const journalSheet = $("#journalSheet");
const confettiLayer = $("#confettiLayer");
const goalCreator = $("#goalCreator");
const catalogView = $("#catalogView");
const customizeView = $("#customizeView");
let toastTimer;
let milestoneTimer;

function addSectionSubtitle(headingSelector, text) {
  const heading = $(headingSelector);
  if (!heading || heading.nextElementSibling?.classList?.contains("section-subtitle")) return;
  const subtitle = document.createElement("p");
  subtitle.className = "section-subtitle";
  subtitle.textContent = text;
  heading.parentNode?.insertBefore(subtitle, heading.nextSibling);
}

function moveAfter(anchor, element) {
  if (!anchor || !element || anchor === element) return;
  anchor.parentNode?.insertBefore(element, anchor.nextSibling);
}

function simplifyTodayLayout() {
  const topbar = $(".topbar.today-view");
  const todaySection = $(".today-section.today-view");
  const goalsSection = $(".goals-section.today-view");
  const levelBar = $(".level-bar.today-view");
  const moodCard = $(".mood-card.today-view");

  todaySection?.classList.add("daily-priority");
  goalsSection?.classList.add("simplified-goals");
  levelBar?.classList.add("compact-level");

  const todayKicker = $(".today-section .kicker");
  if (todayKicker) todayKicker.textContent = "ÖNCE BUGÜN";
  addSectionSubtitle("#todayHeading", "Bir adımı tamamla; karakterin ilgili merdivende 1 basamak çıksın.");
  addSectionSubtitle("#goalsHeading", "Bugünkü tikler burada yolculuğa dönüşür.");

  const swipeHint = $(".swipe-hint");
  if (swipeHint) swipeHint.innerHTML = "<span>↔</span> Merdivenler arasında kaydır";
  const xpCopy = $(".xp-copy span");
  if (xpCopy) xpCopy.textContent = "Bugünkü emeklerin XP'ye dönüşür";

  moveAfter(topbar, todaySection);
  moveAfter(todaySection, goalsSection);
  moveAfter(goalsSection, levelBar);
  moveAfter(levelBar, moodCard);
}

const TRACKING_KEY = "dunku-sen-goal-tracking-v2";
const MOOD_KEY = "dunku-sen-mood-tracking-v1";
const GROUPS_KEY = "dunku-sen-groups-v1";
const GROUP_COLLAPSE_KEY = "dunku-sen-group-collapse-v1";
const GROUP_OVERRIDES_KEY = "dunku-sen-group-overrides-v1";
const GROUP_DELETED_KEY = "dunku-sen-group-deleted-v1";
const GOAL_OVERRIDES_KEY = "dunku-sen-goal-overrides-v1";
const PROFILE_NAME_KEY = "dunku-sen-profile-name-v1";
const PROFILE_GOALS_KEY = "dunku-sen-profile-goals-v1";
const ONBOARDED_KEY = "dunku-sen-onboarded";
const SOCIAL_KEY = "dunku-sen-social-v1";
const SOCIAL_SESSION_KEY = "dunku-sen-backend-session-v1";
const SOCIAL_REFRESH_MS = 4000;
const missReasonLabels = {
  time: "Zamanım yetmedi",
  energy: "Enerjim düşüktü",
  forgot: "Unuttum",
  hard: "Hedef ağır geldi",
  health: "Sağlığım elvermedi",
  planned: "Planlı dinlenme",
  manual: "Takvimden düzenlendi",
  unspecified: "Neden belirtilmedi",
};

const outcomeLabels = {
  complete: "Tamamlandı",
  missed: "Olmadı",
  rest: "Planlı dinlenme",
  partial: "Kısmi",
  empty: "Kayıt yok",
  pending: "Bekliyor",
};

function makeInviteCode() {
  return `DS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createDefaultSocialState() {
  return {
    inviteCode: makeInviteCode(),
    shareScope: "selected",
    friends: [],
    pendingInvites: [],
    sharedJourneys: [],
    activities: [],
  };
}

function loadSocialState() {
  const defaults = createDefaultSocialState();
  try {
    const saved = JSON.parse(window.localStorage.getItem(SOCIAL_KEY) || "null");
    if (!saved) return defaults;
    const hydrated = {
      ...defaults,
      ...saved,
      friends: Array.isArray(saved.friends) ? saved.friends : defaults.friends,
      pendingInvites: Array.isArray(saved.pendingInvites) ? saved.pendingInvites : defaults.pendingInvites,
      sharedJourneys: Array.isArray(saved.sharedJourneys) ? saved.sharedJourneys : defaults.sharedJourneys,
      activities: Array.isArray(saved.activities) ? saved.activities : defaults.activities,
    };
    delete hydrated.messages;
    return hydrated;
  } catch {
    return defaults;
  }
}

let socialState = loadSocialState();
let socialBackendSession = loadSocialBackendSession();
let socialBackendConnected = false;
let socialRefreshTimer = null;
let socialProfileSyncTimer = null;

function saveSocialState() {
  window.localStorage.setItem(SOCIAL_KEY, JSON.stringify(socialState));
}

function loadSocialBackendSession() {
  try {
    const session = JSON.parse(window.localStorage.getItem(SOCIAL_SESSION_KEY) || "null");
    return session?.token && session?.userId ? session : null;
  } catch {
    return null;
  }
}

function saveSocialBackendSession(session) {
  socialBackendSession = session;
  try {
    if (session) window.localStorage.setItem(SOCIAL_SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SOCIAL_SESSION_KEY);
  } catch {
    // Oturum belleğe yazılamasa da açık sayfada backend bağlantısı çalışmaya devam eder.
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setSocialSyncStatus(mode, label) {
  const status = $("#socialSyncStatus");
  if (!status) return;
  status.dataset.state = mode;
  const text = $("span", status);
  if (text) text.textContent = label;
}

function getInviteCodeFromUrl() {
  const inviteMatch = (window.location?.search || "").match(/[?&]invite=([^&]+)/);
  if (!inviteMatch) return null;
  try {
    return decodeURIComponent(inviteMatch[1]);
  } catch {
    return inviteMatch[1];
  }
}

function getInviteGoalIdFromUrl() {
  const inviteGoalMatch = (window.location?.search || "").match(/[?&]goal=([^&]+)/);
  if (!inviteGoalMatch) return null;
  try {
    return decodeURIComponent(inviteGoalMatch[1]);
  } catch {
    return inviteGoalMatch[1];
  }
}

function isOnboarded() {
  return window.localStorage.getItem(ONBOARDED_KEY) === "true"
    || Boolean(window.localStorage.getItem(PROFILE_NAME_KEY)?.trim());
}

function getSavedGoalIds() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_GOALS_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((goalId) => goalTemplates[goalId]) : [];
  } catch {
    return [];
  }
}

function saveSelectedGoals() {
  try {
    window.localStorage.setItem(PROFILE_GOALS_KEY, JSON.stringify(state.goals.filter((goalId) => goalTemplates[goalId])));
  } catch {
    // Depolama kapalıysa mevcut oturum yine çalışır.
  }
}

function completeOnboardingProfile(name) {
  const cleanName = name.trim() || "Yolcu";
  $("#userNameLabel").textContent = cleanName;
  $("#readyName").textContent = cleanName;
  $("#avatarLetter").textContent = cleanName[0].toLocaleUpperCase("tr-TR");
  saveSelectedGoals();
  window.localStorage.setItem(ONBOARDED_KEY, "true");
  window.localStorage.setItem(PROFILE_NAME_KEY, cleanName);
  return cleanName;
}

function getSharedProfilePayload() {
  const savedName = window.localStorage.getItem(PROFILE_NAME_KEY)?.trim();
  const name = savedName || $("#nameInput")?.value.trim() || "Yolcu";
  return {
    name,
    gender: state.gender,
    accent: goalTemplates[state.goals[0]]?.accent || "102,229,255",
    groups: getAllGroups().filter((group) => state.goals.some((goalId) => getGoalGroupId(goalTemplates[goalId]) === group.id)),
    goals: state.goals.map((goalId) => {
      const goal = goalTemplates[goalId];
      if (!goal) return null;
      const outcome = getTodayOutcome(goalId);
      return {
        id: goal.id,
        title: goal.title,
        subtitle: goal.subtitle,
        progress: goal.progress,
        targetSteps: getGoalTargetSteps(goal),
        accent: goal.accent,
        category: goal.category,
        groupId: getGoalGroupId(goal),
        groupName: getGroup(getGoalGroupId(goal))?.name || "",
        groupIcon: getGroup(getGoalGroupId(goal))?.icon || "",
        icon: goal.icon,
        rule: goal.rule,
        status: outcome?.status === "complete" ? "complete" : ["missed", "rest"].includes(outcome?.status) ? "resting" : "pending",
      };
    }).filter(Boolean),
  };
}

function importRemoteGoalTemplates(payload) {
  [...(payload?.friends || []), ...(payload?.pendingInvites || [])].forEach((friend) => {
    (friend.goals || []).forEach((remoteGoal) => {
      if (!remoteGoal?.id || goalTemplates[remoteGoal.id]) return;
      goalTemplates[remoteGoal.id] = {
        id: remoteGoal.id,
        title: remoteGoal.title || "Paylaşılan hedef",
        subtitle: remoteGoal.subtitle || "Yoldaşının merdiveni",
        progress: Number(remoteGoal.progress) || 0,
        targetSteps: getGoalTargetSteps(remoteGoal),
        accent: remoteGoal.accent || "102,229,255",
        trend: "Yoldaşınla paylaşılan yol",
        category: remoteGoal.category || "custom",
        groupId: remoteGoal.groupId || null,
        groupName: remoteGoal.groupName || "",
        groupIcon: remoteGoal.groupIcon || "",
        icon: remoteGoal.icon || "✦",
        rule: remoteGoal.rule || "Günlük adımı tamamla",
        amount: 1,
        unit: "adım",
        frequency: "Her gün",
        remoteOnly: true,
      };
    });
  });
}

function applySocialPayload(payload, { render = true } = {}) {
  if (!payload) return;
  importRemoteGoalTemplates(payload);
  socialState = {
    ...socialState,
    ...payload,
    friends: Array.isArray(payload.friends) ? payload.friends : [],
    pendingInvites: Array.isArray(payload.pendingInvites) ? payload.pendingInvites : [],
    sharedJourneys: Array.isArray(payload.sharedJourneys) ? payload.sharedJourneys : [],
    activities: Array.isArray(payload.activities) ? payload.activities : [],
  };
  delete socialState.messages;
  socialBackendConnected = Boolean(payload.backend?.connected);
  saveSocialState();
  setSocialSyncStatus(socialBackendConnected ? "online" : "offline", socialBackendConnected ? "Sunucuya bağlı" : "Çevrimdışı önizleme");
  if (render) {
    renderSocial();
    if (state.activeFriendId && $("#friendSheet")?.classList.contains("show")) renderFriendSheet(state.activeFriendId);
  }
}

async function socialApi(pathname, options = {}) {
  if (typeof window.fetch !== "function") throw new Error("Fetch kullanılamıyor.");
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}) };
  if (socialBackendSession?.token && options.auth !== false) headers.Authorization = `Bearer ${socialBackendSession.token}`;
  const response = await window.fetch(pathname, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Sunucu isteği başarısız.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function refreshSocialState({ quiet = true } = {}) {
  if (!socialBackendSession) return false;
  try {
    const payload = await socialApi("/api/social");
    applySocialPayload(payload.social);
    return true;
  } catch (error) {
    if (error.status === 401) saveSocialBackendSession(null);
    socialBackendConnected = false;
    setSocialSyncStatus("offline", "Bağlantı bekleniyor");
    if (!quiet) showToast("Sunucuya ulaşılamadı.", "Yerel verilerin ekranda kaldı; bağlantı gelince yeniden eşitlenecek.");
    return false;
  }
}

async function syncSocialProfile({ quiet = true } = {}) {
  if (!socialBackendSession) return false;
  try {
    const payload = await socialApi("/api/profile", { method: "PATCH", body: getSharedProfilePayload() });
    applySocialPayload(payload.social);
    return true;
  } catch {
    socialBackendConnected = false;
    setSocialSyncStatus("offline", "Bağlantı bekleniyor");
    if (!quiet) showToast("Profil henüz eşitlenemedi.", "Bağlantı geldiğinde tekrar deneyeceğiz.");
    return false;
  }
}

function scheduleSocialProfileSync() {
  if (!socialBackendSession || typeof window.fetch !== "function") return;
  window.clearTimeout(socialProfileSyncTimer);
  socialProfileSyncTimer = window.setTimeout(() => {
    void syncSocialProfile();
  }, 300);
}

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`);
}

let activeDateKey = toDateKey();
state.analysisMonth = `${activeDateKey.slice(0, 7)}-01`;

function loadTrackingStore() {
  try {
    return JSON.parse(window.localStorage.getItem(TRACKING_KEY) || "{}");
  } catch {
    return {};
  }
}

const goalTracking = loadTrackingStore();

function loadMoodStore() {
  try {
    return JSON.parse(window.localStorage.getItem(MOOD_KEY) || "{}");
  } catch {
    return {};
  }
}

const moodTracking = loadMoodStore();

function loadGoalOverrides() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GOAL_OVERRIDES_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function saveGoalOverrides(overrides) {
  try {
    window.localStorage.setItem(GOAL_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Override kaydÄ± kritik deÄŸil; mevcut oturumda seÃ§im yine korunur.
  }
}

function applySavedGoalOverrides() {
  const overrides = loadGoalOverrides();
  Object.entries(overrides).forEach(([goalId, override]) => {
    if (!goalTemplates[goalId] || !override || typeof override !== "object") return;
    if ("groupId" in override) goalTemplates[goalId].groupId = override.groupId || null;
  });
}

function saveGoalGroupOverride(goalId) {
  const goal = goalTemplates[goalId];
  if (!goal) return;
  const overrides = loadGoalOverrides();
  const groupId = goal.groupId || null;
  overrides[goalId] = { ...(overrides[goalId] || {}), groupId };
  saveGoalOverrides(overrides);
}

function normalizeGroup(group, fallback = {}) {
  const id = String(group?.id || fallback.id || `group-${Date.now()}`).trim().slice(0, 60);
  return {
    id,
    name: String(group?.name || fallback.name || "Yeni grup").trim().slice(0, 36) || "Yeni grup",
    icon: String(group?.icon || fallback.icon || "●").trim().slice(0, 8) || "●",
    color: /^\d{1,3},\d{1,3},\d{1,3}$/.test(String(group?.color || "")) ? String(group.color) : (fallback.color || "119,120,255"),
    builtIn: Boolean(group?.builtIn || fallback.builtIn),
    createdAt: group?.createdAt || fallback.createdAt || new Date().toISOString(),
  };
}

function loadCustomGroups() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GROUPS_KEY) || "[]");
    return Array.isArray(saved) ? saved.map((group) => normalizeGroup(group)).filter((group) => group.id && !BUILT_IN_GROUPS.some((item) => item.id === group.id)) : [];
  } catch {
    return [];
  }
}

function loadCollapsedGroups() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GROUP_COLLAPSE_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function loadGroupOverrides() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GROUP_OVERRIDES_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function loadDeletedGroups() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(GROUP_DELETED_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

let customGroups = loadCustomGroups();
let collapsedGroups = loadCollapsedGroups();
let groupOverrides = loadGroupOverrides();
let deletedGroupIds = loadDeletedGroups();

function getAllGroups() {
  const customIds = new Set(customGroups.map((group) => group.id));
  return [
    ...BUILT_IN_GROUPS
      .filter((group) => !customIds.has(group.id) && !deletedGroupIds.has(group.id))
      .map((group) => normalizeGroup({ ...group, ...(groupOverrides[group.id] || {}), id: group.id, builtIn: true }, group)),
    ...customGroups.map((group) => normalizeGroup(group)),
  ];
}

function saveCustomGroups() {
  try {
    window.localStorage.setItem(GROUPS_KEY, JSON.stringify(customGroups.filter((group) => !group.builtIn)));
  } catch {
    // Grup ayarları bu oturum boyunca yine çalışır.
  }
  scheduleSocialProfileSync();
}

function saveGroupOverrides() {
  try {
    window.localStorage.setItem(GROUP_OVERRIDES_KEY, JSON.stringify(groupOverrides));
  } catch {
    // Hazır grup düzenlemeleri oturum boyunca yine çalışır.
  }
  scheduleSocialProfileSync();
}

function saveDeletedGroups() {
  try {
    window.localStorage.setItem(GROUP_DELETED_KEY, JSON.stringify([...deletedGroupIds]));
  } catch {
    // Silinen hazır grup listesi kritik değil.
  }
  scheduleSocialProfileSync();
}

function saveCollapsedGroups() {
  try {
    window.localStorage.setItem(GROUP_COLLAPSE_KEY, JSON.stringify([...collapsedGroups]));
  } catch {
    // Accordion durumu kritik veri değil.
  }
}

function getGroup(groupId) {
  return getAllGroups().find((group) => group.id === groupId) || null;
}

function getGoalGroupId(goal) {
  return goal?.groupId && getGroup(goal.groupId) ? goal.groupId : null;
}

function getGroupLabel(groupId) {
  const group = getGroup(groupId);
  return group ? `${group.icon} ${group.name}` : "Grupsuz";
}

function hasActiveGroups(goalIds = state.goals) {
  return goalIds.some((goalId) => getGoalGroupId(goalTemplates[goalId])) || customGroups.length > 0;
}

function getGroupedGoalEntries(goalIds = state.goals) {
  const groups = [];
  const used = new Set();
  getAllGroups().forEach((group) => {
    const ids = goalIds.filter((goalId) => getGoalGroupId(goalTemplates[goalId]) === group.id);
    if (ids.length) {
      groups.push({ id: group.id, group, goalIds: ids });
      used.add(group.id);
    }
  });
  const ungrouped = goalIds.filter((goalId) => !getGoalGroupId(goalTemplates[goalId]));
  if (ungrouped.length) {
    groups.push({ id: "ungrouped", group: { id: "ungrouped", name: "Grupsuz", icon: "○", color: "119,120,255", builtIn: true }, goalIds: ungrouped });
  }
  return groups;
}

function createCustomGroup(name, icon = "●", color = state.selectedAccent || "119,120,255") {
  const cleanName = String(name || "").trim().slice(0, 36);
  if (!cleanName) return null;
  const base = cleanName.toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28) || "grup";
  let id = `custom-group-${base}`;
  let index = 2;
  const existing = new Set(getAllGroups().map((group) => group.id));
  while (existing.has(id)) {
    id = `custom-group-${base}-${index}`;
    index += 1;
  }
  const group = normalizeGroup({ id, name: cleanName, icon, color, builtIn: false });
  customGroups.push(group);
  saveCustomGroups();
  return group;
}

function updateGroup(groupId, updates = {}) {
  const group = getGroup(groupId);
  if (!group) return null;
  const name = String(updates.name || group.name).trim().slice(0, 36);
  const icon = String(updates.icon || group.icon || "●").trim().slice(0, 8) || "●";
  if (!name) return null;
  if (group.builtIn) {
    groupOverrides[groupId] = {
      ...(groupOverrides[groupId] || {}),
      name,
      icon,
      color: group.color,
    };
    saveGroupOverrides();
  } else {
    customGroups = customGroups.map((item) => item.id === groupId ? normalizeGroup({ ...item, name, icon }) : item);
    saveCustomGroups();
  }
  renderGroupControls();
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  renderAnalysis();
  renderSocial();
  return getGroup(groupId);
}

function groupOptionsHtml(selectedGroupId = "") {
  const selected = selectedGroupId || "";
  return [
    `<option value="" ${!selected ? "selected" : ""}>Grupsuz</option>`,
    ...getAllGroups().map((group) => `<option value="${escapeHtml(group.id)}" ${selected === group.id ? "selected" : ""}>${escapeHtml(group.icon)} ${escapeHtml(group.name)}</option>`),
    `<option value="__new__">＋ Yeni grup oluştur</option>`,
  ].join("");
}

function handleGroupSelect(selectElement, currentGroupId = "") {
  if (!selectElement) return currentGroupId || "";
  if (selectElement.value !== "__new__") return selectElement.value || "";
  const name = window.prompt("Yeni grup adı ne olsun? Örn. Uyku, Supplement, İş");
  if (!name?.trim()) {
    selectElement.value = currentGroupId || "";
    return currentGroupId || "";
  }
  const icon = window.prompt("Grup ikonu? Tek emoji yazabilirsin.", "●") || "●";
  const group = createCustomGroup(name, icon);
  selectElement.innerHTML = groupOptionsHtml(group.id);
  renderGroupControls();
  showToast("Yeni grup oluşturuldu.", `${group.name} artık merdivenlerde seçilebilir.`);
  return group.id;
}

function setGoalGroup(goalId, groupId) {
  const goal = goalTemplates[goalId];
  if (!goal) return;
  goal.groupId = groupId && getGroup(groupId) ? groupId : null;
  persistCustomGoal(goalId);
  saveGoalGroupOverride(goalId);
  saveSelectedGoals();
  renderGroupControls();
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  renderAnalysis();
  renderSocial();
  scheduleSocialProfileSync();
}

function deleteGroup(groupId) {
  const group = getGroup(groupId);
  if (!group) return;
  if (group.builtIn) {
    showToast("Hazır gruplar silinmez.", "İstersen merdivenleri Grupsuz yapabilir veya kendi gruplarını silebilirsin.");
    return;
  }
  const affected = state.goals.filter((goalId) => getGoalGroupId(goalTemplates[goalId]) === groupId).length;
  const confirmed = window.confirm(`"${group.name}" grubunu silmek istiyor musun?\n\nİçindeki ${affected} merdiven silinmez, Grupsuz kalır.`);
  if (!confirmed) return;
  customGroups = customGroups.filter((item) => item.id !== groupId);
  state.goals.forEach((goalId) => {
    if (goalTemplates[goalId]?.groupId === groupId) {
      goalTemplates[goalId].groupId = null;
      persistCustomGoal(goalId);
      saveGoalGroupOverride(goalId);
    }
  });
  if (state.groupFilter === groupId) state.groupFilter = "all";
  if (state.analysisGroup === groupId) state.analysisGroup = "all";
  collapsedGroups.delete(groupId);
  saveCustomGroups();
  saveCollapsedGroups();
  renderGroupControls();
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  renderAnalysis();
  renderSocial();
  showToast("Grup silindi.", `${affected} merdiven silinmedi, Grupsuz kaldı.`);
}

function deleteGroupV2(groupId) {
  const group = getGroup(groupId);
  if (!group) return;
  const affected = state.goals.filter((goalId) => getGoalGroupId(goalTemplates[goalId]) === groupId).length;
  const confirmed = window.confirm(`"${group.name}" grubunu silmek istiyor musun?\n\nİçindeki ${affected} merdiven silinmez, Grupsuz kalır.`);
  if (!confirmed) return;
  if (group.builtIn) {
    deletedGroupIds.add(groupId);
    delete groupOverrides[groupId];
    saveDeletedGroups();
    saveGroupOverrides();
  } else {
    customGroups = customGroups.filter((item) => item.id !== groupId);
    saveCustomGroups();
  }
  state.goals.forEach((goalId) => {
    if (goalTemplates[goalId]?.groupId === groupId) {
      goalTemplates[goalId].groupId = null;
      persistCustomGoal(goalId);
      saveGoalGroupOverride(goalId);
    }
  });
  if (state.groupFilter === groupId) state.groupFilter = "all";
  if (state.analysisGroup === groupId) state.analysisGroup = "all";
  collapsedGroups.delete(groupId);
  saveCollapsedGroups();
  renderGroupControls();
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  renderAnalysis();
  renderSocial();
  showToast("Grup silindi.", `${affected} merdiven silinmedi, Grupsuz kaldı.`);
}

function toggleGroupCollapse(groupId) {
  if (collapsedGroups.has(groupId)) collapsedGroups.delete(groupId);
  else collapsedGroups.add(groupId);
  saveCollapsedGroups();
  renderTasks();
  renderGoalLibrary();
}

function saveMoodStore() {
  try {
    window.localStorage.setItem(MOOD_KEY, JSON.stringify(moodTracking));
  } catch {
    // Ruh hâli kaydı oturum boyunca çalışmaya devam eder.
  }
}

function saveTrackingStore() {
  try {
    window.localStorage.setItem(TRACKING_KEY, JSON.stringify(goalTracking));
  } catch {
    // Depolama kapalıysa deneyim oturum boyunca çalışmaya devam eder.
  }
  scheduleSocialProfileSync();
}

function seedGoalEvents(goalId) {
  return [];
}

function normalizeGoalEvents(events = []) {
  const byDate = new Map();
  events.forEach((event) => {
    const date = String(event?.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const status = ["complete", "partial", "missed", "rest"].includes(event?.status) ? event.status : "missed";
    byDate.set(date, {
      date,
      status,
      reason: event?.reason || (status === "rest" ? "planned" : status === "missed" ? "manual" : null),
      note: String(event?.note || "").slice(0, 240),
      recovery: Boolean(event?.recovery),
      updatedAt: event?.updatedAt || event?.createdAt || null,
    });
  });
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function getGoalTargetSteps(goal = null) {
  const value = Number(goal?.targetSteps || goal?.target || 100);
  return Math.max(1, Math.min(9999, Math.round(value) || 100));
}

function getGoalProgressPercent(goal) {
  const target = getGoalTargetSteps(goal);
  return Math.min(100, Math.round(((Number(goal?.progress) || 0) / target) * 100));
}

function getProgressFromEvents(events = [], upToDate = toDateKey(), targetSteps = 9999) {
  const completedDays = new Set(
    events
      .filter((event) => event.status === "complete" && event.date <= upToDate)
      .map((event) => event.date),
  );
  return Math.min(getGoalTargetSteps({ targetSteps }), Math.max(0, completedDays.size));
}

function getGoalStartDate(goalId) {
  const tracking = goalTracking[goalId] || {};
  return /^\d{4}-\d{2}-\d{2}$/.test(String(tracking.startDate || "")) ? tracking.startDate : null;
}

function getProgressEventsForGoal(goalId) {
  const tracking = goalTracking[goalId] || ensureGoalTracking(goalId);
  const startDate = getGoalStartDate(goalId);
  return startDate ? tracking.events.filter((event) => event.date >= startDate) : tracking.events;
}

function syncGoalProgressFromHistory(goalId) {
  const tracking = goalTracking[goalId] || ensureGoalTracking(goalId);
  const progress = getProgressFromEvents(getProgressEventsForGoal(goalId), toDateKey(), getGoalTargetSteps(goalTemplates[goalId]));
  tracking.progress = progress;
  if (goalTemplates[goalId]) goalTemplates[goalId].progress = progress;
  return progress;
}

function ensureGoalTracking(goalId) {
  if (!goalTracking[goalId]) {
    goalTracking[goalId] = {
      events: seedGoalEvents(goalId),
      recovery: null,
      progress: 0,
      targetOverride: null,
      lastResizeSuggestion: null,
    };
    saveTrackingStore();
  }
  const tracking = goalTracking[goalId];
  tracking.events = normalizeGoalEvents(Array.isArray(tracking.events) ? tracking.events : []);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tracking.startDate || ""))) tracking.startDate = null;
  tracking.progress = getProgressFromEvents(getProgressEventsForGoal(goalId), toDateKey(), getGoalTargetSteps(goalTemplates[goalId]));
  return goalTracking[goalId];
}

function hydrateGoalTracking() {
  state.goals.forEach((goalId) => {
    const goal = goalTemplates[goalId];
    if (!goal) return;
    const tracking = ensureGoalTracking(goalId);
    goal.progress = syncGoalProgressFromHistory(goalId);
    if (tracking.targetOverride) {
      goal.amount = tracking.targetOverride.amount;
      goal.unit = tracking.targetOverride.unit;
      goal.frequency = tracking.targetOverride.frequency;
      goal.targetSteps = getGoalTargetSteps(tracking.targetOverride);
      goal.subtitle = tracking.targetOverride.subtitle || `${formatAmount(goal.amount)} ${goal.unit} · ${goal.frequency}`;
      goal.rule = tracking.targetOverride.rule || `${formatAmount(goal.amount)} ${goal.unit} tamamla`;
    }
    const task = tasks.find((item) => (item.goalId || item.id) === goalId);
    if (task) {
      task.title = buildTaskTitle(goal);
      task.baseMeta = buildTaskMeta(goal);
    }
  });
}

function getTodayOutcome(goalId) {
  return getGoalEvent(goalId, toDateKey());
}

function recordGoalOutcome(goalId, outcome, dateKey = toDateKey()) {
  const tracking = ensureGoalTracking(goalId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || "")) || dateKey > toDateKey()) return null;
  tracking.events = tracking.events.filter((event) => event.date !== dateKey);
  if (outcome) {
    tracking.events.push({
      date: dateKey,
      status: outcome.status,
      reason: outcome.reason ?? null,
      note: outcome.note || "",
      recovery: Boolean(outcome.recovery),
      updatedAt: new Date().toISOString(),
    });
  }
  tracking.events.sort((left, right) => left.date.localeCompare(right.date));
  syncGoalProgressFromHistory(goalId);
  saveTrackingStore();
  return getGoalEvent(goalId, dateKey);
}

function getContinuity(goalId, days) {
  const firstDay = shiftDateKey(toDateKey(), -(days - 1));
  const events = ensureGoalTracking(goalId).events.filter((event) => event.date >= firstDay && event.date <= toDateKey());
  const eligible = events.filter((event) => event.status !== "rest");
  if (!eligible.length) return null;
  const points = eligible.reduce((sum, event) => {
    if (event.status === "complete") return sum + 1;
    if (event.status === "partial") return sum + .5;
    return sum;
  }, 0);
  return Math.round((points / eligible.length) * 100);
}

function getOverallContinuity(days) {
  const scores = state.goals.map((goalId) => getContinuity(goalId, days)).filter((score) => score !== null);
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
}

function getConsecutiveMisses(goalId) {
  const events = [...ensureGoalTracking(goalId).events].sort((left, right) => right.date.localeCompare(left.date));
  let misses = 0;
  for (const event of events) {
    if (event.status === "rest") continue;
    if (event.status !== "missed") break;
    misses += 1;
  }
  return misses;
}

function formatAmount(amount) {
  const value = Number(amount) || 1;
  return value.toLocaleString("tr-TR", { maximumFractionDigits: value < 10 ? 1 : 0 });
}

function getScaledAmount(goal, ratio) {
  const amount = Math.max(.1, Number(goal?.amount) || 1);
  if (amount <= 1) return 1;
  const raw = amount * ratio;
  if (amount >= 1000) return Math.max(500, Math.round(raw / 500) * 500);
  if (amount >= 10) return Math.max(1, Math.round(raw));
  return Math.max(.5, Math.round(raw * 2) / 2);
}

function getRecoveryCopy(goal, ratio = .4) {
  if ((Number(goal?.amount) || 1) <= 1) return "Sadece en küçük başlangıcı yap";
  return `${formatAmount(getScaledAmount(goal, ratio))} ${goal.unit || "kez"} tamamla`;
}

function getActiveRecovery(goalId) {
  const recovery = ensureGoalTracking(goalId).recovery;
  return recovery?.date <= toDateKey() ? recovery : null;
}

function getWeekView(goalId) {
  const eventMap = new Map(ensureGoalTracking(goalId).events.map((event) => [event.date, event]));
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = shiftDateKey(toDateKey(), index - 6);
    const date = new Date(`${dateKey}T12:00:00`);
    const event = eventMap.get(dateKey);
    const labels = { complete: "✓", partial: "◐", missed: "○", rest: "☾" };
    return {
      date: dateKey,
      day: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date).slice(0, 3),
      status: event?.status || (dateKey === toDateKey() ? "today" : "empty"),
      symbol: labels[event?.status] || (dateKey === toDateKey() ? "•" : "–"),
    };
  });
}

function renderContinuitySummary() {
  const weekly = getOverallContinuity(7);
  const monthly = getOverallContinuity(30);
  $("#weeklyContinuity").textContent = weekly === null ? "Yeni" : `%${weekly}`;
  $("#monthlyContinuity").textContent = monthly === null ? "Yeni" : `%${monthly}`;
}

function groupFilterButtonsHtml(activeValue, target = "goal") {
  const activeGoalIds = state.goals.filter((goalId) => goalTemplates[goalId]);
  const usedGroups = getGroupedGoalEntries(activeGoalIds);
  if (!hasActiveGroups(activeGoalIds)) return "";
  return [
    `<button class="${activeValue === "all" ? "active" : ""}" data-${target}-group="all" style="--group-accent:119,120,255">✦ Tümü</button>`,
    ...usedGroups.map(({ id, group }) => `<button class="${activeValue === id ? "active" : ""}" data-${target}-group="${escapeHtml(id)}" style="--group-accent:${group.color}">${escapeHtml(group.icon)} ${escapeHtml(group.name)}</button>`),
  ].join("");
}

function renderGroupControls() {
  const toolbar = $("#goalGroupToolbar");
  if (toolbar) {
    toolbar.innerHTML = groupFilterButtonsHtml(state.groupFilter, "goal");
    toolbar.hidden = !toolbar.innerHTML;
  }
  const analysisToolbar = $("#analysisGroupToolbar");
  if (analysisToolbar) {
    analysisToolbar.innerHTML = groupFilterButtonsHtml(state.analysisGroup, "analysis");
    analysisToolbar.hidden = !analysisToolbar.innerHTML;
  }
  const manager = $("#groupManager");
  if (manager) {
    const allGroups = getAllGroups();
    const managerCollapsed = collapsedGroups.has("group-manager-body");
    const assignmentCollapsed = collapsedGroups.has("group-assignment-body");
    const activeGoals = state.goals.filter((goalId) => goalTemplates[goalId]);
    manager.innerHTML = `
      <section class="group-manager-panel ${managerCollapsed ? "collapsed" : ""}">
        <button class="group-manager-head" type="button" data-toggle-group="group-manager-body">
          <span><b>Gruplar</b><small>İsteğe bağlı. Hazır grup kullanabilir veya kendin oluşturabilirsin.</small></span>
          <i>${managerCollapsed ? "+" : "−"}</i>
        </button>
        <div class="group-manager-body">
          <div class="group-create-row">
            <input id="newGroupIcon" maxlength="4" value="●" aria-label="Grup ikonu">
            <input id="newGroupName" maxlength="36" placeholder="Yeni grup adı: Uyku, Supplement, İş..." aria-label="Yeni grup adı">
            <button type="button" data-create-group>Oluştur</button>
          </div>
          <div class="group-manager-list">
            ${allGroups.map((group) => `
              <article class="group-manager-row editable" style="--group-accent:${group.color}" data-edit-group="${escapeHtml(group.id)}">
                <input class="group-row-icon" maxlength="4" value="${escapeHtml(group.icon)}" aria-label="${escapeHtml(group.name)} ikonu">
                <input class="group-row-name" maxlength="36" value="${escapeHtml(group.name)}" aria-label="${escapeHtml(group.name)} adı">
                <em>${group.builtIn ? "Mevcut" : "Özel"}</em>
                <button type="button" data-save-group="${escapeHtml(group.id)}">Kaydet</button>
                <button type="button" data-delete-group="${escapeHtml(group.id)}">Sil</button>
              </article>
            `).join("")}
          </div>
        </div>
      </section>
      <section class="group-manager-panel ${assignmentCollapsed ? "collapsed" : ""}">
        <button class="group-manager-head" type="button" data-toggle-group="group-assignment-body">
          <span><b>Merdivenleri gruba taşı</b><small>Detaya girmeden istediğin merdiveni istediğin gruba ekle.</small></span>
          <i>${assignmentCollapsed ? "+" : "−"}</i>
        </button>
        <div class="group-manager-body">
          ${activeGoals.length ? activeGoals.map((goalId) => {
            const goal = goalTemplates[goalId];
            return `
              <article class="group-assignment-row">
                <span style="--accent:${goal.accent}">${escapeHtml(goal.icon || "↗")}</span>
                <b>${escapeHtml(goal.title)}</b>
                <select class="text-field" data-assign-goal="${escapeHtml(goalId)}">
                  ${groupOptionsHtml(getGoalGroupId(goal) || "")}
                </select>
              </article>
            `;
          }).join("") : `<div class="group-manager-empty"><b>Henüz merdiven yok.</b><small>Bir merdiven oluşturunca burada gruba taşıyabileceksin.</small></div>`}
        </div>
      </section>
    `;
    return;
    manager.innerHTML = customGroups.length
      ? `<div class="group-manager-head"><b>Gruplar</b><small>Kendi gruplarını buradan silebilirsin.</small></div>${customGroups.map((group) => `
        <article class="group-manager-row" style="--group-accent:${group.color}">
          <span>${escapeHtml(group.icon)}</span>
          <b>${escapeHtml(group.name)}</b>
          <button data-delete-group="${escapeHtml(group.id)}">Sil</button>
        </article>
      `).join("")}`
      : `<div class="group-manager-empty"><b>Grup kullanımı isteğe bağlı.</b><small>Merdiven oluştururken hazır grup seçebilir veya kendi grubunu oluşturabilirsin.</small></div>`;
  }
}

function getGoalEvent(goalId, dateKey) {
  return ensureGoalTracking(goalId).events.find((event) => event.date === dateKey) || null;
}

function getAnalysisGoalIds() {
  const groupGoalIds = state.goals.filter((goalId) => {
    const goal = goalTemplates[goalId];
    if (!goal) return false;
    if (state.analysisGroup === "all") return true;
    if (state.analysisGroup === "ungrouped") return !getGoalGroupId(goal);
    return getGoalGroupId(goal) === state.analysisGroup;
  });
  if (state.analysisGoal !== "all" && groupGoalIds.includes(state.analysisGoal)) return [state.analysisGoal];
  state.analysisGoal = "all";
  return groupGoalIds;
}

function getDailySummary(dateKey, goalIds = getAnalysisGoalIds()) {
  const events = goalIds.map((goalId) => getGoalEvent(goalId, dateKey)).filter(Boolean);
  if (!events.length) return { date: dateKey, status: "empty", score: null, events: [] };
  const eligible = events.filter((event) => event.status !== "rest");
  if (!eligible.length) return { date: dateKey, status: "rest", score: null, events };
  const points = eligible.reduce((sum, event) => sum + (event.status === "complete" ? 1 : event.status === "partial" ? .5 : 0), 0);
  const score = Math.round((points / eligible.length) * 100);
  return {
    date: dateKey,
    score,
    events,
    status: score === 100 ? "complete" : score > 0 ? "partial" : "missed",
  };
}

function summarizeRange(startDate, endDate, goalIds = getAnalysisGoalIds()) {
  const events = goalIds.flatMap((goalId) => ensureGoalTracking(goalId).events.filter((event) => event.date >= startDate && event.date <= endDate));
  const eligible = events.filter((event) => event.status !== "rest");
  const points = eligible.reduce((sum, event) => sum + (event.status === "complete" ? 1 : event.status === "partial" ? .5 : 0), 0);
  return {
    events,
    score: eligible.length ? Math.round((points / eligible.length) * 100) : 0,
    completed: events.filter((event) => event.status === "complete").length,
    partial: events.filter((event) => event.status === "partial").length,
    missed: events.filter((event) => event.status === "missed").length,
    rests: events.filter((event) => event.status === "rest").length,
  };
}

function getGoalTask(goalId) {
  return tasks.find((task) => (task.goalId || task.id) === goalId) || null;
}

function getGoalXp(goalId) {
  return Math.max(1, Number(getGoalTask(goalId)?.xp) || 15);
}

function getCompletedEvents(goalIds = state.goals, startDate = null, endDate = toDateKey()) {
  return goalIds.flatMap((goalId) => ensureGoalTracking(goalId).events
    .filter((event) => event.status === "complete")
    .filter((event) => (!startDate || event.date >= startDate) && (!endDate || event.date <= endDate))
    .map((event) => ({ goalId, event })));
}

function getCompletedStepCount(goalIds = state.goals, startDate = null, endDate = toDateKey()) {
  return getCompletedEvents(goalIds, startDate, endDate).length;
}

function getTotalEarnedXp(goalIds = state.goals) {
  return getCompletedEvents(goalIds, null, toDateKey()).reduce((sum, item) => sum + getGoalXp(item.goalId), state.xpBase);
}

function getLevelState(goalIds = state.goals) {
  const totalXp = getTotalEarnedXp(goalIds);
  return {
    level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
    totalXp,
    currentXp: totalXp % XP_PER_LEVEL,
    targetXp: XP_PER_LEVEL,
  };
}

function getMonthWindow(dateKey = toDateKey(), offset = 0) {
  const anchor = dateFromKey(`${dateKey.slice(0, 7)}-15`);
  anchor.setMonth(anchor.getMonth() + offset);
  const start = toDateKey(new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12));
  const end = toDateKey(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12));
  return { start, end };
}

function formatSignedNumber(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function renderDailyRhythm() {
  const goalIds = [...state.goals];
  const today = toDateKey();
  const yesterday = shiftDateKey(today, -1);
  const level = getLevelState(goalIds);
  const totalSteps = getCompletedStepCount(goalIds, null, today);
  const monthWindow = getMonthWindow(today);
  const previousMonthWindow = getMonthWindow(today, -1);
  const monthSteps = getCompletedStepCount(goalIds, monthWindow.start, monthWindow.end);
  const previousMonthSteps = getCompletedStepCount(goalIds, previousMonthWindow.start, previousMonthWindow.end);
  const todaySteps = getCompletedStepCount(goalIds, today, today);
  const yesterdaySteps = getCompletedStepCount(goalIds, yesterday, yesterday);
  const totalTargetSteps = goalIds.reduce((sum, goalId) => sum + getGoalTargetSteps(goalTemplates[goalId]), 0);
  const overviewProgress = totalTargetSteps ? Math.min(100, Math.round((totalSteps / totalTargetSteps) * 100)) : 0;

  const levelValue = $("#levelValue");
  if (levelValue) levelValue.textContent = level.level;
  const xpValue = $("#xpValue");
  if (xpValue) xpValue.textContent = level.currentXp;
  const xpTarget = $("#xpTarget");
  if (xpTarget) xpTarget.textContent = level.targetXp;
  const xpFill = $("#xpFill");
  if (xpFill) xpFill.style.width = `${Math.min(100, Math.round((level.currentXp / level.targetXp) * 100))}%`;

  const totalStepsElement = $("#totalSteps");
  if (totalStepsElement) totalStepsElement.textContent = totalSteps;
  const averageProgress = $("#averageProgress");
  if (averageProgress) averageProgress.textContent = overviewProgress;
  const activeGoalCount = $("#activeGoalCount");
  if (activeGoalCount) activeGoalCount.textContent = goalIds.length;
  const overviewRing = $("#overviewRing");
  if (overviewRing) overviewRing.style.setProperty("--value", overviewProgress);
  const overviewCurrentStreak = $("#overviewCurrentStreak");
  if (overviewCurrentStreak) overviewCurrentStreak.textContent = getCurrentStreak(goalIds);
  const overviewYesterdayDelta = $("#overviewYesterdayDelta");
  if (overviewYesterdayDelta) overviewYesterdayDelta.textContent = formatSignedNumber(todaySteps - yesterdaySteps);

  const overviewRhythmCopy = $("#overviewRhythmCopy");
  if (overviewRhythmCopy) {
    const difference = monthSteps - previousMonthSteps;
    overviewRhythmCopy.innerHTML = totalSteps
      ? `Bu ay <b>${monthSteps} basamak</b> tırmandın. ${difference > 0
        ? `Geçen aydan ${difference} basamak öndesin.`
        : difference < 0
          ? `Geçen ayın ${Math.abs(difference)} basamak gerisindesin; ritim toparlanabilir.`
          : "Geçen ayla aynı ritimdesin."}`
      : "İlk kaydınla gerçek ritmin burada oluşacak.";
  }
}

function getCurrentStreak(goalIds = getAnalysisGoalIds()) {
  let cursor = toDateKey();
  if (getDailySummary(cursor, goalIds).status === "empty") cursor = shiftDateKey(cursor, -1);
  let streak = 0;
  for (let index = 0; index < 730; index += 1) {
    const summary = getDailySummary(cursor, goalIds);
    if (!["complete", "partial", "rest"].includes(summary.status)) break;
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

function getBestStreak(goalIds = getAnalysisGoalIds()) {
  const allDates = goalIds.flatMap((goalId) => ensureGoalTracking(goalId).events.map((event) => event.date)).sort();
  if (!allDates.length) return 0;
  let cursor = allDates[0];
  let current = 0;
  let best = 0;
  while (cursor <= toDateKey()) {
    const summary = getDailySummary(cursor, goalIds);
    if (["complete", "partial", "rest"].includes(summary.status)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
    cursor = shiftDateKey(cursor, 1);
  }
  return best;
}

function getMoodSummary(startDate, endDate) {
  const values = Object.entries(moodTracking)
    .filter(([dateKey]) => dateKey >= startDate && dateKey <= endDate)
    .map(([, value]) => Number(value))
    .filter((value) => value >= 1 && value <= 5);
  if (!values.length) return { average: null, count: 0 };
  return { average: values.reduce((sum, value) => sum + value, 0) / values.length, count: values.length };
}

function getMoodPresentation(average) {
  if (average === null) return { label: "—", copy: "Kayıt bekleniyor" };
  if (average < 1.8) return { label: "😣 Zorlu", copy: "Kendine daha yumuşak davran." };
  if (average < 2.8) return { label: "😕 Düşük", copy: "Küçük hedefler daha iyi gelebilir." };
  if (average < 3.6) return { label: "😐 Dengeli", copy: "Ritmini koruyorsun." };
  if (average < 4.5) return { label: "🙂 İyi", copy: "Enerjin yoluna yansıyor." };
  return { label: "😄 Harika", copy: "Güçlü bir dönemdesin." };
}

function getStrongestWeekday(events) {
  const counts = new Map();
  events.filter((event) => event.status === "complete").forEach((event) => {
    const day = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(dateFromKey(event.date));
    counts.set(day, (counts.get(day) || 0) + 1);
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || null;
}

function renderWeeklyAnalysis() {
  const goalIds = getAnalysisGoalIds();
  const days = Array.from({ length: 7 }, (_, index) => {
    const dateKey = shiftDateKey(toDateKey(), index - 6);
    return { ...getDailySummary(dateKey, goalIds), dateKey };
  });
  const scored = days.filter((day) => day.score !== null);
  const average = scored.length ? Math.round(scored.reduce((sum, day) => sum + day.score, 0) / scored.length) : 0;
  $("#weeklyAnalysisAverage").textContent = `%${average}`;
  $("#weeklyBars").innerHTML = days.map((day) => {
    const date = dateFromKey(day.dateKey);
    const label = new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date).slice(0, 3);
    const value = day.status === "rest" ? 28 : day.score || 3;
    return `<div class="weekly-bar ${day.status}" title="${escapeHtml(day.dateKey)} · ${day.score === null ? (day.status === "rest" ? "Dinlenme" : "Kayıt yok") : `%${day.score}`}">
      <small>${day.score === null ? (day.status === "rest" ? "☾" : "—") : day.score}</small>
      <div class="weekly-bar-track"><span class="weekly-bar-fill" style="--value:${value}"></span></div>
      <b>${escapeHtml(label)}</b>
    </div>`;
  }).join("");
}

function renderGoalAnalysis(startDate, endDate) {
  $("#analysisGoalCount").textContent = `${state.goals.length} hedef`;
  $("#goalAnalysisList").innerHTML = state.goals.map((goalId) => {
    const goal = goalTemplates[goalId];
    const summary = summarizeRange(startDate, endDate, [goalId]);
    const total = summary.events.length;
    const detail = total
      ? `${summary.completed} tam · ${summary.partial} kısmi · ${summary.rests} dinlenme`
      : "Bu dönemde henüz kayıt yok";
    return `<article class="goal-analysis-row" style="--goal-accent:${goal.accent}">
      <span class="goal-analysis-icon">${escapeHtml(goal.icon)}</span>
      <div class="goal-analysis-copy"><b>${escapeHtml(goal.title)}</b><small>${detail}</small><div class="goal-analysis-track" style="--value:${summary.score}"><span></span></div></div>
      <b class="goal-analysis-score">${summary.score}<small>%</small></b>
    </article>`;
  }).join("");
}

function renderAnalysisCalendar() {
  const monthDate = dateFromKey(state.analysisMonth);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const currentMonth = `${toDateKey().slice(0, 7)}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const goalIds = getAnalysisGoalIds();
  const monthFormatter = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });
  $("#analysisMonthLabel").textContent = monthFormatter.format(monthDate).toLocaleUpperCase("tr-TR");
  $("#analysisNextMonth").disabled = state.analysisMonth >= currentMonth;

  $("#analysisGoalFilters").innerHTML = [
    `<button class="${state.analysisGoal === "all" ? "active" : ""}" data-analysis-goal="all" style="--filter-accent:119,120,255">Tüm hedefler</button>`,
    ...goalIds.map((goalId) => {
      const goal = goalTemplates[goalId];
      return `<button class="${state.analysisGoal === goalId ? "active" : ""}" data-analysis-goal="${escapeHtml(goalId)}" style="--filter-accent:${goal.accent}">${escapeHtml(goal.title)}</button>`;
    }),
  ].join("");

  const blanks = Array.from({ length: leadingBlanks }, () => '<span class="calendar-day blank"></span>');
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = toDateKey(new Date(year, month, day, 12));
    const summary = getDailySummary(dateKey, goalIds);
    const isFuture = dateKey > toDateKey();
    const classes = ["calendar-day", summary.status, dateKey === toDateKey() ? "today" : "", isFuture ? "future" : ""].filter(Boolean).join(" ");
    const title = summary.status === "empty" ? "Kayıt yok" : summary.status === "rest" ? "Dinlenme günü" : `%${summary.score} ritim`;
    const tag = isFuture ? "span" : "button";
    const dateAttr = isFuture ? "" : ` type="button" data-calendar-date="${escapeHtml(dateKey)}"`;
    return `<${tag} class="${classes}" title="${escapeHtml(dateKey)} · ${title}"${dateAttr}>${day}${summary.status !== "empty" ? "<i></i>" : ""}</${tag}>`;
  });
  $("#analysisCalendarGrid").innerHTML = [...blanks, ...days].join("");
}

function formatCalendarEditDate(dateKey) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(dateFromKey(dateKey));
}

function renderCalendarEditor(dateKey = state.calendarEditDate) {
  if (!dateKey) return;
  const isToday = dateKey === toDateKey();
  $("#calendarEditTitle").textContent = formatCalendarEditDate(dateKey);
  $("#calendarEditCopy").textContent = isToday
    ? "Bugünün hedeflerini buradan da işleyebilirsin. Tamamlanan her hedef karakteri bir basamak yukarı taşır."
    : "Geçmiş günü düzenle; istersen bu tarihi merdivenin başlangıcı yapıp 1 ay öncesinden bugüne doğru gün gün işaretleyebilirsin.";
  $("#calendarEditList").innerHTML = getAnalysisGoalIds().map((goalId) => {
    const goal = goalTemplates[goalId];
    const event = getGoalEvent(goalId, dateKey);
    const status = event?.status || "empty";
    const startDate = getGoalStartDate(goalId);
    const isStartDate = startDate === dateKey;
    return `<article class="calendar-edit-row" style="--goal-accent:${goal.accent}" data-calendar-goal="${escapeHtml(goalId)}">
      <div class="calendar-edit-head">
        <b>${escapeHtml(goal.title)}</b>
        <small>${isStartDate ? "BAŞLANGIÇ" : escapeHtml(outcomeLabels[status] || outcomeLabels.empty)}</small>
      </div>
      <div class="calendar-edit-actions" aria-label="${escapeHtml(goal.title)} günlük durum">
        <button class="${status === "complete" ? "active" : ""}" data-calendar-status="complete">✓ Yaptım</button>
        <button class="${status === "missed" ? "active" : ""}" data-calendar-status="missed">○ Olmadı</button>
        <button class="${status === "rest" ? "active" : ""}" data-calendar-status="rest">☾ Dinlenme</button>
        <button class="${status === "empty" ? "active" : ""}" data-calendar-status="empty">— Boş</button>
      </div>
      <button class="calendar-start-button ${isStartDate ? "active" : ""}" data-calendar-start="${escapeHtml(goalId)}">${isStartDate ? "Başlangıç günü seçili" : "Bu tarihi başlangıç yap"}</button>
    </article>`;
  }).join("");
}

function openCalendarEditor(dateKey) {
  if (!dateKey || dateKey > toDateKey()) {
    showToast("Gelecek gün beklemede.", "O gün geldiğinde basamağını birlikte işleriz.");
    return;
  }
  state.calendarEditDate = dateKey;
  renderCalendarEditor(dateKey);
  openSheet($("#calendarEditSheet"));
}

function setCalendarGoalOutcome(goalId, status, dateKey = state.calendarEditDate) {
  const goal = goalTemplates[goalId];
  if (!goal || !dateKey || dateKey > toDateKey()) return;
  if (status === "empty") {
    recordGoalOutcome(goalId, null, dateKey);
    ensureGoalTracking(goalId).recovery = null;
  } else {
    recordGoalOutcome(goalId, {
      status,
      reason: status === "rest" ? "planned" : status === "missed" ? "manual" : null,
      note: "Takvimden kaydedildi.",
      recovery: false,
    }, dateKey);
    if (dateKey === toDateKey()) {
      ensureGoalTracking(goalId).recovery = status === "missed"
        ? { date: shiftDateKey(toDateKey(), 1), amount: getScaledAmount(goal, .4), unit: goal.unit || "kez", copy: getRecoveryCopy(goal) }
        : null;
    }
  }
  syncGoalProgressFromHistory(goalId);
  persistCustomGoal(goalId);
  saveTrackingStore();
  hydrateGoalTracking();
  renderCalendarEditor(dateKey);
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  renderAnalysis();
  const message = status === "empty"
    ? "Günün kaydı temizlendi."
    : `${goal.title}: ${outcomeLabels[status] || "Kaydedildi"}.`;
  showToast(message, "Takvim, basamak ve analiz yeniden hesaplandı.");
}

function setGoalStartDate(goalId, dateKey = state.calendarEditDate) {
  const goal = goalTemplates[goalId];
  if (!goal || !dateKey || dateKey > toDateKey()) return;
  const tracking = ensureGoalTracking(goalId);
  tracking.startDate = dateKey;
  tracking.events = tracking.events.filter((event) => event.date >= dateKey);
  syncGoalProgressFromHistory(goalId);
  persistCustomGoal(goalId);
  saveTrackingStore();
  hydrateGoalTracking();
  renderCalendarEditor(dateKey);
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  renderAnalysis();
  showToast(`${goal.title} başlangıcı ayarlandı.`, "Bu tarihten önceki kayıtlar sayılmadı; geçmiş günleri buradan işaretleyebilirsin.");
}

function renderAnalysis() {
  const range = Number(state.analysisRange) || 30;
  renderGroupControls();
  const today = toDateKey();
  const startDate = shiftDateKey(today, -(range - 1));
  const previousEnd = shiftDateKey(startDate, -1);
  const previousStart = shiftDateKey(previousEnd, -(range - 1));
  const goalIds = getAnalysisGoalIds();
  const current = summarizeRange(startDate, today, goalIds);
  const previous = summarizeRange(previousStart, previousEnd, goalIds);
  const difference = current.score - previous.score;
  const streak = getCurrentStreak(goalIds);
  const bestStreak = getBestStreak(goalIds);
  const mood = getMoodSummary(startDate, today);
  const moodView = getMoodPresentation(mood.average);
  const scoreRing = $("#analysisScoreRing");
  scoreRing.style.setProperty("--score", current.score);
  $("#analysisScore").textContent = current.score;
  $("#analysisCurrentStreak").textContent = `${streak} gün`;
  $("#analysisBestStreak").textContent = `${bestStreak} gün`;
  $("#analysisCompletedSteps").textContent = current.completed;
  $("#analysisStepsCopy").textContent = `Son ${range} günde`;
  $("#analysisMood").textContent = moodView.label;
  $("#analysisMoodCopy").textContent = mood.count ? `${mood.count} ruh hâli kaydı · ${moodView.copy}` : moodView.copy;
  $("#analysisTodayLabel").textContent = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date()).toLocaleUpperCase("tr-TR");
  $("#analysisHeadline").textContent = current.score >= 85 ? "Ritmin çok güçlü." : current.score >= 65 ? "İstikrarın yükseliyor." : current.score >= 40 ? "Yolunu yeniden kuruyorsun." : "Küçük adımlar birikiyor.";

  const momentum = $("#analysisMomentum");
  momentum.classList.toggle("down", difference < 0);
  momentum.querySelector("span").textContent = difference > 0 ? "↗" : difference < 0 ? "↘" : "→";
  momentum.querySelector("b").textContent = difference > 0
    ? `Önceki ${range} güne göre %${difference} ileridesin`
    : difference < 0
      ? `Önceki döneme göre %${Math.abs(difference)} daha sakinsin`
      : "Önceki dönemle aynı çizgidesin";
  $("#analysisComparison").textContent = current.events.length
    ? `${current.completed} tamamlama, ${current.partial} kısmi adım ve ${current.rests} bilinçli dinlenme kaydın var.`
    : "Henüz kıyaslama için veri birikiyor.";

  const strongestDay = getStrongestWeekday(current.events);
  const missedReasons = current.events.filter((event) => event.status === "missed" && event.reason);
  const reasonCounts = missedReasons.reduce((map, event) => map.set(event.reason, (map.get(event.reason) || 0) + 1), new Map());
  const topReason = [...reasonCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
  if (strongestDay) {
    $("#analysisInsightTitle").textContent = `${strongestDay} günleri daha güçlüsün.`;
    $("#analysisInsightCopy").textContent = topReason
      ? `En sık zorlandığın konu “${missReasonLabels[topReason]}”. O güne daha küçük bir hedef koymak ritmini koruyabilir.`
      : "Güçlü gününün düzenini diğer günlere de küçük parçalar hâlinde taşıyabilirsin.";
  } else {
    $("#analysisInsightTitle").textContent = "Verilerin birikiyor.";
    $("#analysisInsightCopy").textContent = "Birkaç gün daha kayıt yaptığında ritmin hakkında daha net bir şey söyleyebiliriz.";
  }

  $$("#analysisRanges button").forEach((button) => button.classList.toggle("active", Number(button.dataset.analysisRange) === range));
  renderWeeklyAnalysis();
  renderGoalAnalysis(startDate, today);
  renderAnalysisCalendar();
}

const characterStages = [
  { min: 0, key: "spark", badge: "LVL 1", title: "Kıvılcım", copy: "Yol yeni açıldı. İlk adım bile karakteri uyandırıyor.", gear: "spark" },
  { min: 10, key: "stepper", badge: "LVL 2", title: "İlk Güç", copy: "10. basamak açıldı. Karakter artık yolun ritmini biliyor.", gear: "boots" },
  { min: 20, key: "rhythm", badge: "LVL 3", title: "Ritim", copy: "20. basamakla tekrarlar güce dönüşmeye başladı.", gear: "pack" },
  { min: 30, key: "focus", badge: "LVL 4", title: "Odak", copy: "30. basamakta dikkat keskinleşti, yol daha net.", gear: "visor" },
  { min: 40, key: "discipline", badge: "LVL 5", title: "Disiplin", copy: "40. basamakta karakterin istikrar zırhı güçlendi.", gear: "bracer" },
  { min: 50, key: "power", badge: "LVL 6", title: "Güç", copy: "50. basamak yarı yol eşiği. Artık daha sağlam tırmanıyorsun.", gear: "cape" },
  { min: 60, key: "endurance", badge: "LVL 7", title: "Dayanıklılık", copy: "60. basamakta pes etmeyen tarafın görünür oldu.", gear: "shield" },
  { min: 70, key: "momentum", badge: "LVL 8", title: "Momentum", copy: "70. basamakta yol hızlandı; karakter alev aldı.", gear: "flame" },
  { min: 80, key: "aura", badge: "LVL 9", title: "Işık", copy: "80. basamakta bu hedef sende parlamaya başladı.", gear: "aura" },
  { min: 90, key: "legend", badge: "LVL 10", title: "Efsane", copy: "90. basamakta zirve yaklaştı; karakter efsane modunda.", gear: "crown" },
  { min: 100, key: "summit", badge: "MAX", title: "Zirve", copy: "Bu hedefte dünkü seni yakaladın; şimdi yeni rota zamanı.", gear: "summit" },
];

function getCharacterStage(progress = 0) {
  return [...characterStages].reverse().find((stage) => progress >= stage.min) || characterStages[0];
}

function isMilestoneStep(progress = 0) {
  return progress > 0 && progress % 10 === 0;
}

function getStairPosition(progress = 0) {
  return Math.min(9, Math.max(0, progress % 10));
}

function getClimberPosition(progress = 0) {
  return getStairPosition(progress);
}

function getWindowStart(progress = 0) {
  const visualPosition = getStairPosition(progress);
  return Math.max(0, progress - visualPosition);
}

function goalCategoryLabel(category) {
  const labels = {
    health: "Sağlık",
    learning: "Öğrenme",
    finance: "Finans",
    physical: "Fiziksel",
    mental: "Zihinsel",
    sport: "Spor",
    nutrition: "Beslenme",
    sleep: "Uyku",
    career: "Kariyer",
    relationships: "İlişkiler",
    digital: "Dijital",
    creative: "Yaratıcılık",
    life: "Yaşam",
    custom: "Kişisel",
  };
  return labels[category] || "Kişisel";
}

function buildTaskTitle(goal) {
  if (!goal) return "Bugünün adımını tamamla";
  return goal.title;
}

function buildTaskMeta(goal) {
  if (!goal) return "Bugün · 1 basamak";
  const rule = goal.rule && goal.rule !== goal.title ? goal.rule : goal.subtitle;
  return rule && rule !== goal.subtitle ? `${rule} · ${goal.subtitle}` : goal.subtitle;
}

function ensureGoalTask(goalId) {
  const goal = goalTemplates[goalId];
  if (!goal) return null;
  let task = tasks.find((item) => (item.goalId || item.id) === goalId);
  if (!task) {
    task = {
      id: goalId,
      goalId,
      title: buildTaskTitle(goal),
      meta: buildTaskMeta(goal),
      baseMeta: buildTaskMeta(goal),
      xp: 15,
      done: false,
    };
    tasks.push(task);
  }
  task.goalId = goalId;
  task.baseMeta = task.baseMeta || buildTaskMeta(goal);
  return task;
}

function getTodayTasks() {
  return state.goals.map(ensureGoalTask).filter(Boolean);
}

function getCharacterModel() {
  return state.gender === "female" ? "female" : "male";
}

function svgClimber(stage, resting = false, modelOverride = null) {
  const characterModel = modelOverride || getCharacterModel();
  const sparkles = ["momentum", "aura", "legend", "summit"].includes(stage.key)
    ? `<span class="climber-spark s1"></span><span class="climber-spark s2"></span><span class="climber-spark s3"></span>`
    : "";
  const figure = resting
    ? `<svg class="side-sitting-figure character-model model-${characterModel}" viewBox="0 0 86 76" aria-hidden="true">
        <g class="side-sitter">
          <circle class="sitter-seat-anchor" cx="44" cy="40" r="1"/>
          <g class="side-back-leg">
            <path class="side-thigh" d="M43 40Q52 43 60 45"/>
            <g class="side-lower-leg side-back-lower-leg">
              <path class="side-calf" d="M60 45Q60 56 58 66"/>
              <path class="side-shoe" d="M57 63Q62 64 67 68 67 71 63 71H54Q53 67 57 63Z"/>
            </g>
          </g>
          <path class="side-shirt male-only" d="M33 20Q40 16 47 20 51 28 49 40 43 44 34 40 30 31 33 20Z"/>
          <path class="side-shirt female-only" d="M34 20Q41 17 48 20 51 27 49 33L55 42Q45 47 33 41L36 33Q31 27 34 20Z"/>
          <path class="side-pants" d="M34 36Q43 34 50 39L48 47 38 47 33 42Z"/>
          <g class="side-front-leg">
            <path class="side-thigh" d="M44 40Q57 39 67 44"/>
            <g class="side-lower-leg side-front-lower-leg">
              <path class="side-calf" d="M67 44Q67 56 68 66"/>
              <path class="side-shoe" d="M67 63Q72 65 78 68 79 72 74 72H65Q63 68 67 63Z"/>
            </g>
          </g>
          <path class="side-arm side-back-arm" d="M35 24Q31 32 36 40L45 45"/>
          <circle class="side-hand side-resting-hand" cx="46" cy="45" r="3"/>
          <path class="side-arm side-front-arm" d="M46 24Q52 31 57 38L64 42"/>
          <circle class="side-hand" cx="65" cy="42" r="3"/>
          <g class="side-profile-head">
            <path class="side-head" d="M38 8Q40 2 47 2 53 3 54 8L58 11 54 14Q53 19 47 20 40 18 38 13Z"/>
            <path class="side-hair male-only" d="M38 10Q37 3 44 1 52 0 54 7 48 5 42 7L40 12Z"/>
            <path class="side-hair female-only" d="M38 10Q37 3 44 1 52 0 55 7L54 15Q57 19 57 25L49 21 46 17Q44 22 39 25 36 18 38 10Z"/>
            <path class="side-face" d="M51 9h.1M54 14q-2 2-4 .5"/>
          </g>
        </g>
      </svg>`
    : `<svg class="standing-figure character-model model-${characterModel}" viewBox="0 0 48 76" aria-hidden="true">
        <g class="standing-character">
          <g class="standing-back-leg">
            <path class="standing-pant-leg" d="M22 43Q19 53 15 65"/>
            <path class="standing-shoe" d="M12 63Q17 64 21 68L20 72H10Q8 68 12 63Z"/>
          </g>
          <path class="standing-shirt male-only" d="M18 20Q25 16 31 20L34 39Q28 44 19 40L16 28Z"/>
          <path class="standing-shirt female-only" d="M19 20Q25 16 31 20L31 31 34 40Q27 44 19 40L18 31Z"/>
          <path class="standing-pants" d="M18 38Q24 35 30 39L31 47Q25 50 17 46Z"/>
          <g class="standing-front-leg">
            <path class="standing-pant-leg" d="M27 44Q31 54 35 66"/>
            <path class="standing-shoe" d="M33 64Q38 65 42 69 42 73 38 73H31Q30 68 33 64Z"/>
          </g>
          <g class="standing-back-arm-group">
            <path class="standing-arm standing-back-arm" d="M19 24Q14 31 15 39L20 45"/>
            <circle class="standing-hand" cx="21" cy="45" r="2.7"/>
          </g>
          <g class="standing-front-arm-group">
            <path class="standing-arm standing-front-arm" d="M31 24Q34 31 37 38L41 42"/>
            <circle class="standing-hand" cx="41" cy="42" r="2.7"/>
          </g>
          <g class="standing-profile-head">
            <path class="standing-head" d="M20 8Q22 2 28 2 34 3 35 8L39 11 35 14Q34 19 28 20 22 18 20 13Z"/>
            <path class="standing-hair male-only" d="M20 10Q19 3 26 1 34 0 35 7 29 5 23 7L22 12Z"/>
            <path class="standing-hair female-only" d="M20 9Q19 2 27 1 34 1 36 7L35 14Q38 18 37 25L30 21 27 17Q25 22 20 25 18 18 20 9Z"/>
            <path class="standing-face" d="M32 9h.1M35 14q-2 2-4 .5"/>
          </g>
        </g>
      </svg>`;
  return `
    <span class="climber-aura"></span>
    <span class="climber-shadow"></span>
    ${figure}
    ${resting ? "" : sparkles}
  `;
}

function renderGoals() {
  goalCarousel.innerHTML = "";
  carouselDots.innerHTML = "";
  state.carouselIndex = Math.min(state.carouselIndex, Math.max(0, state.goals.length - 1));

  state.goals.forEach((id, cardIndex) => {
    const goal = goalTemplates[id];
    const tracking = ensureGoalTracking(id);
    const todayOutcome = getTodayOutcome(id);
    const isResting = todayOutcome?.status === "missed" || todayOutcome?.status === "rest";
    const weeklyContinuity = getContinuity(id, 7);
    const monthlyContinuity = getContinuity(id, 30);
    const targetSteps = getGoalTargetSteps(goal);
    const restReason = missReasonLabels[todayOutcome?.reason] || missReasonLabels.unspecified;
    const recoveryMessage = tracking.recovery
      ? `${tracking.recovery.date === shiftDateKey(toDateKey(), 1) ? "Yarın" : "Geri dönüş"}: ${tracking.recovery.copy}`
      : "Basamağın korunuyor; yarın yeniden başlayabilirsin.";
    const currentStep = Math.max(0, goal.progress);
    const nextStep = Math.min(targetSteps, currentStep + 1);
    const visualPosition = getStairPosition(currentStep);
    const climberPosition = getClimberPosition(currentStep);
    const windowStart = getWindowStart(currentStep);
    const stage = getCharacterStage(goal.progress);
    const stepAnimation = state.stepAnimation?.goalId === id ? state.stepAnimation : null;
    // Her tamamlamada karakteri hedef basamağın tam bir sıra gerisinden
    // başlat. Böylece onluk pencere değişse bile 10→11 gibi geçişler
    // yerinde zıplamak yerine net biçimde bir sonraki basamağa çıkar.
    const startPosition = stepAnimation ? climberPosition - 1 : climberPosition;
    const isBoosting = state.milestoneGoalId === id;
    const group = getGroup(getGoalGroupId(goal));
    const card = document.createElement("article");
    card.className = `goal-card stage-${stage.key} ${state.newGoalId === id ? "newly-created" : ""} ${isBoosting ? "milestone-boost" : ""} ${isResting ? "resting" : ""}`;
    card.dataset.goal = id;
    card.dataset.outcome = todayOutcome?.status || "pending";
    card.style.setProperty("--accent", goal.accent);
    card.innerHTML = `
      ${state.newGoalId === id ? `<span class="new-goal-ribbon">YENİ MERDİVEN</span>` : ""}
      ${isBoosting ? `<span class="milestone-ribbon">${goal.progress}. BASAMAK · GÜÇLENDİ</span>` : ""}
      <div class="goal-top">
        <div>
          <p class="kicker">GELİŞİM MERDİVENİN</p>
          ${group ? `<span class="goal-group-pill" style="--group-accent:${group.color}">${escapeHtml(group.icon)} ${escapeHtml(group.name)}</span>` : `<span class="goal-group-pill muted">Grupsuz</span>`}
          <h3>${goal.title}</h3>
          <p>${goal.subtitle}</p>
          <div class="goal-step-explainer">
            <span>${todayOutcome?.status === "complete" ? "BUGÜN ÇIKILDI" : isResting ? "BASAMAK KORUNUR" : "BUGÜNKÜ ADIM"}</span>
            <b>${todayOutcome?.status === "complete" ? `${currentStep}. basamaktasın` : isResting ? `${currentStep}. basamakta dinlen` : `${currentStep} → ${nextStep}`}</b>
          </div>
        </div>
        <div class="goal-score">
          <b>${goal.progress}</b><small>/ ${targetSteps} BASAMAK</small>
          <div class="goal-continuity"><span>7G <strong>${weeklyContinuity === null ? "—" : `%${weeklyContinuity}`}</strong></span><span>30G <strong>${monthlyContinuity === null ? "—" : `%${monthlyContinuity}`}</strong></span></div>
        </div>
      </div>
      <div class="stairs-scene">
        ${Array.from({ length: 10 }, (_, index) => {
          const label = windowStart + index;
          const stairClasses = [
            "stair",
            index === visualPosition ? "current landing" : "",
            stepAnimation && label === stepAnimation.fromProgress ? "leaving" : "",
          ].filter(Boolean).join(" ");
          return `<div class="${stairClasses}" style="--i:${index}"><span>${label}</span></div>`;
        }).join("")}
        ${stepAnimation ? `<span class="landing-pulse ${stepAnimation.big ? "big" : ""}" style="--pos:${climberPosition}"></span>` : ""}
        ${isResting ? `<div class="rest-cloud ${climberPosition >= 6 ? "high" : ""}" style="--pos:${climberPosition}"><span>☾</span><b>Bugün burada dinleniyorum</b></div>` : ""}
        <div class="climber stage-${stage.key} ${isResting ? "resting" : ""} ${stepAnimation ? (stepAnimation.big ? "level-moving" : "step-moving") : ""}" style="--pos:${startPosition};--from-pos:${startPosition};--to-pos:${climberPosition}" data-target-pos="${climberPosition}">${svgClimber(stage, isResting)}</div>
        <div class="goal-flag"><svg viewBox="0 0 34 42"><path d="M7 39V3m1 2h20l-5 7 5 7H8"/></svg><small>${targetSteps}</small></div>
      </div>
      <div class="character-status">
        <span>${isResting ? "MOLA" : stage.badge}</span>
        <div><b>${isResting ? (todayOutcome.status === "rest" ? "Planlı dinlenme" : "Bugün dinleniyor") : stage.title}</b><small>${isResting ? `${restReason}. Basamağın değişmedi.` : stage.copy}</small></div>
      </div>
      <div class="goal-foot">
        <div class="goal-trend"><span>${isResting ? "☾" : "↗"}</span><p>${isResting ? recoveryMessage : goal.trend}</p></div>
        <div class="goal-foot-actions">
          <button class="journal-button invite-goal-button" data-invite-goal="${id}">DAVET ET</button>
          <button class="journal-button" data-journal="${id}">YOL GÜNLÜĞÜ</button>
        </div>
      </div>`;
    goalCarousel.appendChild(card);

    const dot = document.createElement("span");
    dot.classList.toggle("active", cardIndex === 0);
    carouselDots.appendChild(dot);
  });

  $("#carouselTotal").textContent = state.goals.length;
  $("#carouselIndex").textContent = state.goals.length ? state.carouselIndex + 1 : 0;
  $$("#carouselDots span").forEach((dot, index) => dot.classList.toggle("active", index === state.carouselIndex));

  window.requestAnimationFrame(() => {
    const firstCard = $(".goal-card", goalCarousel);
    if (firstCard) goalCarousel.scrollLeft = state.carouselIndex * (firstCard.offsetWidth + 12);
  });
}

function renderTasks() {
  taskList.innerHTML = "";
  const todayTasks = getTodayTasks();
  const taskRows = new Map();
  todayTasks.forEach((task) => {
    const goalId = task.goalId || task.id;
    const goal = goalTemplates[goalId];
    const outcome = getTodayOutcome(goalId);
    const activeRecovery = getActiveRecovery(goalId);
    const status = outcome?.status || "pending";
    const isComplete = status === "complete";
    const isResting = status === "missed" || status === "rest";
    const targetSteps = getGoalTargetSteps(goal);
    const currentStep = Math.max(0, Number(goal?.progress) || 0);
    const nextStep = Math.min(targetSteps, currentStep + 1);
    const reasonLabel = missReasonLabels[outcome?.reason] || missReasonLabels.unspecified;
    const displayTitle = goal?.title || task.title;
    const displayMeta = isComplete
      ? `${task.baseMeta || buildTaskMeta(goal)} · Tamamlandı`
      : isResting
        ? `${status === "rest" ? "Planlı dinlenme" : "Bugün dinleniyor"} · ${reasonLabel}`
        : activeRecovery
          ? `Geri dönüş: ${activeRecovery.copy} · Bir basamak değerinde`
          : task.baseMeta || buildTaskMeta(goal);
    const reward = isComplete
      ? `<b>✓</b><small>bitti</small>`
      : isResting
        ? `<b>☾</b><small>dinlen</small>`
        : `<b>+1</b><small>${activeRecovery ? "geri dön" : "basamak"}</small>`;
    const ladderHint = isComplete
      ? `Bugün ${currentStep}. basamağa çıktın`
      : isResting
        ? `Bugün basamak korunur: ${currentStep}`
        : `Tamamlayınca merdiven: ${currentStep} → ${nextStep}`;
    const taskGoalMark = isComplete
      ? `<svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"/></svg>`
      : isResting
        ? "<i>☾</i>"
        : `<em>${goal?.icon || "↗"}</em>`;

    task.done = isComplete;
    task.status = status;
    task.meta = displayMeta;

    const row = document.createElement("article");
    row.className = `task-row status-${status} ${activeRecovery && !outcome ? "recovery-task" : ""}`;
    row.dataset.taskRow = task.id;
    row.style.setProperty("--accent", goal?.accent || "90,227,174");
    row.innerHTML = `
      <button class="task ${isComplete ? "completed" : ""} ${isResting ? "resting" : ""}" data-task="${task.id}" data-task-complete="${task.id}" data-linked-goal="${goalId}">
        <span class="task-check" aria-hidden="true">${taskGoalMark}</span>
        <span class="task-copy"><b>${displayTitle}</b><small>${displayMeta}</small><i>${ladderHint}</i></span>
        <span class="reward">${reward}</span>
      </button>
      <div class="task-status-switch" aria-label="Bugünün kaydını değiştir">
        <button class="${isComplete ? "active" : ""}" data-task-complete="${task.id}"><span>✓</span> Yaptım</button>
        <button class="${isResting ? "active" : ""}" data-task-miss="${task.id}"><span>○</span> Bugün olmadı</button>
      </div>
      ${isResting && ensureGoalTracking(goalId).recovery ? `<div class="tomorrow-step"><span>↗</span><small>YARIN</small><b>${ensureGoalTracking(goalId).recovery.copy}</b></div>` : ""}`;
    taskRows.set(goalId, row);
  });
  if (hasActiveGroups(todayTasks.map((task) => task.goalId || task.id))) {
    getGroupedGoalEntries(todayTasks.map((task) => task.goalId || task.id)).forEach(({ id, group, goalIds }) => {
      const groupTasks = todayTasks.filter((task) => goalIds.includes(task.goalId || task.id));
      const completed = groupTasks.filter((task) => getTodayOutcome(task.goalId || task.id)?.status === "complete").length;
      const section = document.createElement("section");
      section.className = `task-group ${collapsedGroups.has(id) ? "collapsed" : ""}`;
      section.style.setProperty("--group-accent", group.color);
      section.innerHTML = `
        <button class="task-group-head" data-toggle-group="${escapeHtml(id)}">
          <span>${escapeHtml(group.icon)}</span>
          <b>${escapeHtml(group.name)}</b>
          <small>${completed}/${groupTasks.length}</small>
          <i>${collapsedGroups.has(id) ? "＋" : "−"}</i>
        </button>
        <div class="task-group-body"></div>`;
      const body = $(".task-group-body", section);
      goalIds.forEach((goalId) => {
        const row = taskRows.get(goalId);
        if (row) body.appendChild(row);
      });
      taskList.appendChild(section);
    });
  } else {
    todayTasks.forEach((task) => {
      const row = taskRows.get(task.goalId || task.id);
      if (row) taskList.appendChild(row);
    });
  }
  $("#doneCount").textContent = todayTasks.filter((task) => task.status === "complete").length;
  $(".task-count span").textContent = `/${todayTasks.length}`;
  renderContinuitySummary();
  renderDailyRhythm();
}

function renderGoalLibrary() {
  renderGroupControls();
  const library = $("#goalLibrary");
  const visibleGoals = state.goals
    .map((id) => goalTemplates[id])
    .filter((goal) => state.goalFilter === "all" || goal.category === state.goalFilter)
    .filter((goal) => state.groupFilter === "all" || (state.groupFilter === "ungrouped" ? !getGoalGroupId(goal) : getGoalGroupId(goal) === state.groupFilter));

  const renderLibraryCard = (goal) => {
    const stage = getCharacterStage(goal.progress);
    const weeklyContinuity = getContinuity(goal.id, 7);
    const monthlyContinuity = getContinuity(goal.id, 30);
    const weekView = getWeekView(goal.id);
    const targetSteps = getGoalTargetSteps(goal);
    const progressPercent = getGoalProgressPercent(goal);
    return `
    <article class="library-card" data-library-goal="${goal.id}" style="--accent:${goal.accent}">
      <div class="library-main">
        <span class="library-icon">${goal.icon}</span>
        <div class="library-copy"><h3>${goal.title}</h3><p>${goal.subtitle}</p></div>
        <div class="library-score"><b>${goal.progress}</b><small>/ ${targetSteps} BASAMAK</small></div>
      </div>
      <div class="library-progress" style="--progress:${progressPercent}%"><span></span></div>
      <div class="library-stage stage-${stage.key}">
        <span>${stage.badge}</span>
        <b>${stage.title}</b>
        <i>7G ${weeklyContinuity === null ? "—" : `%${weeklyContinuity}`} · 30G ${monthlyContinuity === null ? "—" : `%${monthlyContinuity}`}</i>
      </div>
      <div class="library-week">
        <div class="mini-week" aria-label="Haftalık ilerleme">
          ${weekView.map((day) => `<span class="${day.status}" title="${day.day}">${day.symbol}</span>`).join("")}
        </div>
        <div class="library-actions">
          <button data-library-invite="${goal.id}">DAVET</button>
          <button data-library-journal="${goal.id}">GÜNLÜK</button>
          <button data-library-detail="${goal.id}">DETAY</button>
          <button class="danger-link" data-library-delete="${goal.id}">SİL</button>
        </div>
      </div>
    </article>
  `;
  };

  if (hasActiveGroups(visibleGoals.map((goal) => goal.id))) {
    library.innerHTML = getGroupedGoalEntries(visibleGoals.map((goal) => goal.id)).map(({ id, group, goalIds }) => `
      <section class="library-group ${collapsedGroups.has(id) ? "collapsed" : ""}" style="--group-accent:${group.color}">
        <button class="library-group-head" data-toggle-group="${escapeHtml(id)}">
          <span>${escapeHtml(group.icon)}</span>
          <b>${escapeHtml(group.name)}</b>
          <small>${goalIds.length} merdiven</small>
          <i>${collapsedGroups.has(id) ? "＋" : "−"}</i>
        </button>
        <div class="library-group-body">${goalIds.map((goalId) => renderLibraryCard(goalTemplates[goalId])).join("")}</div>
      </section>
    `).join("");
  } else {
    library.innerHTML = visibleGoals.map(renderLibraryCard).join("");
  }

  if (!visibleGoals.length) {
    library.innerHTML = `<div class="empty-goals"><b>Bu alanda henüz bir hedefin yok.</b><small>Yeni bir yol başlatarak ilk basamağını oluşturabilirsin.</small></div>`;
  }

  renderContinuitySummary();
  renderDailyRhythm();
}

function getFriend(friendId) {
  return socialState.friends.find((friend) => friend.id === friendId)
    || socialState.pendingInvites.find((friend) => friend.id === friendId);
}

function getInviteLink(goalId = state.inviteGoalId) {
  const base = window.location.protocol === "file:"
    ? "http://127.0.0.1:4173/"
    : `${window.location.origin}${window.location.pathname}`;
  const params = new URLSearchParams({ invite: socialState.inviteCode });
  if (goalId && goalTemplates[goalId]) params.set("goal", goalId);
  return `${base}?${params.toString()}`;
}

async function hydrateInviteFromUrl() {
  const inviteCode = getInviteCodeFromUrl();
  const inviteGoalId = getInviteGoalIdFromUrl();
  if (!inviteCode || !socialBackendSession || inviteCode === socialState.inviteCode) return;
  try {
    const payload = await socialApi("/api/invites/open", { method: "POST", body: { code: inviteCode, goalId: inviteGoalId } });
    applySocialPayload(payload.social);
    showPage("Yoldaşlar");
    $$(".nav-item").forEach((item) => item.classList.toggle("active", item.getAttribute("aria-label") === "Yoldaşlar"));
    if (inviteGoalId) {
      showToast("Merdiven daveti geldi.", "Bu bağlantı yalnızca seçilen merdiveni paylaşır.");
      return;
    }
    showToast("Yoldaşlık daveti geldi.", "Bağlantıyı açtığın kişinin paylaşımını kabul ederek başlayabilirsin.");
  } catch (error) {
    if (error.status !== 400) showToast("Davet açılamadı.", error.message || "Bağlantı geçersiz veya süresi dolmuş olabilir.");
  }
}

async function initializeSocialBackend() {
  if (typeof window.fetch !== "function" || window.location.protocol === "file:") {
    setSocialSyncStatus("offline", "Backend için yerel sunucuyu aç");
    return;
  }

  if (!isOnboarded()) {
    setSocialSyncStatus("offline", "Profilini tamamlayınca hazırlanacak");
    return;
  }

  setSocialSyncStatus("connecting", "Sunucuya bağlanıyor");
  try {
    if (socialBackendSession) {
      const restored = await refreshSocialState();
      if (!restored && !socialBackendSession) setSocialSyncStatus("connecting", "Yeni oturum hazırlanıyor");
    }

    if (!socialBackendSession) {
      const created = await socialApi("/api/sessions", {
        method: "POST",
        auth: false,
        body: {
          profile: getSharedProfilePayload(),
          demo: false,
        },
      });
      saveSocialBackendSession(created.session);
      applySocialPayload(created.social);
    }

    await syncSocialProfile();
    await hydrateInviteFromUrl();
    window.clearInterval(socialRefreshTimer);
    socialRefreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshSocialState();
    }, SOCIAL_REFRESH_MS);
  } catch (error) {
    socialBackendConnected = false;
    setSocialSyncStatus("offline", "Çevrimdışı önizleme");
    console.warn("Sosyal backend bağlantısı kurulamadı:", error);
  }
}

function renderSharedJourney(journey) {
  const friend = getFriend(journey.friendId);
  const goal = goalTemplates[journey.goalId];
  if (!friend || !goal) return "";
  const friendGoal = friend.goals.find((item) => item.id === journey.goalId) || { progress: 0, status: "pending", targetSteps: getGoalTargetSteps(goal) };
  const myProgress = Math.max(0, goal.progress);
  const friendProgress = Math.max(0, Number(friendGoal.progress) || 0);
  const windowStart = Math.max(0, Math.min(myProgress, friendProgress) - 2);
  const myPosition = Math.max(0, Math.min(7, myProgress - windowStart));
  const friendPosition = Math.max(0, Math.min(7, friendProgress - windowStart));
  const target = Math.max(journey.target || getGoalTargetSteps(goal), getGoalTargetSteps(goal), getGoalTargetSteps(friendGoal), myProgress, friendProgress);
  const bothDone = getTodayOutcome(goal.id)?.status === "complete" && friendGoal.status === "complete";
  const myName = $("#userNameLabel").textContent.trim() || "Sen";
  const myStage = getCharacterStage(myProgress);
  const friendStage = getCharacterStage(friendProgress);

  return `
    <article class="shared-journey-card" data-shared-journey="${journey.id}" style="--accent:${goal.accent}">
      <div class="shared-card-head">
        <div><p class="kicker">İKİ KARAKTER · TEK YOL</p><h3>${escapeHtml(goal.title)}</h3><p>${escapeHtml(friend.name)} ile yan yana ilerliyorsun</p></div>
        <div class="shared-target"><b>${Math.max(myProgress, friendProgress)}</b><small>/ ${target} ORTAK EŞİK</small></div>
      </div>
      <div class="social-ladder-scene">
        ${Array.from({ length: 8 }, (_, index) => `<div class="duo-stair" style="--i:${index}"><span>${windowStart + index}</span></div>`).join("")}
        <div class="climber duo-climber me stage-${myStage.key}" style="--pos:${myPosition};--accent:${goal.accent}">${svgClimber(myStage, false, getCharacterModel())}</div>
        <div class="climber duo-climber friend stage-${friendStage.key}" style="--pos:${friendPosition};--accent:${friend.accent}">${svgClimber(friendStage, false, friend.gender)}</div>
        <span class="duo-climber-tag" style="--pos:${myPosition};--tag-accent:${goal.accent}">${escapeHtml(myName)}</span>
        <span class="duo-climber-tag friend" style="--pos:${friendPosition};--tag-accent:${friend.accent}">${escapeHtml(friend.name)}</span>
      </div>
      <div class="shared-card-foot">
        <div class="shared-status"><span>${bothDone ? "✦" : "↗"}</span><div><b>${bothDone ? "Bugün ikiniz de yükseldiniz" : "Herkes kendi adımıyla ilerler"}</b><small>Kimse diğerini bekletmez, yol gerilemez.</small></div></div>
        <button data-open-friend="${friend.id}">MERDİVENLERİ GÖR</button>
      </div>
    </article>`;
}

function formatActivityTime(createdAt) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return "şimdi";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün`;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(createdAt));
}

function renderActivity(activity) {
  const goal = goalTemplates[activity.goalId];
  const actorName = activity.actorIsMe ? "Sen" : activity.actorName || "Bir yoldaşın";
  const friendName = activity.friendName || activity.actorName || "Yeni yoldaşın";
  const presentations = {
    friend_added: {
      icon: "⌁",
      title: `${escapeHtml(friendName)} ile yoldaş oldunuz`,
      detail: "Artık paylaşılan merdivenlerinizi görebilirsiniz.",
    },
    journey_started: {
      icon: "↗",
      title: `${escapeHtml(actorName)} ortak bir merdiven başlattı`,
      detail: goal ? goal.title : "Yeni ortak yol",
    },
    step_completed: {
      icon: "✓",
      title: `${escapeHtml(actorName)} bir basamak çıktı`,
      detail: goal ? `${goal.title} · ${activity.progress || goal.progress}. basamak` : "Günlük adım tamamlandı",
    },
    rest_day: {
      icon: "☾",
      title: `${escapeHtml(actorName)} bugün dinleniyor`,
      detail: goal ? `${goal.title} · basamak korundu` : "Yol gerilemedi",
    },
  };
  const view = presentations[activity.type] || { icon: "•", title: "Yoldaş çevrende bir hareket oldu", detail: "Yol devam ediyor." };
  return `<article class="activity-item" style="--activity-accent:${activity.actorAccent || "119,120,255"}">
    <span class="activity-icon">${view.icon}</span>
    <div class="activity-copy"><b>${view.title}</b><small>${escapeHtml(view.detail)}</small></div>
    <time datetime="${escapeHtml(activity.createdAt || "")}">${formatActivityTime(activity.createdAt)}</time>
  </article>`;
}

function renderSocial() {
  const incoming = $("#incomingInvites");
  incoming.innerHTML = socialState.pendingInvites.map((invite) => {
    const goalNames = (invite.goals || []).map((goal) => goal.title).filter(Boolean);
    const inviteCopy = goalNames.length === 1
      ? `Sadece "${goalNames[0]}" merdiveni paylaşılacak.`
      : "Kabul edersen yalnızca paylaşmayı seçtiğiniz merdivenleri görebileceksiniz.";
    return `
    <article class="incoming-invite" style="--friend-accent:${invite.accent}">
      <span class="incoming-avatar">${escapeHtml(invite.initial)}</span>
      <div class="incoming-copy"><b>${escapeHtml(invite.name)} seni yoldaşlığa davet ediyor</b><small>${escapeHtml(inviteCopy)}</small></div>
      <div class="invite-actions"><button data-accept-invite="${invite.id}">YOLDAŞLIĞI KABUL ET</button><button data-decline-invite="${invite.id}">ŞİMDİLİK DEĞİL</button></div>
    </article>
  `;
  }).join("");

  $("#sharedJourneys").innerHTML = socialState.sharedJourneys.length
    ? socialState.sharedJourneys.map(renderSharedJourney).join("")
    : `<div class="empty-social"><span>↗</span><b>Henüz ortak bir merdivenin yok.</b><small>Bir yoldaşının paylaştığı hedefi seçerek yan yana çıkmaya başlayabilirsin.</small><button data-open-invite>ARKADAŞINI DAVET ET</button></div>`;

  $("#friendList").innerHTML = socialState.friends.length
    ? socialState.friends.map((friend) => {
      const sharedCount = socialState.sharedJourneys.filter((journey) => journey.friendId === friend.id).length;
      const statusText = friend.todayStatus === "complete" ? "Bugünkü adımını tamamladı" : friend.todayStatus === "resting" ? "Bugün dinleniyor" : "Bugünkü adımı bekliyor";
      return `
        <article class="friend-card" style="--friend-accent:${friend.accent}">
          <div class="friend-avatar">${escapeHtml(friend.initial)}${friend.online ? "<i></i>" : ""}</div>
          <div class="friend-copy"><b>${escapeHtml(friend.name)} <small>${escapeHtml(friend.handle)}</small></b><small>${friend.goals.length} merdiven paylaşıyor · ${sharedCount} ortak yol</small><span class="friend-today ${friend.todayStatus === "resting" ? "resting" : ""}">${friend.todayStatus === "complete" ? "✓" : "☾"} ${statusText}</span></div>
          <div class="friend-actions"><button data-open-friend="${friend.id}" aria-label="${escapeHtml(friend.name)} merdivenlerini gör">↗</button></div>
        </article>`;
    }).join("")
    : `<div class="empty-social"><span>⌁</span><b>Yolunu henüz kimseyle paylaşmadın.</b><small>Özel davet bağlantınla ilk yoldaşını ekleyebilirsin.</small><button data-open-invite>DAVET BAĞLANTISI OLUŞTUR</button></div>`;

  $("#activityFeed").innerHTML = socialState.activities.length
    ? socialState.activities.map(renderActivity).join("")
    : `<div class="empty-social"><span>•</span><b>Henüz hareket yok.</b><small>Bir yoldaş eklediğinde veya ortak merdiven başladığında burada görünecek.</small></div>`;

  $("#sharedJourneyCount").textContent = `${socialState.sharedJourneys.length} yol`;
  $("#friendCount").textContent = `${socialState.friends.length} kişi`;
  $("#activityCount").textContent = `${socialState.activities.length} hareket`;
}

function setInviteControlsDisabled(disabled) {
  ["#copyInviteLink", "#shareInviteLink", "#regenerateInviteLink"].forEach((selector) => {
    const button = $(selector);
    if (button) button.disabled = disabled;
  });
}

async function ensureInviteReady() {
  if (!socialBackendSession && typeof window.fetch === "function") await initializeSocialBackend();
  if (socialBackendSession && !socialBackendConnected) await refreshSocialState({ quiet: false });
  return Boolean(socialBackendSession && socialBackendConnected && socialState.inviteCode);
}

async function openInvitePanel(goalId = null) {
  const scopedGoal = goalId && goalTemplates[goalId] ? goalTemplates[goalId] : null;
  state.inviteGoalId = scopedGoal ? scopedGoal.id : null;
  $("#inviteSheetTitle").textContent = scopedGoal ? "Bu merdivene davet et" : "Arkadaşını yoluna çağır";
  $("#inviteSheetCopy").textContent = scopedGoal
    ? "Bu bağlantıyı açan kişi yalnızca bu merdiveni görebilir. Diğer hedeflerin, analizlerin ve notların paylaşılmaz."
    : "Bu bağlantıya sahip kişi sana yoldaşlık isteği gönderebilir. Kabul etmeden hiçbir merdivenini göremez.";
  const inviteGoalFocus = $("#inviteGoalFocus");
  const shareScopeBlock = $("#shareScopeBlock");
  if (inviteGoalFocus) {
    inviteGoalFocus.hidden = !scopedGoal;
    inviteGoalFocus.innerHTML = scopedGoal ? `<span>${scopedGoal.icon}</span><div><b>${escapeHtml(scopedGoal.title)}</b><small>Sadece bu merdiven paylaşılacak.</small></div>` : "";
  }
  if (shareScopeBlock) shareScopeBlock.hidden = Boolean(scopedGoal);
  $("#inviteLinkValue").value = socialBackendConnected ? getInviteLink() : "Güvenli bağlantı hazırlanıyor…";
  $$("#shareScopeOptions button").forEach((button) => button.classList.toggle("selected", button.dataset.scope === socialState.shareScope));
  openSheet($("#inviteSheet"));
  setInviteControlsDisabled(true);
  const ready = await ensureInviteReady();
  setInviteControlsDisabled(!ready);
  $("#inviteLinkValue").value = ready ? getInviteLink() : "Sunucu bağlantısı kurulamadı";
}

function renderFriendSheet(friendId) {
  const friend = getFriend(friendId);
  if (!friend) return;
  state.activeFriendId = friendId;
  $("#friendSheet").style.setProperty("--friend-accent", friend.accent);
  $("#friendSheetAvatar").textContent = friend.initial;
  $("#friendSheetTitle").textContent = friend.name;
  $("#friendSheetHandle").textContent = `${friend.handle} · ${friend.online ? "şu an aktif" : "yakın zamanda aktifti"}`;
  $("#friendSheetCopy").textContent = `${friend.name}, aşağıdaki hedeflerini seninle paylaşmayı seçti.`;
  $("#friendGoalList").innerHTML = friend.goals.map((friendGoal) => {
    const goal = goalTemplates[friendGoal.id];
    if (!goal) return "";
    const isShared = socialState.sharedJourneys.some((journey) => journey.friendId === friendId && journey.goalId === friendGoal.id);
    const friendTargetSteps = getGoalTargetSteps(friendGoal);
    const friendProgressPercent = Math.min(100, Math.round(((Number(friendGoal.progress) || 0) / friendTargetSteps) * 100));
    return `
      <article class="friend-goal" style="--goal-accent:${goal.accent}">
        <span class="friend-goal-icon">${goal.icon}</span>
        <div class="friend-goal-copy"><b>${escapeHtml(goal.title)}</b><small>${Number(friendGoal.progress) || 0}/${friendTargetSteps} basamak · ${friendGoal.status === "complete" ? "bugün tamamlandı" : friendGoal.status === "resting" ? "bugün dinleniyor" : "bugünkü adımı bekliyor"}</small><div class="friend-goal-progress" style="--progress:${friendProgressPercent}%"><span></span></div></div>
        <button class="${isShared ? "active" : ""}" data-start-shared="${friendId}" data-shared-goal="${friendGoal.id}">${isShared ? "ORTAK YOLDA" : "BERABER ÇIK"}</button>
      </article>`;
  }).join("");
  openSheet($("#friendSheet"));
}

async function acceptInvite(inviteId) {
  const invite = socialState.pendingInvites.find((item) => item.id === inviteId);
  if (!invite) return;
  if (socialBackendSession) {
    try {
      setSocialSyncStatus("connecting", "Davet kabul ediliyor");
      const payload = await socialApi(`/api/invites/${encodeURIComponent(inviteId)}/accept`, { method: "POST" });
      applySocialPayload(payload.social);
      showToast(`${invite.name} artık yoldaşın.`, "Paylaşmayı seçtiğiniz merdivenleri görebilirsiniz.");
    } catch (error) {
      setSocialSyncStatus("offline", "İşlem tamamlanamadı");
      showToast("Davet kabul edilemedi.", error.message || "Bağlantıyı kontrol edip yeniden dene.");
    }
    return;
  }
  socialState.pendingInvites = socialState.pendingInvites.filter((item) => item.id !== inviteId);
  socialState.friends.push(invite);
  socialState.activities.unshift({
    id: `friend-added-${Date.now()}`,
    type: "friend_added",
    actorId: invite.id,
    actorName: invite.name,
    actorAccent: invite.accent,
    friendName: invite.name,
    createdAt: new Date().toISOString(),
  });
  saveSocialState();
  renderSocial();
  showToast(`${invite.name} artık yoldaşın.`, "Paylaşmayı seçtiğiniz merdivenleri görebilirsiniz.");
}

async function declineInvite(inviteId) {
  if (socialBackendSession) {
    try {
      const payload = await socialApi(`/api/invites/${encodeURIComponent(inviteId)}`, { method: "DELETE" });
      applySocialPayload(payload.social);
      showToast("Davet kaldırıldı.", "İstersen daha sonra yeni bir bağlantıyla yeniden ekleyebilirsin.");
    } catch (error) {
      showToast("Davet kaldırılamadı.", error.message || "Bağlantıyı kontrol edip yeniden dene.");
    }
    return;
  }
  socialState.pendingInvites = socialState.pendingInvites.filter((item) => item.id !== inviteId);
  saveSocialState();
  renderSocial();
  showToast("Davet kaldırıldı.", "İstersen daha sonra yeni bir bağlantıyla yeniden ekleyebilirsin.");
}

async function startSharedJourney(friendId, goalId) {
  const friend = getFriend(friendId);
  const goal = goalTemplates[goalId];
  if (!friend || !goal) return;
  const existing = socialState.sharedJourneys.find((journey) => journey.friendId === friendId && journey.goalId === goalId);
  if (existing) {
    closeSheets();
    showToast("Zaten aynı merdivendesiniz.", `${friend.name} ile ${goal.title} yolunuz açık.`);
    return;
  }
  if (socialBackendSession) {
    try {
      setSocialSyncStatus("connecting", "Ortak yol hazırlanıyor");
      const payload = await socialApi("/api/journeys", { method: "POST", body: { friendId, goalId } });
      applySocialPayload(payload.social);
      closeSheets();
      showPage("Yoldaşlar");
      showToast("Ortak merdiveniniz hazır!", `${friend.name} ile kendi hızınızda, yan yana ilerleyeceksiniz.`);
    } catch (error) {
      setSocialSyncStatus("offline", "İşlem tamamlanamadı");
      showToast("Ortak yol açılamadı.", error.message || "İkinizde de açık olan bir hedef seçmelisiniz.");
    }
    return;
  }
  const friendGoal = friend.goals.find((item) => item.id === goalId);
  const myProgress = Number(goal.progress) || 0;
  const friendProgress = Number(friendGoal?.progress) || 0;
  const sharedTarget = Math.max(getGoalTargetSteps(goal), getGoalTargetSteps(friendGoal));
  const nextMilestone = Math.min(sharedTarget, Math.ceil((Math.max(myProgress, friendProgress) + 1) / 10) * 10);
  socialState.sharedJourneys.push({
    id: `${friendId}-${goalId}`,
    friendId,
    goalId,
    target: Math.max(10, nextMilestone),
    createdAt: toDateKey(),
  });
  socialState.activities.unshift({
    id: `journey-started-${Date.now()}`,
    type: "journey_started",
    actorIsMe: true,
    actorName: $("#userNameLabel").textContent.trim() || "Sen",
    actorAccent: goal.accent,
    friendName: friend.name,
    goalId,
    createdAt: new Date().toISOString(),
  });
  saveSocialState();
  closeSheets();
  renderSocial();
  showPage("Yoldaşlar");
  showToast("Ortak merdiveniniz hazır!", `${friend.name} ile kendi hızınızda, yan yana ilerleyeceksiniz.`);
}

function renderCatalogCategories() {
  const allButton = `<button class="${state.catalogCategory === "all" ? "active" : ""}" data-catalog-category="all"><span>✦</span>Tümü</button>`;
  const categoryButtons = window.GOAL_CATEGORIES.map((category) => `
    <button class="${state.catalogCategory === category.id ? "active" : ""}" data-catalog-category="${category.id}">
      <span>${category.icon}</span>${category.label}
    </button>
  `).join("");
  $("#catalogCategories").innerHTML = allButton + categoryButtons;
}

function renderGoalCatalog() {
  const query = $("#goalSearch").value.trim().toLocaleLowerCase("tr-TR");
  const results = window.GOAL_CATALOG.filter((goal) => {
    const categoryMatches = state.catalogCategory === "all" || goal.category === state.catalogCategory;
    const queryMatches = !query
      || goal.title.toLocaleLowerCase("tr-TR").includes(query)
      || goal.categoryLabel.toLocaleLowerCase("tr-TR").includes(query);
    return categoryMatches && queryMatches;
  });

  const activeCategory = window.GOAL_CATEGORIES.find((category) => category.id === state.catalogCategory);
  $("#catalogHeading").textContent = query ? `"${$("#goalSearch").value.trim()}" sonuçları` : (activeCategory?.label || "Tüm hedefler");
  $("#catalogCount").textContent = `${results.length} seçenek`;
  $("#catalogTotal").textContent = window.GOAL_CATALOG.length;

  $("#goalCatalogList").innerHTML = results.length
    ? results.map((goal) => `
      <button class="catalog-goal" data-catalog-goal="${goal.id}" style="--accent:${goal.accent}">
        <span>${goal.icon}</span>
        <span><b>${goal.title}</b><small>${goal.amount} ${goal.unit} · ${goal.frequency}</small></span>
        <i>→</i>
      </button>
    `).join("")
    : `<div class="catalog-empty"><span>⌕</span><b>Bu aramaya uygun hedef bulamadık.</b><small>İstersen aramayı değiştir veya sıfırdan kendi hedefini oluştur.</small></div>`;
}

function openGoalCreator() {
  state.catalogCategory = "all";
  goalCreator.hidden = false;
  catalogView.hidden = false;
  customizeView.hidden = true;
  $("#goalSearch").value = "";
  goalCreator.scrollTop = 0;
  renderCatalogCategories();
  renderGoalCatalog();
}

function closeGoalCreator() {
  goalCreator.hidden = true;
}

function updateStepRulePreview() {
  const amount = $("#customAmount").value || "1";
  const unit = $("#customUnit").value;
  const targetSteps = Math.max(1, Math.min(9999, Math.round(Number($("#customTargetSteps").value) || 100)));
  $("#stepRulePreview").textContent = `${amount} ${unit} tamamla · hedef ${targetSteps} basamak`;
}

function openCustomizeGoal(template) {
  state.selectedCatalogGoal = template;
  state.selectedAccent = template.accent || "102,229,255";
  catalogView.hidden = true;
  customizeView.hidden = false;
  goalCreator.scrollTop = 0;
  $("#customizeIcon").textContent = template.icon || "✦";
  $("#customizeHeading").textContent = template.title || "Kendi hedefin";
  $("#customGoalName").value = template.title || "";
  $("#customAmount").value = template.amount || 1;
  $("#customUnit").value = template.unit || "kez";
  $("#customFrequency").value = template.frequency || "Her gün";
  $("#customTargetSteps").value = getGoalTargetSteps(template);
  $("#customGroup").innerHTML = groupOptionsHtml(template.groupId || (template.category === "health" ? "health" : template.category === "finance" ? "finance" : template.category === "learning" ? "learning" : ""));
  $("#customWhy").value = "";
  $$("#themeChoices button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.accent === state.selectedAccent);
  });
  updateStepRulePreview();
}

function getGoalSignature(goal) {
  return [
    goal?.title || "",
    goal?.category || "custom",
    goal?.amount || 1,
    goal?.unit || "kez",
    goal?.frequency || "Her gün",
    getGoalTargetSteps(goal),
  ].map((value) => String(value).trim().toLocaleLowerCase("tr-TR")).join("|");
}

function loadSavedCustomGoals() {
  try {
    const rawSavedGoals = JSON.parse(window.localStorage.getItem("dunku-sen-custom-goals") || "[]");
    const uniqueGoals = new Map();
    let migrated = false;
    rawSavedGoals.forEach((goal) => {
      goal.targetSteps = getGoalTargetSteps(goal);
      // Tüm merdivenler artık 0. basamaktan başlar; ilk tamamlamada net biçimde 1'e çıkar.
      const normalizedProgress = Math.min(goal.targetSteps, Math.max(0, Number(goal.progress) || 0));
      if (goal.progress !== normalizedProgress) {
        goal.progress = normalizedProgress;
        migrated = true;
      }
      const signature = getGoalSignature(goal);
      const existingGoal = uniqueGoals.get(signature);
      if (existingGoal) {
        // Aynı hedef yanlışlıkla birden fazla kez eklendiyse en ileride olanı koru.
        if (goal.progress > existingGoal.progress) uniqueGoals.set(signature, goal);
        migrated = true;
      } else {
        uniqueGoals.set(signature, goal);
      }
    });

    const savedGoals = [...uniqueGoals.values()];
    savedGoals.forEach((goal) => {
      goalTemplates[goal.id] = goal;
      if (!state.goals.includes(goal.id)) state.goals.push(goal.id);
      if (!tasks.some((task) => task.id === goal.id)) {
        tasks.push({
          id: goal.id,
          goalId: goal.id,
          title: goal.title,
          meta: `${goal.amount} ${goal.unit} · ${goal.frequency}`,
          baseMeta: `${goalCategoryLabel(goal.category)} · ${goal.amount} ${goal.unit}`,
          xp: 15,
          done: false,
        });
      }
    });
    if (migrated || savedGoals.length !== rawSavedGoals.length) {
      window.localStorage.setItem("dunku-sen-custom-goals", JSON.stringify(savedGoals));
    }
  } catch {
    window.localStorage.removeItem("dunku-sen-custom-goals");
  }
}

function persistCustomGoal(goalId) {
  if (!goalId?.startsWith("custom-") || !goalTemplates[goalId]) return;
  try {
    const savedGoals = JSON.parse(window.localStorage.getItem("dunku-sen-custom-goals") || "[]");
    const savedIndex = savedGoals.findIndex((goal) => goal.id === goalId);
    if (savedIndex >= 0) savedGoals[savedIndex] = { ...savedGoals[savedIndex], ...goalTemplates[goalId] };
    else savedGoals.push(goalTemplates[goalId]);
    window.localStorage.setItem("dunku-sen-custom-goals", JSON.stringify(savedGoals));
  } catch {
    // Depolama kullanılamasa bile günlük adım ve animasyon çalışmaya devam eder.
  }
}

function removeSavedCustomGoal(goalId) {
  if (!goalId?.startsWith("custom-")) return;
  try {
    const savedGoals = JSON.parse(window.localStorage.getItem("dunku-sen-custom-goals") || "[]");
    window.localStorage.setItem("dunku-sen-custom-goals", JSON.stringify(savedGoals.filter((goal) => goal.id !== goalId)));
  } catch {
    // Silme işlemi aktif listede yine uygulanır.
  }
}

function deleteGoal(goalId) {
  const goal = goalTemplates[goalId];
  if (!goal || !state.goals.includes(goalId)) return;
  if (state.goals.length <= 1) {
    showToast("Son merdiveni silmeyelim.", "Önce yeni bir hedef ekle; sonra bunu kaldırabiliriz.");
    return;
  }
  const confirmed = window.confirm(`"${goal.title}" merdivenini silmek istiyor musun?\n\nBugünden itibaren ekranda görünmez. Geçmiş kayıtların güvenli tarafta tutulur.`);
  if (!confirmed) return;

  state.goals = state.goals.filter((id) => id !== goalId);
  state.carouselIndex = Math.min(state.carouselIndex, Math.max(0, state.goals.length - 1));
  if (state.activeGoal === goalId) state.activeGoal = null;
  if (state.analysisGoal === goalId) state.analysisGoal = "all";
  removeSavedCustomGoal(goalId);
  saveSelectedGoals();
  scheduleSocialProfileSync();
  closeSheets();
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  renderAnalysis();
  renderSocial();
  showToast("Merdiven silindi.", `${goal.title} artık aktif hedeflerinde görünmeyecek.`);
}

function updateOnboarding() {
  $$(".onboarding-step").forEach((step) => step.classList.toggle("active", Number(step.dataset.step) === state.onboardingStep));
  $$("#onboardingProgress span").forEach((dot, index) => dot.classList.toggle("active", index === state.onboardingStep));
  onboarding.scrollTop = 0;
}

function hydrateLocalProfile() {
  const savedGoalIds = getSavedGoalIds();
  if (savedGoalIds.length) {
    state.goals = savedGoalIds;
    $$("#starterGoals > button").forEach((button) => button.classList.toggle("selected", state.goals.includes(button.dataset.goal)));
  }
  const savedName = window.localStorage.getItem(PROFILE_NAME_KEY)?.trim();
  if (savedName) {
    $("#nameInput").value = savedName;
    $("#userNameLabel").textContent = savedName;
    $("#readyName").textContent = savedName;
    $("#avatarLetter").textContent = savedName[0].toLocaleUpperCase("tr-TR");
  } else {
    $("#userNameLabel").textContent = "Yolcu";
    $("#readyName").textContent = "Yolcu";
    $("#avatarLetter").textContent = "Y";
  }
  if (isOnboarded()) {
    window.localStorage.setItem(ONBOARDED_KEY, "true");
    onboarding.classList.remove("show");
  }
}

function nextOnboarding() {
  if (state.onboardingStep === 1) {
    const name = $("#nameInput").value.trim() || "Yolcu";
    $("#readyName").textContent = name;
  }
  if (state.onboardingStep === 3) {
    const selected = $$("#starterGoals > button.selected").map((button) => button.dataset.goal);
    state.goals = selected.length ? selected : ["walk"];
    saveSelectedGoals();
    const summary = $(".ready-summary");
    summary.firstElementChild.textContent = `${state.goals.length} hedef`;
    summary.children[2].textContent = "0. basamaktan";
    renderGoals();
    renderTasks();
    renderGoalLibrary();
  }
  state.onboardingStep = Math.min(4, state.onboardingStep + 1);
  updateOnboarding();
}

function openSheet(sheet) {
  sheetBackdrop.classList.add("show");
  sheet.classList.add("show");
}

function closeSheets() {
  sheetBackdrop.classList.remove("show");
  $$(".bottom-sheet").forEach((sheet) => sheet.classList.remove("show"));
}

function showToast(title, text) {
  window.clearTimeout(toastTimer);
  toastTitle.textContent = title;
  toastText.textContent = text;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function celebrate(element) {
  const rect = element.getBoundingClientRect();
  const colors = ["#66e5ff", "#af70ff", "#5ae3ae", "#f4c56c", "#7778ff"];
  for (let index = 0; index < 25; index += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${rect.left + rect.width / 2}px`;
    piece.style.top = `${rect.top + rect.height / 2}px`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--x", `${(Math.random() - .5) * 260}px`);
    piece.style.setProperty("--y", `${(Math.random() - .75) * 270}px`);
    piece.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    piece.style.animationDelay = `${Math.random() * .12}s`;
    confettiLayer.appendChild(piece);
    window.setTimeout(() => piece.remove(), 1250);
  }
}

function burstOnGoal(goalId, big = false, mode = "landing") {
  const card = $(`.goal-card[data-goal="${goalId}"]`);
  const scene = card ? $(".stairs-scene", card) : null;
  const climber = card ? $(".climber", card) : null;
  if (!scene || !climber) return;

  const sceneRect = scene.getBoundingClientRect();
  const climberRect = climber.getBoundingClientRect();
  const originX = climberRect.left - sceneRect.left + climberRect.width / 2;
  const originY = climberRect.top - sceneRect.top + climberRect.height / 2;
  const particleCount = mode === "launch" ? (big ? 12 : 8) : (big ? 34 : 18);

  if (big && mode === "landing") {
    const ring = document.createElement("span");
    ring.className = "level-ring";
    ring.style.left = `${originX}px`;
    ring.style.top = `${originY}px`;
    scene.appendChild(ring);
    window.setTimeout(() => ring.remove(), 950);
  }

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("span");
    particle.className = `step-particle ${big ? "big" : ""} ${mode === "launch" ? "launch" : ""}`;
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    const distance = mode === "launch" ? 38 : (big ? 105 : 62);
    particle.style.setProperty("--x", `${(Math.random() - .5) * distance}px`);
    particle.style.setProperty("--y", `${(Math.random() - .75) * distance}px`);
    particle.style.setProperty("--s", `${big ? 5 + Math.random() * 5 : 3 + Math.random() * 4}px`);
    particle.style.animationDelay = `${Math.random() * .1}s`;
    scene.appendChild(particle);
    window.setTimeout(() => particle.remove(), mode === "launch" ? 650 : (big ? 1150 : 900));
  }
}

function animateGoalStep(goalId, big = false) {
  const card = $(`.goal-card[data-goal="${goalId}"]`);
  const climber = card ? $(".climber", card) : null;
  if (!climber) return;
  const targetPos = climber.dataset.targetPos;
  const stairs = $$(".stair", card);
  const stepX = stairs.length > 1 ? stairs[1].offsetLeft - stairs[0].offsetLeft : 32;
  const stepY = stairs.length > 1 ? stairs[1].offsetTop - stairs[0].offsetTop : -17;
  const duration = big ? 1120 : 1050;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      burstOnGoal(goalId, false, "launch");
      climber.classList.remove("bounce", "step-pop", "level-pop");
      climber.classList.add(big ? "level-pop" : "step-pop");

      // Karakter her hedefte aynı gerçek basamak mesafesini kullanır.
      // Ön ayak uzanır, ağırlık aktarılır ve arka ayak yanına gelir;
      // karakter tek parça hâlinde zıplamaz.
      if (typeof climber.animate === "function") {
        const animatePart = (selector, frames) => {
          const part = $(selector, climber);
          if (!part || typeof part.animate !== "function") return;
          part.animate(frames, {
            duration,
            easing: "cubic-bezier(.32,.03,.2,1)",
          });
        };

        animatePart(".standing-character", [
          { offset: 0, transform: "rotate(0deg)" },
          { offset: .18, transform: "rotate(1deg)" },
          { offset: .42, transform: "rotate(4deg)" },
          { offset: .68, transform: "rotate(2.5deg)" },
          { offset: .88, transform: "rotate(-.7deg)" },
          { offset: 1, transform: "rotate(0deg)" },
        ]);
        animatePart(".standing-front-leg", [
          { offset: 0, transform: "rotate(0deg)" },
          { offset: .16, transform: "rotate(0deg)" },
          { offset: .4, transform: "rotate(-22deg)" },
          { offset: .62, transform: "rotate(-10deg)" },
          { offset: .8, transform: "rotate(4deg)" },
          { offset: 1, transform: "rotate(0deg)" },
        ]);
        animatePart(".standing-back-leg", [
          { offset: 0, transform: "rotate(0deg)" },
          { offset: .38, transform: "rotate(7deg)" },
          { offset: .62, transform: "rotate(13deg)" },
          { offset: .82, transform: "rotate(-15deg)" },
          { offset: 1, transform: "rotate(0deg)" },
        ]);
        animatePart(".standing-front-arm-group", [
          { offset: 0, transform: "rotate(0deg)" },
          { offset: .4, transform: "rotate(10deg)" },
          { offset: .78, transform: "rotate(-8deg)" },
          { offset: 1, transform: "rotate(0deg)" },
        ]);
        animatePart(".standing-back-arm-group", [
          { offset: 0, transform: "rotate(0deg)" },
          { offset: .4, transform: "rotate(-9deg)" },
          { offset: .78, transform: "rotate(8deg)" },
          { offset: 1, transform: "rotate(0deg)" },
        ]);

        const motion = climber.animate([
          { offset: 0, transform: "translate(0, 0) rotate(0deg) scale(1)" },
          { offset: .16, transform: "translate(0, 1px) rotate(.5deg) scale(1,.99)" },
          {
            offset: .4,
            transform: `translate(${stepX * .34}px, ${stepY * .18 - (big ? 4 : 2)}px) rotate(2deg) scale(1)`,
          },
          {
            offset: .64,
            transform: `translate(${stepX * .65}px, ${stepY * .64 - 1}px) rotate(1.4deg) scale(1.01)`,
          },
          {
            offset: .84,
            transform: `translate(${stepX * .9}px, ${stepY * .94}px) rotate(.4deg) scale(1)`,
          },
          {
            offset: .94,
            transform: `translate(${stepX}px, ${stepY - 1}px) rotate(-.3deg) scale(1,.995)`,
          },
          { offset: 1, transform: `translate(${stepX}px, ${stepY}px) rotate(0deg) scale(1)` },
        ], {
          duration,
          easing: "cubic-bezier(.32,.03,.2,1)",
          fill: "forwards",
        });

        motion.finished.then(() => {
          climber.style.setProperty("--pos", targetPos);
          motion.cancel();
          climber.classList.remove("step-pop", "level-pop");
        }).catch(() => {});
      } else {
        climber.style.setProperty("--pos", targetPos);
        climber.classList.remove("step-pop", "level-pop");
      }
      window.setTimeout(() => burstOnGoal(goalId, big, "landing"), big ? 760 : 700);
    });
  });
}

function focusGoalInCarousel(goalId, options = {}) {
  const goalIndex = state.goals.indexOf(goalId);
  if (goalIndex < 0) return;
  const previousIndex = state.carouselIndex;
  state.carouselIndex = goalIndex;
  if (options.scroll !== false) {
    $(".goals-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.requestAnimationFrame(() => {
    const cards = $$(".goal-card", goalCarousel);
    const cardWidth = cards[0]?.offsetWidth || 0;
    if (cardWidth) {
      goalCarousel.scrollTo({
        left: goalIndex * (cardWidth + 12),
        // Tamamlanan hedef önce görünür olsun; animasyon kart ekran dışındayken başlamasın.
        behavior: options.animate ? "auto" : "smooth",
      });
    }
    const focusedCard = cards[goalIndex];
    if (focusedCard) {
      focusedCard.classList.remove("goal-focused");
      void focusedCard.offsetWidth;
      focusedCard.classList.add("goal-focused");
      window.setTimeout(() => focusedCard.classList.remove("goal-focused"), 1200);
    }
    if (options.animate) {
      const delay = previousIndex === goalIndex ? 50 : 90;
      window.setTimeout(() => animateGoalStep(goalId, Boolean(options.big)), delay);
    }
  });
}

function openMissFlow(task) {
  if (!task) return;
  const goalId = task.goalId || task.id;
  const goal = goalTemplates[goalId];
  const existingOutcome = getTodayOutcome(goalId);

  state.activeTask = task;
  state.checkinGoal = goalId;
  state.selectedMissReason = null;
  $("#checkinTitle").textContent = goal.title;
  $("#missGoalCopy").textContent = existingOutcome?.status === "complete"
    ? "Bugünkü kaydı “olmadı” olarak değiştirebilirsin. Basamak ve analiz otomatik güncellenir."
    : "Basamak kaybetmeyeceksin. İstersen bugün seni neyin zorladığını seç.";
  $("#missNote").value = "";
  $("#recoveryPreview").textContent = getRecoveryCopy(goal);
  $$("#missReasons button").forEach((button) => button.classList.remove("selected"));
  openSheet(checkinSheet);
}

function openResizeSuggestion(goalId) {
  const goal = goalTemplates[goalId];
  if (!goal) return;
  const tracking = ensureGoalTracking(goalId);
  const recommendedAmount = getScaledAmount(goal, .6);
  state.resizeSuggestionGoalId = goalId;
  tracking.lastResizeSuggestion = toDateKey();
  saveTrackingStore();
  $("#resizeTitle").textContent = `${goal.title} hedefini hafifletelim mi?`;
  $("#currentTarget").textContent = `${formatAmount(goal.amount || 1)} ${goal.unit || "kez"}`;
  $("#recommendedTarget").textContent = (Number(goal.amount) || 1) <= 1
    ? "En küçük uygulanabilir sürüm"
    : `${formatAmount(recommendedAmount)} ${goal.unit || "kez"}`;
  openSheet($("#resizeSheet"));
}

function missTodayStep(task) {
  if (!task) return;
  const goalId = task.goalId || task.id;
  const goal = goalTemplates[goalId];
  if (!goal) return;
  const previousOutcome = getTodayOutcome(goalId);

  const reason = state.selectedMissReason || "unspecified";
  const isPlannedRest = reason === "planned";
  const status = isPlannedRest ? "rest" : "missed";
  const note = $("#missNote").value.trim();
  const tracking = ensureGoalTracking(goalId);

  recordGoalOutcome(goalId, {
    status,
    reason,
    note,
    recovery: false,
  });

  tracking.progress = syncGoalProgressFromHistory(goalId);
  tracking.recovery = isPlannedRest ? null : {
    date: shiftDateKey(toDateKey(), 1),
    amount: getScaledAmount(goal, .4),
    unit: goal.unit || "kez",
    copy: getRecoveryCopy(goal),
  };
  goal.trend = isPlannedRest
    ? "Planlı dinlenme; basamağın ve ritmin korunuyor"
    : "Bugün dinleniyorsun; yarın daha küçük bir adımla döneceksin";
  persistCustomGoal(goalId);
  saveTrackingStore();

  closeSheets();
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  focusGoalInCarousel(goalId);
  if (navigator.vibrate) navigator.vibrate(20);

  const misses = getConsecutiveMisses(goalId);
  if (isPlannedRest) {
    showToast(previousOutcome ? "Bugünün kaydı güncellendi." : "Planlı dinlenme kaydedildi.", "Karakterin basamakta dinleniyor; devamlılık yüzden etkilenmedi.");
  } else {
    showToast(previousOutcome ? "Bugün olmadı olarak güncellendi." : "Basamağın yerinde.", `${getRecoveryCopy(goal)} ile yarın yeniden başlayabilirsin.`);
  }

  if (!isPlannedRest && misses >= 3 && tracking.lastResizeSuggestion !== toDateKey()) {
    window.setTimeout(() => openResizeSuggestion(goalId), 450);
  }
}

function applyGoalResize(goalId) {
  const goal = goalTemplates[goalId];
  if (!goal) return;
  const tracking = ensureGoalTracking(goalId);
  const currentAmount = Number(goal.amount) || 1;
  const recommendedAmount = getScaledAmount(goal, .6);

  if (currentAmount <= 1) {
    goal.rule = `${goal.title} için yalnızca en küçük başlangıç adımını yap`;
    goal.subtitle = `En küçük sürüm · ${goal.frequency || "Her gün"}`;
  } else {
    goal.amount = recommendedAmount;
    goal.subtitle = `${formatAmount(recommendedAmount)} ${goal.unit} · ${goal.frequency || "Her gün"}`;
    goal.rule = `${formatAmount(recommendedAmount)} ${goal.unit} tamamla`;
  }

  tracking.targetOverride = {
    amount: goal.amount || 1,
    unit: goal.unit || "kez",
    frequency: goal.frequency || "Her gün",
    targetSteps: getGoalTargetSteps(goal),
    subtitle: goal.subtitle,
    rule: goal.rule,
  };
  tracking.recovery = {
    date: shiftDateKey(toDateKey(), 1),
    amount: getScaledAmount(goal, .4),
    unit: goal.unit || "kez",
    copy: getRecoveryCopy(goal),
  };
  goal.trend = "Hedef küçüldü; basamağın ve tüm geçmişin korundu";
  const task = ensureGoalTask(goalId);
  task.title = buildTaskTitle(goal);
  task.baseMeta = buildTaskMeta(goal);
  persistCustomGoal(goalId);
  saveTrackingStore();
  state.resizeSuggestionGoalId = null;
  closeSheets();
  renderTasks();
  renderGoals();
  renderGoalLibrary();
  focusGoalInCarousel(goalId);
  showToast("Hedef sana göre ayarlandı.", "İlerlemen silinmedi; yalnızca yarının adımı daha ulaşılabilir oldu.");
}

function completeTodayStep(task, sourceElement) {
  if (!task) return;
  const goalId = task.goalId || (goalTemplates[task.id] ? task.id : null);
  const goal = goalTemplates[goalId];
  const existingOutcome = goalId ? getTodayOutcome(goalId) : null;

  if (existingOutcome?.status === "complete") {
    if (goalId) focusGoalInCarousel(goalId);
    showToast(
      "Bu basamak bugün çıktı.",
      "İstersen hemen altındaki “Bugün olmadı” düğmesiyle kaydı değiştirebilirsin.",
    );
    return;
  }

  const activeRecovery = getActiveRecovery(goalId);
  task.done = true;
  task.meta = `${task.baseMeta || buildTaskMeta(goal)} · Tamamlandı`;

  let nextProgress = goal?.progress || 0;
  let leveledUp = false;
  if (goal) {
    const previousProgress = goal.progress;
    recordGoalOutcome(goalId, {
      status: "complete",
      reason: null,
      note: "",
      recovery: Boolean(activeRecovery),
    });
    const tracking = ensureGoalTracking(goalId);
    nextProgress = syncGoalProgressFromHistory(goalId);
    tracking.progress = nextProgress;
    tracking.recovery = null;
    leveledUp = nextProgress > previousProgress && isMilestoneStep(nextProgress);
    state.stepAnimation = { goalId, fromProgress: previousProgress, toProgress: nextProgress, big: leveledUp };
    goal.trend = leveledUp
      ? `${nextProgress}. basamakta karakter güçlendi`
      : activeRecovery
        ? "Küçük geri dönüş adımıyla yeniden yükseldin"
        : "Bugünün adımıyla 1 basamak yükseldin";
    persistCustomGoal(goalId);
    saveTrackingStore();
    if (leveledUp) {
      state.milestoneGoalId = goalId;
      window.clearTimeout(milestoneTimer);
      milestoneTimer = window.setTimeout(() => {
        if (state.milestoneGoalId === goalId) {
          state.milestoneGoalId = null;
          renderGoals();
        }
      }, 2400);
    }
  }

  renderTasks();
  renderGoals();
  renderGoalLibrary();
  const refreshedTask = sourceElement?.dataset?.task
    ? $$(".task").find((button) => button.dataset.task === sourceElement.dataset.task)
    : null;
  if (refreshedTask) celebrate(refreshedTask);
  if (navigator.vibrate) navigator.vibrate(leveledUp ? [30, 35, 45] : 35);
  if (goalId) {
    focusGoalInCarousel(goalId, { animate: true, big: leveledUp });
    window.setTimeout(() => {
      if (state.stepAnimation?.goalId === goalId) {
        state.stepAnimation = null;
        renderGoals();
      }
    }, 1400);
  }

  if (leveledUp) {
    showToast("Karakter güçlendi!", `${nextProgress}. basamak açıldı; ${getCharacterStage(nextProgress).title} seviyesine çıktın.`);
  } else if (activeRecovery) {
    showToast("Yeniden başladın!", `Küçük geri dönüş adımı tamamlandı: +1 basamak, +${task.xp} XP.`);
  } else {
    showToast("Basamak çıktı!", `Bugünün adımı tamamlandı: +1 basamak, +${task.xp} XP.`);
  }
}

function openJournal(goalId) {
  state.activeGoal = goalId;
  $("#journalTitle").textContent = goalTemplates[goalId].title;
  $("#journalNote").value = window.localStorage.getItem(`note-${goalId}`) || "";
  openSheet(journalSheet);
}

function openGoalDetail(goalId) {
  const goal = goalTemplates[goalId];
  const stage = getCharacterStage(goal.progress);
  const weeklyContinuity = getContinuity(goalId, 7);
  const monthlyContinuity = getContinuity(goalId, 30);
  const weekView = getWeekView(goalId);
  const targetSteps = getGoalTargetSteps(goal);
  state.activeGoal = goalId;
  $("#goalDetailSheet").style.setProperty("--accent", goal.accent);
  $("#goalDetailTitle").textContent = goal.title;
  $("#goalDetailSubtitle").textContent = goal.subtitle;
  $("#goalDetailProgress").textContent = goal.progress;
  $("#goalDetailTarget").textContent = `/${targetSteps}`;
  $("#goalDetailBar").style.width = `${getGoalProgressPercent(goal)}%`;
  $("#goalDetailRule").textContent = goal.rule;
  $("#detailGroupSelect").innerHTML = groupOptionsHtml(getGoalGroupId(goal) || "");
  $("#goalDetailStage").innerHTML = `<span>${stage.badge}</span><div><b>${stage.title}</b><small>${stage.copy}</small></div>`;
  $("#detailContinuity").textContent = `7 gün ${weeklyContinuity === null ? "—" : `%${weeklyContinuity}`} · 30 gün ${monthlyContinuity === null ? "—" : `%${monthlyContinuity}`}`;
  $("#detailWeekDays").innerHTML = weekView.map((day) => `<span class="${day.status}"><i>${day.day}</i><b>${day.symbol}</b></span>`).join("");
  openSheet($("#goalDetailSheet"));
}

function showPage(pageName) {
  const showGoals = pageName === "Hedefler";
  const showAnalysis = pageName === "Analiz";
  const showSocial = pageName === "Yoldaşlar";
  $$(".today-view").forEach((element) => { element.hidden = showGoals || showAnalysis || showSocial; });
  $("#goalsPage").hidden = !showGoals;
  $("#analysisPage").hidden = !showAnalysis;
  $("#socialPage").hidden = !showSocial;
  if (showGoals) renderGoalLibrary();
  if (showAnalysis) renderAnalysis();
  if (showSocial) renderSocial();
  window.scrollTo(0, 0);
}

$("#analysisRanges").addEventListener("click", (event) => {
  const button = event.target.closest("[data-analysis-range]");
  if (!button) return;
  state.analysisRange = Number(button.dataset.analysisRange) || 30;
  renderAnalysis();
});

$("#analysisPrevMonth").addEventListener("click", () => {
  const date = dateFromKey(state.analysisMonth);
  date.setMonth(date.getMonth() - 1);
  state.analysisMonth = `${toDateKey(date).slice(0, 7)}-01`;
  renderAnalysisCalendar();
});

$("#analysisNextMonth").addEventListener("click", () => {
  const date = dateFromKey(state.analysisMonth);
  date.setMonth(date.getMonth() + 1);
  const candidate = `${toDateKey(date).slice(0, 7)}-01`;
  const currentMonth = `${toDateKey().slice(0, 7)}-01`;
  state.analysisMonth = candidate > currentMonth ? currentMonth : candidate;
  renderAnalysisCalendar();
});

$("#analysisGoalFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-analysis-goal]");
  if (!button) return;
  state.analysisGoal = button.dataset.analysisGoal;
  renderAnalysis();
});

$("#analysisCalendarGrid").addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-calendar-date]");
  if (!dayButton) return;
  openCalendarEditor(dayButton.dataset.calendarDate);
});

$("#calendarEditList").addEventListener("click", (event) => {
  const startButton = event.target.closest("[data-calendar-start]");
  const button = event.target.closest("[data-calendar-status]");
  const row = event.target.closest("[data-calendar-goal]");
  if (!row) return;
  if (startButton) {
    setGoalStartDate(startButton.dataset.calendarStart || row.dataset.calendarGoal);
    return;
  }
  if (!button) return;
  setCalendarGoalOutcome(row.dataset.calendarGoal, button.dataset.calendarStatus);
});

taskList.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-group]");
  if (!toggleButton) return;
  toggleGroupCollapse(toggleButton.dataset.toggleGroup);
});

$("#goalGroupToolbar").addEventListener("click", (event) => {
  const button = event.target.closest("[data-goal-group]");
  if (!button) return;
  state.groupFilter = button.dataset.goalGroup;
  renderGroupControls();
  renderGoalLibrary();
});

$("#analysisGroupToolbar").addEventListener("click", (event) => {
  const button = event.target.closest("[data-analysis-group]");
  if (!button) return;
  state.analysisGroup = button.dataset.analysisGroup;
  state.analysisGoal = "all";
  renderAnalysis();
});

function saveEditableGroupRow(row) {
  if (!row) return null;
  const groupId = row.dataset.editGroup;
  const group = updateGroup(groupId, {
    icon: $(".group-row-icon", row)?.value || "●",
    name: $(".group-row-name", row)?.value || "",
  });
  if (!group) {
    showToast("Grup adı boş kalmasın.", "Mevcut grup ismini değiştirip tekrar kaydet.");
    $(".group-row-name", row)?.focus();
    return null;
  }
  showToast("Grup ismi güncellendi.", `${group.name} artık uygulamanın her yerinde bu isimle görünecek.`);
  return group;
}

$("#groupManager").addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-group]");
  const createButton = event.target.closest("[data-create-group]");
  const saveButton = event.target.closest("[data-save-group]");
  const deleteButton = event.target.closest("[data-delete-group]");
  if (toggleButton) {
    toggleGroupCollapse(toggleButton.dataset.toggleGroup);
    return;
  }
  if (createButton) {
    const nameInput = $("#newGroupName");
    const iconInput = $("#newGroupIcon");
    const group = createCustomGroup(nameInput?.value || "", iconInput?.value || "●");
    if (!group) {
      showToast("Grup adı lazım.", "Örn. Sağlık, Supplement, İş, Uyku gibi bir isim yaz.");
      nameInput?.focus();
      return;
    }
    renderGroupControls();
    renderGoalLibrary();
    showToast("Grup oluşturuldu.", `${group.name} artık merdivenlere atanabilir.`);
    return;
  }
  if (saveButton) {
    const row = saveButton.closest("[data-edit-group]");
    const group = updateGroup(saveButton.dataset.saveGroup, {
      icon: $(".group-row-icon", row)?.value || "●",
      name: $(".group-row-name", row)?.value || "",
    });
    if (!group) {
      showToast("Grup adı boş kalmasın.", "Gruba kısa bir isim yazıp tekrar kaydet.");
      return;
    }
    showToast("Grup güncellendi.", `${group.name} adıyla kaydedildi.`);
    return;
  }
  if (deleteButton) deleteGroupV2(deleteButton.dataset.deleteGroup);
});

$("#groupManager").addEventListener("change", (event) => {
  const select = event.target.closest("[data-assign-goal]");
  if (!select) return;
  const goalId = select.dataset.assignGoal;
  const currentGroupId = getGoalGroupId(goalTemplates[goalId]) || "";
  const groupId = handleGroupSelect(select, currentGroupId);
  setGoalGroup(goalId, groupId);
  showToast("Merdiven grubu güncellendi.", `${goalTemplates[goalId]?.title || "Merdiven"} artık ${getGroupLabel(groupId)} içinde.`);
});

$("#groupManager").addEventListener("keydown", (event) => {
  const input = event.target.closest(".group-row-icon, .group-row-name");
  if (!input || event.key !== "Enter") return;
  event.preventDefault();
  saveEditableGroupRow(input.closest("[data-edit-group]"));
});

$("#openInviteSheet").addEventListener("click", openInvitePanel);
$("#welcomeInviteButton").addEventListener("click", openInvitePanel);

$("#socialPage").addEventListener("click", (event) => {
  const inviteButton = event.target.closest("[data-open-invite]");
  const acceptButton = event.target.closest("[data-accept-invite]");
  const declineButton = event.target.closest("[data-decline-invite]");
  const friendButton = event.target.closest("[data-open-friend]");
  if (inviteButton) openInvitePanel();
  if (acceptButton) acceptInvite(acceptButton.dataset.acceptInvite);
  if (declineButton) declineInvite(declineButton.dataset.declineInvite);
  if (friendButton) renderFriendSheet(friendButton.dataset.openFriend);
});

$("#shareScopeOptions").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-scope]");
  if (!button) return;
  socialState.shareScope = button.dataset.scope;
  saveSocialState();
  $$("#shareScopeOptions button").forEach((item) => item.classList.toggle("selected", item === button));
  if (!socialBackendSession) return;
  try {
    const payload = await socialApi("/api/settings/share-scope", { method: "PATCH", body: { scope: button.dataset.scope } });
    applySocialPayload(payload.social);
  } catch (error) {
    showToast("Paylaşım seçimi kaydedilemedi.", error.message || "Bağlantı geldiğinde yeniden deneyebilirsin.");
  }
});

async function copyInviteLink() {
  if (!(await ensureInviteReady())) {
    showToast("Davet bağlantısı henüz hazır değil.", "İnternet bağlantısını kontrol edip birkaç saniye sonra yeniden dene.");
    return;
  }
  const link = getInviteLink();
  $("#inviteLinkValue").value = link;
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    $("#inviteLinkValue").focus();
    $("#inviteLinkValue").select();
    document.execCommand?.("copy");
  }
  showToast("Davet bağlantısı kopyalandı.", "Arkadaşın bağlantıyı açtığında sana yoldaşlık isteği gönderebilir.");
}

$("#copyInviteLink").addEventListener("click", copyInviteLink);
$("#shareInviteLink").addEventListener("click", async () => {
  if (!(await ensureInviteReady())) {
    showToast("Davet bağlantısı henüz hazır değil.", "İnternet bağlantısını kontrol edip birkaç saniye sonra yeniden dene.");
    return;
  }
  const link = getInviteLink();
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Dünkü Sen'de yoldaşım ol",
        text: "Kendi hızımızda, aynı merdivende ilerleyelim.",
        url: link,
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  await copyInviteLink();
});

$("#regenerateInviteLink").addEventListener("click", async () => {
  if (!(await ensureInviteReady())) {
    showToast("Yeni bağlantı üretilemedi.", "Sunucu bağlantısı gelince yeniden deneyebilirsin.");
    return;
  }
  if (socialBackendSession) {
    try {
      const payload = await socialApi("/api/invites/regenerate", { method: "POST" });
      applySocialPayload(payload.social);
      $("#inviteLinkValue").value = getInviteLink();
      showToast("Yeni bağlantı hazır.", "Önceki davet bağlantısı artık kullanılamayacak.");
    } catch (error) {
      showToast("Yeni bağlantı üretilemedi.", error.message || "Bağlantıyı kontrol edip yeniden dene.");
    }
    return;
  }
  socialState.inviteCode = makeInviteCode();
  saveSocialState();
  $("#inviteLinkValue").value = getInviteLink();
  showToast("Yeni bağlantı hazır.", "Önceki davet bağlantısı artık kullanılmayacak.");
});

$("#friendGoalList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-start-shared]");
  if (!button) return;
  startSharedJourney(button.dataset.startShared, button.dataset.sharedGoal);
});

$$("[data-next]").forEach((button) => button.addEventListener("click", nextOnboarding));
$$("[data-back]").forEach((button) => button.addEventListener("click", () => {
  state.onboardingStep = Math.max(0, state.onboardingStep - 1);
  updateOnboarding();
}));

$("#genderChoices").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  state.gender = button.dataset.gender || "unspecified";
  window.localStorage.setItem("dunku-sen-gender", state.gender);
  $$("#genderChoices button").forEach((item) => item.classList.toggle("selected", item === button));
  renderGoals();
  scheduleSocialProfileSync();
});

$("#areaGrid").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) button.classList.toggle("selected");
});

$("#starterGoals").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) button.classList.toggle("selected");
});

$("#finishOnboarding").addEventListener("click", () => {
  const selected = $$("#starterGoals > button.selected").map((button) => button.dataset.goal);
  if (selected.length) state.goals = selected;
  const name = completeOnboardingProfile($("#nameInput").value);
  onboarding.classList.remove("show");
  window.scrollTo(0, 0);
  renderGoals();
  renderTasks();
  renderGoalLibrary();
  renderAnalysis();
  void initializeSocialBackend();
  showToast("İlk yolculuğun başladı.", "Bugün, dünkü seni geçeceğin gün.");
});

$("#previewDemo").addEventListener("click", () => {
  onboarding.classList.remove("show");
  window.scrollTo(0, 0);
});
$("#resetDemo").addEventListener("click", () => {
  state.onboardingStep = 0;
  updateOnboarding();
  onboarding.classList.add("show");
});

goalCarousel.addEventListener("scroll", () => {
  const cards = $$(".goal-card", goalCarousel);
  const current = Math.min(cards.length - 1, Math.max(0, Math.round(goalCarousel.scrollLeft / (cards[0]?.offsetWidth + 12 || 1))));
  state.carouselIndex = current;
  $("#carouselIndex").textContent = cards.length ? current + 1 : 0;
  $$("#carouselDots span").forEach((dot, index) => dot.classList.toggle("active", index === current));
}, { passive: true });

function moveGoalCarousel(direction) {
  const cards = $$(".goal-card", goalCarousel);
  if (!cards.length) return;
  state.carouselIndex = (state.carouselIndex + direction + cards.length) % cards.length;
  $("#carouselIndex").textContent = state.carouselIndex + 1;
  $$("#carouselDots span").forEach((dot, index) => dot.classList.toggle("active", index === state.carouselIndex));
  goalCarousel.scrollTo({ left: state.carouselIndex * (cards[0].offsetWidth + 12), behavior: "smooth" });
}

$("#previousGoal").addEventListener("click", () => moveGoalCarousel(-1));
$("#nextGoal").addEventListener("click", () => moveGoalCarousel(1));

goalCarousel.addEventListener("click", (event) => {
  const inviteButton = event.target.closest("[data-invite-goal]");
  if (inviteButton) {
    openInvitePanel(inviteButton.dataset.inviteGoal);
    return;
  }
  const journalButton = event.target.closest("[data-journal]");
  if (!journalButton) return;
  openJournal(journalButton.dataset.journal);
});

taskList.addEventListener("click", (event) => {
  const missButton = event.target.closest("[data-task-miss]");
  const completeButton = event.target.closest("[data-task-complete]");
  const taskId = missButton?.dataset.taskMiss || completeButton?.dataset.taskComplete;
  if (!taskId) return;
  state.activeTask = getTodayTasks().find((task) => task.id === taskId);
  state.checkinGoal = state.activeTask?.goalId || (goalTemplates[state.activeTask?.id] ? state.activeTask.id : null);
  if (missButton) {
    openMissFlow(state.activeTask);
  } else {
    completeTodayStep(state.activeTask, completeButton);
  }
});

$("#missReasons").addEventListener("click", (event) => {
  const button = event.target.closest("[data-miss-reason]");
  if (!button) return;
  state.selectedMissReason = button.dataset.missReason;
  $$("#missReasons button").forEach((item) => item.classList.toggle("selected", item === button));
  const goal = goalTemplates[state.checkinGoal];
  $("#recoveryPreview").textContent = state.selectedMissReason === "planned"
    ? "Planlı dinlenme; yarın normal hedefin devam edecek"
    : getRecoveryCopy(goal);
});

$("#confirmMiss").addEventListener("click", () => missTodayStep(state.activeTask));
$("#acceptResize").addEventListener("click", () => applyGoalResize(state.resizeSuggestionGoalId));

$("#saveNote").addEventListener("click", () => {
  if (state.activeGoal) window.localStorage.setItem(`note-${state.activeGoal}`, $("#journalNote").value);
  closeSheets();
  showToast("Yol günlüğün güncellendi.", "Kendini fark etmek de bir basamaktır.");
});

$(".prompt-chips").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const textarea = $("#journalNote");
  textarea.value = `${textarea.value}${textarea.value ? "\n\n" : ""}${button.textContent}\n`;
  textarea.focus();
});

sheetBackdrop.addEventListener("click", closeSheets);
$$(".sheet-close").forEach((button) => button.addEventListener("click", closeSheets));

function hydrateMoodSelection() {
  const todayMood = Number(moodTracking[toDateKey()]) || 0;
  $$(".moods button").forEach((button) => button.classList.toggle("selected", Number(button.dataset.mood) === todayMood));
}

$(".moods").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  moodTracking[toDateKey()] = Number(button.dataset.mood) || 3;
  saveMoodStore();
  $$(".moods button").forEach((item) => item.classList.toggle("selected", item === button));
  if (!$("#analysisPage").hidden) renderAnalysis();
  showToast("Ruh hâlin kaydedildi.", "Kendini fark etmek de bir ilerleme.");
});

$("#addGoal").addEventListener("click", openGoalCreator);
$("#pageAddGoal").addEventListener("click", openGoalCreator);
$("#wideAddGoal").addEventListener("click", openGoalCreator);
$(".custom-goal-link").addEventListener("click", openGoalCreator);

$("#closeGoalCreator").addEventListener("click", closeGoalCreator);
$("#backToCatalog").addEventListener("click", () => {
  customizeView.hidden = true;
  catalogView.hidden = false;
  goalCreator.scrollTop = 0;
});

$("#catalogCategories").addEventListener("click", (event) => {
  const button = event.target.closest("[data-catalog-category]");
  if (!button) return;
  state.catalogCategory = button.dataset.catalogCategory;
  renderCatalogCategories();
  renderGoalCatalog();
});

$("#goalSearch").addEventListener("input", renderGoalCatalog);
$("#clearGoalSearch").addEventListener("click", () => {
  $("#goalSearch").value = "";
  renderGoalCatalog();
  $("#goalSearch").focus();
});

$("#goalCatalogList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-catalog-goal]");
  if (!button) return;
  const template = window.GOAL_CATALOG.find((goal) => goal.id === button.dataset.catalogGoal);
  if (template) openCustomizeGoal(template);
});

$("#blankGoal").addEventListener("click", () => openCustomizeGoal({
  id: "blank",
  title: "",
  category: "custom",
  categoryLabel: "Kişisel",
  icon: "✦",
  accent: "102,229,255",
  amount: 1,
  unit: "kez",
  frequency: "Her gün",
  targetSteps: 100,
}));

$("#themeChoices").addEventListener("click", (event) => {
  const button = event.target.closest("[data-accent]");
  if (!button) return;
  state.selectedAccent = button.dataset.accent;
  $$("#themeChoices button").forEach((item) => item.classList.toggle("selected", item === button));
});

$("#customAmount").addEventListener("input", updateStepRulePreview);
$("#customUnit").addEventListener("change", updateStepRulePreview);
$("#customTargetSteps").addEventListener("input", updateStepRulePreview);
$("#customGroup").addEventListener("change", () => handleGroupSelect($("#customGroup"), state.selectedCatalogGoal?.groupId || ""));

$("#createCustomGoal").addEventListener("click", () => {
  const title = $("#customGoalName").value.trim();
  if (!title) {
    $("#customGoalName").focus();
    showToast("Hedefine bir isim ver.", "Bu yolculuğu ne için başlattığını yaz.");
    return;
  }

  const amount = Math.max(.1, Number($("#customAmount").value) || 1);
  const unit = $("#customUnit").value;
  const frequency = $("#customFrequency").value;
  const targetSteps = Math.max(1, Math.min(9999, Math.round(Number($("#customTargetSteps").value) || 100)));
  const source = state.selectedCatalogGoal || {};
  const selectedGroupId = handleGroupSelect($("#customGroup"), source.groupId || "");
  const id = `custom-${Date.now()}`;
  const goal = {
    id,
    title,
    subtitle: `${amount} ${unit} · ${frequency}`,
    progress: 0,
    targetSteps,
    accent: state.selectedAccent,
    trend: "Başlangıç noktan 0. basamakta hazır",
    category: source.category || "custom",
    groupId: selectedGroupId || null,
    icon: source.icon || "✦",
    rule: `${amount} ${unit} tamamla`,
    amount,
    unit,
    frequency,
    why: $("#customWhy").value.trim(),
  };

  const existingGoalId = state.goals.find((goalId) => getGoalSignature(goalTemplates[goalId]) === getGoalSignature(goal));
  if (existingGoalId) {
    state.carouselIndex = state.goals.indexOf(existingGoalId);
    closeGoalCreator();
    onboarding.classList.remove("show");
    showPage("Bugün");
    renderGoals();
    renderTasks();
    focusGoalInCarousel(existingGoalId);
    showToast("Bu merdiven zaten var.", `${title} hedefindeki mevcut yoluna yönlendirildin.`);
    return;
  }

  goalTemplates[id] = goal;
  state.goals.push(id);
  saveSelectedGoals();
  ensureGoalTracking(id).progress = goal.progress;
  saveTrackingStore();
  state.newGoalId = id;
  tasks.push({
    id,
    goalId: id,
    title,
    meta: `${amount} ${unit} · ${frequency}`,
    baseMeta: `${goalCategoryLabel(goal.category)} · ${amount} ${unit}`,
    xp: 15,
    done: false,
  });

  const savedGoals = JSON.parse(window.localStorage.getItem("dunku-sen-custom-goals") || "[]");
  savedGoals.push(goal);
  window.localStorage.setItem("dunku-sen-custom-goals", JSON.stringify(savedGoals));

  state.carouselIndex = state.goals.length - 1;
  renderGoals();
  renderGoalLibrary();
  renderTasks();
  closeGoalCreator();
  onboarding.classList.remove("show");
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.getAttribute("aria-label") === "Bugün"));
  showPage("Bugün");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const cards = $$(".goal-card", goalCarousel);
      const cardWidth = cards[0]?.offsetWidth || 0;
      goalCarousel.scrollTo({ left: state.carouselIndex * (cardWidth + 12), behavior: "smooth" });
      $(".goals-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  showToast("Merdivenin oluşturuldu!", `${title} için yeni yoluna kaydırıldın.`);
  scheduleSocialProfileSync();
});

$("#goalFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.goalFilter = button.dataset.filter;
  $$("#goalFilters button").forEach((item) => item.classList.toggle("active", item === button));
  renderGoalLibrary();
});

$("#goalLibrary").addEventListener("click", (event) => {
  const groupToggle = event.target.closest("[data-toggle-group]");
  const inviteButton = event.target.closest("[data-library-invite]");
  const journalButton = event.target.closest("[data-library-journal]");
  const detailButton = event.target.closest("[data-library-detail]");
  const deleteButton = event.target.closest("[data-library-delete]");
  if (groupToggle) {
    toggleGroupCollapse(groupToggle.dataset.toggleGroup);
    return;
  }
  if (inviteButton) openInvitePanel(inviteButton.dataset.libraryInvite);
  if (journalButton) openJournal(journalButton.dataset.libraryJournal);
  if (detailButton) openGoalDetail(detailButton.dataset.libraryDetail);
  if (deleteButton) deleteGoal(deleteButton.dataset.libraryDelete);
});

$("#detailJournal").addEventListener("click", () => {
  const goalId = state.activeGoal;
  closeSheets();
  window.setTimeout(() => openJournal(goalId), 180);
});

$("#detailDeleteGoal").addEventListener("click", () => deleteGoal(state.activeGoal));

$("#detailGroupSelect").addEventListener("change", () => {
  if (!state.activeGoal) return;
  const groupId = handleGroupSelect($("#detailGroupSelect"), getGoalGroupId(goalTemplates[state.activeGoal]) || "");
  setGoalGroup(state.activeGoal, groupId);
  $("#detailGroupSelect").innerHTML = groupOptionsHtml(getGoalGroupId(goalTemplates[state.activeGoal]) || "");
});

$("#detailCheckin").addEventListener("click", () => {
  const task = ensureGoalTask(state.activeGoal);
  if (!task) {
    closeSheets();
    showToast("Bugünün adımı henüz yok.", "Bu hedef için yeni bir günlük adım ekleyebilirsin.");
    return;
  }
  state.activeTask = task;
  state.checkinGoal = state.activeGoal;
  closeSheets();
  window.setTimeout(() => completeTodayStep(task), 120);
});

$$(".nav-item").forEach((button) => button.addEventListener("click", () => {
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
  const label = button.getAttribute("aria-label");
  if (label === "Bugün" || label === "Hedefler" || label === "Analiz" || label === "Yoldaşlar") {
    showPage(label);
  } else {
    showToast(`${label} ekranı`, "Bu bölüm sonraki prototipte açılacak.");
  }
}));

function updateDateLabel() {
  const formatter = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  $("#dateLabel").textContent = formatter.format(new Date()).toLocaleUpperCase("tr-TR");
}

function refreshDateContext({ announce = false } = {}) {
  const currentDateKey = toDateKey();
  updateDateLabel();
  if (currentDateKey === activeDateKey) return false;
  activeDateKey = currentDateKey;
  state.stepAnimation = null;
  state.milestoneGoalId = null;
  state.activeTask = null;
  state.checkinGoal = null;
  state.analysisMonth = `${currentDateKey.slice(0, 7)}-01`;
  closeSheets();
  hydrateGoalTracking();
  hydrateMoodSelection();
  renderGoals();
  renderTasks();
  renderGoalLibrary();
  renderAnalysis();
  renderSocial();
  scheduleSocialProfileSync();
  if (announce) showToast("Yeni gün başladı.", "Dünün kayıtları takvimde güvende. Bugünün basamakları hazır.");
  return true;
}

window.addEventListener?.("focus", () => refreshDateContext({ announce: true }));
document.addEventListener?.("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshDateContext({ announce: true });
});
window.setInterval?.(() => refreshDateContext(), 60 * 1000);

hydrateLocalProfile();
loadSavedCustomGoals();
applySavedGoalOverrides();
hydrateGoalTracking();
simplifyTodayLayout();
updateDateLabel();
hydrateMoodSelection();
$$("#genderChoices button").forEach((button) => button.classList.toggle("selected", button.dataset.gender === state.gender));
renderGoals();
renderTasks();
renderGoalLibrary();
renderAnalysis();
renderSocial();
updateOnboarding();
void initializeSocialBackend();

if ("serviceWorker" in navigator && window.location?.protocol !== "file:") {
  let refreshingForUpdate = false;
  navigator.serviceWorker.addEventListener?.("controllerchange", () => {
    if (refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
    .then((registration) => {
      const checkForUpdates = () => registration.update().catch(() => {});
      checkForUpdates();
      window.setInterval?.(checkForUpdates, 5 * 60 * 1000);
      document.addEventListener?.("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdates();
      });
    })
    .catch((error) => {
      console.warn("Çevrimdışı uygulama kabuğu kaydedilemedi:", error);
    });
}
