import { spawn, spawnSync } from "node:child_process";

/**
 * Termux helpers — thin wrappers around external binaries. All functions
 * degrade gracefully when the tool isn't installed (common on desktop).
 */

function hasBinary(name: string): boolean {
  const which = spawnSync("which", [name], { stdio: "ignore" });
  return which.status === 0;
}

/**
 * Stream a URL via mpv. Returns the child process so the caller can
 * wire signals (Ctrl+C, etc.). Detaches for background playback when requested.
 */
export function playWithMpv(url: string, opts: { background?: boolean; audioOnly?: boolean } = {}) {
  if (!hasBinary("mpv")) {
    throw new Error("mpv is not installed. On Termux: pkg install mpv");
  }
  const args: string[] = [];
  if (opts.audioOnly) args.push("--no-video");
  args.push(url);

  const child = spawn("mpv", args, {
    stdio: opts.background ? "ignore" : "inherit",
    detached: !!opts.background,
  });
  if (opts.background) child.unref();
  return child;
}

/**
 * Open a URL/file with the system's default handler.
 * Uses `termux-open` on Termux, falls back to xdg-open / open.
 */
export function openExternally(target: string): void {
  const candidates = ["termux-open", "xdg-open", "open"];
  for (const bin of candidates) {
    if (hasBinary(bin)) {
      spawn(bin, [target], { stdio: "ignore", detached: true }).unref();
      return;
    }
  }
  throw new Error("No opener found (tried termux-open, xdg-open, open).");
}

/** Whether we're running inside Termux. */
export function isTermux(): boolean {
  return !!process.env.PREFIX?.includes("com.termux") || hasBinary("termux-open");
}

export { hasBinary };
