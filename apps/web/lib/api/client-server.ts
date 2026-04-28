import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "@/lib/config/public";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100";

async function getAccessToken(): Promise<string | null> {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  const tokenCookie = allCookies.find(
    (c) => c.name.endsWith("-auth-token") || c.name.includes("sb-") && c.name.includes("auth-token"),
  );

  if (!tokenCookie) {
    const supabase = createClient(
      publicConfig.NEXT_PUBLIC_SUPABASE_URL,
      publicConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { cookie: cookieStore.toString() } },
        auth: { flowType: "pkce" },
      },
    );
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  return null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function apiGet<T>(path: string, opts?: { token?: string }): Promise<T> {
  const token = opts?.token ?? (await getAccessToken());
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export async function apiPost<T>(path: string, body?: unknown, opts?: { token?: string }): Promise<T> {
  const token = opts?.token ?? (await getAccessToken());
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export async function apiPut<T>(path: string, body?: unknown, opts?: { token?: string }): Promise<T> {
  const token = opts?.token ?? (await getAccessToken());
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export async function apiDelete(path: string, opts?: { token?: string }): Promise<void> {
  const token = opts?.token ?? (await getAccessToken());
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
}

export async function apiStream(
  path: string,
  body: unknown,
  onChunk: (text: string) => void,
  opts?: { token?: string },
): Promise<void> {
  const token = opts?.token ?? (await getAccessToken());
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export { API_BASE };
