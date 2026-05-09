import chalk from "chalk";
import type { MediaObject } from "../types/index.js";

/**
 * Helpers de UI em estilo Neo-Brutalista — bordas grossas, blocos sólidos
 * de cor e rótulos de alto contraste. Todo o texto visível ao usuário é
 * em português. As funções aqui são puras (retornam strings) para que
 * possam ser compostas livremente nos comandos.
 */

// -----------------------------------------------------------------------------
// Paleta
// -----------------------------------------------------------------------------

const C = {
  borda: chalk.bgWhite.black,
  destaque: chalk.bgYellow.black,
  perigo: chalk.bgRed.white,
  sucesso: chalk.bgGreen.black,
  info: chalk.bgCyan.black,
  discreto: chalk.gray,
  titulo: chalk.bold.white,
  subtitulo: chalk.bold.yellow,
  url: chalk.cyan,
  musica: chalk.bgMagenta.black,
  livro: chalk.bgBlue.white,
  manga: chalk.bgRed.black,
  video: chalk.bgYellow.black,
  imagem: chalk.bgCyan.black,
  outro: chalk.bgWhite.black,
};

const BLOCO_CHEIO = "█";
const BLOCO_VAZIO = "░";

// -----------------------------------------------------------------------------
// Logo ASCII
// -----------------------------------------------------------------------------

/** Logo gigante do CrabAggregator — deve aparecer no início de cada comando. */
export function logo(): string {
  const linhas = [
    "  ██████  ██████   █████  ██████      ██████  ",
    " ██      ██   ██ ██   ██ ██   ██    ██        ",
    " ██      ██████  ███████ ██████     ██  ███   ",
    " ██      ██   ██ ██   ██ ██   ██    ██   ██   ",
    "  ██████ ██   ██ ██   ██ ██████      ██████   ",
  ];
  const cores = [chalk.red, chalk.red, chalk.yellow, chalk.yellow, chalk.redBright];
  const arte = linhas.map((l, i) => (cores[i] ?? chalk.red)(l)).join("\n");
  const slogan = chalk.bgYellow.black("           A G R E G A D O R   D E   M I D I A S            ");
  return `${arte}\n${slogan}`;
}

// -----------------------------------------------------------------------------
// Caixas e faixas
// -----------------------------------------------------------------------------

/** Faixa de título grosso (neo-brutalista) usado no topo de cada tela. */
export function faixa(titulo: string): string {
  const texto = `  ${titulo.toUpperCase()}  `;
  const linha = "━".repeat(Math.max(texto.length, 40));
  return [
    chalk.bold.white(linha),
    C.destaque(texto),
    chalk.bold.white(linha),
  ].join("\n");
}

/** Bloquinho colorido com rótulo — usado como "tag". */
export function etiqueta(
  texto: string,
  cor: "destaque" | "perigo" | "sucesso" | "info" | "discreto" = "destaque",
): string {
  const fn =
    cor === "perigo"
      ? C.perigo
      : cor === "sucesso"
        ? C.sucesso
        : cor === "info"
          ? C.info
          : cor === "discreto"
            ? C.discreto
            : C.destaque;
  return fn(` ${texto.toUpperCase()} `);
}

/** Divisor horizontal espesso. */
export function divisor(largura = 60): string {
  return chalk.white("━".repeat(largura));
}

/** Caixa com borda dupla ao redor de várias linhas de conteúdo. */
export function caixa(conteudo: string[], largura = 60): string {
  const topo = "┏" + "━".repeat(largura - 2) + "┓";
  const base = "┗" + "━".repeat(largura - 2) + "┛";
  const linhas = conteudo.map((l) => {
    const visivel = stripAnsi(l);
    const pad = Math.max(0, largura - 4 - visivel.length);
    return chalk.white("┃ ") + l + " ".repeat(pad) + chalk.white(" ┃");
  });
  return [chalk.white(topo), ...linhas, chalk.white(base)].join("\n");
}

/** Remove códigos ANSI para medir o tamanho real visível da string. */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\u001B\[[0-9;]*m/g, "");
}

// -----------------------------------------------------------------------------
// Caixas semânticas (sucesso, erro, info)
// -----------------------------------------------------------------------------

export function caixaSucesso(msg: string): string {
  return `${etiqueta("ok", "sucesso")} ${chalk.green(msg)}`;
}

export function caixaErro(msg: string): string {
  return `${etiqueta("erro", "perigo")} ${chalk.red(msg)}`;
}

export function caixaInfo(msg: string): string {
  return `${etiqueta("info", "info")} ${chalk.cyan(msg)}`;
}

export function caixaAviso(msg: string): string {
  return `${chalk.bgYellow.black(" ATENCAO ")} ${chalk.yellow(msg)}`;
}

// -----------------------------------------------------------------------------
// Cores por tipo de mídia
// -----------------------------------------------------------------------------

function corPorTipo(tipo: MediaObject["type"]): (s: string) => string {
  switch (tipo) {
    case "music":
      return C.musica;
    case "book":
      return C.livro;
    case "manga":
      return C.manga;
    case "video":
      return C.video;
    case "image":
      return C.imagem;
    default:
      return C.outro;
  }
}

function rotuloTipo(tipo: MediaObject["type"]): string {
  switch (tipo) {
    case "music":
      return "MUSICA";
    case "book":
      return "LIVRO";
    case "manga":
      return "MANGA";
    case "video":
      return "VIDEO";
    case "image":
      return "IMAGEM";
    default:
      return "OUTRO";
  }
}

// -----------------------------------------------------------------------------
// Render de MediaObject
// -----------------------------------------------------------------------------

/** Uma linha compacta de listagem (usada em buscas). */
export function renderLinhaMidia(item: MediaObject, indice: number): string {
  const n = chalk.bold.white(String(indice + 1).padStart(2, "0"));
  const tipo = corPorTipo(item.type)(` ${rotuloTipo(item.type)} `);
  const fonte = item.source ? chalk.gray(` · ${item.source}`) : "";
  const titulo = chalk.bold.white(item.title);
  const artista = item.artist ? chalk.yellow(` — ${item.artist}`) : "";
  return `${n} ${tipo}${fonte} ${titulo}${artista}`;
}

/** Ficha detalhada com todos os campos relevantes de uma mídia. */
export function renderDetalheMidia(item: MediaObject): string {
  const linhas: string[] = [];
  linhas.push(faixa(item.title));
  if (item.artist) linhas.push(`${etiqueta("autor", "info")} ${chalk.white(item.artist)}`);
  linhas.push(
    `${corPorTipo(item.type)(` ${rotuloTipo(item.type)} `)} ${chalk.white(rotuloTipo(item.type).toLowerCase())}`,
  );
  if (item.source) linhas.push(`${etiqueta("fonte", "discreto")} ${chalk.white(item.source)}`);
  if (item.thumbnail) linhas.push(`${etiqueta("capa", "info")} ${C.url(item.thumbnail)}`);
  if (item.streamUrl) linhas.push(`${etiqueta("stream", "destaque")} ${C.url(item.streamUrl)}`);
  if (item.downloadUrl) linhas.push(`${etiqueta("download", "sucesso")} ${C.url(item.downloadUrl)}`);
  if (item.description) {
    linhas.push(divisor());
    linhas.push(chalk.white(item.description));
  }
  return linhas.join("\n");
}

// -----------------------------------------------------------------------------
// Barra de progresso de download
// -----------------------------------------------------------------------------

/** Formata bytes em unidades humanas (KB, MB, GB). */
export function formatarBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const unidades = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let valor = bytes;
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024;
    i++;
  }
  return `${valor.toFixed(valor >= 100 ? 0 : valor >= 10 ? 1 : 2)} ${unidades[i]}`;
}

/** Gera uma barra de progresso com blocos (estilo brutal). */
export function barraProgresso(
  percentual: number,
  largura = 30,
  extras: { recebido?: number; total?: number; rotulo?: string } = {},
): string {
  const pct = Math.max(0, Math.min(100, Math.round(percentual)));
  const preenchidos = Math.round((pct / 100) * largura);
  const vazios = largura - preenchidos;
  const barra = chalk.green(BLOCO_CHEIO.repeat(preenchidos)) + chalk.gray(BLOCO_VAZIO.repeat(vazios));
  const pctStr = chalk.bold.white(String(pct).padStart(3, " ") + "%");

  let detalhe = "";
  if (extras.recebido != null) {
    const tot = extras.total ? ` / ${formatarBytes(extras.total)}` : "";
    detalhe = chalk.gray(`  ${formatarBytes(extras.recebido)}${tot}`);
  }
  const rotulo = extras.rotulo ? ` ${chalk.yellow(extras.rotulo)}` : "";
  return `${etiqueta("baixando", "sucesso")}${rotulo} [${barra}] ${pctStr}${detalhe}`;
}

/**
 * Escreve (em uma única linha, sobrescrevendo) a barra de progresso no stdout.
 * Ao terminar, chame `finalizarLinhaProgresso()` para imprimir a quebra.
 */
export function imprimirProgresso(linha: string): void {
  process.stdout.write(`\r\x1b[2K${linha}`);
}

export function finalizarLinhaProgresso(): void {
  process.stdout.write("\n");
}

// -----------------------------------------------------------------------------
// Tabela simples (colunas alinhadas)
// -----------------------------------------------------------------------------

export interface ColunaTabela {
  titulo: string;
  largura: number;
  alinhar?: "esq" | "dir";
}

export function tabela(colunas: ColunaTabela[], linhas: string[][]): string {
  const larguraTotal = colunas.reduce((a, c) => a + c.largura + 3, 1);
  const topo = "┏" + colunas.map((c) => "━".repeat(c.largura + 2)).join("┳") + "┓";
  const sep = "┣" + colunas.map((c) => "━".repeat(c.largura + 2)).join("╋") + "┫";
  const base = "┗" + colunas.map((c) => "━".repeat(c.largura + 2)).join("┻") + "┛";

  const header =
    "┃ " +
    colunas
      .map((c) => chalk.bold.yellow(ajustar(c.titulo.toUpperCase(), c.largura, c.alinhar ?? "esq")))
      .join(" ┃ ") +
    " ┃";

  const corpo = linhas
    .map((row) =>
      "┃ " +
      colunas
        .map((c, i) => ajustar(stripAnsi(row[i] ?? ""), c.largura, c.alinhar ?? "esq"))
        .map((txt, i) => (stripAnsi(txt) === txt ? txt : row[i]))
        .join(" ┃ ") +
      " ┃",
    )
    .join("\n");

  void larguraTotal; // apenas para o compilador não reclamar se não usarmos
  return [chalk.white(topo), header, chalk.white(sep), corpo, chalk.white(base)].join("\n");
}

function ajustar(texto: string, largura: number, alinhar: "esq" | "dir"): string {
  if (texto.length > largura) return texto.slice(0, largura - 1) + "…";
  const falta = largura - texto.length;
  return alinhar === "dir" ? " ".repeat(falta) + texto : texto + " ".repeat(falta);
}

// -----------------------------------------------------------------------------
// Exporta coisas que alguns comandos podem querer
// -----------------------------------------------------------------------------

export const cores = C;
