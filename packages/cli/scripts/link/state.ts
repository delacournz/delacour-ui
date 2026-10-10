import {
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
 * What `bun link` overwrites, remembered so `cli:unlink` can put it back.
 *
 * `bun link` writes two entries and touches nothing else — not the global `package.json`, not its
 * lockfile: `<global>/node_modules/<name>`, a symlink to the working tree, and `<bin>/<name>`, a
 * symlink to the built entry point. Either may already be there, as another worktree's link or as a
 * real `bun add -g` install, and `bun link` replaces it without a word. So each is snapshotted
 * first, and a real install is moved aside rather than left for `bun link` to delete.
 *
 * The snapshot lives beside the links rather than in the repository because what it describes is
 * machine-wide: two worktrees linking in turn share one "before", and whichever unlinks restores it.
 */

/** One entry as it was before the link. */
export type Snapshot = { kind: "absent" } | { kind: "symlink"; target: string } | { kind: "moved"; backup: string };

export type LinkState = { module: Snapshot; bin: Snapshot };

export type LinkPaths = {
	globalDir: string;
	moduleLink: string;
	binLink: string;
	stateFile: string;
	backupDir: string;
};

export type RestoreOutcome =
	| { kind: "restored"; module: Snapshot["kind"]; bin: Snapshot["kind"] }
	/** A real install has taken the link's place since; it is not ours to remove. */
	| { kind: "replaced" }
	| { kind: "not-linked" };

type Env = Record<string, string | undefined>;

/** The two entries `bun link` writes, resolved the way bun resolves them. */
export function globalPaths(env: Env, home: string, packageName: string, binName: string): LinkPaths {
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

/**
 * Records both entries before `bun link` replaces them. A snapshot already on disk is kept: the
 * tree is linked, so what is there now is a link, not what the user had.
 */
export function snapshotLinks(paths: LinkPaths): LinkState {
	if (existsSync(paths.stateFile)) return JSON.parse(readFileSync(paths.stateFile, "utf8")) as LinkState;
	const state: LinkState = {
		module: capture(paths.moduleLink, join(paths.backupDir, "module")),
		bin: capture(paths.binLink, join(paths.backupDir, "bin")),
	};
	mkdirSync(paths.globalDir, { recursive: true });
	writeFileSync(paths.stateFile, `${JSON.stringify(state, null, "\t")}\n`);
	return state;
}

const pointsAt = (link: string, packageDir: string): boolean =>
	existsSync(link) && existsSync(packageDir) && realpathSync(link) === realpathSync(packageDir);

/**
 * Puts both entries back as the snapshot found them. With no snapshot — a tree linked by a bare
 * `bun link` — the link is removed only if it points at `packageDir`, so another tree's is safe.
 */
export function restoreLinks(paths: LinkPaths, packageDir: string): RestoreOutcome {
	const hasState = existsSync(paths.stateFile);
	const current = entryKind(paths.moduleLink);

	if (!hasState && !(current === "symlink" && pointsAt(paths.moduleLink, packageDir))) return { kind: "not-linked" };
	if (current === "real") {
		rmSync(paths.stateFile, { force: true });
		return { kind: "replaced" };
	}

	const state: LinkState = hasState
		? (JSON.parse(readFileSync(paths.stateFile, "utf8")) as LinkState)
		: { module: { kind: "absent" }, bin: { kind: "absent" } };
	putBack(paths.moduleLink, state.module);
	putBack(paths.binLink, state.bin);
	rmSync(paths.stateFile, { force: true });
	rmSync(paths.backupDir, { recursive: true, force: true });
	return { kind: "restored", module: state.module.kind, bin: state.bin.kind };
}
