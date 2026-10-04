const html = document.documentElement;
html.dataset.theme = localStorage.getItem("relay-theme") ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
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
const generationMode = document.querySelector("#generation-mode");
const agents = ["discovery", "system", "builder", "reviewer"];
let eventSource;

function updateCount() { counter.textContent = `${prd.value.length.toLocaleString()} / 12,000`; }
updateCount(); prd.addEventListener("input", updateCount);

fetch("/api/playground/status").then(response => response.json()).then(status => {
  document.querySelector("#runtime-light").classList.add("ready");
  document.querySelector("#runtime-name").textContent = status.aiConfigured ? "AI frontend builder ready" : "Local frontend builder ready";
  document.querySelector("#runtime-detail").textContent = status.aiConfigured ? `${status.defaultModel} · real React builds` : "Real workspaces · add OPENAI_API_KEY for AI planning";
  const option = document.querySelector("#ai-option");
  if (!status.aiConfigured) { option.disabled = true; option.textContent = "OpenAI agents — API key required"; }
}).catch(() => { document.querySelector("#runtime-name").textContent = "Builder unavailable"; });

form.addEventListener("submit", async event => {
  event.preventDefault(); error.hidden = true;
  if (prd.value.trim().length < 30) return showError("Add a little more detail to the PRD before generating.");
  const patterns = [...form.querySelectorAll('input[name="pattern"]:checked')].map(input => input.value);
  setLoading(true); resetAgents(); showBuildCanvas();
  try {
    const response = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prd: prd.value, patterns, mode: form.elements.mode.value }) });
    const run = await response.json();
    if (!response.ok) throw new Error(run.error ?? "Could not start the build");
    generationMode.textContent = `Run ${run.id.slice(0, 8)}`;
    watchRun(run.id);
  } catch (caught) { setLoading(false); showError(caught.message); }
});

function watchRun(id) {
  eventSource?.close();
  eventSource = new EventSource(`/api/runs/${id}/events`);
  eventSource.onmessage = async message => {
    const event = JSON.parse(message.data);
    handleBuildEvent(event);
    if (["ready", "failed", "canceled"].includes(event.state)) {
      eventSource.close(); setLoading(false);
      const run = await fetch(`/api/runs/${id}`).then(response => response.json());
      if (run.state === "ready") showResult(run); else showError(run.error ?? "The build did not complete");
    }
  };
  eventSource.onerror = () => { if (button.disabled) { setLoading(false); showError("Lost the build event stream. The run may still be available after refreshing."); } };
}

function handleBuildEvent(event) {
  const stateAgent = { analyzing: "discovery", planning: "system", provisioning: "builder", building: "builder", validating: "reviewer", ready: "reviewer" };
  const current = stateAgent[event.state];
  if (current) {
    const currentIndex = agents.indexOf(current);
    agents.forEach((agent, index) => { if (index < currentIndex) setAgent(agent, "complete", "Complete"); });
    setAgent(current, event.state === "ready" ? "complete" : "running", event.message);
  }
  generationMode.textContent = event.state.replaceAll("_", " ");
  appendBuildLog(event.message);
}

function showBuildCanvas() {
  frame.replaceChildren();
  const canvas = element("div", "build-canvas");
  canvas.append(element("div", "build-spinner", "✦"), element("h2", "", "Building a real React project"), element("p", "", "The runtime is creating source files, compiling the application, and validating the result."), element("ol", "build-log"));
  frame.append(canvas); drawer.hidden = true; removeDownload();
}
function appendBuildLog(message) { const log = frame.querySelector(".build-log"); if (log) log.append(element("li", "", message)); }

function showResult(run) {
  frame.replaceChildren();
  const iframe = element("iframe", "generated-preview");
  iframe.title = `${run.result.prototype.name} generated prototype`;
  iframe.src = run.previewUrl;
  iframe.setAttribute("sandbox", "allow-scripts");
  frame.append(iframe);
  addDownload(run.artifactUrl); renderDecisions(run);
  generationMode.textContent = "Build passed";
}

function renderDecisions(run) {
  const list = document.querySelector("#decision-list"); list.replaceChildren();
  run.events.filter(event => !["queue", "packager"].includes(event.agent)).forEach(event => { const item = element("li"); item.append(element("strong", "", `${title(event.agent)} · ${title(event.state)}`), element("span", "", event.message)); list.append(item); });
  const review = element("li"); review.append(element("strong", "", "Production validation"), element("span", "", `Vite build passed. ${run.result.review.passed}/${run.result.review.checks.length} accessibility policy checks passed.`)); list.append(review);
  drawer.hidden = false;
}

function addDownload(url) { removeDownload(); const link = element("a", "source-download", "Download source"); link.href = url; link.setAttribute("download", ""); document.querySelector(".viewport-controls").before(link); }
function removeDownload() { document.querySelector(".source-download")?.remove(); }
function setLoading(loading) { button.disabled = loading; button.setAttribute("aria-busy", String(loading)); button.querySelector("span:nth-child(2)").textContent = loading ? "Building frontend…" : "Generate prototype"; }
function resetAgents() { agents.forEach(agent => setAgent(agent, "", "Waiting")); }
function setAgent(agent, state, detail) { const node = document.querySelector(`[data-agent="${agent}"]`); node.className = state; node.querySelector("small").textContent = detail.length > 24 ? `${detail.slice(0, 22)}…` : detail; node.title = detail; }
function showError(message) { error.textContent = message; error.hidden = false; generationMode.textContent = "Failed"; }
function title(value) { return value.replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase()); }

document.addEventListener("keydown", event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") form.requestSubmit(); });
document.querySelectorAll("[data-width]").forEach(control => control.addEventListener("click", () => { document.querySelectorAll("[data-width]").forEach(item => item.classList.remove("active")); control.classList.add("active"); frame.classList.toggle("mobile", control.dataset.width === "mobile"); }));
document.querySelector("#close-decisions").addEventListener("click", () => { drawer.hidden = true; });
function element(tag, className = "", text = "") { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
