import { DownloadManager } from "../core/DownloadManager.js";
import { loadConfig } from "../core/ConfigStore.js";
import { banner, errorBox, successBox, tag } from "../utils/ui.js";
import type { MediaObject } from "../types/index.js";
import chalk from "chalk";

/** `crab download <url>` — queue a single URL for download. */
export async function runDownload(url: string, opts: { type?: MediaObject["type"]; name?: string } = {}): Promise<void> {
  console.log(banner("CrabAggregator · Download"));
  console.log(`${tag("url", "muted")} ${chalk.cyan(url)}`);

  const config = await loadConfig();
  const dl = new DownloadManager(config, (prog) => {
    if (prog.percent != null) {
      process.stdout.write(`\r${tag("downloading")} ${prog.percent}%   `);
    }
  });

  const item: MediaObject = {
    id: opts.name ?? url,
    title: opts.name ?? "download",
    type: opts.type ?? "other",
    downloadUrl: url,
  };
  dl.enqueue({ item });

  try {
    const [dest] = await dl.run();
    process.stdout.write("\n");
    console.log(successBox(`Saved to ${dest ?? config.downloadPath}`));
  } catch (err) {
    process.stdout.write("\n");
    console.log(errorBox((err as Error).message));
    process.exitCode = 1;
  }
}
