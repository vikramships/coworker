import { execSync } from "child_process";

// Scout must be installed in PATH (e.g., ~/.local/bin/scout)
// Install from: https://github.com/vikramships/scout-rs

function execScout(args: string[]): string {
  try {
    return execSync(`scout ${args.join(" ")}`, {
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const err = error as any;
    if (err.stdout) return err.stdout as string;
    throw error;
  }
}

export type ScoutFileInfo = {
  path: string;
  size: number;
};

export type ScoutSearchResult = {
  path: string;
  line: number;
  content: string;
};

export type ScoutFindOptions = {
  pattern: string;
  limit?: number;
  gitignore?: boolean;
};

export type ScoutSearchOptions = {
  query: string;
  ext?: string;
  limit?: number;
};

export type ScoutListOptions = {
  gitignore?: boolean;
};

export function scoutFind(root: string, options: ScoutFindOptions): ScoutFileInfo[] {
  const args = ["find", options.pattern, "--root", root];

  if (options.limit) {
    args.push("--limit", String(options.limit));
  }

  if (options.gitignore !== undefined) {
    args.push("--gitignore", String(options.gitignore));
  }

  const output = execScout(args);
  return JSON.parse(output) as ScoutFileInfo[];
}

export function scoutSearch(root: string, options: ScoutSearchOptions): ScoutSearchResult[] {
  const args = ["search", options.query, "--root", root];

  if (options.ext) {
    args.push("--ext", options.ext);
  }

  if (options.limit) {
    args.push("--limit", String(options.limit));
  }

  const output = execScout(args);
  return JSON.parse(output) as ScoutSearchResult[];
}

export function scoutList(root: string, options: ScoutListOptions = {}): ScoutFileInfo[] {
  const args = ["list", "--root", root];

  if (options.gitignore !== undefined) {
    args.push("--gitignore", String(options.gitignore));
  }

  const output = execScout(args);
  return JSON.parse(output) as ScoutFileInfo[];
}
