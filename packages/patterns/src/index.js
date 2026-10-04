export const formFieldPattern = Object.freeze({
  name: "FormField",
  purpose: "Associates a label, control, optional guidance, and validation message.",
  slots: ["label", "control", "description", "error"],
  rules: ["Label is always visible", "Description and error have stable ids", "Error does not rely on color alone"]
});

export const actionGroupPattern = Object.freeze({
  name: "ActionGroup",
  purpose: "Orders a primary action with optional supporting actions.",
  slots: ["primary", "secondary"],
  rules: ["One primary action maximum", "Destructive action requires explicit language"]
});

export const patterns = [formFieldPattern, actionGroupPattern];

