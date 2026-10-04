const html = document.documentElement;
const storedTheme = localStorage.getItem("relay-theme");
html.dataset.theme = storedTheme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const themeButton = document.querySelector(".theme-toggle");
function syncTheme() { const dark = html.dataset.theme === "dark"; themeButton.querySelector(".theme-label").textContent = dark ? "Light" : "Dark"; themeButton.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`); }
syncTheme();
themeButton.addEventListener("click", () => { html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark"; localStorage.setItem("relay-theme", html.dataset.theme); syncTheme(); });

const form = document.querySelector("#prototype-form");
const prd = document.querySelector("#prd");
const counter = document.querySelector("#character-count");
const error = document.querySelector("#form-error");
const button = form.querySelector("button[type=submit]");
const frame = document.querySelector("#prototype-frame");
const drawer = document.querySelector("#decision-drawer");
const agents = ["discovery", "system", "builder", "reviewer"];
let animation;

function updateCount() { counter.textContent = `${prd.value.length.toLocaleString()} / 12,000`; }
updateCount(); prd.addEventListener("input", updateCount);

fetch("/api/playground/status").then(response => response.json()).then(status => {
  document.querySelector("#runtime-light").classList.add("ready");
  document.querySelector("#runtime-name").textContent = status.aiConfigured ? "OpenAI agents ready" : "Local agents ready";
  document.querySelector("#runtime-detail").textContent = status.aiConfigured ? `${status.defaultModel} · structured output` : "Add OPENAI_API_KEY for model-backed generation";
  const option = document.querySelector("#ai-option");
  if (!status.aiConfigured) { option.disabled = true; option.textContent = "OpenAI agents — API key required"; }
}).catch(() => { document.querySelector("#runtime-name").textContent = "Runtime unavailable"; });

form.addEventListener("submit", async event => {
  event.preventDefault(); error.hidden = true;
  if (prd.value.trim().length < 30) { showError("Add a little more detail to the PRD before generating."); return; }
  const patterns = [...form.querySelectorAll('input[name="pattern"]:checked')].map(input => input.value);
  setLoading(true); animateAgents();
  try {
    const response = await fetch("/api/prototypes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prd: prd.value, patterns, mode: form.elements.mode.value }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Prototype generation failed");
    finishAgents(result.trace); renderPrototype(result.prototype); renderDecisions(result);
    document.querySelector("#generation-mode").textContent = result.mode === "ai" ? "OpenAI agents" : "Local agents";
  } catch (caught) { resetAgents(); showError(caught.message); }
  finally { setLoading(false); }
});

document.addEventListener("keydown", event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") form.requestSubmit(); });
document.querySelectorAll("[data-width]").forEach(control => control.addEventListener("click", () => { document.querySelectorAll("[data-width]").forEach(item => item.classList.remove("active")); control.classList.add("active"); frame.classList.toggle("mobile", control.dataset.width === "mobile"); }));
document.querySelector("#close-decisions").addEventListener("click", () => { drawer.hidden = true; });

function setLoading(loading) { button.disabled = loading; button.setAttribute("aria-busy", String(loading)); button.querySelector("span:nth-child(2)").textContent = loading ? "Agents are working…" : "Generate prototype"; }
function animateAgents() { resetAgents(); let index = 0; setAgent(agents[index], "running", "Analyzing"); animation = setInterval(() => { setAgent(agents[index], "complete", "Complete"); index = Math.min(index + 1, agents.length - 1); setAgent(agents[index], "running", "Working"); if (index === agents.length - 1) clearInterval(animation); }, 700); }
function finishAgents(trace) { clearInterval(animation); agents.forEach((agent, index) => setAgent(agent, "complete", trace[index]?.summary ?? "Complete")); }
function resetAgents() { clearInterval(animation); agents.forEach(agent => setAgent(agent, "", "Waiting")); }
function setAgent(agent, state, detail) { const node = document.querySelector(`[data-agent="${agent}"]`); node.className = state; node.querySelector("small").textContent = detail.length > 22 ? `${detail.slice(0, 20)}…` : detail; node.title = detail; }
function showError(message) { error.textContent = message; error.hidden = false; }

function renderPrototype(prototype) {
  frame.replaceChildren();
  const appbar = element("header", "generated-appbar");
  const brand = element("div", "generated-brand"); brand.append(element("span", "generated-mark", prototype.name.charAt(0).toUpperCase()), document.createTextNode(prototype.name));
  const nav = element("nav", "generated-nav"); ["Overview", "Projects", "Reports"].forEach(item => nav.append(element("span", "", item)));
  appbar.append(brand, nav, element("span", "generated-avatar", "MK"));
  const main = element("div", "generated-main");
  const titlebar = element("div", "generated-titlebar"); const heading = element("div"); heading.append(element("h2", "", prototype.title), element("p", "", prototype.subtitle)); titlebar.append(heading, element("button", "button button-primary", prototype.primaryAction)); main.append(titlebar);
  if (prototype.metrics.length) { const metrics = element("div", "generated-metrics"); prototype.metrics.forEach(metric => { const card = element("div"); card.append(element("span", "", metric.label), element("strong", "", metric.value)); metrics.append(card); }); main.append(metrics); }
  prototype.sections.forEach(section => { const container = element("section", "generated-section"); container.append(element("h3", "", section.heading)); section.items.forEach(item => { const row = element("div", "generated-row"); const copy = element("div"); copy.append(element("strong", "", item.title), element("small", "", item.meta)); row.append(copy, element("span", `generated-status ${item.status}`, item.status)); container.append(row); }); main.append(container); });
  frame.append(appbar, main);
}

function renderDecisions(result) {
  const list = document.querySelector("#decision-list"); list.replaceChildren();
  result.trace.forEach(trace => { const item = element("li"); const agent = trace.agent.replace(/^./, letter => letter.toUpperCase()); item.append(element("strong", "", `${agent} agent`), element("span", "", trace.summary)); list.append(item); });
  const review = element("li"); review.append(element("strong", "", result.review.standard), element("span", "", `${result.review.passed}/${result.review.checks.length} automated checks passed.`)); list.append(review);
  drawer.hidden = false;
}
function element(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
