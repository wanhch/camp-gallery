import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AdminPage } from "./pages/AdminPage";
import { ScreenPage } from "./pages/ScreenPage";
import "./styles.css";

const path = window.location.pathname.replace(/\/+$/, "") || "/";
const page = path === "/admin" ? <AdminPage /> : path === "/screen" ? <ScreenPage /> : path === "/gallery" ? <App readOnly /> : path === "/upload" ? <App initialUpload /> : <App />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page}
  </StrictMode>
);
