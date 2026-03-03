export async function fetchApi(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error?.message || "Request failed");
  return data.data;
}

export async function loadPosts() {
  try {
    const { posts } = await fetchApi("/api/posts");
    return posts || [];
  } catch {
    return [];
  }
}

export async function createPost(personaId, text, opts = {}) {
  const data = await fetchApi("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personaId,
      text: text.trim(),
      isUser: opts.isUser !== false,
    }),
  });
  return data;
}
