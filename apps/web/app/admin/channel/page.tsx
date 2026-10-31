"use client";

import { useEffect, useState, useCallback } from "react";
import { cn, formatWibDateTime } from "@/lib/cn";
import { API_BASE, getAccessToken } from "@/lib/api/client";
import { Panel } from "@/components/ui/Panel";

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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-96 animate-pulse rounded-2xl bg-panel" />
        <div className="h-48 animate-pulse rounded-2xl bg-panel" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-4">
        {showForm && (
          <Panel title={editId ? "Edit post" : "New broadcast"}>
            <label className="block">
              <span className={LABEL}>Body</span>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your broadcast"
                className={TEXTAREA}
              />
            </label>

            <div className="mt-4">
              <span className={LABEL}>Image (optional)</span>
              <input
                type="file"
                accept="image/*"
                aria-label="Image"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
                className="mt-2 block w-full min-w-0 text-[13px] text-white/55 file:mr-3 file:rounded-full file:border file:border-solid file:border-white/[0.14] file:bg-transparent file:px-3 file:py-1 file:text-[12px] file:font-medium file:text-white hover:file:bg-raised"
              />
              {imagePreview && (
                <div className="mt-3 flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="max-h-48 min-w-0 rounded-xl" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                    className={SMALL_BTN}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className={LABEL}>Author</span>
                <input value={author} onChange={(e) => setAuthor(e.target.value)} className={INPUT} />
              </label>
              <label className="block">
                <span className={LABEL}>Tags (comma separated)</span>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="macro, outlook" className={INPUT} />
              </label>
              <label className="block">
                <span className={LABEL}>Thread</span>
                <select value={threadId} onChange={(e) => setThreadId(e.target.value)} className={INPUT}>
                  <option value="">None</option>
                  {threads.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 flex items-center gap-2.5 text-[14px] text-white/90">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 accent-[#FFD400]"
              />
              Pin to top
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={onSubmit} disabled={saving || !body.trim()} className={PRIMARY_BTN}>
                {saving ? "Saving" : editId ? "Update" : "Publish"}
              </button>
              <button onClick={resetForm} className={SECONDARY_BTN}>
                Cancel
              </button>
              {saveError && <span className="text-[13px] text-down">{saveError}</span>}
            </div>
          </Panel>
        )}

        <Panel
          title="Founder channel"
          sub={`${posts.length} posts · ${posts.filter((p) => !p.published).length} drafts`}
          action={
            !showForm && (
              <button onClick={() => { resetForm(); setShowForm(true); }} className={cn(PRIMARY_BTN, "h-9 px-4 text-[13px]")}>
                New post
              </button>
            )
          }
        >
          {posts.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-white/40">No broadcasts yet.</p>
          ) : (
            <div className="-mx-5 divide-y divide-white/[0.07] border-t border-white/[0.07]">
              {posts.map((post) => (
                <article key={post.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                        <span className="font-semibold text-white">{post.author}</span>
                        {post.thread && <span className="text-white/55">in {post.thread.title}</span>}
                        {post.pinned && <span className="font-medium text-brand">Pinned</span>}
                        <span className={post.published ? "font-medium text-up" : "font-medium text-white/40"}>
                          {post.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-white/30">{formatWibDateTime(post.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => togglePublish(post)} className={SMALL_BTN}>
                        {post.published ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => startEdit(post)} className={SMALL_BTN}>
                        Edit
                      </button>
                      <button onClick={() => onDelete(post.id)} className={cn(SMALL_BTN, "text-down")}>
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className={cn("mt-2 whitespace-pre-wrap text-[14px] leading-[21px]", post.published ? "text-white/90" : "text-white/55")}>
                    {post.body}
                  </p>
                  {post.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt="" className="mt-3 max-h-64 max-w-full rounded-xl" />
                  )}
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.map((t) => (
                        <span key={t} className="rounded-full border border-white/[0.12] px-2 py-px text-[11px] text-white/60">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Panel
          title="Threads"
          sub="Order sets how they appear to members."
          action={
            !showThreadForm && (
              <button onClick={() => { resetThreadForm(); setShowThreadForm(true); }} className={SMALL_BTN}>
                New thread
              </button>
            )
          }
        >
          {showThreadForm && (
            <div className="mb-4 space-y-3">
              <label className="block">
                <span className={LABEL}>{editThreadId ? "Edit thread title" : "Title"}</span>
                <input
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  maxLength={50}
                  placeholder="e.g. Gold Thesis"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Description (optional)</span>
                <input
                  value={threadDesc}
                  onChange={(e) => setThreadDesc(e.target.value)}
                  maxLength={200}
                  placeholder="Short description"
                  className={INPUT}
                />
              </label>
              <div className="flex gap-2">
                <button onClick={onThreadSubmit} disabled={savingThread || !threadTitle.trim()} className={cn(PRIMARY_BTN, "h-10")}>
                  {savingThread ? "Saving" : editThreadId ? "Update" : "Create"}
                </button>
                <button onClick={resetThreadForm} className={cn(SECONDARY_BTN, "h-10")}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {threads.length === 0 ? (
            <p className="text-[14px] text-white/40">No threads yet.</p>
          ) : (
            <div className="-mx-5 divide-y divide-white/[0.07] border-t border-white/[0.07]">
              {threads.map((t, i) => (
                <div key={t.id} className="flex items-center gap-2 px-5 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[14px] text-white/90">{t.title}</span>
                  <button
                    onClick={() => moveThread(t.id, "up")}
                    disabled={i === 0}
                    className={ICON_BTN}
                    title="Move up"
                    aria-label={`Move ${t.title} up`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveThread(t.id, "down")}
                    disabled={i === threads.length - 1}
                    className={ICON_BTN}
                    title="Move down"
                    aria-label={`Move ${t.title} down`}
                  >
                    ↓
                  </button>
                  <button onClick={() => startEditThread(t)} className={SMALL_BTN}>
                    Edit
                  </button>
                  <button onClick={() => onDeleteThread(t.id)} className={cn(SMALL_BTN, "text-down")}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </aside>
    </div>
  );
}

const LABEL = "block text-[13px] font-medium text-white/70";
const INPUT =
  "mt-2 h-11 w-full rounded-xl bg-raised px-4 text-[15px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const TEXTAREA =
  "mt-2 w-full resize-y rounded-xl bg-raised px-4 py-3 text-[15px] leading-[22px] text-white outline-none ring-1 ring-white/[0.08] placeholder:text-white/25 focus-visible:ring-brand";
const PRIMARY_BTN =
  "inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-[14px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
const SECONDARY_BTN =
  "inline-flex h-11 items-center justify-center rounded-full border border-white/[0.14] px-5 text-[14px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";
const SMALL_BTN =
  "shrink-0 rounded-full border border-white/[0.14] px-3 py-1 text-[12px] font-medium text-white transition-colors hover:bg-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand";
const ICON_BTN =
  "h-7 w-7 shrink-0 rounded-full text-[14px] text-white/55 transition-colors hover:bg-raised hover:text-white disabled:opacity-20";
