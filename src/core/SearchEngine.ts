import type { MediaObject, Recipe, RecipeContext } from "../types/index.js";
import type { RecipeManager } from "./RecipeManager.js";
import type { CrabConfig } from "./ConfigStore.js";

export interface SearchOptions {
  /** Restrict search to a subset of recipe names. */
  only?: string[];
  /** Per-recipe timeout in ms. Default 15s. */
  timeoutMs?: number;
}

export interface SearchSlice {
  recipe: string;
  items: MediaObject[];
  error?: string;
}

/**
 * SearchEngine — fans a query out to all active recipes in parallel,
 * enforcing per-recipe timeouts and isolating failures.
 */
export class SearchEngine {
  constructor(private manager: RecipeManager, private config: CrabConfig) {}

  private buildContext(recipe: Recipe): RecipeContext {
    return {
      config: this.config as unknown as Record<string, unknown>,
      recipeConfig: this.config.recipes?.[recipe.name] ?? {},
    };
  }

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
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

  async search(query: string, opts: SearchOptions = {}): Promise<SearchSlice[]> {
    const timeoutMs = opts.timeoutMs ?? 15_000;
    const recipes = this.manager.active().filter((r) => !opts.only || opts.only.includes(r.name));

    const jobs = recipes.map(async (recipe): Promise<SearchSlice> => {
      try {
        const items = await this.withTimeout(recipe.search(query, this.buildContext(recipe)), timeoutMs);
        // Stamp the source for downstream renderers.
        for (const item of items) item.source = recipe.name;
        return { recipe: recipe.name, items };
      } catch (err) {
        return { recipe: recipe.name, items: [], error: (err as Error).message };
      }
    });

    return Promise.all(jobs);
  }

  /** Flattened view of all results across recipes. */
  async searchFlat(query: string, opts: SearchOptions = {}): Promise<MediaObject[]> {
    const slices = await this.search(query, opts);
    return slices.flatMap((s) => s.items);
  }
}
