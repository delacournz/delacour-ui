import {
	chmodSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readFileSync,
	readlinkSync,
	realpathSync,
	renameSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

/**
 * What `cli:link` overwrites, remembered so `cli:unlink` can put it back.
 *
 * Linking writes one entry: `<bun bin>/delacour`, where `bun add -g delacour` puts the published
 * CLI, as a shell shim that runs this tree's `src/index.ts` under bun and points the registry at
 * this tree's `registry/`. Nothing is built, so an edit is live on the next run, and what a linked
 * `add` copies is this branch's components rather than `main`'s.
 *
 * A published install, another worktree's shim or nothing may already be there, so it is
 * snapshotted first, and a real file is moved aside rather than overwritten. The snapshot lives
 * beside the bin rather than in the repository because what it describes is machine-wide: two
 * worktrees linking in turn share one "before", and whichever unlinks restores it.
 *
 * `cli:link` used to be `bun link` over a built `dist/`, which wrote a second entry under bun's
 * global `node_modules`. `restoreBunLink` undoes one of those, so a machine linked the old way is
 * put straight before the shim goes in.
 */

/** One entry as it was before the link. */
export type Snapshot = { kind: "absent" } | { kind: "symlink"; target: string } | { kind: "moved"; backup: string };

export type BunLinkState = { module: Snapshot; bin: Snapshot };

export type BunLinkPaths = {
	globalDir: string;
	moduleLink: string;
	binLink: string;
	stateFile: string;
	backupDir: string;
};

export type BunLinkOutcome =
	| { kind: "restored"; module: Snapshot["kind"]; bin: Snapshot["kind"] }
	/** A real install has taken the link's place since; it is not ours to remove. */
	| { kind: "replaced" }
	| { kind: "not-linked" };

type Env = Record<string, string | undefined>;

/** The two entries `bun link` wrote, resolved the way bun resolves them. */
export function globalPaths(env: Env, home: string, packageName: string, binName: string): BunLinkPaths {
	const install = env.BUN_INSTALL ?? join(home, ".bun");
	const globalDir = env.BUN_INSTALL_GLOBAL_DIR ?? join(install, "install/global");
	const binDir = env.BUN_INSTALL_BIN ?? join(install, "bin");
	return {
		globalDir,
		moduleLink: join(globalDir, "node_modules", packageName),
		binLink: join(binDir, binName),
		stateFile: join(globalDir, `.${binName}-link.json`),
		backupDir: join(globalDir, `.${binName}-link-backup`),
	};
}

const entryKind = (path: string): "absent" | "symlink" | "real" => {
	const stats = lstatSync(path, { throwIfNoEntry: false });
	if (!stats) return "absent";
	return stats.isSymbolicLink() ? "symlink" : "real";
};

function capture(path: string, backup: string): Snapshot {
	const kind = entryKind(path);
	if (kind === "absent") return { kind };
	if (kind === "symlink") return { kind, target: readlinkSync(path) };
	mkdirSync(dirname(backup), { recursive: true });
	renameSync(path, backup);
	return { kind: "moved", backup };
}

function putBack(path: string, snapshot: Snapshot): void {
	rmSync(path, { recursive: true, force: true });
	if (snapshot.kind === "symlink") symlinkSync(snapshot.target, path);
	if (snapshot.kind === "moved") renameSync(snapshot.backup, path);
}

const pointsAt = (link: string, packageDir: string): boolean =>
	existsSync(link) && existsSync(packageDir) && realpathSync(link) === realpathSync(packageDir);

/**
 * Puts both entries back as the snapshot found them. With no snapshot — a tree linked by a bare
 * `bun link` — the link is removed only if it points at `packageDir`, so another tree's is safe.
 */
export function restoreBunLink(paths: BunLinkPaths, packageDir: string): BunLinkOutcome {
	const hasState = existsSync(paths.stateFile);
	const current = entryKind(paths.moduleLink);

	if (!hasState && !(current === "symlink" && pointsAt(paths.moduleLink, packageDir))) return { kind: "not-linked" };
	if (current === "real") {
		rmSync(paths.stateFile, { force: true });
		return { kind: "replaced" };
	}

	const state: BunLinkState = hasState
		? (JSON.parse(readFileSync(paths.stateFile, "utf8")) as BunLinkState)
		: { module: { kind: "absent" }, bin: { kind: "absent" } };
	putBack(paths.moduleLink, state.module);
	putBack(paths.binLink, state.bin);
	rmSync(paths.stateFile, { force: true });
	rmSync(paths.backupDir, { recursive: true, force: true });
	return { kind: "restored", module: state.module.kind, bin: state.bin.kind };
}

export type LinkPaths = { binDir: string; bin: string; stateFile: string; backup: string };

export type RestoreOutcome =
	| { kind: "restored"; was: Snapshot["kind"] }
	/** A real install has taken the shim's place since; it is not ours to remove. */
	| { kind: "replaced" }
	| { kind: "not-linked" };

/** The one entry the shim occupies: the bin `bun add -g` installs into. */
export function linkPaths(env: Env, home: string, binName: string): LinkPaths {
	const binDir = env.BUN_INSTALL_BIN ?? join(env.BUN_INSTALL ?? join(home, ".bun"), "bin");
	return {
		binDir,
		bin: join(binDir, binName),
		stateFile: join(binDir, `.${binName}-link.json`),
		backup: join(binDir, `.${binName}-link-backup`),
	};
}

/**
 * The shim: this tree's source under bun, reading this tree's registry.
 *
 * `${DELACOUR_REGISTRY-…}` defaults only when the variable is unset, so `DELACOUR_REGISTRY=` (empty)
 * runs the linked source against the published registry, and a path or URL picks another.
 */
export function shimFor(cliPath: string, registryDir: string): string {
	return [
		"#!/bin/sh",
		"# delacour cli:link — `bun run cli:unlink` restores what was here",
		`export DELACOUR_REGISTRY="\${DELACOUR_REGISTRY-${registryDir}}"`,
		`exec bun "${cliPath}" "$@"`,
		"",
	].join("\n");
}

const SHIM_EXEC = /^exec bun "(.+)" "\$@"$/m;

/** The source a shim at `path` runs; `undefined` when `path` is anything else. */
export function shimTarget(path: string): string | undefined {
	if (entryKind(path) !== "real") return undefined;
	const head = readFileSync(path).subarray(0, 4096).toString("utf8");
	if (!head.startsWith("#!/bin/sh\n# delacour cli:link")) return undefined;
	return SHIM_EXEC.exec(head)?.[1];
}

/**
 * Records the entry before the shim replaces it. A snapshot already on disk is kept: the machine
 * is linked, so what is there now is a shim, not what the user had.
 */
export function snapshotLink(paths: LinkPaths): Snapshot {
	if (existsSync(paths.stateFile)) return JSON.parse(readFileSync(paths.stateFile, "utf8")) as Snapshot;
	mkdirSync(paths.binDir, { recursive: true });
	const snapshot = capture(paths.bin, paths.backup);
	writeFileSync(paths.stateFile, `${JSON.stringify(snapshot, null, "\t")}\n`);
	return snapshot;
}

/** Writes the shim beside the entry and renames it in, so nothing ever runs half a file. */
export function writeShim(paths: LinkPaths, content: string): void {
	mkdirSync(paths.binDir, { recursive: true });
	const staged = `${paths.bin}.tmp-${process.pid}`;
	writeFileSync(staged, content);
	chmodSync(staged, 0o755);
	renameSync(staged, paths.bin);
}

/**
 * Puts the entry back as the snapshot found it. With no snapshot the shim is removed only if it
 * runs `cliPath`, so another tree's is safe.
 */
export function restoreLink(paths: LinkPaths, cliPath: string): RestoreOutcome {
	const hasState = existsSync(paths.stateFile);
	const target = shimTarget(paths.bin);

	if (!hasState && target !== cliPath) return { kind: "not-linked" };
	if (target === undefined && entryKind(paths.bin) !== "absent") {
		rmSync(paths.stateFile, { force: true });
		rmSync(paths.backup, { force: true });
		return { kind: "replaced" };
	}

	const snapshot: Snapshot = hasState
		? (JSON.parse(readFileSync(paths.stateFile, "utf8")) as Snapshot)
		: { kind: "absent" };
	putBack(paths.bin, snapshot);
	rmSync(paths.stateFile, { force: true });
	return { kind: "restored", was: snapshot.kind };
}
