import type { Template } from "../types";

export function TemplatesPanel({
  templates,
  templateName,
  setTemplateName,
  onSave,
  onDelete,
  onApply,
}: {
  templates: Template[];
  templateName: string;
  setTemplateName: (s: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onApply: (t: Template) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">Save Current Style</div>
        <div className="btn-row">
          <input
            className="input"
            placeholder="Template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
      {templates.length > 0 && (
        <div className="section">
          <div className="section-title">Saved ({templates.length})</div>
          <div className="list">
            {templates.map((t) => (
              <div
                key={t.id}
                className="list-item"
                onClick={() => onApply(t)}
                style={{ cursor: "pointer" }}
              >
                <div className="list-item-info">
                  <div className="list-item-value">{t.name}</div>
                </div>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t.id);
                  }}
                  style={{ fontSize: 10, padding: "4px 8px" }}
                >
                  Del
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
