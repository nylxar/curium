import {
  QRStyle,
  QR_COLORS,
  EYE_SHAPES,
  PUPIL_SHAPES,
  PIXEL_SHAPES,
  FrameStyle,
  LogoBackground,
} from "@curium/shared";

const FRAME_OPTIONS: FrameStyle[] = ["none", "thin", "rounded", "thick", "dashed", "dotted", "double"];
const FRAME_LABELS: Record<FrameStyle, string> = { none: "None", thin: "Thin", rounded: "Round", thick: "Thick", dashed: "Dash", dotted: "Dot", double: "Dbl" };

const CORNER_OPTIONS = [
  { value: 0, label: "Sharp" },
  { value: 8, label: "Slight" },
  { value: 16, label: "Soft" },
  { value: 24, label: "Round" },
  { value: 32, label: "Pill" },
];

const ANGLE_PRESETS = [
  { value: 0, label: "↑" },
  { value: 90, label: "→" },
  { value: 180, label: "↓" },
  { value: 270, label: "←" },
];

const LOGO_BACKGROUNDS: { id: LogoBackground; label: string }[] = [
  { id: "none", label: "None" },
  { id: "circle", label: "Circle" },
  { id: "rounded", label: "Round" },
  { id: "square", label: "Square" },
];

const PADDING_STEPS = [0, 5, 10, 15, 20];

interface StylePanelProps {
  style: QRStyle;
  onUpdate: (partial: Partial<QRStyle>) => void;
  section?: "style" | "adjust";
}

export function StylePanel({ style, onUpdate, section = "style" }: StylePanelProps) {
  if (section === "adjust") {
    return (
      <>
        {/* ── Frame ── */}
        <div className="section">
          <div className="section-title">Frame</div>
          <div className="shape-grid">
            {FRAME_OPTIONS.map((f) => (
              <button key={f} className={`shape-btn ${style.frame === f ? "active" : ""}`} onClick={() => onUpdate({ frame: f })}>
                {FRAME_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* ── QR Corners ── */}
        <div className="section">
          <div className="section-title">QR Corners</div>
          <div className="shape-grid">
            {CORNER_OPTIONS.map((c) => (
              <button key={c.value} className={`shape-btn ${style.qrCorners === c.value ? "active" : ""}`} onClick={() => onUpdate({ qrCorners: c.value })}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Gradient ── */}
        <div className="section">
          <div className="section-title">Gradient</div>
          <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={style.gradient.enabled} onChange={(e) => onUpdate({ gradient: { ...style.gradient, enabled: e.target.checked } })} style={{ width: 16, height: 16 }} />
            Enable
          </label>
          {style.gradient.enabled && (
            <>
              <div className="btn-row" style={{ marginTop: 8 }}>
                {ANGLE_PRESETS.map((a) => (
                  <button key={a.value} className={`btn ${style.gradient.angle === a.value ? "btn-primary" : ""}`} onClick={() => onUpdate({ gradient: { ...style.gradient, angle: a.value } })}>
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Start</label>
                <input type="color" className="input" value={style.gradient.startColor} onChange={(e) => onUpdate({ gradient: { ...style.gradient, startColor: e.target.value } })} style={{ height: 36, padding: 4, cursor: "pointer" }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)" }}>End</label>
                <input type="color" className="input" value={style.gradient.endColor} onChange={(e) => onUpdate({ gradient: { ...style.gradient, endColor: e.target.value } })} style={{ height: 36, padding: 4, cursor: "pointer" }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Angle: {style.gradient.angle}°</label>
                <input type="range" min={0} max={345} step={15} value={style.gradient.angle} onChange={(e) => onUpdate({ gradient: { ...style.gradient, angle: Number(e.target.value) } })} style={{ width: "100%" }} />
              </div>
            </>
          )}
        </div>

        {/* ── Logo Style ── */}
        <div className="section">
          <div className="section-title">Logo Style</div>
          <div className="shape-grid">
            {LOGO_BACKGROUNDS.map((b) => (
              <button key={b.id} className={`shape-btn ${style.logoStyle.background === b.id ? "active" : ""}`} onClick={() => onUpdate({ logoStyle: { ...style.logoStyle, background: b.id } })}>
                {b.label}
              </button>
            ))}
          </div>
          {style.logoStyle.background !== "none" && (
            <>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Padding: {style.logoStyle.padding}%</label>
                <div className="btn-row">
                  {PADDING_STEPS.map((p) => (
                    <button key={p} className={`btn ${style.logoStyle.padding === p ? "btn-primary" : ""}`} onClick={() => onUpdate({ logoStyle: { ...style.logoStyle, padding: p } })}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
                <input type="checkbox" checked={style.logoStyle.border} onChange={(e) => onUpdate({ logoStyle: { ...style.logoStyle, border: e.target.checked } })} style={{ width: 16, height: 16 }} />
                Border
              </label>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 8 }}>
                <input type="checkbox" checked={style.logoStyle.shadow} onChange={(e) => onUpdate({ logoStyle: { ...style.logoStyle, shadow: e.target.checked } })} style={{ width: 16, height: 16 }} />
                Shadow
              </label>
            </>
          )}
        </div>

        {/* ── Error Correction ── */}
        <div className="section">
          <div className="section-title">Error Correction</div>
          <div className="btn-row">
            {(["L", "M", "Q", "H"] as const).map((ecl) => (
              <button key={ecl} className={`btn ${style.ecl === ecl ? "btn-primary" : ""}`} onClick={() => onUpdate({ ecl })}>
                {ecl}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Default: "style" section
  return (
    <>
      {/* ── Color ── */}
      <div className="section">
        <div className="section-title">Color</div>
        <div className="color-grid">
          {QR_COLORS.map((c) => (
            <button
              key={c.id}
              className={`color-swatch ${style.colorId === c.id ? "active" : ""}`}
              style={{ background: c.bg, border: `2px solid ${c.fg}` }}
              title={c.label}
              onClick={() => onUpdate({ colorId: c.id, fgColor: c.fg, bgColor: c.bg })}
            />
          ))}
        </div>
      </div>

      {/* ── Eye Shape ── */}
      <div className="section">
        <div className="section-title">Eye Shape</div>
        <div className="shape-grid">
          {EYE_SHAPES.map((e) => (
            <button key={e.id} className={`shape-btn ${style.eyeShape === e.id ? "active" : ""}`} onClick={() => onUpdate({ eyeShape: e.id })}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pupil ── */}
      <div className="section">
        <div className="section-title">Pupil</div>
        <div className="shape-grid">
          {PUPIL_SHAPES.map((p) => (
            <button key={p.id} className={`shape-btn ${style.pupilShape === p.id ? "active" : ""}`} onClick={() => onUpdate({ pupilShape: p.id })}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pixel Shape ── */}
      <div className="section">
        <div className="section-title">Pixel Shape</div>
        <div className="shape-grid">
          {PIXEL_SHAPES.map((p) => (
            <button key={p.id} className={`shape-btn ${style.pixelShape === p.id ? "active" : ""}`} onClick={() => onUpdate({ pixelShape: p.id })}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom Colors ── */}
      <div className="section">
        <div className="section-title">Custom Colors</div>
        <div className="input-group">
          <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Foreground</label>
          <input type="color" className="input" value={style.fgColor} onChange={(e) => onUpdate({ fgColor: e.target.value })} style={{ height: 36, padding: 4, cursor: "pointer" }} />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Background</label>
          <input type="color" className="input" value={style.bgColor} onChange={(e) => onUpdate({ bgColor: e.target.value })} style={{ height: 36, padding: 4, cursor: "pointer" }} />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)" }}>Eye Color</label>
          <input type="color" className="input" value={style.eyeColor} onChange={(e) => onUpdate({ eyeColor: e.target.value })} style={{ height: 36, padding: 4, cursor: "pointer" }} />
        </div>
      </div>

      {/* ── Logo ── */}
      <div className="section">
        <div className="section-title">Logo</div>
        {style.logoUri ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={style.logoUri} alt="Logo" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
            <button className="btn btn-danger" onClick={() => onUpdate({ logoUri: undefined })}>Remove</button>
          </div>
        ) : (
          <label className="btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            Choose Image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onUpdate({ logoUri: reader.result as string });
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}
      </div>
    </>
  );
}
