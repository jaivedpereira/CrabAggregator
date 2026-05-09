import { promises as fs, createWriteStream } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import axios from "axios";
import type { MediaObject } from "../types/index.js";
import type { CrabConfig } from "./ConfigStore.js";

export interface TrabalhoDownload {
  item: MediaObject;
  /** URL resolvida para download (cai para item.downloadUrl / streamUrl). */
  url?: string;
  /** Sobrescreve o nome do arquivo de destino. */
  nomeArquivo?: string;
}

export interface ProgressoDownload {
  trabalho: TrabalhoDownload;
  bytesRecebidos: number;
  bytesTotais?: number;
  percentual?: number;
  /** Velocidade média desde o início, em bytes/segundo. */
  velocidade?: number;
  /** Tempo estimado até finalizar, em segundos. */
  etaSegundos?: number;
}

export type CallbackProgresso = (p: ProgressoDownload) => void;

/**
 * DownloadManager — fila FIFO serial.
 * - Streams/vídeo usam `yt-dlp` quando disponível.
 * - Demais casos usam axios em streaming para o `downloadPath` configurado.
 */
export class DownloadManager {
  private fila: TrabalhoDownload[] = [];
  private rodando = false;

  constructor(private config: CrabConfig, private aoProgredir?: CallbackProgresso) {}

  enfileirar(trabalho: TrabalhoDownload): void {
    this.fila.push(trabalho);
  }

  tamanho(): number {
    return this.fila.length;
  }

  /** Drena a fila e devolve os caminhos finais de cada download. */
  async executar(): Promise<string[]> {
    if (this.rodando) throw new Error("O DownloadManager já está em execução");
    this.rodando = true;
    const saidas: string[] = [];
    try {
      await fs.mkdir(this.config.downloadPath, { recursive: true });
      while (this.fila.length) {
        const trabalho = this.fila.shift()!;
        saidas.push(await this.processar(trabalho));
      }
    } finally {
      this.rodando = false;
    }
    return saidas;
  }

  private async processar(trabalho: TrabalhoDownload): Promise<string> {
    const url = trabalho.url ?? trabalho.item.downloadUrl ?? trabalho.item.streamUrl;
    if (!url) throw new Error(`Sem URL de download para "${trabalho.item.title}"`);

    const usaYtDlp = trabalho.item.type === "video" || /youtube\.com|youtu\.be/.test(url);
    if (usaYtDlp) return this.ytDlp(trabalho, url);
    return this.streamHttp(trabalho, url);
  }

  private async streamHttp(trabalho: TrabalhoDownload, url: string): Promise<string> {
    const nomeArquivo = trabalho.nomeArquivo ?? this.inferirNomeArquivo(trabalho, url);
    const destino = path.join(this.config.downloadPath, nomeArquivo);

    const resp = await axios.get<any>(url, { responseType: "stream" });
    const stream = resp.data as {
      on(ev: string, cb: (arg: any) => void): void;
      pipe(target: any): void;
    };
    const total = Number(resp.headers["content-length"]) || undefined;
    let recebido = 0;
    const inicio = Date.now();

    await new Promise<void>((resolve, reject) => {
      const escritor = createWriteStream(destino);
      stream.on("data", (chunk: Buffer) => {
        recebido += chunk.length;
        const decorridoS = Math.max((Date.now() - inicio) / 1000, 0.001);
        const velocidade = recebido / decorridoS;
        const etaSegundos =
          total && velocidade > 0 ? Math.max(0, (total - recebido) / velocidade) : undefined;
        this.aoProgredir?.({
          trabalho,
          bytesRecebidos: recebido,
          bytesTotais: total,
          percentual: total ? Math.round((recebido / total) * 100) : undefined,
          velocidade,
          etaSegundos,
        });
      });
      stream.pipe(escritor);
      stream.on("error", reject);
      escritor.on("finish", () => resolve());
      escritor.on("error", reject);
    });

    return destino;
  }

  private ytDlp(trabalho: TrabalhoDownload, url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const template = path.join(this.config.downloadPath, "%(title)s.%(ext)s");
      const filho = spawn("yt-dlp", ["-o", template, "--newline", url], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let ultimaLinha = "";
      filho.stdout.on("data", (b: Buffer) => {
        const texto = b.toString();
        ultimaLinha = texto.trim().split("\n").pop() ?? ultimaLinha;
        // Linhas do yt-dlp: "[download]  42.1% of ~12.34MiB at  1.23MiB/s ETA 00:05"
        const m = /([0-9.]+)%/.exec(ultimaLinha);
        if (m) {
          this.aoProgredir?.({
            trabalho,
            bytesRecebidos: 0,
            percentual: Math.round(parseFloat(m[1]!)),
          });
        }
      });

      filho.on("error", (err: Error) => {
        reject(new Error(`yt-dlp indisponível ou falhou: ${err.message}`));
      });
      filho.on("close", (codigo: number | null) => {
        if (codigo === 0) resolve(this.config.downloadPath);
        else reject(new Error(`yt-dlp encerrou com código ${codigo}`));
      });
    });
  }

  private inferirNomeArquivo(trabalho: TrabalhoDownload, url: string): string {
    const daUrl = path.basename(new URL(url).pathname) || "";
    if (daUrl && /\.[a-z0-9]{2,5}$/i.test(daUrl)) return daUrl;
    const tituloSeguro = trabalho.item.title.replace(/[^\w.\-]+/g, "_").slice(0, 120);
    const ext = this.extensaoPorTipo(trabalho.item.type);
    return `${tituloSeguro}${ext}`;
  }

  private extensaoPorTipo(tipo: MediaObject["type"]): string {
    switch (tipo) {
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
