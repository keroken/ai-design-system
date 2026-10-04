export const signInComposition = Object.freeze({
  name: "SignIn",
  intent: "Authenticate a returning user with a minimal, recoverable flow.",
  structure: [
    { pattern: "FormField", id: "email", input: { type: "email", autocomplete: "email" } },
    { pattern: "FormField", id: "password", input: { type: "password", autocomplete: "current-password" } },
    { pattern: "ActionGroup", primary: { recipe: "Button", tone: "primary", width: "full" } }
  ],
  contentRules: ["State the destination in the heading", "Use 'Sign in' consistently", "Keep recovery available before submission"]
});

export const compositions = [signInComposition];

