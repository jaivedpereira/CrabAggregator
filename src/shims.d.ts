// Shims mínimos para que o `tsc --noEmit` funcione em ambientes onde o
// registro npm não está acessível. Quando o projeto é instalado
// normalmente via `npm install`, as declarações reais de tipos têm
// prioridade e estes shims ficam inertes.

// ---- Módulos built-in do Node -------------------------------------------

declare module "node:fs" {
  export const promises: {
    readFile(path: string, encoding: string): Promise<string>;
    writeFile(path: string, data: string, encoding: string): Promise<void>;
    readdir(path: string): Promise<string[]>;
    mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>;
  };
  export function createWriteStream(path: string): any;
}

declare module "node:os" {
  export function homedir(): string;
}

declare module "node:path" {
  const p: {
    join(...segs: string[]): string;
    resolve(...segs: string[]): string;
    dirname(p: string): string;
    basename(p: string): string;
  };
  export default p;
  export const join: typeof p.join;
  export const resolve: typeof p.resolve;
  export const dirname: typeof p.dirname;
  export const basename: typeof p.basename;
}

declare module "node:url" {
  export function fileURLToPath(url: string): string;
  export function pathToFileURL(p: string): URL;
}

declare module "node:child_process" {
  export function spawn(cmd: string, args?: string[], opts?: any): any;
  export function spawnSync(cmd: string, args?: string[], opts?: any): { status: number | null };
}

// ---- Globais ------------------------------------------------------------

interface ImportMeta {
  url: string;
}

declare class URL {
  constructor(input: string, base?: string | URL);
  readonly pathname: string;
  readonly href: string;
}

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exit(code?: number): never;
  exitCode: number | undefined;
  stdout: { write(s: string): boolean };
};

declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

declare function setTimeout(cb: (...args: unknown[]) => void, ms: number): unknown;
declare function clearTimeout(handle: unknown): void;

declare class Buffer extends Uint8Array {
  toString(encoding?: string): string;
}

declare class Date {
  constructor();
  constructor(value: string | number);
  toISOString(): string;
  getFullYear(): number;
  getMonth(): number;
  getDate(): number;
  getHours(): number;
  getMinutes(): number;
}

// ---- Pacotes de terceiros ----------------------------------------------

declare module "chalk" {
  type Chainable = ((text: string) => string) & { [k: string]: Chainable };
  const chalk: Chainable;
  export default chalk;
}

declare module "axios" {
  export interface AxiosRequestConfig {
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    timeout?: number;
    responseType?: string;
  }
  export interface AxiosResponse<T = unknown> {
    data: T;
    headers: Record<string, string>;
  }
  export function get<T = unknown>(url: string, cfg?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  const axios: { get: typeof get };
  export default axios;
}

declare module "commander" {
  export class Command {
    name(n: string): this;
    description(d: string): this;
    version(v: string): this;
    command(s: string, opts?: { isDefault?: boolean }): this;
    alias(a: string): this;
    option(flag: string, desc: string, def?: unknown): this;
    action(fn: (...args: any[]) => any): this;
    parseAsync(argv: string[]): Promise<this>;
  }
}

declare module "@clack/prompts" {
  export function text(o: {
    message: string;
    placeholder?: string;
    initialValue?: string;
  }): Promise<string | symbol>;
  export function password(o: { message: string }): Promise<string | symbol>;
  export function confirm(o: { message: string }): Promise<boolean | symbol>;
  export function select<T = string>(o: {
    message: string;
    options: Array<{ value: T; label: string; hint?: string }>;
  }): Promise<T | symbol>;
  export function multiselect<T = string>(o: {
    message: string;
    options: Array<{ value: T; label: string; hint?: string }>;
    initialValues?: T[];
    required?: boolean;
  }): Promise<T[] | symbol>;
  export function isCancel(v: unknown): v is symbol;
  export function spinner(): { start(msg?: string): void; stop(msg?: string): void };
}
