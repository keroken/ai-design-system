# AI authoring contract

An AI agent working in this repository should:

1. Read `generated/design-system.manifest.json` before proposing UI.
2. Use an existing semantic token or component variant when one fits.
3. Change source modules, never files in a `generated/` directory.
4. Preserve accessible names, focus visibility, and keyboard behavior.
5. Run `npm run check` after any source change.
6. Report newly introduced tokens, variants, and policy exceptions explicitly.

The manifest is deliberately compact: it exposes resolved themes, token source
references, component anatomy and variants, patterns, compositions, and policy
results. This is the primary context payload for generation tools.

