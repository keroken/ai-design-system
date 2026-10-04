export const accessibilityPolicy = Object.freeze({
  standard: "WCAG 2.2 AA",
  contrast: { normalText: 4.5, largeText: 3, nonText: 3 },
  focus: { visible: true, minimumArea: "2px perimeter", obscured: false },
  motion: { honorReducedMotion: true },
  controls: { minimumTarget: "24px", accessibleNameRequired: true }
});

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateTheme(theme) {
  const pairs = [
    ["color.text", "color.canvas", "normalText"],
    ["color.text", "color.surface", "normalText"],
    ["color.onAction", "color.action", "normalText"]
  ];
  return pairs.map(([foreground, background, criterion]) => {
    const ratio = contrastRatio(theme[foreground].$value, theme[background].$value);
    return { foreground, background, ratio: Number(ratio.toFixed(2)), required: accessibilityPolicy.contrast[criterion], pass: ratio >= accessibilityPolicy.contrast[criterion] };
  });
}

export function assertAccessibleThemes(themes) {
  const failures = Object.entries(themes).flatMap(([name, theme]) => validateTheme(theme).filter(result => !result.pass).map(result => ({ theme: name, ...result })));
  if (failures.length) throw new Error(`Accessibility validation failed:\n${JSON.stringify(failures, null, 2)}`);
  return Object.fromEntries(Object.entries(themes).map(([name, theme]) => [name, validateTheme(theme)]));
}

