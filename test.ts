import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import {
  default as piSubagentModels,
  modelArgument,
  patchDelegationRequest,
  patchRpcRequest,
  patchSubagentParams,
  resolveModelState,
} from "./src/index.ts"
import {
  SESSION_STATE_ENTRY,
  createModelState,
  parseModelState,
  readGlobalStateAsync,
  restoreSessionState,
  saveGlobalState,
  type ModelState,
} from "./src/state.ts"

const forced: ModelState = {
  mode: "forced",
  model: "provider/example-model",
  thinking: "high",
}

test("validates persisted model state", () => {
  assert.deepEqual(parseModelState(forced), forced)
  assert.deepEqual(parseModelState({ mode: "forced", model: "missing-provider" }), { mode: "default" })
  assert.deepEqual(parseModelState({ mode: "forced", model: "provider/model", thinking: "invalid" }), {
    mode: "forced",
    model: "provider/model",
  })
  assert.throws(() => createModelState("missing-provider"))
})

test("stores global state atomically", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pi-subagent-models-"))
  try {
    await saveGlobalState(forced, directory)
    assert.deepEqual(await readGlobalStateAsync(directory), forced)
    assert.deepEqual(JSON.parse(await readFile(join(directory, "subagent-model.json"), "utf8")), forced)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("restores the latest session marker and falls back to global", () => {
  const session = restoreSessionState([
    { type: "custom", customType: SESSION_STATE_ENTRY, data: forced },
    { type: "custom", customType: SESSION_STATE_ENTRY, data: { mode: "default" } },
  ])
  assert.deepEqual(session, { mode: "default" })
  assert.deepEqual(resolveModelState(session, forced), forced)
})

test("patches single, parallel, and chain launches", () => {
  const input = {
    agent: "worker",
    task: "single",
    model: "old/single",
    tasks: [{ agent: "scout", task: "parallel", model: "old/parallel" }],
    chain: [
      { agent: "planner", task: "plan" },
      { parallel: [{ agent: "reviewer", task: "review" }] },
      { expand: {}, parallel: { agent: "worker", task: "{item}" }, collect: {} },
    ],
  }

  assert.equal(patchSubagentParams(input, forced), true)
  assert.equal(input.model, modelArgument(forced))
  assert.equal(input.tasks[0]?.model, modelArgument(forced))
  assert.equal(input.chain[0]?.model, modelArgument(forced))
  assert.equal(input.chain[1]?.parallel?.[0]?.model, modelArgument(forced))
  assert.equal(input.chain[2]?.parallel?.model, modelArgument(forced))
})

test("leaves management calls and Default unchanged", () => {
  const management = { action: "status", agent: "worker" }
  const launch = { agent: "worker", task: "work", model: "provider/parent-choice:low" }
  assert.equal(patchSubagentParams(management, forced), false)
  assert.equal(patchSubagentParams(launch, { mode: "default" }), false)
  assert.deepEqual(management, { action: "status", agent: "worker" })
  assert.deepEqual(launch, { agent: "worker", task: "work", model: "provider/parent-choice:low" })
})

test("patches delegation v2 and RPC spawn requests", () => {
  const delegation = { version: 2, agent: "reviewer", task: "review", model: "old/model", thinking: "low" }
  const rpc = { method: "spawn", params: { agent: "worker", task: "work" } }

  assert.equal(patchDelegationRequest(delegation, forced), true)
  assert.equal(delegation.model, forced.model)
  assert.equal(delegation.thinking, forced.thinking)
  assert.equal(patchRpcRequest(rpc, forced), true)
  assert.equal((rpc.params as { model?: string }).model, modelArgument(forced))
})

test("patches every task in legacy parallel delegation", () => {
  const delegation = {
    requestId: "request-1",
    model: "provider/original",
    cwd: "/workspace",
    context: "fresh",
    tasks: [
      { agent: "scout", task: "scan", model: "provider/fast" },
      { agent: "reviewer", task: "review" },
    ],
  }

  assert.equal(patchDelegationRequest(delegation, forced), true)
  assert.equal(delegation.model, modelArgument(forced))
  assert.equal(delegation.tasks[0]?.model, modelArgument(forced))
  assert.equal(delegation.tasks[1]?.model, modelArgument(forced))
})

test("registers both commands and refreshes cached state after branch navigation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pi-subagent-models-runtime-"))
  const previousAgentDirectory = process.env.PI_CODING_AGENT_DIR
  process.env.PI_CODING_AGENT_DIR = directory

  let branch: unknown[] = [{ type: "custom", customType: SESSION_STATE_ENTRY, data: forced }]
  const lifecycle = new Map<string, (event: unknown, context: unknown) => void>()
  const bus = new Map<string, (data: unknown) => void>()
  const commands: string[] = []
  const context = {
    sessionManager: { getBranch: () => branch },
  }
  const pi = {
    registerCommand: (name: string) => commands.push(name),
    appendEntry: () => {},
    on: (event: string, handler: (event: unknown, context: unknown) => void) => lifecycle.set(event, handler),
    events: {
      on: (event: string, handler: (data: unknown) => void) => {
        bus.set(event, handler)
        return () => bus.delete(event)
      },
    },
  }

  try {
    piSubagentModels(pi as never)
    assert.deepEqual(commands, ["subagents-model", "subagents-model-session"])

    lifecycle.get("session_start")?.({}, context)
    const forcedRequest = { version: 2, agent: "reviewer", task: "review" }
    bus.get("prompt-template:subagent:request")?.(forcedRequest)
    assert.equal((forcedRequest as { model?: string }).model, forced.model)

    const forcedTool = { agent: "worker", task: "work" }
    lifecycle.get("tool_call")?.({ toolName: "subagent", input: forcedTool }, context)
    assert.equal((forcedTool as { model?: string }).model, modelArgument(forced))

    const forcedSlash = { params: { agent: "scout", task: "scan" }, ctx: context }
    bus.get("subagent:slash:request")?.(forcedSlash)
    assert.equal((forcedSlash.params as { model?: string }).model, modelArgument(forced))

    const forcedRpc = { method: "spawn", params: { agent: "planner", task: "plan" } }
    bus.get("subagents:rpc:v1:request")?.(forcedRpc)
    assert.equal((forcedRpc.params as { model?: string }).model, modelArgument(forced))

    branch = [{ type: "custom", customType: SESSION_STATE_ENTRY, data: { mode: "default" } }]
    lifecycle.get("session_tree")?.({}, context)
    const defaultRequest = { version: 2, agent: "reviewer", task: "review" }
    bus.get("prompt-template:subagent:request")?.(defaultRequest)
    assert.equal((defaultRequest as { model?: string }).model, undefined)

    const defaultTool = { agent: "worker", task: "work" }
    lifecycle.get("tool_call")?.({ toolName: "subagent", input: defaultTool }, context)
    assert.equal((defaultTool as { model?: string }).model, undefined)

    const defaultSlash = { params: { agent: "scout", task: "scan" }, ctx: context }
    bus.get("subagent:slash:request")?.(defaultSlash)
    assert.equal((defaultSlash.params as { model?: string }).model, undefined)

    const defaultRpc = { method: "spawn", params: { agent: "planner", task: "plan" } }
    bus.get("subagents:rpc:v1:request")?.(defaultRpc)
    assert.equal((defaultRpc.params as { model?: string }).model, undefined)

    lifecycle.get("session_shutdown")?.({}, context)
  } finally {
    if (previousAgentDirectory === undefined) delete process.env.PI_CODING_AGENT_DIR
    else process.env.PI_CODING_AGENT_DIR = previousAgentDirectory
    await rm(directory, { recursive: true, force: true })
  }
})
