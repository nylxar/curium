import { Download, FileImage, Copy } from "lucide-react";
import { QRStyle } from "@curium/shared";

interface ExportBarProps {
  svg: string;
  input: string;
  qrStyle: QRStyle;
}

export function ExportBar({ svg, input }: ExportBarProps) {
  const downloadSVG = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curium-qr.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "curium-qr.png";
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };

    img.src = url;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(input);
    } catch {}
  };

  return (
    <>
      <button className="btn btn-icon" onClick={downloadSVG} title="Export SVG">
        <Download size={16} />
      </button>
      <button className="btn btn-icon" onClick={downloadPNG} title="Export PNG">
        <FileImage size={16} />
      </button>
      <button className="btn btn-icon" onClick={copyToClipboard} title="Copy Data">
        <Copy size={16} />
      </button>
    </>
  );
}
