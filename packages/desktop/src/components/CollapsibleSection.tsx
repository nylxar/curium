import { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = true, count, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>(defaultOpen ? "none" : "0px");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (open) {
      setClosing(false);
      setMaxHeight(bodyRef.current.scrollHeight + "px");
      const timer = setTimeout(() => setMaxHeight("none"), 200);
      return () => clearTimeout(timer);
    } else {
      setClosing(true);
      setMaxHeight(bodyRef.current.scrollHeight + "px");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMaxHeight("0px"));
      });
      const timer = setTimeout(() => setClosing(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div className="section">
      <div className="section-header" onClick={() => setOpen(!open)}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          {title}{count !== undefined ? ` (${count})` : ""}
        </div>
        <ChevronRight size={14} className={`section-chevron ${open ? "open" : ""}`} />
      </div>
      <div
        ref={bodyRef}
        className="section-body"
        style={{
          maxHeight,
          opacity: maxHeight === "0px" ? 0 : 1,
          pointerEvents: maxHeight === "0px" ? "none" : "auto",
          overflow: closing ? "hidden" : "visible",
        }}
      >
        <div style={{ paddingTop: 8 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
