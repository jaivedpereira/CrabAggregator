# CrabAggregator 🦀

> **Agregador universal de mídias no terminal.**
> Busque, escute, visualize e baixe **música, livros, mangás e vídeos** a partir de várias APIs — todas orquestradas por um núcleo agnóstico e extensível por **Receitas**. Feito em **Node.js + TypeScript**, com carinho pelo **Termux**.

```
  ██████  ██████   █████  ██████      ██████
 ██      ██   ██ ██   ██ ██   ██    ██
 ██      ██████  ███████ ██████     ██  ███
 ██      ██   ██ ██   ██ ██   ██    ██   ██
  ██████ ██   ██ ██   ██ ██████      ██████
           A G R E G A D O R   D E   M I D I A S
```

---

## ✨ O que ele faz

- 🔎 **Busca unificada** em múltiplas APIs com um único comando.
- 🎧 **Reprodução** direta via `mpv` (áudio em background ou vídeo).
- 📥 **Downloads** com fila, barra de progresso brutal e suporte a `yt-dlp`.
- ⭐ **Favoritos** e 🕓 **histórico** persistentes em `~/.crabrc.json`.
- 🎨 **Interface Neo-Brutalista** com `@clack/prompts` + `chalk`.
- 🔌 **Receitas plugáveis**: adicione uma nova API criando um único arquivo `.ts`.
- 📱 Projetado para funcionar lindamente no **Termux** (Android).

---

## 🚀 Passo a passo — Instalação

### 1. Pré-requisitos

| Plataforma | O que instalar |
|---|---|
| **Linux / macOS** | [Node.js ≥ 18.17](https://nodejs.org), `git`. Opcional: `mpv`, `yt-dlp`. |
| **Windows** | Node.js ≥ 18.17. Recomendado usar **WSL2** para melhor compatibilidade com `mpv`/`yt-dlp`. |
| **Android (Termux)** | Aplicativo [Termux](https://termux.dev/) (da F-Droid, a versão da Play Store está desatualizada). |

### 2. No Linux / macOS / WSL

```bash
# 1. Clone o repositório
git clone https://github.com/jaivedpereira/CrabAggregator.git
cd CrabAggregator

# 2. Instale as dependências
npm install

# 3. Compile
npm run build

# 4. (Opcional, recomendado) Instale globalmente para ter o comando `crab`
npm link
```

Pronto! Agora você pode rodar:

```bash
crab              # abre o menu interativo
crab buscar "dune frank herbert"
crab favoritos
```

Se preferir **não** instalar globalmente, use o modo desenvolvimento (usa `tsx`, sem precisar compilar):

```bash
npm run dev -- buscar "dune"
```

Ou execute o build diretamente:

```bash
node dist/index.js buscar "dune"
```

### 3. No Termux (Android)

Abra o Termux e cole:

```bash
# Atualize os pacotes
pkg update && pkg upgrade -y

# Instale Node, Git, mpv e yt-dlp
pkg install -y nodejs git mpv yt-dlp

# (Opcional, mas recomendado) API do Termux para abrir arquivos externos
pkg install -y termux-api

# Permite acesso ao cartão SD (onde vão cair os downloads)
termux-setup-storage

# Clone e monte o projeto
git clone https://github.com/jaivedpereira/CrabAggregator.git
cd CrabAggregator
npm install
npm run build
npm link
```

Depois disso, `crab` funciona em qualquer pasta do Termux. A pasta de downloads padrão é `/sdcard/Download/CrabAggregator` (você pode alterar em `crab config`).

### 4. Primeira execução

```bash
crab
```

Você vê o logo, o menu principal e pode já sair buscando. Recomendado:

1. Rode `crab config` e ajuste a **pasta de downloads**.
2. Rode `crab receitas` para ver o que está ativo.
3. Rode `crab buscar "dune"` (ou só `crab` → **Buscar mídias**).

---

## 🧭 Guia de comandos

| Comando | Atalho | O que faz |
|---|---|---|
| `crab` ou `crab menu` | — | Abre o **menu interativo** (modo padrão) |
| `crab buscar <termo>` | `crab search` | Busca em todas as receitas ativas |
| `crab buscar --somente <r1> <r2>` | — | Limita a busca a receitas específicas |
| `crab buscar --json <termo>` | — | Imprime JSON bruto (ótimo para `jq`) |
| `crab tocar <url>` | `crab play` | Transmite URL com `mpv` |
| `crab tocar -b <url>` | — | `mpv` em segundo plano |
| `crab tocar -a <url>` | — | Somente áudio (sem vídeo) |
| `crab baixar <url>` | `crab download` | Baixa uma URL direta |
| `crab baixar -t music <url>` | — | Força o tipo (altera extensão) |
| `crab baixar -n "Nome" <url>` | — | Nome de saída customizado |
| `crab favoritos` | `crab favorites` | Lista/gerencia mídias favoritadas |
| `crab historico` | `crab history` | Mostra buscas recentes e repete |
| `crab receitas` | `crab recipes` | Tabela com status de cada receita |
| `crab config` | `crab configurar` | Editor interativo de `~/.crabrc.json` |

---

## 🧩 Receitas (plugins)

O núcleo do CrabAggregator não sabe nada sobre APIs específicas. **Tudo** é feito através de uma Receita — um arquivo TypeScript em `src/recipes/` que exporta por default um objeto seguindo o contrato `Recipe`.

### Receitas incluídas

| Nome | Tipo | API | Precisa de chave? |
|---|---|---|---|
| `open-library` | 📚 livros | [openlibrary.org](https://openlibrary.org) | Não |
| `itunes` | 🎵 música | [iTunes Search](https://performance-partners.apple.com/search-api) | Não |
| `pokeapi` | 🖼️ imagem | [pokeapi.co](https://pokeapi.co) | Não (demo, desligada por padrão) |

Ligue/desligue receitas em `crab config` → **Ligar / desligar receitas**.

### Contrato `MediaObject`

Toda Receita devolve objetos nesse formato. O núcleo só sabe mexer nisso — nada de específico de API vaza:

```ts
interface MediaObject {
  id: string;               // id estável dentro da receita
  source?: string;          // carimbado pelo SearchEngine
  title: string;            // título humano
  artist?: string;          // autor / artista / mangaká
  type: "music" | "book" | "manga" | "video" | "image" | "other";
  thumbnail?: string;       // URL da capa
  streamUrl?: string;       // tocável no mpv
  downloadUrl?: string;     // baixável pelo DownloadManager
  description?: string;     // sinopse ou detalhes
  meta?: Record<string, unknown>; // campos específicos da fonte
}
```

### Escrevendo uma Receita nova

Crie `src/recipes/minhaFonte.ts`:

```ts
import axios from "axios";
import type { Recipe, MediaObject } from "../types/index.js";

const receita: Recipe = {
  name: "minha-fonte",
  label: "Minha Fonte de Música",
  type: "music",
  enabled: true,

  async search(termo, ctx) {
    const { data } = await axios.get("https://api.exemplo.com/search", {
      params: { q: termo },
      headers: {
        Authorization: `Bearer ${ctx.config.apiKeys?.minhaFonte ?? ""}`,
      },
    });
    return (data.items ?? []).map((x: any): MediaObject => ({
      id: x.id,
      title: x.name,
      artist: x.artist,
      type: "music",
      thumbnail: x.cover,
      streamUrl: x.stream_url,
      downloadUrl: x.mp3_url,
    }));
  },
};

export default receita;
```

Salve o arquivo, rode `npm run build` (ou `npm run dev`) e pronto — a receita é descoberta automaticamente pelo `RecipeManager`.

Opcionalmente, implemente:

- `resolveDownload(item, ctx)` — resolve preguiçosamente a URL de download.
- `resolveStream(item, ctx)` — resolve preguiçosamente a URL de streaming.

---

## 🏗️ Arquitetura

```
src/
├── index.ts              # CLI (commander) em PT-BR, roteia os comandos
├── types/                # Contratos MediaObject + Recipe
├── core/
│   ├── RecipeManager.ts      # Descobre plugins em /recipes
│   ├── SearchEngine.ts       # Fan-out paralelo + timeout por receita
│   ├── ConfigStore.ts        # Persistência em ~/.crabrc.json
│   ├── FavoritesStore.ts     # Favoritos
│   ├── HistoryStore.ts       # Histórico de buscas
│   └── DownloadManager.ts    # Fila FIFO, axios stream + yt-dlp
├── utils/
│   ├── ui.ts             # Logo, faixas, barras de progresso, tabelas
│   └── termux.ts         # Wrappers: mpv, termux-open, xdg-open
├── commands/             # buscar, tocar, baixar, favoritos, historico, config, receitas, menu
└── recipes/
    ├── openLibrary.ts    # 📚 livros
    ├── itunes.ts         # 🎵 música
    └── pokeapi.ts        # 🖼️ demo (desligada por padrão)
```

### Como funciona uma busca

1. `crab buscar <termo>` invoca o `SearchEngine`.
2. Ele pega todas as receitas ativas e dispara `recipe.search(termo, ctx)` **em paralelo**, com timeout de 15s cada.
3. Falhas de uma receita **não** afetam as outras — ficam como `erro` na fatia dela.
4. O núcleo normaliza o resultado em `MediaObject[]`, carimba `source`, renderiza e deixa o usuário escolher o que fazer.

### O arquivo `~/.crabrc.json`

```json
{
  "downloadPath": "/sdcard/Download/CrabAggregator",
  "recipes": {},
  "apiKeys": {},
  "favoritos": [ /* MediaObjects */ ],
  "historico": [ { "termo": "dune", "resultados": 10, "quando": "..." } ],
  "receitasDesabilitadas": ["pokeapi"]
}
```

Você pode editar à mão ou, melhor, usar `crab config`.

---

## 🛠️ Scripts npm

| Script | Faz |
|---|---|
| `npm run dev` | Roda direto do TypeScript (usa `tsx`), sem compilar |
| `npm run build` | Compila para `dist/` |
| `npm run typecheck` | Só verifica tipos, sem emitir |
| `npm start` | Executa o `dist/index.js` |
| `npm run clean` | Remove a pasta `dist/` |

---

## 🐞 Resolução de problemas

- **`mpv: command not found`** — instale (`pkg install mpv` no Termux; `apt install mpv` no Debian/Ubuntu; `brew install mpv` no macOS).
- **`yt-dlp: ...`** — instale `yt-dlp` se for baixar vídeos do YouTube e similares.
- **Downloads do Archive.org falhando** — alguns livros só têm formatos não-PDF. A receita Open Library tenta resolver pela rota `editions.json`; se mesmo assim falhar, use a URL direta em `crab baixar <url>`.
- **Termux não acessa `/sdcard`** — rode `termux-setup-storage` e aceite a permissão.

---

## 📜 Licença

MIT
