import { describe, expect, test } from "bun:test";
import {
	applyMarkdownCommand,
	continueMarkdownList,
	getActiveMarkdownCommands,
	getNextHeadingLevel,
	normalizeMarkdownSelection,
} from "./markdown-editor.commands";
import type { MarkdownCommand, MarkdownEdit, MarkdownSelection } from "./markdown-editor.types";

/*
 * Fixtures are written with the selection drawn into the text: `‸` is a caret,
 * `⟦` and `⟧` bound a selection. Neither character appears in Markdown, so a
 * fixture can hold brackets, pipes and backticks without escaping anything.
 */
const CARET = "‸";
const OPEN = "⟦";
const CLOSE = "⟧";

function parse(fixture: string): { text: string; selection: MarkdownSelection } {
	const caret = fixture.indexOf(CARET);
	if (caret !== -1) {
		return { selection: { end: caret, start: caret }, text: fixture.replace(CARET, "") };
	}
	const open = fixture.indexOf(OPEN);
	const close = fixture.indexOf(CLOSE);
	if (open === -1 || close === -1) throw new Error(`fixture has no selection: ${fixture}`);
	const text = fixture.replace(OPEN, "").replace(CLOSE, "");
	return { selection: { end: close - 1, start: open }, text };
}

function draw({ text, selection }: MarkdownEdit): string {
	if (selection.start === selection.end) {
		return `${text.slice(0, selection.start)}${CARET}${text.slice(selection.start)}`;
	}
	return `${text.slice(0, selection.start)}${OPEN}${text.slice(selection.start, selection.end)}${CLOSE}${text.slice(selection.end)}`;
}

function run(fixture: string, command: MarkdownCommand): string {
	const { text, selection } = parse(fixture);
	return draw(applyMarkdownCommand(text, selection, command));
}

const BOLD: MarkdownCommand = { type: "bold" };
const ITALIC: MarkdownCommand = { type: "italic" };
const CODE: MarkdownCommand = { type: "code" };
const STRIKE: MarkdownCommand = { type: "strikethrough" };
const CODE_BLOCK: MarkdownCommand = { type: "codeBlock" };
const QUOTE: MarkdownCommand = { type: "quote" };
const BULLETS: MarkdownCommand = { type: "bulletList" };
const NUMBERS: MarkdownCommand = { type: "orderedList" };
const LINK: MarkdownCommand = { type: "link" };
const h = (level: 1 | 2 | 3): MarkdownCommand => ({ level, type: "heading" });

describe("bold", () => {
	test("wraps a selection and keeps it selected", () => {
		expect(run("say ⟦hi⟧ now", BOLD)).toBe("say **⟦hi⟧** now");
	});

	test("unwraps a selection sitting inside markers", () => {
		expect(run("say **⟦hi⟧** now", BOLD)).toBe("say ⟦hi⟧ now");
	});

	test("unwraps a selection that includes the markers", () => {
		expect(run("say ⟦**hi**⟧ now", BOLD)).toBe("say ⟦hi⟧ now");
	});

	test("inserts an empty pair at a caret and puts the caret between", () => {
		expect(run("say ‸", BOLD)).toBe("say **‸**");
	});

	test("removes an empty pair the caret sits in", () => {
		expect(run("say **‸**", BOLD)).toBe("say ‸");
	});

	test("unwraps the run a caret sits inside", () => {
		expect(run("a **he‸llo** b", BOLD)).toBe("a he‸llo b");
	});

	test("trims whitespace off the edges of a selection before wrapping", () => {
		expect(run("say ⟦hi ⟧now", BOLD)).toBe("say **⟦hi⟧** now");
	});

	test("wraps each line of a multi-line selection on its own", () => {
		expect(run("⟦one\ntwo⟧", BOLD)).toBe("**⟦one**\n**two⟧**");
	});

	test("never lets a marker span a line break, and skips blank lines", () => {
		expect(run("⟦one\n\ntwo⟧", BOLD)).toBe("**⟦one**\n\n**two⟧**");
	});

	test("unwraps every line when every line is wrapped", () => {
		expect(run("**⟦one**\n**two⟧**", BOLD)).toBe("⟦one\ntwo⟧");
	});

	test("extends a run the selection only partly covers", () => {
		expect(run("**h⟦ello** wor⟧ld", BOLD)).toBe("**⟦hello wor⟧**ld");
	});

	test("toggles the bold half of a bold-italic run", () => {
		expect(run("***⟦x⟧***", BOLD)).toBe("*⟦x⟧*");
		expect(run("*⟦x⟧*", BOLD)).toBe("***⟦x⟧***");
	});
});

describe("italic", () => {
	test("wraps with underscores", () => {
		expect(run("⟦hi⟧", ITALIC)).toBe("_⟦hi⟧_");
	});

	test("does not mistake bold markers for its own", () => {
		expect(run("**⟦hi⟧**", ITALIC)).toBe("**_⟦hi⟧_**");
	});

	test("unwraps inside bold without touching it", () => {
		expect(run("**_⟦hi⟧_**", ITALIC)).toBe("**⟦hi⟧**");
	});

	test("ignores underscores inside a word", () => {
		expect(run("snake_ca‸se_name", ITALIC)).toBe("snake_ca_‸_se_name");
	});
});

describe("code and strikethrough", () => {
	test("code wraps with a backtick and toggles back", () => {
		expect(run("run ⟦bun test⟧", CODE)).toBe("run `⟦bun test⟧`");
		expect(run("run `⟦bun test⟧`", CODE)).toBe("run ⟦bun test⟧");
	});

	test("strikethrough wraps with tildes and toggles back", () => {
		expect(run("⟦old⟧", STRIKE)).toBe("~~⟦old⟧~~");
		expect(run("~~⟦old⟧~~", STRIKE)).toBe("⟦old⟧");
	});
});

describe("code block", () => {
	test("puts a fenced template on an empty line with the caret inside", () => {
		expect(run("‸", CODE_BLOCK)).toBe("```\n‸\n```");
		expect(run("intro\n‸", CODE_BLOCK)).toBe("intro\n```\n‸\n```");
	});

	test("fences the touched lines and keeps them selected", () => {
		expect(run("⟦a\nb⟧", CODE_BLOCK)).toBe("```\n⟦a\nb⟧\n```");
	});

	test("fences the line a caret sits on", () => {
		expect(run("le‸t x = 1", CODE_BLOCK)).toBe("```\nle‸t x = 1\n```");
	});

	test("removes the fences around a caret inside a block", () => {
		expect(run("```\nle‸t x = 1\n```", CODE_BLOCK)).toBe("le‸t x = 1");
	});

	test("removes the fences of a block with a language", () => {
		expect(run("a\n```ts\nx‸\n```\nb", CODE_BLOCK)).toBe("a\nx‸\nb");
	});

	test("removes the template it inserted", () => {
		expect(run("```\n‸\n```", CODE_BLOCK)).toBe("‸");
	});

	test("removes the opening fence of an unterminated block", () => {
		expect(run("```\nx‸", CODE_BLOCK)).toBe("x‸");
	});
});

describe("link", () => {
	test("wraps a selection and selects the url placeholder", () => {
		expect(run("see ⟦the docs⟧", LINK)).toBe("see [the docs](⟦url⟧)");
	});

	test("uses a url when the command carries one", () => {
		expect(run("⟦docs⟧", { type: "link", url: "https://a.co" })).toBe("[docs](⟦https://a.co⟧)");
	});

	test("inserts an empty template at a caret with the url selected", () => {
		expect(run("see ‸", LINK)).toBe("see [](⟦url⟧)");
	});

	test("turns a selected url into a link with a label to fill in", () => {
		expect(run("⟦https://a.co⟧", LINK)).toBe("[⟦link⟧](https://a.co)");
	});

	test("unwraps the link a caret sits in, keeping its text", () => {
		expect(run("see [the d‸ocs](https://a.co) now", LINK)).toBe("see the d‸ocs now");
	});

	test("unwraps when the caret sits in the url", () => {
		expect(run("[docs](https://a‸.co)", LINK)).toBe("docs‸");
	});

	test("only links the first line of a multi-line selection", () => {
		expect(run("⟦a\nb⟧", LINK)).toBe("[a](⟦url⟧)\nb");
	});
});

describe("heading", () => {
	test("sets the marker on the caret's line", () => {
		expect(run("Tit‸le", h(1))).toBe("# Tit‸le");
		expect(run("‸", h(2))).toBe("## ‸");
	});

	test("removes the same level", () => {
		expect(run("## Tit‸le", h(2))).toBe("Tit‸le");
	});

	test("replaces a different level", () => {
		expect(run("# Tit‸le", h(3))).toBe("### Tit‸le");
	});

	test("replaces only a heading marker, never a list marker", () => {
		expect(run("- it‸em", h(1))).toBe("# - it‸em");
	});

	test("applies to every touched line and selects them", () => {
		expect(run("o⟦ne\ntw⟧o", h(1))).toBe("⟦# one\n# two⟧");
	});

	test("keeps a caret in the marker on the content's first character", () => {
		expect(run("#‸# Title", h(2))).toBe("‸Title");
	});
});

describe("quote", () => {
	test("prefixes the caret's line", () => {
		expect(run("wi‸se", QUOTE)).toBe("> wi‸se");
	});

	test("removes the prefix when every line is quoted", () => {
		expect(run("> o⟦ne\n> tw⟧o", QUOTE)).toBe("⟦one\ntwo⟧");
	});

	test("adds a level to every line when only some are quoted", () => {
		expect(run("> o⟦ne\ntw⟧o", QUOTE)).toBe("⟦> > one\n> two⟧");
	});
});

describe("lists", () => {
	test("bullets the caret's line", () => {
		expect(run("ite‸m", BULLETS)).toBe("- ite‸m");
	});

	test("numbers touched lines from one and skips blank ones", () => {
		expect(run("⟦a\n\nb\nc⟧", NUMBERS)).toBe("⟦1. a\n\n2. b\n3. c⟧");
	});

	test("replaces a bullet with a number and back", () => {
		expect(run("- a‸", NUMBERS)).toBe("1. a‸");
		expect(run("1. a‸", BULLETS)).toBe("- a‸");
	});

	test("toggles off when every line already has the marker", () => {
		expect(run("⟦- a\n- b⟧", BULLETS)).toBe("⟦a\nb⟧");
		expect(run("⟦1. a\n2. b⟧", NUMBERS)).toBe("⟦a\nb⟧");
	});

	test("keeps a line's indent", () => {
		expect(run("  ite‸m", BULLETS)).toBe("  - ite‸m");
		expect(run("  - ite‸m", BULLETS)).toBe("  ite‸m");
	});

	test("puts a marker on an empty line so typing can start", () => {
		expect(run("‸", BULLETS)).toBe("- ‸");
	});
});

describe("selection invariants", () => {
	const COMMANDS: MarkdownCommand[] = [
		BOLD,
		ITALIC,
		CODE,
		STRIKE,
		CODE_BLOCK,
		QUOTE,
		BULLETS,
		NUMBERS,
		LINK,
		h(1),
		h(2),
		h(3),
	];
	const TEXTS = ["", "a", "hello world", "one\ntwo\n\nthree", "# h\n- a\n> q", "**b** _i_ `c`", "emoji 😀 here"];

	test("always stays inside the text and ordered", () => {
		for (const text of TEXTS) {
			for (let start = 0; start <= text.length; start++) {
				for (let end = start; end <= text.length; end++) {
					for (const command of COMMANDS) {
						const edit = applyMarkdownCommand(text, { end, start }, command);
						expect(edit.selection.start).toBeGreaterThanOrEqual(0);
						expect(edit.selection.start).toBeLessThanOrEqual(edit.selection.end);
						expect(edit.selection.end).toBeLessThanOrEqual(edit.text.length);
					}
				}
			}
		}
	});

	test("normalises a reversed selection", () => {
		expect(applyMarkdownCommand("say hi", { end: 4, start: 6 }, BOLD).text).toBe("say **hi**");
	});

	test("clamps a selection past the end", () => {
		expect(normalizeMarkdownSelection("abc", { end: 99, start: -4 })).toEqual({ end: 3, start: 0 });
	});

	test("never splits a surrogate pair", () => {
		const text = "a😀b";
		expect(normalizeMarkdownSelection(text, { end: 2, start: 2 })).toEqual({ end: 1, start: 1 });
		expect(normalizeMarkdownSelection(text, { end: 2, start: 0 })).toEqual({ end: 3, start: 0 });
		expect(normalizeMarkdownSelection(text, { end: 2, start: 1 })).toEqual({ end: 3, start: 1 });
	});

	test("works at the very start and end of the text", () => {
		expect(run("‸abc", BOLD)).toBe("**‸**abc");
		expect(run("abc‸", BOLD)).toBe("abc**‸**");
	});
});

describe("toggling twice restores the text exactly", () => {
	const CASES: [string, MarkdownCommand][] = [
		["say ⟦hi⟧ now", BOLD],
		["say ‸", BOLD],
		["⟦one\ntwo⟧", BOLD],
		["⟦hi⟧", ITALIC],
		["**⟦hi⟧**", ITALIC],
		["*⟦x⟧*", BOLD],
		["⟦x⟧", CODE],
		["⟦x⟧", STRIKE],
		["‸", CODE_BLOCK],
		["⟦a\nb⟧", CODE_BLOCK],
		["see ⟦docs⟧", LINK],
		["Tit‸le", h(1)],
		["⟦one\ntwo⟧", h(3)],
		["⟦a\nb⟧", QUOTE],
		["> o⟦ne\ntw⟧o", QUOTE],
		["⟦a\n\nb⟧", BULLETS],
		["⟦a\nb⟧", NUMBERS],
	];

	for (const [fixture, command] of CASES) {
		test(`${command.type} on ${JSON.stringify(fixture)}`, () => {
			const { text, selection } = parse(fixture);
			const once = applyMarkdownCommand(text, selection, command);
			const twice = applyMarkdownCommand(once.text, once.selection, command);
			expect(twice.text).toBe(text);
		});
	}
});

describe("getActiveMarkdownCommands", () => {
	const active = (fixture: string): readonly string[] => {
		const { text, selection } = parse(fixture);
		return getActiveMarkdownCommands(text, selection);
	};

	test("reports inline marks around the caret", () => {
		expect(active("a **b‸** c")).toEqual(["bold"]);
		expect(active("a _b‸_ c")).toEqual(["italic"]);
		expect(active("a `b‸` c")).toEqual(["code"]);
		expect(active("a ~~b‸~~ c")).toEqual(["strikethrough"]);
		expect(active("[a‸](u)")).toEqual(["link"]);
	});

	test("reports line formats", () => {
		expect(active("# T‸")).toEqual(["heading"]);
		expect(active("- i‸")).toEqual(["bulletList"]);
		expect(active("3. i‸")).toEqual(["orderedList"]);
		expect(active("> q‸")).toEqual(["quote"]);
	});

	test("reports a fenced block", () => {
		expect(active("```\nx‸\n```")).toEqual(["codeBlock"]);
	});

	test("reports several at once", () => {
		expect(active("# **_b‸_**")).toEqual(["heading", "bold", "italic"]);
	});

	test("reports nothing in plain text, and nothing for an intraword underscore", () => {
		expect(active("plain‸")).toEqual([]);
		expect(active("snake_ca‸se_name")).toEqual([]);
	});

	test("ignores inline marks inside a fenced block", () => {
		expect(active("```\n**b‸**\n```")).toEqual(["codeBlock"]);
	});
});

describe("getNextHeadingLevel", () => {
	test("cycles one, two, three, then off", () => {
		expect(getNextHeadingLevel("T", { end: 0, start: 0 })).toBe(1);
		expect(getNextHeadingLevel("# T", { end: 0, start: 0 })).toBe(2);
		expect(getNextHeadingLevel("## T", { end: 0, start: 0 })).toBe(3);
		expect(getNextHeadingLevel("### T", { end: 0, start: 0 })).toBe(3);
	});
});

describe("continueMarkdownList", () => {
	const enter = (prev: string, at = prev.length): string | null => {
		const next = `${prev.slice(0, at)}\n${prev.slice(at)}`;
		const edit = continueMarkdownList(prev, next, at);
		return edit ? draw(edit) : null;
	};

	test("continues a bullet with the same marker", () => {
		expect(enter("- a")).toBe("- a\n- ‸");
		expect(enter("* a")).toBe("* a\n* ‸");
	});

	test("numbers the next item", () => {
		expect(enter("1. a")).toBe("1. a\n2. ‸");
		expect(enter("9) a")).toBe("9) a\n10) ‸");
	});

	test("continues a quote", () => {
		expect(enter("> a")).toBe("> a\n> ‸");
	});

	test("keeps a nested item's indent", () => {
		expect(enter("  - a")).toBe("  - a\n  - ‸");
	});

	test("ends the list on an empty item", () => {
		expect(enter("- a\n- ")).toBe("- a\n‸");
		expect(enter("- a\n2. ")).toBe("- a\n‸");
	});

	test("continues from the middle of the text, between items", () => {
		expect(enter("- a\n- b", 3)).toBe("- a\n- ‸\n- b");
	});

	test("treats a caret that could be either side of the newline as no caret", () => {
		expect(continueMarkdownList("- a\n- b", "- a\n\n- b", 4)).toBeNull();
	});

	test("without a caret, takes the latest point a run of newlines allows", () => {
		expect(continueMarkdownList("- a\n", "- a\n\n")).toBeNull();
		expect(continueMarkdownList("- a", "- a\n")?.text).toBe("- a\n- ");
	});

	test("lets a blank line follow a list that has already ended", () => {
		expect(enter("- a\n")).toBeNull();
	});

	test("splits an item at the caret", () => {
		expect(enter("- ab", 3)).toBe("- a\n- ‸b");
	});

	test("does nothing for plain lines, or with the caret inside the marker", () => {
		expect(enter("plain")).toBeNull();
		expect(enter("- a", 1)).toBeNull();
	});

	test("does nothing inside a fenced block", () => {
		expect(enter("```\n- a")).toBeNull();
	});

	test("ignores edits that are not one newline", () => {
		expect(continueMarkdownList("- a", "- ab")).toBeNull();
		expect(continueMarkdownList("- a", "- a\nb")).toBeNull();
		expect(continueMarkdownList("- a", "- ")).toBeNull();
	});
});
