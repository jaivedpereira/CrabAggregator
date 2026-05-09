import * as p from "@clack/prompts";
import chalk from "chalk";
import { RecipeManager } from "../core/RecipeManager.js";
import { SearchEngine } from "../core/SearchEngine.js";
import { DownloadManager } from "../core/DownloadManager.js";
import { loadConfig } from "../core/ConfigStore.js";
import { banner, renderMediaRow, renderMediaDetail, tag, errorBox, successBox } from "../utils/ui.js";
import { openExternally, playWithMpv } from "../utils/termux.js";
import type { MediaObject } from "../types/index.js";

export interface SearchCommandOpts {
  only?: string[];
  json?: boolean;
}

export async function runSearch(query: string | undefined, opts: SearchCommandOpts = {}): Promise<void> {
  console.log(banner("CrabAggregator · Search"));

  const manager = new RecipeManager();
  await manager.load();
  if (manager.active().length === 0) {
    console.log(errorBox("No active recipes found. Drop a Recipe into src/recipes/."));
    return;
  }

  let term = query;
  if (!term) {
    const answer = await p.text({ message: "What are you looking for?", placeholder: "e.g. dune frank herbert" });
    if (p.isCancel(answer) || !answer) return;
    term = String(answer);
  }

  const config = await loadConfig();
  const engine = new SearchEngine(manager, config);

  const spinner = p.spinner();
  spinner.start(`Querying ${manager.active().length} recipe(s)...`);
  const slices = await engine.search(term, { only: opts.only });
  spinner.stop("Results ready.");

  if (opts.json) {
    console.log(JSON.stringify(slices, null, 2));
    return;
  }

  const flat: MediaObject[] = [];
  for (const slice of slices) {
    if (slice.error) {
      console.log(errorBox(`[${slice.recipe}] ${slice.error}`));
      continue;
    }
    if (slice.items.length === 0) {
      console.log(`${tag(slice.recipe, "muted")} ${chalk.gray("no results")}`);
      continue;
    }
    console.log(`\n${tag(slice.recipe)} ${chalk.white(`${slice.items.length} result(s)`)}`);
    for (const item of slice.items) {
      flat.push(item);
      console.log("  " + renderMediaRow(item, flat.length - 1));
    }
  }

  if (flat.length === 0) {
    console.log("\n" + errorBox("No results across all recipes."));
    return;
  }

  const pick = await p.select({
    message: "Select a result:",
    options: flat.map((item, i) => ({
      value: i,
      label: `${String(i + 1).padStart(2, "0")} · ${item.title}`,
      hint: item.source,
    })),
  });
  if (p.isCancel(pick)) return;

  const chosen = flat[Number(pick)]!;
  console.log("\n" + renderMediaDetail(chosen));

  const action = await p.select({
    message: "What now?",
    options: [
      ...(chosen.streamUrl ? [{ value: "play", label: "Play with mpv" }] : []),
      ...(chosen.downloadUrl ? [{ value: "download", label: "Download" }] : []),
      ...(chosen.thumbnail ? [{ value: "cover", label: "Open cover externally" }] : []),
      { value: "exit", label: "Exit" },
    ],
  });
  if (p.isCancel(action) || action === "exit") return;

  if (action === "play" && chosen.streamUrl) {
    try {
      playWithMpv(chosen.streamUrl, { audioOnly: chosen.type === "music" });
    } catch (err) {
      console.log(errorBox((err as Error).message));
    }
  } else if (action === "download" && chosen.downloadUrl) {
    const dl = new DownloadManager(config, (prog) => {
      if (prog.percent != null) {
        process.stdout.write(`\r${tag("downloading")} ${prog.percent}%   `);
      }
    });
    dl.enqueue({ item: chosen });
    try {
      const [dest] = await dl.run();
      process.stdout.write("\n");
      console.log(successBox(`Saved to ${dest}`));
    } catch (err) {
      process.stdout.write("\n");
      console.log(errorBox((err as Error).message));
    }
  } else if (action === "cover" && chosen.thumbnail) {
    try {
      openExternally(chosen.thumbnail);
    } catch (err) {
      console.log(errorBox((err as Error).message));
    }
  }
}
