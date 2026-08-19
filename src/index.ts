import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent"
import {
  SESSION_STATE_ENTRY,
  THINKING_LEVELS,
  createModelState,
  readGlobalState,
  restoreSessionState,
  saveGlobalState,
  type ModelState,
  type ThinkingLevel,
} from "./state.ts"

const DEFAULT_CHOICE = "Default"
const SLASH_REQUEST_EVENT = "subagent:slash:request"
const DELEGATION_REQUEST_EVENT = "prompt-template:subagent:request"
const RPC_REQUEST_EVENT = "subagents:rpc:v1:request"

type RecordValue = Record<string, unknown>
type ModelLike = {
  provider: string
  id: string
  reasoning?: boolean
  thinkingLevelMap?: Partial<Record<ThinkingLevel, string | null>>
}

type EventBus = {
  on(event: string, handler: (data: unknown) => void): (() => void) | void
}

type RuntimeRegistry = typeof globalThis & {
  __piSubagentModelsDispose?: () => void
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function resolveModelState(sessionState: ModelState, globalState: ModelState): ModelState {
  return sessionState.mode === "forced" ? sessionState : globalState
}

export function modelArgument(state: ModelState): string | undefined {
  if (state.mode === "default") return undefined
  return state.thinking ? `${state.model}:${state.thinking}` : state.model
}

function patchChainStep(value: unknown, model: string): void {
  if (!isRecord(value)) return
  if (typeof value.agent === "string") value.model = model

  if (Array.isArray(value.parallel)) {
    for (const task of value.parallel) patchChainStep(task, model)
  } else if (isRecord(value.parallel)) {
    patchChainStep(value.parallel, model)
  }
}

export function patchSubagentParams(value: unknown, state: ModelState): boolean {
  if (!isRecord(value)) return false
  const model = modelArgument(state)
  if (!model) return false

  if (typeof value.action === "string" && value.action !== "schedule") return false
  if (typeof value.agent === "string" || value.action === "schedule") value.model = model

  if (Array.isArray(value.tasks)) {
    for (const task of value.tasks) patchChainStep(task, model)
  }
  if (Array.isArray(value.chain)) {
    for (const step of value.chain) patchChainStep(step, model)
  }
  return true
}

export function patchDelegationRequest(value: unknown, state: ModelState): boolean {
  if (!isRecord(value) || state.mode === "default") return false

  if (value.version === 2) {
    if (typeof value.agent !== "string") return false
    value.model = state.model
    if (state.thinking) value.thinking = state.thinking
    else delete value.thinking
    return true
  }

  const tasks = Array.isArray(value.tasks)
    ? value.tasks.filter((task) => isRecord(task) && typeof task.agent === "string") as RecordValue[]
    : []
  if (typeof value.agent !== "string" && tasks.length === 0) return false

  const model = modelArgument(state)!
  value.model = model
  for (const task of tasks) task.model = model
  return true
}

export function patchRpcRequest(value: unknown, state: ModelState): boolean {
  if (!isRecord(value) || value.method !== "spawn") return false
  return patchSubagentParams(value.params, state)
}

function stateForContext(ctx: ExtensionContext, globalState: ModelState): ModelState {
  return resolveModelState(restoreSessionState(ctx.sessionManager.getBranch()), globalState)
}

function availableModels(ctx: ExtensionContext): ModelLike[] {
  const models = ctx.scopedModels.length > 0
    ? ctx.scopedModels.map((entry) => entry.model)
    : ctx.modelRegistry.getAvailable()
  const unique = new Map<string, ModelLike>()
  for (const model of models) unique.set(`${model.provider}/${model.id}`, model)
  return [...unique.values()].sort((left, right) =>
    left.provider.localeCompare(right.provider) || left.id.localeCompare(right.id),
  )
}

function supportedThinkingLevels(model: ModelLike): ThinkingLevel[] {
  if (model.reasoning === false) return ["off"]
  if (!model.thinkingLevelMap) return THINKING_LEVELS.filter((level) => level !== "max")
  return THINKING_LEVELS.filter((level) => {
    const mapped = model.thinkingLevelMap?.[level]
    if (mapped === null) return false
    if (level === "xhigh" || level === "max") return mapped !== undefined
    return true
  })
}

export async function selectOption(
  ctx: ExtensionCommandContext,
  title: string,
  options: string[],
): Promise<string | undefined> {
  if (ctx.mode !== "tui") return ctx.ui.select(title, options)
  return (await import("./selector.ts")).selectOption(ctx, title, options)
}

async function chooseState(ctx: ExtensionCommandContext, title: string): Promise<ModelState | undefined> {
  if (!ctx.hasUI) {
    ctx.ui.notify("This command requires the interactive Pi UI.", "error")
    return undefined
  }

  const models = availableModels(ctx)
  if (models.length === 0) {
    ctx.ui.notify("No configured models are available.", "error")
    return undefined
  }

  const choices = [DEFAULT_CHOICE, ...models.map((model) => `${model.provider}/${model.id}`)]
  const selectedModel = await selectOption(ctx, title, choices)
  if (!selectedModel) return undefined
  if (selectedModel === DEFAULT_CHOICE) return { mode: "default" }

  const model = models.find((candidate) => `${candidate.provider}/${candidate.id}` === selectedModel)
  if (!model) {
    ctx.ui.notify("The selected model is no longer available.", "error")
    return undefined
  }

  const scopedThinking = ctx.scopedModels.find(
    (entry) => `${entry.model.provider}/${entry.model.id}` === selectedModel,
  )?.thinkingLevel
  const thinkingChoices = scopedThinking
    ? [DEFAULT_CHOICE, scopedThinking]
    : [DEFAULT_CHOICE, ...supportedThinkingLevels(model)]
  const selectedThinking = await selectOption(ctx, "Subagent thinking level", thinkingChoices)
  if (!selectedThinking) return undefined
  return createModelState(selectedModel, selectedThinking === DEFAULT_CHOICE ? undefined : selectedThinking)
}

export default function piSubagentModels(pi: ExtensionAPI): void {
  let activeSessionState: ModelState = { mode: "default" }
  const syncSessionState = (ctx: ExtensionContext) => {
    activeSessionState = restoreSessionState(ctx.sessionManager.getBranch())
  }

  pi.registerCommand("subagents-model", {
    description: "Set the global model for all subagents",
    handler: async (_args, ctx) => {
      const state = await chooseState(ctx, "Global subagent model")
      if (!state) return
      await saveGlobalState(state)
      ctx.ui.notify(
        state.mode === "default"
          ? "Global subagent override cleared."
          : `Global subagents will use ${modelArgument(state)}.`,
        "info",
      )
    },
  })

  pi.registerCommand("subagents-model-session", {
    description: "Set the subagent model for this session",
    handler: async (_args, ctx) => {
      const state = await chooseState(ctx, "Session subagent model")
      if (!state) return
      pi.appendEntry(SESSION_STATE_ENTRY, state)
      activeSessionState = state
      ctx.ui.notify(
        state.mode === "default"
          ? "Session subagent override cleared."
          : `Session subagents will use ${modelArgument(state)}.`,
        "info",
      )
    },
  })

  pi.on("session_start", (_event, ctx) => {
    syncSessionState(ctx)
  })

  pi.on("session_tree", (_event, ctx) => {
    syncSessionState(ctx)
  })

  pi.on("tool_call", (event, ctx) => {
    if (event.toolName !== "subagent") return
    patchSubagentParams(event.input, stateForContext(ctx, readGlobalState()))
  })

  const runtime = globalThis as RuntimeRegistry
  runtime.__piSubagentModelsDispose?.()

  const subscriptions = [
    (pi.events as EventBus).on(SLASH_REQUEST_EVENT, (data) => {
      if (!isRecord(data)) return
      const requestContext = data.ctx as ExtensionContext | undefined
      const state = requestContext
        ? stateForContext(requestContext, readGlobalState())
        : resolveModelState(activeSessionState, readGlobalState())
      patchSubagentParams(data.params, state)
    }),
    (pi.events as EventBus).on(DELEGATION_REQUEST_EVENT, (data) => {
      patchDelegationRequest(data, resolveModelState(activeSessionState, readGlobalState()))
    }),
    (pi.events as EventBus).on(RPC_REQUEST_EVENT, (data) => {
      patchRpcRequest(data, resolveModelState(activeSessionState, readGlobalState()))
    }),
  ]

  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const unsubscribe of subscriptions) {
      if (typeof unsubscribe === "function") unsubscribe()
    }
    if (runtime.__piSubagentModelsDispose === dispose) delete runtime.__piSubagentModelsDispose
  }
  runtime.__piSubagentModelsDispose = dispose
  pi.on("session_shutdown", dispose)
}
