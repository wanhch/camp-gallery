import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AdminPage } from "./pages/AdminPage";
import { GalleryPage } from "./pages/GalleryPage";
import { ScreenPage } from "./pages/ScreenPage";
import { UploadPage } from "./pages/UploadPage";
import "./styles.css";

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const companyMatch = path.match(/^\/company\/(\d+)$/);
const companyId = companyMatch ? Number(companyMatch[1]) : 0;
const page = path === "/admin" ? <AdminPage />
  : path === "/screen" ? <ScreenPage />
  : path === "/upload" ? <UploadPage />
  : path === "/gallery" ? <GalleryPage />
  : path === "/staff" ? <GalleryPage lockedCategory={17} />
  : companyId >= 1 && companyId <= 16 ? <GalleryPage lockedCategory={companyId} />
  : <App />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page}
  </StrictMode>
);
