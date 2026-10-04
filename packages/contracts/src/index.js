export const tokenKinds = Object.freeze(["color", "dimension", "fontFamily", "fontWeight", "duration", "cubicBezier"]);

export function defineTokenGroup(group) {
  if (!group || typeof group !== "object" || Array.isArray(group)) throw new TypeError("Token group must be an object");
  return Object.freeze(group);
}

export function defineComponent(component) {
  for (const key of ["name", "anatomy", "variants", "a11y"]) {
    if (!(key in component)) throw new TypeError(`Component contract is missing ${key}`);
  }
  return Object.freeze(component);
}

