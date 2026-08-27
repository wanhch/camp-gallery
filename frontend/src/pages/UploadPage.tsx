import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileVideo, ImagePlus, LoaderCircle, ShieldCheck, Trash2, Upload } from "lucide-react";
import { fetchConfig, uploadMedia, verifyUploader } from "../api";
import { categoryLabel, uploadCategories } from "../data/companies";
import { Link } from "../router";
import type { MediaItem, PlatformConfig, UploadProfile } from "../types";

const defaultConfig: PlatformConfig = { maxFileMb: 100, maxFiles: 20, aiMode: "demo" };

export function UploadPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState(defaultConfig);
  const [name, setName] = useState(""); const [categoryId, setCategoryId] = useState(10);
  const [token, setToken] = useState(""); const [profile, setProfile] = useState<UploadProfile | null>(null);
  const [files, setFiles] = useState<File[]>([]); const [caption, setCaption] = useState(""); const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(0); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(""); const [uploaded, setUploaded] = useState<MediaItem[]>([]);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => { void fetchConfig().then(setConfig); return () => previews.forEach(({ url }) => URL.revokeObjectURL(url)); }, [previews]);

  const verify = async (event: FormEvent) => { event.preventDefault(); setSubmitting(true); setError(""); try { const result = await verifyUploader(name, categoryId); setToken(result.token); setProfile(result.profile); setStep(2); } catch (reason) { setError(reason instanceof Error ? reason.message : "验证失败"); } finally { setSubmitting(false); } };
  const addFiles = (incoming: File[]) => { const accepted = incoming.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/")); const oversized = accepted.find((file) => file.size > config.maxFileMb * 1024 * 1024); if (oversized) { setError(`${oversized.name} 超过 ${config.maxFileMb}MB`); return; } setFiles((current) => [...current, ...accepted].slice(0, config.maxFiles)); if (accepted.length !== incoming.length) setError("已忽略不支持的文件"); else setError(""); };
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!files.length) { setError("请先选择照片或视频"); return; } if (!consent) { setError("请确认影像公开展示授权"); return; } const data = new FormData(); files.forEach((file) => data.append("files", file)); data.append("caption", caption); setSubmitting(true); setProgress(1); setError(""); try { const result = await uploadMedia(data, token, setProgress); setUploaded(result); setStep(3); } catch (reason) { setError(reason instanceof Error ? reason.message : "上传失败"); } finally { setSubmitting(false); } };
  const reset = () => { setFiles([]); setCaption(""); setConsent(false); setProgress(0); setUploaded([]); setStep(2); };

  return <main className="upload-route">
    <header className="upload-route-header"><Link href="/"><ArrowLeft />返回首页</Link><div><strong>2026中科曙光集团应届生训战营 · 黄埔八期</strong><span>上传中心</span></div><Link href="/gallery">观看风采<ArrowRight /></Link></header>
    <div className="upload-route-layout">
      <aside><span className="section-kicker">UPLOAD JOURNEY</span><h1>你的镜头，<br />让共同记忆更完整。</h1><p>姓名仅用于名单验证和后台审计，不会在公开页面显示。</p><ol>{([[1,"验证身份"],[2,"选择并上传"],[3,"完成汇聚"]] as const).map(([value,label]) => <li className={step >= value ? "is-active" : ""} key={value}><span>{step > value ? <Check /> : value}</span><strong>{label}</strong></li>)}</ol></aside>
      <section className="upload-step-card">
        {step === 1 && <form onSubmit={verify}><span className="step-number">STEP 01</span><h2>确认你的集训身份</h2><p>请选择所属连队或工作人员身份，并输入名单中的本人姓名。</p><div className="form-grid"><label className="field"><span>所属身份</span><select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>{uploadCategories.map((item) => <option key={item.id} value={item.id}>{item.id === 17 ? item.name : `第 ${item.number} 连 · ${item.name}`}</option>)}</select></label><label className="field"><span>名单姓名</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入本人姓名" autoFocus /></label></div><div className="privacy-note"><ShieldCheck /><span>名单验证只控制上传权限，观看入口无需登录。</span></div>{error && <p className="form-error">{error}</p>}<div className="upload-route-actions"><button className="button button--primary button--large" disabled={submitting || !name.trim()}>{submitting ? <LoaderCircle className="spin" /> : <ShieldCheck />}{submitting ? "正在验证" : "验证并继续"}</button></div></form>}

        {step === 2 && <form onSubmit={submit}><span className="step-number">STEP 02</span><h2>上传你的集训瞬间</h2><div className="verified-banner"><CheckCircle2 /><span><strong>{profile?.name}</strong> · {profile ? categoryLabel(profile.categoryId) : ""}</span><button type="button" onClick={() => { setStep(1); setProfile(null); setToken(""); }}>重新验证</button></div><label className="drop-zone upload-page-drop"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => { addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} /><span className="drop-zone__icon"><ImagePlus /></span><strong>{files.length ? "继续添加照片或视频" : "从手机相册选择照片或视频"}</strong><small>单个不超过 {config.maxFileMb}MB，单次最多 {config.maxFiles} 个</small></label>{previews.length > 0 && <div className="upload-page-files">{previews.map(({ file, url }, index) => <article key={`${file.name}-${file.lastModified}`}>{file.type.startsWith("video/") ? <video src={url} muted /> : <img src={url} alt="" />}<span>{file.type.startsWith("video/") ? <FileVideo /> : <ImagePlus />}<strong>{file.name}</strong></span><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><Trash2 /></button></article>)}</div>}<label className="field"><span>这一刻想说</span><textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} rows={3} placeholder="选填，也可在管理端使用 AI 文案演示" /></label><label className="consent-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>我确认已获得影像中人物授权，同意用于本次集训宣传展示。</span></label>{error && <p className="form-error">{error}</p>}{submitting && <div className="upload-progress"><span><i style={{ transform: `scaleX(${Math.max(.02, progress / 100)})` }} /></span><small>正在上传 {progress}%</small></div>}<div className="upload-route-actions"><button className="button button--primary button--large" disabled={submitting || !files.length}><Upload />{submitting ? "正在汇聚" : `汇聚 ${files.length || ""} 个瞬间`}</button></div></form>}

        {step === 3 && <div className="upload-finished"><CheckCircle2 /><span className="step-number">STEP 03</span><h2>{uploaded.length} 个瞬间已成功汇聚</h2><p>素材已经进入公开展示墙。你可以立即查看，也可以继续上传。</p><div><Link className="button button--primary button--large" href={`/gallery?category=${profile?.categoryId || ""}`}>去展示墙查看<ArrowRight /></Link><button className="button button--outline button--large" onClick={reset}>继续上传</button></div></div>}
      </section>
    </div>
  </main>;
}
