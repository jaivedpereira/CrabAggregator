# CrabAggregator 🦀

A universal, modular media aggregator CLI — music, books, manga and videos — built in **Node.js + TypeScript** and friendly to **Termux (Android)**.

The core is agnostic. Every source is a **Recipe** (a single `.ts` file) that knows how to talk to an API and normalize its results into a common `MediaObject`. Drop a recipe into `src/recipes/` and it becomes searchable, playable and downloadable.

---

## Quick start

```bash
npm install
npm run dev -- search "dune frank herbert"
# or build once and use the `crab` binary
npm run build
node dist/index.js search "dune"
```

## Commands

| Command                     | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `crab search [query...]`    | Fan-out search across every active recipe      |
| `crab search --only <name>` | Restrict search to specific recipes            |
| `crab search --json`        | Print raw slices (great for piping into `jq`)  |
| `crab play <url>`           | Stream with `mpv` (`-b` background, `-a` audio-only) |
| `crab download <url>`       | Queue a URL for download                       |
| `crab config`               | Edit `~/.crabrc.json` (download path, API keys)|
| `crab recipes`              | List discovered recipes and their status       |

## Architecture

```
src/
├── index.ts              # commander-powered CLI entry
├── types/                # MediaObject + Recipe contracts
├── core/
│   ├── RecipeManager.ts  # Auto-discovers /recipes
│   ├── SearchEngine.ts   # Parallel fan-out, per-recipe timeouts
│   ├── ConfigStore.ts    # ~/.crabrc.json persistence
│   └── DownloadManager.ts# axios stream + yt-dlp fallback
├── utils/
│   ├── ui.ts             # Neo-brutalist chalk helpers
│   └── termux.ts         # mpv / termux-open wrappers
├── commands/             # search, play, download, config, recipes
└── recipes/
    └── openLibrary.ts    # Example recipe (no API key needed)
```

### The `MediaObject` contract

```ts
interface MediaObject {
  id: string;
  source?: string;         // stamped by the engine
  title: string;
  artist?: string;
  type: "music" | "book" | "manga" | "video" | "image" | "other";
  thumbnail?: string;
  streamUrl?: string;      // passed to mpv
  downloadUrl?: string;    // passed to DownloadManager
  description?: string;
  meta?: Record<string, unknown>;
}
```

### Writing a Recipe

```ts
import type { Recipe } from "../types/index.js";
import axios from "axios";

const recipe: Recipe = {
  name: "my-source",
  type: "music",
  async search(query, ctx) {
    const { data } = await axios.get("https://api.example.com/search", {
      params: { q: query },
      headers: { Authorization: `Bearer ${ctx.config.apiKeys?.myKey}` },
    });
    return data.items.map((x: any) => ({
      id: x.id,
      title: x.name,
      artist: x.artist,
      type: "music",
      thumbnail: x.cover,
      streamUrl: x.stream_url,
      downloadUrl: x.download_url,
    }));
  },
};

export default recipe;
```

A recipe may optionally implement:

- `resolveDownload(item, ctx)` — lazily produce a direct download URL.
- `resolveStream(item, ctx)` — lazily produce an `mpv`-compatible URL.

## Termux requirements (optional but recommended)

```bash
pkg install nodejs mpv yt-dlp termux-api
```

Default download path is `/sdcard/Download/CrabAggregator` (change it via `crab config`).

## Example recipe included

**`open-library`** — searches [Open Library](https://openlibrary.org) (no key needed), fills covers from `covers.openlibrary.org`, and resolves PDF downloads from the Internet Archive when available.

## License

MIT
