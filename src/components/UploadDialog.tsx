import { useEffect, useId, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Camera, CheckCircle2, FileVideo, ImagePlus, LoaderCircle, LockKeyhole, Trash2, Upload, X } from "lucide-react";
import { companies } from "../data/companies";
import { uploadMedia } from "../api";
import type { MediaItem, PlatformConfig } from "../types";
import { ModalFrame } from "./ModalFrame";

interface UploadDialogProps {
  onClose: () => void;
  onUploaded: (items: MediaItem[]) => void;
  config: PlatformConfig;
  initialCompany?: number;
}

export function UploadDialog({ onClose, onUploaded, config, initialCompany = 1 }: UploadDialogProps) {
  const titleId = useId();
  const errorId = useId();
  const [files, setFiles] = useState<File[]>([]);
  const [author, setAuthor] = useState("");
  const [company, setCompany] = useState(initialCompany || 1);
  const [caption, setCaption] = useState("");
  const [code, setCode] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  const addFiles = (incoming: File[]) => {
    setError("");
    const accepted = incoming.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const oversized = accepted.find((file) => file.size > config.maxFileMb * 1024 * 1024);
    if (oversized) {
      setError(`${oversized.name} 超过 ${config.maxFileMb}MB，请压缩后重试`);
      return;
    }
    if (accepted.length !== incoming.length) {
      setError("有文件格式不受支持，已仅保留照片和视频");
    }
    setFiles((current) => [...current, ...accepted].slice(0, config.maxFiles));
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!files.length) {
      setError("请先选择要汇聚的照片或视频");
      return;
    }
    if (!author.trim()) {
      setError("请留下你的名字或影像员称呼");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("author", author);
    formData.append("company", String(company));
    formData.append("caption", caption);

    setSubmitting(true);
    setError("");
    setProgress(1);
    try {
      const items = await uploadMedia(formData, code, setProgress);
      setSuccess(true);
      onUploaded(items);
      window.setTimeout(onClose, 1100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传未能完成，请重试");
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <ModalFrame onClose={submitting ? () => undefined : onClose} labelId={titleId} className="upload-modal">
      <div className="modal-header">
        <div>
          <span className="modal-kicker">一键汇聚</span>
          <h2 id={titleId}>把这一刻，放进共同记忆</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} disabled={submitting} aria-label="关闭上传窗口" data-autofocus>
          <X aria-hidden="true" />
        </button>
      </div>

      {success ? (
        <div className="upload-success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <h3>影像已汇聚</h3>
          <p>谢谢你，让集训记忆又完整了一点。</p>
        </div>
      ) : (
        <form className="upload-form" onSubmit={handleSubmit} aria-busy={submitting}>
          <label
            className={`drop-zone ${dragging ? "is-dragging" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" multiple onChange={handleFileInput} disabled={submitting} />
            <span className="drop-zone__icon"><ImagePlus aria-hidden="true" /></span>
            <strong>{files.length ? "继续添加照片或视频" : "选择照片或视频"}</strong>
            <small>单个文件不超过 {config.maxFileMb}MB，最多 {config.maxFiles} 个</small>
          </label>

          {previews.length > 0 && (
            <div className="upload-previews" aria-label={`已选择 ${previews.length} 个文件`}>
              {previews.map(({ file, url }, index) => (
                <div className="upload-preview" key={`${file.name}-${file.lastModified}`}>
                  {file.type.startsWith("video/") ? (
                    <video src={url} muted aria-label={file.name} />
                  ) : (
                    <img src={url} alt={file.name} />
                  )}
                  <span>{file.type.startsWith("video/") ? <FileVideo aria-hidden="true" /> : <Camera aria-hidden="true" />}</span>
                  <button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`移除 ${file.name}`} disabled={submitting}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="form-grid">
            <label className="field">
              <span>你的称呼 <em>*</em></span>
              <input value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={32} placeholder="姓名 / 连队影像员" disabled={submitting} />
            </label>
            <label className="field">
              <span>所属连队 <em>*</em></span>
              <select value={company} onChange={(event) => setCompany(Number(event.target.value))} disabled={submitting}>
                {companies.map((item) => <option key={item.id} value={item.id}>第 {item.number} 连 · {item.name}</option>)}
              </select>
            </label>
          </div>

          <label className="field">
            <span>这一刻想说</span>
            <textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={160} rows={3} placeholder="为照片写下一句话" disabled={submitting} />
            <small>{caption.length}/160</small>
          </label>

          {config.uploadCodeRequired && (
            <label className="field field--code">
              <span><LockKeyhole aria-hidden="true" />集训口令 <em>*</em></span>
              <input type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" disabled={submitting} />
            </label>
          )}

          {error && <p className="form-error" id={errorId} role="alert">{error}</p>}

          {submitting && (
            <div className="upload-progress" role="status" aria-live="polite">
              <span><i style={{ transform: `scaleX(${Math.max(0.02, progress / 100)})` }} /></span>
              <small>正在汇聚 {progress}%</small>
            </div>
          )}

          <div className="modal-actions">
            <button className="button button--quiet" type="button" onClick={onClose} disabled={submitting}>暂不上传</button>
            <button className="button button--primary" type="submit" disabled={submitting || !files.length}>
              {submitting ? <LoaderCircle className="spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
              {submitting ? "正在上传" : `汇聚 ${files.length || ""} 个瞬间`}
            </button>
          </div>
        </form>
      )}
    </ModalFrame>
  );
}
