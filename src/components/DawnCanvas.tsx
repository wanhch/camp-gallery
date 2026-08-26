import { useEffect, useRef } from "react";

interface DawnCanvasProps {
  paused?: boolean;
}

interface LightPoint {
  company: number;
  angle: number;
  radius: number;
  phase: number;
  speed: number;
  size: number;
  depth: number;
}

interface DustPoint {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

const companyColors = ["#d43a45", "#48a47d", "#e3a346", "#4b9cad"];

function seededValue(index: number, salt = 0) {
  const value = Math.sin(index * 91.731 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

const lights: LightPoint[] = Array.from({ length: 736 }, (_, index) => ({
  company: Math.floor(index / 46),
  angle: seededValue(index, 1) * Math.PI * 2,
  radius: 0.16 + Math.pow(seededValue(index, 2), 0.62) * 0.84,
  phase: seededValue(index, 3) * Math.PI * 2,
  speed: 0.24 + seededValue(index, 4) * 0.58,
  size: 0.55 + seededValue(index, 5) * 1.15,
  depth: 0.45 + seededValue(index, 6) * 0.55
}));

const dust: DustPoint[] = Array.from({ length: 96 }, (_, index) => ({
  x: seededValue(index, 7),
  y: seededValue(index, 8),
  size: 0.35 + seededValue(index, 9) * 0.8,
  alpha: 0.08 + seededValue(index, 10) * 0.22
}));

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return `${value >> 16},${(value >> 8) & 255},${value & 255}`;
}

const companyRgb = companyColors.map(hexToRgb);

export function DawnCanvas({ paused = false }: DawnCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const bounds = parent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, bounds.width < 700 ? 1.45 : 1.8);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const hubPosition = (company: number, time: number) => {
      const compact = width < 700;
      const column = company % 4;
      const row = Math.floor(company / 4);
      const fieldLeft = compact ? width * 0.1 : width * 0.56;
      const fieldWidth = compact ? width * 0.8 : width * 0.36;
      const fieldTop = compact ? height * 0.1 : height * 0.2;
      const fieldHeight = compact ? height * 0.28 : height * 0.54;
      const wave = reduceMotion || paused ? 0 : Math.sin(time * 0.00034 + company * 0.84);

      return {
        x: fieldLeft + fieldWidth * (column / 3) + wave * (compact ? 2.2 : 4.5),
        y: fieldTop + fieldHeight * (row / 3) + Math.cos(time * 0.00028 + company) * (reduceMotion || paused ? 0 : 3.6)
      };
    };

    const drawBackground = (time: number) => {
      context.fillStyle = "#080b0a";
      context.fillRect(0, 0, width, height);

      const compact = width < 700;
      const coreX = compact ? width * 0.5 : width * 0.75;
      const coreY = compact ? height * 0.24 : height * 0.47;
      const breathe = reduceMotion || paused ? 0.82 : 0.78 + Math.sin(time * 0.00042) * 0.06;
      const glow = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, Math.max(width, height) * 0.56);
      glow.addColorStop(0, `rgba(183,31,42,${0.2 * breathe})`);
      glow.addColorStop(0.28, `rgba(38,115,132,${0.11 * breathe})`);
      glow.addColorStop(0.68, "rgba(21,34,28,0.12)");
      glow.addColorStop(1, "rgba(8,11,10,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      for (const point of dust) {
        const drift = reduceMotion || paused ? 0 : Math.sin(time * 0.00016 + point.x * 10) * 4;
        context.beginPath();
        context.arc(point.x * width, point.y * height + drift, point.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(214,226,219,${point.alpha})`;
        context.fill();
      }

      context.save();
      context.strokeStyle = "rgba(211,226,218,0.055)";
      context.lineWidth = 1;
      const horizon = compact ? height * 0.61 : height * 0.74;
      for (let row = 0; row < 7; row += 1) {
        const progress = row / 6;
        const y = horizon + Math.pow(progress, 1.8) * height * 0.27;
        context.beginPath();
        context.moveTo(0, y);
        context.quadraticCurveTo(width * 0.5, y - 12 * progress, width, y);
        context.stroke();
      }
      for (let column = 0; column <= 14; column += 1) {
        const x = width * (column / 14);
        context.beginPath();
        context.moveTo(width * 0.5 + (x - width * 0.5) * 0.16, horizon);
        context.lineTo(x, height);
        context.stroke();
      }
      context.restore();
    };

    const draw = (time: number) => {
      drawBackground(time);
      pointerX += (pointerTargetX - pointerX) * 0.045;
      pointerY += (pointerTargetY - pointerY) * 0.045;

      const compact = width < 700;
      const coreX = (compact ? width * 0.5 : width * 0.75) + pointerX * 7;
      const coreY = (compact ? height * 0.24 : height * 0.47) + pointerY * 5;
      const hubs = Array.from({ length: 16 }, (_, company) => hubPosition(company, time));

      context.save();
      context.globalCompositeOperation = "lighter";
      hubs.forEach((hub, company) => {
        const rgb = companyRgb[company];
        const pulse = reduceMotion || paused ? 0.4 : (Math.sin(time * 0.001 + company * 0.72) + 1) / 2;
        const controlX = (hub.x + coreX) / 2 + Math.sin(company * 1.9) * 32;
        const controlY = (hub.y + coreY) / 2 + Math.cos(company * 1.3) * 24;

        context.beginPath();
        context.moveTo(hub.x, hub.y);
        context.quadraticCurveTo(controlX, controlY, coreX, coreY);
        context.strokeStyle = `rgba(${rgb},${0.07 + pulse * 0.065})`;
        context.lineWidth = 0.7 + pulse * 0.45;
        context.stroke();

        const signalProgress = reduceMotion || paused ? (company % 5) / 5 : (time * 0.00013 + company * 0.137) % 1;
        const oneMinus = 1 - signalProgress;
        const signalX = oneMinus * oneMinus * hub.x + 2 * oneMinus * signalProgress * controlX + signalProgress * signalProgress * coreX;
        const signalY = oneMinus * oneMinus * hub.y + 2 * oneMinus * signalProgress * controlY + signalProgress * signalProgress * coreY;
        context.beginPath();
        context.arc(signalX, signalY, 1.4 + pulse * 1.3, 0, Math.PI * 2);
        context.fillStyle = `rgba(${rgb},${0.48 + pulse * 0.35})`;
        context.fill();
      });

      for (const light of lights) {
        const hub = hubs[light.company];
        const rgb = companyRgb[light.company % companyRgb.length];
        const orbit = light.angle + (reduceMotion || paused ? 0.45 : time * 0.00016 * light.speed);
        const clusterRadius = (compact ? 15 : 20) + light.radius * (compact ? 16 : 26);
        const inhale = reduceMotion || paused ? 1 : 0.94 + Math.sin(time * 0.0007 + light.phase) * 0.07;
        let x = hub.x + Math.cos(orbit) * clusterRadius * inhale;
        let y = hub.y + Math.sin(orbit) * clusterRadius * 0.56 * inhale;

        const pointerCanvasX = width * (0.5 + pointerX * 0.5);
        const pointerCanvasY = height * (0.5 + pointerY * 0.5);
        const dx = x - pointerCanvasX;
        const dy = y - pointerCanvasY;
        const distance = Math.hypot(dx, dy);
        if (!compact && distance > 0 && distance < 110) {
          const force = (1 - distance / 110) * 8;
          x += (dx / distance) * force;
          y += (dy / distance) * force;
        }

        const flicker = reduceMotion || paused ? 0.62 : 0.44 + Math.sin(time * 0.0014 * light.speed + light.phase) * 0.19;
        context.beginPath();
        context.arc(x, y, light.size * light.depth, 0, Math.PI * 2);
        context.fillStyle = `rgba(${rgb},${Math.max(0.16, flicker)})`;
        context.fill();
      }

      hubs.forEach((hub, company) => {
        const rgb = companyRgb[company % companyRgb.length];
        const pulse = reduceMotion || paused ? 0 : Math.sin(time * 0.0012 + company) * 1.8;
        context.beginPath();
        context.arc(hub.x, hub.y, 8 + pulse, 0, Math.PI * 2);
        context.fillStyle = `rgba(${rgb},0.16)`;
        context.fill();
        context.beginPath();
        context.arc(hub.x, hub.y, 3.1, 0, Math.PI * 2);
        context.fillStyle = `rgba(${rgb},0.96)`;
        context.fill();
        context.fillStyle = "rgba(241,245,242,0.62)";
        context.font = `${compact ? 8 : 9}px Outfit, sans-serif`;
        context.textAlign = "center";
        context.fillText(String(company + 1).padStart(2, "0"), hub.x, hub.y - 12);
      });

      const corePulse = reduceMotion || paused ? 0.5 : (Math.sin(time * 0.0011) + 1) / 2;
      const coreGlow = context.createRadialGradient(coreX, coreY, 0, coreX, coreY, 48 + corePulse * 14);
      coreGlow.addColorStop(0, `rgba(255,224,175,${0.78 + corePulse * 0.18})`);
      coreGlow.addColorStop(0.2, "rgba(221,72,75,0.42)");
      coreGlow.addColorStop(1, "rgba(183,31,42,0)");
      context.fillStyle = coreGlow;
      context.beginPath();
      context.arc(coreX, coreY, 62 + corePulse * 10, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(coreX, coreY, 3.6, 0, Math.PI * 2);
      context.fillStyle = "rgba(255,244,225,0.98)";
      context.fill();
      context.restore();

      if (!compact) {
        context.save();
        context.fillStyle = "rgba(235,241,237,0.46)";
        context.font = "10px Outfit, sans-serif";
        context.textAlign = "right";
        context.fillText("736 LIGHTS / 16 NODES", width - 34, height - 34);
        context.restore();
      }

      if (!reduceMotion && !paused && visible) frame = requestAnimationFrame(draw);
    };

    const requestDraw = () => {
      cancelAnimationFrame(frame);
      draw(reduceMotion || paused ? 9200 : performance.now());
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = parent.getBoundingClientRect();
      pointerTargetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerTargetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };

    const handlePointerLeave = () => {
      pointerTargetX = 0;
      pointerTargetY = 0;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      requestDraw();
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestDraw();
      else cancelAnimationFrame(frame);
    }, { threshold: 0.02 });

    resizeObserver.observe(parent);
    visibilityObserver.observe(parent);
    parent.addEventListener("pointermove", handlePointerMove, { passive: true });
    parent.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    resize();
    requestDraw();

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerleave", handlePointerLeave);
      cancelAnimationFrame(frame);
    };
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className="dawn-canvas"
      aria-hidden="true"
      data-scene="736-lights-16-nodes"
    />
  );
}
