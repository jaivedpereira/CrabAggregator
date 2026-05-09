import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Recipe } from "../types/index.js";

/**
 * RecipeManager — auto-discovers Recipe plugins from /src/recipes (dev)
 * or /dist/recipes (prod). Every file that default-exports a valid Recipe
 * becomes a search source.
 */
export class RecipeManager {
  private recipes: Recipe[] = [];

  /** Returns the absolute path of the recipes directory, adjacent to core/. */
  private getRecipesDir(): string {
    const here = path.dirname(fileURLToPath(import.meta.url));
    // core/ and recipes/ are siblings in both src and dist.
    return path.resolve(here, "..", "recipes");
  }

  async load(): Promise<Recipe[]> {
    const dir = this.getRecipesDir();
    this.recipes = [];

    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return this.recipes;
    }

    for (const entry of entries) {
      if (!/\.(ts|js|mjs)$/.test(entry)) continue;
      if (entry.endsWith(".d.ts")) continue;

      const full = path.join(dir, entry);
      try {
        const mod = await import(pathToFileURL(full).href);
        const candidate = (mod.default ?? mod.recipe) as Recipe | undefined;
        if (this.isValid(candidate)) {
          this.recipes.push(candidate);
        }
      } catch (err) {
        // A broken recipe must not crash the loader — just surface it.
        console.error(`[RecipeManager] Failed to load "${entry}":`, (err as Error).message);
      }
    }

    return this.recipes;
  }

  private isValid(r: unknown): r is Recipe {
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

  byName(name: string): Recipe | undefined {
    return this.recipes.find((r) => r.name === name);
  }
}
