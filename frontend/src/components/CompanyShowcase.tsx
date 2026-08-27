import { useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Images, Shuffle, Users } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { companies } from "../data/companies";
import type { MediaItem } from "../types";

interface CompanyShowcaseProps {
  media: MediaItem[];
  onViewCompany: (company: number) => void;
}

export function CompanyShowcase({ media, onViewCompany }: CompanyShowcaseProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  const momentCounts = useMemo(() => {
    const counts = new Map<number, number>();
    media.forEach((item) => counts.set(item.company, (counts.get(item.company) || 0) + 1));
    return counts;
  }, [media]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(companies.length - 1, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive((current) => (current === index ? current : index));
  };

  const spotlight = () => {
    let next = Math.floor(Math.random() * companies.length);
    if (next === active) next = (next + 5) % companies.length;
    scrollToIndex(next);
  };

  return (
    <div className="company-showcase">
      <div className="page-shell company-showcase__head">
        <div className="section-heading section-heading--split">
          <div>
            <span className="section-kicker">16 COMPANIES / ONE SUGON</span>
            <h2 id="companies-heading">每一连，都是主角</h2>
          </div>
          <div className="section-heading__aside">
            <p>46 人一连，16 份不同锋芒。左右滑动，遇见每一支队伍。</p>
            <button type="button" className="button button--signal" onClick={spotlight} data-cursor="spark">
              <Shuffle aria-hidden="true" />
              随机点亮一连
            </button>
          </div>
        </div>
      </div>

      <div
        className="company-track"
        ref={trackRef}
        onScroll={handleScroll}
        role="group"
        aria-label="连队风采卡片，左右滑动切换"
      >
        {companies.map((item, index) => (
          <article
            key={item.id}
            className="company-card"
            style={{ "--company-accent": item.accent } as CSSProperties}
            aria-label={`第 ${item.number} 连 · ${item.name}`}
          >
            <img
              className="company-card__bg"
              src={item.image}
              alt=""
              loading={index < 2 ? "eager" : "lazy"}
              decoding="async"
            />
            <div className="company-card__shade" aria-hidden="true" />
            <span className="company-card__number" aria-hidden="true">{item.number}</span>
            <span className="demo-label">示例影像</span>
            <div className="company-card__body">
              <span className="company-card__index">第 {item.number} 连</span>
              <h3>{item.name}</h3>
              <blockquote>“{item.motto}”</blockquote>
              <p>{item.summary}</p>
              <div className="company-card__facts">
                <span><Users aria-hidden="true" /><strong>{item.members}</strong> 位伙伴</span>
                <span><Images aria-hidden="true" /><strong>{momentCounts.get(item.id) || 0}</strong> 个瞬间</span>
              </div>
              <button className="text-button" type="button" onClick={() => onViewCompany(item.id)} data-cursor="view">
                查看本连影像
                <ArrowUpRight aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="page-shell company-showcase__nav">
        <button type="button" className="icon-button" onClick={() => scrollToIndex(active - 1)} disabled={active === 0} aria-label="上一支连队">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="company-dots" role="group" aria-label="选择连队">
          {companies.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? "is-active" : ""}
              onClick={() => scrollToIndex(index)}
              aria-label={`第 ${item.number} 连 ${item.name}`}
              aria-pressed={index === active}
            />
          ))}
        </div>
        <span className="company-counter" aria-live="polite">{String(active + 1).padStart(2, "0")} / {companies.length}</span>
        <button type="button" className="icon-button" onClick={() => scrollToIndex(active + 1)} disabled={active === companies.length - 1} aria-label="下一支连队">
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
