#!/usr/bin/env bun
import { homedir } from "node:os";
import { join } from "node:path";
import {
	globalPaths,
	linkPaths,
	restoreBunLink,
	restoreLink,
	type Snapshot,
	shimFor,
	snapshotLink,
	writeShim,
} from "./link/state";

/**
 * Puts this tree's CLI on PATH as `delacour`, running from source, and takes it off again.
 *
 *   bun run cli:link      # <bun bin>/delacour becomes a shim to this tree's src/index.ts
 *   bun run cli:unlink    # whatever was there before: a published install, another tree, or nothing
 *   bun run cli:status    # what `delacour` on PATH runs, and which registry it reads
 *
 * The shim runs the source under bun, so nothing is built and an edit is live on the next run. It
 * also sets `DELACOUR_REGISTRY` to this tree's `registry/`, so a linked `add` or `update` copies
 * this branch's components — what a reader will get once it merges — rather than `main`'s.
 * `DELACOUR_REGISTRY=` (empty) or `--registry` reads another. See `./link/state.ts` for the memory.
 */

const PACKAGE_DIR = join(import.meta.dirname, "..");
const REPO_DIR = join(PACKAGE_DIR, "..", "..");
const CLI_PATH = join(PACKAGE_DIR, "src", "index.ts");
const REGISTRY_DIR = join(REPO_DIR, "registry");

const manifest: { name: string; bin: Record<string, string> } = await Bun.file(
	join(PACKAGE_DIR, "package.json")
).json();
const binName = Object.keys(manifest.bin)[0] ?? manifest.name;
const home = process.env.HOME ?? homedir();
const paths = linkPaths(process.env, home, binName);
const legacy = globalPaths(process.env, home, manifest.name, binName);

const DESCRIPTION: Record<Snapshot["kind"], string> = {
	absent: "nothing, so it is removed",
	symlink: "the link that was there",
	moved: "the installed copy that was there",
};

/** Undoes a link made by the old `bun link` version of this script, if there is one. */
function undoBunLink(): void {
	const outcome = restoreBunLink(legacy, PACKAGE_DIR);
	if (outcome.kind === "restored") console.log("  undid an older `bun link` of this CLI first");
}

/** Every `delacour` on PATH, first one first — the first is what a shell runs. */
function onPath(): string[] {
	const { stdout } = Bun.spawnSync(["which", "-a", binName], { stdout: "pipe", stderr: "ignore" });
	return [...new Set(stdout.toString().split("\n").filter(Boolean))];
}

function reportPath(): void {
	const found = onPath();
	if (found[0] === paths.bin) return;
	if (found.length === 0) {
		console.warn(`! ${paths.bin} is not on PATH — add ${paths.binDir} to it, or run the shim by its full path.`);
		return;
	}
	console.warn(`! \`${binName}\` on PATH is ${found[0]}, which runs before the link. Put ${paths.binDir} first.`);
}

function smoke(): void {
	const { exitCode, stdout, stderr } = Bun.spawnSync([paths.bin, "--version"], { stdout: "pipe", stderr: "pipe" });
	if (exitCode === 0) {
		console.log(`  ${binName} --version → ${stdout.toString().trim()}`);
		return;
	}
	console.error(`✗ the linked CLI does not start:\n${stderr.toString().trim()}`);
	process.exit(1);
}

const command = process.argv[2];

if (command === "link") {
	undoBunLink();
	snapshotLink(paths);
	writeShim(paths, shimFor(CLI_PATH, REGISTRY_DIR));
	console.log(`✓ ${paths.bin} → ${CLI_PATH}`);
	console.log(`  registry: ${REGISTRY_DIR} (DELACOUR_REGISTRY= for the published one)`);
	smoke();
	reportPath();
	console.log("  `bun run cli:unlink` restores what was there before.");
} else if (command === "unlink") {
	const outcome = restoreLink(paths, CLI_PATH);
	undoBunLink();
	if (outcome.kind === "restored") console.log(`✓ ${paths.bin} restored to ${DESCRIPTION[outcome.was]}.`);
	if (outcome.kind === "replaced") console.log(`${paths.bin} has been installed for real since the link; left alone.`);
	if (outcome.kind === "not-linked") console.log(`${paths.bin} is not linked to this tree; nothing to restore.`);
} else if (command === "status") {
	const found = onPath();
	const linkedHere = found[0] === paths.bin && (await Bun.file(paths.bin).text()).includes(CLI_PATH);
	console.log(found.length === 0 ? `${binName} is not on PATH.` : `${binName} → ${found[0]}`);
	console.log(linkedHere ? `  linked to this tree (${REPO_DIR})` : "  not linked to this tree");
	if (found.length > 1) console.log(`  also on PATH: ${found.slice(1).join(", ")}`);
} else {
	console.error("usage: bun scripts/link.ts link | unlink | status");
	process.exit(1);
}
