import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const PRESET_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
  "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
  "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0",
  "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
  "#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47",
  "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130",
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value);
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("curium_recent_colors") || "[]");
    } catch { return []; }
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rgb = hexToRgb(value);

  useEffect(() => { setHex(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const select = (c: string) => {
    onChange(c);
    setHex(c);
    const next = [c, ...recentColors.filter((r) => r !== c)].slice(0, 10);
    setRecentColors(next);
    localStorage.setItem("curium_recent_colors", JSON.stringify(next));
  };

  const handleHexSubmit = () => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) select(hex);
  };

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const next = { ...rgb, [channel]: val };
    const newHex = rgbToHex(next.r, next.g, next.b);
    onChange(newHex);
    setHex(newHex);
  };

  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const DROPDOWN_WIDTH = 244;
    const DROPDOWN_HEIGHT = 380;
    const MARGIN = 6;

    let left = rect.left;
    if (left + DROPDOWN_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - DROPDOWN_WIDTH - 8;
    }
    if (left < 8) left = 8;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceAbove > DROPDOWN_HEIGHT + MARGIN && spaceAbove > spaceBelow;

    setDropdownPos({
      top: openUp ? rect.top - DROPDOWN_HEIGHT - MARGIN : rect.bottom + MARGIN,
      left,
    });
  }, [open]);

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      className="color-dropdown"
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
      }}
    >
      {recentColors.length > 0 && (
        <div className="color-section">
          <div className="color-section-label">Recent</div>
          <div className="color-row">
            {recentColors.map((c) => (
              <button key={c} className="color-dot" style={{ background: c }} onClick={() => select(c)} />
            ))}
          </div>
        </div>
      )}
      <div className="color-section">
        <div className="color-section-label">Palette</div>
        <div className="color-preset-grid">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`color-dot ${c === value ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => select(c)}
            />
          ))}
        </div>
      </div>
      <div className="color-section">
        <div className="color-section-label">RGB</div>
        <div className="rgb-inputs">
          {(["r", "g", "b"] as const).map((ch) => (
            <div key={ch} className="rgb-input-row">
              <span className="rgb-input-label">{ch.toUpperCase()}</span>
              <input
                type="number"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e) => handleRgbChange(ch, Number(e.target.value))}
                className="rgb-input"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="color-section">
        <div className="color-section-label">Hex</div>
        <div className="color-hex-row">
          <input
            className="color-hex-input"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleHexSubmit()}
            onBlur={handleHexSubmit}
            maxLength={7}
          />
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="color-input-wrap">
      {label && <span style={{ fontSize: 11, color: "var(--text-muted)", width: 70 }}>{label}</span>}
      <button
        ref={triggerRef}
        className="color-trigger"
        style={{ background: value }}
        onClick={() => setOpen(!open)}
      />
      <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{value}</span>
      {dropdown}
    </div>
  );
}
