import * as p from "@clack/prompts";
import chalk from "chalk";
import { HistoryStore } from "../core/HistoryStore.js";
import { executarBusca } from "./search.js";
import { logo, faixa, caixaInfo, caixaSucesso, tabela } from "../utils/ui.js";

/** `crab historico` — mostra buscas recentes e permite repeti-las. */
export async function executarHistorico(): Promise<void> {
  console.log(logo());
  console.log("\n" + faixa("Histórico"));

  const loja = new HistoryStore();
  const lista = await loja.listar();

  if (lista.length === 0) {
    console.log(
      caixaInfo(
        "Nenhuma busca registrada ainda. Rode \"crab buscar <termo>\" e volte aqui.",
      ),
    );
    return;
  }

  console.log(
    tabela(
      [
        { titulo: "#", largura: 4, alinhar: "dir" },
        { titulo: "Termo", largura: 30 },
        { titulo: "Resultados", largura: 11, alinhar: "dir" },
        { titulo: "Quando", largura: 20 },
      ],
      lista.map((h, i) => [
        String(i + 1).padStart(2, "0"),
        h.termo,
        String(h.resultados),
        formatarData(h.quando),
      ]),
    ),
  );

  const acao = await p.select({
    message: "Quer repetir alguma busca?",
    options: [
      { value: "repetir", label: "Repetir uma busca" },
      { value: "limpar", label: "Limpar histórico" },
      { value: "sair", label: "Sair" },
    ],
  });
  if (p.isCancel(acao) || acao === "sair") return;

  if (acao === "limpar") {
    const confirma = await p.confirm({ message: "Apagar todo o histórico?" });
    if (p.isCancel(confirma) || !confirma) return;
    await loja.limpar();
    console.log(caixaSucesso("Histórico limpo."));
    return;
  }

  const escolha = await p.select({
    message: "Escolha um termo:",
    options: lista.map((h, i) => ({
      value: i,
      label: `${String(i + 1).padStart(2, "0")} · ${h.termo}`,
      hint: `${h.resultados} resultado(s)`,
    })),
  });
  if (p.isCancel(escolha)) return;
  await executarBusca(lista[Number(escolha)]!.termo);
}

function formatarData(iso: string): string {
  try {
    const d = new Date(iso);
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${d.getFullYear()} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

void chalk; // evita warning se for removido acidentalmente
