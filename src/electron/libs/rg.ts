import { execSync } from "child_process";
import { join } from "path";

export interface RgMatch {
  path: string;
  line: number;
  content: string;
}

export interface RgOptions {
  ext?: string;
  glob?: string;
  context?: number;
  caseSensitive?: boolean;
  limit?: number;
}

function getBinPath(): string {
  return join(process.resourcesPath, "bin", "rg");
}

interface RgJsonMatch {
  type: "match";
  data: {
    path: { text: string };
    line_number: number;
    line: { text: string };
  };
}

function execRg(args: string[], cwd: string): string {
  const binPath = getBinPath();
  const fullCommand = [binPath, ...args].map(arg => `"${arg}"`).join(" ");
  try {
    return execSync(fullCommand, {
      cwd,
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    // rg returns exit code 1 when no matches
    return "";
  }
}

export function rgSearch(cwd: string, query: string, options?: RgOptions): RgMatch[] {
  const args: string[] = ["--json", "-e", query];

  if (options?.ext) args.push("-g", `*.${options.ext}`);
  if (options?.glob) args.push("-g", options.glob);
  if (options?.context) args.push("-C", String(options.context));
  if (!options?.caseSensitive) args.push("-i");
  if (options?.limit) args.push("--limit", String(options.limit));

  const output = execRg(args, cwd);
  if (!output.trim()) return [];

  return output.split("\n")
    .filter(Boolean)
    .map(line => JSON.parse(line) as RgJsonMatch)
    .filter(item => item.type === "match")
    .map(item => ({
      path: item.data.path.text,
      line: item.data.line_number,
      content: item.data.line.text.trim(),
    }));
}

export function rgFiles(cwd: string, pattern?: string, options?: { ext?: string }): string[] {
  const args: string[] = ["--files"];

  if (pattern) args.push("-e", pattern);
  if (options?.ext) args.push("-g", `*.${options.ext}`);

  const output = execRg(args, cwd);
  if (!output.trim()) return [];

  return output.split("\n").filter(Boolean);
}

export function rgCount(cwd: string, query: string, options?: { ext?: string }): number {
  const args: string[] = ["--json", "-e", query, "--count"];

  if (options?.ext) args.push("-g", `*.${options.ext}`);

  const output = execRg(args, cwd);
  if (!output.trim()) return 0;

  return output.split("\n")
    .filter(Boolean)
    .map(line => JSON.parse(line) as RgJsonMatch)
    .filter(item => item.type === "match")
    .length;
}
