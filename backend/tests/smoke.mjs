import { readFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.TEST_API_URL || "http://127.0.0.1:8787/api/v1";
const check = (condition, message) => { if (!condition) throw new Error(message); };
const json = async (route, init) => {
  const response = await fetch(`${base}${route}`, init);
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${route}: ${body?.message || response.status}`);
  return body;
};
const postJson = (route, body, token) => json(route, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });

const health = await json("/health");
const categories = await json("/categories");
const trainee = await postJson("/auth/uploader", { name: "万浩川", categoryId: 10 });
const staff = await postJson("/auth/uploader", { name: "田洪泉", categoryId: 17 });
const admin = await postJson("/auth/admin", { password: "sugonhygon" });
let invalidRejected = false;
try { await postJson("/auth/uploader", { name: "万浩川", categoryId: 9 }); } catch { invalidRejected = true; }

const form = new FormData();
const source = await readFile(path.resolve("../frontend/public/demo/warmup.jpg"));
form.append("files", new Blob([source], { type: "image/jpeg" }), "smoke-test.jpg");
form.append("caption", "接口联调测试素材");
const uploaded = await json("/media", { method: "POST", headers: { authorization: `Bearer ${trainee.token}` }, body: form });
const id = uploaded.items[0]?.id;
check(id, "upload did not return an item");

try {
  const publicMedia = await json("/media?categoryId=10");
  const adminMedia = await json("/admin/media", { headers: { authorization: `Bearer ${admin.token}` } });
  const exportResponse = await fetch(`${base}/admin/export?categoryId=10&q=${encodeURIComponent("接口联调")}`, { headers: { authorization: `Bearer ${admin.token}` } });
  const exportBytes = new Uint8Array(await exportResponse.arrayBuffer());
  const ai = await postJson(`/admin/media/${id}/ai`, {}, admin.token);
  const featured = await json(`/admin/media/${id}`, { method: "PATCH", headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/json" }, body: JSON.stringify({ featured: true }) });
  await json(`/admin/media/${id}`, { method: "PATCH", headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/json" }, body: JSON.stringify({ status: "hidden" }) });
  const afterHide = await json("/media?categoryId=10");

  check(health.ok, "health failed");
  check(categories.items.length === 17, "expected 17 categories");
  check(categories.items.find((item) => item.id === 15)?.name === "满月连", "company names were not synchronized");
  check(trainee.profile.name === "万浩川" && staff.profile.name === "田洪泉", "roster verification failed");
  check(invalidRejected, "invalid category should be rejected");
  check(!Object.hasOwn(publicMedia.items.find((item) => item.id === id), "uploaderName"), "public API leaked uploader name");
  check(adminMedia.items.some((item) => item.id === id && item.uploaderName === "万浩川"), "admin cannot see uploader audit field");
  check(exportResponse.ok && exportResponse.headers.get("content-type")?.includes("application/zip"), "filtered admin export did not return a ZIP");
  check(exportBytes[0] === 0x50 && exportBytes[1] === 0x4b && Number(exportResponse.headers.get("x-export-count")) >= 1, "admin export ZIP is invalid or empty");
  check(ai.provider === "demo" && featured.item.featured, "AI demo or featured flow failed");
  check(!afterHide.items.some((item) => item.id === id), "hidden media remained public");
  console.log("Smoke test passed: roster, upload, privacy, admin export, AI demo and visibility state.");
} finally {
  await json(`/admin/media/${id}`, { method: "DELETE", headers: { authorization: `Bearer ${admin.token}` } });
}
