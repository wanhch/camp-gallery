import { useEffect, useState } from "react";
import { Camera, QrCode } from "lucide-react";
import { BrandMark } from "./BrandMark";

interface HeaderProps {
  onUpload: () => void;
  onQr: () => void;
}

const navItems = [
  ["#home", "首页"],
  ["#companies", "连队风采"],
  ["#gallery", "集训瞬间"],
  ["#timeline", "成长足迹"]
] as const;

export function Header({ onUpload, onQr }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <div className="site-header__inner">
        <a href="#home" className="site-header__brand" aria-label="返回首页">
          <BrandMark inverse={!scrolled} />
          <span className="site-header__divider" aria-hidden="true" />
          <span className="site-header__title">曙光新星</span>
        </a>
        <nav className="site-nav" aria-label="主要导航">
          {navItems.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <div className="site-header__actions">
          <button className="icon-button header-qr" type="button" onClick={onQr} aria-label="打开分享二维码">
            <QrCode aria-hidden="true" />
          </button>
          <button className="button button--primary header-upload" type="button" onClick={onUpload}>
            <Camera aria-hidden="true" />
            上传此刻
          </button>
        </div>
      </div>
    </header>
  );
}
