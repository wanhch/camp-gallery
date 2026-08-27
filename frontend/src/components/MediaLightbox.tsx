import { useEffect, useId, useRef } from "react";
import { ArrowLeft, ArrowRight, Heart, Share2, X } from "lucide-react";
import { categoryLabel, getCategory } from "../data/companies";
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
  const stageRef = useRef<HTMLDivElement>(null);
  const company = getCategory(item.company);

  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && hasPrevious) onPrevious();
      if (event.key === "ArrowRight" && hasNext) onNext();
    };
    document.addEventListener("keydown", handleArrowKeys);
    return () => document.removeEventListener("keydown", handleArrowKeys);
  }, [hasNext, hasPrevious, onNext, onPrevious]);

  // 触屏手势：水平滑动切换，下滑关闭；滑动中画面跟随手指
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let axis: "x" | "y" | null = null;

    const settle = () => {
      stage.style.transition = "transform 220ms ease";
      stage.style.transform = "";
      window.setTimeout(() => { stage.style.transition = ""; }, 240);
    };

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" || !event.isPrimary) return;
      const target = event.target as HTMLElement;
      if (target.closest("button") || target.closest("video")) return;
      tracking = true;
      axis = null;
      startX = event.clientX;
      startY = event.clientY;
    };
    const handleMove = (event: PointerEvent) => {
      if (!tracking) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      if (axis === "x") stage.style.transform = `translateX(${dx}px)`;
      else if (axis === "y") stage.style.transform = `translateY(${Math.max(0, dy)}px)`;
    };
    const handleUp = (event: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const currentAxis = axis;
      axis = null;
      settle();
      if (currentAxis === "x" && Math.abs(dx) > 48) {
        if (dx < 0 && hasNext) onNext();
        else if (dx > 0 && hasPrevious) onPrevious();
      } else if (currentAxis === "y" && dy > 72) {
        onClose();
      }
    };

    stage.addEventListener("pointerdown", handleDown, { passive: true });
    stage.addEventListener("pointermove", handleMove, { passive: true });
    stage.addEventListener("pointerup", handleUp, { passive: true });
    stage.addEventListener("pointercancel", handleUp, { passive: true });
    return () => {
      stage.removeEventListener("pointerdown", handleDown);
      stage.removeEventListener("pointermove", handleMove);
      stage.removeEventListener("pointerup", handleUp);
      stage.removeEventListener("pointercancel", handleUp);
      stage.style.transform = "";
      stage.style.transition = "";
    };
  }, [hasNext, hasPrevious, onNext, onPrevious, onClose]);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?moment=${encodeURIComponent(item.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.caption, text: `${categoryLabel(company.id)} · ${item.caption}`, url });
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
      <div className="lightbox-stage" ref={stageRef}>
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
        <span>{categoryLabel(company.id)}{company.id === 17 ? "" : ` · ${company.name}`}</span>
        <h2 id={titleId}>{item.caption}</h2>
        <p>{new Date(item.createdAt).toLocaleString("zh-CN", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
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
