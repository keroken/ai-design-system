import { defineComponent } from "@ai-ds/contracts";

export const buttonPrimitive = defineComponent({
  name: "Button",
  anatomy: ["root", "leadingIcon", "label", "trailingIcon", "spinner"],
  variants: { disabled: [false, true], loading: [false, true] },
  a11y: { role: "button", accessibleName: "required", keyboard: ["Enter", "Space"], loadingAnnouncement: "polite" }
});

export function buttonProps({ label, disabled = false, loading = false } = {}) {
  if (!label?.trim()) throw new TypeError("Button requires a non-empty accessible label");
  return { type: "button", "aria-label": label, "aria-disabled": disabled || loading ? "true" : undefined, "aria-busy": loading ? "true" : undefined, disabled: disabled || loading };
}

export const textFieldPrimitive = defineComponent({
  name: "TextField",
  anatomy: ["root", "label", "control", "description", "error"],
  variants: { invalid: [false, true], disabled: [false, true] },
  a11y: { label: "required", description: "aria-describedby", error: "aria-errormessage", invalid: "aria-invalid" }
});

