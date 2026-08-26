import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Images, Shuffle, Users } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { companies, getCompany } from "../data/companies";
import type { MediaItem } from "../types";

interface CompanyShowcaseProps {
  selectedCompany: number;
  onSelectCompany: (company: number) => void;
  onViewCompany: (company: number) => void;
  media: MediaItem[];
}

export function CompanyShowcase({ selectedCompany, onSelectCompany, onViewCompany, media }: CompanyShowcaseProps) {
  const company = getCompany(selectedCompany);
  const reduceMotion = useReducedMotion();
  const companyMedia = media.filter((item) => item.company === company.id);
  const [spotlighting, setSpotlighting] = useState(false);
  const spotlightTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(spotlightTimer.current), []);

  const handleViewMedia = () => {
    onViewCompany(company.id);
    document.querySelector("#gallery")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  const spotlightCompany = () => {
    if (spotlighting) return;
    setSpotlighting(true);
    let tick = 0;
    spotlightTimer.current = window.setInterval(() => {
      tick += 1;
      const next = ((selectedCompany - 1 + tick * 5 + Math.floor(tick / 3) * 2) % companies.length) + 1;
      onSelectCompany(next);
      if (tick >= (reduceMotion ? 1 : 8)) {
        window.clearInterval(spotlightTimer.current);
        setSpotlighting(false);
      }
    }, reduceMotion ? 30 : 92);
  };

  return (
    <section className="company-section section" id="companies" aria-labelledby="companies-heading">
      <div className="page-shell">
        <motion.div
          className="section-heading section-heading--split"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <span className="section-kicker">16 COMPANIES / ONE SUGON</span>
            <h2 id="companies-heading">每一连，都是主角</h2>
          </div>
          <div className="section-heading__aside">
            <p>46 人一连，16 份不同锋芒。点击连队编号，展开属于他们的集体影像。</p>
            <button
              type="button"
              className="button button--signal"
              onClick={spotlightCompany}
              disabled={spotlighting}
              data-cursor="spark"
            >
              <Shuffle aria-hidden="true" />
              {spotlighting ? "正在巡航" : "随机点亮一连"}
            </button>
          </div>
        </motion.div>

        <motion.div
          className="company-switcher"
          role="group"
          aria-label="选择连队"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: reduceMotion ? 0 : 0.58, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {companies.map((item) => (
            <button
              key={item.id}
              className={`company-switcher__item ${item.id === company.id ? "is-active" : ""}`}
              type="button"
              onClick={() => onSelectCompany(item.id)}
              aria-pressed={item.id === company.id}
              style={{ "--company-accent": item.accent } as CSSProperties}
              data-cursor="spark"
            >
              <span>{item.number}</span>
              <small>{item.name}</small>
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={company.id}
            className="company-feature"
            style={{ "--company-accent": company.accent } as CSSProperties}
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -14, scale: 0.995 }}
            transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="company-feature__visual">
              <img src={company.image} alt={`${company.name}连队风采示例`} width="1800" height="1200" loading="lazy" />
              <div className="company-feature__number" aria-hidden="true">{company.number}</div>
              <span className="demo-label">示例影像</span>
            </div>
            <div className="company-feature__copy">
              <span className="company-feature__index">第 {company.number} 连</span>
              <h3>{company.name}</h3>
              <blockquote>“{company.motto}”</blockquote>
              <p>{company.summary}</p>
              <div className="company-feature__facts">
                <span><Users aria-hidden="true" /><strong>{company.members}</strong> 位伙伴</span>
                <span><Images aria-hidden="true" /><strong>{companyMedia.length}</strong> 个瞬间</span>
              </div>
              <button className="text-button" type="button" onClick={handleViewMedia} data-cursor="view">
                查看本连影像
                <ArrowUpRight aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
