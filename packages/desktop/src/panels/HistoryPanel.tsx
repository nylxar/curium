import type { HistoryEntry } from "../types";

export function HistoryPanel({
  history,
  onClear,
  onLoad,
  onApply,
}: {
  history: HistoryEntry[];
  onClear: () => void;
  onLoad: (entry: HistoryEntry) => void;
  onApply: (entry: HistoryEntry) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">History ({history.length})</div>
        {history.length > 0 ? (
          <button className="btn btn-danger" onClick={onClear}>
            Clear All
          </button>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            No history yet
          </p>
        )}
      </div>
      {history.length > 0 && (
        <div className="list">
          {history.map((h) => (
            <div key={h.id} className="list-item" onClick={() => onLoad(h)}>
              <div className="list-item-info">
                <div className="list-item-value" style={{ fontSize: 11 }}>
                  {h.data.length > 40 ? h.data.slice(0, 40) + "..." : h.data}
                </div>
                <div className="list-item-date">
                  {new Date(h.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                className="btn btn-sm"
                title="Load into editor"
                onClick={(e) => { e.stopPropagation(); onApply(h); }}
              >
                Load
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
