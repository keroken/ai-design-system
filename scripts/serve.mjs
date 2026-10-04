import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("apps/demo/public");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) throw new Error("Invalid path");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.setHeader("content-type", `${types[path.extname(file)] ?? "application/octet-stream"}; charset=utf-8`);
    response.end(await readFile(file));
  } catch {
    response.statusCode = 404;
    response.end("Not found");
  }
}).listen(4173, "127.0.0.1", () => console.log("Demo: http://localhost:4173"));
