interface QRPreviewProps {
  svg: string | null;
}

export function QRPreview({ svg }: QRPreviewProps) {
  if (!svg) {
    return (
      <div className="qr-preview">
        <div className="qr-placeholder">Enter data to generate QR</div>
      </div>
    );
  }

  return (
    <div
      className="qr-preview"
      style={{ pointerEvents: "none" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
