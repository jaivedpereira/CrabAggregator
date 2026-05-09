import chalk from "chalk";
import type { MediaObject } from "../types/index.js";

/**
 * Neo-Brutalist UI helpers — thick borders, solid blocks of color,
 * high-contrast labels. Designed to look intentional in plain terminals.
 */

const BORDER = chalk.bgWhite.black;
const ACCENT = chalk.bgYellow.black;
const DANGER = chalk.bgRed.white;
const MUTED = chalk.gray;

export function banner(title: string): string {
  const pad = "  ";
  const line = "=".repeat(title.length + pad.length * 2);
  return [
    BORDER(line),
    BORDER(`${pad}${title.toUpperCase()}${pad}`),
    BORDER(line),
  ].join("\n");
}

export function tag(label: string, color: "accent" | "danger" | "muted" = "accent"): string {
  const fn = color === "danger" ? DANGER : color === "muted" ? MUTED : ACCENT;
  return fn(` ${label.toUpperCase()} `);
}

export function block(label: string): string {
  return BORDER(` ${label} `);
}

export function divider(width = 60): string {
  return chalk.white("━".repeat(width));
}

/**
 * Render a MediaObject as a single list row. Keeps output terminal-safe
 * (no ANSI in the title itself beyond color).
 */
export function renderMediaRow(item: MediaObject, index: number): string {
  const n = chalk.bold.white(String(index + 1).padStart(2, "0"));
  const src = item.source ? tag(item.source, "muted") : "";
  const type = tag(item.type);
  const title = chalk.bold.white(item.title);
  const artist = item.artist ? chalk.yellow(` — ${item.artist}`) : "";
  return `${n} ${type}${src} ${title}${artist}`;
}

export function renderMediaDetail(item: MediaObject): string {
  const lines: string[] = [];
  lines.push(banner(item.title));
  if (item.artist) lines.push(`${tag("by")} ${chalk.white(item.artist)}`);
  lines.push(`${tag("type")} ${chalk.white(item.type)}`);
  if (item.source) lines.push(`${tag("source", "muted")} ${chalk.white(item.source)}`);
  if (item.thumbnail) lines.push(`${tag("cover")} ${chalk.cyan(item.thumbnail)}`);
  if (item.streamUrl) lines.push(`${tag("stream")} ${chalk.cyan(item.streamUrl)}`);
  if (item.downloadUrl) lines.push(`${tag("download")} ${chalk.cyan(item.downloadUrl)}`);
  if (item.description) {
    lines.push(divider());
    lines.push(chalk.white(item.description));
  }
  return lines.join("\n");
}

export function errorBox(msg: string): string {
  return `${tag("error", "danger")} ${chalk.red(msg)}`;
}

export function successBox(msg: string): string {
  return `${tag("ok")} ${chalk.green(msg)}`;
}
