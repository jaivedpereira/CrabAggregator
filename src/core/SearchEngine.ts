import type { MediaObject, Recipe, RecipeContext } from "../types/index.js";
import type { RecipeManager } from "./RecipeManager.js";
import type { CrabConfig } from "./ConfigStore.js";

export interface OpcoesBusca {
  /** Restringe a busca a um subconjunto de receitas (por nome). */
  somente?: string[];
  /** Timeout por receita em ms. Padrão: 15s. */
  timeoutMs?: number;
}

export interface FatiaResultado {
  receita: string;
  itens: MediaObject[];
  erro?: string;
}

/**
 * SearchEngine — dispara a consulta em paralelo para todas as receitas
 * ativas, aplicando timeout individual e isolando falhas para que uma
 * receita quebrada não derrube as outras.
 */
export class SearchEngine {
  constructor(private manager: RecipeManager, private config: CrabConfig) {}

  private montarContexto(receita: Recipe): RecipeContext {
    return {
      config: this.config as unknown as Record<string, unknown>,
      recipeConfig: this.config.recipes?.[receita.name] ?? {},
    };
  }

  private comTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout após ${ms}ms`)), ms);
      p.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        },
      );
    });
  }

  private receitasAtivas(): Recipe[] {
    const desabilitadas = new Set(this.config.receitasDesabilitadas ?? []);
    return this.manager.active().filter((r) => !desabilitadas.has(r.name));
  }

  async buscar(consulta: string, opts: OpcoesBusca = {}): Promise<FatiaResultado[]> {
    const timeoutMs = opts.timeoutMs ?? 15_000;
    const receitas = this.receitasAtivas().filter(
      (r) => !opts.somente || opts.somente.includes(r.name),
    );

    const jobs = receitas.map(async (r): Promise<FatiaResultado> => {
      try {
        const itens = await this.comTimeout(r.search(consulta, this.montarContexto(r)), timeoutMs);
        for (const item of itens) item.source = r.name;
        return { receita: r.name, itens };
      } catch (err) {
        return { receita: r.name, itens: [], erro: (err as Error).message };
      }
    });

    return Promise.all(jobs);
  }

  /** Visão plana de todos os resultados, ignorando a estrutura por receita. */
  async buscarPlano(consulta: string, opts: OpcoesBusca = {}): Promise<MediaObject[]> {
    const fatias = await this.buscar(consulta, opts);
    return fatias.flatMap((f) => f.itens);
  }
}
