import { useRef } from "react";
import { Camera, Flag, Footprints, Sunrise, Upload } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

interface GrowthTimelineProps {
  onUpload?: () => void;
}

const milestones = [
  { day: "DAY 01", title: "初见 · 集结", copy: "从陌生姓名到整齐队列，第一声回应让 736 颗年轻的心正式同频。", icon: Flag },
  { day: "DAY 02", title: "并肩 · 磨合", copy: "脚步从参差到一致，信任从一次次递水、提醒与等待中慢慢生长。", icon: Footprints },
  { day: "DAY 03", title: "突破 · 坚持", copy: "越过身体与意志的临界点，才发现彼此的加油声比疲惫更有力量。", icon: Sunrise },
  { day: "TO FUTURE", title: "出发 · 共赴曙光", copy: "把纪律、协作与担当装进行囊，以新曙光人的身份奔向计算产业一线。", icon: Camera }
];

export function GrowthTimeline({ onUpload }: GrowthTimelineProps) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const timelineScale = useSpring(useTransform(scrollYProgress, [0.08, 0.5], [0, 1]), { stiffness: 100, damping: 26 });
  const imageY = useSpring(useTransform(scrollYProgress, [0.45, 1], [-18, 24]), { stiffness: 90, damping: 24 });

  return (
    <section ref={sectionRef} className="timeline-section section" id="timeline" aria-labelledby="timeline-heading">
      <div className="page-shell">
        <motion.div
          className="section-heading section-heading--split"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <span className="section-kicker">GROWTH IN MOTION</span>
            <h2 id="timeline-heading">成长，有迹可循</h2>
          </div>
          <p>镜头留下的不只是队列与汗水，更是一群年轻人从相遇到并肩的真实轨迹。</p>
        </motion.div>
        <div className="timeline-track">
          <motion.span
            className="timeline-list__progress"
            style={{ scaleX: reduceMotion ? 1 : timelineScale }}
            aria-hidden="true"
          />
          <ol className="timeline-list">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <motion.li
                  key={milestone.day}
                  initial={reduceMotion ? false : { opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : index * 0.07 }}
                >
                  <span className="timeline-list__marker"><Icon aria-hidden="true" /></span>
                  <div>
                    <small>{milestone.day}</small>
                    <h3>{milestone.title}</h3>
                    <p>{milestone.copy}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
      <motion.div
        className="memory-cta"
        initial={reduceMotion ? false : { opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          src="/demo/field-training.jpg"
          alt="团队在训练场上共同前进"
          width="1800"
          height="1200"
          loading="lazy"
          style={{ y: reduceMotion ? 0 : imageY, scale: 1.065 }}
        />
        <div className="memory-cta__scrim" aria-hidden="true" />
        <div className="page-shell memory-cta__content">
          <span>OUR STORY IS STILL GROWING</span>
          <h2>你的镜头，是这段共同记忆的一部分</h2>
          {onUpload && <button className="button button--primary button--large" type="button" onClick={onUpload} data-cursor="launch">
            <Upload aria-hidden="true" />上传我的集训时刻
          </button>}
        </div>
      </motion.div>
    </section>
  );
}
