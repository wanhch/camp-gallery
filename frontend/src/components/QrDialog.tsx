import { useEffect, useId, useState } from "react";
import { Check, Copy, QrCode, Share2, X } from "lucide-react";
import QRCode from "qrcode";
import { ModalFrame } from "./ModalFrame";

interface QrDialogProps {
  onClose: () => void;
  onNotice: (message: string) => void;
}

export function QrDialog({ onClose, onNotice }: QrDialogProps) {
  const titleId = useId();
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}/gallery`;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 720,
      margin: 2,
      color: { dark: "#17191c", light: "#ffffff" },
      errorCorrectionLevel: "H"
    }).then(setQrData).catch(() => onNotice("二维码生成失败，请直接复制链接"));
  }, [onNotice, shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onNotice("访问链接已复制");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onNotice("浏览器未允许复制，请从地址栏分享");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "曙光新星 · 集训纪实", text: "一起看看我们的集训时刻", url: shareUrl });
      } catch {
        return;
      }
    } else {
      await copyLink();
    }
  };

  return (
    <ModalFrame onClose={onClose} labelId={titleId} className="qr-modal">
      <div className="modal-header">
        <div>
          <span className="modal-kicker">无需安装 · 扫码即看</span>
          <h2 id={titleId}>把曙光这一刻，分享给牵挂的人</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭二维码" data-autofocus>
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="qr-content">
        <div className="qr-code-wrap">
          {qrData ? <img src={qrData} alt={`访问 ${shareUrl} 的二维码`} width="360" height="360" /> : <QrCode aria-hidden="true" />}
          <span className="qr-scan-line" aria-hidden="true" />
        </div>
        <div className="qr-copy">
          <strong>家人朋友，微信扫一扫</strong>
          <p>手机浏览器直接打开，照片、视频与 16 连风采完整呈现。</p>
          <code>{shareUrl}</code>
          <div className="qr-actions">
            <button className="button button--primary" type="button" onClick={share}>
              <Share2 aria-hidden="true" />分享页面
            </button>
            <button className="button button--outline" type="button" onClick={copyLink}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "已复制" : "复制链接"}
            </button>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}
