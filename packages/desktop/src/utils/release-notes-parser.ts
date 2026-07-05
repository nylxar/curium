const ICON_MAP: Record<string, string> = {
  "what's new": "sparkles",
  "new": "sparkles",
  "features": "sparkles",
  "fixes": "heart",
  "fix": "heart",
  "bug fixes": "heart",
  "improvements": "trending-up",
  "improvement": "trending-up",
  "changes": "swap-horizontal",
  "change": "swap-horizontal",
  "notes": "info",
  "note": "info",
  "breaking": "alert-circle",
  "security": "shield-checkmark",
  "performance": "zap",
  "removed": "minus-circle",
  "deprecated": "alert-triangle",
  "added": "plus-circle",
};

export interface ReleaseSection {
  title: string;
  icon: string;
  items: string[];
}

export interface ParsedRelease {
  version: string;
  channel: string;
  sections: ReleaseSection[];
}

export function parseReleaseNotes(markdown: string): ParsedRelease {
  const lines = markdown.split("\n");
  let version = "";
  let channel = "";
  const sections: ReleaseSection[] = [];
  let current: ReleaseSection | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h1 = line.match(/^#\s+Release Notes\s*[—–-]\s*v([\d.]+)\s*(?:\((\w+)\))?/i);
    if (h1) {
      version = h1[1];
      channel = h1[2] ?? "";
      continue;
    }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (current) sections.push(current);
      const title = h2[1].trim();
      const key = title.toLowerCase();
      const icon = ICON_MAP[key] ?? "list";
      current = { title, icon, items: [] };
      continue;
    }
    const bullet = line.match(/^-\s+(.+)/);
    if (bullet && current) {
      current.items.push(bullet[1].trim());
    }
  }
  if (current) sections.push(current);
  return { version, channel, sections };
}
