import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(backendDir, ".env") });

const storageDir = path.join(backendDir, "storage");
const mediaDir = path.join(storageDir, "media");
const port = Number(process.env.PORT || 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim() || "http://localhost:5173";
const publicApiUrl = process.env.PUBLIC_API_URL?.replace(/\/$/, "") || "";
const maxFileMb = Math.max(1, Number(process.env.MAX_FILE_MB || 100));
const maxFiles = Math.max(1, Math.min(20, Number(process.env.MAX_FILES || 20)));
const adminPassword = process.env.ADMIN_PASSWORD || "sugonhygon";
const authSecret = process.env.AUTH_SECRET || "camp-gallery-local-demo-secret-change-before-deploy";

mkdirSync(mediaDir, { recursive: true });

const database = new DatabaseSync(path.join(storageDir, "camp-gallery.db"));
database.exec("PRAGMA journal_mode = WAL");
database.exec("PRAGMA foreign_keys = ON");
database.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    number TEXT,
    kind TEXT NOT NULL CHECK(kind IN ('company', 'staff')),
    rankable INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS roster (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    active INTEGER NOT NULL DEFAULT 1,
    UNIQUE(name, category_id)
  );
  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('photo', 'video')),
    thumbnail_url TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    uploader_name TEXT NOT NULL,
    caption TEXT NOT NULL,
    ai_title TEXT,
    created_at TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'public' CHECK(status IN ('public', 'hidden', 'deleted')),
    featured INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_media_category ON media(category_id);
  CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
`);

const insertCategory = database.prepare(`
  INSERT OR IGNORE INTO categories (id, slug, name, number, kind, rankable)
  VALUES (?, ?, ?, ?, ?, ?)
`);
for (let index = 1; index <= 16; index += 1) {
  insertCategory.run(index, `company-${index}`, `第${index}连`, String(index).padStart(2, "0"), "company", 1);
}
insertCategory.run(17, "staff", "工作人员／辅导老师", null, "staff", 0);

const insertRoster = database.prepare(`
  INSERT OR IGNORE INTO roster (id, name, category_id, active) VALUES (?, ?, ?, 1)
`);
for (const [name, categoryId] of [["万浩川", 10], ["高展", 10], ["杨婉颖", 10], ["田洪泉", 17]] as const) {
  insertRoster.run(randomUUID(), name, categoryId);
}

const demoRows = [
  ["demo-01", "/demo/hero-huddle.jpg", 1, "晨光里，我们把目标喊得更响。", 126],
  ["demo-02", "/demo/team-game.jpg", 4, "并肩用力的瞬间，胜负之外更见默契。", 98],
  ["demo-03", "/demo/team-briefing.jpg", 2, "听清每一项任务，也听见彼此的声音。", 84],
  ["demo-04", "/demo/team-energy.jpg", 7, "年轻的答案，是全力以赴。", 112],
  ["demo-05", "/demo/outdoor-collab.jpg", 6, "不同专业在这里汇成同一个团队。", 76],
  ["demo-06", "/demo/campus-collab.jpg", 10, "从一次交流开始，成为可以托付后背的伙伴。", 69],
  ["demo-07", "/demo/field-training.jpg", 12, "步频一致，方向一致，目标一致。", 105],
  ["demo-08", "/demo/warmup.jpg", 15, "认真准备，也享受每一次突破。", 57]
] as const;
const insertDemo = database.prepare(`
  INSERT OR IGNORE INTO media
    (id, url, type, thumbnail_url, category_id, uploader_name, caption, ai_title, created_at, likes, is_demo, status, featured)
  VALUES (?, ?, 'photo', NULL, ?, '演示素材', ?, NULL, ?, ?, 1, 'public', ?)
`);
demoRows.forEach((row, index) => insertDemo.run(row[0], row[1], row[2], row[3], new Date(Date.UTC(2026, 7, 25 - index, 8)).toISOString(), row[4], index < 3 ? 1 : 0));

type Role = "uploader" | "admin";
interface AuthPayload { role: Role; name?: string; categoryId?: number; exp: number }
interface AuthedRequest extends Request { auth?: AuthPayload }

function encodeToken(payload: AuthPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", authSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function decodeToken(token: string): AuthPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", authSecret).update(body).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AuthPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function requireRole(role: Role) {
  return (request: AuthedRequest, response: Response, next: NextFunction) => {
    const token = request.header("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const payload = decodeToken(token);
    if (!payload || payload.role !== role) {
      response.status(401).json({ message: role === "admin" ? "请先完成管理员登录" : "请先使用名单验证身份" });
      return;
    }
    request.auth = payload;
    next();
  };
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return (text || fallback).slice(0, maxLength);
}

function safeEqual(value: string, expected: string): boolean {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"],
  ["image/heic", ".heic"], ["image/heif", ".heif"], ["video/mp4", ".mp4"],
  ["video/quicktime", ".mov"], ["video/webm", ".webm"]
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: mediaDir,
    filename: (_request, file, callback) => callback(null, `${Date.now()}-${randomUUID()}${allowedMimeTypes.get(file.mimetype) || ""}`)
  }),
  limits: { fileSize: maxFileMb * 1024 * 1024, files: maxFiles },
  fileFilter: (_request, file, callback) => allowedMimeTypes.has(file.mimetype)
    ? callback(null, true)
    : callback(new Error("仅支持 JPG、PNG、WebP、HEIC、MP4、MOV 与 WebM 文件"))
});

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((request, response, next) => {
  const origin = request.header("origin");
  if (origin && (origin === frontendOrigin || frontendOrigin === "*")) {
    response.header("Access-Control-Allow-Origin", origin);
    response.header("Vary", "Origin");
  }
  response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (request.method === "OPTIONS") { response.sendStatus(204); return; }
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(mediaDir, { maxAge: "30d", immutable: true }));

function apiOrigin(request: Request) {
  return publicApiUrl || `${request.protocol}://${request.get("host")}`;
}

function serializePublic(row: Record<string, unknown>, request: Request) {
  const rawUrl = String(row.url);
  const rawThumb = row.thumbnail_url ? String(row.thumbnail_url) : null;
  return {
    id: row.id,
    url: rawUrl.startsWith("/uploads/") ? `${apiOrigin(request)}${rawUrl}` : rawUrl,
    type: row.type,
    thumbnailUrl: rawThumb?.startsWith("/uploads/") ? `${apiOrigin(request)}${rawThumb}` : rawThumb,
    company: row.category_id,
    categoryId: row.category_id,
    caption: row.ai_title || row.caption,
    createdAt: row.created_at,
    likes: row.likes,
    isDemo: Boolean(row.is_demo),
    featured: Boolean(row.featured)
  };
}

app.get("/api/v1/health", (_request, response) => response.json({ ok: true }));
app.get("/api/v1/config", (_request, response) => response.json({ maxFileMb, maxFiles, aiMode: "demo" }));
app.get("/api/v1/categories", (_request, response) => {
  const rows = database.prepare("SELECT * FROM categories ORDER BY id").all() as Record<string, unknown>[];
  response.json({ items: rows.map((row) => ({ ...row, rankable: Boolean(row.rankable) })) });
});

app.post("/api/v1/auth/uploader", (request, response) => {
  const name = cleanText(request.body.name, "", 32);
  const categoryId = Number(request.body.categoryId);
  const person = database.prepare("SELECT name, category_id FROM roster WHERE name = ? AND category_id = ? AND active = 1").get(name, categoryId) as { name: string; category_id: number } | undefined;
  if (!person) { response.status(401).json({ message: "姓名与所选身份不匹配，请检查后重试" }); return; }
  const token = encodeToken({ role: "uploader", name: person.name, categoryId: person.category_id, exp: Date.now() + 8 * 60 * 60 * 1000 });
  response.json({ token, profile: { name: person.name, categoryId: person.category_id } });
});

app.post("/api/v1/auth/admin", (request, response) => {
  if (!safeEqual(String(request.body.password || ""), adminPassword)) {
    response.status(401).json({ message: "管理员密码不正确" }); return;
  }
  response.json({ token: encodeToken({ role: "admin", exp: Date.now() + 8 * 60 * 60 * 1000 }) });
});

app.get("/api/v1/stats", (_request, response) => {
  const totals = database.prepare(`SELECT COUNT(*) media, SUM(type='photo') photos, SUM(type='video') videos FROM media WHERE status='public'`).get() as Record<string, number | null>;
  const ranking = database.prepare(`
    SELECT c.id categoryId, c.name, COUNT(m.id) count
    FROM categories c LEFT JOIN media m ON m.category_id=c.id AND m.status='public'
    WHERE c.rankable=1 GROUP BY c.id ORDER BY count DESC, c.id ASC
  `).all();
  response.json({ trainees: 736, companies: 16, media: totals.media || 0, photos: totals.photos || 0, videos: totals.videos || 0, ranking });
});

app.get("/api/v1/media", (request, response) => {
  const conditions = ["m.status='public'"];
  const values: Array<string | number> = [];
  const categoryId = Number(request.query.categoryId || request.query.company);
  const type = String(request.query.type || "");
  const featured = String(request.query.featured || "");
  const limit = Math.min(200, Math.max(1, Number(request.query.limit || 60)));
  const offset = Math.max(0, Number(request.query.offset || 0));
  if (Number.isInteger(categoryId) && categoryId >= 1 && categoryId <= 17) { conditions.push("m.category_id=?"); values.push(categoryId); }
  if (type === "photo" || type === "video") { conditions.push("m.type=?"); values.push(type); }
  if (featured === "true") conditions.push("m.featured=1");
  const where = `WHERE ${conditions.join(" AND ")}`;
  const rows = database.prepare(`SELECT m.* FROM media m ${where} ORDER BY m.featured DESC, m.created_at DESC LIMIT ? OFFSET ?`).all(...values, limit, offset) as Record<string, unknown>[];
  const count = database.prepare(`SELECT COUNT(*) total FROM media m ${where}`).get(...values) as { total: number };
  response.json({ items: rows.map((row) => serializePublic(row, request)), total: count.total });
});

app.post("/api/v1/media", requireRole("uploader"), upload.array("files", maxFiles), (request: AuthedRequest, response) => {
  const files = request.files as Express.Multer.File[];
  if (!files?.length || !request.auth?.name || !request.auth.categoryId) {
    response.status(400).json({ message: "请至少选择一张照片或一段视频" }); return;
  }
  const categoryId = request.auth.categoryId;
  const uploaderName = request.auth.name;
  const caption = cleanText(request.body.caption, "记录此刻，共赴曙光。", 160);
  const insert = database.prepare(`INSERT INTO media
    (id,url,type,thumbnail_url,category_id,uploader_name,caption,ai_title,created_at,likes,is_demo,status,featured)
    VALUES (?,?,?,NULL,?,?,?,NULL,?,0,0,'public',0)`);
  const created: ReturnType<typeof serializePublic>[] = [];
  database.exec("BEGIN IMMEDIATE");
  try {
    files.forEach((file, index) => {
      const row = { id: randomUUID(), url: `/uploads/${file.filename}`, type: file.mimetype.startsWith("video/") ? "video" : "photo", category_id: categoryId, caption, created_at: new Date(Date.now() + index).toISOString(), likes: 0, is_demo: 0, featured: 0, thumbnail_url: null };
      insert.run(row.id, row.url, row.type, categoryId, uploaderName, caption, row.created_at);
      created.push(serializePublic(row, request));
    });
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    files.forEach((file) => { if (existsSync(file.path)) unlinkSync(file.path); });
    throw error;
  }
  response.status(201).json({ items: created });
});

app.post("/api/v1/media/:id/like", (request, response) => {
  const result = database.prepare("UPDATE media SET likes=likes+1 WHERE id=? AND status='public'").run(request.params.id);
  if (!result.changes) { response.status(404).json({ message: "素材不存在或已被隐藏" }); return; }
  const row = database.prepare("SELECT likes FROM media WHERE id=?").get(request.params.id) as { likes: number };
  response.json(row);
});

app.get("/api/v1/admin/media", requireRole("admin"), (request, response) => {
  const rows = database.prepare(`SELECT m.*, c.name category_name FROM media m JOIN categories c ON c.id=m.category_id WHERE m.status!='deleted' ORDER BY m.created_at DESC`).all() as Record<string, unknown>[];
  response.json({ items: rows.map((row) => ({ ...serializePublic(row, request), uploaderName: row.uploader_name, status: row.status, categoryName: row.category_name })) });
});

app.patch("/api/v1/admin/media/:id", requireRole("admin"), (request, response) => {
  const id = String(request.params.id);
  const status = request.body.status;
  const featured = request.body.featured;
  if (status !== undefined && status !== "public" && status !== "hidden") { response.status(400).json({ message: "素材状态无效" }); return; }
  if (status !== undefined) database.prepare("UPDATE media SET status=? WHERE id=? AND status!='deleted'").run(status, id);
  if (featured !== undefined) database.prepare("UPDATE media SET featured=? WHERE id=? AND status!='deleted'").run(featured ? 1 : 0, id);
  const row = database.prepare("SELECT * FROM media WHERE id=? AND status!='deleted'").get(id) as Record<string, unknown> | undefined;
  if (!row) { response.status(404).json({ message: "素材不存在" }); return; }
  response.json({ item: { ...serializePublic(row, request), uploaderName: row.uploader_name, status: row.status } });
});

app.post("/api/v1/admin/media/:id/ai", requireRole("admin"), (request, response) => {
  const id = String(request.params.id);
  const row = database.prepare(`SELECT m.*, c.name category_name FROM media m JOIN categories c ON c.id=m.category_id WHERE m.id=? AND m.status!='deleted'`).get(id) as Record<string, unknown> | undefined;
  if (!row) { response.status(404).json({ message: "素材不存在" }); return; }
  const suggestions = ["青春正当时，携手向曙光", "并肩砺初心，聚力赴新程", "每一次全力以赴，都在点亮未来"];
  const title = `${row.category_name} · ${suggestions[Math.abs(String(row.id).length + Number(row.category_id)) % suggestions.length]}`;
  database.prepare("UPDATE media SET ai_title=? WHERE id=?").run(title, id);
  response.json({ title, provider: "demo", message: "当前为 AI 效果演示，后续可替换为正式接口" });
});

app.delete("/api/v1/admin/media/:id", requireRole("admin"), (request, response) => {
  const id = String(request.params.id);
  const row = database.prepare("SELECT url,is_demo FROM media WHERE id=? AND status!='deleted'").get(id) as { url: string; is_demo: number } | undefined;
  if (!row) { response.status(404).json({ message: "素材不存在" }); return; }
  database.prepare("UPDATE media SET status='deleted', featured=0 WHERE id=?").run(id);
  if (!row.is_demo && row.url.startsWith("/uploads/")) {
    const filePath = path.join(mediaDir, path.basename(row.url));
    if (existsSync(filePath)) unlinkSync(filePath);
  }
  response.status(204).end();
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
    ? `单个文件不能超过 ${maxFileMb}MB`
    : error instanceof Error ? error.message : "服务器暂时无法处理该请求";
  response.status(400).json({ message });
});

app.listen(port, "0.0.0.0", () => console.log(`Camp Gallery API listening on http://0.0.0.0:${port}`));
