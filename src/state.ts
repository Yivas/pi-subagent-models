import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

export const SESSION_STATE_ENTRY = "pi-subagent-models-state"
export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const

export type ThinkingLevel = (typeof THINKING_LEVELS)[number]
export type ModelState =
  | { mode: "default" }
  | { mode: "forced"; model: string; thinking?: ThinkingLevel }

type SessionEntry = {
  type?: string
  customType?: string
  data?: unknown
}

export function getAgentDirectory(env: NodeJS.ProcessEnv = process.env): string {
  return env.PI_CODING_AGENT_DIR?.trim() || join(homedir(), ".pi", "agent")
}

export function getGlobalStatePath(agentDirectory = getAgentDirectory()): string {
  return join(agentDirectory, "subagent-model.json")
}

export function parseModelState(value: unknown): ModelState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { mode: "default" }
  const state = value as Record<string, unknown>
  if (state.mode !== "forced" || typeof state.model !== "string" || !/^[^/\s]+\/\S+$/.test(state.model)) {
    return { mode: "default" }
  }

  const thinking = THINKING_LEVELS.find((level) => level === state.thinking)
  return {
    mode: "forced",
    model: state.model,
    ...(thinking ? { thinking } : {}),
  }
}

export function createModelState(model: string, thinking?: string): ModelState {
  if (model.toLowerCase() === "default") return { mode: "default" }
  const state = parseModelState({ mode: "forced", model: model.trim(), thinking })
  if (state.mode === "default") throw new Error("Select Default or a model in provider/model format.")
  return state
}

export function readGlobalState(agentDirectory = getAgentDirectory()): ModelState {
  try {
    return parseModelState(JSON.parse(readFileSync(getGlobalStatePath(agentDirectory), "utf8")))
  } catch {
    return { mode: "default" }
  }
}

export async function saveGlobalState(state: ModelState, agentDirectory = getAgentDirectory()): Promise<void> {
  await writeModelState(getGlobalStatePath(agentDirectory), state)
}

export function restoreSessionState(entries: unknown[]): ModelState {
  const branch = entries as SessionEntry[]
  for (let index = branch.length - 1; index >= 0; index -= 1) {
    const entry = branch[index]
    if (entry?.type === "custom" && entry.customType === SESSION_STATE_ENTRY) {
      return parseModelState(entry.data)
    }
  }
  return { mode: "default" }
}

async function writeModelState(path: string, state: ModelState): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`
  try {
    await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
    await rename(temporaryPath, path)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}

export async function readGlobalStateAsync(agentDirectory = getAgentDirectory()): Promise<ModelState> {
  try {
    return parseModelState(JSON.parse(await readFile(getGlobalStatePath(agentDirectory), "utf8")))
  } catch {
    return { mode: "default" }
  }
}
