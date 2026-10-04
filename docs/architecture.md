# Architecture

## Design principles

1. **Typed boundaries.** Every token and component has a stable, serializable
   contract. Human documentation and AI context are generated from the same data.
2. **Meaning before rendering.** Foundations contain values; semantic tokens
   contain intent; recipes bind intent to component anatomy.
3. **Accessibility is a gate.** Contrast and required accessible-name rules are
   checked before artifacts are emitted, not audited after rendering.
4. **Headless behavior is portable.** Primitives describe state, keyboard, and
   ARIA behavior without requiring a framework or visual theme.
5. **Generation is deterministic.** Given the same source modules, the
   orchestrator emits byte-identical CSS and manifest output.
6. **AI gets constraints, not taste.** The manifest exposes allowed variants,
   semantics, examples, and violations. It does not invite invented token names.
7. **Generated UI is data, not code.** Prototype agents exchange strict screen
   specifications. A trusted renderer turns those specifications into UI.

## Dependency rules

Each workspace package declares a `designSystem.layer` integer. Imports may only
target the same or a lower-numbered layer, except `orchestrator`, which is an
explicit integration boundary. `npm run validate` enforces package metadata and
forbids deep relative imports across package boundaries.

| Layer | Package | Allowed upstream inputs |
| ---: | --- | --- |
| 0 | contracts | none |
| 1 | foundations | contracts |
| 2 | semantic-tokens | contracts, foundations |
| 3 | accessibility | contracts, semantic-tokens |
| 4 | primitives | contracts, accessibility |
| 5 | recipes | contracts, semantic-tokens, accessibility, primitives |
| 6 | patterns | primitives, recipes |
| 7 | compositions | patterns, recipes |
| 8 | orchestrator | all layers |
| 9 | prototype-agents | accessibility, recipes, patterns, compositions |
| 10 | builder-runtime | prototype-agents and versioned application templates |

## Frontend builder runtime

The Phase 1 runtime persists each run under `.relay/runs/<id>`, seeds a versioned
React template, writes source from the reviewed prototype contract, runs a real
production build, and exposes the compiled preview and source archive through
the control-plane server. Run events are streamed over SSE. `BuildRunManager`
is the local implementation of the future sandbox-provider boundary; production
must replace host execution with an isolated Docker or hosted environment.

## Prototype agent pipeline

```text
PRD → Discovery Agent → System Planner → Prototype Builder → Accessibility Reviewer
          requirements       plan          screen spec          checked result
```

The PRD is treated as untrusted product content. Each agent has one role and a
bounded output schema. The builder cannot emit HTML, JavaScript, CSS, or URLs;
it emits a renderer-safe screen specification using approved pattern names and
component recipes. The server keeps provider credentials private and supports a
deterministic local implementation for development and tests.

## Token lifecycle

```text
raw value → semantic alias → theme resolution → accessibility validation
          → CSS custom property + JSON manifest → component recipe
```

Semantic tokens reference foundations using `{group.path}` syntax. Resolution
preserves provenance in the manifest so an AI can explain why a value exists and
suggest a source-level change instead of patching generated CSS.

## Extension sequence

When adding a component: define or reuse its contract, add headless behavior,
bind only semantic tokens in its recipe, validate states, compose it into a
pattern, and regenerate artifacts. New raw values should be rare and justified
by a semantic need rather than introduced from a mockup one pixel at a time.
