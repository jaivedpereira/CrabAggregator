import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { MediaObject } from "../types/index.js";

/**
 * ConfigStore — persistência simples em JSON no arquivo ~/.crabrc.json.
 * Guarda preferências do usuário (caminho de download, chaves de API,
 * favoritos e histórico de buscas).
 */
export interface EntradaHistorico {
  termo: string;
  resultados: number;
  quando: string; // ISO 8601
}

export interface CrabConfig {
  /** Pasta onde os downloads serão salvos. */
  downloadPath: string;
  /** Configurações específicas por receita (nome -> objeto). */
  recipes: Record<string, Record<string, unknown>>;
  /** Chaves de API nomeadas (nome -> valor). */
  apiKeys: Record<string, string>;
  /** Mídias favoritas do usuário. */
  favoritos: MediaObject[];
  /** Histórico de buscas (mais recente no topo). */
  historico: EntradaHistorico[];
  /** Receitas desabilitadas pelo usuário (sobrescreve `enabled` da receita). */
  receitasDesabilitadas: string[];
  [k: string]: unknown;
}

const CAMINHO_CONFIG = path.join(homedir(), ".crabrc.json");

const PADRAO: CrabConfig = {
  // Valor amigável para Termux; em Linux/macOS a pasta é criada sob demanda.
  downloadPath: "/sdcard/Download/CrabAggregator",
  recipes: {},
  apiKeys: {},
  favoritos: [],
  historico: [],
  receitasDesabilitadas: [],
};

export async function carregarConfig(): Promise<CrabConfig> {
  try {
    const cru = await fs.readFile(CAMINHO_CONFIG, "utf8");
    const analisado = JSON.parse(cru) as Partial<CrabConfig>;
    return { ...PADRAO, ...analisado };
  } catch {
    return { ...PADRAO };
  }
}

export async function salvarConfig(cfg: CrabConfig): Promise<void> {
  await fs.writeFile(CAMINHO_CONFIG, JSON.stringify(cfg, null, 2), "utf8");
}

export function caminhoConfig(): string {
  return CAMINHO_CONFIG;
}

// Aliases em inglês mantidos por compatibilidade com código/tooling externo.
export const loadConfig = carregarConfig;
export const saveConfig = salvarConfig;
export const getConfigPath = caminhoConfig;
