import { ExternalLink } from "lucide-react";
import buildInfo from "../build-info.json";

export function InfoPanel() {
  const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI__;

  return (
    <>
      <div className="section">
        <div className="section-title">Build</div>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Version</span>
            <span className="info-value">0.5.7</span>
          </div>
          <div className="info-row">
            <span className="info-label">Platform</span>
            <span className="info-value">
              {isTauri ? "Desktop (Tauri)" : "Desktop (Web)"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Runtime</span>
            <span className="info-value">
              {isTauri ? "React + Tauri" : "React + rsbuild"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Renderer</span>
            <span className="info-value">
              {isTauri
                ? navigator.userAgent.includes("Edg")
                  ? "WebView2"
                  : "WebKitGTK"
                : "Browser"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Commit</span>
            <span className="info-value">
              {buildInfo.shortCommit}
              {buildInfo.isDirty ? " +" : ""}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Branch</span>
            <span className="info-value">{buildInfo.branch}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Built</span>
            <span className="info-value">
              {buildInfo.buildDate.split("T")[0]}
            </span>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="section-title">Links</div>
        <div className="link-list">
          <a
            className="link-row"
            href="https://github.com/nylxar/curium"
            target="_blank"
            rel="noreferrer"
          >
            <span>Source Code</span>
            <ExternalLink size={14} />
          </a>
          <a
            className="link-row"
            href="https://github.com/nylxar/curium/issues"
            target="_blank"
            rel="noreferrer"
          >
            <span>Report an Issue</span>
            <ExternalLink size={14} />
          </a>
          <a
            className="link-row"
            href="https://x.com/nylxar"
            target="_blank"
            rel="noreferrer"
          >
            <span>Follow Nylxar</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <div className="section" style={{ textAlign: "center", marginTop: 24 }}>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-faint)",
            letterSpacing: 0.5,
          }}
        >
          Made with cats · Open source · Free forever
        </p>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-faint)",
            letterSpacing: 0.5,
            marginTop: 4,
          }}
        >
          &copy; {new Date().getFullYear()} Curium
        </p>
      </div>
    </>
  );
}
