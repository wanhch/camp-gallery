import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Radio } from "lucide-react";
import { fetchMedia, fetchStats, likeMedia } from "../api";
import { Header } from "../components/Header";
import { MediaGallery } from "../components/MediaGallery";
import { MediaLightbox } from "../components/MediaLightbox";
import { MobileNav } from "../components/MobileNav";
import { QrDialog } from "../components/QrDialog";
import { categoryLabel, getCategory } from "../data/companies";
import type { MediaItem, PlatformStats } from "../types";

const emptyStats: PlatformStats = { trainees: 736, companies: 16, media: 0, photos: 0, videos: 0, ranking: [] };
interface GalleryPageProps { lockedCategory?: number }

export function GalleryPage({ lockedCategory }: GalleryPageProps) {
  const query = new URLSearchParams(location.search);
  const queryCategory = Number(query.get("category"));
  const initialCategory = lockedCategory || (Number.isInteger(queryCategory) && queryCategory >= 1 && queryCategory <= 17 ? queryCategory : 0);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [category, setCategory] = useState(initialCategory);
  const [activeId, setActiveId] = useState<string | null>(query.get("moment"));
  const [showQr, setShowQr] = useState(false);
  const [notice, setNotice] = useState("");
  const showNotice = useCallback((message: string) => { setNotice(message); setTimeout(() => setNotice(""), 3000); }, []);

  useEffect(() => { Promise.all([fetchMedia(), fetchStats()]).then(([result, nextStats]) => { setMedia(result.items); setStats(nextStats); }).catch(() => showNotice("影像直播暂时无法连接")); }, [showNotice]);
  const activeIndex = useMemo(() => media.findIndex((item) => item.id === activeId), [activeId, media]);
  const active = activeIndex >= 0 ? media[activeIndex] : null;
  const title = lockedCategory ? (lockedCategory === 17 ? "幕后守护 · 工作人员风采" : `${categoryLabel(lockedCategory)} · ${getCategory(lockedCategory).name}`) : "全营影像直播";

  const changeCategory = (id: number) => {
    if (lockedCategory) { location.href = id ? `/company/${id}` : "/gallery"; return; }
    setCategory(id); const url = new URL(location.href); id ? url.searchParams.set("category", String(id)) : url.searchParams.delete("category"); history.replaceState({}, "", url);
  };
  const open = (item: MediaItem) => { setActiveId(item.id); const url = new URL(location.href); url.searchParams.set("moment", item.id); history.replaceState({}, "", url); };
  const close = () => { setActiveId(null); const url = new URL(location.href); url.searchParams.delete("moment"); history.replaceState({}, "", url); };
  const like = async (item: MediaItem) => { setMedia((all) => all.map((entry) => entry.id === item.id ? { ...entry, likes: entry.likes + 1 } : entry)); try { const result = await likeMedia(item.id); setMedia((all) => all.map((entry) => entry.id === item.id ? { ...entry, likes: result.likes } : entry)); } catch { showNotice("点赞暂时未能送达"); } };

  return <div className="app-shell gallery-route">
    <Header onQr={() => setShowQr(true)} />
    <main id="main-content">
      <section className={`gallery-route-hero ${lockedCategory === 17 ? "is-staff" : ""}`}><div className="page-shell"><a href="/" className="route-back"><ArrowLeft />返回集结中枢</a><span><Radio /> LIVE / 实时更新</span><h1>{title}</h1><p>{lockedCategory === 17 ? "记录每一份幕后付出，让守护与陪伴同样被看见。" : `照片 ${stats.photos} · 视频 ${stats.videos} · 共 ${stats.media} 个集训瞬间`}</p></div></section>
      <MediaGallery media={media} selectedCompany={category} onCompanyChange={changeCategory} onOpen={open} onLike={like} />
    </main>
    <MobileNav onQr={() => setShowQr(true)} />
    {showQr && <QrDialog onClose={() => setShowQr(false)} onNotice={showNotice} />}
    {active && <MediaLightbox item={active} hasPrevious={activeIndex > 0} hasNext={activeIndex < media.length - 1} onPrevious={() => setActiveId(media[activeIndex - 1]?.id || null)} onNext={() => setActiveId(media[activeIndex + 1]?.id || null)} onClose={close} onLike={like} onNotice={showNotice} />}
    <div className={`toast ${notice ? "is-visible" : ""}`} role="status">{notice}</div>
  </div>;
}
