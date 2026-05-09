import { playWithMpv } from "../utils/termux.js";
import { banner, errorBox, successBox, tag } from "../utils/ui.js";
import chalk from "chalk";

/** `crab play <url>` — stream a URL with mpv. */
export async function runPlay(url: string, opts: { background?: boolean; audioOnly?: boolean } = {}): Promise<void> {
  console.log(banner("CrabAggregator · Play"));
  console.log(`${tag("url", "muted")} ${chalk.cyan(url)}`);
  try {
    const child = playWithMpv(url, opts);
    if (opts.background) {
      console.log(successBox(`mpv started in background (pid ${child.pid}).`));
    }
  } catch (err) {
    console.log(errorBox((err as Error).message));
    process.exitCode = 1;
  }
}
