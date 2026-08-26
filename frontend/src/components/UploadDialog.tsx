import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, CheckCircle2, FileVideo, ImagePlus, LoaderCircle, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { uploadCategories } from "../data/companies";
import { uploadMedia, verifyUploader } from "../api";
import type { MediaItem, PlatformConfig, UploadProfile } from "../types";
import { ModalFrame } from "./ModalFrame";

interface UploadDialogProps { onClose: () => void; onUploaded: (items: MediaItem[]) => void; config: PlatformConfig; initialCompany?: number }

export function UploadDialog({ onClose, onUploaded, config, initialCompany = 10 }: UploadDialogProps) {
  const titleId = useId();
  const [token, setToken] = useState(() => sessionStorage.getItem("camp_uploader_token") || "");
  const [profile, setProfile] = useState<UploadProfile | null>(() => { try { return JSON.parse(sessionStorage.getItem("camp_uploader_profile") || "null"); } catch { return null; } });
  const [name, setName] = useState(profile?.name || "");
  const [categoryId, setCategoryId] = useState(profile?.categoryId || initialCompany || 10);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  const verify = async (event: FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const result = await verifyUploader(name, categoryId);
      setToken(result.token); setProfile(result.profile);
      sessionStorage.setItem("camp_uploader_token", result.token);
      sessionStorage.setItem("camp_uploader_profile", JSON.stringify(result.profile));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "身份验证失败"); }
    finally { setSubmitting(false); }
  };

  const addFiles = (incoming: File[]) => {
    setError("");
    const accepted = incoming.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const oversized = accepted.find((file) => file.size > config.maxFileMb * 1024 * 1024);
    if (oversized) { setError(`${oversized.name} 超过 ${config.maxFileMb}MB`); return; }
    if (accepted.length !== incoming.length) setError("已忽略不支持的文件");
    setFiles((current) => [...current, ...accepted].slice(0, config.maxFiles));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!files.length) { setError("请先选择照片或视频"); return; }
    if (!consent) { setError("请先确认影像公开展示授权"); return; }
    const data = new FormData(); files.forEach((file) => data.append("files", file)); data.append("caption", caption);
    setSubmitting(true); setProgress(1); setError("");
    try { const items = await uploadMedia(data, token, setProgress); setSuccess(true); onUploaded(items); window.setTimeout(onClose, 1200); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "上传失败，请重试"); setProgress(0); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalFrame onClose={submitting ? () => undefined : onClose} labelId={titleId} className="upload-modal">
      <div className="modal-header"><div><span className="modal-kicker">实名名单验证 · 姓名不公开</span><h2 id={titleId}>{profile ? "把这一刻，放进共同记忆" : "先确认你的集训身份"}</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X /></button></div>
      {success ? <div className="upload-success"><CheckCircle2 /><h3>影像已汇聚</h3><p>展示墙已实时更新，谢谢你的记录。</p></div> : !profile ? (
        <form className="upload-form" onSubmit={verify}>
          <label className="field"><span>所属身份</span><select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>{uploadCategories.map((item) => <option key={item.id} value={item.id}>{item.id === 17 ? item.name : `第 ${item.number} 连`}</option>)}</select></label>
          <label className="field"><span>名单姓名</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入本人姓名" maxLength={32} autoFocus /></label>
          <p className="privacy-note"><ShieldCheck />姓名仅用于名单验证和后台记录，不会在公开照片墙显示。</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button className="button button--quiet" type="button" onClick={onClose}>暂不上传</button><button className="button button--primary" disabled={submitting || !name.trim()}>{submitting ? <LoaderCircle className="spin" /> : <ShieldCheck />}{submitting ? "正在验证" : "验证并继续"}</button></div>
        </form>
      ) : (
        <form className="upload-form" onSubmit={submit}>
          <div className="verified-banner"><CheckCircle2 /><span><strong>{profile.name}</strong>，身份验证成功</span><button type="button" onClick={() => { setProfile(null); setToken(""); sessionStorage.removeItem("camp_uploader_token"); sessionStorage.removeItem("camp_uploader_profile"); }}>切换人员</button></div>
          <label className="drop-zone"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => { addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} /><span className="drop-zone__icon"><ImagePlus /></span><strong>{files.length ? "继续添加照片或视频" : "选择照片或视频"}</strong><small>单个不超过 {config.maxFileMb}MB，单次最多 {config.maxFiles} 个</small></label>
          {previews.length > 0 && <div className="upload-previews">{previews.map(({ file, url }, index) => <div className="upload-preview" key={`${file.name}-${file.lastModified}`}>{file.type.startsWith("video/") ? <video src={url} muted /> : <img src={url} alt={file.name} />}<span>{file.type.startsWith("video/") ? <FileVideo /> : <Camera />}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}><Trash2 /></button></div>)}</div>}
          <label className="field"><span>这一刻想说</span><textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} rows={3} placeholder="可选，AI 演示可在管理端生成标题" /></label>
          <label className="consent-row"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>我确认已获得影像中人物授权，同意用于本次集训宣传展示。</span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          {submitting && <div className="upload-progress"><span><i style={{ transform: `scaleX(${Math.max(.02, progress / 100)})` }} /></span><small>正在汇聚 {progress}%</small></div>}
          <div className="modal-actions"><button className="button button--quiet" type="button" onClick={onClose}>取消</button><button className="button button--primary" disabled={submitting || !files.length}><Upload />{submitting ? "正在上传" : `汇聚 ${files.length || ""} 个瞬间`}</button></div>
        </form>
      )}
    </ModalFrame>
  );
}
