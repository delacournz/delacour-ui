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
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	globalPaths,
	type LinkPaths,
	linkPaths,
	restoreBunLink,
	restoreLink,
	shimFor,
	shimTarget,
	snapshotLink,
	writeShim,
} from "./state";

let root: string;
let paths: LinkPaths;
let tree: string;
let cli: string;
let registry: string;

const link = (cliPath = cli, registryDir = registry) => {
	snapshotLink(paths);
	writeShim(paths, shimFor(cliPath, registryDir));
};

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), "delacour-link-"));
	paths = linkPaths({ BUN_INSTALL: root }, "/nobody", "delacour");
	tree = join(root, "tree");
	cli = join(tree, "packages/cli/src/index.ts");
	registry = join(tree, "registry");
	mkdirSync(join(tree, "packages/cli/src"), { recursive: true });
	writeFileSync(cli, "");
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("linkPaths", () => {
	test("the bin bun installs globals into, defaulting to ~/.bun/bin", () => {
		expect(linkPaths({}, "/home/me", "delacour").bin).toBe("/home/me/.bun/bin/delacour");
	});

	test("follows bun's own overrides", () => {
		expect(linkPaths({ BUN_INSTALL: "/opt/bun", BUN_INSTALL_BIN: "/b" }, "/home/me", "delacour").bin).toBe(
			"/b/delacour"
		);
	});
});

describe("the shim", () => {
	test("runs this tree's source under bun and reads this tree's registry", () => {
		const shim = shimFor(cli, registry);

		expect(shim.startsWith("#!/bin/sh\n")).toBe(true);
		expect(shim).toContain(`exec bun "${cli}" "$@"`);
		expect(shim).toContain(`DELACOUR_REGISTRY="\${DELACOUR_REGISTRY-${registry}}"`);
	});

	test("is recognised, and names the source it runs", () => {
		link();

		expect(shimTarget(paths.bin)).toBe(cli);
	});

	test("anything else is not a shim", () => {
		mkdirSync(paths.binDir, { recursive: true });
		writeFileSync(paths.bin, "#!/usr/bin/env node\nconsole.log('published')\n");

		expect(shimTarget(paths.bin)).toBeUndefined();
	});

	test("is executable", () => {
		link();

		expect(lstatSync(paths.bin).mode & 0o111).toBe(0o111);
	});
});

describe("link then restoreLink", () => {
	test("nothing there before: the shim is removed again", () => {
		link();

		expect(restoreLink(paths, cli)).toEqual({ kind: "restored", was: "absent" });
		expect(existsSync(paths.bin)).toBe(false);
		expect(existsSync(paths.stateFile)).toBe(false);
	});

	test("a symlink to a global install comes back", () => {
		mkdirSync(paths.binDir, { recursive: true });
		symlinkSync("../install/global/node_modules/delacour/dist/index.js", paths.bin);

		link();
		restoreLink(paths, cli);

		expect(readlinkSync(paths.bin)).toBe("../install/global/node_modules/delacour/dist/index.js");
	});

	test("a real file is set aside, not overwritten, and put back", () => {
		mkdirSync(paths.binDir, { recursive: true });
		writeFileSync(paths.bin, "published");

		link();
		expect(readFileSync(paths.backup, "utf8")).toBe("published");
		restoreLink(paths, cli);

		expect(readFileSync(paths.bin, "utf8")).toBe("published");
		expect(existsSync(paths.backup)).toBe(false);
	});

	test("another worktree's shim comes back", () => {
		const other = join(root, "other/packages/cli/src/index.ts");
		link(other, join(root, "other/registry"));
		rmSync(paths.stateFile);

		link();
		restoreLink(paths, cli);

		expect(shimTarget(paths.bin)).toBe(other);
	});

	test("linking twice keeps the first snapshot", () => {
		link();
		link();

		expect(restoreLink(paths, cli)).toEqual({ kind: "restored", was: "absent" });
		expect(existsSync(paths.bin)).toBe(false);
	});
});

describe("restoreLink without a clean slate", () => {
	test("a real install made since the link is left alone", () => {
		link();
		writeFileSync(paths.bin, "installed since");

		expect(restoreLink(paths, cli)).toEqual({ kind: "replaced" });
		expect(readFileSync(paths.bin, "utf8")).toBe("installed since");
		expect(existsSync(paths.stateFile)).toBe(false);
	});

	test("no snapshot, this tree's shim: it is removed", () => {
		link();
		rmSync(paths.stateFile);

		expect(restoreLink(paths, cli)).toEqual({ kind: "restored", was: "absent" });
		expect(existsSync(paths.bin)).toBe(false);
	});

	test("no snapshot, another tree's shim: nothing is touched", () => {
		const other = join(root, "other/packages/cli/src/index.ts");
		link(other);
		rmSync(paths.stateFile);

		expect(restoreLink(paths, cli)).toEqual({ kind: "not-linked" });
		expect(shimTarget(paths.bin)).toBe(other);
	});

	test("no snapshot, nothing linked", () => {
		expect(restoreLink(paths, cli)).toEqual({ kind: "not-linked" });
	});
});

/**
 * `cli:link` used to be `bun link` over a built `dist/`. A machine linked that way still has its
 * snapshot in bun's global directory, so linking or unlinking now undoes that one first.
 */
describe("restoreBunLink, for a tree linked the old way", () => {
	let legacy: ReturnType<typeof globalPaths>;
	const packageDir = () => join(tree, "packages/cli");

	const bunLink = () => {
		for (const path of [legacy.moduleLink, legacy.binLink]) rmSync(path, { recursive: true, force: true });
		symlinkSync(packageDir(), legacy.moduleLink);
		symlinkSync(join(packageDir(), "dist/index.js"), legacy.binLink);
	};

	beforeEach(() => {
		legacy = globalPaths({ BUN_INSTALL: root }, "/nobody", "delacour", "delacour");
		mkdirSync(join(legacy.globalDir, "node_modules"), { recursive: true });
		mkdirSync(paths.binDir, { recursive: true });
	});

	test("with its snapshot, puts back what bun link replaced", () => {
		writeFileSync(
			legacy.stateFile,
			JSON.stringify({ module: { kind: "absent" }, bin: { kind: "symlink", target: "elsewhere" } })
		);
		bunLink();

		expect(restoreBunLink(legacy, packageDir())).toEqual({ kind: "restored", module: "absent", bin: "symlink" });
		expect(existsSync(legacy.moduleLink)).toBe(false);
		expect(readlinkSync(legacy.binLink)).toBe("elsewhere");
	});

	test("with no snapshot and no link, does nothing", () => {
		expect(restoreBunLink(legacy, packageDir())).toEqual({ kind: "not-linked" });
	});
});
