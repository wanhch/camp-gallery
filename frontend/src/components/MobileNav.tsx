import { Camera, Home, Images, QrCode, UsersRound } from "lucide-react";
import { Link, useLocation } from "../router";

interface MobileNavProps {
  onUpload?: () => void;
  onQr: () => void;
}

export function MobileNav({ onUpload, onQr }: MobileNavProps) {
  const { pathname, hash } = useLocation();
  const isHome = pathname === "/";
  const isGallery = pathname.startsWith("/gallery") || pathname.startsWith("/company");
  const isCompanies = isHome && hash === "#companies";

  return (
    <nav className="mobile-nav" aria-label="移动端主要导航">
      <Link href="/" className={isHome && !isCompanies ? "is-active" : ""} aria-current={isHome && !isCompanies ? "page" : undefined} aria-label="首页">
        <Home aria-hidden="true" /><span>首页</span>
      </Link>
      <Link href="/#companies" className={isCompanies ? "is-active" : ""} aria-label="连队风采">
        <UsersRound aria-hidden="true" /><span>连队</span>
      </Link>
      {onUpload && <button className="mobile-nav__upload" type="button" onClick={onUpload} aria-label="上传照片或视频">
        <Camera aria-hidden="true" />
      </button>}
      <Link href="/gallery" className={isGallery ? "is-active" : ""} aria-current={isGallery ? "page" : undefined} aria-label="集训风采">
        <Images aria-hidden="true" /><span>风采</span>
      </Link>
      <button type="button" onClick={onQr} aria-label="分享二维码"><QrCode aria-hidden="true" /><span>分享</span></button>
    </nav>
  );
}
