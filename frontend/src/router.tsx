import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

const NAVIGATE_EVENT = "camp:navigate";

interface LocationState {
  pathname: string;
  search: string;
  hash: string;
}

function readLocation(): LocationState {
  return { pathname: window.location.pathname, search: window.location.search, hash: window.location.hash };
}

function scrollToHash(hash: string) {
  if (!hash) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
  // 双重重试：跨页面导航时需要等待 React 渲染出目标锚点
  requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView({ behavior }));
  window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior }), 120);
}

/**
 * 无刷新导航：pushState + 事件通知。
 * 带 hash 时滚动到目标锚点（scrollIntoView 对整屏翻页容器同样生效），否则回到顶部。
 */
export function navigate(to: string) {
  const url = new URL(to, window.location.origin);
  window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  if (url.hash) {
    scrollToHash(url.hash);
  } else {
    window.scrollTo(0, 0);
    document.querySelector<HTMLElement>("[data-scroll-root]")?.scrollTo({ top: 0, behavior: "auto" });
  }
}

/** 订阅当前地址栏（pushState、replaceState 之外的 popstate 也会触发）。 */
export function useLocation(): LocationState {
  const [location, setLocation] = useState<LocationState>(readLocation);
  useEffect(() => {
    const update = () => {
      setLocation(readLocation());
      if (window.location.hash) scrollToHash(window.location.hash);
    };
    window.addEventListener("popstate", update);
    window.addEventListener(NAVIGATE_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAVIGATE_EVENT, update);
    };
  }, []);
  return location;
}

export function usePathname() {
  return useLocation().pathname;
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
}

/** 内部链接：普通点击无刷新跳转，新标签/修饰键/外部地址保持浏览器默认行为。 */
export function Link({ href, onClick, children, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (rest.target && rest.target !== "_self") return;
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handleClick} {...rest}>{children}</a>;
}
