import { useEffect, useRef, useState } from "react";
import * as Linking from "expo-linking";

export interface SharedContent {
  type: "text" | "url" | "image";
  value: string;
}

/**
 * Detects when the app was opened via a share intent (Android) or
 * deep link carrying shared content.  Returns the shared content
 * once, then clears itself so the overlay doesn't re-appear.
 */
export function useShareIntent(): SharedContent | null {
  const [shared, setShared] = useState<SharedContent | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    Linking.getInitialURL().then((url) => {
      if (!url || handled.current) return;
      const content = parseSharedUrl(url);
      if (content) {
        handled.current = true;
        setShared(content);
      }
    });

    const sub = Linking.addEventListener("url", ({ url }) => {
      if (handled.current) return;
      const content = parseSharedUrl(url);
      if (content) {
        handled.current = true;
        setShared(content);
      }
    });

    return () => sub.remove();
  }, []);

  return shared;
}

function parseSharedUrl(url: string): SharedContent | null {
  // Android intent URIs: intent://...#Intent;...;end
  // Expo Router deep links: curium://share?text=...&url=...
  // Plain URLs shared via intent: https://example.com

  try {
    // Try as a standard URL first
    const parsed = new URL(url);

    // curium://share?text=... or curium://share?url=...
    if (parsed.protocol === "curium:" && parsed.pathname === "/share") {
      const text = parsed.searchParams.get("text");
      const sharedUrl = parsed.searchParams.get("url");
      if (text) return { type: "text", value: decodeURIComponent(text) };
      if (sharedUrl) return { type: "url", value: decodeURIComponent(sharedUrl) };
    }

    // Android intent URI — extract text or extras
    if (url.startsWith("intent://")) {
      // intent://send/#Intent;type=text/plain;S.android.intent.extra.TEXT=...;end
      const textMatch = url.match(/S\.android\.intent\.extra\.TEXT=([^;]+)/);
      if (textMatch) {
        return { type: "text", value: decodeURIComponent(textMatch[1]) };
      }
      // intent://send/#Intent;scheme=...;end — extract the inner scheme URL
      const schemeMatch = url.match(/scheme=([^;]+)/);
      if (schemeMatch) {
        const inner = schemeMatch[1];
        if (/^https?:\/\//.test(inner)) return { type: "url", value: inner };
      }
    }

    // Plain https/http URL — treat as shared link
    if (/^https?:\/\//.test(url)) {
      return { type: "url", value: url };
    }
  } catch {
    // Not a valid URL — treat as plain text
    if (url.length > 0 && url.length < 4096) {
      return { type: "text", value: url };
    }
  }

  return null;
}
