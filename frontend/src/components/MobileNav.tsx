import { Camera, Home, Images, QrCode, UsersRound } from "lucide-react";

interface MobileNavProps {
  onUpload?: () => void;
  onQr: () => void;
}

export function MobileNav({ onUpload, onQr }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="移动端主要导航">
      <a href="#home" aria-label="首页"><Home aria-hidden="true" /><span>首页</span></a>
      <a href="#companies" aria-label="连队风采"><UsersRound aria-hidden="true" /><span>连队</span></a>
      {onUpload && <button className="mobile-nav__upload" type="button" onClick={onUpload} aria-label="上传照片或视频">
        <Camera aria-hidden="true" />
      </button>}
      <a href="#gallery" aria-label="集训风采"><Images aria-hidden="true" /><span>风采</span></a>
      <button type="button" onClick={onQr} aria-label="分享二维码"><QrCode aria-hidden="true" /><span>分享</span></button>
    </nav>
  );
}
