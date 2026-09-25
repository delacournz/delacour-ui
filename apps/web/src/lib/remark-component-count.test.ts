import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { remark } from "remark";
import remarkMdx from "remark-mdx";
import { COMPONENTS } from "./components";
import { numberToWordsCapitalised } from "./number-words";
import { remarkComponentCount } from "./remark-component-count";

/**
 * The one place the count is a word rather than a number. `index.mdx` said
 * "Nineteen" for a whole component after the twentieth landed, and nothing
 * noticed; a test then pinned the word, and every branch adding a component
 * edited both. Now the page writes `<ComponentCount />` and this plugin spells
 * the list's length in its place — before MDX compiles, so the HTML, the `.md`
 * twin, `llms-full.txt` and the search index all get the word.
 */
const INDEX = join(import.meta.dirname, "..", "..", "content/docs/native/components/index.mdx");

function render(mdx: string): string {
	return remark().use(remarkMdx).use(remarkComponentCount).processSync(mdx).toString();
}

describe("remarkComponentCount", () => {
	const word = numberToWordsCapitalised(COMPONENTS.length);

	test("spells the number of components there actually are", () => {
		expect(render("<ComponentCount /> components, each on its own import subpath.\n")).toBe(
			`${word} components, each on its own import subpath.\n`
		);
	});

	test("merges the word into the sentence's text node, so React hydrates one string", () => {
		const tree = remark().use(remarkMdx).parse("Now <ComponentCount /> components.\n");
		remark().use(remarkComponentCount).runSync(tree);
		const [paragraph] = tree.children;
		expect(paragraph?.type).toBe("paragraph");
		if (paragraph?.type !== "paragraph") return;
		expect(paragraph.children).toEqual([{ type: "text", value: `Now ${word} components.` }]);
	});

	test("replaces the element on its own line too", () => {
		expect(render("Before.\n\n<ComponentCount />\n\nAfter.\n")).toBe(`Before.\n\n${word}\n\nAfter.\n`);
	});

	test("leaves every other element alone", () => {
		expect(render("<PreviewGrid />\n")).toBe("<PreviewGrid />\n");
		expect(render("A <Badge>count</Badge> here.\n")).toBe("A <Badge>count</Badge> here.\n");
	});
});

describe("the components index page", () => {
	test("opens with the component, and the rendered sentence counts the list", () => {
		const page = readFileSync(INDEX, "utf-8");
		expect(page).toMatch(/^<ComponentCount \/> components,/m);
		expect(page).not.toMatch(/^[A-Z][a-z-]+ components/m);

		const body = page.replace(/^---[\s\S]*?---\n/, "");
		expect(render(body)).toMatch(new RegExp(`^${numberToWordsCapitalised(COMPONENTS.length)} components,`, "m"));
	});
});
