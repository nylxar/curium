interface QRPreviewProps {
  svg: string | null;
  size: number;
}

export function QRPreview({ svg, size }: QRPreviewProps) {
  if (!svg) {
    return (
      <div className="qr-preview" style={{ width: size, height: size }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: 20,
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-faint)",
            fontSize: 14,
          }}
        >
          Enter data to generate QR
        </div>
      </div>
    );
  }

  return (
    <div
      className="qr-preview"
      style={{ width: size, height: size, pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
