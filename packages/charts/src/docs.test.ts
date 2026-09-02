import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { PACKAGE_ROOT, SRC, sourceFiles } from "./source-tree.test";

/**
 * Documentation is part of the change.
 *
 * `@delacour/native-ui` grew this test because `Radio` shipped undocumented
 * and nothing caught it for fifteen commits. The same applies here, scoped to
 * the top-level folders rather than every nested one — a doc per directory of
 * four utility modules is noise, a doc per subsystem is not.
 */
describe("docs", () => {
	const folders = readdirSync(SRC)
		.map((entry) => join(SRC, entry))
		.filter((path) => statSync(path).isDirectory())
		.filter((path) => sourceFiles(path, { skipTests: true }).length > 0);

	test("the package documents itself", () => {
		const doc = join(PACKAGE_ROOT, "AGENTS.md");
		expect(existsSync(doc)).toBe(true);
		expect(readFileSync(doc, "utf8").split("\n").length).toBeGreaterThan(20);
	});

	test("finds the subsystems, so a broken walker cannot pass silently", () => {
		expect(folders.length).toBeGreaterThan(0);
	});

	test("every subsystem has an AGENTS.md that is not a stub", () => {
		const missing: string[] = [];
		for (const folder of folders) {
			const doc = join(folder, "AGENTS.md");
			if (!existsSync(doc)) {
				missing.push(`${folder.slice(SRC.length + 1)} has no AGENTS.md`);
				continue;
			}
			const content = readFileSync(doc, "utf8");
			if (!content.startsWith("# ") || content.split("\n").length < 10) {
				missing.push(`${folder.slice(SRC.length + 1)}/AGENTS.md is a stub`);
			}
		}
		expect(missing).toEqual([]);
	});
});
