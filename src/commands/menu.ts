import * as p from "@clack/prompts";
import chalk from "chalk";
import { logo, faixa, caixaInfo, divisor } from "../utils/ui.js";
import { executarBusca } from "./search.js";
import { executarFavoritos } from "./favoritos.js";
import { executarHistorico } from "./historico.js";
import { executarConfig } from "./config.js";
import { executarReceitas } from "./recipes.js";

/**
 * `crab` (sem argumentos) ou `crab menu` abre um painel interativo.
 * É o modo de uso padrão para quem não quer decorar flags.
 */
export async function executarMenu(): Promise<void> {
  console.log(logo());
  console.log(
    "\n" +
      chalk.gray(
        "Bem-vindo ao CrabAggregator — seu terminal de mídias agregado.",
      ),
  );
  console.log(divisor());

  while (true) {
    const opcao = await p.select({
      message: "Menu principal",
      options: [
        { value: "buscar", label: "Buscar mídias" , hint: "livros, música, etc." },
        { value: "favoritos", label: "Favoritos", hint: "gerenciar salvos" },
        { value: "historico", label: "Histórico de buscas" },
        { value: "receitas", label: "Ver receitas instaladas" },
        { value: "config", label: "Configurações" },
        { value: "sair", label: "Sair" },
      ],
    });
    if (p.isCancel(opcao) || opcao === "sair") {
      console.log("\n" + caixaInfo("Até logo! 🦀"));
      return;
    }

    console.log("\n" + faixa(rotulo(opcao as string)));
    switch (opcao) {
      case "buscar":
        await executarBusca(undefined);
        break;
      case "favoritos":
        await executarFavoritos();
        break;
      case "historico":
        await executarHistorico();
        break;
      case "receitas":
        await executarReceitas();
        break;
      case "config":
        await executarConfig();
        break;
    }
    console.log(divisor());
  }
}

function rotulo(chave: string): string {
  const mapa: Record<string, string> = {
    buscar: "Busca",
    favoritos: "Favoritos",
    historico: "Histórico",
    receitas: "Receitas",
    config: "Configuração",
  };
  return mapa[chave] ?? chave;
}
