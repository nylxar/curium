export function SettingsPanel({
  theme,
  setTheme,
}: {
  theme: "dark" | "light" | "amoled" | "system";
  setTheme: (t: "dark" | "light" | "amoled" | "system") => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">Theme</div>
        <div className="btn-row">
          {(["system", "dark", "light", "amoled"] as const).map((t) => (
            <button
              key={t}
              className={`btn ${theme === t ? "btn-primary" : ""}`}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-title">Keyboard Shortcuts</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span>Shuffle style</span>
            <kbd
              style={{
                background: "var(--bg)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              Space
            </kbd>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span>Export SVG</span>
            <kbd
              style={{
                background: "var(--bg)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              Ctrl+S
            </kbd>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span>Export PNG</span>
            <kbd
              style={{
                background: "var(--bg)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              Ctrl+Shift+S
            </kbd>
          </div>
        </div>
      </div>
    </>
  );
}
