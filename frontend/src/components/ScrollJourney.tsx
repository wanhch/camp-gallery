import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const stages = [
  { id: "home", index: "01", label: "集结" },
  { id: "companies", index: "02", label: "连队" },
  { id: "live", index: "03", label: "影像" },
  { id: "care", index: "04", label: "守护" },
  { id: "ranking", index: "05", label: "榜单" }
] as const;

export function ScrollJourney() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<string>("home");
  const trackRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>("[data-scroll-root]");
    if (!container) return;

    const sections = stages
      .map((stage) => document.getElementById(stage.id))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) setActive(entry.target.id);
      });
    }, { root: container, threshold: [0.55] });
    sections.forEach((section) => observer.observe(section));

    const updateProgress = () => {
      const max = container.scrollHeight - container.clientHeight;
      const progress = max > 0 ? Math.min(1, container.scrollTop / max) : 0;
      if (trackRef.current) trackRef.current.style.transform = `scaleY(${progress})`;
      if (mobileRef.current) mobileRef.current.style.transform = `scaleX(${progress})`;
    };
    updateProgress();
    container.addEventListener("scroll", updateProgress, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", updateProgress);
    };
  }, []);

  const visit = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <aside className="scroll-journey" aria-label="首页分屏导航">
        <span className="scroll-journey__track" aria-hidden="true">
          <i ref={trackRef} />
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
        <i ref={mobileRef} />
      </div>
    </>
  );
}
