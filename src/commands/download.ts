import { DownloadManager } from "../core/DownloadManager.js";
import { carregarConfig } from "../core/ConfigStore.js";
import {
  logo,
  faixa,
  etiqueta,
  caixaErro,
  caixaSucesso,
  barraProgresso,
  imprimirProgresso,
  finalizarLinhaProgresso,
} from "../utils/ui.js";
import type { MediaObject } from "../types/index.js";
import chalk from "chalk";

/** `crab baixar <url>` — enfileira uma URL direta para download. */
export async function executarDownload(
  url: string,
  opts: { tipo?: MediaObject["type"]; nome?: string } = {},
): Promise<void> {
  console.log(logo());
  console.log("\n" + faixa("Download"));
  console.log(`${etiqueta("url", "discreto")} ${chalk.cyan(url)}`);

  const config = await carregarConfig();
  const dl = new DownloadManager(config, (prog) => {
    if (prog.percentual != null) {
      imprimirProgresso(
        barraProgresso(prog.percentual, 30, {
          recebido: prog.bytesRecebidos,
          total: prog.bytesTotais,
          rotulo: opts.nome ?? "download",
        }),
      );
    }
  });

  const item: MediaObject = {
    id: opts.nome ?? url,
    title: opts.nome ?? "download",
    type: opts.tipo ?? "other",
    downloadUrl: url,
  };
  dl.enfileirar({ item });

  try {
    const [destino] = await dl.executar();
    finalizarLinhaProgresso();
    console.log(caixaSucesso(`Salvo em ${destino ?? config.downloadPath}`));
  } catch (err) {
    finalizarLinhaProgresso();
    console.log(caixaErro((err as Error).message));
    process.exitCode = 1;
  }
}
