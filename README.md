# AI Design System

An executable reference architecture for a design system that is easy for both
people and AI agents to inspect, validate, and extend. It turns primitive values
into semantic tokens, accessible component recipes, and machine-readable output.

## Why this shape

The repository separates stable facts from product decisions and rendered UI:

```text
contracts
   ↓
foundations → semantic-tokens → accessibility
                         ↓             ↓
                    primitives → recipes → patterns → compositions
                                                   ↘
                                         orchestrator → generated artifacts
```

Dependencies only point to the right/down. The orchestration layer may read all
other layers, but no product layer may depend on it. This keeps generation
replaceable and prevents AI-specific behavior from leaking into UI contracts.

## Quick start

The scaffold has no third-party runtime dependencies; installation only links
the local npm workspaces.

```bash
npm install
npm run check
npm run dev
```

Then open <http://localhost:4173>. The generator writes CSS and an AI-readable
manifest into `apps/demo/public/generated/`.

## Packages

| Layer | Responsibility | Not responsible for |
| --- | --- | --- |
| `contracts` | JSON schemas and canonical data shapes | Brand choices |
| `foundations` | Raw palette, type, space, radius, motion | UI meaning |
| `semantic-tokens` | Intent aliases and theme resolution | Component layout |
| `accessibility` | Policy plus deterministic validation | Visual styling |
| `primitives` | Headless interaction/ARIA contracts | Branded appearance |
| `recipes` | Token-backed component variants/states | Page structure |
| `patterns` | Reusable information structures | Product workflows |
| `compositions` | Product-ready assemblies | Token generation |
| `orchestrator` | Validate, resolve, emit, explain | Runtime UI behavior |

See [Architecture](docs/architecture.md) and [AI authoring contract](docs/ai-authoring.md).
