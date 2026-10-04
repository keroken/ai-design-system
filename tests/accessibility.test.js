import test from "node:test";
import assert from "node:assert/strict";
import { foundations } from "@ai-ds/foundations";
import { resolveThemes } from "@ai-ds/semantic-tokens";
import { contrastRatio, validateTheme } from "@ai-ds/accessibility";
import { buttonProps } from "@ai-ds/primitives";

test("black and white have maximum contrast", () => assert.equal(contrastRatio("#000000", "#ffffff"), 21));
test("all declared contrast pairs pass", () => {
  for (const theme of Object.values(resolveThemes(foundations))) assert.ok(validateTheme(theme).every(result => result.pass));
});
test("button contract requires an accessible name", () => assert.throws(() => buttonProps({ label: "" }), /accessible label/));
test("loading button exposes busy and disabled state", () => assert.deepEqual(buttonProps({ label: "Save", loading: true }), { type: "button", "aria-label": "Save", "aria-disabled": "true", "aria-busy": "true", disabled: true }));
