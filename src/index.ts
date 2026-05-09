#!/usr/bin/env node
import { Command } from "commander";
import { runSearch } from "./commands/search.js";
import { runConfig } from "./commands/config.js";
import { runDownload } from "./commands/download.js";
import { runPlay } from "./commands/play.js";
import { runRecipes } from "./commands/recipes.js";
import type { MediaType } from "./types/index.js";

const program = new Command();

program
  .name("crab")
  .description("CrabAggregator — a modular, terminal-first media aggregator.")
  .version("0.1.0");

program
  .command("search [query...]")
  .description("Search across all active recipes")
  .option("--only <names...>", "Restrict to specific recipe names")
  .option("--json", "Print raw JSON slices instead of the interactive UI")
  .action(async (query: string[], opts: { only?: string[]; json?: boolean }) => {
    await runSearch(query?.join(" ") || undefined, opts);
  });

program
  .command("play <url>")
  .description("Stream a URL with mpv")
  .option("-b, --background", "Detach mpv so it runs in background")
  .option("-a, --audio-only", "Disable video output")
  .action(async (url: string, opts: { background?: boolean; audioOnly?: boolean }) => {
    await runPlay(url, opts);
  });

program
  .command("download <url>")
  .description("Queue a direct URL for download")
  .option("-t, --type <type>", "Media type (music|book|manga|video|image|other)", "other")
  .option("-n, --name <name>", "Override output filename")
  .action(async (url: string, opts: { type?: string; name?: string }) => {
    await runDownload(url, { type: opts.type as MediaType | undefined, name: opts.name });
  });

program
  .command("config")
  .description("Interactively edit ~/.crabrc.json")
  .action(async () => {
    await runConfig();
  });

program
  .command("recipes")
  .description("List all discovered recipes")
  .action(async () => {
    await runRecipes();
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
