import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { FADE, LIST_GAP, LIST_GAP_POINTS, SECTION_GAP, SPECIMEN_HEIGHT } from "./tokens";

const SRC = import.meta.dirname;

/** Every `.ts`/`.tsx` under `src/`, except the demos — those are published source and keep their own literals. */
function appSources(directory = SRC, found: string[] = []): string[] {
	for (const name of readdirSync(directory)) {
		const path = join(directory, name);
		if (name === "demos" || name === "uniwind-types.d.ts") continue;
		if (statSync(path).isDirectory()) appSources(path, found);
		else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts")) found.push(path);
	}
	return found;
}

const relative = (path: string) => path.slice(SRC.length + 1);

/**
 * The spacing and motion literals the app's own chrome shares live in one file,
 * and these tests are what stop them being copied back out of it.
 *
 * A `gap-6` on eleven scroll areas, a `SPECIMEN_HEIGHT = 56` in four strips and
 * a crossfade pair in two components were each one value written several times;
 * each copy was one edit away from disagreeing with the rest.
 */
describe("tokens", () => {
	test("the list gap is a Tailwind class and its point value agree", () => {
		expect(LIST_GAP).toBe("gap-6");
		expect(LIST_GAP_POINTS).toBe(24);
		expect(SECTION_GAP).toBe("gap-2");
	});

	test("the specimen box is the strips' shared height", () => {
		expect(SPECIMEN_HEIGHT).toBe(56);
	});

	test("the crossfade fades out faster than it fades in", () => {
		expect(FADE.out).toBeLessThan(FADE.in);
	});

	test("no strip declares its own SPECIMEN_HEIGHT", () => {
		const offenders = appSources()
			.filter((path) => !path.endsWith("/tokens.ts"))
			.filter((path) => /const SPECIMEN_HEIGHT\b/.test(readFileSync(path, "utf8")))
			.map(relative);

		expect(offenders).toEqual([]);
	});

	test("no component declares its own crossfade durations", () => {
		const offenders = appSources()
			.filter((path) => !path.endsWith("/tokens.ts"))
			.filter((path) => /const FADE_(OUT|IN)_MS\b/.test(readFileSync(path, "utf8")))
			.map(relative);

		expect(offenders).toEqual([]);
	});

	test("no scroll area writes the list gap as a literal", () => {
		const offenders = appSources()
			.filter((path) => !path.endsWith("/tokens.ts"))
			.filter((path) => /contentContainerClassName="gap-6"/.test(readFileSync(path, "utf8")))
			.map(relative);

		expect(offenders).toEqual([]);
	});

	test("the tab bar spacer reads the list gap rather than restating it", () => {
		const source = readFileSync(join(SRC, "components", "theme", "theme-tab-bar.tsx"), "utf8");

		expect(source).not.toMatch(/const CONTENT_GAP = \d+/);
		expect(source).toContain("LIST_GAP_POINTS");
	});
});
