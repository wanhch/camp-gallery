import { useMemo, useState } from "react";
import { Camera, ChevronDown, Heart, Images, Play, Video } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { categoryLabel, getCategory, uploadCategories } from "../data/companies";
import type { MediaItem, MediaType } from "../types";

interface MediaGalleryProps {
  media: MediaItem[];
  selectedCompany: number;
  onCompanyChange: (company: number) => void;
  onOpen: (item: MediaItem) => void;
  onLike: (item: MediaItem) => void;
  onUpload?: () => void;
}

type MediaFilter = "all" | MediaType;

function formatMoment(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? `今天 ${date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`
    : date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function MediaGallery({ media, selectedCompany, onCompanyChange, onOpen, onLike, onUpload }: MediaGalleryProps) {
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  const filteredMedia = useMemo(() => media.filter((item) => {
    const matchesCompany = selectedCompany === 0 || item.company === selectedCompany;
    const matchesType = filter === "all" || item.type === filter;
    return matchesCompany && matchesType;
  }), [filter, media, selectedCompany]);

  const visibleMedia = expanded ? filteredMedia : filteredMedia.slice(0, 12);
  const selectedLabel = selectedCompany ? categoryLabel(selectedCompany) : "全部分类";

  return (
    <section className="gallery-section section" id="gallery" aria-labelledby="gallery-heading">
      <div className="page-shell">
        <motion.div
          className="section-heading section-heading--split gallery-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <span className="section-kicker">TRAINING MOMENTS / LIVE</span>
            <h2 id="gallery-heading">这一刻，正在发生</h2>
          </div>
          <div className="gallery-heading__count" aria-live="polite">
            <strong>{filteredMedia.length}</strong>
            <span>{selectedLabel}的影像</span>
          </div>
        </motion.div>

        <motion.div
          className="gallery-toolbar"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="segmented-control" role="group" aria-label="媒体类型">
            <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")} aria-pressed={filter === "all"}>
              <Images aria-hidden="true" />全部
            </button>
            <button type="button" className={filter === "photo" ? "is-active" : ""} onClick={() => setFilter("photo")} aria-pressed={filter === "photo"}>
              <Camera aria-hidden="true" />照片
            </button>
            <button type="button" className={filter === "video" ? "is-active" : ""} onClick={() => setFilter("video")} aria-pressed={filter === "video"}>
              <Video aria-hidden="true" />视频
            </button>
          </div>
          <label className="company-select">
            <span className="sr-only">按连队筛选</span>
            <select value={selectedCompany} onChange={(event) => onCompanyChange(Number(event.target.value))}>
              <option value={0}>全部分类</option>
              {uploadCategories.map((company) => (
                <option key={company.id} value={company.id}>{company.id === 17 ? company.name : `第 ${company.number} 连 · ${company.name}`}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </label>
        </motion.div>

        {visibleMedia.length > 0 ? (
          <motion.div className="media-grid" layout={!reduceMotion}>
            {visibleMedia.map((item, index) => {
              const company = getCategory(item.company);
              return (
                <motion.article
                  layout={!reduceMotion}
                  key={item.id}
                  className={`media-card media-card--${index % 7}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.985 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.12 }}
                  transition={{
                    layout: { duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: reduceMotion ? 0 : 0.46, delay: reduceMotion ? 0 : Math.min(index, 7) * 0.045 },
                    y: { duration: reduceMotion ? 0 : 0.52, delay: reduceMotion ? 0 : Math.min(index, 7) * 0.045, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: reduceMotion ? 0 : 0.52, delay: reduceMotion ? 0 : Math.min(index, 7) * 0.045 }
                  }}
                >
                  <button className="media-card__open" type="button" onClick={() => onOpen(item)} aria-label={`查看${item.caption}`} data-cursor="view">
                    {item.type === "video" ? (
                      <video src={item.url} muted playsInline preload="metadata" aria-label={item.caption} />
                    ) : (
                      <img src={item.url} alt={item.caption} width="900" height="900" loading="lazy" />
                    )}
                    <span className="media-card__shade" aria-hidden="true" />
                    {item.type === "video" && <span className="media-card__play"><Play fill="currentColor" aria-hidden="true" /></span>}
                    <span className="media-card__meta">
                      <small>{categoryLabel(company.id)} · {formatMoment(item.createdAt)}</small>
                      <strong>{item.caption}</strong>
                    </span>
                    {item.isDemo && <span className="demo-label">示例</span>}
                  </button>
                  <button className="media-card__like" type="button" onClick={() => onLike(item)} aria-label={`为这条影像点赞，当前 ${item.likes} 次`} data-cursor="spark">
                    <Heart aria-hidden="true" />
                    <span>{item.likes}</span>
                  </button>
                </motion.article>
              );
            })}
          </motion.div>
        ) : (
          <div className="empty-state">
            <Camera aria-hidden="true" />
            <h3>这一格，等你点亮</h3>
            <p>{selectedLabel}还没有符合筛选条件的影像。</p>
            {onUpload && <button className="button button--primary" type="button" onClick={onUpload}>上传第一个瞬间</button>}
          </div>
        )}

        {filteredMedia.length > 12 && (
          <div className="gallery-more">
            <button className="button button--outline" type="button" onClick={() => setExpanded((value) => !value)}>
              {expanded ? "收起影像" : `展开全部 ${filteredMedia.length} 个瞬间`}
              <ChevronDown className={expanded ? "is-rotated" : ""} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
