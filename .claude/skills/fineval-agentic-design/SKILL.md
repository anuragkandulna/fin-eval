---
name: fineval-agentic-design
description: "Design guidance for FinEval's LangGraph agent — deciding when to add a new tool vs. extend a prompt, how to design new state fields, how to route a new flow_type, and general agentic AI/ML engineering judgment for this codebase. Use when planning a new agent capability, node, or tool, not just when enforcing existing rules. Complements fineval-architecture-guard, which enforces constraints; this skill guides new design decisions."
---

# FinEval Agentic Design

Patterns for extending the agent, grounded in the actual current graph topology: `rag`,
`budget`, `debt`, `savings`, `response`, `guardrail` nodes; `flow_type` of `chat` / `analyse`
/ `summarise`. Not a persona — a decision checklist.

## Tool vs. prompt

- Add a LangChain `@tool` (`tools.py`) when the capability needs deterministic computation
  FinEval controls (budget math, debt payoff simulation, savings FV) — the model should not
  "calculate" these in free text.
- Extend a prompt (`prompts.py`) when the capability is about tone, framing, or what to say
  about an already-computed result — not how to compute it.
- Rule of thumb: if a wrong answer is a math error, it's a tool. If a wrong answer is a bad
  explanation, it's a prompt.

## State field design

- New field — does it need a LangGraph reducer (like `add_messages`)? Only if multiple nodes
  append or merge into it. Otherwise a plain scalar/dict field on `FinanceAgentState` is fine
  (still inside the `TypedDict` — see `fineval-architecture-guard`).
- Prefer typed dict shapes for result fields (`budget_result`, `debt_result`,
  `savings_result`) over loosely-typed `Any` — keeps `response_node`'s prompt construction
  predictable.

## Adding a new node

- Every new node needs an explicit routing decision in the preceding `_route_after_*`
  function — LangGraph doesn't infer control flow.
- The new node must still terminate through `guardrail` (see `fineval-architecture-guard`) —
  decide this before writing the node, not after.
- Ask: does this node need `retrieved_docs`? If yes, it runs after `rag`, not before.

## Adding a new flow_type

- `flow_type` is a state field, not a route — the same request shape can carry a new
  `flow_type` if it fits an existing router, or justify a new router if it doesn't.
- Each `flow_type` needs its own explicit `response_node` prompt path — don't let a new
  `flow_type` silently fall through to a prompt that wasn't written for it.

## Multi-agent / MCP / A2A (forward-looking, not yet built)

FinEval is single-agent (one `StateGraph`). If multi-agent is ever considered, the
guardrail-always-last constraint must extend to every sub-agent's output — don't let a
sub-agent response skip sanitisation because it's "internal."

## Before finishing

- [ ] Tool vs. prompt choice stated and justified (computation vs. framing)?
- [ ] New state fields don't need a reducer, or do and it's declared?
- [ ] New node's path to `guardrail_node` traced explicitly?
- [ ] New `flow_type` has its own `response_node` prompt branch?
