const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const APP_ROOT = __dirname;
const DATA_ROOT = process.env.DB_PATH
  ? path.dirname(path.resolve(process.env.DB_PATH))
  : path.resolve(process.env.DATA_DIR || path.join(APP_ROOT, "data"));
const DEFAULT_DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(DATA_ROOT, "social-db.json");
const MAX_BODY_BYTES = 256 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 180;
const SESSION_RATE_LIMIT = 20;

const STATIC_FILES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/app.js", "app.js"],
  ["/goal-catalog.js", "goal-catalog.js"],
  ["/manifest.webmanifest", "manifest.webmanifest"],
  ["/icon.svg", "icon.svg"],
  ["/sw.js", "sw.js"],
]);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function makeToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function makeInviteCode() {
  return `DS-${crypto.randomBytes(3).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function cleanText(value, fallback = "", max = 120) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return (text || fallback).slice(0, max);
}

function cleanGender(value) {
  return ["female", "male", "unspecified"].includes(value) ? value : "unspecified";
}

function cleanAccent(value, fallback = "102,229,255") {
  return /^\d{1,3},\d{1,3},\d{1,3}$/.test(String(value || "")) ? String(value) : fallback;
}

function slugify(value) {
  return cleanText(value, "yoldas", 30)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18) || "yoldas";
}

function cleanGoals(goals) {
  if (!Array.isArray(goals)) return [];
  return goals.slice(0, 300).map((goal) => ({
    id: cleanText(goal?.id, "", 90),
    title: cleanText(goal?.title, "Kişisel hedef", 90),
    subtitle: cleanText(goal?.subtitle, "", 120),
    progress: Math.max(1, Math.min(100, Number(goal?.progress) || 1)),
    accent: cleanAccent(goal?.accent),
    category: cleanText(goal?.category, "custom", 30),
    icon: cleanText(goal?.icon, "✦", 8),
    rule: cleanText(goal?.rule, "", 140),
    status: ["complete", "resting", "pending"].includes(goal?.status) ? goal.status : "pending",
  })).filter((goal) => goal.id);
}

function createSeedUser(id, profile) {
  return {
    id,
    token: null,
    system: true,
    name: profile.name,
    handle: profile.handle,
    initial: profile.name[0].toLocaleUpperCase("tr-TR"),
    gender: profile.gender,
    accent: profile.accent,
    inviteCode: makeInviteCode(),
    shareScope: "all",
    selectedGoalIds: profile.goals.map((goal) => goal.id),
    goals: cleanGoals(profile.goals),
    onlineOverride: profile.online,
    createdAt: nowIso(),
    lastSeen: nowIso(),
  };
}

function createEmptyDatabase() {
  const createdAt = nowIso();
  return {
    version: 2,
    createdAt,
    updatedAt: createdAt,
    users: {
      mert: createSeedUser("mert", {
        name: "Mert",
        handle: "@mert",
        gender: "male",
        accent: "102,229,255",
        online: true,
        goals: [
          { id: "walk", title: "Günlük yürüyüş", subtitle: "10.000 adım · Her gün", progress: 35, accent: "102,229,255", category: "health", icon: "⌁", rule: "10.000 adımı tamamla", status: "complete" },
          { id: "read", title: "Düzenli kitap oku", subtitle: "20 sayfa · Her gün", progress: 19, accent: "175,112,255", category: "learning", icon: "▤", rule: "20 sayfa kitap oku", status: "pending" },
        ],
      }),
      ece: createSeedUser("ece", {
        name: "Ece",
        handle: "@eceyolda",
        gender: "female",
        accent: "175,112,255",
        online: false,
        goals: [
          { id: "walk", title: "Günlük yürüyüş", subtitle: "10.000 adım · Her gün", progress: 27, accent: "102,229,255", category: "health", icon: "⌁", rule: "10.000 adımı tamamla", status: "resting" },
          { id: "language", title: "Yeni bir dil öğren", subtitle: "20 dakika · Haftada 5 gün", progress: 16, accent: "244,197,108", category: "learning", icon: "A", rule: "20 dakika odaklı çalışma yap", status: "pending" },
        ],
      }),
    },
    connections: [],
    journeys: [],
    activities: [],
  };
}

function createDatabase(dbPath) {
  let data;

  function ensureShape(candidate) {
    const fresh = createEmptyDatabase();
    const shaped = {
      ...fresh,
      ...(candidate || {}),
      version: 2,
      users: { ...fresh.users, ...(candidate?.users || {}) },
      connections: Array.isArray(candidate?.connections) ? candidate.connections : [],
      journeys: Array.isArray(candidate?.journeys) ? candidate.journeys : [],
      activities: Array.isArray(candidate?.activities) ? candidate.activities : [],
    };
    delete shaped.messages;
    return shaped;
  }

  try {
    data = ensureShape(JSON.parse(fs.readFileSync(dbPath, "utf8")));
  } catch {
    data = createEmptyDatabase();
  }

  function persist() {
    data.updatedAt = nowIso();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  function findUserByToken(token) {
    return Object.values(data.users).find((user) => user.token && crypto.timingSafeEqual(
      Buffer.from(user.token),
      Buffer.from(String(token || "").padEnd(user.token.length, "\0").slice(0, user.token.length)),
    ));
  }

  function userPair(connection, userId) {
    return connection.userA === userId ? connection.userB : connection.userA;
  }

  function findConnection(leftId, rightId) {
    return data.connections.find((connection) => (
      (connection.userA === leftId && connection.userB === rightId)
      || (connection.userA === rightId && connection.userB === leftId)
    ));
  }

  function acceptedFriendIds(userId) {
    return data.connections
      .filter((connection) => connection.status === "accepted" && (connection.userA === userId || connection.userB === userId))
      .map((connection) => userPair(connection, userId));
  }

  function addActivity({ type, actorId, participants, goalId = null, progress = null, createdAt = nowIso() }) {
    const visibleTo = [...new Set((participants || []).filter((id) => data.users[id]))];
    if (!visibleTo.length) return;
    data.activities.push({
      id: makeId("activity"),
      type,
      actorId,
      participants: visibleTo,
      goalId,
      progress,
      createdAt,
    });
    data.activities = data.activities
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(-1000);
  }

  function visibleGoals(user) {
    if (user.shareScope === "all") return user.goals || [];
    const selected = new Set(user.selectedGoalIds || []);
    return (user.goals || []).filter((goal) => selected.has(goal.id));
  }

  function todayStatus(goals) {
    if (goals.some((goal) => goal.status === "complete")) return "complete";
    if (goals.some((goal) => goal.status === "resting")) return "resting";
    return "pending";
  }

  function publicProfile(user) {
    const goals = visibleGoals(user);
    const recentlyOnline = Date.now() - new Date(user.lastSeen || 0).getTime() < 45_000;
    return {
      id: user.id,
      name: user.name,
      handle: user.handle,
      initial: user.initial,
      gender: user.gender,
      accent: user.accent,
      online: typeof user.onlineOverride === "boolean" ? user.onlineOverride : recentlyOnline,
      todayStatus: todayStatus(goals),
      goals,
    };
  }

  function buildSocial(userId) {
    const user = data.users[userId];
    if (!user) throw new ApiError(404, "Kullanıcı bulunamadı.");

    const accepted = data.connections.filter((connection) => (
      connection.status === "accepted"
      && (connection.userA === userId || connection.userB === userId)
    ));
    const friendIds = accepted.map((connection) => userPair(connection, userId));
    const friends = friendIds.map((id) => data.users[id]).filter(Boolean).map(publicProfile);
    const pendingInvites = data.connections
      .filter((connection) => connection.status === "pending" && connection.recipientId === userId)
      .map((connection) => {
        const inviter = data.users[connection.inviterId];
        return inviter ? { ...publicProfile(inviter), id: connection.id, userId: inviter.id } : null;
      })
      .filter(Boolean);

    const sharedJourneys = data.journeys
      .filter((journey) => journey.participants.includes(userId))
      .map((journey) => ({
        id: journey.id,
        friendId: journey.participants.find((id) => id !== userId),
        goalId: journey.goalId,
        target: journey.target,
        createdAt: journey.createdAt,
      }))
      .filter((journey) => friendIds.includes(journey.friendId));

    const activities = data.activities
      .filter((activity) => activity.participants.includes(userId))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 30)
      .map((activity) => {
        const actor = data.users[activity.actorId];
        const friendId = activity.participants.find((id) => id !== userId);
        const friend = data.users[friendId];
        return {
          id: activity.id,
          type: activity.type,
          actorId: activity.actorId,
          actorName: actor?.name || "Bir yoldaş",
          actorInitial: actor?.initial || "Y",
          actorAccent: actor?.accent || "119,120,255",
          actorIsMe: activity.actorId === userId,
          friendId,
          friendName: friend?.name || actor?.name || "Yeni yoldaş",
          goalId: activity.goalId,
          progress: activity.progress,
          createdAt: activity.createdAt,
        };
      });

    return {
      inviteCode: user.inviteCode,
      shareScope: user.shareScope,
      friends,
      pendingInvites,
      sharedJourneys,
      activities,
      backend: {
        connected: true,
        profileId: user.id,
        syncedAt: nowIso(),
      },
    };
  }

  function seedDemoForUser(user) {
    const mertConnection = {
      id: makeId("connection"),
      userA: user.id,
      userB: "mert",
      inviterId: "mert",
      recipientId: user.id,
      status: "accepted",
      createdAt: nowIso(),
      acceptedAt: nowIso(),
    };
    const eceConnection = {
      id: makeId("connection"),
      userA: user.id,
      userB: "ece",
      inviterId: "ece",
      recipientId: user.id,
      status: "pending",
      createdAt: nowIso(),
    };
    data.connections.push(mertConnection, eceConnection);
    data.journeys.push({
      id: makeId("journey"),
      participants: [user.id, "mert"],
      goalId: "walk",
      target: 50,
      createdAt: nowIso(),
    });
    addActivity({ type: "friend_added", actorId: "mert", participants: [user.id, "mert"], createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() });
    addActivity({ type: "journey_started", actorId: "mert", participants: [user.id, "mert"], goalId: "walk", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() });
    addActivity({ type: "step_completed", actorId: "mert", participants: [user.id, "mert"], goalId: "walk", progress: 35, createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() });
  }

  function createSession(profile, withDemo) {
    const id = makeId("user");
    const name = cleanText(profile?.name, "Yolcu", 40);
    const goals = cleanGoals(profile?.goals);
    const user = {
      id,
      token: makeToken(),
      system: false,
      name,
      handle: `@${slugify(name)}${id.slice(-4)}`,
      initial: name[0].toLocaleUpperCase("tr-TR"),
      gender: cleanGender(profile?.gender),
      accent: cleanAccent(profile?.accent),
      inviteCode: makeInviteCode(),
      shareScope: "selected",
      selectedGoalIds: goals.slice(0, 2).map((goal) => goal.id),
      goals,
      createdAt: nowIso(),
      lastSeen: nowIso(),
    };
    data.users[id] = user;
    if (withDemo) seedDemoForUser(user);
    persist();
    return {
      session: { userId: user.id, token: user.token },
      social: buildSocial(user.id),
    };
  }

  function updateProfile(userId, profile) {
    const user = data.users[userId];
    if (!user) throw new ApiError(404, "Kullanıcı bulunamadı.");
    const previousGoals = new Map((user.goals || []).map((goal) => [goal.id, goal]));
    if (profile?.name !== undefined) {
      user.name = cleanText(profile.name, user.name, 40);
      user.initial = user.name[0].toLocaleUpperCase("tr-TR");
    }
    if (profile?.gender !== undefined) user.gender = cleanGender(profile.gender);
    if (profile?.accent !== undefined) user.accent = cleanAccent(profile.accent, user.accent);
    if (Array.isArray(profile?.goals)) {
      user.goals = cleanGoals(profile.goals);
      const available = new Set(user.goals.map((goal) => goal.id));
      user.selectedGoalIds = (user.selectedGoalIds || []).filter((id) => available.has(id));
      if (!user.selectedGoalIds.length) user.selectedGoalIds = user.goals.slice(0, 2).map((goal) => goal.id);
      const participants = [userId, ...acceptedFriendIds(userId)];
      const sharedGoalIds = new Set(visibleGoals(user).map((goal) => goal.id));
      if (participants.length > 1) {
        user.goals.forEach((goal) => {
          if (!sharedGoalIds.has(goal.id)) return;
          const previous = previousGoals.get(goal.id);
          if (previous && goal.progress > previous.progress) {
            addActivity({ type: "step_completed", actorId: userId, participants, goalId: goal.id, progress: goal.progress });
          } else if (previous && goal.status === "resting" && previous.status !== "resting") {
            addActivity({ type: "rest_day", actorId: userId, participants, goalId: goal.id, progress: goal.progress });
          }
        });
      }
    }
    user.lastSeen = nowIso();
    persist();
    return buildSocial(userId);
  }

  function setShareScope(userId, scope) {
    const user = data.users[userId];
    if (!user) throw new ApiError(404, "Kullanıcı bulunamadı.");
    user.shareScope = scope === "all" ? "all" : "selected";
    persist();
    return buildSocial(userId);
  }

  function openInvite(userId, code) {
    const normalized = cleanText(code, "", 40).toUpperCase();
    const inviter = Object.values(data.users).find((user) => user.inviteCode === normalized);
    if (!inviter) throw new ApiError(404, "Bu davet bağlantısı artık geçerli değil.");
    if (inviter.id === userId) throw new ApiError(400, "Kendi davet bağlantını açtın.");
    const existing = findConnection(inviter.id, userId);
    if (!existing) {
      data.connections.push({
        id: makeId("connection"),
        userA: inviter.id,
        userB: userId,
        inviterId: inviter.id,
        recipientId: userId,
        status: "pending",
        createdAt: nowIso(),
      });
      persist();
    }
    return buildSocial(userId);
  }

  function acceptInvite(userId, connectionId) {
    const connection = data.connections.find((item) => item.id === connectionId);
    if (!connection || connection.status !== "pending" || connection.recipientId !== userId) {
      throw new ApiError(404, "Bekleyen davet bulunamadı.");
    }
    connection.status = "accepted";
    connection.acceptedAt = nowIso();
    addActivity({
      type: "friend_added",
      actorId: userId,
      participants: [connection.userA, connection.userB],
      createdAt: connection.acceptedAt,
    });
    persist();
    return buildSocial(userId);
  }

  function declineInvite(userId, connectionId) {
    const index = data.connections.findIndex((item) => (
      item.id === connectionId && item.status === "pending" && item.recipientId === userId
    ));
    if (index < 0) throw new ApiError(404, "Bekleyen davet bulunamadı.");
    data.connections.splice(index, 1);
    persist();
    return buildSocial(userId);
  }

  function regenerateInvite(userId) {
    const user = data.users[userId];
    user.inviteCode = makeInviteCode();
    persist();
    return buildSocial(userId);
  }

  function startJourney(userId, friendId, goalId) {
    const connection = findConnection(userId, friendId);
    if (!connection || connection.status !== "accepted") throw new ApiError(403, "Bu kullanıcı henüz yoldaşın değil.");
    const friend = data.users[friendId];
    const friendGoal = visibleGoals(friend).find((goal) => goal.id === goalId);
    const ownGoal = (data.users[userId].goals || []).find((goal) => goal.id === goalId);
    if (!friendGoal || !ownGoal) throw new ApiError(400, "Bu hedef iki yoldaşta da açık değil.");
    const existing = data.journeys.find((journey) => (
      journey.goalId === goalId
      && journey.participants.includes(userId)
      && journey.participants.includes(friendId)
    ));
    if (!existing) {
      const highest = Math.max(ownGoal.progress, friendGoal.progress);
      data.journeys.push({
        id: makeId("journey"),
        participants: [userId, friendId],
        goalId,
        target: Math.min(100, Math.max(10, Math.ceil((highest + 1) / 10) * 10)),
        createdAt: nowIso(),
      });
      addActivity({
        type: "journey_started",
        actorId: userId,
        participants: [userId, friendId],
        goalId,
      });
      persist();
    }
    return buildSocial(userId);
  }

  persist();
  return {
    data,
    persist,
    findUserByToken,
    buildSocial,
    createSession,
    updateProfile,
    setShareScope,
    openInvite,
    acceptInvite,
    declineInvite,
    regenerateInvite,
    startJourney,
  };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...securityHeaders(),
  });
  res.end(body);
}

function securityHeaders() {
  return {
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        reject(new ApiError(413, "İstek çok büyük."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new ApiError(400, "Geçersiz JSON."));
      }
    });
    req.on("error", reject);
  });
}

function authenticate(req, database) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = token ? database.findUserByToken(token) : null;
  if (!user) throw new ApiError(401, "Oturum geçersiz.");
  user.lastSeen = nowIso();
  return user;
}

function serveStatic(req, res, pathname) {
  const fileName = STATIC_FILES.get(pathname);
  if (!fileName) return false;
  const filePath = path.join(APP_ROOT, fileName);
  try {
    const content = fs.readFileSync(filePath);
    const cacheControl = fileName === "index.html" || fileName === "sw.js"
      ? "no-cache"
      : "public, max-age=60";
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(fileName)] || "application/octet-stream",
      "Content-Length": content.length,
      "Cache-Control": cacheControl,
      ...securityHeaders(),
    });
    if (req.method === "HEAD") res.end();
    else res.end(content);
  } catch {
    sendJson(res, 404, { error: "Dosya bulunamadı." });
  }
  return true;
}

function createAppServer(options = {}) {
  const database = createDatabase(options.dbPath || DEFAULT_DB_PATH);
  const requestBuckets = new Map();

  function enforceRateLimit(req, limit = RATE_LIMIT) {
    const forwardedIp = cleanText(req.headers["cf-connecting-ip"], "", 64);
    const ip = forwardedIp || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const bucket = requestBuckets.get(ip);
    if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
      requestBuckets.set(ip, { startedAt: now, count: 1 });
      return;
    }
    bucket.count += 1;
    if (bucket.count > limit) throw new ApiError(429, "Çok fazla istek gönderildi. Bir dakika sonra yeniden dene.");
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = decodeURIComponent(url.pathname);

      if (req.method === "OPTIONS") {
        res.writeHead(204, securityHeaders());
        return res.end();
      }

      if (!pathname.startsWith("/api/")) {
        if ((req.method === "GET" || req.method === "HEAD") && serveStatic(req, res, pathname)) return;
        throw new ApiError(404, "Sayfa bulunamadı.");
      }

      if (req.method === "GET" && pathname === "/api/health") {
        return sendJson(res, 200, {
          ok: true,
          service: "dunku-sen-backend",
          version: 2,
          persistence: "json",
          time: nowIso(),
        });
      }

      if (req.method === "POST" && pathname === "/api/sessions") {
        enforceRateLimit(req, SESSION_RATE_LIMIT);
        const body = await readJson(req);
        return sendJson(res, 201, database.createSession(body.profile, body.demo !== false));
      }

      enforceRateLimit(req);
      const user = authenticate(req, database);

      if (req.method === "GET" && pathname === "/api/social") {
        return sendJson(res, 200, { social: database.buildSocial(user.id) });
      }

      if (req.method === "PATCH" && pathname === "/api/profile") {
        const body = await readJson(req);
        return sendJson(res, 200, { social: database.updateProfile(user.id, body) });
      }

      if (req.method === "PATCH" && pathname === "/api/settings/share-scope") {
        const body = await readJson(req);
        return sendJson(res, 200, { social: database.setShareScope(user.id, body.scope) });
      }

      if (req.method === "POST" && pathname === "/api/invites/open") {
        const body = await readJson(req);
        return sendJson(res, 200, { social: database.openInvite(user.id, body.code) });
      }

      if (req.method === "POST" && pathname === "/api/invites/regenerate") {
        return sendJson(res, 200, { social: database.regenerateInvite(user.id) });
      }

      const acceptMatch = pathname.match(/^\/api\/invites\/([^/]+)\/accept$/);
      if (req.method === "POST" && acceptMatch) {
        return sendJson(res, 200, { social: database.acceptInvite(user.id, acceptMatch[1]) });
      }

      const inviteMatch = pathname.match(/^\/api\/invites\/([^/]+)$/);
      if (req.method === "DELETE" && inviteMatch) {
        return sendJson(res, 200, { social: database.declineInvite(user.id, inviteMatch[1]) });
      }

      if (req.method === "POST" && pathname === "/api/journeys") {
        const body = await readJson(req);
        return sendJson(res, 201, { social: database.startJourney(user.id, body.friendId, body.goalId) });
      }

      throw new ApiError(404, "API yolu bulunamadı.");
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      if (status === 500) console.error(error);
      if (!res.headersSent) sendJson(res, status, { error: status === 500 ? "Sunucuda beklenmeyen bir hata oluştu." : error.message });
      else res.end();
    }
  });

  return { server, database };
}

if (require.main === module) {
  const port = Math.max(1, Number(process.env.PORT) || 4173);
  const host = process.env.HOST || "0.0.0.0";
  const { server } = createAppServer();
  server.listen(port, host, () => {
    console.log(`Dünkü Sen backend: http://127.0.0.1:${port}`);
    console.log(`Aynı Wi-Fi'daki cihazlar için bu bilgisayarın yerel IP adresini kullanabilirsin.`);
  });
}

module.exports = { createAppServer };
