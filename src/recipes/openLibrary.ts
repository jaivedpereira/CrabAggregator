import axios from "axios";
import type { Recipe, MediaObject } from "../types/index.js";

/**
 * Open Library Recipe
 * ------------------------------------------------------------
 * Public API, no key required.
 * Search:   https://openlibrary.org/search.json?q=<term>&limit=10
 * Covers:   https://covers.openlibrary.org/b/id/<cover_i>-L.jpg
 * Editions: https://openlibrary.org/works/<key>/editions.json  (for IA ids)
 * Download: https://archive.org/download/<ia>/<ia>.pdf         (when available)
 */

interface OLDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  ia?: string[];
  edition_count?: number;
  has_fulltext?: boolean;
  subject?: string[];
}

interface OLResponse {
  docs: OLDoc[];
  numFound: number;
}

function coverUrl(id?: number): string | undefined {
  return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : undefined;
}

function pickArchiveId(doc: OLDoc): string | undefined {
  return doc.ia && doc.ia.length > 0 ? doc.ia[0] : undefined;
}

const recipe: Recipe = {
  name: "open-library",
  label: "Open Library (books)",
  type: "book",
  display: "list",
  enabled: true,

  async search(query, _ctx): Promise<MediaObject[]> {
    const { data } = await axios.get<OLResponse>("https://openlibrary.org/search.json", {
      params: { q: query, limit: 10 },
      timeout: 10_000,
    });

    return (data.docs ?? []).map((doc) => {
      const ia = pickArchiveId(doc);
      const downloadUrl = ia ? `https://archive.org/download/${ia}/${ia}.pdf` : undefined;

      const item: MediaObject = {
        id: doc.key,
        title: doc.title,
        artist: doc.author_name?.join(", "),
        type: "book",
        thumbnail: coverUrl(doc.cover_i),
        downloadUrl,
        description: [
          doc.first_publish_year ? `First published: ${doc.first_publish_year}` : null,
          doc.edition_count ? `${doc.edition_count} edition(s)` : null,
          doc.subject?.length ? `Subjects: ${doc.subject.slice(0, 5).join(", ")}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
        meta: {
          olKey: doc.key,
          archiveId: ia,
          hasFulltext: doc.has_fulltext,
        },
      };
      return item;
    });
  },

  /**
   * Resolve a download URL lazily if the search response didn't carry an IA id.
   * Walks the work's editions looking for one hosted on archive.org.
   */
  async resolveDownload(item) {
    if (item.downloadUrl) return item.downloadUrl;
    const workKey = item.meta?.olKey as string | undefined;
    if (!workKey) return null;

    try {
      const { data } = await axios.get<{ entries?: Array<{ ocaid?: string }> }>(
        `https://openlibrary.org${workKey}/editions.json`,
        { params: { limit: 25 }, timeout: 10_000 },
      );
      const withIa = data.entries?.find((e) => !!e.ocaid);
      if (!withIa?.ocaid) return null;
      return `https://archive.org/download/${withIa.ocaid}/${withIa.ocaid}.pdf`;
    } catch {
      return null;
    }
  },
};

export default recipe;
