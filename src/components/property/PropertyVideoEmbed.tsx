// src/components/property/PropertyVideoEmbed.tsx

import { getYoutubeVideoId } from "@/lib/property/youtube";

/** YouTube ditanam sebagai player; link lain (mis. Google Drive) tampil sebagai tautan biasa. */
export function PropertyVideoEmbed({ url }: { url: string }) {
  const youtubeId = getYoutubeVideoId(url);

  if (youtubeId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Video properti"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block text-sm text-brand underline underline-offset-2"
    >
      Tonton Video
    </a>
  );
}
