/**
 * MediaObject — the universal payload every Recipe must produce.
 *
 * Recipes normalize heterogeneous API responses into this shape so the
 * core engine (search, render, play, download) can treat everything
 * uniformly regardless of source.
 */
export type MediaType = "music" | "book" | "manga" | "video" | "image" | "other";

export interface MediaObject {
  /** Stable identifier inside the source recipe (e.g. API id, slug). */
  id: string;

  /** Which recipe produced this result. Injected by the SearchEngine. */
  source?: string;

  /** Primary human-readable title. */
  title: string;

  /** Author / artist / uploader / mangaka, when applicable. */
  artist?: string;

  /** Kind of media — drives rendering & default action. */
  type: MediaType;

  /** Optional cover/thumbnail URL (remote, https). */
  thumbnail?: string;

  /** Stream-ready URL for `mpv` (audio/video). */
  streamUrl?: string;

  /** Direct download URL. May be resolved lazily via Recipe.resolveDownload. */
  downloadUrl?: string;

  /** Short description / synopsis. */
  description?: string;

  /** Arbitrary source-specific fields (year, pages, chapters, duration...). */
  meta?: Record<string, unknown>;
}
