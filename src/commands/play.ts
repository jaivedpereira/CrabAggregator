import { reproduzirComMpv } from "../utils/termux.js";
import { logo, faixa, etiqueta, caixaErro, caixaSucesso } from "../utils/ui.js";
import chalk from "chalk";

/** `crab tocar <url>` — transmite uma URL usando o mpv. */
export async function executarPlay(
  url: string,
  opts: { background?: boolean; audioOnly?: boolean } = {},
): Promise<void> {
  console.log(logo());
  console.log("\n" + faixa("Reproduzir"));
  console.log(`${etiqueta("url", "discreto")} ${chalk.cyan(url)}`);
  try {
    const filho = reproduzirComMpv(url, opts);
    if (opts.background) {
      console.log(
        caixaSucesso(`mpv iniciado em segundo plano (pid ${filho.pid}).`),
      );
    }
  } catch (err) {
    console.log(caixaErro((err as Error).message));
    process.exitCode = 1;
  }
}
