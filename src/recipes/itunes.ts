import axios from "axios";
import type { Recipe, MediaObject } from "../types/index.js";

/**
 * Receita iTunes Search
 * ------------------------------------------------------------
 * API pública da Apple, sem chave.
 * https://itunes.apple.com/search?term=<termo>&entity=song&limit=15
 *
 * Cada resultado traz um `previewUrl` de ~30s em M4A/AAC, que serve
 * tanto para preview com mpv quanto para download direto.
 */

interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
}

interface ItunesResposta {
  resultCount: number;
  results: ItunesTrack[];
}

function artworkGrande(url?: string): string | undefined {
  // A API devolve 100x100. Aumenta para 600x600 trocando o sufixo.
  return url?.replace("100x100bb.jpg", "600x600bb.jpg");
}

function formatarDuracao(ms?: number): string | null {
  if (!ms) return null;
  const s = Math.round(ms / 1000);
  const min = Math.floor(s / 60);
  const seg = s % 60;
  return `${min}:${String(seg).padStart(2, "0")}`;
}

const receita: Recipe = {
  name: "itunes",
  label: "iTunes Search (música)",
  type: "music",
  display: "list",
  enabled: true,

  async search(consulta): Promise<MediaObject[]> {
    const { data } = await axios.get<ItunesResposta>("https://itunes.apple.com/search", {
      params: {
        term: consulta,
        entity: "song",
        limit: 15,
        media: "music",
      },
      timeout: 10_000,
    });

    return (data.results ?? []).map((t) => {
      const duracao = formatarDuracao(t.trackTimeMillis);
      const item: MediaObject = {
        id: String(t.trackId),
        title: t.trackName,
        artist: t.artistName,
        type: "music",
        thumbnail: artworkGrande(t.artworkUrl100),
        streamUrl: t.previewUrl,
        downloadUrl: t.previewUrl,
        description: [
          t.collectionName ? `Álbum: ${t.collectionName}` : null,
          t.primaryGenreName ? `Gênero: ${t.primaryGenreName}` : null,
          duracao ? `Duração: ${duracao} (prévia 30s)` : null,
          t.releaseDate ? `Lançamento: ${t.releaseDate.slice(0, 10)}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
        meta: {
          album: t.collectionName,
          genero: t.primaryGenreName,
          pagina: t.trackViewUrl,
        },
      };
      return item;
    });
  },
};

export default receita;
