import type { MediaObject, MediaType } from "./MediaObject.js";

/**
 * DisplayStyle — hint to the renderer on how to present results from
 * this recipe. The core UI may fall back to "list" if unsupported.
 */
export type DisplayStyle = "list" | "table" | "grid";

/**
 * RecipeContext — runtime info passed to recipe methods. Allows recipes
 * to read user config (API keys, download paths) without pulling globals.
 */
export interface RecipeContext {
  /** Merged user config (from ~/.crabrc.json + env). */
  config: Record<string, unknown>;
  /** Recipe-scoped config under `recipes.<name>` in the config file. */
  recipeConfig: Record<string, unknown>;
}

/**
 * Recipe — the plugin contract. Drop a file exporting a default Recipe
 * into /src/recipes and the RecipeManager auto-discovers it.
 */
export interface Recipe {
  /** Unique recipe name (kebab-case recommended). */
  name: string;

  /** Human label shown in UI. */
  label?: string;

  /** Media kind this recipe produces. */
  type: MediaType;

  /** Whether this recipe should participate in global search. Defaults true. */
  enabled?: boolean;

  /** UI rendering hint. Defaults to "list". */
  display?: DisplayStyle;

  /**
   * Perform a search against the underlying API and return normalized
   * MediaObjects. Implementations should be resilient — a single failing
   * recipe must not crash the aggregator.
   */
  search(query: string, ctx: RecipeContext): Promise<MediaObject[]>;

  /**
   * Optional: lazily resolve a direct download URL for a MediaObject.
   * Useful when the search response only exposes a landing page.
   */
  resolveDownload?(item: MediaObject, ctx: RecipeContext): Promise<string | null>;

  /**
   * Optional: lazily resolve a stream URL (for mpv).
   */
  resolveStream?(item: MediaObject, ctx: RecipeContext): Promise<string | null>;
}
