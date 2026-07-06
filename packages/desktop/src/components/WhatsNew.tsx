import { useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import {
  Sparkles,
  Heart,
  TrendingUp,
  Info,
  AlertCircle,
  ShieldCheck,
  Zap,
  PlusCircle,
  List,
  X as XIcon,
  ArrowLeftRight,
  TriangleAlert,
  MinusCircle,
} from "lucide-react";
import { parseReleaseNotes, type ReleaseSection } from "../utils/release-notes-parser";

const RELEASE_NOTES = `# Release Notes — v0.5.7 (Stable)

## What's New

- Templates — save and reuse QR style configurations with one tap
- SVG vector export — infinite quality scaling for print and design
- What's New screen — shows changelog automatically on app updates
- Welcome screen — first-launch intro with app philosophy
- Support screen — Ko-fi, PayPal, and Gumroad links
- Smooth theme transitions — cross-fade without flash or flicker
- Logo shadow now off by default for cleaner look
- New scanner module — replaced expo-camera/ZXing with VisionCamera + MLKit for better performance and detection
- QR eye and pupil shape overhaul — more styles, adaptive rendering, better scannability
- Nav bar now respects theme background color
- What's New screen Done button no longer unresponsive
- Gallery scan coming soon — the new scanner module hasn't published static image scanning yet, feature is in the main repo waiting for next release

## Fixes

- Theme transition flicker on both dev and production builds
- Template save button unresponsive inside ScrollView
- Toast z-index — now always renders above modals
- Last row border spacing in settings and info screens
- SVG export shared as document for WhatsApp/Signal/Telegram compatibility
- Nav bar text clipping removed
- Write permissions stripped from manifest
- Camera "not active" error on scan screen
- Gallery scan gracefully shows upcoming feature message
- QR entrance animation plays correctly on first load
- History reloads when returning to screen

## NOTE
- Upload from gallery feature is not available right now. Curium has moved to a new scanning module for improved performance and detection, but that module hasn't published gallery scanning yet. The feature is already in the main repo — we just need to wait for the next release.`;

const ICON_MAP: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  heart: Heart,
  "trending-up": TrendingUp,
  info: Info,
  "alert-circle": AlertCircle,
  "shield-check": ShieldCheck,
  "shield-checkmark": ShieldCheck,
  zap: Zap,
  "plus-circle": PlusCircle,
  "swap-horizontal": ArrowLeftRight,
  "alert-triangle": TriangleAlert,
  "minus-circle": MinusCircle,
  list: List,
};

function SectionIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] || List;
  return <Icon size={14} />;
}

interface WhatsNewProps {
  onDone: () => void;
}

export function WhatsNew({ onDone }: WhatsNewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const release = useMemo(() => parseReleaseNotes(RELEASE_NOTES), []);

  useEffect(() => {
    const items = rootRef.current?.querySelectorAll(".whatsnew-item");
    if (!items?.length) return;
    gsap.fromTo(
      Array.from(items),
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.25, stagger: 0.03, ease: "power2.out", delay: 0.2 },
    );
  }, []);

  const handleDone = () => {
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: onDone,
    });
  };

  return (
    <div ref={rootRef} className="whatsnew-screen">
      <div className="whatsnew-header">
        <span />
        <span className="whatsnew-title">What's New</span>
        <button className="whatsnew-done" onClick={handleDone}>
          <XIcon size={16} />
        </button>
      </div>
      <div className="whatsnew-body">
        <div className="whatsnew-version">
          <span className="whatsnew-version-badge">v{release.version}</span>
          {release.channel && (
            <span className="whatsnew-channel-badge">{release.channel}</span>
          )}
        </div>
        {release.sections.map((section, si) => (
          <div key={si} className="whatsnew-section">
            <div className="whatsnew-section-header">
              <div className="whatsnew-section-icon">
                <SectionIcon name={section.icon} />
              </div>
              <span className="whatsnew-section-title">{section.title}</span>
            </div>
            {section.items.map((item, ii) => (
              <div key={ii} className="whatsnew-item">
                <div className="whatsnew-dot" />
                <span className="whatsnew-item-text">{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
