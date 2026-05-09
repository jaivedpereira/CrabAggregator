import axios from "axios";
import type { Recipe, MediaObject } from "../types/index.js";

/**
 * Receita Open Library
 * ------------------------------------------------------------
 * API pública, sem chave.
 * Busca:   https://openlibrary.org/search.json?q=<termo>&limit=10
 * Capas:   https://covers.openlibrary.org/b/id/<cover_i>-L.jpg
 * Edições: https://openlibrary.org/works/<key>/editions.json  (para IDs do IA)
 * Download: https://archive.org/download/<ia>/<ia>.pdf         (quando disponível)
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

interface OLResposta {
  docs: OLDoc[];
  numFound: number;
}

function urlCapa(id?: number): string | undefined {
  return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : undefined;
}

function pegarIdArchive(doc: OLDoc): string | undefined {
  return doc.ia && doc.ia.length > 0 ? doc.ia[0] : undefined;
}

const receita: Recipe = {
  name: "open-library",
  label: "Open Library (livros)",
  type: "book",
  display: "list",
  enabled: true,

  async search(consulta, _ctx): Promise<MediaObject[]> {
    const { data } = await axios.get<OLResposta>("https://openlibrary.org/search.json", {
      params: { q: consulta, limit: 10 },
      timeout: 10_000,
    });

    return (data.docs ?? []).map((doc) => {
      const ia = pegarIdArchive(doc);
      const downloadUrl = ia ? `https://archive.org/download/${ia}/${ia}.pdf` : undefined;

      const item: MediaObject = {
        id: doc.key,
        title: doc.title,
        artist: doc.author_name?.join(", "),
        type: "book",
        thumbnail: urlCapa(doc.cover_i),
        downloadUrl,
        description: [
          doc.first_publish_year ? `Publicado em ${doc.first_publish_year}` : null,
          doc.edition_count ? `${doc.edition_count} edição(ões)` : null,
          doc.subject?.length ? `Assuntos: ${doc.subject.slice(0, 5).join(", ")}` : null,
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
   * Resolve uma URL de download de forma preguiçosa caso a busca não
   * tenha trazido um IA id. Percorre as edições do work em busca de
   * uma hospedada no archive.org.
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
      const comIa = data.entries?.find((e) => !!e.ocaid);
      if (!comIa?.ocaid) return null;
      return `https://archive.org/download/${comIa.ocaid}/${comIa.ocaid}.pdf`;
    } catch {
      return null;
    }
  },
};

export default receita;
