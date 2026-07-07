import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

const URL_PRESETS: { label: string; prefix: string }[] = [
  { label: "YouTube", prefix: "https://youtube.com/" },
  { label: "Instagram", prefix: "https://instagram.com/" },
  { label: "TikTok", prefix: "https://tiktok.com/@" },
  { label: "Facebook", prefix: "https://facebook.com/" },
  { label: "X", prefix: "https://x.com/" },
  { label: "LinkedIn", prefix: "https://linkedin.com/in/" },
  { label: "Spotify", prefix: "https://open.spotify.com/" },
  { label: "Telegram", prefix: "https://t.me/" },
  { label: "WhatsApp", prefix: "https://wa.me/" },
  { label: "GitHub", prefix: "https://github.com/" },
  { label: "Twitch", prefix: "https://twitch.tv/" },
  { label: "Discord", prefix: "https://discord.gg/" },
  { label: "Pinterest", prefix: "https://pinterest.com/" },
  { label: "Reddit", prefix: "https://reddit.com/u/" },
  { label: "Snapchat", prefix: "https://snapchat.com/add/" },
  { label: "SoundCloud", prefix: "https://soundcloud.com/" },
];

interface URLPresetsProps {
  onSelect: (prefix: string) => void;
}

export function URLPresets({ onSelect }: URLPresetsProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
    });
  }, [open]);

  const handleSelect = (prefix: string) => {
    onSelect(prefix);
    setOpen(false);
  };

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      className="presets-dropdown"
      style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
    >
      {URL_PRESETS.map((p) => (
        <button
          key={p.label}
          className="presets-item"
          onClick={() => handleSelect(p.prefix)}
        >
          <span className="presets-item-label">{p.label}</span>
          <span className="presets-item-prefix">{p.prefix}</span>
        </button>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        className="presets-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span>Quick fill</span>
        <ChevronDown size={12} className={`presets-chevron ${open ? "open" : ""}`} />
      </button>
      {dropdown}
    </>
  );
}
