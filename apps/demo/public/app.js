const manifest = await fetch("/generated/design-system.manifest.json").then(response => response.json());
const layers = ["Contracts", "Foundations", "Semantic tokens", "Accessibility", "Primitives", "Recipes", "Patterns", "Compositions", "AI orchestration"];
document.querySelector("#layers").innerHTML = layers.map((layer, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span>${layer}</li>`).join("");
document.querySelector("#token-count").textContent = Object.keys(manifest.tokenDefinitions).length;
document.querySelector("#component-count").textContent = manifest.recipes.length;
document.querySelector("#check-count").textContent = Object.values(manifest.accessibility.validation).flat().filter(check => check.pass).length;

const themeButton = document.querySelector(".theme");
themeButton.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeButton.textContent = dark ? "Light mode" : "Dark mode";
  themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
});

document.querySelector("form").addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector(".status").hidden = false;
});

