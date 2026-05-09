import { carregarConfig, salvarConfig, type EntradaHistorico } from "./ConfigStore.js";

/**
 * HistoryStore — mantém o histórico de buscas do usuário (mais recentes
 * no topo). Limitado a N entradas para evitar crescimento infinito.
 */
export class HistoryStore {
  constructor(private limite = 50) {}

  async listar(): Promise<EntradaHistorico[]> {
    const cfg = await carregarConfig();
    return cfg.historico ?? [];
  }

  async registrar(termo: string, resultados: number): Promise<void> {
    const cfg = await carregarConfig();
    const entrada: EntradaHistorico = {
      termo,
      resultados,
      quando: new Date().toISOString(),
    };
    // Desduplica pelo termo (mantém apenas a ocorrência mais recente).
    const semDuplicata = (cfg.historico ?? []).filter((h) => h.termo !== termo);
    cfg.historico = [entrada, ...semDuplicata].slice(0, this.limite);
    await salvarConfig(cfg);
  }

  async limpar(): Promise<void> {
    const cfg = await carregarConfig();
    cfg.historico = [];
    await salvarConfig(cfg);
  }
}
