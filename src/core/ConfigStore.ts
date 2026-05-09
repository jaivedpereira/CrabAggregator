import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

/**
 * ConfigStore — simple JSON file persistence at ~/.crabrc.json.
 * Holds user preferences (download path, API keys, per-recipe overrides).
 */
export interface CrabConfig {
  downloadPath: string;
  recipes: Record<string, Record<string, unknown>>;
  apiKeys: Record<string, string>;
  [k: string]: unknown;
}

const CONFIG_PATH = path.join(homedir(), ".crabrc.json");

const DEFAULTS: CrabConfig = {
  // Termux-friendly default. Falls back fine on Linux/macOS (folder is created on demand).
  downloadPath: "/sdcard/Download/CrabAggregator",
  recipes: {},
  apiKeys: {},
};

export async function loadConfig(): Promise<CrabConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<CrabConfig>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveConfig(cfg: CrabConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
