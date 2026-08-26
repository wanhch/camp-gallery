import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import express from "express";
import multer from "multer";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const storageDir = path.join(rootDir, "storage");
const mediaDir = path.join(storageDir, "media");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 8787);
const maxFileMb = Math.max(1, Number(process.env.MAX_FILE_MB || 120));
const uploadCode = process.env.UPLOAD_CODE?.trim() || "";

mkdirSync(mediaDir, { recursive: true });

const database = new DatabaseSync(path.join(storageDir, "sugon-stars.db"));
database.exec("PRAGMA journal_mode = WAL");
database.exec(`
  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('photo', 'video')),
    thumbnail_url TEXT,
    company INTEGER NOT NULL CHECK(company BETWEEN 1 AND 16),
    author TEXT NOT NULL,
    caption TEXT NOT NULL,
    created_at TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_media_company ON media(company);
`);

const demoRows = [
  ["demo-01", "/demo/hero-huddle.jpg", 1, "一连影像员", "晨光里，我们把目标喊得更响。", "2026-08-25T07:36:00.000Z", 126],
  ["demo-02", "/demo/team-game.jpg", 4, "四连影像员", "并肩用力的瞬间，胜负之外更见默契。", "2026-08-24T15:12:00.000Z", 98],
  ["demo-03", "/demo/team-briefing.jpg", 2, "二连影像员", "听清每一项任务，也听见彼此的声音。", "2026-08-24T08:20:00.000Z", 84],
  ["demo-04", "/demo/team-energy.jpg", 7, "七连影像员", "年轻的答案，是全力以赴。", "2026-08-23T16:45:00.000Z", 112],
  ["demo-05", "/demo/outdoor-collab.jpg", 6, "六连影像员", "不同专业在这里汇成同一个团队。", "2026-08-23T10:28:00.000Z", 76],
  ["demo-06", "/demo/campus-collab.jpg", 10, "十连影像员", "从一次交流开始，成为可以托付后背的伙伴。", "2026-08-22T14:06:00.000Z", 69],
  ["demo-07", "/demo/field-training.jpg", 12, "十二连影像员", "步频一致，方向一致，目标一致。", "2026-08-22T09:16:00.000Z", 105],
  ["demo-08", "/demo/warmup.jpg", 15, "十五连影像员", "认真准备，也享受每一次突破。", "2026-08-21T06:48:00.000Z", 57]
] as const;

const seed = database.prepare(`
  INSERT OR IGNORE INTO media
    (id, url, type, thumbnail_url, company, author, caption, created_at, likes, is_demo)
  VALUES (?, ?, 'photo', NULL, ?, ?, ?, ?, ?, 1)
`);
for (const row of demoRows) seed.run(...row);

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/heic", ".heic"],
  ["image/heif", ".heif"],
  ["video/mp4", ".mp4"],
  ["video/quicktime", ".mov"],
  ["video/webm", ".webm"]
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: mediaDir,
    filename: (_request, file, callback) => {
      const extension = allowedMimeTypes.get(file.mimetype) || path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    }
  }),
  limits: { fileSize: maxFileMb * 1024 * 1024, files: 10 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("仅支持 JPG、PNG、WebP、HEIC、MP4、MOV 与 WebM 文件"));
      return;
    }
    callback(null, true);
  }
});

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(mediaDir, { maxAge: "30d", immutable: true }));

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return (text || fallback).slice(0, maxLength);
}

function serialize(row: Record<string, unknown>) {
  return {
    id: row.id,
    url: row.url,
    type: row.type,
    thumbnailUrl: row.thumbnail_url,
    company: row.company,
    author: row.author,
    caption: row.caption,
    createdAt: row.created_at,
    likes: row.likes,
    isDemo: Boolean(row.is_demo)
  };
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/config", (_request, response) => {
  response.json({ uploadCodeRequired: Boolean(uploadCode), maxFileMb, maxFiles: 10 });
});

app.get("/api/stats", (_request, response) => {
  const totals = database
    .prepare("SELECT COUNT(*) AS media, SUM(type = 'photo') AS photos, SUM(type = 'video') AS videos FROM media")
    .get() as Record<string, number | null>;
  response.json({
    trainees: 736,
    companies: 16,
    media: totals.media || 0,
    photos: totals.photos || 0,
    videos: totals.videos || 0
  });
});

app.get("/api/media", (request, response) => {
  const conditions: string[] = [];
  const values: Array<string | number> = [];
  const company = Number(request.query.company);
  const type = String(request.query.type || "");
  const limit = Math.min(200, Math.max(1, Number(request.query.limit || 60)));
  const offset = Math.max(0, Number(request.query.offset || 0));

  if (Number.isInteger(company) && company >= 1 && company <= 16) {
    conditions.push("company = ?");
    values.push(company);
  }
  if (type === "photo" || type === "video") {
    conditions.push("type = ?");
    values.push(type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = database
    .prepare(`SELECT * FROM media ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...values, limit, offset) as Record<string, unknown>[];
  const count = database.prepare(`SELECT COUNT(*) AS total FROM media ${where}`).get(...values) as { total: number };
  response.json({ items: rows.map(serialize), total: count.total });
});

app.post("/api/media", (request, response, next) => {
  if (uploadCode && request.header("x-upload-code") !== uploadCode) {
    response.status(401).json({ message: "集训口令不正确，请向连队影像员确认" });
    return;
  }
  next();
}, upload.array("files", 10), (request, response) => {
  const files = request.files as Express.Multer.File[];
  if (!files?.length) {
    response.status(400).json({ message: "请至少选择一张照片或一段视频" });
    return;
  }

  const company = Number(request.body.company);
  if (!Number.isInteger(company) || company < 1 || company > 16) {
    for (const file of files) unlinkSync(file.path);
    response.status(400).json({ message: "请选择所属连队" });
    return;
  }

  const author = cleanText(request.body.author, "曙光新星", 32);
  const caption = cleanText(request.body.caption, "记录此刻，共赴曙光。", 160);
  const insert = database.prepare(`
    INSERT INTO media
      (id, url, type, thumbnail_url, company, author, caption, created_at, likes, is_demo)
    VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 0, 0)
  `);
  let createdItems: ReturnType<typeof serialize>[] = [];
  database.exec("BEGIN IMMEDIATE");
  try {
    createdItems = files.map((file, index) => {
      const id = randomUUID();
      const type = file.mimetype.startsWith("video/") ? "video" : "photo";
      const createdAt = new Date(Date.now() + index).toISOString();
      const url = `/uploads/${file.filename}`;
      insert.run(id, url, type, company, author, caption, createdAt);
      return serialize({
        id,
        url,
        type,
        thumbnail_url: null,
        company,
        author,
        caption,
        created_at: createdAt,
        likes: 0,
        is_demo: 0
      });
    });
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    for (const file of files) {
      if (existsSync(file.path)) unlinkSync(file.path);
    }
    throw error;
  }

  response.status(201).json({ items: createdItems });
});

app.post("/api/media/:id/like", (request, response) => {
  const result = database.prepare("UPDATE media SET likes = likes + 1 WHERE id = ?").run(request.params.id);
  if (!result.changes) {
    response.status(404).json({ message: "这条记录不存在或已被移除" });
    return;
  }
  const row = database.prepare("SELECT likes FROM media WHERE id = ?").get(request.params.id) as { likes: number };
  response.json({ likes: row.likes });
});

if (existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: "1h" }));
  app.get("/*splat", (_request, response) => response.sendFile(path.join(distDir, "index.html")));
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
    ? `单个文件不能超过 ${maxFileMb}MB`
    : error instanceof Error ? error.message : "服务器暂时无法处理该请求";
  response.status(400).json({ message });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Sugon Stars API listening on http://0.0.0.0:${port}`);
});
