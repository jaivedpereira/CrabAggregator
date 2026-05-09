import * as p from "@clack/prompts";
import chalk from "chalk";
import { carregarConfig, salvarConfig, caminhoConfig } from "../core/ConfigStore.js";
import { RecipeManager } from "../core/RecipeManager.js";
import { logo, faixa, etiqueta, caixaSucesso, caixaInfo } from "../utils/ui.js";

/**
 * Editor interativo de configuração. Permite trocar o caminho de
 * downloads, gerenciar chaves de API e ligar/desligar receitas. Tudo
 * persistido em ~/.crabrc.json.
 */
export async function executarConfig(): Promise<void> {
  console.log(logo());
  console.log("\n" + faixa("Configuração"));
  console.log(`${etiqueta("arquivo", "discreto")} ${chalk.cyan(caminhoConfig())}\n`);

  const cfg = await carregarConfig();

  const acao = await p.select({
    message: "O que você quer configurar?",
    options: [
      { value: "downloadPath", label: `Pasta de downloads (atual: ${cfg.downloadPath})` },
      { value: "apiKey", label: "Adicionar / atualizar uma chave de API" },
      { value: "receitas", label: "Ligar / desligar receitas" },
      { value: "mostrar", label: "Mostrar configuração completa" },
      { value: "sair", label: "Sair" },
    ],
  });
  if (p.isCancel(acao) || acao === "sair") return;

  if (acao === "downloadPath") {
    const nova = await p.text({
      message: "Nova pasta de downloads:",
      initialValue: cfg.downloadPath,
    });
    if (p.isCancel(nova)) return;
    cfg.downloadPath = String(nova);
    await salvarConfig(cfg);
    console.log(caixaSucesso(`Pasta de downloads definida como ${cfg.downloadPath}`));
    return;
  }

  if (acao === "apiKey") {
    const nome = await p.text({
      message: "Nome da chave (ex: youtube, tmdb):",
    });
    if (p.isCancel(nome) || !nome) return;
    const valor = await p.password({ message: `Valor para "${String(nome)}":` });
    if (p.isCancel(valor)) return;
    cfg.apiKeys[String(nome)] = String(valor);
    await salvarConfig(cfg);
    console.log(caixaSucesso(`Chave apiKeys.${String(nome)} salva.`));
    return;
  }

  if (acao === "receitas") {
    const manager = new RecipeManager();
    await manager.carregar();
    const todas = manager.all();
    if (todas.length === 0) {
      console.log(caixaInfo("Nenhuma receita encontrada."));
      return;
    }
    const desabilitadas = new Set(cfg.receitasDesabilitadas ?? []);
    const marcadas = await p.multiselect({
      message: "Marque as receitas que devem ficar ATIVAS:",
      initialValues: todas.filter((r) => !desabilitadas.has(r.name)).map((r) => r.name),
      options: todas.map((r) => ({
        value: r.name,
        label: `${r.label ?? r.name} (${r.type})`,
      })),
      required: false,
    });
    if (p.isCancel(marcadas)) return;
    const ativas = new Set(marcadas as string[]);
    cfg.receitasDesabilitadas = todas
      .map((r) => r.name)
      .filter((n) => !ativas.has(n));
    await salvarConfig(cfg);
    console.log(
      caixaSucesso(
        `${ativas.size} receita(s) ativa(s), ${cfg.receitasDesabilitadas.length} desligada(s).`,
      ),
    );
    return;
  }

  if (acao === "mostrar") {
    console.log(chalk.white(JSON.stringify(cfg, null, 2)));
  }
}
