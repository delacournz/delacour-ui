#!/usr/bin/env bun
import { homedir } from "node:os";
import { join } from "node:path";
import { globalPaths, restoreLinks, type Snapshot, snapshotLinks } from "./link/state";

/**
 * Puts this tree's CLI on PATH as `delacour`, and takes it off again.
 *
 * `link` is `bun link` with a memory: it records what the two global entries held before bun
 * replaces them, so `unlink` restores that — another worktree's link, a published install, or
 * nothing — instead of leaving the machine without the `delacour` it had. See `./link/state.ts`.
 *
 * Usage, from the repository root:
 *   bun run cli:link      # build, then link
 *   bun run cli:unlink    # restore whatever was there before
 */

const PACKAGE_DIR = join(import.meta.dirname, "..");
const manifest: { name: string; bin: Record<string, string> } = await Bun.file(
	join(PACKAGE_DIR, "package.json")
).json();
const binName = Object.keys(manifest.bin)[0] ?? manifest.name;
const paths = globalPaths(process.env, homedir(), manifest.name, binName);

const DESCRIPTION: Record<Snapshot["kind"], string> = {
	absent: "nothing — it is removed",
	symlink: "the link that was there",
	moved: "the installed copy that was there",
};

const command = process.argv[2];

if (command === "link") {
	snapshotLinks(paths);
	const { exitCode } = Bun.spawnSync(["bun", "link"], { cwd: PACKAGE_DIR, stdout: "ignore", stderr: "inherit" });
	if (exitCode !== 0) {
		restoreLinks(paths, PACKAGE_DIR);
		console.error("✗ `bun link` failed; the previous `delacour` is back in place.");
		process.exit(1);
	}
	console.log(`✓ ${binName} → ${PACKAGE_DIR}\n  \`bun run cli:unlink\` restores what was there before.`);
} else if (command === "unlink") {
	const outcome = restoreLinks(paths, PACKAGE_DIR);
	if (outcome.kind === "restored") console.log(`✓ ${binName} restored to ${DESCRIPTION[outcome.module]}.`);
	if (outcome.kind === "replaced") console.log(`${binName} has been installed for real since the link; left alone.`);
	if (outcome.kind === "not-linked") console.log(`${binName} is not linked to this tree; nothing to restore.`);
} else {
	console.error("Usage: bun scripts/link.ts <link|unlink>");
	process.exit(1);
}
