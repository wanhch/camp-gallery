import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, Eye, EyeOff, QrCode as QrIcon, Search, Sparkles, Star, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { deleteAdminMedia, exportAdminMedia, fetchAdminMedia, generateAiTitle, loginAdmin, updateAdminMedia } from "../api";
import { uploadCategories } from "../data/companies";
import { Link } from "../router";
import type { AdminMediaItem, MediaStatus } from "../types";

const entries = [["上传入口", "/upload"], ["观看入口", "/gallery"], ["管理入口", "/admin"]] as const;
type StatusFilter = "all" | MediaStatus;

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("camp_admin_token") || "");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<AdminMediaItem[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState(0);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [exporting, setExporting] = useState(false);
  const [codes, setCodes] = useState<Record<string, string>>({});

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("zh-CN");
    return items.filter((item) => {
      if (categoryId && item.categoryId !== categoryId) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!keyword) return true;
      return [item.caption, item.originalCaption || "", item.aiTitle || "", item.uploaderName, item.categoryName, item.id, item.url]
        .some((value) => value.toLocaleLowerCase("zh-CN").includes(keyword));
    });
  }, [categoryId, items, query, status]);

  const load = async (value = token) => {
    if (!value) return;
    try {
      setItems((await fetchAdminMedia(value)).items);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "加载失败");
    }
  };

  useEffect(() => { void load(); }, [token]);
  useEffect(() => {
    Promise.all(entries.map(async ([label, route]) => [label, await QRCode.toDataURL(`${location.origin}${route}`, { width: 360, margin: 1 })] as const))
      .then((pairs) => setCodes(Object.fromEntries(pairs)));
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const result = await loginAdmin(password);
      sessionStorage.setItem("camp_admin_token", result.token);
      setToken(result.token);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败");
    }
  };

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusy(id);
    setError("");
    try {
      await action();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "操作失败");
    } finally {
      setBusy("");
    }
  };

  const downloadExport = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await exportAdminMedia(token, { categoryId: categoryId || undefined, q: query, status });
      const category = uploadCategories.find((item) => item.id === categoryId);
      const scope = category ? `${category.number}-${category.name}` : "全部素材";
      const safeScope = scope.replace(/[<>:"/\\|?*]/g, "-");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Camp-Gallery-${safeScope}-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  if (!token) return <main className="standalone-page admin-login"><section className="standalone-card"><span className="section-kicker">ADMIN CONSOLE</span><h1>管理入口</h1><p>管理素材、精选内容和三个演示入口。</p><form onSubmit={login}><label className="field"><span>管理员密码</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /></label>{error && <p className="form-error">{error}</p>}<button className="button button--primary">登录管理台</button></form><Link href="/gallery">返回观看页</Link></section></main>;

  return <main className="admin-page">
    <header className="admin-header"><div><span className="section-kicker">CAMP GALLERY</span><h1>素材管理台</h1></div><div><a className="button button--outline" href="/screen" target="_blank">打开大屏</a><button className="button button--quiet" onClick={() => { sessionStorage.removeItem("camp_admin_token"); setToken(""); }}>退出</button></div></header>
    {error && <p className="form-error admin-error">{error}</p>}
    <section className="admin-section"><h2><QrIcon />三个二维码入口</h2><div className="qr-entry-grid">{entries.map(([label, route]) => <article key={route}><strong>{label}</strong>{codes[label] && <img src={codes[label]} alt={`${label}二维码`} />}<code>{location.origin}{route}</code></article>)}</div></section>
    <section className="admin-section">
      <div className="admin-section-title"><div><h2>素材检索与导出</h2><p>按关键词、连队和展示状态筛选，一键打包当前结果。</p></div><span>{filteredItems.length} / {items.length} 条</span></div>
      <div className="admin-export-toolbar">
        <label className="admin-search"><Search /><span className="sr-only">检索素材</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文案、上传者或素材 ID" /></label>
        <label><span>连队/分类</span><select value={categoryId} onChange={(event) => setCategoryId(Number(event.target.value))}><option value={0}>全部连队与工作人员</option>{uploadCategories.map((category) => <option key={category.id} value={category.id}>{category.number === "STAFF" ? category.name : `第 ${category.number} 连 · ${category.name}`}</option>)}</select></label>
        <label><span>展示状态</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="all">全部状态</option><option value="public">公开展示</option><option value="hidden">已隐藏</option></select></label>
        <button className="button button--primary admin-export-button" disabled={exporting || filteredItems.length === 0} onClick={() => void downloadExport()}><Download />{exporting ? "正在打包…" : `一键导出 ${filteredItems.length} 条`}</button>
      </div>
      {filteredItems.length === 0 ? <div className="admin-empty"><Search /><strong>没有匹配的素材</strong><span>请调整关键词、连队或状态筛选条件。</span></div> : <div className="admin-media-grid">{filteredItems.map((item) => <article className={`admin-media-card ${item.status === "hidden" ? "is-hidden" : ""}`} key={item.id}>
        <div className="admin-media-preview">{item.type === "video" ? <video src={item.url} muted /> : <img src={item.thumbnailUrl || item.url} alt={item.caption} />}{item.featured && <span className="featured-badge"><Star />精选</span>}</div>
        <div className="admin-media-body"><small>{item.categoryName} · 上传者：{item.uploaderName}</small><strong>{item.caption}</strong><span>{item.status === "public" ? "公开展示" : "已隐藏"}</span></div>
        <div className="admin-media-actions">
          <button disabled={busy === item.id} onClick={() => run(item.id, () => updateAdminMedia(token, item.id, { featured: !item.featured }))}><Star />{item.featured ? "取消精选" : "设为精选"}</button>
          <button disabled={busy === item.id} onClick={() => run(item.id, () => generateAiTitle(token, item.id))}><Sparkles />AI 文案</button>
          <button disabled={busy === item.id} onClick={() => run(item.id, () => updateAdminMedia(token, item.id, { status: item.status === "public" ? "hidden" : "public" }))}>{item.status === "public" ? <EyeOff /> : <Eye />}{item.status === "public" ? "隐藏" : "恢复"}</button>
          <button className="danger" disabled={busy === item.id} onClick={() => { if (confirm("确定删除这条素材吗？此操作不可恢复。")) void run(item.id, () => deleteAdminMedia(token, item.id)); }}><Trash2 />删除</button>
        </div>
      </article>)}</div>}
    </section>
  </main>;
}
