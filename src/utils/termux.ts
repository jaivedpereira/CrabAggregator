import { spawn, spawnSync } from "node:child_process";

/**
 * Helpers do Termux — wrappers finos sobre binários externos. Todas as
 * funções degradam graciosamente quando a ferramenta não está instalada
 * (comum fora do Termux).
 */

function temBinario(nome: string): boolean {
  const r = spawnSync("which", [nome], { stdio: "ignore" });
  return r.status === 0;
}

/**
 * Reproduz uma URL no mpv. Devolve o processo filho para que o chamador
 * possa lidar com sinais (Ctrl+C etc.). Desanexa-se para tocar em
 * segundo plano quando `background=true`.
 */
export function reproduzirComMpv(
  url: string,
  opts: { background?: boolean; audioOnly?: boolean } = {},
) {
  if (!temBinario("mpv")) {
    throw new Error("mpv não está instalado. No Termux use: pkg install mpv");
  }
  const args: string[] = [];
  if (opts.audioOnly) args.push("--no-video");
  args.push(url);

  const filho = spawn("mpv", args, {
    stdio: opts.background ? "ignore" : "inherit",
    detached: !!opts.background,
  });
  if (opts.background) filho.unref();
  return filho;
}

/**
 * Abre uma URL/arquivo no aplicativo padrão do sistema.
 * Prioriza `termux-open` (Termux), caindo para `xdg-open` (Linux) ou
 * `open` (macOS).
 */
export function abrirExterno(alvo: string): void {
  const candidatos = ["termux-open", "xdg-open", "open"];
  for (const bin of candidatos) {
    if (temBinario(bin)) {
      spawn(bin, [alvo], { stdio: "ignore", detached: true }).unref();
      return;
    }
  }
  throw new Error("Nenhum abridor encontrado (tentei termux-open, xdg-open, open).");
}

/** Indica se estamos rodando dentro do Termux. */
export function ehTermux(): boolean {
  return !!process.env.PREFIX?.includes("com.termux") || temBinario("termux-open");
}

// Aliases em inglês para compatibilidade com qualquer código legado.
export const playWithMpv = reproduzirComMpv;
export const openExternally = abrirExterno;
export const isTermux = ehTermux;

export { temBinario };
