const ICON_MAP: Record<string, string> = {
  "what's new": "sparkles-outline",
  "new": "sparkles-outline",
  "features": "sparkles-outline",
  "fixes": "medkit-outline",
  "fix": "medkit-outline",
  "bug fixes": "medkit-outline",
  "improvements": "trending-up-outline",
  "improvement": "trending-up-outline",
  "changes": "swap-horizontal-outline",
  "change": "swap-horizontal-outline",
  "notes": "information-circle-outline",
  "note": "information-circle-outline",
  "breaking": "alert-circle-outline",
  "security": "shield-checkmark-outline",
  "performance": "speedometer-outline",
  "removed": "remove-circle-outline",
  "deprecated": "warning-outline",
  "added": "add-circle-outline",
  "list": "list-outline",
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

    // # Release Notes — v0.5.0 (Stable)
    const h1 = line.match(/^#\s+Release Notes\s*[—–-]\s*v([\d.]+)\s*(?:\((\w+)\))?/i);
    if (h1) {
      version = h1[1];
      channel = h1[2] ?? "";
      continue;
    }

    // ## Section Title
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (current) sections.push(current);
      const title = h2[1].trim();
      const key = title.toLowerCase();
      const icon = ICON_MAP[key] ?? "list-outline";
      current = { title, icon, items: [] };
      continue;
    }

    // - item text
    const bullet = line.match(/^-\s+(.+)/);
    if (bullet && current) {
      current.items.push(bullet[1].trim());
    }
  }

  if (current) sections.push(current);

  return { version, channel, sections };
}
