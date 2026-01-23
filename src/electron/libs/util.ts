import { claudeCodeEnv } from "./claude-settings.js";
import { unstable_v2_prompt } from "@anthropic-ai/claude-agent-sdk";
import type { SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { app } from "electron";
import { join } from "path";
import { homedir } from "os";
import { getActiveProviderConfig } from "./config-store.js";

// Get Claude Code CLI path for packaged app
export function getClaudeCodePath(): string | undefined {
  if (app.isPackaged) {
    return join(
      process.resourcesPath,
      'app.asar.unpacked/node_modules/@anthropic-ai/claude-agent-sdk/cli.js'
    );
  }
  return undefined;
}

// Build enhanced PATH for packaged environment
export function getEnhancedEnv(): Record<string, string | undefined> {
  const home = homedir();
  const additionalPaths = [
    '/usr/local/bin',
    '/opt/homebrew/bin',
    `${home}/.bun/bin`,
    `${home}/.nvm/versions/node/v20.0.0/bin`,
    `${home}/.nvm/versions/node/v22.0.0/bin`,
    `${home}/.nvm/versions/node/v18.0.0/bin`,
    `${home}/.volta/bin`,
    `${home}/.fnm/aliases/default/bin`,
    '/usr/bin',
    '/bin',
  ];

  const currentPath = process.env.PATH || '';
  const newPath = [...additionalPaths, currentPath].join(':');

  // Load API config and set environment variables for Claude SDK
  const apiConfig = getActiveProviderConfig();
  // Create new env object without editor variables to prevent Cursor/VSCode from opening
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { EDITOR, VISUAL, GIT_EDITOR, ...cleanEnv } = process.env;
  const env: Record<string, string | undefined> = {
    ...cleanEnv,
    PATH: newPath,
  };

  if (apiConfig && apiConfig.apiKey && apiConfig.baseURL && apiConfig.model) {
    if (apiConfig.apiType === "anthropic" || !apiConfig.apiType) {
      env.ANTHROPIC_AUTH_TOKEN = apiConfig.apiKey;
      env.ANTHROPIC_BASE_URL = apiConfig.baseURL;
      env.ANTHROPIC_MODEL = apiConfig.model;
    } else if (apiConfig.apiType === "openai-compatible") {
      // For OpenAI-compatible APIs, set the variables that Claude SDK expects
      env.ANTHROPIC_AUTH_TOKEN = apiConfig.apiKey;
      env.ANTHROPIC_BASE_URL = apiConfig.baseURL;
      env.ANTHROPIC_MODEL = apiConfig.model;
    }
  }

  return env;
}

export const claudeCodePath = getClaudeCodePath();

export const generateSessionTitle = async (userIntent: string | null) => {
  if (!userIntent) return "New Session";

  const result: SDKResultMessage = await unstable_v2_prompt(
    `please analynis the following user input to generate a short but clearly title to identify this conversation theme:
    ${userIntent}
    directly output the title, do not include any other content`, {
    model: claudeCodeEnv.ANTHROPIC_MODEL,
    env: getEnhancedEnv(),
    pathToClaudeCodeExecutable: claudeCodePath,
  });

  if (result.subtype === "success") {
    return result.result;
  }


  return "New Session";
};
