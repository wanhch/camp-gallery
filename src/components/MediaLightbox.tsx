import { useEffect, useId } from "react";
import { ArrowLeft, ArrowRight, Heart, Share2, X } from "lucide-react";
import { getCompany } from "../data/companies";
import type { MediaItem } from "../types";
import { ModalFrame } from "./ModalFrame";

interface MediaLightboxProps {
  item: MediaItem;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onLike: (item: MediaItem) => void;
  onNotice: (message: string) => void;
}

export function MediaLightbox({ item, hasPrevious, hasNext, onPrevious, onNext, onClose, onLike, onNotice }: MediaLightboxProps) {
  const titleId = useId();
  const company = getCompany(item.company);

  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrevious) onPrevious();
      if (event.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", handleArrowKeys);
    return () => document.removeEventListener("keydown", handleArrowKeys);
  }, [hasNext, hasPrevious, onNext, onPrevious]);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?moment=${encodeURIComponent(item.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.caption, text: `第 ${company.number} 连 · ${item.caption}`, url });
      } catch {
        return;
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        onNotice("影像链接已复制");
      } catch {
        onNotice("浏览器未允许复制链接");
      }
    }
  };

  return (
    <ModalFrame onClose={onClose} labelId={titleId} className="lightbox-modal">
      <div className="lightbox-stage">
        {item.type === "video" ? (
          <video src={item.url} controls playsInline autoPlay aria-label={item.caption} />
        ) : (
          <img src={item.url} alt={item.caption} />
        )}
        <button className="icon-button lightbox-close" type="button" onClick={onClose} aria-label="关闭影像" data-autofocus>
          <X aria-hidden="true" />
        </button>
        <button className="icon-button lightbox-arrow lightbox-arrow--left" type="button" onClick={onPrevious} disabled={!hasPrevious} aria-label="上一张">
          <ArrowLeft aria-hidden="true" />
        </button>
        <button className="icon-button lightbox-arrow lightbox-arrow--right" type="button" onClick={onNext} disabled={!hasNext} aria-label="下一张">
          <ArrowRight aria-hidden="true" />
        </button>
        {item.isDemo && <span className="demo-label">示例影像</span>}
      </div>
      <div className="lightbox-info">
        <span>第 {company.number} 连 · {company.name}</span>
        <h2 id={titleId}>{item.caption}</h2>
        <p>{item.author} · {new Date(item.createdAt).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        <div className="lightbox-actions">
          <button className="button button--soft" type="button" onClick={() => onLike(item)}>
            <Heart aria-hidden="true" />{item.likes} 次加油
          </button>
          <button className="button button--outline" type="button" onClick={share}>
            <Share2 aria-hidden="true" />分享
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}
