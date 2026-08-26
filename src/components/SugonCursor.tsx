import { useEffect, useRef, useState } from "react";
import { MousePointer2, Send } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

interface Spark {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

export function SugonCursor() {
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(-80);
  const rawY = useMotionValue(-80);
  const x = useSpring(rawX, { stiffness: 880, damping: 52, mass: 0.14 });
  const y = useSpring(rawY, { stiffness: 880, damping: 52, mass: 0.14 });
  const [enabled, setEnabled] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [hoverLabel, setHoverLabel] = useState("");
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkId = useRef(0);
  const releaseTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const updateAvailability = () => setEnabled(finePointer.matches && navigator.maxTouchPoints === 0 && !reduceMotion);
    updateAvailability();
    finePointer.addEventListener("change", updateAvailability);
    return () => finePointer.removeEventListener("change", updateAvailability);
  }, [reduceMotion]);

  useEffect(() => {
    if (!enabled) {
      document.documentElement.classList.remove("has-sugon-cursor");
      return;
    }

    document.documentElement.classList.add("has-sugon-cursor");
    const handleMove = (event: PointerEvent) => {
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-cursor]") : null;
      setHoverLabel(target?.dataset.cursor ?? "");
    };
    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      window.clearTimeout(releaseTimer.current);
      setPressed(true);
      const colors = ["#d43a45", "#f0b44d", "#ffffff", "#55b58b"];
      const nextSparks = Array.from({ length: 9 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 9 + 0.18;
        const distance = 20 + (index % 3) * 8;
        return {
          id: sparkId.current++,
          x: event.clientX,
          y: event.clientY,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          color: colors[index % colors.length]
        };
      });
      setSparks(nextSparks);
      window.setTimeout(() => setSparks((current) => current.filter((spark) => !nextSparks.includes(spark))), 620);
    };
    const handleUp = () => {
      releaseTimer.current = window.setTimeout(() => setPressed(false), 180);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleDown, { passive: true });
    window.addEventListener("pointerup", handleUp, { passive: true });
    return () => {
      document.documentElement.classList.remove("has-sugon-cursor");
      window.clearTimeout(releaseTimer.current);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [enabled, rawX, rawY]);

  if (!enabled) return null;

  return (
    <div className="sugon-cursor-layer" aria-hidden="true">
      <motion.div className="sugon-cursor-track" style={{ x, y }}>
        <motion.div
          className={`sugon-cursor ${pressed ? "is-launched" : ""} ${hoverLabel ? "is-hovering" : ""}`}
          animate={{ scale: hoverLabel ? 1.12 : 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 28 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {pressed ? (
              <motion.span
                key="plane"
                className="sugon-cursor__plane"
                initial={{ opacity: 0, scale: 0.55, rotate: -72 }}
                animate={{ opacity: 1, scale: 1, rotate: -35, x: 12, y: -12 }}
                exit={{ opacity: 0, scale: 0.7, x: 24, y: -24 }}
                transition={{ duration: 0.2 }}
              >
                <Send aria-hidden="true" />
                <b>SUGON</b>
              </motion.span>
            ) : (
              <motion.span
                key="pointer"
                className="sugon-cursor__pointer"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.65 }}
                transition={{ duration: 0.13 }}
              >
                <MousePointer2 aria-hidden="true" />
                <i />
              </motion.span>
            )}
          </AnimatePresence>
          {hoverLabel && !pressed && <small>{hoverLabel === "launch" ? "起飞" : hoverLabel === "view" ? "查看" : "点亮"}</small>}
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {sparks.map((spark) => (
          <motion.i
            key={spark.id}
            className="sugon-cursor-spark"
            style={{ left: spark.x, top: spark.y, color: spark.color, backgroundColor: spark.color }}
            initial={{ opacity: 1, scale: 0.4, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 1.25, x: spark.dx, y: spark.dy }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
