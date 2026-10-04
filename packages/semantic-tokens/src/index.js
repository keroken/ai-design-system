import { defineTokenGroup } from "@ai-ds/contracts";

const alias = ($type, light, dark, $description) => ({ $type, $value: { light, dark }, $description });

export const semanticTokens = defineTokenGroup({
  "color.canvas": alias("color", "{color.neutral.50}", "{color.neutral.950}", "Application background"),
  "color.surface": alias("color", "{color.neutral.0}", "{color.neutral.700}", "Elevated surface"),
  "color.text": alias("color", "{color.neutral.950}", "{color.neutral.0}", "Primary text"),
  "color.textMuted": alias("color", "{color.neutral.700}", "{color.neutral.200}", "Secondary text"),
  "color.border": alias("color", "{color.neutral.200}", "{color.neutral.700}", "Default border"),
  "color.action": alias("color", "{color.indigo.600}", "{color.indigo.400}", "Interactive fill and emphasis"),
  "color.actionHover": alias("color", "{color.indigo.700}", "{color.indigo.400}", "Hovered action"),
  "color.onAction": alias("color", "{color.neutral.0}", "{color.neutral.950}", "Content on action fill"),
  "color.danger": alias("color", "{color.red.700}", "{color.red.50}", "Destructive or invalid state"),
  "color.focus": alias("color", "{color.indigo.600}", "{color.indigo.400}", "Keyboard focus indicator"),
  "space.controlX": alias("dimension", "{space.4}", "{space.4}", "Horizontal control inset"),
  "space.controlY": alias("dimension", "{space.3}", "{space.3}", "Vertical control inset"),
  "radius.control": alias("dimension", "{radius.md}", "{radius.md}", "Interactive control corners"),
  "radius.panel": alias("dimension", "{radius.lg}", "{radius.lg}", "Container corners"),
  "font.body": alias("fontFamily", "{font.sans}", "{font.sans}", "Body typeface"),
  "weight.control": alias("fontWeight", "{weight.medium}", "{weight.medium}", "Interactive label weight"),
  "motion.feedback": alias("duration", "{motion.fast}", "{motion.fast}", "Feedback duration")
});

function readPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

export function resolveThemes(foundations) {
  const themes = { light: {}, dark: {} };
  for (const [name, token] of Object.entries(semanticTokens)) {
    for (const theme of Object.keys(themes)) {
      const reference = token.$value[theme];
      const source = readPath(foundations, reference.slice(1, -1));
      if (!source) throw new Error(`Unknown token reference ${reference}`);
      themes[theme][name] = { ...token, $value: source.$value, $source: reference };
    }
  }
  return themes;
}

