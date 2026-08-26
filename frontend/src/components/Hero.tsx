import { useState } from "react";
import { ArrowDown, Camera, Network, Pause, Play, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { PlatformStats } from "../types";
import { DawnCanvas } from "./DawnCanvas";

interface HeroProps {
  stats: PlatformStats;
  onUpload?: () => void;
}

const heroMotion = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
};

export function Hero({ stats, onUpload }: HeroProps) {
  const reduceMotion = useReducedMotion();
  const [scenePaused, setScenePaused] = useState(false);

  const scrollToCompanies = () => {
    document.querySelector("#companies")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <section className="hero" id="home" aria-labelledby="hero-heading">
      <DawnCanvas paused={scenePaused} />
      <p className="sr-only">动态场景由 736 个学员光点组成，每 46 个光点汇聚成一个连队节点，共同连接到曙光核心。</p>

      <motion.div
        className="hero__scene-meta"
        initial={reduceMotion ? false : { opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.46 }}
      >
        <span><Network aria-hidden="true" />实时集结场</span>
        <strong>736</strong>
        <small>束微光 / 16 个连队节点</small>
        <button
          type="button"
          className="scene-motion-control"
          onClick={() => setScenePaused((value) => !value)}
          aria-pressed={scenePaused}
        >
          {scenePaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {scenePaused ? "继续动态" : "暂停动态"}
        </button>
      </motion.div>

      <motion.div
        className="hero__content page-shell"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        transition={{ staggerChildren: reduceMotion ? 0 : 0.11, delayChildren: 0.12 }}
      >
        <motion.div className="hero__eyebrow" variants={heroMotion} transition={{ duration: 0.55 }}>
          <span className="live-dot" aria-hidden="true" />
          2026 中科曙光集团应届生训战营
        </motion.div>
        <motion.h1 id="hero-heading" variants={heroMotion} transition={{ duration: 0.68 }}>
          黄埔八期
          <span>荣聚曙光，梦想启航</span>
        </motion.h1>
        <motion.p className="hero__lead" variants={heroMotion} transition={{ duration: 0.68 }}>
          736 位新曙光人正在汇成 16 支并肩连队。每一个光点都是此刻的你，每一次连接都在写下我们的共同记忆。
        </motion.p>
        <motion.div className="hero__actions" variants={heroMotion} transition={{ duration: 0.55 }}>
          {onUpload && <button className="button button--primary button--large" type="button" onClick={onUpload} data-cursor="launch">
            <Camera aria-hidden="true" />
            上传此刻
          </button>}
          <button className="button button--glass button--large" type="button" onClick={scrollToCompanies}>
            浏览 16 连
            <ArrowDown aria-hidden="true" />
          </button>
        </motion.div>
        <motion.dl className="hero__stats" variants={heroMotion} transition={{ duration: 0.6 }}>
          <div>
            <dt>并肩同行</dt>
            <dd><strong>{stats.trainees}</strong><span>位学员</span></dd>
          </div>
          <div>
            <dt>集结成队</dt>
            <dd><strong>{stats.companies}</strong><span>支连队</span></dd>
          </div>
          <div>
            <dt>已汇聚</dt>
            <dd><strong>{stats.media}</strong><span>个瞬间</span></dd>
          </div>
        </motion.dl>
      </motion.div>

      <button className="hero__scroll-cue" type="button" onClick={scrollToCompanies} aria-label="继续浏览连队风采">
        <Sparkles aria-hidden="true" />
        <span>向下，遇见每一支队伍</span>
        <ArrowDown aria-hidden="true" />
      </button>
    </section>
  );
}
