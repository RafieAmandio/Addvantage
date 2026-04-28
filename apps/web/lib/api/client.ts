import { supabaseBrowser } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100";

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: "GET", headers });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export async function apiDelete(path: string): Promise<void> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
}

export async function apiStreamFetch(
  path: string,
  body: unknown,
): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export { API_BASE };
