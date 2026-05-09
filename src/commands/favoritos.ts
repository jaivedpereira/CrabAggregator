import * as p from "@clack/prompts";
import chalk from "chalk";
import { FavoritesStore } from "../core/FavoritesStore.js";
import { DownloadManager } from "../core/DownloadManager.js";
import { carregarConfig } from "../core/ConfigStore.js";
import {
  logo,
  faixa,
  etiqueta,
  caixaInfo,
  caixaErro,
  caixaSucesso,
  renderLinhaMidia,
  renderDetalheMidia,
  barraProgresso,
  imprimirProgresso,
  finalizarLinhaProgresso,
  divisor,
} from "../utils/ui.js";
import { abrirExterno, reproduzirComMpv } from "../utils/termux.js";

/** `crab favoritos` — lista, inspeciona e gerencia mídias favoritas. */
export async function executarFavoritos(): Promise<void> {
  console.log(logo());
  console.log("\n" + faixa("Favoritos"));

  const loja = new FavoritesStore();
  const lista = await loja.listar();

  if (lista.length === 0) {
    console.log(
      caixaInfo(
        "Você ainda não favoritou nada. Use \"crab buscar\" e escolha \"Adicionar aos favoritos\".",
      ),
    );
    return;
  }

  console.log(`${etiqueta(`${lista.length} item(ns)`)}`);
  lista.forEach((item, i) => console.log("  " + renderLinhaMidia(item, i)));

  const escolha = await p.select({
    message: "Escolha um favorito:",
    options: [
      ...lista.map((item, i) => ({
        value: i,
        label: `${String(i + 1).padStart(2, "0")} · ${item.title}`,
        hint: item.source,
      })),
      { value: -2 as const, label: "— Limpar todos os favoritos —" },
      { value: -1 as const, label: "Sair" },
    ],
  });
  if (p.isCancel(escolha) || escolha === -1) return;

  if (escolha === -2) {
    const confirma = await p.confirm({ message: "Tem certeza que quer apagar todos?" });
    if (p.isCancel(confirma) || !confirma) return;
    await loja.limpar();
    console.log(caixaSucesso("Favoritos limpos."));
    return;
  }

  const item = lista[Number(escolha)]!;
  const config = await carregarConfig();

  console.log("\n" + renderDetalheMidia(item));
  console.log(divisor());

  const acao = await p.select({
    message: "O que deseja fazer?",
    options: [
      ...(item.streamUrl ? [{ value: "reproduzir", label: "Reproduzir com mpv" }] : []),
      ...(item.downloadUrl ? [{ value: "baixar", label: "Baixar" }] : []),
      ...(item.thumbnail ? [{ value: "capa", label: "Abrir capa externamente" }] : []),
      { value: "remover", label: "Remover dos favoritos" },
      { value: "sair", label: "Sair" },
    ],
  });
  if (p.isCancel(acao) || acao === "sair") return;

  if (acao === "reproduzir" && item.streamUrl) {
    try {
      reproduzirComMpv(item.streamUrl, { audioOnly: item.type === "music" });
    } catch (err) {
      console.log(caixaErro((err as Error).message));
    }
  } else if (acao === "baixar" && item.downloadUrl) {
    const dl = new DownloadManager(config, (prog) => {
      if (prog.percentual != null) {
        imprimirProgresso(
          barraProgresso(prog.percentual, 30, {
            recebido: prog.bytesRecebidos,
            total: prog.bytesTotais,
            rotulo: item.title,
          }),
        );
      }
    });
    dl.enfileirar({ item });
    try {
      const [destino] = await dl.executar();
      finalizarLinhaProgresso();
      console.log(caixaSucesso(`Salvo em ${destino}`));
    } catch (err) {
      finalizarLinhaProgresso();
      console.log(caixaErro((err as Error).message));
    }
  } else if (acao === "capa" && item.thumbnail) {
    try {
      abrirExterno(item.thumbnail);
      console.log(caixaSucesso("Capa enviada ao visualizador padrão do sistema."));
    } catch (err) {
      console.log(caixaErro((err as Error).message));
    }
  } else if (acao === "remover") {
    await loja.remover(item);
    console.log(caixaInfo("Removido dos favoritos."));
  }

  // Pequena cortesia: indicador de que ainda existem outros favoritos.
  const quantos = (await loja.listar()).length;
  console.log(chalk.gray(`\nFavoritos restantes: ${quantos}`));
}
