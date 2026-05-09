import chalk from "chalk";
import { RecipeManager } from "../core/RecipeManager.js";
import { banner, tag } from "../utils/ui.js";

/** `crab recipes` — list all discovered recipes and their status. */
export async function runRecipes(): Promise<void> {
  console.log(banner("CrabAggregator · Recipes"));
  const manager = new RecipeManager();
  await manager.load();
  const all = manager.all();
  if (all.length === 0) {
    console.log(chalk.yellow("No recipes found in src/recipes (or dist/recipes)."));
    return;
  }
  for (const r of all) {
    const status = r.enabled === false ? tag("off", "danger") : tag("on");
    console.log(`${status} ${chalk.bold(r.name)} ${chalk.gray(`· ${r.type}`)}${r.label ? chalk.gray(` · ${r.label}`) : ""}`);
  }
}
