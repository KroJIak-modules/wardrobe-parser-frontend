export function toExternalHttpUrl(raw: string | null | undefined): string | null {
  const candidate = String(raw || "").trim();
  if (!candidate || candidate.startsWith("manual://")) {
    return null;
  }
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
