import { useCallback, useEffect, useMemo, useState, Suspense, lazy } from "react";
import { ArrowLeft, Radio } from "lucide-react";
import { fetchMedia, fetchStats, likeMedia } from "../api";
import { Header } from "../components/Header";
import { MediaGallery, type MediaFilter } from "../components/MediaGallery";
import { MediaLightbox } from "../components/MediaLightbox";
import { MobileNav } from "../components/MobileNav";
import { categoryLabel, getCategory } from "../data/companies";
import { Link, navigate } from "../router";
import type { MediaItem, PlatformStats } from "../types";

const QrDialog = lazy(() => import("../components/QrDialog").then((module) => ({ default: module.QrDialog })));

const emptyStats: PlatformStats = { trainees: 736, companies: 16, media: 0, photos: 0, videos: 0, ranking: [] };
const refreshIntervalMs = 10_000;
interface GalleryPageProps { lockedCategory?: number }

/** 轮询结果指纹：内容没变就跳过 setState，避免整网格重渲染与布局动画抖动 */
function mediaSignature(items: MediaItem[]) {
  return items.map((item) => `${item.id}:${item.likes}:${item.featured}:${item.caption}`).join("|");
}

export function GalleryPage({ lockedCategory }: GalleryPageProps) {
  const query = new URLSearchParams(location.search);
  const queryCategory = Number(query.get("category"));
  const initialCategory = lockedCategory || (Number.isInteger(queryCategory) && queryCategory >= 1 && queryCategory <= 17 ? queryCategory : 0);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [category, setCategory] = useState(initialCategory);
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(query.get("moment"));
  const [showQr, setShowQr] = useState(false);
  const [notice, setNotice] = useState("");
  const showNotice = useCallback((message: string) => { setNotice(message); setTimeout(() => setNotice(""), 3000); }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [result, nextStats] = await Promise.all([fetchMedia(lockedCategory), fetchStats()]);
        if (cancelled) return;
        setMedia((current) => mediaSignature(current) === mediaSignature(result.items) ? current : result.items);
        setStats((current) => JSON.stringify(current) === JSON.stringify(nextStats) ? current : nextStats);
      } catch {
        if (!cancelled) showNotice("影像直播暂时无法连接");
      }
    };
    void load();
    const handleVisibility = () => { if (!document.hidden) void load(); };
    const refresh = window.setInterval(() => { if (!document.hidden) void load(); }, refreshIntervalMs);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { cancelled = true; window.clearInterval(refresh); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [lockedCategory, showNotice]);
  const filteredMedia = useMemo(() => media.filter((item) => {
    const matchesCategory = category === 0 || item.categoryId === category;
    const matchesType = filter === "all" || item.type === filter;
    return matchesCategory && matchesType;
  }), [category, filter, media]);
  const activeIndex = useMemo(() => filteredMedia.findIndex((item) => item.id === activeId), [activeId, filteredMedia]);
  const active = activeIndex >= 0 ? filteredMedia[activeIndex] : null;
  const categoryMedia = lockedCategory ? media.filter((item) => item.categoryId === lockedCategory) : media;
  const displayedStats = lockedCategory ? {
    media: categoryMedia.length,
    photos: categoryMedia.filter((item) => item.type === "photo").length,
    videos: categoryMedia.filter((item) => item.type === "video").length
  } : stats;
  const title = lockedCategory ? (lockedCategory === 17 ? "幕后守护 · 工作人员风采" : `${categoryLabel(lockedCategory)} · ${getCategory(lockedCategory).name}`) : "全营影像直播";

  const changeCategory = (id: number) => {
    if (lockedCategory) { navigate(id ? `/company/${id}` : "/gallery"); return; }
    setCategory(id); const url = new URL(location.href); id ? url.searchParams.set("category", String(id)) : url.searchParams.delete("category"); history.replaceState({}, "", url);
  };
  const open = (item: MediaItem) => { setActiveId(item.id); const url = new URL(location.href); url.searchParams.set("moment", item.id); history.replaceState({}, "", url); };
  const close = () => { setActiveId(null); const url = new URL(location.href); url.searchParams.delete("moment"); history.replaceState({}, "", url); };
  const moveTo = (item: MediaItem | undefined) => { if (!item) return; setActiveId(item.id); const url = new URL(location.href); url.searchParams.set("moment", item.id); history.replaceState({}, "", url); };
  const like = async (item: MediaItem) => { setMedia((all) => all.map((entry) => entry.id === item.id ? { ...entry, likes: entry.likes + 1 } : entry)); try { const result = await likeMedia(item.id); setMedia((all) => all.map((entry) => entry.id === item.id ? { ...entry, likes: result.likes } : entry)); } catch { showNotice("点赞暂时未能送达"); } };

  return <div className="app-shell gallery-route">
    <Header onQr={() => setShowQr(true)} />
    <main id="main-content">
      <section className={`gallery-route-hero ${lockedCategory === 17 ? "is-staff" : ""}`}><div className="page-shell"><Link href="/" className="route-back"><ArrowLeft />返回集结中枢</Link><span><Radio /> LIVE / 实时更新</span><h1>{title}</h1><p>{lockedCategory === 17 ? "记录每一份幕后付出，让守护与陪伴同样被看见。" : `照片 ${displayedStats.photos} · 视频 ${displayedStats.videos} · 共 ${displayedStats.media} 个集训瞬间`}</p></div></section>
      <MediaGallery media={media} selectedCompany={category} filter={filter} onCompanyChange={changeCategory} onFilterChange={setFilter} onOpen={open} onLike={like} />
    </main>
    <MobileNav onUpload={() => navigate("/upload")} onQr={() => setShowQr(true)} />
    {showQr && <Suspense fallback={null}><QrDialog onClose={() => setShowQr(false)} onNotice={showNotice} /></Suspense>}
    {active && <MediaLightbox item={active} hasPrevious={activeIndex > 0} hasNext={activeIndex < filteredMedia.length - 1} onPrevious={() => moveTo(filteredMedia[activeIndex - 1])} onNext={() => moveTo(filteredMedia[activeIndex + 1])} onClose={close} onLike={like} onNotice={showNotice} />}
    <div className={`toast ${notice ? "is-visible" : ""}`} role="status">{notice}</div>
  </div>;
}
