import {
  QRStyle,
  QR_COLORS,
  EYE_SHAPES,
  PUPIL_SHAPES,
  PIXEL_SHAPES,
  FrameStyle,
  LogoBackground,
} from "@curium/shared";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { ColorPicker } from "../components/ColorPicker";
import { ModernSwitch } from "../components/ModernSwitch";

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
        <CollapsibleSection title="Frame">
          <div className="shape-grid">
            {FRAME_OPTIONS.map((f) => (
              <button key={f} className={`shape-btn ${style.frame === f ? "active" : ""}`} onClick={() => onUpdate({ frame: f })}>
                {FRAME_LABELS[f]}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="QR Corners">
          <div className="shape-grid">
            {CORNER_OPTIONS.map((c) => (
              <button key={c.value} className={`shape-btn ${style.qrCorners === c.value ? "active" : ""}`} onClick={() => onUpdate({ qrCorners: c.value })}>
                {c.label}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Gradient" defaultOpen={style.gradient.enabled}>
          <ModernSwitch
            checked={style.gradient.enabled}
            onChange={(checked) => onUpdate({ gradient: { ...style.gradient, enabled: checked } })}
            label="Enable gradient"
          />
          {style.gradient.enabled && (
            <div style={{ marginTop: 8 }}>
              <div className="btn-row">
                {ANGLE_PRESETS.map((a) => (
                  <button key={a.value} className={`btn ${style.gradient.angle === a.value ? "btn-primary" : ""}`} onClick={() => onUpdate({ gradient: { ...style.gradient, angle: a.value } })}>
                    {a.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <ColorPicker
                  label="Start"
                  value={style.gradient.startColor}
                  onChange={(c) => onUpdate({ gradient: { ...style.gradient, startColor: c } })}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <ColorPicker
                  label="End"
                  value={style.gradient.endColor}
                  onChange={(c) => onUpdate({ gradient: { ...style.gradient, endColor: c } })}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Angle: {style.gradient.angle}°</span>
                <input type="range" min={0} max={345} step={15} value={style.gradient.angle} onChange={(e) => onUpdate({ gradient: { ...style.gradient, angle: Number(e.target.value) } })} style={{ width: "100%", marginTop: 4 }} />
              </div>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Logo Style" defaultOpen={style.logoStyle.background !== "none"}>
          <div className="shape-grid">
            {LOGO_BACKGROUNDS.map((b) => (
              <button key={b.id} className={`shape-btn ${style.logoStyle.background === b.id ? "active" : ""}`} onClick={() => onUpdate({ logoStyle: { ...style.logoStyle, background: b.id } })}>
                {b.label}
              </button>
            ))}
          </div>
          {style.logoStyle.background !== "none" && (
            <div style={{ marginTop: 8 }}>
              <div className="btn-row">
                {PADDING_STEPS.map((p) => (
                  <button key={p} className={`btn ${style.logoStyle.padding === p ? "btn-primary" : ""}`} onClick={() => onUpdate({ logoStyle: { ...style.logoStyle, padding: p } })}>
                    {p}%
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 16 }}>
                <ModernSwitch
                  checked={style.logoStyle.border}
                  onChange={(checked) => onUpdate({ logoStyle: { ...style.logoStyle, border: checked } })}
                  label="Border"
                />
                <ModernSwitch
                  checked={style.logoStyle.shadow}
                  onChange={(checked) => onUpdate({ logoStyle: { ...style.logoStyle, shadow: checked } })}
                  label="Shadow"
                />
              </div>
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Error Correction" defaultOpen={false}>
          <div className="btn-row">
            {(["L", "M", "Q", "H"] as const).map((ecl) => (
              <button key={ecl} className={`btn ${style.ecl === ecl ? "btn-primary" : ""}`} onClick={() => onUpdate({ ecl })}>
                {ecl}
              </button>
            ))}
          </div>
        </CollapsibleSection>
      </>
    );
  }

  // Default: "style" section
  return (
    <>
      <CollapsibleSection title="Color">
        <div className="color-grid">
          {QR_COLORS.map((c) => (
            <button
              key={c.id}
              className={`color-swatch ${style.colorId === c.id ? "active" : ""}`}
              style={{ background: c.bg }}
              title={c.label}
              onClick={() => onUpdate({ colorId: c.id, fgColor: c.fg, bgColor: c.bg })}
            >
              <span style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: "40%",
                height: "40%",
                borderRadius: "2px 0 3px 0",
                background: c.fg,
              }} />
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Eye Shape">
        <div className="shape-grid">
          {EYE_SHAPES.map((e) => (
            <button key={e.id} className={`shape-btn ${style.eyeShape === e.id ? "active" : ""}`} onClick={() => onUpdate({ eyeShape: e.id })}>
              {e.label}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Pupil">
        <div className="shape-grid">
          {PUPIL_SHAPES.map((p) => (
            <button key={p.id} className={`shape-btn ${style.pupilShape === p.id ? "active" : ""}`} onClick={() => onUpdate({ pupilShape: p.id })}>
              {p.label}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Pixel Shape">
        <div className="shape-grid">
          {PIXEL_SHAPES.map((p) => (
            <button key={p.id} className={`shape-btn ${style.pixelShape === p.id ? "active" : ""}`} onClick={() => onUpdate({ pixelShape: p.id })}>
              {p.label}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Custom Colors">
        <ColorPicker label="Foreground" value={style.fgColor} onChange={(c) => onUpdate({ fgColor: c })} />
        <div style={{ marginTop: 8 }}>
          <ColorPicker label="Background" value={style.bgColor} onChange={(c) => onUpdate({ bgColor: c })} />
        </div>
        <div style={{ marginTop: 8 }}>
          <ColorPicker label="Eye Color" value={style.eyeColor} onChange={(c) => onUpdate({ eyeColor: c })} />
        </div>
        <div style={{ marginTop: 8 }}>
          <ColorPicker label="Pupil Color" value={style.pupilColor} onChange={(c) => onUpdate({ pupilColor: c })} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Logo" defaultOpen={!!style.logoUri}>
        {style.logoUri ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={style.logoUri} alt="Logo" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)" }} />
            <button className="btn btn-danger" onClick={() => onUpdate({ logoUri: undefined })}>Remove</button>
          </div>
        ) : (
          <label className="btn" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
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
      </CollapsibleSection>
    </>
  );
}
