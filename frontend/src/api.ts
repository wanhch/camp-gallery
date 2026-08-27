import type { AdminMediaItem, Category, MediaItem, MediaStatus, PlatformConfig, PlatformStats, UploadProfile } from "./types";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
async function parseResponse<T>(response: Response): Promise<T> { if (response.status === 204) return undefined as T; const payload = await response.json() as T & { message?: string }; if (!response.ok) throw new Error(payload.message || "请求未能完成，请稍后重试"); return payload; }
const request = (path: string, init?: RequestInit) => fetch(`${API_BASE}${path}`, init);
export async function fetchMedia(company?: number, type?: string) { const params = new URLSearchParams({ limit: "200" }); if (company) params.set("categoryId", String(company)); if (type && type !== "all") params.set("type", type); return parseResponse<{ items: MediaItem[]; total: number }>(await request(`/api/v1/media?${params}`)); }
export async function fetchStats() { return parseResponse<PlatformStats>(await request("/api/v1/stats")); }
export async function fetchConfig() { return parseResponse<PlatformConfig>(await request("/api/v1/config")); }
export async function fetchCategories() { return parseResponse<{ items: Category[] }>(await request("/api/v1/categories")); }
export async function verifyUploader(name: string, categoryId: number) { return parseResponse<{ token: string; profile: UploadProfile }>(await request("/api/v1/auth/uploader", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, categoryId }) })); }
export async function loginAdmin(password: string) { return parseResponse<{ token: string }>(await request("/api/v1/auth/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })); }
export async function likeMedia(id: string) { return parseResponse<{ likes: number }>(await request(`/api/v1/media/${encodeURIComponent(id)}/like`, { method: "POST" })); }
export function uploadMedia(formData: FormData, token: string, onProgress: (progress: number) => void): Promise<MediaItem[]> { return new Promise((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open("POST", `${API_BASE}/api/v1/media`); xhr.setRequestHeader("Authorization", `Bearer ${token}`); xhr.upload.addEventListener("progress", (event) => event.lengthComputable && onProgress(Math.round(event.loaded / event.total * 100))); xhr.addEventListener("load", () => { try { const payload = JSON.parse(xhr.responseText) as { items?: MediaItem[]; message?: string }; xhr.status >= 200 && xhr.status < 300 && payload.items ? resolve(payload.items) : reject(new Error(payload.message || "上传未能完成")); } catch { reject(new Error("服务器返回了无法识别的响应")); } }); xhr.addEventListener("error", () => reject(new Error("网络连接中断，请检查后重试"))); xhr.send(formData); }); }
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
export async function fetchAdminMedia(token: string) { return parseResponse<{ items: AdminMediaItem[] }>(await request("/api/v1/admin/media", { headers: authHeaders(token) })); }
export async function exportAdminMedia(token: string, filters: { categoryId?: number; q?: string; status?: "all" | MediaStatus }) {
  const params = new URLSearchParams();
  if (filters.categoryId) params.set("categoryId", String(filters.categoryId));
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const response = await request(`/api/v1/admin/export?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || "导出失败，请稍后重试");
  }
  return response.blob();
}
export async function updateAdminMedia(token: string, id: string, patch: { status?: MediaStatus; featured?: boolean }) { return parseResponse<{ item: AdminMediaItem }>(await request(`/api/v1/admin/media/${encodeURIComponent(id)}`, { method: "PATCH", headers: authHeaders(token), body: JSON.stringify(patch) })); }
export async function deleteAdminMedia(token: string, id: string) { await parseResponse<void>(await request(`/api/v1/admin/media/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders(token) })); }
export async function generateAiTitle(token: string, id: string) { return parseResponse<{ title: string; provider: string; message: string }>(await request(`/api/v1/admin/media/${encodeURIComponent(id)}/ai`, { method: "POST", headers: authHeaders(token) })); }
