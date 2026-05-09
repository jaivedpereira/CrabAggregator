#!/usr/bin/env node
import { Command } from "commander";
import { executarBusca } from "./commands/search.js";
import { executarConfig } from "./commands/config.js";
import { executarDownload } from "./commands/download.js";
import { executarPlay } from "./commands/play.js";
import { executarReceitas } from "./commands/recipes.js";
import { executarFavoritos } from "./commands/favoritos.js";
import { executarHistorico } from "./commands/historico.js";
import { executarMenu } from "./commands/menu.js";
import type { MediaType } from "./types/index.js";

const programa = new Command();

programa
  .name("crab")
  .description(
    "CrabAggregator — um agregador de mídias modular para o terminal. Busca, reproduz e baixa música, livros, mangás e vídeos.",
  )
  .version("0.2.0");

programa
  .command("buscar [termo...]")
  .alias("search")
  .description("Busca em todas as receitas ativas")
  .option("--somente <nomes...>", "Restringe a busca às receitas informadas")
  .option("--json", "Imprime o JSON bruto em vez da interface interativa")
  .action(
    async (termo: string[], opts: { somente?: string[]; json?: boolean }) => {
      await executarBusca(termo?.join(" ") || undefined, opts);
    },
  );

programa
  .command("tocar <url>")
  .alias("play")
  .description("Reproduz uma URL no mpv")
  .option("-b, --background", "Deixa o mpv rodando em segundo plano")
  .option("-a, --audio-only", "Desliga o vídeo (apenas áudio)")
  .action(async (url: string, opts: { background?: boolean; audioOnly?: boolean }) => {
    await executarPlay(url, opts);
  });

programa
  .command("baixar <url>")
  .alias("download")
  .description("Enfileira uma URL direta para download")
  .option("-t, --tipo <tipo>", "Tipo de mídia (music|book|manga|video|image|other)", "other")
  .option("-n, --nome <nome>", "Sobrescreve o nome do arquivo final")
  .action(async (url: string, opts: { tipo?: string; nome?: string }) => {
    await executarDownload(url, {
      tipo: opts.tipo as MediaType | undefined,
      nome: opts.nome,
    });
  });

programa
  .command("config")
  .alias("configurar")
  .description("Edita interativamente o arquivo ~/.crabrc.json")
  .action(async () => {
    await executarConfig();
  });

programa
  .command("receitas")
  .alias("recipes")
  .description("Lista todas as receitas descobertas")
  .action(async () => {
    await executarReceitas();
  });

programa
  .command("favoritos")
  .alias("favorites")
  .description("Lista e gerencia suas mídias favoritas")
  .action(async () => {
    await executarFavoritos();
  });

programa
  .command("historico")
  .alias("history")
  .description("Mostra as buscas recentes e permite repetir")
  .action(async () => {
    await executarHistorico();
  });

programa
  .command("menu", { isDefault: true })
  .description("Abre o painel interativo (padrão quando nenhum comando é informado)")
  .action(async () => {
    await executarMenu();
  });

programa.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
