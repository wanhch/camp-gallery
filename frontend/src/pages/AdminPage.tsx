import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, QrCode as QrIcon, Sparkles, Star, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import { deleteAdminMedia, fetchAdminMedia, generateAiTitle, loginAdmin, updateAdminMedia } from "../api";
import type { AdminMediaItem } from "../types";

const entries = [["上传入口", "/upload"], ["观看入口", "/gallery"], ["管理入口", "/admin"]] as const;

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("camp_admin_token") || "");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<AdminMediaItem[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});

  const load = async (value = token) => { if (!value) return; try { setItems((await fetchAdminMedia(value)).items); } catch (reason) { setError(reason instanceof Error ? reason.message : "加载失败"); } };
  useEffect(() => { void load(); }, [token]);
  useEffect(() => { Promise.all(entries.map(async ([label, route]) => [label, await QRCode.toDataURL(`${location.origin}${route}`, { width: 360, margin: 1 })] as const)).then((pairs) => setCodes(Object.fromEntries(pairs))); }, []);

  const login = async (event: FormEvent) => { event.preventDefault(); setError(""); try { const result = await loginAdmin(password); sessionStorage.setItem("camp_admin_token", result.token); setToken(result.token); } catch (reason) { setError(reason instanceof Error ? reason.message : "登录失败"); } };
  const run = async (id: string, action: () => Promise<unknown>) => { setBusy(id); setError(""); try { await action(); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "操作失败"); } finally { setBusy(""); } };

  if (!token) return <main className="standalone-page admin-login"><section className="standalone-card"><span className="section-kicker">ADMIN CONSOLE</span><h1>管理入口</h1><p>管理素材、精选内容和三个演示入口。</p><form onSubmit={login}><label className="field"><span>管理员密码</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></label>{error && <p className="form-error">{error}</p>}<button className="button button--primary">登录管理台</button></form><a href="/gallery">返回观看页</a></section></main>;

  return <main className="admin-page">
    <header className="admin-header"><div><span className="section-kicker">CAMP GALLERY</span><h1>素材管理台</h1></div><div><a className="button button--outline" href="/screen" target="_blank">打开大屏</a><button className="button button--quiet" onClick={() => { sessionStorage.removeItem("camp_admin_token"); setToken(""); }}>退出</button></div></header>
    {error && <p className="form-error admin-error">{error}</p>}
    <section className="admin-section"><h2><QrIcon />三个二维码入口</h2><div className="qr-entry-grid">{entries.map(([label, route]) => <article key={route}><strong>{label}</strong>{codes[label] && <img src={codes[label]} alt={`${label}二维码`} />}<code>{location.origin}{route}</code></article>)}</div></section>
    <section className="admin-section"><div className="admin-section-title"><h2>全部素材</h2><span>{items.length} 条</span></div><div className="admin-media-grid">{items.map((item) => <article className={`admin-media-card ${item.status === "hidden" ? "is-hidden" : ""}`} key={item.id}>
      <div className="admin-media-preview">{item.type === "video" ? <video src={item.url} muted /> : <img src={item.url} alt={item.caption} />}{item.featured && <span className="featured-badge"><Star />精选</span>}</div>
      <div className="admin-media-body"><small>{item.categoryName} · 上传者：{item.uploaderName}</small><strong>{item.caption}</strong><span>{item.status === "public" ? "公开展示" : "已隐藏"}</span></div>
      <div className="admin-media-actions">
        <button disabled={busy === item.id} onClick={() => run(item.id, () => updateAdminMedia(token, item.id, { featured: !item.featured }))}><Star />{item.featured ? "取消精选" : "设为精选"}</button>
        <button disabled={busy === item.id} onClick={() => run(item.id, () => generateAiTitle(token, item.id))}><Sparkles />AI 文案</button>
        <button disabled={busy === item.id} onClick={() => run(item.id, () => updateAdminMedia(token, item.id, { status: item.status === "public" ? "hidden" : "public" }))}>{item.status === "public" ? <EyeOff /> : <Eye />}{item.status === "public" ? "隐藏" : "恢复"}</button>
        <button className="danger" disabled={busy === item.id} onClick={() => { if (confirm("确定删除这条素材吗？此操作不可恢复。")) void run(item.id, () => deleteAdminMedia(token, item.id)); }}><Trash2 />删除</button>
      </div>
    </article>)}</div></section>
  </main>;
}
