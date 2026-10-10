import { describe, expect, test } from "bun:test";
import { contentHash } from "../lock/hash";
import type { LockFile } from "../lock/schema";
import { type ClassifyInput, classify } from "./classify";

const BASE = [
	"export function Button() {",
	'\tconst size = "md";',
	"\tconst theme = useTheme();",
	"\tconst ref = useRef(null);",
	"",
	"\treturn <Pressable />;",
	"}",
	"",
].join("\n");
/** The registry fixed something on the `size` line. */
const NEXT = BASE.replace('"md"', '"lg"');
/** The project changed the `return` line. */
const EDITED = BASE.replace("<Pressable />", "<Pressable hitSlop={8} />");

const entry: LockFile = { ref: "old", hash: contentHash(BASE) };
const identity = async (content: string) => content;
/** A formatter that sets the file in spaces. Exact, so its output can be compared byte for byte. */
const spaces = async (content: string) => content.replaceAll("\t", "  ");

function input(overrides: Partial<ClassifyInput>): ClassifyInput {
	return { local: BASE, next: NEXT, entry, base: BASE, format: identity, nextLabel: "registry@new", ...overrides };
}

describe("classify — a file the lock knows", () => {
	test("is current when neither side moved", async () => {
		expect(await classify(input({ next: BASE }))).toEqual({ state: "current" });
	});

	test("takes the registry's text when the project never touched it — without needing the base", async () => {
		expect(await classify(input({ base: null }))).toEqual({ state: "upstream", content: NEXT });
	});

	test("keeps the project's file when only the project moved", async () => {
		expect(await classify(input({ local: EDITED, next: BASE, base: null }))).toEqual({ state: "local" });
	});

	test("merges when both moved, on different lines", async () => {
		const result = await classify(input({ local: EDITED }));

		expect(result).toEqual({
			state: "both",
			conflicts: 0,
			content: EDITED.replace('"md"', '"lg"'),
		});
	});

	test("writes markers when both moved the same line", async () => {
		const result = await classify(input({ local: BASE.replace('"md"', '"sm"') }));

		expect(result.state).toBe("both");
		expect(result).toMatchObject({ conflicts: 1 });
		expect(result).toHaveProperty("content", expect.stringContaining(">>>>>>> registry@new"));
	});

	test("is current when the project already applied the registry's change by hand", async () => {
		expect(await classify(input({ local: NEXT, base: null }))).toEqual({ state: "current" });
	});

	test("leaves a file the project deleted deleted", async () => {
		expect(await classify(input({ local: null }))).toEqual({ state: "deleted-locally" });
	});
});

describe("classify — a project that formats its files", () => {
	test("a reformatted file is untouched, and the update arrives in the project's style", async () => {
		const result = await classify(input({ local: await spaces(BASE), format: spaces }));

		expect(result).toEqual({ state: "upstream", content: await spaces(NEXT) });
	});

	test("a reformatted file with nothing new upstream is current, not a local edit", async () => {
		expect(await classify(input({ local: await spaces(BASE), next: BASE, format: spaces }))).toEqual({
			state: "current",
		});
	});

	test("a reformatted and edited file merges cleanly, in the project's style", async () => {
		const result = await classify(input({ local: await spaces(EDITED), format: spaces }));

		expect(result).toEqual({ state: "both", conflicts: 0, content: await spaces(EDITED.replace('"md"', '"lg"')) });
	});

	// No formatter the CLI can run, but the difference is still only layout.
	test("falls back to comparing layout when it has no formatter to run", async () => {
		const result = await classify(input({ local: await spaces(BASE) }));

		expect(result).toEqual({ state: "upstream", content: NEXT });
	});

	test("gives a CRLF checkout its line endings back", async () => {
		const crlf = (text: string) => text.replaceAll("\n", "\r\n");

		expect(await classify(input({ local: crlf(BASE) }))).toEqual({ state: "upstream", content: crlf(NEXT) });
		expect(await classify(input({ local: crlf(EDITED) }))).toMatchObject({
			state: "both",
			content: crlf(EDITED.replace('"md"', '"lg"')),
		});
	});
});

describe("classify — a file with nothing to merge from", () => {
	test("a file new to the item is added", async () => {
		expect(await classify(input({ local: null, entry: undefined, base: null }))).toEqual({
			state: "added",
			content: NEXT,
		});
	});

	test("a file copied before the lock existed is adopted when it matches the registry", async () => {
		expect(await classify(input({ local: NEXT, entry: undefined, base: null }))).toEqual({
			state: "untracked",
			reason: "no-entry",
			adopt: true,
			content: NEXT,
		});
	});

	test("and is reported, not overwritten, when it does not", async () => {
		expect(await classify(input({ local: EDITED, entry: undefined, base: null }))).toEqual({
			state: "untracked",
			reason: "no-entry",
			adopt: false,
			content: NEXT,
		});
	});

	// A branch name moved: the ref no longer serves the text the hash names.
	test("refuses to merge from a base that is not the one recorded", async () => {
		expect(await classify(input({ local: EDITED, base: "something else\n" }))).toEqual({
			state: "untracked",
			reason: "base-unavailable",
			adopt: false,
		});
	});
});

describe("classify — a file the item no longer has", () => {
	test("says whether the project ever edited it", async () => {
		expect(await classify(input({ next: null }))).toEqual({ state: "removed-upstream", onDisk: true, untouched: true });
		expect(await classify(input({ next: null, local: EDITED }))).toEqual({
			state: "removed-upstream",
			onDisk: true,
			untouched: false,
		});
	});

	test("and whether it is on disk at all", async () => {
		expect(await classify(input({ next: null, local: null }))).toEqual({
			state: "removed-upstream",
			onDisk: false,
			untouched: true,
		});
	});
});
