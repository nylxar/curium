import { useRef, useCallback } from "react";
import { Shuffle } from "lucide-react";

interface BatchEntry {
  id: string;
  name: string;
  data: string;
}

interface BatchPanelProps {
  input: string;
  onInputChange: (s: string) => void;
  entries: BatchEntry[];
  exporting: boolean;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onImportCSV: (entries: BatchEntry[]) => void;
  onShuffle: () => void;
}

function parseCSV(text: string): BatchEntry[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes("name") || header.includes("data") || header.includes("url");
  const start = hasHeader ? 1 : 0;
  const entries: BatchEntry[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length >= 2) {
      entries.push({ id: `${i}`, name: cols[0], data: cols[1] });
    } else if (cols.length === 1 && cols[0]) {
      entries.push({ id: `${i}`, name: `qr-${i}`, data: cols[0] });
    }
  }
  return entries;
}

function toCSV(entries: BatchEntry[]): string {
  const header = "name,data";
  const rows = entries.map(
    (e) =>
      `"${e.name.replace(/"/g, '""')}","${e.data.replace(/"/g, '""')}"`,
  );
  return [header, ...rows].join("\n");
}

export function BatchPanel({
  input,
  onInputChange,
  entries,
  exporting,
  onExportSVG,
  onExportPNG,
  onImportCSV,
  onShuffle,
}: BatchPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const parsed = parseCSV(text);
        if (parsed.length > 0) onImportCSV(parsed);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [onImportCSV],
  );

  const handleCSVExport = useCallback(() => {
    const csv = toCSV(entries);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `curium-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [entries]);

  return (
    <>
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            Batch ({entries.length} {entries.length === 1 ? "entry" : "entries"})
          </div>
          {entries.length > 1 && (
            <button className="btn btn-icon" onClick={onShuffle} title="Shuffle order">
              <Shuffle size={14} />
            </button>
          )}
        </div>
        <textarea
          className="input"
          placeholder={
            "One per line...\nhttps://example.com\nHello World\nWIFI:T:WPA;S:MyNetwork;P:pass;;"
          }
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          rows={8}
          style={{ resize: "vertical", minHeight: 120, fontSize: 12 }}
        />
      </div>

      <div className="section">
        <div className="section-title">Import / Export</div>
        <div className="btn-row">
          <button
            className="btn"
            onClick={() => fileRef.current?.click()}
          >
            Import CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileImport}
          />
          <button
            className="btn"
            onClick={handleCSVExport}
            disabled={entries.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="section">
          <div className="section-title">Export QR Codes</div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={onExportSVG}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "Export SVGs"}
            </button>
            <button
              className="btn btn-primary"
              onClick={onExportPNG}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "Export PNGs"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
