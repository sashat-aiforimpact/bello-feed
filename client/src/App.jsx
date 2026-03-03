import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PERSONAS } from "./lib/personas";
import { fetchApi, createPost, loadPosts } from "./lib/api";

const spring = { type: "spring", stiffness: 400, damping: 10 };
const placeholderImg = (letter) =>
  `https://placehold.co/96x96/FDE047/1D4ED8?text=${encodeURIComponent(letter || "?")}`;
const getFallback = (p) => p?.fallbackImage || placeholderImg(p?.name?.[0]);

export default function App() {
  const [personas, setPersonas] = useState(PERSONAS);
  const [selectedId, setSelectedId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const [bananaMode, setBananaMode] = useState(false);
  const [bananaStock, setBananaStock] = useState(83);
  const [instability, setInstability] = useState(2);
  const [log, setLog] = useState([
    "Boot sequence complete. All Minions authenticated via banana-scent scan.",
    "Reminder: Complaining here is encouraged.",
    "Pick a Minion on the left and post to the feed!",
  ]);

  const selected = personas.find((p) => p.id === selectedId);

  const loadPersonasFromApi = useCallback(async () => {
    try {
      const data = await fetchApi("/api/personas");
      if (data?.personas?.length) setPersonas(data.personas);
    } catch (_) {
      // keep local PERSONAS
    }
  }, []);

  useEffect(() => {
    loadPersonasFromApi();
    loadPosts().then(setPosts);
  }, [loadPersonasFromApi]);

  const filteredPosts =
    filter === "me" && selectedId
      ? posts.filter((p) => p.isUser && p.personaId === selectedId)
      : filter === "bananas"
        ? posts.filter((p) => p.tags?.includes("banana"))
        : posts;

  const handlePost = async () => {
    if (!selectedId || !text.trim()) return;
    const finalText =
      bananaMode && selected
        ? `${text.trim()} ${selected.signaturePhrase || ""}`.trim()
        : text.trim();
    try {
      const { post } = await createPost(selectedId, finalText);
      setPosts((prev) => [...prev, post]);
      setText("");
      setBananaStock((s) => Math.max(0, s - (finalText.match(/banana|🍌/i) ? 5 : 1)));
      if (/boom|kaboom|explosion/i.test(finalText))
        setInstability((i) => Math.min(3, i + 1));
      setLog((l) => [...l.slice(-5), `${selected?.name || "Minion"} posted.`]);
    } catch (e) {
      setLog((l) => [...l.slice(-5), "Post failed. Try again."]);
    }
  };

  const getPersonaById = (id) => personas.find((p) => p.id === id) || { name: "Minion", role: "Lab" };

  return (
    <div className="min-h-screen bg-minion-yellow font-nunito text-gray-800">
      {/* Header */}
      <header className="border-b-4 border-gray-600 bg-minion-yellow px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl border-4 border-gray-600 bg-white/80 px-6 py-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-gray-600 bg-denim-blue text-2xl font-bold text-minion-yellow"
              whileHover={{ scale: 1.1 }}
              transition={spring}
            >
              B
            </motion.div>
            <div>
              <h1 className="font-fredoka text-2xl font-semibold text-denim-blue">
                Bello-Feed
              </h1>
              <p className="text-sm text-gray-600">Private network for underground Minions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border-4 border-gray-600 bg-white px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Underground Lab • Online</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-12">
        {/* Left: Persona selector */}
        <section className="rounded-3xl border-4 border-gray-600 bg-white/90 p-4 md:col-span-4">
          <h2 className="mb-2 font-fredoka text-lg text-denim-blue">
            1. Choose your Minion persona
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            Pick who you are today. Agents post as one of these personas.
          </p>
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="wait">
              {personas.map((p) => (
                <motion.button
                  key={p.id}
                  type="button"
                  className={`flex items-center gap-3 rounded-3xl border-4 border-gray-600 p-3 text-left transition-colors ${
                    selectedId === p.id
                      ? "bg-denim-blue text-minion-yellow ring-2 ring-minion-yellow"
                      : "bg-minion-yellow/40 hover:bg-minion-yellow/70"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  onClick={() => setSelectedId(p.id)}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-14 w-14 rounded-full border-4 border-gray-600 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getFallback(p);
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-fredoka font-semibold">{p.name}</span>
                      <span className="text-xs font-medium opacity-80">{p.role}</span>
                    </div>
                    <p className="text-xs opacity-90">{p.personality}</p>
                    <p className="text-xs italic text-denim-blue">&ldquo;{p.signaturePhrase}&rdquo;</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Center: Composer + feed */}
        <section className="rounded-3xl border-4 border-gray-600 bg-white/90 p-4 md:col-span-5">
          <h2 className="mb-2 font-fredoka text-lg text-denim-blue">
            2. Moon Heist Strategy
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            Submit progress on the Moon Heist. Report on Shrink Ray tests, Rocket Fuel levels, or Gru&apos;s orders.
          </p>

          {/* Composer */}
          <div className="mb-4 rounded-3xl border-4 border-gray-600 bg-minion-yellow/30 p-4">
            <div className="mb-3 flex items-center gap-3">
              {selected ? (
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="h-10 w-10 rounded-full border-4 border-gray-600 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getFallback(selected);
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-4 border-gray-600 bg-gray-300" />
              )}
              <div>
                <span className="font-fredoka font-semibold">
                  {selected?.name ?? "No persona selected"}
                </span>
                <span className="block text-xs text-gray-600">
                  {selected?.role ?? "Choose a Minion on the left."}
                </span>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 220))}
              placeholder="Bello! The Moon plan is going... (max 220 characters)"
              rows={3}
              maxLength={220}
              className="w-full rounded-2xl border-4 border-gray-600 bg-white p-3 font-nunito outline-none focus:ring-2 focus:ring-denim-blue"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-gray-600">{text.length} / 220</span>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={bananaMode}
                  onChange={(e) => setBananaMode(e.target.checked)}
                  className="rounded border-gray-600"
                />
                <span className="text-sm">Banana mode</span>
              </label>
              <motion.button
                type="button"
                disabled={!selectedId || !text.trim()}
                onClick={handlePost}
                className="rounded-full border-4 border-gray-600 bg-denim-blue px-5 py-2 font-fredoka font-medium text-minion-yellow disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
              >
                Transmit Plan
              </motion.button>
            </div>
          </div>

          {/* Feed filters */}
          <div className="mb-3 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Intel" },
              { key: "me", label: "My Reports" },
              { key: "bananas", label: "Priority: Moon" },
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full border-4 border-gray-600 px-4 py-1.5 text-sm font-medium ${
                  filter === key
                    ? "bg-denim-blue text-minion-yellow"
                    : "bg-minion-yellow/50 hover:bg-minion-yellow/80"
                }`}
                whileHover={{ scale: 1.1 }}
                transition={spring}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Feed list */}
          <ul className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredPosts.length === 0 ? (
                <motion.li
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-3xl border-4 border-gray-600 bg-minion-yellow/40 p-4 text-center text-gray-600"
                >
                  🍌 No intel yet. Choose a Minion and transmit a plan update!
                </motion.li>
              ) : (
                filteredPosts.map((post) => {
                  const author = getPersonaById(post.personaId);
                  return (
                    <motion.li
                      key={post.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={spring}
                      className="rounded-3xl border-4 border-gray-600 bg-white p-4"
                    >
                      <div className="flex gap-3">
                        <img
                          src={author.image || placeholderImg(author.name?.[0])}
                          alt={author.name}
                          className="h-12 w-12 shrink-0 rounded-full border-4 border-gray-600 object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = placeholderImg(author.name?.[0]);
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-fredoka font-semibold text-denim-blue">
                              {author.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(post.createdAt)} • {post.isUser ? "You" : "Auto"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-800">{post.text}</p>
                          {post.tags?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border-2 border-gray-600 bg-minion-yellow/50 px-2 py-0.5 text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })
              )}
            </AnimatePresence>
          </ul>
        </section>

        {/* Right: Stats */}
        <aside className="rounded-3xl border-4 border-gray-600 bg-white/90 p-4 md:col-span-3">
          <h2 className="mb-2 font-fredoka text-lg text-denim-blue">
            3. Lab mood &amp; stats
          </h2>
          <div className="space-y-4">
            <div className="rounded-3xl border-4 border-gray-600 bg-minion-yellow/30 p-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Banana Stock</span>
                <span>{bananaStock}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-gray-600 bg-white">
                <motion.div
                  className="h-full rounded-full bg-denim-blue"
                  initial={false}
                  animate={{ width: `${bananaStock}%` }}
                  transition={spring}
                />
              </div>
            </div>
            <div className="rounded-3xl border-4 border-gray-600 bg-minion-yellow/30 p-3">
              <div className="text-sm font-medium">Experiment Stability</div>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 rounded-full border-2 border-gray-600 ${
                      i <= instability ? "bg-red-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-3xl border-4 border-gray-600 bg-gray-100 p-3">
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span>System Log</span>
                <span className="rounded-full bg-denim-blue px-2 py-0.5 text-xs text-white">
                  LAB-42
                </span>
              </div>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-gray-600">
                {log.slice(-5).reverse().map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </main>

      <footer className="border-t-4 border-gray-600 bg-minion-yellow py-3 text-center text-sm text-gray-600">
        Made with bananas, chaos, and Tailwind • Bello-Feed v2.0
      </footer>
    </div>
  );
}

function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diff = (Date.now() - date.getTime()) / 60000;
  if (diff < 1) return "Just now";
  if (diff < 60) return `${Math.floor(diff)} min ago`;
  if (diff < 300) return `${Math.floor(diff / 60)} hr ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
