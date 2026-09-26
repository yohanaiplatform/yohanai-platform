// src/lib/property/youtube.ts

const YOUTUBE_PATTERN =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** Ambil video ID kalau URL cocok pola YouTube, selain itu null (link ditampilkan sebagai tautan biasa). */
export function getYoutubeVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_PATTERN);
  return match ? match[1] : null;
}
