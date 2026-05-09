import * as p from "@clack/prompts";
import { loadConfig, saveConfig, getConfigPath } from "../core/ConfigStore.js";
import { banner, successBox, tag } from "../utils/ui.js";
import chalk from "chalk";

/**
 * Interactive config editor. Lets the user tweak the download path
 * and manage named API keys persisted at ~/.crabrc.json.
 */
export async function runConfig(): Promise<void> {
  console.log(banner("CrabAggregator · Config"));
  console.log(`${tag("file", "muted")} ${chalk.cyan(getConfigPath())}\n`);

  const cfg = await loadConfig();

  const action = await p.select({
    message: "What do you want to configure?",
    options: [
      { value: "downloadPath", label: `Download path (current: ${cfg.downloadPath})` },
      { value: "apiKey", label: "Add / update an API key" },
      { value: "show", label: "Show current config" },
      { value: "exit", label: "Exit" },
    ],
  });
  if (p.isCancel(action) || action === "exit") return;

  if (action === "downloadPath") {
    const next = await p.text({
      message: "New download path:",
      initialValue: cfg.downloadPath,
    });
    if (p.isCancel(next)) return;
    cfg.downloadPath = String(next);
    await saveConfig(cfg);
    console.log(successBox(`downloadPath set to ${cfg.downloadPath}`));
    return;
  }

  if (action === "apiKey") {
    const name = await p.text({ message: "API key name (e.g. youtube, tmdb):" });
    if (p.isCancel(name) || !name) return;
    const value = await p.password({ message: `Value for "${String(name)}":` });
    if (p.isCancel(value)) return;
    cfg.apiKeys[String(name)] = String(value);
    await saveConfig(cfg);
    console.log(successBox(`Saved apiKeys.${String(name)}`));
    return;
  }

  if (action === "show") {
    console.log(chalk.white(JSON.stringify(cfg, null, 2)));
  }
}
