import * as p from "@clack/prompts";
import chalk from "chalk";
import { RecipeManager } from "../core/RecipeManager.js";
import { SearchEngine } from "../core/SearchEngine.js";
import { DownloadManager } from "../core/DownloadManager.js";
import { carregarConfig } from "../core/ConfigStore.js";
import { FavoritesStore } from "../core/FavoritesStore.js";
import { HistoryStore } from "../core/HistoryStore.js";
import {
  logo,
  faixa,
  etiqueta,
  caixaErro,
  caixaInfo,
  caixaSucesso,
  renderLinhaMidia,
  renderDetalheMidia,
  barraProgresso,
  imprimirProgresso,
  finalizarLinhaProgresso,
  divisor,
} from "../utils/ui.js";
import { abrirExterno, reproduzirComMpv } from "../utils/termux.js";
import type { MediaObject } from "../types/index.js";

export interface OpcoesBuscaCmd {
  somente?: string[];
  json?: boolean;
}

export async function executarBusca(
  consulta: string | undefined,
  opts: OpcoesBuscaCmd = {},
): Promise<void> {
  console.log(logo());
  console.log("\n" + faixa("Busca"));

  const manager = new RecipeManager();
  await manager.carregar();
  if (manager.active().length === 0) {
    console.log(
      caixaErro(
        "Nenhuma receita ativa encontrada. Coloque uma Receita em src/recipes/.",
      ),
    );
    return;
  }

  let termo = consulta;
  if (!termo) {
    const resposta = await p.text({
      message: "O que você está procurando?",
      placeholder: "ex: daft punk, dom casmurro, one piece",
    });
    if (p.isCancel(resposta) || !resposta) return;
    termo = String(resposta);
  }

  const config = await carregarConfig();
  const engine = new SearchEngine(manager, config);
  const favoritos = new FavoritesStore();
  const historico = new HistoryStore();

  const spinner = p.spinner();
  spinner.start(`Consultando ${manager.active().length} receita(s)…`);
  const fatias = await engine.buscar(termo, { somente: opts.somente });
  spinner.stop("Resultados prontos.");

  if (opts.json) {
    console.log(JSON.stringify(fatias, null, 2));
    return;
  }

  const plano: MediaObject[] = [];
  for (const fatia of fatias) {
    if (fatia.erro) {
      console.log(caixaErro(`[${fatia.receita}] ${fatia.erro}`));
      continue;
    }
    if (fatia.itens.length === 0) {
      console.log(`${etiqueta(fatia.receita, "discreto")} ${chalk.gray("sem resultados")}`);
      continue;
    }
    console.log(
      "\n" +
        etiqueta(fatia.receita) +
        " " +
        chalk.white(`${fatia.itens.length} resultado(s)`),
    );
    for (const item of fatia.itens) {
      plano.push(item);
      console.log("  " + renderLinhaMidia(item, plano.length - 1));
    }
  }

  // Registra no histórico independentemente de ter havido seleção.
  await historico.registrar(termo, plano.length);

  if (plano.length === 0) {
    console.log("\n" + caixaInfo("Nenhum resultado em nenhuma das receitas."));
    return;
  }

  const escolha = await p.select({
    message: "Escolha um resultado:",
    options: plano.map((item, i) => ({
      value: i,
      label: `${String(i + 1).padStart(2, "0")} · ${item.title}`,
      hint: item.source,
    })),
  });
  if (p.isCancel(escolha)) return;

  const escolhido = plano[Number(escolha)]!;
  console.log("\n" + renderDetalheMidia(escolhido));
  console.log(divisor());

  const jaFavorito = await favoritos.contem(escolhido);
  const acao = await p.select({
    message: "O que deseja fazer?",
    options: [
      ...(escolhido.streamUrl ? [{ value: "reproduzir", label: "Reproduzir com mpv" }] : []),
      ...(escolhido.downloadUrl ? [{ value: "baixar", label: "Baixar" }] : []),
      ...(escolhido.thumbnail ? [{ value: "capa", label: "Abrir capa externamente" }] : []),
      {
        value: "favoritar",
        label: jaFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos",
      },
      { value: "sair", label: "Sair" },
    ],
  });
  if (p.isCancel(acao) || acao === "sair") return;

  if (acao === "reproduzir" && escolhido.streamUrl) {
    try {
      reproduzirComMpv(escolhido.streamUrl, { audioOnly: escolhido.type === "music" });
    } catch (err) {
      console.log(caixaErro((err as Error).message));
    }
  } else if (acao === "baixar" && escolhido.downloadUrl) {
    const dl = new DownloadManager(config, (prog) => {
      if (prog.percentual != null) {
        imprimirProgresso(
          barraProgresso(prog.percentual, 30, {
            recebido: prog.bytesRecebidos,
            total: prog.bytesTotais,
            rotulo: escolhido.title,
          }),
        );
      }
    });
    dl.enfileirar({ item: escolhido });
    try {
      const [destino] = await dl.executar();
      finalizarLinhaProgresso();
      console.log(caixaSucesso(`Salvo em ${destino}`));
    } catch (err) {
      finalizarLinhaProgresso();
      console.log(caixaErro((err as Error).message));
    }
  } else if (acao === "capa" && escolhido.thumbnail) {
    try {
      abrirExterno(escolhido.thumbnail);
      console.log(caixaSucesso("Capa enviada ao visualizador padrão do sistema."));
    } catch (err) {
      console.log(caixaErro((err as Error).message));
    }
  } else if (acao === "favoritar") {
    if (jaFavorito) {
      await favoritos.remover(escolhido);
      console.log(caixaInfo("Removido dos favoritos."));
    } else {
      await favoritos.adicionar(escolhido);
      console.log(caixaSucesso("Adicionado aos favoritos ★"));
    }
  }
}
