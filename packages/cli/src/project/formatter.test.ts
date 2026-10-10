import { afterAll, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFormat, detectFormatter, formatterArgs, formatterIn } from "./formatter";

const directories: string[] = [];

async function temp(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "delacour-formatter-"));
	directories.push(directory);
	return directory;
}

/** A stand-in binary: upper-cases stdin, or fails for a path with `boom` in it. */
async function fakeBin(root: string, name: string): Promise<string> {
	const bin = join(root, "node_modules", ".bin");
	await mkdir(bin, { recursive: true });

	const path = join(bin, name);
	await writeFile(path, '#!/bin/sh\ncase "$*" in *boom*) exit 2;; esac\ntr a-z A-Z\n');
	await chmod(path, 0o755);

	return path;
}

afterAll(async () => {
	await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("formatterIn", () => {
	test("reads Biome from either config name", () => {
		expect(formatterIn(["biome.json"], null)).toBe("biome");
		expect(formatterIn(["biome.jsonc", "package.json"], null)).toBe("biome");
	});

	test("reads Prettier from a config file or the manifest key", () => {
		expect(formatterIn([".prettierrc"], null)).toBe("prettier");
		expect(formatterIn([".prettierrc.json"], null)).toBe("prettier");
		expect(formatterIn(["prettier.config.mjs"], null)).toBe("prettier");
		expect(formatterIn(["package.json"], { prettier: { semi: false } })).toBe("prettier");
	});

	test("prefers Biome when a project carries both", () => {
		expect(formatterIn([".prettierrc", "biome.json"], null)).toBe("biome");
	});

	test("finds nothing in a project with neither", () => {
		expect(formatterIn(["package.json", ".prettierignore"], {})).toBeNull();
	});
});

describe("formatterArgs", () => {
	test("names the destination, so the project's config and overrides apply", () => {
		expect(formatterArgs("biome", "/app/src/button.tsx")).toEqual(["format", "--stdin-file-path=/app/src/button.tsx"]);
		expect(formatterArgs("prettier", "/app/src/button.tsx")).toEqual(["--stdin-filepath", "/app/src/button.tsx"]);
	});
});

describe("detectFormatter", () => {
	test("finds a config above the directory it starts in, and the binary installed for it", async () => {
		const root = await temp();
		await mkdir(join(root, ".git"));
		await writeFile(join(root, ".prettierrc"), "{}");
		const bin = await fakeBin(root, "prettier");
		await mkdir(join(root, "apps", "mobile"), { recursive: true });

		expect(await detectFormatter(join(root, "apps", "mobile"))).toEqual({ kind: "prettier", bin, cwd: root });
	});

	// Fetching one would run a version that formats differently from theirs.
	test("is null when the formatter is configured but not installed", async () => {
		const root = await temp();
		await mkdir(join(root, ".git"));
		await writeFile(join(root, "biome.json"), "{}");

		expect(await detectFormatter(root)).toBeNull();
	});

	test("stops at the repository root", async () => {
		const outer = await temp();
		await writeFile(join(outer, ".prettierrc"), "{}");
		await fakeBin(outer, "prettier");
		await mkdir(join(outer, "repo", ".git"), { recursive: true });

		expect(await detectFormatter(join(outer, "repo"))).toBeNull();
	});
});

describe("createFormat", () => {
	test("leaves the text alone when the project has no formatter", async () => {
		const format = createFormat(null, () => {});

		expect(await format("a", "/x.ts")).toBe("a");
	});

	test("pipes the text through the project's binary", async () => {
		const root = await temp();
		const bin = await fakeBin(root, "prettier");
		const format = createFormat({ kind: "prettier", bin, cwd: root }, () => {});

		expect(await format("const a = 1\n", join(root, "a.ts"))).toBe("CONST A = 1\n");
	});

	test("gives the text back unformatted on a failure, and reports it once", async () => {
		const root = await temp();
		const bin = await fakeBin(root, "prettier");
		const failures: unknown[] = [];
		const format = createFormat({ kind: "prettier", bin, cwd: root }, (error) => failures.push(error));

		expect(await format("one", join(root, "boom.ts"))).toBe("one");
		expect(await format("two", join(root, "boom-again.ts"))).toBe("two");
		expect(failures).toHaveLength(1);
		// One file failing is not a reason to stop formatting the rest.
		expect(await format("three", join(root, "c.ts"))).toBe("THREE");
	});

	// A component's AGENTS.md is copied with it, and Biome has no Markdown formatter.
	test("does not hand a formatter a file it cannot format", async () => {
		const root = await temp();
		const bin = await fakeBin(root, "biome");
		const failures: unknown[] = [];
		const format = createFormat({ kind: "biome", bin, cwd: root }, (error) => failures.push(error));

		expect(await format("# docs\n", join(root, "AGENTS.md"))).toBe("# docs\n");
		expect(await format("a\n", join(root, "a.tsx"))).toBe("A\n");
		expect(failures).toHaveLength(0);
	});
});
