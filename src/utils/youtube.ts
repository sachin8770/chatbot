/**
 * Extracts a YouTube video ID from various URL formats or raw ID strings.
 */
export function extractYoutubeId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Direct 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL patterns (standard, short URL, embed, shorts, live)
  const urlPattern = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(urlPattern);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback for query param ?v=
  if (trimmed.includes("v=")) {
    try {
      const parsedUrl = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const v = parsedUrl.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{6,20}$/.test(v)) {
        return v;
      }
    } catch {
      // Ignore URL parse errors
    }
  }

  // Fallback for custom or varying length video IDs (6-20 alphanumeric/dashes/underscores)
  if (/^[a-zA-Z0-9_-]{6,20}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
