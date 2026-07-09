const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createAppServer } = require("./server.cjs");

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || "GET",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${payload.error}`);
  return payload;
}

async function run() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dunku-sen-backend-"));
  const dbPath = path.join(tempRoot, "social-db.json");
  fs.writeFileSync(dbPath, JSON.stringify({
    version: 1,
    users: {},
    connections: [],
    journeys: [],
    messages: [{ id: "legacy-message", text: "Eski chat verisi" }],
  }));
  const { server } = createAppServer({ dbPath });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await request(baseUrl, "/api/health");
    assert.equal(health.ok, true);
    assert.equal(health.version, 2);

    const indexResponse = await fetch(`${baseUrl}/`);
    const indexHtml = await indexResponse.text();
    assert.equal(indexResponse.status, 200);
    assert.match(indexHtml, /id="analysisPage"/);
    assert.match(indexHtml, /rel="manifest"/);
    assert.match(indexHtml, /id="activityFeed"/);
    assert.doesNotMatch(indexHtml, /id="chatSheet"/);

    const workerResponse = await fetch(`${baseUrl}/sw.js`);
    assert.equal(workerResponse.status, 200);
    assert.match(workerResponse.headers.get("content-type"), /javascript/);

    const iconResponse = await fetch(`${baseUrl}/icon.svg`);
    assert.equal(iconResponse.status, 200);
    assert.match(iconResponse.headers.get("content-type"), /image\/svg\+xml/);

    const goal = {
      id: "walk",
      title: "Günlük yürüyüş",
      subtitle: "10.000 adım · Her gün",
      progress: 12,
      accent: "102,229,255",
      category: "health",
      icon: "⌁",
      rule: "10.000 adımı tamamla",
      status: "pending",
    };
    const privateGoal = {
      ...goal,
      id: "read",
      title: "Kitap okuma",
      subtitle: "20 sayfa · Her gün",
      progress: 3,
      rule: "20 sayfa oku",
    };

    const alice = await request(baseUrl, "/api/sessions", {
      method: "POST",
      body: { demo: false, profile: { name: "Ada", gender: "female", goals: [goal, privateGoal] } },
    });
    const bora = await request(baseUrl, "/api/sessions", {
      method: "POST",
      body: { demo: false, profile: { name: "Bora", gender: "male", goals: [{ ...goal, progress: 9 }] } },
    });

    assert.ok(alice.social.inviteCode.startsWith("DS-"));
    assert.equal(alice.social.friends.length, 0);
    assert.equal(bora.social.pendingInvites.length, 0);

    const opened = await request(baseUrl, "/api/invites/open", {
      method: "POST",
      token: bora.session.token,
      body: { code: alice.social.inviteCode, goalId: "walk" },
    });
    assert.equal(opened.social.pendingInvites.length, 1);
    assert.equal(opened.social.pendingInvites[0].name, "Ada");
    assert.equal(opened.social.pendingInvites[0].goals.length, 1);
    assert.equal(opened.social.pendingInvites[0].goals[0].id, "walk");

    const accepted = await request(baseUrl, `/api/invites/${opened.social.pendingInvites[0].id}/accept`, {
      method: "POST",
      token: bora.session.token,
    });
    assert.equal(accepted.social.friends.length, 1);
    assert.equal(accepted.social.friends[0].goals.length, 1);
    assert.equal(accepted.social.friends[0].goals[0].id, "walk");
    assert.equal(accepted.social.activities[0].type, "friend_added");

    const aliceSocial = await request(baseUrl, "/api/social", { token: alice.session.token });
    assert.equal(aliceSocial.social.friends[0].name, "Bora");

    const journey = await request(baseUrl, "/api/journeys", {
      method: "POST",
      token: alice.session.token,
      body: { friendId: bora.session.userId, goalId: "walk" },
    });
    assert.equal(journey.social.sharedJourneys.length, 1);
    assert.equal(journey.social.activities[0].type, "journey_started");

    await request(baseUrl, "/api/profile", {
      method: "PATCH",
      token: alice.session.token,
      body: { name: "Ada", gender: "female", goals: [{ ...goal, progress: 13, status: "complete" }] },
    });
    const boraSocial = await request(baseUrl, "/api/social", { token: bora.session.token });
    assert.equal(boraSocial.social.activities[0].type, "step_completed");
    assert.equal(boraSocial.social.activities[0].progress, 13);

    const removedMessageRoute = await fetch(`${baseUrl}/api/messages/${bora.session.userId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${alice.session.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Bu rota artık olmamalı." }),
    });
    assert.equal(removedMessageRoute.status, 404);

    const persisted = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    assert.equal(persisted.journeys.length, 1);
    assert.ok(persisted.activities.length >= 3);
    assert.equal("messages" in persisted, false);
    console.log("Dünkü Sen backend test: PASS");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
