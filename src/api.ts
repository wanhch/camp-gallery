import type { MediaItem, PlatformConfig, PlatformStats } from "./types";

interface MediaResponse {
  items: MediaItem[];
  total: number;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message || "请求未能完成，请稍后重试");
  }
  return payload;
}

export async function fetchMedia(company?: number, type?: string): Promise<MediaResponse> {
  const params = new URLSearchParams({ limit: "120" });
  if (company) params.set("company", String(company));
  if (type && type !== "all") params.set("type", type);
  const response = await fetch(`/api/media?${params.toString()}`);
  return parseResponse<MediaResponse>(response);
}

export async function fetchStats(): Promise<PlatformStats> {
  const response = await fetch("/api/stats");
  return parseResponse<PlatformStats>(response);
}

export async function fetchConfig(): Promise<PlatformConfig> {
  const response = await fetch("/api/config");
  return parseResponse<PlatformConfig>(response);
}

export async function likeMedia(id: string): Promise<{ likes: number }> {
  const response = await fetch(`/api/media/${encodeURIComponent(id)}/like`, { method: "POST" });
  return parseResponse<{ likes: number }>(response);
}

export function uploadMedia(
  formData: FormData,
  uploadCode: string,
  onProgress: (progress: number) => void
): Promise<MediaItem[]> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/media");
    if (uploadCode) request.setRequestHeader("x-upload-code", uploadCode);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      try {
        const payload = JSON.parse(request.responseText) as { items?: MediaItem[]; message?: string };
        if (request.status >= 200 && request.status < 300 && payload.items) {
          resolve(payload.items);
        } else {
          reject(new Error(payload.message || "上传未能完成，请重试"));
        }
      } catch {
        reject(new Error("服务器返回了无法识别的响应"));
      }
    });
    request.addEventListener("error", () => reject(new Error("网络连接中断，请检查后重试")));
    request.send(formData);
  });
}
