"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/cn";

interface ChannelPost {
  id: string;
  author: string;
  body: string;
  image_url: string | null;
  tags: string[];
  pinned: boolean;
  published: boolean;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100";

function getToken(): string | null {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("access_token="))
    ?.split("=")
    .slice(1)
    .join("=") ?? null;
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("Anthony");
  const [tags, setTags] = useState("");
  const [pinned, setPinned] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const json = await apiFetch("/channel/admin/all");
      setPosts(json.data ?? []);
    } catch {
      setPosts([]);
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
    setImagePreview(null);
    setImageFile(null);
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(post: ChannelPost) {
    setBody(post.body);
    setAuthor(post.author);
    setTags(post.tags.join(", "));
    setPinned(post.pinned);
    setImagePreview(post.image_url);
    setImageFile(null);
    setEditId(post.id);
    setShowForm(true);
  }

  async function handleImageUpload(file: File): Promise<string> {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit() {
    if (!body.trim()) return;
    setSaving(true);

    try {
      let imageUrl = imagePreview;
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const payload = {
        body: body.trim(),
        author,
        image_url: imageUrl,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        pinned,
        published: true,
      };

      if (editId) {
        await apiFetch(`/channel/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/channel", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await load();
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
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-brand px-4 py-2 font-mono text-[10px] uppercase tracking-widest2 text-black transition-colors hover:bg-brand-dim hover:text-white focus-visible:ring-1 focus-visible:ring-brand focus-visible:outline-none"
        >
          + New Post
        </button>
      </div>

      <div className="mt-8 h-px bg-white/20" />

      {showForm && (
        <div className="mt-6 border border-brand/40 bg-black p-6">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-widest2 text-brand">
            {editId ? "Edit Post" : "New Broadcast"}
          </div>

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
                  setImageFile(file);
                  const url = URL.createObjectURL(file);
                  setImagePreview(url);
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

          <div className="mb-4 grid grid-cols-2 gap-4">
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
                    {new Date(post.created_at).toLocaleString()}
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
              {post.image_url && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
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
