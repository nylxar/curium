import { useRef, useState, useCallback, useEffect } from "react";
import { LogoStyleConfig } from "@curium/shared";

interface LogoOverlayProps {
  uri: string;
  containerSize: number;
  logoSize?: number;
  style?: LogoStyleConfig;
  bgColor?: string;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export function LogoOverlay({
  uri,
  containerSize,
  logoSize = 60,
  style,
  bgColor = "#ffffff",
  initialPosition,
  onPositionChange,
}: LogoOverlayProps) {
  const cfg = style ?? {
    background: "rounded" as const,
    padding: 10,
    border: true,
    shadow: true,
  };

  const pad = (cfg.padding / 100) * logoSize;
  const plateSize = logoSize + pad * 2;

  const cx = (containerSize - plateSize) / 2;
  const cy = (containerSize - plateSize) / 2;

  const [pos, setPos] = useState(initialPosition ?? { x: cx, y: cy });
  const posRef = useRef(initialPosition ?? { x: cx, y: cy });
  const dragging = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const originPos = useRef({ x: 0, y: 0 });

  const MAX_X = containerSize - plateSize;
  const MAX_Y = containerSize - plateSize;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    origin.current = { x: e.clientX, y: e.clientY };
    originPos.current = { ...posRef.current };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - origin.current.x;
      const dy = e.clientY - origin.current.y;
      const nx = Math.max(0, Math.min(MAX_X, originPos.current.x + dx));
      const ny = Math.max(0, Math.min(MAX_Y, originPos.current.y + dy));
      posRef.current = { x: nx, y: ny };
      setPos({ x: nx, y: ny });
    };

    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        onPositionChange?.(posRef.current);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [MAX_X, MAX_Y, onPositionChange]);

  const plateRadius = (() => {
    switch (cfg.background) {
      case "circle": return plateSize * 0.5;
      case "rounded": return Math.min(plateSize * 0.22, 16);
      default: return 0;
    }
  })();

  const imageRadius = (() => {
    switch (cfg.background) {
      case "circle": return logoSize * 0.5;
      case "rounded": return Math.min(logoSize * 0.18, 12);
      default: return 0;
    }
  })();

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: containerSize,
        height: containerSize,
        zIndex: 10,
        pointerEvents: "auto",
      }}
    >
      {/* Logo plate */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: plateSize,
          height: plateSize,
          borderRadius: plateRadius,
          backgroundColor: cfg.background !== "none" ? bgColor : "transparent",
          border: cfg.border ? "1.5px solid rgba(0,0,0,0.1)" : "none",
          boxShadow: cfg.shadow ? "0 3px 8px rgba(0,0,0,0.18)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
        }}
      >
        <img
          src={uri}
          alt="Logo"
          draggable={false}
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: imageRadius,
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
