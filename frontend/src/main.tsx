import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GalleryPage } from "./pages/GalleryPage";
import { useLocation } from "./router";
import "./styles.css";

const AdminPage = lazy(() => import("./pages/AdminPage").then((module) => ({ default: module.AdminPage })));
const ScreenPage = lazy(() => import("./pages/ScreenPage").then((module) => ({ default: module.ScreenPage })));
const UploadPage = lazy(() => import("./pages/UploadPage").then((module) => ({ default: module.UploadPage })));

function Root() {
  const { pathname, search } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const companyMatch = path.match(/^\/company\/(\d+)$/);
  const companyId = companyMatch ? Number(companyMatch[1]) : 0;
  // key 让 query 变化（如 /gallery?moment=xxx）时页面按新参数重新挂载
  const pageKey = `${path}${search}`;
  const page = path === "/admin" ? <AdminPage />
    : path === "/screen" ? <ScreenPage />
    : path === "/upload" ? <UploadPage />
    : path === "/gallery" ? <GalleryPage />
    : path === "/staff" ? <GalleryPage lockedCategory={17} />
    : companyId >= 1 && companyId <= 16 ? <GalleryPage lockedCategory={companyId} />
    : <App />;

  return (
    <Suspense fallback={<div className="route-loading" role="status">正在加载…</div>}>
      <div key={pageKey} className="route-frame">{page}</div>
    </Suspense>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
