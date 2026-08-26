import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Camera, Images, ShieldCheck, Video } from "lucide-react";
import { fetchMedia, fetchStats } from "./api";
import { BrandMark } from "./components/BrandMark";
import { CompanyShowcase } from "./components/CompanyShowcase";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { MobileNav } from "./components/MobileNav";
import { QrDialog } from "./components/QrDialog";
import { ScrollJourney } from "./components/ScrollJourney";
import { SugonCursor } from "./components/SugonCursor";
import { categoryLabel } from "./data/companies";
import type { MediaItem, PlatformStats } from "./types";

const emptyStats: PlatformStats = { trainees: 736, companies: 16, media: 0, photos: 0, videos: 0, ranking: [] };

export default function App() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [selectedCompany, setSelectedCompany] = useState(1);
  const [showQr, setShowQr] = useState(false);
  const [notice, setNotice] = useState("");
  const showNotice = useCallback((message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3000); }, []);

  useEffect(() => {
    Promise.allSettled([fetchMedia(), fetchStats()]).then(([mediaResult, statsResult]) => {
      if (mediaResult.status === "fulfilled") setMedia(mediaResult.value.items);
      else showNotice("影像服务暂时没有响应");
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
    });
  }, [showNotice]);

  return <div className="app-shell hub-home">
    <Header onUpload={() => { location.href = "/upload"; }} onQr={() => setShowQr(true)} />
    <ScrollJourney />
    <main id="main-content" className="narrative-flow">
      <Hero stats={stats} onUpload={() => { location.href = "/upload"; }} />
      <section className="pulse-band" aria-label="平台实时汇聚状态"><div className="page-shell pulse-band__inner"><div className="pulse-band__lead"><span className="live-dot" /><strong>集训影像持续汇聚中</strong></div><dl><div><Camera /><dt>照片</dt><dd>{stats.photos}</dd></div><div><Video /><dt>视频</dt><dd>{stats.videos}</dd></div><div><Images /><dt>共同记忆</dt><dd>{stats.media}</dd></div></dl><a className="text-button" href="/gallery">进入影像直播<ArrowUpRight /></a></div></section>

      <section className="hub-actions section"><div className="page-shell"><div className="section-heading"><span className="section-kicker">CHOOSE YOUR JOURNEY</span><h2>从这里，进入黄埔八期</h2><p>首页只负责分流，每个入口都有专属任务场景。</p></div><div className="hub-action-grid">
        <a href="/gallery"><Images /><span><strong>影像直播</strong><small>连续浏览全营照片与视频</small></span><ArrowUpRight /></a>
        <a href="/#companies"><span className="hub-action-number">16</span><span><strong>连队星图</strong><small>探索每支连队的专属风采</small></span><ArrowUpRight /></a>
        <a href="/upload"><Camera /><span><strong>上传此刻</strong><small>名单验证后贡献你的镜头</small></span><ArrowUpRight /></a>
        <a href="/staff"><ShieldCheck /><span><strong>幕后守护</strong><small>看见工作人员与辅导老师</small></span><ArrowUpRight /></a>
      </div></div></section>

      <CompanyShowcase selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany} onViewCompany={(id) => { location.href = `/company/${id}`; }} media={media} />

      <section className="section home-live-preview"><div className="page-shell"><div className="section-heading section-heading--split"><div><span className="section-kicker">LIVE NOW</span><h2>此刻，正在汇聚</h2></div><a className="button button--outline" href="/gallery">进入完整直播流<ArrowUpRight /></a></div><div className="home-preview-grid">{media.slice(0, 6).map((item) => <a href={`/gallery?moment=${encodeURIComponent(item.id)}`} key={item.id}>{item.type === "video" ? <video src={item.url} muted playsInline /> : <img src={item.url} alt={item.caption} />}<span><small>{categoryLabel(item.categoryId)}</small><strong>{item.caption}</strong></span></a>)}</div></div></section>

      <section className="section staff-care-section"><div className="page-shell staff-care-card"><div><span className="section-kicker">CARE BEHIND THE MOMENTS</span><h2>每一份守护，都值得被看见</h2><p>特别记录辅导老师与工作人员在集训背后的耐心陪伴、组织保障与温暖付出。</p><a className="button button--outline" href="/staff">进入工作人员专区</a></div><div className="staff-care-count"><strong>{media.filter((item) => item.categoryId === 17).length}</strong><span>个幕后瞬间</span></div></div></section>

      <section className="section ranking-section"><div className="page-shell"><div className="section-heading"><span className="section-kicker">TOP 3 / LIVE</span><h2>连队风采榜</h2><p>首页只展示前三名，完整影像请进入直播流。</p></div><div className="ranking-grid ranking-grid--top">{stats.ranking.slice(0, 3).map((item, index) => <a href={`/company/${item.categoryId}`} className="ranking-card" key={item.categoryId}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{item.name}</span><em>{item.count} 个瞬间</em></a>)}</div></div></section>
    </main>
    <footer className="site-footer"><div className="page-shell site-footer__top"><div><BrandMark inverse /><p>荣聚曙光，梦想启航。</p></div><div className="site-footer__trust"><ShieldCheck /><span><strong>影像友好公约</strong>上传前请确认已获得影像中人物授权</span></div></div><div className="page-shell site-footer__bottom"><span>2026中科曙光集团应届生训战营 · 黄埔八期</span><span>Camp Gallery</span></div></footer>
    <MobileNav onUpload={() => { location.href = "/upload"; }} onQr={() => setShowQr(true)} />
    <SugonCursor />
    {showQr && <QrDialog onClose={() => setShowQr(false)} onNotice={showNotice} />}
    <div className={`toast ${notice ? "is-visible" : ""}`} role="status">{notice}</div>
  </div>;
}
