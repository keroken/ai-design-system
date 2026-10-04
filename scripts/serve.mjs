import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { generatePrototype, createOpenAIProvider } from "@ai-ds/prototype-agents";
import { BuildRunManager } from "@ai-ds/builder-runtime";

const root = path.resolve("apps/demo/public");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".jsx": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const provider = process.env.OPENAI_API_KEY ? createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL ?? "gpt-6-luna" }) : undefined;
const runs = new BuildRunManager({ provider });
await runs.init();

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/api/playground/status") return sendJson(response, 200, { aiConfigured: Boolean(provider), builderConfigured: true, runtime: "local-workspace", defaultModel: process.env.OPENAI_MODEL ?? "gpt-6-luna" });
    if (request.method === "POST" && url.pathname === "/api/runs") {
      const body = await readJson(request);
      if (body.mode === "ai" && !provider) return sendJson(response, 503, { error: "AI mode requires OPENAI_API_KEY. The local builder is available now." });
      const run = await runs.create({ prd: body.prd, patterns: body.patterns, mode: body.mode });
      return sendJson(response, 202, run);
    }
    const runMatch = url.pathname.match(/^\/api\/runs\/([a-f0-9-]+)(?:\/(.*))?$/);
    if (request.method === "GET" && runMatch) {
      const [, id, action = ""] = runMatch;
      const run = runs.get(id);
      if (!run) return sendJson(response, 404, { error: "Run not found" });
      if (!action) return sendJson(response, 200, run);
      if (action === "events") return streamEvents(request, response, id, run);
      if (action === "artifact") return streamArtifact(response, runs.artifact(id), `${run.result?.prototype?.name ?? "relay-prototype"}.tgz`);
      if (action === "preview" || action.startsWith("preview/")) {
        if (run.state !== "ready") return sendJson(response, 409, { error: "Preview is not ready" });
        const relative = action.slice("preview".length).replace(/^\//, "") || "index.html";
        return serveFile(request, response, path.join(runs.workspace(id), "dist"), relative);
      }
    }
    if (request.method === "POST" && url.pathname === "/api/prototypes") {
      const body = await readJson(request);
      if (body.mode === "ai" && !provider) return sendJson(response, 503, { error: "AI mode requires OPENAI_API_KEY on the server." });
      const result = await generatePrototype({ prd: body.prd, patterns: body.patterns, provider: body.mode === "local" ? undefined : provider });
      return sendJson(response, 200, result);
    }
    if (request.method !== "GET" && request.method !== "HEAD") return sendJson(response, 405, { error: "Method not allowed" });
    const relative = decodeURIComponent(url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, ""));
    return serveFile(request, response, root, relative);
  } catch (error) {
    const status = error.status ?? (error instanceof SyntaxError || error instanceof TypeError ? 400 : 404);
    return sendJson(response, status, { error: status === 404 ? "Not found" : error.message });
  }
}).listen(4173, "127.0.0.1", () => console.log("Relay: http://localhost:4173"));

function streamEvents(request, response, id, run) {
  response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" });
  const send = event => response.write(`id: ${event.sequence}\ndata: ${JSON.stringify(event)}\n\n`);
  run.events.forEach(send);
  if (["ready", "failed", "canceled"].includes(run.state)) { response.end(); return; }
  const unsubscribe = runs.subscribe(id, event => { send(event); if (["ready", "failed", "canceled"].includes(event.state)) { clearInterval(heartbeat); unsubscribe(); response.end(); } });
  const heartbeat = setInterval(() => response.write(": heartbeat\n\n"), 15_000);
  request.on("close", () => { clearInterval(heartbeat); unsubscribe(); });
}

async function streamArtifact(response, file, downloadName) {
  if (!file || !(await stat(file).catch(() => null))) return sendJson(response, 404, { error: "Artifact not found" });
  response.writeHead(200, { "content-type": "application/gzip", "content-disposition": `attachment; filename="${slug(downloadName)}"` });
  createReadStream(file).pipe(response);
}

async function serveFile(request, response, base, relative) {
  let file = path.resolve(base, relative);
  if (file !== base && !file.startsWith(`${base}${path.sep}`)) throw Object.assign(new Error("Invalid path"), { status: 400 });
  const info = await stat(file);
  if (info.isDirectory()) file = path.join(file, "index.html");
  response.setHeader("content-type", `${types[path.extname(file)] ?? "application/octet-stream"}; charset=utf-8`);
  const content = await readFile(file);
  response.end(request.method === "HEAD" ? undefined : content);
}

function sendJson(response, status, value) { response.writeHead(status, jsonHeaders); response.end(JSON.stringify(value)); }
function slug(value) { return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, ""); }
async function readJson(request) {
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > 64 * 1024) throw Object.assign(new Error("Request body is too large"), { status: 413 }); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
