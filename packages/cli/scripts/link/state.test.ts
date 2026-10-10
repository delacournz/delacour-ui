import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	existsSync,
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readlinkSync,
	rmSync,
	symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { globalPaths, type LinkPaths, restoreLinks, snapshotLinks } from "./state";

let root: string;
let paths: LinkPaths;
let tree: string;

/** What `bun link` does: replace both entries with symlinks into the working tree. */
const bunLink = (target: string) => {
	for (const path of [paths.moduleLink, paths.binLink]) rmSync(path, { recursive: true, force: true });
	symlinkSync(target, paths.moduleLink);
	symlinkSync(join(target, "dist/index.js"), paths.binLink);
};

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "delacour-link-"));
	paths = globalPaths({ BUN_INSTALL: root }, "/nobody", "delacour", "delacour");
	tree = join(root, "tree");
	mkdirSync(join(paths.globalDir, "node_modules"), { recursive: true });
	mkdirSync(join(root, "bin"), { recursive: true });
	mkdirSync(join(tree, "dist"), { recursive: true });
	Bun.write(join(tree, "dist/index.js"), "#!/usr/bin/env node\n");
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("globalPaths", () => {
	test("defaults to ~/.bun", () => {
		const defaults = globalPaths({}, "/home/me", "delacour", "delacour");
		expect(defaults.moduleLink).toBe("/home/me/.bun/install/global/node_modules/delacour");
		expect(defaults.binLink).toBe("/home/me/.bun/bin/delacour");
	});

	test("follows bun's own overrides", () => {
		const overridden = globalPaths(
			{ BUN_INSTALL: "/opt/bun", BUN_INSTALL_GLOBAL_DIR: "/g", BUN_INSTALL_BIN: "/b" },
			"/home/me",
			"delacour",
			"delacour"
		);
		expect(overridden.moduleLink).toBe("/g/node_modules/delacour");
		expect(overridden.binLink).toBe("/b/delacour");
	});
});

describe("snapshotLinks then restoreLinks", () => {
	test("nothing installed before: both entries are removed again", () => {
		snapshotLinks(paths);
		bunLink(tree);

		expect(restoreLinks(paths, tree)).toEqual({ kind: "restored", module: "absent", bin: "absent" });
		expect(existsSync(paths.moduleLink)).toBe(false);
		expect(existsSync(paths.binLink)).toBe(false);
		expect(existsSync(paths.stateFile)).toBe(false);
	});

	test("a link to another tree comes back", () => {
		const other = join(root, "other");
		mkdirSync(join(other, "dist"), { recursive: true });
		bunLink(other);

		snapshotLinks(paths);
		bunLink(tree);
		restoreLinks(paths, tree);

		expect(readlinkSync(paths.moduleLink)).toBe(other);
		expect(readlinkSync(paths.binLink)).toBe(join(other, "dist/index.js"));
	});

	test("a real global install is set aside and put back", () => {
		mkdirSync(join(paths.moduleLink, "dist"), { recursive: true });
		Bun.write(join(paths.moduleLink, "dist/index.js"), "published");
		symlinkSync("../install/global/node_modules/delacour/dist/index.js", paths.binLink);

		snapshotLinks(paths);
		expect(existsSync(paths.moduleLink)).toBe(false);
		bunLink(tree);
		restoreLinks(paths, tree);

		expect(lstatSync(paths.moduleLink).isDirectory()).toBe(true);
		expect(readFileSync(join(paths.moduleLink, "dist/index.js"), "utf8")).toBe("published");
		expect(readlinkSync(paths.binLink)).toBe("../install/global/node_modules/delacour/dist/index.js");
		expect(existsSync(paths.backupDir)).toBe(false);
	});

	test("linking twice keeps the first snapshot", () => {
		snapshotLinks(paths);
		bunLink(tree);
		snapshotLinks(paths);
		bunLink(tree);

		expect(restoreLinks(paths, tree)).toEqual({ kind: "restored", module: "absent", bin: "absent" });
		expect(existsSync(paths.moduleLink)).toBe(false);
	});
});

describe("restoreLinks without a clean slate", () => {
	test("a real install made since the link is left alone", () => {
		snapshotLinks(paths);
		bunLink(tree);
		rmSync(paths.moduleLink);
		mkdirSync(paths.moduleLink);

		expect(restoreLinks(paths, tree)).toEqual({ kind: "replaced" });
		expect(lstatSync(paths.moduleLink).isDirectory()).toBe(true);
		expect(existsSync(paths.binLink)).toBe(true);
		expect(existsSync(paths.stateFile)).toBe(false);
	});

	test("no snapshot, linked to this tree: the link is removed", () => {
		bunLink(tree);

		expect(restoreLinks(paths, tree)).toEqual({ kind: "restored", module: "absent", bin: "absent" });
		expect(existsSync(paths.moduleLink)).toBe(false);
		expect(existsSync(paths.binLink)).toBe(false);
	});

	test("no snapshot, linked elsewhere: nothing is touched", () => {
		const other = join(root, "other");
		mkdirSync(join(other, "dist"), { recursive: true });
		bunLink(other);

		expect(restoreLinks(paths, tree)).toEqual({ kind: "not-linked" });
		expect(readlinkSync(paths.moduleLink)).toBe(other);
	});

	test("no snapshot, nothing linked", () => {
		expect(restoreLinks(paths, tree)).toEqual({ kind: "not-linked" });
	});
});
