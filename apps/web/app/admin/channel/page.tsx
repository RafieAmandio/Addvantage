"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatWibDateTime } from "@/lib/cn";
import { API_BASE, getAccessToken } from "@/lib/api/client";

interface ChannelThread {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

interface ChannelPost {
  id: string;
  author: string;
  body: string;
  imageUrl: string | null;
  tags: string[];
  pinned: boolean;
  published: boolean;
  createdAt: string;
  thread: { id: string; title: string; slug: string } | null;
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((opts.headers as Record<string, string>) ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export default function AdminChannelPage() {
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [threads, setThreads] = useState<ChannelThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showThreadForm, setShowThreadForm] = useState(false);
  const [editThreadId, setEditThreadId] = useState<string | null>(null);

  // post form
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("Anthony");
  const [tags, setTags] = useState("");
  const [pinned, setPinned] = useState(false);
  const [threadId, setThreadId] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // thread form
  const [threadTitle, setThreadTitle] = useState("");
  const [threadDesc, setThreadDesc] = useState("");
  const [savingThread, setSavingThread] = useState(false);

  const load = useCallback(async () => {
    try {
      const [postsJson, threadsJson] = await Promise.all([
        apiFetch("/channel/admin/all"),
        apiFetch("/channel/threads"),
      ]);
      setPosts(postsJson.data ?? []);
      setThreads(threadsJson.data ?? []);
    } catch {
      setPosts([]);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setBody("");
    setAuthor("Anthony");
    setTags("");
    setPinned(false);
    setThreadId("");
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
    setEditId(null);
    setShowForm(false);
    setSaveError(null);
  }

  function resetThreadForm() {
    setThreadTitle("");
    setThreadDesc("");
    setEditThreadId(null);
    setShowThreadForm(false);
  }

  function startEdit(post: ChannelPost) {
    setBody(post.body);
    setAuthor(post.author);
    setTags(post.tags.join(", "));
    setPinned(post.pinned);
    setThreadId(post.thread?.id ?? "");
    setImagePreview(post.imageUrl);
    setImageFile(null);
    setEditId(post.id);
    setShowForm(true);
  }

  function startEditThread(thread: ChannelThread) {
    setThreadTitle(thread.title);
    setThreadDesc(thread.description ?? "");
    setEditThreadId(thread.id);
    setShowThreadForm(true);
  }

  async function uploadImageToStorage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("image", file);
    const json = await apiFetch("/channel/upload", { method: "POST", body: fd });
    return json.data?.imageUrl;
  }

  async function onSubmit() {
    if (!body.trim()) return;
    setSaving(true);
    setSaveError(null);

    try {
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile);
      }

      const payload = {
        body: body.trim(),
        author,
        imageUrl,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        pinned,
        published: true,
        threadId: threadId || null,
      };

      if (editId) {
        await apiFetch(`/channel/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/channel", { method: "POST", body: JSON.stringify(payload) });
      }

      resetForm();
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    await apiFetch(`/channel/${id}`, { method: "DELETE" });
    await load();
  }

  async function togglePublish(post: ChannelPost) {
    await apiFetch(`/channel/${post.id}`, {
      method: "PUT",
      body: JSON.stringify({ published: !post.published }),
    });
    await load();
  }

  async function onThreadSubmit() {
    if (!threadTitle.trim()) return;
    setSavingThread(true);
    try {
      const payload = {
        title: threadTitle.trim(),
        description: threadDesc.trim() || undefined,
      };
      if (editThreadId) {
        await apiFetch(`/channel/threads/${editThreadId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/channel/threads", { method: "POST", body: JSON.stringify(payload) });
      }
      resetThreadForm();
      await load();
    } catch {
      // silent
    } finally {
      setSavingThread(false);
    }
  }

  async function onDeleteThread(id: string) {
    if (!confirm("Delete this thread? Posts will become unthreaded.")) return;
    await apiFetch(`/channel/threads/${id}`, { method: "DELETE" });
    await load();
  }

  async function moveThread(id: string, direction: "up" | "down") {
    const idx = threads.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= threads.length) return;
    await Promise.all([
      apiFetch(`/channel/threads/${threads[idx].id}`, {
        method: "PUT",
        body: JSON.stringify({ sortOrder: threads[swapIdx].sortOrder }),
      }),
      apiFetch(`/channel/threads/${threads[swapIdx].id}`, {
        method: "PUT",
        body: JSON.stringify({ sortOrder: threads[idx].sortOrder }),
      }),
    ]);
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
          ● Loading Channel
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
            Broadcast · Founder Channel
          </span>
          <h1 className="mt-2 font-mono text-2xl font-bold text-white">
            My Channel
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetThreadForm(); setShowThreadForm(true); }}
            className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + Thread
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
          >
            + New Post
          </button>
        </div>
      </div>

      <div className="mt-8 h-px bg-white/20" />

      {/* ─── thread management ─────────────────────────────────────────── */}
      {threads.length > 0 && !showThreadForm && (
        <div className="mt-6">
          <div className="mb-3 font-mono text-[9px] uppercase tracking-widest2 text-white/40">
            Threads
          </div>
          <div className="flex flex-wrap gap-2">
            {threads.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-1 border border-gray-3 bg-gray-2/50 px-2 py-1"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/70">
                  {t.title}
                </span>
                <button
                  onClick={() => moveThread(t.id, "up")}
                  disabled={i === 0}
                  className="px-1 font-mono text-[9px] text-white/30 transition-colors hover:text-brand disabled:opacity-20"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveThread(t.id, "down")}
                  disabled={i === threads.length - 1}
                  className="px-1 font-mono text-[9px] text-white/30 transition-colors hover:text-brand disabled:opacity-20"
                  title="Move down"
                >
                  ▼
                </button>
                <button
                  onClick={() => startEditThread(t)}
                  className="px-1 font-mono text-[9px] text-white/30 transition-colors hover:text-brand"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => onDeleteThread(t.id)}
                  className="px-1 font-mono text-[9px] text-blood-bright/50 transition-colors hover:text-blood-bright"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── thread form ───────────────────────────────────────────────── */}
      {showThreadForm && (
        <div className="mt-6 border border-white/10 bg-black p-4">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-widest2 text-white/50">
            {editThreadId ? "Edit Thread" : "New Thread"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Title
              </span>
              <input
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                maxLength={50}
                placeholder="e.g. Gold Thesis"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Description (optional)
              </span>
              <input
                value={threadDesc}
                onChange={(e) => setThreadDesc(e.target.value)}
                maxLength={200}
                placeholder="Short description"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onThreadSubmit}
              disabled={savingThread || !threadTitle.trim()}
              className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              {savingThread ? "Saving..." : editThreadId ? "Update" : "Create"}
            </button>
            <button
              onClick={resetThreadForm}
              className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── post form ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="mt-6 border border-brand/40 bg-black p-6">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            {editId ? "Edit Post" : "New Broadcast"}
          </div>

          {saveError && (
            <div className="mb-4 border border-blood bg-blood/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest2 text-blood-bright">
              {saveError}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
              Body
            </span>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your broadcast..."
              className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
              Image (optional)
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
              className="w-full font-mono text-[10px] text-white/50 file:mr-3 file:border file:border-gray-3 file:bg-gray-2 file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-widest2 file:text-brand file:transition-colors hover:file:bg-brand hover:file:text-black"
            />
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 border border-gray-3"
                />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute -right-2 -top-2 h-5 w-5 bg-blood-bright text-[10px] text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </label>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Author
              </span>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Tags (comma-separated)
              </span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="macro, outlook"
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 transition-colors focus-visible:border-brand focus-visible:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest2 text-white/50">
                Thread
              </span>
              <select
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
                className="w-full border border-gray-3 bg-gray-2 px-3 py-2 font-mono text-sm text-white transition-colors focus-visible:border-brand focus-visible:outline-none"
              >
                <option value="">None</option>
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="accent-brand"
            />
            <span className="font-mono text-[10px] uppercase tracking-widest2 text-white/60">
              Pin to top
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={onSubmit}
              disabled={saving || !body.trim()}
              className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              {saving ? "Saving..." : editId ? "Update" : "Publish"}
            </button>
            <button
              onClick={resetForm}
              className="border border-gray-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-white/60 transition-colors hover:border-white/40 hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── post list ─────────────────────────────────────────────────── */}
      {posts.length === 0 && !showForm && (
        <div className="py-20 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest2 text-white/30">
            No broadcasts yet
          </div>
          <div className="mt-4 font-mono text-xl font-bold text-white">
            Start broadcasting.
          </div>
        </div>
      )}

      <div className="mt-px">
        {posts.map((post, i) => (
          <div
            key={post.id}
            className={cn(
              "border-b border-white/[0.08] py-6",
              !post.published && "opacity-50"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] tabular-nums text-white/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest2 text-brand">
                      {post.author}
                    </span>
                    {post.thread && (
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-white/30">
                        {post.thread.title}
                      </span>
                    )}
                    {post.pinned && (
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-brand/60">
                        Pinned
                      </span>
                    )}
                    {!post.published && (
                      <span className="font-mono text-[9px] uppercase tracking-widest2 text-blood-bright">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-white/30">
                    {formatWibDateTime(post.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublish(post)}
                  className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  {post.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => startEdit(post)}
                  className="border border-gray-3 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-white/50 transition-colors hover:border-brand hover:text-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="border border-blood/40 px-2 py-1 font-mono text-[9px] uppercase tracking-widest2 text-blood-bright/60 transition-colors hover:bg-blood hover:text-black focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-3 pl-9">
              <p className="font-mono text-sm font-light leading-relaxed text-white/80 whitespace-pre-wrap">
                {post.body}
              </p>
              {post.imageUrl && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="max-h-64 border border-gray-3"
                  />
                </div>
              )}
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="border border-brand/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest2 text-brand/70"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
