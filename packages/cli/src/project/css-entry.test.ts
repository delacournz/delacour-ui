import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { findTailwindEntry } from "./css-entry";

/**
 * A project usually already has a Tailwind entry, and creating a second one is
 * the failure this exists to prevent: Metro compiles one file, the layout
 * imports another, and every component renders unstyled while `doctor` reports
 * that nothing imports the entry it was told about.
 */

const directories: string[] = [];

async function app(files: Record<string, string>): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "delacour-css-"));
	directories.push(root);

	for (const [path, content] of Object.entries(files)) {
		await mkdir(dirname(join(root, path)), { recursive: true });
		await writeFile(join(root, path), content, "utf-8");
	}

	return root;
}

afterAll(async () => {
	await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("findTailwindEntry", () => {
	test("finds the entry an app already has", async () => {
		const root = await app({ "src/global.css": '@import "tailwindcss";\n@import "uniwind";\n' });
		expect(findTailwindEntry(root)).toBe(join(root, "src/global.css"));
	});

	test("finds one at the project root", async () => {
		const root = await app({ "global.css": '@import "tailwindcss";' });
		expect(findTailwindEntry(root)).toBe(join(root, "global.css"));
	});

	test("ignores a stylesheet that is not a Tailwind entry", async () => {
		const root = await app({ "src/global.css": "body { margin: 0; }" });
		expect(findTailwindEntry(root)).toBeNull();
	});

	test("says nothing when there is none", async () => {
		const root = await app({ "package.json": "{}" });
		expect(findTailwindEntry(root)).toBeNull();
	});

	/**
	 * The one this ordering exists for: a project that ran an older version has
	 * both, and the one the app imports is the one to keep.
	 */
	test("prefers the shallower entry over a nested one", async () => {
		const root = await app({
			"src/global.css": '@import "tailwindcss";',
			"src/styles/global.css": '@import "tailwindcss";',
		});

		expect(findTailwindEntry(root)).toBe(join(root, "src/global.css"));
	});

	test("accepts single quotes and a tailwindcss import with a layer", async () => {
		const root = await app({ "src/styles/global.css": "@import 'tailwindcss' source(none);" });
		expect(findTailwindEntry(root)).toBe(join(root, "src/styles/global.css"));
	});
});
