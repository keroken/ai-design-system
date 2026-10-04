import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { BuildRunManager, renderAppSource } from "@ai-ds/builder-runtime";

const prd = "Atlas is an order management app for operations teams. Users review orders, resolve exceptions, and track fulfillment status.";

test("builder renders real React source from a prototype contract", () => {
  const source = renderAppSource({ name: "Atlas", screenKind: "dashboard", title: "Overview", subtitle: "Track work", primaryAction: "Create order", metrics: [], sections: [] });
  assert.match(source, /export default function App/);
  assert.match(source, /useState/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
});

test("build run creates and validates an exportable React project", async () => {
  const repository = process.cwd();
  const root = await mkdtemp(path.join(os.tmpdir(), "relay-builder-"));
  await mkdir(path.join(root, "templates"), { recursive: true });
  await mkdir(path.join(root, "apps", "demo", "public", "generated"), { recursive: true });
  await cp(path.join(repository, "templates", "react-app"), path.join(root, "templates", "react-app"), { recursive: true });
  await cp(path.join(repository, "apps", "demo", "public", "generated", "tokens.css"), path.join(root, "apps", "demo", "public", "generated", "tokens.css"));
  await symlink(path.join(repository, "node_modules"), path.join(root, "node_modules"), "dir");
  const manager = new BuildRunManager({ rootDir: root, viteBin: path.join(repository, "node_modules", ".bin", "vite") });
  await manager.init();
  const created = await manager.create({ prd, patterns: ["Dashboard", "Data table"] });
  const finished = await manager.waitFor(created.id);
  assert.equal(finished.state, "ready", finished.error);
  assert.equal(finished.validation.build, "passed");
  assert.match(finished.previewUrl, /preview/);
  assert.match(finished.artifactUrl, /artifact/);
});
