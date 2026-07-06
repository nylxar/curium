import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  generateSVG,
  QRStyle,
  QRType,
  DEFAULT_QR_STYLE,
  QR_COLORS,
} from "@curium/shared";
import { zipSync, strToU8 } from "fflate";
import { Shuffle } from "lucide-react";
import { QRPreview } from "./components/QRPreview";
import { LogoOverlay } from "./components/LogoOverlay";
import { StylePanel } from "./panels/StylePanel";
import { ExportBar } from "./components/ExportBar";
import { TitleBar, useIsTauri } from "./components/TitleBar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Splash } from "./components/Splash";
import { Welcome } from "./components/Welcome";
import { WhatsNew } from "./components/WhatsNew";
import { BatchPanel } from "./panels/BatchPanel";
import { animateThemeTransition, bounceButton } from "./utils/animations";
import { gsap } from "gsap";

import type { FormState, Template, HistoryEntry, TabId } from "./types";
import { DEFAULT_FORMS, TOP_TABS, BOTTOM_TABS } from "./types";
import { encodeQR, decodeQR } from "./utils/qr";
import { loadHistory, saveHistoryToStorage, loadTemplates, saveTemplatesToStorage } from "./utils/storage";
import { SHUFFLE_EYES, SHUFFLE_PUPILS, SHUFFLE_PIXELS } from "./constants";

import { GeneratePanel } from "./panels/GeneratePanel";
import { TemplatesPanel } from "./panels/TemplatesPanel";
import { HistoryPanel } from "./panels/HistoryPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { AboutPanel } from "./panels/AboutPanel";
import { InfoPanel } from "./panels/InfoPanel";
import { SupportPanel } from "./panels/SupportPanel";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light" | "amoled" | "system">(
    () => {
      try {
        const stored = localStorage.getItem("curium_theme");
        if (
          stored === "dark" ||
          stored === "light" ||
          stored === "amoled" ||
          stored === "system"
        )
          return stored;
      } catch {}
      return "dark";
    },
  );
  const [resolvedTheme, setResolvedTheme] = useState<
    "dark" | "light" | "amoled"
  >("dark");
  const isTauri = useIsTauri();
  const shuffleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const resolve = () => setResolvedTheme(mq.matches ? "light" : "dark");
    resolve();
    mq.addEventListener("change", resolve);
    return () => mq.removeEventListener("change", resolve);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.body.setAttribute("data-theme", resolvedTheme);
    document.body.style.background = "";
    localStorage.setItem("curium_theme", theme);
    animateThemeTransition();
  }, [resolvedTheme, theme]);

  const [onboarding, setOnboarding] = useState<"welcome" | "whatsnew" | "done">(
    () => {
      try {
        if (!localStorage.getItem("curium_onboarded")) return "welcome";
        if (localStorage.getItem("curium_last_seen_version") !== "0.5.7")
          return "whatsnew";
      } catch {}
      return "done";
    },
  );

  const [activeTab, setActiveTab] = useState<TabId>("generate");
  const sidePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidePanelRef.current) return;
    gsap.fromTo(
      sidePanelRef.current,
      { opacity: 0.5, y: 4 },
      { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" },
    );
  }, [activeTab]);

  const [activeType, setActiveType] = useState<QRType>("text");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [templateName, setTemplateName] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const skipHistorySave = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [batchInput, setBatchInput] = useState("");
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchStyles, setBatchStyles] = useState<QRStyle[]>([]);

  interface BatchEntry {
    id: string;
    name: string;
    data: string;
  }

  const batchEntries = useMemo<BatchEntry[]>(() => {
    const lines = batchInput.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((data, i) => ({
      id: `${i}-${data}`,
      name: `qr-${i + 1}`,
      data,
    }));
  }, [batchInput]);

  const batchSvgs = useMemo(() => {
    return batchEntries.map((e, i) => ({
      ...e,
      svg: e.data
        ? generateSVG(e.data, batchStyles[i] ?? qrStyle, 256, false)
        : null,
    }));
  }, [batchEntries, qrStyle, batchStyles]);

  const doBatchExport = useCallback(
    async (format: "svg" | "png") => {
      if (batchSvgs.length === 0) return;
      setBatchExporting(true);
      try {
        const files: Record<string, Uint8Array> = {};
        const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
        const dir = `curium-batch-${ts}`;

        for (const e of batchSvgs) {
          if (!e.svg) continue;
          const name = e.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);

          if (format === "svg") {
            files[`${dir}/${name}.svg`] = strToU8(e.svg);
          } else {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            const img = new Image();
            const blob = new Blob([e.svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            await new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 512, 512);
                URL.revokeObjectURL(url);
                canvas.toBlob((pngBlob) => {
                  if (pngBlob)
                    pngBlob.arrayBuffer().then((buf) => {
                      files[`${dir}/${name}.png`] = new Uint8Array(buf);
                    });
                  resolve();
                }, "image/png");
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve();
              };
              img.src = url;
            });
          }
        }

        const zipped = zipSync(files, { level: 0 });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(
          new Blob([zipped], { type: "application/zip" }),
        );
        a.download = `curium-batch-${ts}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      } finally {
        setBatchExporting(false);
      }
    },
    [batchSvgs],
  );

  const handleBatchCSVImport = useCallback((imported: BatchEntry[]) => {
    const lines = imported.map((e) => e.data);
    setBatchInput(lines.join("\n"));
  }, []);

  const handleBatchStyleShuffle = useCallback(() => {
    const count = batchEntries.length;
    if (count === 0) return;
    const styles: QRStyle[] = Array.from({ length: count }, () => {
      const r = QR_COLORS[Math.floor(Math.random() * QR_COLORS.length)];
      const eye = SHUFFLE_EYES[Math.floor(Math.random() * SHUFFLE_EYES.length)];
      const pupil =
        SHUFFLE_PUPILS[Math.floor(Math.random() * SHUFFLE_PUPILS.length)];
      const pixel =
        SHUFFLE_PIXELS[Math.floor(Math.random() * SHUFFLE_PIXELS.length)];
      return {
        ...qrStyle,
        colorId: r.id,
        fgColor: r.fg,
        bgColor: r.bg,
        eyeColor: r.fg,
        pupilColor: r.fg,
        eyeShape: eye,
        pupilShape: pupil,
        pixelShape: pixel,
      };
    });
    setBatchStyles(styles);
  }, [batchEntries.length, qrStyle]);

  const qrValue = useMemo(
    () => encodeQR(activeType, forms),
    [activeType, forms],
  );

  const svg = useMemo(
    () =>
      qrValue ? generateSVG(qrValue, qrStyle, 512, !!qrStyle.logoUri) : null,
    [qrValue, qrStyle],
  );

  const exportSvg = useMemo(
    () => (qrValue ? generateSVG(qrValue, qrStyle, 512, false) : null),
    [qrValue, qrStyle],
  );

  const doExportSVG = useCallback(() => {
    if (!exportSvg) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curium-qr-${ts}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSvg]);

  const doExportPNG = useCallback(() => {
    if (!exportSvg) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `curium-qr-${ts}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = url;
  }, [exportSvg]);

  const lastSavedData = useRef<string>("");
  const lastSavedStyleKey = useRef<string>("");
  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQrValue = useRef(qrValue);
  const latestQrStyle = useRef(qrStyle);
  const latestSvg = useRef(svg);
  latestQrValue.current = qrValue;
  latestQrStyle.current = qrStyle;
  latestSvg.current = svg;

  useEffect(() => {
    if (skipHistorySave.current || !svg || !qrValue) return;
    const styleKey = JSON.stringify(qrStyle);
    const dataChanged = lastSavedData.current !== qrValue;
    const styleChanged = lastSavedStyleKey.current !== styleKey;

    if (!dataChanged && !styleChanged) return;

    if (historyTimer.current) clearTimeout(historyTimer.current);

    historyTimer.current = setTimeout(() => {
      if (skipHistorySave.current) return;
      const curValue = latestQrValue.current;
      const curStyle = latestQrStyle.current;
      const curSvg = latestSvg.current;
      const curStyleKey = JSON.stringify(curStyle);

      if (
        lastSavedData.current === curValue &&
        lastSavedStyleKey.current === curStyleKey
      )
        return;
      lastSavedData.current = curValue;
      lastSavedStyleKey.current = curStyleKey;

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        data: curValue,
        style: { ...curStyle },
        svg: curSvg ?? "",
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const prevKey =
          prev.length > 0
            ? prev[0].data + "|" + JSON.stringify(prev[0].style)
            : "";
        const key = curValue + "|" + curStyleKey;
        if (prevKey === key) return prev;
        return [entry, ...prev].slice(0, 100);
      });
    }, 5000);

    return () => {
      if (historyTimer.current) clearTimeout(historyTimer.current);
    };
  }, [svg, qrValue, qrStyle]);

  useEffect(() => {
    try {
      saveHistoryToStorage(history);
    } catch {}
  }, [history]);

  const updateStyle = useCallback(
    (partial: Partial<QRStyle>) => setQrStyle((s) => ({ ...s, ...partial })),
    [],
  );

  const updateForm = useCallback(
    <K extends keyof FormState>(type: K, partial: Partial<FormState[K]>) =>
      setForms((f) => ({ ...f, [type]: { ...f[type], ...partial } })),
    [],
  );

  const handleShuffle = useCallback(() => {
    if (shuffleBtnRef.current) bounceButton(shuffleBtnRef.current);
    const r = QR_COLORS[Math.floor(Math.random() * QR_COLORS.length)];
    const eye = SHUFFLE_EYES[Math.floor(Math.random() * SHUFFLE_EYES.length)];
    const pupil =
      SHUFFLE_PUPILS[Math.floor(Math.random() * SHUFFLE_PUPILS.length)];
    const pixel =
      SHUFFLE_PIXELS[Math.floor(Math.random() * SHUFFLE_PIXELS.length)];
    setQrStyle((p) => ({
      ...p,
      colorId: r.id,
      fgColor: r.fg,
      bgColor: r.bg,
      eyeColor: r.fg,
      pupilColor: r.fg,
      eyeShape: eye,
      pupilShape: pupil,
      pixelShape: pixel,
    }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleShuffle();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) doExportPNG();
        else doExportSVG();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleShuffle, doExportSVG, doExportPNG]);

  const saveTemplate = useCallback(() => {
    if (!templateName.trim()) return;
    const t: Template = {
      id: Date.now().toString(),
      name: templateName.trim(),
      style: { ...qrStyle },
    };
    const updated = [t, ...templates].slice(0, 50);
    setTemplates(updated);
    saveTemplatesToStorage(updated);
    setTemplateName("");
  }, [templateName, qrStyle, templates]);

  const deleteTemplate = useCallback(
    (id: string) => {
      const updated = templates.filter((t) => t.id !== id);
      setTemplates(updated);
      saveTemplatesToStorage(updated);
    },
    [templates],
  );

  const applyTemplate = useCallback((t: Template) => {
    setQrStyle({ ...t.style });
  }, []);

  const clearHistory = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const confirmClearHistory = useCallback(() => {
    setConfirmOpen(false);
    setHistory([]);
    saveHistoryToStorage([]);
  }, []);

  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);

  const switchTab = useCallback((tab: TabId) => {
    setSelectedHistoryEntry(null);
    setActiveTab(tab);
  }, []);

  const loadHistoryEntry = useCallback((entry: HistoryEntry) => {
    setSelectedHistoryEntry(entry);
  }, []);

  const applyHistoryEntry = useCallback((entry: HistoryEntry) => {
    skipHistorySave.current = true;
    lastSavedData.current = entry.data;
    lastSavedStyleKey.current = JSON.stringify(entry.style);
    const decoded = decodeQR(entry.data);
    if (decoded) {
      setActiveType(decoded.type);
      setForms((f) => ({ ...f, [decoded.type]: decoded.form }));
    }
    setQrStyle({ ...entry.style });
    setSelectedHistoryEntry(null);
    setActiveTab("generate");
    setTimeout(() => {
      skipHistorySave.current = false;
    }, 500);
  }, []);

  const handleLogoPositionChange = useCallback(
    (pos: { x: number; y: number }) => {
      setQrStyle((s) => ({ ...s, logoPosition: pos }));
    },
    [],
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "generate":
        return (
          <GeneratePanel
            activeType={activeType}
            setActiveType={setActiveType}
            forms={forms}
            updateForm={updateForm}
          />
        );
      case "style":
        return <StylePanel style={qrStyle} onUpdate={updateStyle} />;
      case "adjust":
        return (
          <StylePanel style={qrStyle} onUpdate={updateStyle} section="adjust" />
        );
      case "batch":
        return (
          <BatchPanel
            input={batchInput}
            onInputChange={setBatchInput}
            entries={batchEntries}
            exporting={batchExporting}
            onExportSVG={() => doBatchExport("svg")}
            onExportPNG={() => doBatchExport("png")}
            onImportCSV={handleBatchCSVImport}
            onShuffleStyles={handleBatchStyleShuffle}
          />
        );
      case "templates":
        return (
          <TemplatesPanel
            templates={templates}
            templateName={templateName}
            setTemplateName={setTemplateName}
            onSave={saveTemplate}
            onDelete={deleteTemplate}
            onApply={applyTemplate}
          />
        );
      case "history":
        return (
          <HistoryPanel
            history={history}
            onClear={clearHistory}
            onLoad={loadHistoryEntry}
            onApply={applyHistoryEntry}
          />
        );
      case "settings":
        return <SettingsPanel theme={theme} setTheme={setTheme} />;
      case "about":
        return <AboutPanel />;
      case "info":
        return <InfoPanel />;
      case "support":
        return <SupportPanel />;
      default:
        return null;
    }
  };

  return (
    <div
      className="app"
      data-theme={resolvedTheme}
      {...(isTauri ? { "data-tauri": "" } : {})}
    >
      <Splash />
      {(onboarding === "whatsnew" || onboarding === "welcome") && (
        <WhatsNew
          onDone={() => {
            localStorage.setItem("curium_last_seen_version", "0.5.7");
            setOnboarding("done");
          }}
        />
      )}
      {onboarding === "welcome" && (
        <Welcome
          onDone={() => {
            localStorage.setItem("curium_onboarded", "true");
            setOnboarding("whatsnew");
          }}
        />
      )}
      {isTauri && <TitleBar />}
      <div className="tab-bar">
        <div className="tab-bar-top">
          {TOP_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => switchTab(tab.id)}
                title={tab.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
        <div className="tab-bar-bottom">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => switchTab(tab.id)}
                title={tab.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="side-panel" ref={sidePanelRef}>
        <div className="app-brand">
          <span className="app-brand-name">Curium</span>
        </div>
        {renderTabContent()}
      </div>

      <div className="main">
        {activeTab === "batch" ? (
          batchSvgs.length > 0 ? (
            <div className="batch-grid">
              {batchSvgs.map((e) =>
                e.svg ? (
                  <div key={e.id} className="batch-item" title={e.data}>
                    <div
                      className="batch-qr"
                      dangerouslySetInnerHTML={{ __html: e.svg }}
                    />
                    <div className="batch-label">{e.name}</div>
                  </div>
                ) : null,
              )}
            </div>
          ) : (
            <div className="batch-empty">
              Enter data in the side panel to generate batch QR codes
            </div>
          )
        ) : selectedHistoryEntry ? (
          <>
            <div className="qr-card qr-animate">
              <div className="qr-container">
                <QRPreview svg={selectedHistoryEntry.svg ?? ""} />
              </div>
            </div>
            <div className="history-detail-meta">
              <div className="history-detail-label">Data</div>
              <div className="history-detail-value">{selectedHistoryEntry.data}</div>
              <div className="history-detail-label" style={{ marginTop: 12 }}>Created</div>
              <div className="history-detail-value">
                {new Date(selectedHistoryEntry.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="action-row">
              <button
                className="btn btn-primary"
                onClick={() => applyHistoryEntry(selectedHistoryEntry)}
              >
                Load into Editor
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`qr-card ${svg ? "qr-animate" : ""}`}>
              <div className="qr-container">
                <QRPreview svg={svg} />
                {qrStyle.logoUri && svg && (
                  <LogoOverlay
                    uri={qrStyle.logoUri}
                    style={qrStyle.logoStyle}
                    bgColor={qrStyle.bgColor}
                    initialPosition={qrStyle.logoPosition}
                    onPositionChange={handleLogoPositionChange}
                  />
                )}
              </div>
            </div>
            {svg && (
              <div className="action-row">
                <button
                  className="btn btn-icon"
                  ref={shuffleBtnRef}
                  onClick={handleShuffle}
                  title="Shuffle"
                >
                  <Shuffle size={16} />
                </button>
                <ExportBar
                  svg={exportSvg ?? svg}
                  input={qrValue}
                  onExportSVG={doExportSVG}
                  onExportPNG={doExportPNG}
                />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear History"
        message="This will remove all history entries. This cannot be undone."
        confirmLabel="Clear All"
        onConfirm={confirmClearHistory}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
