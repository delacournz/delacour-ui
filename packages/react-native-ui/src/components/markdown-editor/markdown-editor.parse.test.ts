import { describe, expect, test } from "bun:test";
import { isSafeUrl, type MarkdownBlock, type MarkdownInline, parseMarkdown } from "./markdown-editor.parse";

const text = (value: string): MarkdownInline => ({ type: "text", value });
const paragraph = (...children: MarkdownInline[]): MarkdownBlock => ({ children, type: "paragraph" });

/** The inline children of a source that parses to exactly one paragraph. */
function inline(source: string): MarkdownInline[] {
	const blocks = parseMarkdown(source);
	const [block] = blocks;
	if (blocks.length !== 1 || block?.type !== "paragraph") {
		throw new Error(`expected one paragraph from ${JSON.stringify(source)}`);
	}
	return block.children;
}

describe("blocks", () => {
	test("empty input parses to nothing", () => {
		expect(parseMarkdown("")).toEqual([]);
		expect(parseMarkdown("\n\n  \n")).toEqual([]);
	});

	test("headings one to three", () => {
		expect(parseMarkdown("# One\n## Two\n### Three")).toEqual([
			{ children: [text("One")], level: 1, type: "heading" },
			{ children: [text("Two")], level: 2, type: "heading" },
			{ children: [text("Three")], level: 3, type: "heading" },
		]);
	});

	test("four or more hashes, or no space, is a paragraph", () => {
		expect(parseMarkdown("#### Four")).toEqual([paragraph(text("#### Four"))]);
		expect(parseMarkdown("#tag")).toEqual([paragraph(text("#tag"))]);
	});

	test("a heading with no text is an empty heading", () => {
		expect(parseMarkdown("#")).toEqual([{ children: [], level: 1, type: "heading" }]);
	});

	test("blank lines split paragraphs and soft breaks join with a newline", () => {
		expect(parseMarkdown("one\ntwo\n\nthree")).toEqual([paragraph(text("one\ntwo")), paragraph(text("three"))]);
	});

	test("a heading interrupts a paragraph", () => {
		expect(parseMarkdown("one\n# Two")).toEqual([
			paragraph(text("one")),
			{ children: [text("Two")], level: 1, type: "heading" },
		]);
	});

	test("bullet lists, with any of the three markers", () => {
		expect(parseMarkdown("- a\n* b\n+ c")).toEqual([
			{ items: [[text("a")], [text("b")], [text("c")]], ordered: false, start: 1, type: "list" },
		]);
	});

	test("ordered lists keep their start number", () => {
		expect(parseMarkdown("3. a\n4) b")).toEqual([
			{ items: [[text("a")], [text("b")]], ordered: true, start: 3, type: "list" },
		]);
	});

	test("switching between bullets and numbers starts a new list", () => {
		const blocks = parseMarkdown("- a\n1. b");
		expect(blocks.map((block) => block.type)).toEqual(["list", "list"]);
	});

	test("a lazy line continues the item above it", () => {
		expect(parseMarkdown("- a\nmore")).toEqual([
			{ items: [[text("a\nmore")]], ordered: false, start: 1, type: "list" },
		]);
	});

	test("an indented item stays in the list", () => {
		expect(parseMarkdown("- a\n  - b")).toEqual([
			{ items: [[text("a")], [text("b")]], ordered: false, start: 1, type: "list" },
		]);
	});

	test("a quote holds blocks of its own", () => {
		expect(parseMarkdown("> # T\n> body\n>\n> - i")).toEqual([
			{
				children: [
					{ children: [text("T")], level: 1, type: "heading" },
					paragraph(text("body")),
					{ items: [[text("i")]], ordered: false, start: 1, type: "list" },
				],
				type: "quote",
			},
		]);
	});

	test("fenced code with and without a language", () => {
		expect(parseMarkdown("```ts\nconst a = 1;\n**not bold**\n```")).toEqual([
			{ language: "ts", type: "codeBlock", value: "const a = 1;\n**not bold**" },
		]);
		expect(parseMarkdown("```\nx\n```")).toEqual([{ language: null, type: "codeBlock", value: "x" }]);
	});

	test("an unterminated fence runs to the end", () => {
		expect(parseMarkdown("```\na\n\nb")).toEqual([{ language: null, type: "codeBlock", value: "a\n\nb" }]);
	});

	test("blank lines inside a fence are kept", () => {
		expect(parseMarkdown("```\na\n\nb\n```\nafter")).toEqual([
			{ language: null, type: "codeBlock", value: "a\n\nb" },
			paragraph(text("after")),
		]);
	});
});

describe("inline", () => {
	test("bold, italic, strikethrough and code", () => {
		expect(inline("**b** _i_ *j* ~~s~~ `c`")).toEqual([
			{ children: [text("b")], type: "bold" },
			text(" "),
			{ children: [text("i")], type: "italic" },
			text(" "),
			{ children: [text("j")], type: "italic" },
			text(" "),
			{ children: [text("s")], type: "strikethrough" },
			text(" "),
			{ type: "code", value: "c" },
		]);
	});

	test("double underscores are bold too", () => {
		expect(inline("__b__")).toEqual([{ children: [text("b")], type: "bold" }]);
	});

	test("nests", () => {
		expect(inline("**bold _both_**")).toEqual([
			{
				children: [text("bold "), { children: [text("both")], type: "italic" }],
				type: "bold",
			},
		]);
	});

	test("three asterisks are bold and italic", () => {
		expect(inline("***x***")).toEqual([{ children: [{ children: [text("x")], type: "italic" }], type: "bold" }]);
	});

	test("an underscore inside a word is literal", () => {
		expect(inline("snake_case_name")).toEqual([text("snake_case_name")]);
	});

	test("an escaped marker is literal", () => {
		expect(inline("\\*not\\* \\_this\\_")).toEqual([text("*not* _this_")]);
	});

	test("unclosed markers stay literal", () => {
		expect(inline("**open and `tick and [bracket")).toEqual([text("**open and `tick and [bracket")]);
	});

	test("a marker followed by a space does not open", () => {
		expect(inline("a * b * c")).toEqual([text("a * b * c")]);
	});

	test("code spans are literal inside", () => {
		expect(inline("`**x**`")).toEqual([{ type: "code", value: "**x**" }]);
	});

	test("links", () => {
		expect(inline("see [the **docs**](https://a.co) now")).toEqual([
			text("see "),
			{
				children: [text("the "), { children: [text("docs")], type: "bold" }],
				type: "link",
				url: "https://a.co",
			},
			text(" now"),
		]);
	});

	test("a link with no label shows its url", () => {
		expect(inline("[](https://a.co)")).toEqual([
			{ children: [text("https://a.co")], type: "link", url: "https://a.co" },
		]);
	});

	test("a link to an unsafe scheme drops to its label", () => {
		expect(inline("[click](javascript:alert(1))")).toEqual([text("click)")]);
		expect(inline("[click](javascript:void)")).toEqual([text("click")]);
		expect(inline("[x](url)")).toEqual([text("x")]);
	});

	test("a url with whitespace is not a link", () => {
		expect(inline("[a](b c)")).toEqual([text("[a](b c)")]);
	});
});

describe("isSafeUrl", () => {
	test("allows web, mail and phone links", () => {
		for (const url of ["https://a.co", "http://a.co/x?y=1", "mailto:a@b.co", "tel:+6421000000", "HTTPS://A.CO"]) {
			expect(isSafeUrl(url)).toBe(true);
		}
	});

	test("refuses everything else", () => {
		for (const url of [
			"javascript:alert(1)",
			" javascript:alert(1)",
			"JaVaScRiPt:alert(1)",
			"data:text/html,x",
			"file:///etc/passwd",
			"//evil.co",
			"url",
			"",
			"java\tscript:x",
			"https://a.co/\u0000",
		]) {
			expect(isSafeUrl(url)).toBe(false);
		}
	});
});

/**
 * The fastest of five runs, in milliseconds.
 *
 * A single run measures whatever else the machine is doing — CI shares its
 * cores, and a garbage collection can land in the middle of any one call. A
 * quadratic parser is slow on every run, so the minimum still catches it.
 */
function fastest(run: () => void): number {
	let best = Number.POSITIVE_INFINITY;
	for (let i = 0; i < 5; i++) {
		const started = performance.now();
		run();
		best = Math.min(best, performance.now() - started);
	}
	return best;
}

describe("performance", () => {
	const PATHOLOGICAL = [
		"*".repeat(100_000),
		"_a".repeat(50_000),
		"**a".repeat(33_000),
		"[".repeat(100_000),
		"[a](".repeat(25_000),
		"`".repeat(100_000),
		"~~a".repeat(33_000),
		"*a **b".repeat(16_000),
	];

	for (const source of PATHOLOGICAL) {
		test(`parses ${JSON.stringify(source.slice(0, 6))}… (${source.length} chars) in linear time`, () => {
			expect(fastest(() => parseMarkdown(source))).toBeLessThan(100);
		});
	}

	test("parses many lines quickly", () => {
		const source = Array.from({ length: 20_000 }, (_, i) => (i % 3 === 0 ? `- item ${i}` : `line **${i}**`)).join("\n");
		expect(fastest(() => parseMarkdown(source))).toBeLessThan(250);
	});
});
