import axios from "axios";
import type { Recipe, MediaObject } from "../types/index.js";

/**
 * Receita PokeAPI
 * ------------------------------------------------------------
 * API pública, sem chave. Serve como demonstração de como uma receita
 * "exótica" pode se encaixar no CrabAggregator: cada Pokémon vira um
 * MediaObject do tipo "image" com artwork oficial como download.
 *
 * A PokeAPI não tem endpoint de busca por nome parcial, então tentamos
 * um lookup direto; se falhar, listamos alguns da página 0 que batam.
 */

interface PokeDetalhe {
  id: number;
  name: string;
  types: Array<{ type: { name: string } }>;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    other?: {
      ["official-artwork"]?: { front_default?: string | null };
    };
  };
}

interface PokeListagem {
  results: Array<{ name: string; url: string }>;
}

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function paraItem(p: PokeDetalhe): MediaObject {
  const artwork =
    p.sprites.other?.["official-artwork"]?.front_default ?? p.sprites.front_default ?? undefined;
  return {
    id: String(p.id),
    title: `#${String(p.id).padStart(3, "0")} ${capitalizar(p.name)}`,
    type: "image",
    thumbnail: artwork ?? undefined,
    downloadUrl: artwork ?? undefined,
    description: [
      `Tipos: ${p.types.map((t) => capitalizar(t.type.name)).join(", ")}`,
      `Altura: ${p.height / 10} m`,
      `Peso: ${p.weight / 10} kg`,
    ].join(" · "),
    meta: {
      pokedex: p.id,
    },
  };
}

async function buscarDireto(nome: string): Promise<PokeDetalhe | null> {
  try {
    const { data } = await axios.get<PokeDetalhe>(
      `https://pokeapi.co/api/v2/pokemon/${nome.toLowerCase()}`,
      { timeout: 8_000 },
    );
    return data;
  } catch {
    return null;
  }
}

async function buscarPrefixo(consulta: string): Promise<PokeDetalhe[]> {
  // Puxa uma página grande e filtra localmente por prefixo.
  const { data } = await axios.get<PokeListagem>("https://pokeapi.co/api/v2/pokemon", {
    params: { limit: 1000 },
    timeout: 10_000,
  });
  const alvo = consulta.toLowerCase();
  const candidatos = data.results.filter((r) => r.name.includes(alvo)).slice(0, 8);

  const detalhes = await Promise.all(
    candidatos.map(async (c) => {
      try {
        const d = await axios.get<PokeDetalhe>(c.url, { timeout: 8_000 });
        return d.data;
      } catch {
        return null;
      }
    }),
  );
  return detalhes.filter((x): x is PokeDetalhe => x !== null);
}

const receita: Recipe = {
  name: "pokeapi",
  label: "PokeAPI (demonstração)",
  type: "image",
  // Desligada por padrão para não poluir buscas musicais/literárias do usuário.
  enabled: false,
  display: "list",

  async search(consulta): Promise<MediaObject[]> {
    const direto = await buscarDireto(consulta);
    if (direto) return [paraItem(direto)];
    const varios = await buscarPrefixo(consulta);
    return varios.map(paraItem);
  },
};

export default receita;
