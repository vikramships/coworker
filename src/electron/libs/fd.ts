import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface FdFileInfo {
  path: string;
  size?: number;
}

export interface FdOptions {
  hidden?: boolean;
  ext?: string;
  type?: "file" | "dir" | "symlink";
  limit?: number;
}

function getBinPath(): string {
  // Look in bundled binaries first, fallback to system PATH
  const bundledPath = join(process.resourcesPath, "bin", "fd");
  if (require("fs").existsSync(bundledPath)) {
    return bundledPath;
  }
  return "fd"; // Fallback to system PATH
}

function execFd(args: string[], cwd: string): string {
  const binPath = getBinPath();
  const fullCommand = `"${binPath}" ${args.map(arg => `"${arg}"`).join(" ")}`;
  try {
    return execSync(fullCommand, {
      cwd,
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    // fd returns exit code 1 when no matches
    return "";
  }
}

export function fdList(cwd: string, options?: FdOptions): FdFileInfo[] {
  const args: string[] = [];

  if (options?.hidden) args.push("-H");
  if (options?.type) args.push("-t", options.type[0]);
  if (options?.ext) args.push("-e", options.ext);
  if (options?.limit) args.push("--limit", String(options.limit));

  const output = execFd(args, cwd);
  if (!output.trim()) return [];

  return output.split("\n")
    .filter(Boolean)
    .map(path => ({ path }));
}

export function fdFind(cwd: string, pattern: string, options?: FdOptions): FdFileInfo[] {
  const args: string[] = [pattern];

  if (options?.hidden) args.push("-H");
  if (options?.type) args.push("-t", options.type[0]);
  if (options?.ext) args.push("-e", options.ext);
  if (options?.limit) args.push("--limit", String(options.limit));

  const output = execFd(args, cwd);
  if (!output.trim()) return [];

  return output.split("\n")
    .filter(Boolean)
    .map(path => ({ path }));
}
