import { useEffect, useMemo, useState } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { fetchMedia, fetchStats } from "../api";
import { categoryLabel } from "../data/companies";
import type { MediaItem, PlatformStats } from "../types";

const emptyStats: PlatformStats = { trainees: 736, companies: 16, media: 0, photos: 0, videos: 0, ranking: [] };

export function ScreenPage() {
  const [media, setMedia] = useState<MediaItem[]>([]); const [stats, setStats] = useState(emptyStats); const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false); const [muted, setMuted] = useState(true);
  const reduceMotion = useReducedMotion();
  const ordered = useMemo(() => [...media].sort((a, b) => Number(b.featured) - Number(a.featured)), [media]);
  const current = ordered[index % Math.max(ordered.length, 1)];

  useEffect(() => {
    const load = async () => { const [m, s] = await Promise.all([fetchMedia(), fetchStats()]); setMedia(m.items); setStats(s); };
    void load();
    const refresh = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    const handleVisibility = () => { if (!document.hidden) void load(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { clearInterval(refresh); document.removeEventListener("visibilitychange", handleVisibility); };
  }, []);
  useEffect(() => { if (paused || ordered.length < 2) return; const timer = setInterval(() => setIndex((value) => (value + 1) % ordered.length), current?.type === "video" ? 9000 : 6000); return () => clearInterval(timer); }, [current?.type, ordered.length, paused]);

  // 预取下一张照片，避免切换瞬间白屏
  useEffect(() => {
    if (ordered.length < 2) return;
    const next = ordered[(index + 1) % ordered.length];
    if (next?.type === "photo") { const preload = new Image(); preload.src = next.url; }
  }, [index, ordered]);

  if (!current) return <main className="screen-page screen-empty"><h1>黄埔八期 · 荣聚曙光，梦想启航</h1><p>等待第一个精彩瞬间上传……</p></main>;
  return <main className="screen-page">
    <div className="screen-media">
      <AnimatePresence>
        <motion.div
          key={current.id}
          className="screen-media__frame"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
        >
          {current.type === "video" ? <video src={current.url} autoPlay playsInline muted={muted} /> : <img src={current.url} alt={current.caption} />}
        </motion.div>
      </AnimatePresence>
    </div><div className="screen-shade" />
    <header><strong>2026中科曙光集团应届生训战营 · 黄埔八期</strong><span>{stats.media} 个共同记忆正在汇聚</span></header>
    <section><small>{current.featured ? "精选瞬间 · " : ""}{categoryLabel(current.categoryId)}</small><h1>{current.caption}</h1><p>{index + 1} / {ordered.length}</p></section>
    <nav><button onClick={() => setPaused((value) => !value)}>{paused ? <Play /> : <Pause />}</button>{current.type === "video" && <button onClick={() => setMuted((value) => !value)}>{muted ? <VolumeX /> : <Volume2 />}</button>}<button onClick={() => document.documentElement.requestFullscreen?.()}><Maximize /></button></nav>
  </main>;
}
