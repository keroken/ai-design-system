import { EventEmitter } from "node:events";
import { execFile } from "node:child_process";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { generatePrototype } from "@ai-ds/prototype-agents";

const exec = promisify(execFile);
const terminalStates = new Set(["ready", "failed", "canceled"]);

export class BuildRunManager {
  constructor({ rootDir, provider, viteBin } = {}) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    this.rootDir = rootDir ?? path.resolve(here, "../../..");
    this.runsDir = path.join(this.rootDir, ".relay", "runs");
    this.templateDir = path.join(this.rootDir, "templates", "react-app");
    this.viteBin = viteBin ?? path.join(this.rootDir, "node_modules", ".bin", "vite");
    this.provider = provider;
    this.runs = new Map();
    this.events = new EventEmitter();
    this.events.setMaxListeners(100);
  }

  async init() {
    await mkdir(this.runsDir, { recursive: true });
    for (const id of await readdir(this.runsDir).catch(() => [])) {
      const saved = await readJson(path.join(this.runsDir, id, "run.json")).catch(() => null);
      if (saved) this.runs.set(id, saved);
    }
  }

  async create(input) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const run = { id, state: "queued", createdAt: now, updatedAt: now, input, events: [], result: null, error: null, validation: null };
    this.runs.set(id, run);
    await this.persist(run);
    this.emit(run, "queue", "Generation queued.");
    queueMicrotask(() => this.execute(run).catch(() => {}));
    return publicRun(run);
  }

  get(id) { const run = this.runs.get(id); return run ? publicRun(run) : null; }
  workspace(id) { return this.runs.has(id) ? path.join(this.runsDir, id, "workspace") : null; }
  artifact(id) { return this.runs.has(id) ? path.join(this.runsDir, id, "source.tgz") : null; }
  subscribe(id, listener) { this.events.on(id, listener); return () => this.events.off(id, listener); }

  async waitFor(id, timeoutMs = 30_000) {
    const current = this.runs.get(id);
    if (!current) throw new Error("Unknown run");
    if (terminalStates.has(current.state)) return publicRun(current);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { cleanup(); reject(new Error("Timed out waiting for run")); }, timeoutMs);
      const listener = () => { const run = this.runs.get(id); if (terminalStates.has(run.state)) { cleanup(); resolve(publicRun(run)); } };
      const cleanup = () => { clearTimeout(timer); this.events.off(id, listener); };
      this.events.on(id, listener);
    });
  }

  async execute(run) {
    try {
      await this.transition(run, "analyzing", "discovery", "Extracting requirements from the PRD.");
      const activeProvider = run.input.mode === "local" ? undefined : this.provider;
      const result = await generatePrototype({ ...run.input, provider: activeProvider });
      run.result = result;
      await this.transition(run, "planning", "system", `Planning ${result.plan.screenKind} with ${result.plan.patterns.join(", ")}.`);

      const runDir = path.join(this.runsDir, run.id);
      const workspace = path.join(runDir, "workspace");
      await this.transition(run, "provisioning", "builder", "Creating an isolated project workspace from the React template.");
      await mkdir(runDir, { recursive: true });
      await cp(this.templateDir, workspace, { recursive: true });
      await cp(path.join(this.rootDir, "apps", "demo", "public", "generated", "tokens.css"), path.join(workspace, "src", "tokens.css"));
      await writeFile(path.join(workspace, "src", "App.jsx"), renderAppSource(result.prototype));
      await writeFile(path.join(workspace, "generation.json"), `${JSON.stringify(result, null, 2)}\n`);
      await writeFile(path.join(workspace, "README.md"), generatedReadme(run, result));

      await this.transition(run, "building", "builder", "Writing React source and production assets.");
      const build = await exec(this.viteBin, ["build"], { cwd: workspace, timeout: 60_000, maxBuffer: 1024 * 1024 });
      run.validation = { build: "passed", output: build.stdout.trim().split("\n").slice(-4), accessibility: result.review };
      await this.transition(run, "validating", "reviewer", `${result.review.passed}/${result.review.checks.length} policy checks passed; production build succeeded.`);

      await exec("tar", ["-czf", path.join(runDir, "source.tgz"), "-C", workspace, "."], { timeout: 30_000 });
      await this.transition(run, "ready", "packager", "Preview and source artifact are ready.");
    } catch (error) {
      run.error = error.stderr?.trim() || error.message;
      await this.transition(run, "failed", "runtime", `Generation failed: ${run.error}`);
    }
  }

  async transition(run, state, agent, message) {
    run.state = state;
    run.updatedAt = new Date().toISOString();
    this.emit(run, agent, message);
    await this.persist(run);
  }

  emit(run, agent, message) {
    const event = { sequence: run.events.length + 1, at: new Date().toISOString(), state: run.state, agent, message };
    run.events.push(event);
    this.events.emit(run.id, event);
  }

  async persist(run) {
    const directory = path.join(this.runsDir, run.id);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "run.json"), `${JSON.stringify(run, null, 2)}\n`);
  }
}

export function renderAppSource(prototype) {
  const data = JSON.stringify(prototype, null, 2);
  return `import { useState } from "react";
import "./tokens.css";
import "./base.css";

const prototype = ${data};

export default function App() {
  const [activeView, setActiveView] = useState("Overview");
  const [notice, setNotice] = useState("");
  const views = ["Overview", "Work", "Reports"];
  return <div className="app-shell">
    <header className="app-header">
      <a className="product" href="#main"><span>{prototype.name.slice(0, 1).toUpperCase()}</span>{prototype.name}</a>
      <nav aria-label="Product navigation">{views.map(view => <button className={activeView === view ? "active" : ""} onClick={() => setActiveView(view)} key={view}>{view}</button>)}</nav>
      <div className="avatar" aria-label="Signed in as Mika">MK</div>
    </header>
    <main id="main">
      <div className="title-row"><div><p className="overline">{prototype.screenKind} · {activeView}</p><h1>{prototype.title}</h1><p>{prototype.subtitle}</p></div><button className="primary" onClick={() => setNotice(prototype.primaryAction + " started")}>{prototype.primaryAction}</button></div>
      {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
      <section className="metrics" aria-label="Summary">{prototype.metrics.map(metric => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>)}</section>
      <div className="content-grid">{prototype.sections.map(section => <section className="panel" key={section.heading}><header><div><p className="pattern">{section.pattern}</p><h2>{section.heading}</h2></div><button aria-label={"More options for " + section.heading}>•••</button></header><ul>{section.items.map(item => <li key={item.title}><span className={"status " + item.status}></span><div><strong>{item.title}</strong><small>{item.meta}</small></div><span className={"tag " + item.status}>{item.status}</span></li>)}</ul></section>)}</div>
    </main>
  </div>;
}
`;
}

function generatedReadme(run, result) {
  return `# ${result.prototype.name}\n\nGenerated from a Relay product brief.\n\n- Run: ${run.id}\n- Screen: ${result.plan.screenKind}\n- Patterns: ${result.plan.patterns.join(", ")}\n- Accessibility: ${result.review.passed}/${result.review.checks.length} checks passed\n\n## Run locally\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`;
}

function publicRun(run) {
  return { ...run, previewUrl: run.state === "ready" ? `/api/runs/${run.id}/preview/` : null, artifactUrl: run.state === "ready" ? `/api/runs/${run.id}/artifact` : null };
}

async function readJson(file) { return JSON.parse(await readFile(file, "utf8")); }
