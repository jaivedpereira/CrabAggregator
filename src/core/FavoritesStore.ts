import type { MediaObject } from "../types/index.js";
import { carregarConfig, salvarConfig } from "./ConfigStore.js";

/**
 * FavoritesStore — operações sobre a lista de favoritos persistida em
 * ~/.crabrc.json. Usa o ConfigStore por baixo dos panos para manter um
 * único arquivo de estado para o usuário.
 */
export class FavoritesStore {
  /** Retorna a lista atual de favoritos. */
  async listar(): Promise<MediaObject[]> {
    const cfg = await carregarConfig();
    return cfg.favoritos ?? [];
  }

  /** Adiciona um item aos favoritos (evita duplicatas pelo par source+id). */
  async adicionar(item: MediaObject): Promise<boolean> {
    const cfg = await carregarConfig();
    const ja = cfg.favoritos.some((f) => this.mesmaMidia(f, item));
    if (ja) return false;
    cfg.favoritos.unshift(item);
    await salvarConfig(cfg);
    return true;
  }

  /** Remove um item dos favoritos. Retorna true se algo foi removido. */
  async remover(item: MediaObject): Promise<boolean> {
    const cfg = await carregarConfig();
    const antes = cfg.favoritos.length;
    cfg.favoritos = cfg.favoritos.filter((f) => !this.mesmaMidia(f, item));
    if (cfg.favoritos.length === antes) return false;
    await salvarConfig(cfg);
    return true;
  }

  /** Limpa todos os favoritos. */
  async limpar(): Promise<void> {
    const cfg = await carregarConfig();
    cfg.favoritos = [];
    await salvarConfig(cfg);
  }

  /** Verifica se um item já está favoritado. */
  async contem(item: MediaObject): Promise<boolean> {
    const lista = await this.listar();
    return lista.some((f) => this.mesmaMidia(f, item));
  }

  private mesmaMidia(a: MediaObject, b: MediaObject): boolean {
    return a.id === b.id && (a.source ?? "") === (b.source ?? "");
  }
}
