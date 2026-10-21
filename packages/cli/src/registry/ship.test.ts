import { describe, expect, test } from "bun:test";
import { findUnshippableReferences, OMIT_END, OMIT_START, shipContent } from "./ship";

describe("shipContent", () => {
	test("leaves a file that is not Markdown exactly as it is", () => {
		const source = `/** ${OMIT_START} kept ${OMIT_END} */\nexport const x = 1;\n`;
		expect(shipContent("button/button.tsx", source)).toBe(source);
	});

	test("drops a whole-line omit block, markers included", () => {
		const source = ["# Button", "", OMIT_START, "Run the variants test.", OMIT_END, "", "## Design", ""].join("\n");

		expect(shipContent("button/AGENTS.md", source)).toBe(["# Button", "", "", "## Design", ""].join("\n"));
	});

	test("drops an inline omit span and keeps the rest of the line", () => {
		const source = `The decision is pure.${OMIT_START} The variants test sweeps it.${OMIT_END} Next.\n`;

		expect(shipContent("radio/AGENTS.md", source)).toBe("The decision is pure. Next.\n");
	});

	test("drops several blocks, and nothing between them", () => {
		const source = [OMIT_START, "a", OMIT_END, "kept", OMIT_START, "b", OMIT_END, ""].join("\n");

		expect(shipContent("x/AGENTS.md", source)).toBe("kept\n");
	});

	test("throws on an unclosed block rather than dropping the rest of the file", () => {
		expect(() => shipContent("x/AGENTS.md", `kept\n${OMIT_START}\nlost\n`)).toThrow(/unclosed/);
	});

	test("throws on a stray closing marker", () => {
		expect(() => shipContent("x/AGENTS.md", `kept\n${OMIT_END}\n`)).toThrow(/without/);
	});

	test("drops a Files table row naming a file the registry does not ship", () => {
		const source = [
			"| File | What it holds |",
			"| --- | --- |",
			"| `button.variants.ts` | Pure `tv()` slots |",
			"| `button.variants.test.ts` | |",
			"| `splitter.math.test.tsx` | The maths |",
			"| `menu.test-helpers.ts` | |",
			"| `menu.fixtures.ts` | |",
			"",
		].join("\n");

		expect(shipContent("button/AGENTS.md", source)).toBe(
			["| File | What it holds |", "| --- | --- |", "| `button.variants.ts` | Pure `tv()` slots |", ""].join("\n")
		);
	});

	test("keeps a row that only mentions a test file in a later cell", () => {
		const row = "| `button.variants.ts` | Pinned by `button.variants.test.ts` |\n";
		expect(shipContent("button/AGENTS.md", row)).toBe(row);
	});
});

describe("findUnshippableReferences", () => {
	test("finds nothing in neutral prose", () => {
		expect(findUnshippableReferences("The decision is pure, so a unit test reaches it.\n")).toEqual([]);
	});

	test.each([
		["`bun test` reaches it", "bun test"],
		["run bunx delacour", "bunx"],
		["`bun add react-native-reanimated`", "bun add"],
		["`bun run previews`", "bun run"],
		["Bun's transpiler cannot parse it", "Bun"],
		['import { test } from "bun:test";', "bun:test"],
		["`tokens.test.ts` holds them", "tokens.test.ts"],
		["see `menu.test-helpers.ts`", "menu.test-helpers.ts"],
		["see a.fixtures.tsx", "a.fixtures.tsx"],
		["`apps/playground/e2e/previews/feedback.e2e.ts`", "apps/playground/e2e/previews/feedback.e2e.ts"],
	])("flags %p", (text, match) => {
		expect(findUnshippableReferences(`${text}\n`)).toEqual([{ line: 1, match }]);
	});

	test("reports the line of each reference", () => {
		expect(findUnshippableReferences("fine\n`bun test` here\nfine\n`cn.test.ts`\n")).toEqual([
			{ line: 2, match: "bun test" },
			{ line: 4, match: "cn.test.ts" },
		]);
	});

	test("does not flag a word that merely contains bun", () => {
		expect(findUnshippableReferences("bundle, bunch, IconBun, bundler\n")).toEqual([]);
	});
});
