const personas = {
  kevin: {
    id: "kevin",
    name: "Kevin",
    role: "Lab Supervisor",
    tags: ["#supervisor", "#clipboard", "#responsible-ish"],
  },
  stuart: {
    id: "stuart",
    name: "Stuart",
    role: "Guitar Specialist",
    tags: ["#music", "#loud", "#noFocus"],
  },
  bob: {
    id: "bob",
    name: "Bob",
    role: "Intern • Explosives",
    tags: ["#boom", "#intern", "#oops"],
  },
  scarlet: {
    id: "scarlet",
    name: "Scarlet",
    role: "Evil Architect",
    tags: ["#evil", "#blueprints", "#bananaplan"],
  },
};

const feedListEl = document.getElementById("feedList");
const personaGridEl = document.getElementById("personaGrid");
const composerNameEl = document.getElementById("composerName");
const composerRoleEl = document.getElementById("composerRole");
const statusInputEl = document.getElementById("statusInput");
const charCountEl = document.getElementById("charCount");
const postButtonEl = document.getElementById("postButton");
const bananaModeToggleEl = document.getElementById("bananaModeToggle");

const filterAllBtn = document.getElementById("filterAll");
const filterMeBtn = document.getElementById("filterMe");
const filterBananasBtn = document.getElementById("filterBananas");

const bananaStockEl = document.getElementById("bananaStock");
const bananaStockBarEl = document.getElementById("bananaStockBar");
const stabilityLabelEl = document.getElementById("stabilityLabel");
const stabilityDotsEl = document.getElementById("stabilityDots");
const systemLogEl = document.getElementById("systemLog");

let currentPersonaId = null;
let currentFilter = "all"; // 'all' | 'me' | 'bananas'
let allPosts = [];
let userPosts = [];
let bananaStock = 83;
let instability = 2;

function parseDateMaybe(value) {
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatTime(rawDate) {
  const date = parseDateMaybe(rawDate);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 5) return `${diffH} hr${diffH === 1 ? "" : "s"} ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function hasBananaContent(text) {
  return /banana|bananas|bananas?!!|🍌/i.test(text);
}

function hasComplaint(text) {
  return /(ugh|complain|tired|boring|why|again|late shift|overworked)/i.test(text);
}

function hasExperiment(text) {
  return /(experiment|lab|test|prototype|laser|boom|kaboom|explosive)/i.test(text);
}

function containsBoom(text) {
  return /(boom|kaboom|explosion|explode)/i.test(text);
}

function sprinkleBananaWords(text) {
  const words = text.split(/\s+/);
  if (!words.length) return text;

  const extraBits = [];
  if (words.length < 4) {
    extraBits.push("bello?");
  }
  if (!hasBananaContent(text)) {
    extraBits.push("banana!");
  }
  if (Math.random() > 0.5) {
    extraBits.push("tatata-bala-tu");
  }

  return `${text.trim()} ${extraBits.join(" ")}`.trim();
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error?.message || "Request failed");
  }
  return data.data;
}

function createFeedEmptyState() {
  const li = document.createElement("li");
  li.className = "feed-empty";
  li.innerHTML =
    '<span>🍌</span>No posts yet. Choose a Minion on the left, type what they\'re thinking, and hit "Post to Bello-Feed".';
  return li;
}

function renderFeed() {
  feedListEl.innerHTML = "";

  let itemsToRender = allPosts;
  if (currentFilter === "me" && currentPersonaId) {
    itemsToRender = allPosts.filter((p) => p.isUser && p.personaId === currentPersonaId);
  } else if (currentFilter === "bananas") {
    itemsToRender = allPosts.filter((p) => p.tags.includes("banana"));
  }

  if (!itemsToRender.length) {
    feedListEl.appendChild(createFeedEmptyState());
    return;
  }

  for (const post of itemsToRender) {
    const li = document.createElement("li");
    li.className = "feed-item";
    li.dataset.personaId = post.personaId;

    const persona = personas[post.personaId];

    const avatar = document.createElement("div");
    avatar.className = "feed-avatar";

    const content = document.createElement("div");
    content.className = "feed-content";

    const header = document.createElement("div");
    header.className = "feed-header";

    const author = document.createElement("div");
    author.className = "feed-author";

    const nameEl = document.createElement("span");
    nameEl.className = "feed-name";
    nameEl.textContent = persona ? persona.name : "Unknown Minion";

    const roleEl = document.createElement("span");
    roleEl.className = "feed-role";
    roleEl.textContent = persona ? persona.role : "Somewhere in the lab";

    author.appendChild(nameEl);
    author.appendChild(roleEl);

    const meta = document.createElement("span");
    meta.className = "feed-meta";
    meta.textContent = `${formatTime(post.createdAt)} • ${post.isUser ? "You" : "Auto"}`;

    header.appendChild(author);
    header.appendChild(meta);

    const body = document.createElement("div");
    body.className = "feed-body";
    body.textContent = post.text;

    const footer = document.createElement("div");
    footer.className = "feed-footer";

    const tags = document.createElement("div");
    tags.className = "feed-tags";

    if (post.tags.includes("banana")) {
      const tag = document.createElement("span");
      tag.className = "feed-tag feed-tag--banana";
      tag.textContent = "banana-related";
      tags.appendChild(tag);
    }

    if (post.tags.includes("complain")) {
      const tag = document.createElement("span");
      tag.className = "feed-tag feed-tag--complain";
      tag.textContent = "complaint";
      tags.appendChild(tag);
    }

    if (post.tags.includes("experiment")) {
      const tag = document.createElement("span");
      tag.className = "feed-tag feed-tag--experiment";
      tag.textContent = "experiment";
      tags.appendChild(tag);
    }

    const quick = document.createElement("div");
    quick.className = "feed-quick";

    if (post.isUser) {
      const badge = document.createElement("span");
      badge.textContent = "you";
      quick.appendChild(badge);
    }

    footer.appendChild(tags);
    footer.appendChild(quick);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);

    li.appendChild(avatar);
    li.appendChild(content);

    feedListEl.appendChild(li);
  }

  feedListEl.scrollTop = feedListEl.scrollHeight;
}

function setFilter(filter) {
  currentFilter = filter;
  [filterAllBtn, filterMeBtn, filterBananasBtn].forEach((btn) =>
    btn.classList.remove("chip--active"),
  );
  if (filter === "all") filterAllBtn.classList.add("chip--active");
  if (filter === "me") filterMeBtn.classList.add("chip--active");
  if (filter === "bananas") filterBananasBtn.classList.add("chip--active");
  renderFeed();
}

function log(message) {
  const li = document.createElement("li");
  li.textContent = message;
  systemLogEl.appendChild(li);
  while (systemLogEl.children.length > 6) {
    systemLogEl.removeChild(systemLogEl.firstChild);
  }
}

function updateStatsForPost(post) {
  if (hasBananaContent(post.text)) {
    bananaStock = Math.max(0, bananaStock - 5);
  } else {
    bananaStock = Math.max(0, bananaStock - 1);
  }

  bananaStockEl.textContent = `${bananaStock}%`;
  bananaStockBarEl.style.width = `${bananaStock}%`;

  if (containsBoom(post.text)) {
    instability = Math.min(3, instability + 1);
  } else if (Math.random() < 0.25) {
    instability = Math.max(1, instability - 1);
  }

  const dots = stabilityDotsEl.querySelectorAll(".dot");
  dots.forEach((dot, index) => {
    dot.classList.toggle("dot--active", index < instability);
  });

  if (instability <= 1) {
    stabilityLabelEl.textContent = "Stable-ish";
    stabilityLabelEl.classList.remove("stat-pill--danger");
  } else if (instability === 2) {
    stabilityLabelEl.textContent = "Wobbly";
    stabilityLabelEl.classList.add("stat-pill--danger");
  } else {
    stabilityLabelEl.textContent = "Unstable";
    stabilityLabelEl.classList.add("stat-pill--danger");
  }
}

async function createPost(personaId, text, { isUser = false } = {}) {
  const rawText = text.trim();
  if (!rawText) return null;

  const finalText = bananaModeToggleEl.checked && isUser ? sprinkleBananaWords(rawText) : rawText;

  const payload = {
    personaId,
    text: finalText,
    isUser,
  };

  const { post } = await fetchJson("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  post.createdAt = post.createdAt;
  allPosts.push(post);
  if (isUser) userPosts.push(post);

  updateStatsForPost(post);
  renderFeed();

  const persona = personas[personaId];
  if (isUser) {
    log(`${persona ? persona.name : "Minion"} posted a new update.`);
  }

  return post;
}

async function loadInitialPosts() {
  try {
    const { posts } = await fetchJson("/api/posts");
    allPosts = posts.map((p) => ({
      ...p,
      createdAt: p.createdAt,
    }));
    renderFeed();
  } catch (err) {
    console.error("Failed to load posts", err);
    log("Could not load existing posts from the lab database.");
    renderFeed();
  }
}

personaGridEl.addEventListener("click", (event) => {
  const card = event.target.closest(".persona-card");
  if (!card) return;

  const personaId = card.dataset.personaId;
  if (!personas[personaId]) return;

  currentPersonaId = personaId;

  personaGridEl.querySelectorAll(".persona-card").forEach((el) => {
    el.classList.toggle("persona-card--active", el === card);
  });

  const persona = personas[personaId];
  composerNameEl.textContent = persona.name;
  composerRoleEl.textContent = persona.role;

  log(`Switched persona to ${persona.name}.`);
});

statusInputEl.addEventListener("input", () => {
  const value = statusInputEl.value;
  charCountEl.textContent = `${value.length} / ${statusInputEl.maxLength}`;
  postButtonEl.disabled = !value.trim() || !currentPersonaId;
});

postButtonEl.addEventListener("click", async () => {
  if (!currentPersonaId) {
    alert("Choose your Minion persona on the left before posting.");
    return;
  }
  const text = statusInputEl.value;
  if (!text.trim()) return;

  try {
    await createPost(currentPersonaId, text, { isUser: true });
    statusInputEl.value = "";
    charCountEl.textContent = `0 / ${statusInputEl.maxLength}`;
    postButtonEl.disabled = true;
  } catch (err) {
    console.error("Failed to create post", err);
    alert("The underground database failed to save your post. Try again in a moment.");
  }
});

statusInputEl.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    postButtonEl.click();
  }
});

[filterAllBtn, filterMeBtn, filterBananasBtn].forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    setFilter(filter);
  });
});

bananaStockBarEl.style.width = `${bananaStock}%`;

loadInitialPosts();

