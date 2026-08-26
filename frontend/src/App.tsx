import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { ArrowUpRight, Camera, Images, ShieldCheck, Video } from "lucide-react";
import { fetchConfig, fetchMedia, fetchStats, likeMedia } from "./api";
import { BrandMark } from "./components/BrandMark";
import { CompanyShowcase } from "./components/CompanyShowcase";
import { GrowthTimeline } from "./components/GrowthTimeline";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { MediaGallery } from "./components/MediaGallery";
import { MediaLightbox } from "./components/MediaLightbox";
import { MobileNav } from "./components/MobileNav";
import { OfficialStories } from "./components/OfficialStories";
import { QrDialog } from "./components/QrDialog";
import { ScrollJourney } from "./components/ScrollJourney";
import { SugonCursor } from "./components/SugonCursor";
import { UploadDialog } from "./components/UploadDialog";
import type { MediaItem, PlatformConfig, PlatformStats } from "./types";

const defaultStats: PlatformStats = { trainees: 736, companies: 16, media: 0, photos: 0, videos: 0, ranking: [] };
const defaultConfig: PlatformConfig = { maxFileMb: 100, maxFiles: 20, aiMode: "demo" };

function readCompanyParam() {
  const value = Number(new URLSearchParams(window.location.search).get("company"));
  return Number.isInteger(value) && value >= 1 && value <= 16 ? value : 0;
}

interface AppProps { readOnly?: boolean; initialUpload?: boolean }

export default function App({ readOnly = false, initialUpload = false }: AppProps) {
  const initialCompany = readCompanyParam();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState(defaultStats);
  const [config, setConfig] = useState(defaultConfig);
  const [showUpload, setShowUpload] = useState(initialUpload);
  const [showQr, setShowQr] = useState(false);
  const [showcaseCompany, setShowcaseCompany] = useState(initialCompany || 1);
  const [galleryCompany, setGalleryCompany] = useState(initialCompany);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => current === message ? "" : current), 3200);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchMedia(), fetchStats(), fetchConfig()]).then(([mediaResult, statsResult, configResult]) => {
      if (cancelled) return;
      if (mediaResult.status === "fulfilled") {
        setMedia(mediaResult.value.items);
        const moment = new URLSearchParams(window.location.search).get("moment");
        if (moment && mediaResult.value.items.some((item) => item.id === moment)) setActiveMediaId(moment);
      } else {
        showNotice("影像服务暂时没有响应，正在显示页面骨架");
      }
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      if (configResult.status === "fulfilled") setConfig(configResult.value);
    });
    return () => { cancelled = true; };
  }, [showNotice]);

  const updateUrl = useCallback((key: string, value?: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState({}, "", url);
  }, []);

  const selectGalleryCompany = useCallback((company: number) => {
    setGalleryCompany(company);
    updateUrl("company", company ? String(company) : undefined);
  }, [updateUrl]);

  const closeUpload = useCallback(() => setShowUpload(false), []);
  const closeQr = useCallback(() => setShowQr(false), []);
  const closeMedia = useCallback(() => {
    setActiveMediaId(null);
    updateUrl("moment");
  }, [updateUrl]);

  const openMedia = useCallback((item: MediaItem) => {
    setActiveMediaId(item.id);
    updateUrl("moment", item.id);
  }, [updateUrl]);

  const activeIndex = useMemo(() => media.findIndex((item) => item.id === activeMediaId), [activeMediaId, media]);
  const activeMedia = activeIndex >= 0 ? media[activeIndex] : null;

  const goToMedia = useCallback((index: number) => {
    const item = media[index];
    if (!item) return;
    setActiveMediaId(item.id);
    updateUrl("moment", item.id);
  }, [media, updateUrl]);

  const handleLike = useCallback(async (item: MediaItem) => {
    setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, likes: entry.likes + 1 } : entry));
    try {
      const result = await likeMedia(item.id);
      setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, likes: result.likes } : entry));
    } catch (error) {
      setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, likes: Math.max(0, entry.likes - 1) } : entry));
      showNotice(error instanceof Error ? error.message : "点赞未能送达");
    }
  }, [showNotice]);

  const handleUploaded = useCallback((items: MediaItem[]) => {
    setMedia((current) => [...items, ...current]);
    setStats((current) => ({
      ...current,
      media: current.media + items.length,
      photos: current.photos + items.filter((item) => item.type === "photo").length,
      videos: current.videos + items.filter((item) => item.type === "video").length
    }));
    if (items[0]) {
      setShowcaseCompany(items[0].company);
      selectGalleryCompany(items[0].company);
    }
    showNotice(`${items.length} 个集训瞬间已成功汇聚`);
  }, [selectGalleryCompany, showNotice]);

  return (
    <div className="app-shell">
      <Header onUpload={readOnly ? undefined : () => setShowUpload(true)} onQr={() => setShowQr(true)} />
      <ScrollJourney />
      <main id="main-content" className="narrative-flow">
        <Hero stats={stats} onUpload={readOnly ? undefined : () => setShowUpload(true)} />

        <section className="pulse-band" aria-label="平台实时汇聚状态">
          <div className="page-shell pulse-band__inner">
            <div className="pulse-band__lead">
              <span className="live-dot" aria-hidden="true" />
              <strong>集训影像持续汇聚中</strong>
            </div>
            <dl>
              <div><Camera aria-hidden="true" /><dt>照片</dt><dd>{stats.photos}</dd></div>
              <div><Video aria-hidden="true" /><dt>视频</dt><dd>{stats.videos}</dd></div>
              <div><Images aria-hidden="true" /><dt>共同记忆</dt><dd>{stats.media}</dd></div>
            </dl>
            <button type="button" className="text-button" onClick={() => setShowQr(true)}>
              分享给家人朋友<ArrowUpRight aria-hidden="true" />
            </button>
          </div>
        </section>

        <CompanyShowcase
          selectedCompany={showcaseCompany}
          onSelectCompany={setShowcaseCompany}
          onViewCompany={(company) => {
            selectGalleryCompany(company);
            setShowcaseCompany(company);
          }}
          media={media}
        />
        <MediaGallery
          media={media}
          selectedCompany={galleryCompany}
          onCompanyChange={selectGalleryCompany}
          onOpen={openMedia}
          onLike={handleLike}
          onUpload={readOnly ? undefined : () => setShowUpload(true)}
        />
        <section className="section ranking-section" id="ranking">
          <div className="page-shell">
            <div className="section-heading"><span className="section-kicker">COMPANY RANKING</span><h2>连队风采榜</h2><p>按当前公开有效素材数量实时统计，工作人员不参与排名。</p></div>
            <div className="ranking-grid">{stats.ranking.slice(0, 16).map((item, index) => <article className="ranking-card" key={item.categoryId}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{item.name}</span><em>{item.count} 个瞬间</em></article>)}</div>
          </div>
        </section>
        <OfficialStories />
        <GrowthTimeline onUpload={readOnly ? undefined : () => setShowUpload(true)} />
      </main>

      <footer className="site-footer">
        <div className="page-shell site-footer__top">
          <div>
            <BrandMark inverse />
            <p>记录昂扬向上的集训过程，见证每一位新曙光人的成长与担当。</p>
          </div>
          <div className="site-footer__trust">
            <ShieldCheck aria-hidden="true" />
            <span><strong>影像友好公约</strong>上传前请确认已获得影像中人物授权</span>
          </div>
        </div>
        <div className="page-shell site-footer__bottom">
          <span>曙光新星 · 2026 应届生实训影像平台</span>
          <span>示例素材来源见 <a href="/demo/CREDITS.md" target="_blank" rel="noreferrer">影像说明</a>，正式上线前请替换为已授权内容</span>
        </div>
      </footer>

      <MobileNav onUpload={readOnly ? undefined : () => setShowUpload(true)} onQr={() => setShowQr(true)} />
      <SugonCursor />

      <AnimatePresence>
        {!readOnly && showUpload && (
          <UploadDialog
            key="upload"
            onClose={closeUpload}
            onUploaded={handleUploaded}
            config={config}
            initialCompany={galleryCompany || showcaseCompany}
          />
        )}
        {showQr && <QrDialog key="qr" onClose={closeQr} onNotice={showNotice} />}
        {activeMedia && (
          <MediaLightbox
            key="lightbox"
            item={activeMedia}
            hasPrevious={activeIndex > 0}
            hasNext={activeIndex < media.length - 1}
            onPrevious={() => goToMedia(activeIndex - 1)}
            onNext={() => goToMedia(activeIndex + 1)}
            onClose={closeMedia}
            onLike={handleLike}
            onNotice={showNotice}
          />
        )}
      </AnimatePresence>

      <div className={`toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite" aria-atomic="true">
        {notice}
      </div>
    </div>
  );
}
