import { ArrowUpRight, BookOpen, ExternalLink, Play, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const officialLinks = [
  {
    label: "人才培训",
    title: "曙光 2024 应届生训战营圆满结营",
    source: "中科曙光官网",
    href: "https://www.sugon.com/about/talents",
    icon: Users
  },
  {
    label: "人才成长",
    title: "2024 级金种子业务精英人才培养项目",
    source: "中科曙光官网",
    href: "https://www.sugon.com/cut?id=2459&nav_id=160",
    icon: BookOpen
  }
] as const;

export function OfficialStories() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? false : { opacity: 0, y: 26 };

  return (
    <section className="official-section section" aria-labelledby="official-heading">
      <div className="page-shell">
        <motion.div
          className="section-heading section-heading--split"
          initial={reveal}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <span className="section-kicker">FROM SUGON / OFFICIAL VIEW</span>
            <h2 id="official-heading">从集训现场，看见更大的曙光</h2>
          </div>
          <p>将本届影像放进真实的品牌成长脉络里：从人才培养，到计算产业一线，每一步都通往同一个未来。</p>
        </motion.div>

        <div className="official-stage">
          <motion.a
            className="official-video"
            href="https://www.bilibili.com/video/BV1HT421k7Nf/"
            target="_blank"
            rel="noreferrer"
            initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            data-cursor="view"
          >
            <img
              src="/official/waic-sugon-cover.jpg"
              alt="中科曙光亮相 2024 世界人工智能大会视频封面"
              width="720"
              height="540"
              loading="lazy"
            />
            <span className="official-video__shade" aria-hidden="true" />
            <span className="official-video__play"><Play fill="currentColor" aria-hidden="true" /></span>
            <span className="official-video__copy">
              <small>世界人工智能大会官方账号 · 01:47</small>
              <strong>点燃新“智”生产力引擎</strong>
              <span>中科曙光亮相 WAIC 2024 <ArrowUpRight aria-hidden="true" /></span>
            </span>
          </motion.a>

          <motion.div
            className="official-index"
            initial={reduceMotion ? false : { opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduceMotion ? 0 : 0.64, delay: reduceMotion ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="official-index__head">
              <span>OFFICIAL DISPATCHES</span>
              <strong>官网人才成长纪实</strong>
            </div>
            {officialLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <a key={item.href} href={item.href} target="_blank" rel="noreferrer" data-cursor="view">
                  <span className="official-index__number">0{index + 1}</span>
                  <span className="official-index__icon"><Icon aria-hidden="true" /></span>
                  <span className="official-index__copy">
                    <small>{item.label} / {item.source}</small>
                    <strong>{item.title}</strong>
                  </span>
                  <ExternalLink aria-hidden="true" />
                </a>
              );
            })}
            <p>公开内容保留原发布页链接，正式内部素材仍以获得授权的本届集训影像为准。</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
