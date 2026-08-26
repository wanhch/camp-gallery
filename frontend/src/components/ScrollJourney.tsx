import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

const stages = [
  { id: "home", index: "01", label: "集结" },
  { id: "companies", index: "02", label: "连队" },
  { id: "gallery", index: "03", label: "影像" },
  { id: "timeline", index: "04", label: "成长" }
] as const;

export function ScrollJourney() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 95, damping: 24, mass: 0.32 });
  const progress = reduceMotion ? scrollYProgress : smoothProgress;
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sections = stages
      .map((stage) => document.getElementById(stage.id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setActive(visible.target.id);
    }, { rootMargin: "-28% 0px -58% 0px", threshold: [0, 0.08, 0.2, 0.5] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const visit = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <aside className="scroll-journey" aria-label="页面阅读进度">
        <span className="scroll-journey__track" aria-hidden="true">
          <motion.i style={{ scaleY: progress }} />
        </span>
        {stages.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className={active === stage.id ? "is-active" : ""}
            onClick={() => visit(stage.id)}
            aria-current={active === stage.id ? "location" : undefined}
          >
            <span>{stage.index}</span>
            <small>{stage.label}</small>
          </button>
        ))}
      </aside>
      <div className="scroll-journey-mobile" aria-hidden="true">
        <motion.i style={{ scaleX: progress }} />
      </div>
    </>
  );
}
