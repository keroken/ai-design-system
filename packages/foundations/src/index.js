import { defineTokenGroup } from "@ai-ds/contracts";

const token = ($type, $value, $description) => ({ $type, $value, $description });

export const foundations = defineTokenGroup({
  color: {
    neutral: { 0: token("color", "#ffffff", "White"), 50: token("color", "#f7f8fa", "Cool white"), 200: token("color", "#dce0e8", "Subtle border"), 700: token("color", "#303746", "Muted ink"), 950: token("color", "#111318", "Primary ink") },
    indigo: { 400: token("color", "#818cf8", "Light brand"), 600: token("color", "#4f46e5", "Core brand"), 700: token("color", "#4338ca", "Strong brand") },
    red: { 50: token("color", "#fff1f2", "Error tint"), 700: token("color", "#be123c", "Error ink") },
    green: { 50: token("color", "#ecfdf5", "Success tint"), 700: token("color", "#047857", "Success ink") }
  },
  space: { 0: token("dimension", "0", "No space"), 1: token("dimension", "0.25rem", "Micro space"), 2: token("dimension", "0.5rem", "Compact space"), 3: token("dimension", "0.75rem", "Control space"), 4: token("dimension", "1rem", "Default space"), 6: token("dimension", "1.5rem", "Section space"), 8: token("dimension", "2rem", "Large space"), 12: token("dimension", "3rem", "Layout space") },
  radius: { sm: token("dimension", "0.375rem", "Small corners"), md: token("dimension", "0.75rem", "Control corners"), lg: token("dimension", "1.25rem", "Panel corners"), pill: token("dimension", "999px", "Pill corners") },
  font: { sans: token("fontFamily", "Inter, ui-sans-serif, system-ui, sans-serif", "Interface font"), mono: token("fontFamily", "ui-monospace, SFMono-Regular, monospace", "Code font") },
  weight: { regular: token("fontWeight", 400, "Body weight"), medium: token("fontWeight", 550, "Control weight"), bold: token("fontWeight", 700, "Heading weight") },
  motion: { fast: token("duration", "120ms", "Immediate feedback"), normal: token("duration", "200ms", "State transition"), productive: token("cubicBezier", [0.2, 0, 0, 1], "Productive easing") }
});

