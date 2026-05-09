import { promises as fs, createWriteStream } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import axios from "axios";
import type { MediaObject } from "../types/index.js";
import type { CrabConfig } from "./ConfigStore.js";

export interface DownloadJob {
  item: MediaObject;
  /** Resolved download URL (falls back to item.downloadUrl / item.streamUrl). */
  url?: string;
  /** Optional override for destination filename. */
  filename?: string;
}

export interface DownloadProgress {
  job: DownloadJob;
  receivedBytes: number;
  totalBytes?: number;
  percent?: number;
}

export type ProgressCallback = (p: DownloadProgress) => void;

/**
 * DownloadManager — serial FIFO queue.
 * - Streams/video go through `yt-dlp` when available.
 * - Everything else uses axios streaming into the configured downloadPath.
 */
export class DownloadManager {
  private queue: DownloadJob[] = [];
  private running = false;

  constructor(private config: CrabConfig, private onProgress?: ProgressCallback) {}

  enqueue(job: DownloadJob): void {
    this.queue.push(job);
  }

  size(): number {
    return this.queue.length;
  }

  /** Drain the queue, returning resolved destination paths. */
  async run(): Promise<string[]> {
    if (this.running) throw new Error("DownloadManager is already running");
    this.running = true;
    const outputs: string[] = [];
    try {
      await fs.mkdir(this.config.downloadPath, { recursive: true });
      while (this.queue.length) {
        const job = this.queue.shift()!;
        outputs.push(await this.process(job));
      }
    } finally {
      this.running = false;
    }
    return outputs;
  }

  private async process(job: DownloadJob): Promise<string> {
    const url = job.url ?? job.item.downloadUrl ?? job.item.streamUrl;
    if (!url) throw new Error(`No downloadable URL for "${job.item.title}"`);

    const useYtDlp = job.item.type === "video" || /youtube\.com|youtu\.be/.test(url);
    if (useYtDlp) return this.ytDlp(job, url);
    return this.httpStream(job, url);
  }

  private async httpStream(job: DownloadJob, url: string): Promise<string> {
    const filename = job.filename ?? this.inferFilename(job, url);
    const dest = path.join(this.config.downloadPath, filename);

    // responseType: "stream" makes data a Node Readable; axios types widen
    // to any here which is fine for our streaming contract.
    const res = await axios.get<any>(url, { responseType: "stream" });
    const stream = res.data as {
      on(ev: string, cb: (arg: any) => void): void;
      pipe(target: any): void;
    };
    const total = Number(res.headers["content-length"]) || undefined;
    let received = 0;

    await new Promise<void>((resolve, reject) => {
      const writer = createWriteStream(dest);
      stream.on("data", (chunk: Buffer) => {
        received += chunk.length;
        this.onProgress?.({
          job,
          receivedBytes: received,
          totalBytes: total,
          percent: total ? Math.round((received / total) * 100) : undefined,
        });
      });
      stream.pipe(writer);
      stream.on("error", reject);
      writer.on("finish", () => resolve());
      writer.on("error", reject);
    });

    return dest;
  }

  private ytDlp(job: DownloadJob, url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outTemplate = path.join(this.config.downloadPath, "%(title)s.%(ext)s");
      const child = spawn("yt-dlp", ["-o", outTemplate, "--newline", url], { stdio: ["ignore", "pipe", "pipe"] });

      let lastLine = "";
      child.stdout.on("data", (b: Buffer) => {
        const text = b.toString();
        lastLine = text.trim().split("\n").pop() ?? lastLine;
        // yt-dlp lines look like: "[download]  42.1% of ~12.34MiB at  1.23MiB/s ETA 00:05"
        const m = /([0-9.]+)%/.exec(lastLine);
        if (m) {
          this.onProgress?.({
            job,
            receivedBytes: 0,
            percent: Math.round(parseFloat(m[1]!)),
          });
        }
      });

      child.on("error", (err: Error) => {
        reject(new Error(`yt-dlp not available or failed: ${err.message}`));
      });
      child.on("close", (code: number | null) => {
        if (code === 0) resolve(this.config.downloadPath);
        else reject(new Error(`yt-dlp exited with code ${code}`));
      });
    });
  }

  private inferFilename(job: DownloadJob, url: string): string {
    const fromUrl = path.basename(new URL(url).pathname) || "";
    if (fromUrl && /\.[a-z0-9]{2,5}$/i.test(fromUrl)) return fromUrl;
    const safeTitle = job.item.title.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const ext = this.extForType(job.item.type);
    return `${safeTitle}${ext}`;
  }

  private extForType(type: MediaObject["type"]): string {
    switch (type) {
      case "music":
        return ".mp3";
      case "video":
        return ".mp4";
      case "book":
        return ".epub";
      case "image":
        return ".jpg";
      case "manga":
        return ".cbz";
      default:
        return ".bin";
    }
  }
}
