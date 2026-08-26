import { useEffect, useMemo, useState } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { fetchMedia, fetchStats } from "../api";
import { categoryLabel } from "../data/companies";
import type { MediaItem, PlatformStats } from "../types";

const emptyStats: PlatformStats = { trainees: 736, companies: 16, media: 0, photos: 0, videos: 0, ranking: [] };
export function ScreenPage() {
  const [media, setMedia] = useState<MediaItem[]>([]); const [stats, setStats] = useState(emptyStats); const [index, setIndex] = useState(0); const [paused, setPaused] = useState(false); const [muted, setMuted] = useState(true);
  const ordered = useMemo(() => [...media].sort((a, b) => Number(b.featured) - Number(a.featured)), [media]);
  const current = ordered[index % Math.max(ordered.length, 1)];
  useEffect(() => { const load = async () => { const [m, s] = await Promise.all([fetchMedia(), fetchStats()]); setMedia(m.items); setStats(s); }; void load(); const refresh = setInterval(load, 30000); return () => clearInterval(refresh); }, []);
  useEffect(() => { if (paused || ordered.length < 2) return; const timer = setInterval(() => setIndex((value) => (value + 1) % ordered.length), current?.type === "video" ? 9000 : 6000); return () => clearInterval(timer); }, [current?.type, ordered.length, paused]);
  if (!current) return <main className="screen-page screen-empty"><h1>曙光新星 · 集训纪实</h1><p>等待第一个精彩瞬间上传……</p></main>;
  return <main className="screen-page">
    <div className="screen-media">{current.type === "video" ? <video key={current.id} src={current.url} autoPlay playsInline muted={muted} /> : <img key={current.id} src={current.url} alt={current.caption} />}</div><div className="screen-shade" />
    <header><strong>曙光新星 · 集训纪实</strong><span>{stats.media} 个共同记忆正在汇聚</span></header>
    <section><small>{current.featured ? "精选瞬间 · " : ""}{categoryLabel(current.categoryId)}</small><h1>{current.caption}</h1><p>{index + 1} / {ordered.length}</p></section>
    <nav><button onClick={() => setPaused((value) => !value)}>{paused ? <Play /> : <Pause />}</button>{current.type === "video" && <button onClick={() => setMuted((value) => !value)}>{muted ? <VolumeX /> : <Volume2 />}</button>}<button onClick={() => document.documentElement.requestFullscreen?.()}><Maximize /></button></nav>
  </main>;
}
