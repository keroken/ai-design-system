const manifest = await fetch("/generated/design-system.manifest.json").then(response => {
  if (!response.ok) throw new Error("Design-system manifest is unavailable");
  return response.json();
});

const storedTheme = localStorage.getItem("relay-theme");
const preferredTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
document.documentElement.dataset.theme = storedTheme ?? preferredTheme;

const themeButton = document.querySelector(".theme-toggle");
function updateThemeButton() {
  if (!themeButton) return;
  const dark = document.documentElement.dataset.theme === "dark";
  themeButton.querySelector(".theme-label").textContent = dark ? "Light" : "Dark";
  themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
}
updateThemeButton();
themeButton?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("relay-theme", next);
  updateThemeButton();
});

const currentPath = location.pathname.replace(/index\.html$/, "");
const primaryNav = document.querySelector(".site-nav");
if (primaryNav && !primaryNav.querySelector('a[href="/playground/"]')) {
  const playgroundLink = document.createElement("a");
  playgroundLink.href = "/playground/";
  playgroundLink.textContent = "Playground";
  const architectureLink = [...primaryNav.querySelectorAll("a")].find(link => link.textContent === "Architecture");
  primaryNav.insertBefore(playgroundLink, architectureLink ?? null);
}
document.querySelectorAll(".site-nav a").forEach(link => {
  const target = new URL(link.href).pathname;
  if (target !== "/" && currentPath.startsWith(target)) link.setAttribute("aria-current", "page");
});

function setCount(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}
setCount("#token-count", Object.keys(manifest.tokenDefinitions).length);
setCount("#component-count", manifest.recipes.length);
setCount("#check-count", Object.values(manifest.accessibility.validation).flat().filter(check => check.pass).length);

const layers = [
  ["Contracts", "Stable schemas"], ["Foundations", "Raw visual values"], ["Semantic tokens", "Meaning and themes"],
  ["Accessibility", "Policy and gates"], ["Primitives", "Headless behavior"], ["Recipes", "Visual variants"],
  ["Patterns", "Information structure"], ["Compositions", "Product assemblies"], ["Orchestration", "AI-readable output"]
];
const layerList = document.querySelector("#layers");
if (layerList) layerList.innerHTML = layers.map(([name, description], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><strong>${name}</strong><small>${description}</small></li>`).join("");

const tokenGrid = document.querySelector("#token-grid");
if (tokenGrid) {
  tokenGrid.innerHTML = Object.entries(manifest.themes.light).map(([name, token]) => {
    const isColor = token.$type === "color";
    return `<article class="token-row">
      <div class="token-preview ${isColor ? "is-color" : ""}" ${isColor ? `style="--preview:${token.$value}"` : ""}>${isColor ? "" : token.$value}</div>
      <div><code>${name}</code><p>${token.$description}</p></div>
      <code class="token-value">${token.$value}</code><code class="token-source">${token.$source}</code>
    </article>`;
  }).join("");
}

const componentGrid = document.querySelector("#component-grid");
if (componentGrid) {
  componentGrid.innerHTML = manifest.recipes.map(recipe => `<article class="component-card">
    <div class="component-preview ${recipe.base === "field" ? "field-preview" : "button-preview"}">
      ${recipe.base === "field" ? '<label>Email address</label><input type="email" placeholder="you@example.com">' : '<button class="button button-primary" type="button">Continue <span aria-hidden="true">→</span></button>'}
    </div>
    <div class="component-body"><div><p class="eyebrow">Recipe</p><h3>${recipe.name}</h3></div><span class="badge">${recipe.states.length} states</span></div>
    <p>${recipe.tokens.length} semantic tokens · ${Object.keys(recipe.variants).length} variant groups</p>
    <div class="chip-row">${recipe.states.map(state => `<span>${state}</span>`).join("")}</div>
  </article>`).join("");
}

const checks = document.querySelector("#a11y-checks");
if (checks) {
  checks.innerHTML = Object.entries(manifest.accessibility.validation).flatMap(([theme, results]) => results.map(result => `<li><span class="checkmark">✓</span><div><strong>${result.foreground} on ${result.background}</strong><small>${theme} · ${result.ratio}:1 ratio · ${result.required}:1 required</small></div><span class="badge badge-pass">Pass</span></li>`)).join("");
}

const taskForm = document.querySelector("#task-form");
taskForm?.addEventListener("submit", event => {
  event.preventDefault();
  const input = taskForm.querySelector("input");
  if (!input.value.trim()) return;
  const item = document.createElement("li");
  item.className = "task-item";
  item.innerHTML = `<button class="task-check" type="button" aria-label="Mark ${escapeHtml(input.value)} complete"></button><span>${escapeHtml(input.value)}</span><span class="tag tag-blue">New</span>`;
  document.querySelector("#task-list").prepend(item);
  input.value = "";
  document.querySelector("#example-status").textContent = "Task added";
});

document.querySelector("#task-list")?.addEventListener("click", event => {
  const button = event.target.closest(".task-check");
  if (!button) return;
  const item = button.closest(".task-item");
  item.classList.toggle("complete");
  button.textContent = item.classList.contains("complete") ? "✓" : "";
  button.setAttribute("aria-label", item.classList.contains("complete") ? "Mark task incomplete" : "Mark task complete");
});

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}
