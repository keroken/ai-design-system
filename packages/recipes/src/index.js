export const buttonRecipe = Object.freeze({
  name: "Button",
  base: "button",
  tokens: ["color.action", "color.actionHover", "color.onAction", "color.focus", "space.controlX", "space.controlY", "radius.control", "weight.control", "motion.feedback"],
  variants: { tone: ["primary", "neutral", "danger"], size: ["compact", "default"], width: ["content", "full"] },
  defaults: { tone: "primary", size: "default", width: "content" },
  states: ["hover", "focus-visible", "disabled", "loading"]
});

export const textFieldRecipe = Object.freeze({
  name: "TextField",
  base: "field",
  tokens: ["color.surface", "color.text", "color.textMuted", "color.border", "color.danger", "color.focus", "radius.control"],
  variants: { invalid: [false, true] },
  defaults: { invalid: false },
  states: ["focus-visible", "disabled", "invalid"]
});

export const recipes = [buttonRecipe, textFieldRecipe];

