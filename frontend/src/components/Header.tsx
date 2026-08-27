import { useEffect, useState } from "react";
import { Camera, QrCode } from "lucide-react";
import { Link } from "../router";

interface HeaderProps {
  onUpload?: () => void;
  onQr: () => void;
}

const navItems = [
  ["/", "首页"],
  ["/#companies", "连队星图"],
  ["/gallery", "影像直播"],
  ["/staff", "工作人员"]
] as const;

export function Header({ onUpload, onQr }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>("[data-scroll-root]");
    let lastY = 0;
    const handleScroll = () => {
      const y = container ? container.scrollTop : window.scrollY;
      const dy = y - lastY;
      lastY = y;
      setScrolled(y > 40);
      // 下滑越过顶部后隐藏标题栏，上滑或回到顶部时显示
      if (y > 96 && dy > 4) setHidden(true);
      else if (dy < -4 || y <= 96) setHidden(false);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    container?.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      container?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""} ${hidden ? "site-header--hidden" : ""}`}>
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label="返回首页">
          <span className="site-header__logo" aria-hidden="true">
            <img src="/brand/sugon-logo.png" alt="" width="1186" height="1080" />
          </span>
          <span className="site-header__divider" aria-hidden="true" />
          <span className="site-header__title">黄埔八期</span>
        </Link>
        <nav className="site-nav" aria-label="主要导航">
          {navItems.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <button className="icon-button header-qr" type="button" onClick={onQr} aria-label="打开分享二维码">
            <QrCode aria-hidden="true" />
          </button>
          {onUpload && <button className="button button--primary header-upload" type="button" onClick={onUpload}>
            <Camera aria-hidden="true" />
            上传此刻
          </button>}
        </div>
      </div>
    </header>
  );
}
