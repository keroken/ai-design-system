import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("../packages/", import.meta.url);
const names = await readdir(root);
const packages = new Map();

for (const name of names) {
  const manifestPath = new URL(`${name}/package.json`, root);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  packages.set(manifest.name, manifest);
}

const errors = [];
for (const [name, manifest] of packages) {
  const layer = manifest.designSystem?.layer;
  if (!Number.isInteger(layer)) errors.push(`${name} has no integer designSystem.layer`);
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    if (!dependency.startsWith("@ai-ds/")) continue;
    const target = packages.get(dependency);
    if (!target) errors.push(`${name} references missing workspace ${dependency}`);
    else if (name !== "@ai-ds/orchestrator" && target.designSystem.layer >= layer) {
      errors.push(`${name} cannot depend on layer ${target.designSystem.layer} package ${dependency}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Architecture valid: ${packages.size} ordered packages.`);

