import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Recipe } from "../types/index.js";

/**
 * RecipeManager — descobre automaticamente plugins de Receita a partir
 * da pasta /src/recipes (em desenvolvimento) ou /dist/recipes (em produção).
 * Todo arquivo que exporta por default uma Receita válida vira uma fonte
 * de busca imediatamente.
 */
export class RecipeManager {
  private recipes: Recipe[] = [];

  /** Caminho absoluto da pasta de receitas, adjacente a /core. */
  private pastaReceitas(): string {
    const aqui = path.dirname(fileURLToPath(import.meta.url));
    // core/ e recipes/ são irmãs tanto em src/ quanto em dist/.
    return path.resolve(aqui, "..", "recipes");
  }

  async carregar(): Promise<Recipe[]> {
    const pasta = this.pastaReceitas();
    this.recipes = [];

    let entradas: string[];
    try {
      entradas = await fs.readdir(pasta);
    } catch {
      return this.recipes;
    }

    for (const entrada of entradas) {
      if (!/\.(ts|js|mjs)$/.test(entrada)) continue;
      if (entrada.endsWith(".d.ts")) continue;

      const completo = path.join(pasta, entrada);
      try {
        const mod = await import(pathToFileURL(completo).href);
        const candidato = (mod.default ?? mod.recipe) as Recipe | undefined;
        if (this.ehValida(candidato)) {
          this.recipes.push(candidato);
        }
      } catch (err) {
        // Uma receita quebrada não pode derrubar o loader — só reportamos.
        console.error(
          `[RecipeManager] Falha ao carregar "${entrada}":`,
          (err as Error).message,
        );
      }
    }

    return this.recipes;
  }

  private ehValida(r: unknown): r is Recipe {
    if (!r || typeof r !== "object") return false;
    const x = r as Partial<Recipe>;
    return (
      typeof x.name === "string" &&
      typeof x.type === "string" &&
      typeof x.search === "function"
    );
  }

  all(): Recipe[] {
    return this.recipes;
  }

  active(): Recipe[] {
    return this.recipes.filter((r) => r.enabled !== false);
  }

  porNome(nome: string): Recipe | undefined {
    return this.recipes.find((r) => r.name === nome);
  }

  // Alias mantido para compatibilidade com código em inglês.
  byName(nome: string): Recipe | undefined {
    return this.porNome(nome);
  }

  // Alias do método principal em inglês (não quebra quem já chamava `.load()`).
  load(): Promise<Recipe[]> {
    return this.carregar();
  }
}
