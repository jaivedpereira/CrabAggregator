import chalk from "chalk";
import { RecipeManager } from "../core/RecipeManager.js";
import { carregarConfig } from "../core/ConfigStore.js";
import { logo, faixa, etiqueta, tabela } from "../utils/ui.js";

/** `crab receitas` — lista todas as receitas descobertas e seu status. */
export async function executarReceitas(): Promise<void> {
  console.log(logo());
  console.log("\n" + faixa("Receitas"));

  const manager = new RecipeManager();
  await manager.carregar();
  const todas = manager.all();
  if (todas.length === 0) {
    console.log(
      chalk.yellow("Nenhuma receita encontrada em src/recipes (ou dist/recipes)."),
    );
    return;
  }

  const cfg = await carregarConfig();
  const desabilitadas = new Set(cfg.receitasDesabilitadas ?? []);

  const linhas = todas.map((r) => {
    const ativa = r.enabled !== false && !desabilitadas.has(r.name);
    const status = ativa ? etiqueta("ativa", "sucesso") : etiqueta("off", "perigo");
    return [status, r.name, r.type, r.label ?? "—"];
  });

  console.log(
    tabela(
      [
        { titulo: "Status", largura: 8 },
        { titulo: "Nome", largura: 18 },
        { titulo: "Tipo", largura: 8 },
        { titulo: "Rótulo", largura: 34 },
      ],
      linhas,
    ),
  );
  console.log(
    "\n" +
      chalk.gray(
        `Total: ${todas.length} · ligue/desligue com "crab config" → Ligar / desligar receitas`,
      ),
  );
}
