#!/usr/bin/env bun
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderComponents } from "../src/render-components";

/**
 * Writes `src/components.generated.ts` from the registry at the repository root.
 *
 * The skill itself deliberately carries no component catalogue — it teaches the
 * agent to run `delacour list` — but `delacour skills --list` and the docs
 * page both need the names without a network, and a list typed by hand would be
 * wrong by the next component. So it is derived, committed, and CI diffs it.
 */

const ROOT = join(import.meta.dirname, "../../..");
const REGISTRY = join(ROOT, "registry/registry.json");
const OUT = join(import.meta.dirname, "../src/components.generated.ts");

const index = (await Bun.file(REGISTRY).json()) as {
	items: { name: string; type: string; title: string; description: string }[];
};

await writeFile(OUT, renderComponents(index.items), "utf-8");
process.stdout.write(`Wrote ${OUT}\n`);
