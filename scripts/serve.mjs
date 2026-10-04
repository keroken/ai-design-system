import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { generatePrototype, createOpenAIProvider } from "@ai-ds/prototype-agents";

const root = path.resolve("apps/demo/public");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/api/playground/status") {
      response.writeHead(200, jsonHeaders);
      response.end(JSON.stringify({ aiConfigured: Boolean(process.env.OPENAI_API_KEY), defaultModel: process.env.OPENAI_MODEL ?? "gpt-6-luna" }));
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/prototypes") {
      const body = await readJson(request);
      const wantsAI = body.mode === "ai" || (body.mode !== "local" && process.env.OPENAI_API_KEY);
      if (body.mode === "ai" && !process.env.OPENAI_API_KEY) {
        response.writeHead(503, jsonHeaders);
        response.end(JSON.stringify({ error: "AI mode requires OPENAI_API_KEY on the server. Local agent mode is available now." }));
        return;
      }
      const provider = wantsAI ? createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL ?? "gpt-6-luna" }) : undefined;
      const result = await generatePrototype({ prd: body.prd, patterns: body.patterns, provider });
      response.writeHead(200, jsonHeaders);
      response.end(JSON.stringify(result));
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, jsonHeaders);
      response.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    let file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) throw Object.assign(new Error("Invalid path"), { status: 400 });
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.setHeader("content-type", `${types[path.extname(file)] ?? "application/octet-stream"}; charset=utf-8`);
    const content = await readFile(file);
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    const status = error.status ?? (error instanceof SyntaxError || error instanceof TypeError ? 400 : 404);
    response.writeHead(status, jsonHeaders);
    response.end(JSON.stringify({ error: status === 404 ? "Not found" : error.message }));
  }
}).listen(4173, "127.0.0.1", () => console.log("Demo: http://localhost:4173"));

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw Object.assign(new Error("Request body is too large"), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
