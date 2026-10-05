import { describe, expect, test } from "bun:test";
import { declaredTokens } from "../../styles/theme-tokens.test";
import { BUTTON_ICON_SIZES } from "../button/button.variants";
import { INPUT_SIZES, INPUT_VARIANTS, inputVariants } from "../input/input.variants";
import { TABS_SIZES } from "../tabs/tabs.variants";
import type { MarkdownInline } from "./markdown-editor.parse";
import type { MarkdownToolbarAction } from "./markdown-editor.types";
import {
	MARKDOWN_ACTION_LABELS,
	MARKDOWN_DEFAULT_TOOLBAR_ACTIONS,
	MARKDOWN_EDITOR_ACTION_SIZE,
	MARKDOWN_EDITOR_DEFAULT_ROWS,
	MARKDOWN_EDITOR_SIZES,
	MARKDOWN_EDITOR_TABS_SIZE,
	MARKDOWN_EDITOR_VARIANTS,
	MARKDOWN_TOOLBAR_ACTIONS,
	MARKDOWN_TOOLBAR_VARIANTS,
	markdownEditorVariants,
	markdownInlineToText,
	resolveMarkdownActionCommand,
	resolveMarkdownActionIsActive,
	resolveMarkdownAnnouncement,
	resolveMarkdownListMarker,
	resolveMarkdownPaneClass,
	resolveMarkdownToolbarActions,
} from "./markdown-editor.variants";

const SEMANTIC_COLOR = /(?:^|\s)(?:bg|text|border)-([a-z-]+?)(?:\/\d+)?(?=\s|$)/g;

/** Every colour token a class string names, as the raw `--name` `theme.css` declares. */
function colorTokens(cls: string): string[] {
	const names: string[] = [];
	for (const match of cls.matchAll(SEMANTIC_COLOR)) {
		const name = match[1];
		if (!name || /^(?:\d|xs|sm|md|lg|xl|l-|t-|b-|r-|x-|y-|0|2|transparent|input-|button-)/.test(name)) continue;
		names.push(name);
	}
	return names;
}

describe("axes", () => {
	test("sizes and variants follow Input's", () => {
		expect([...MARKDOWN_EDITOR_SIZES]).toEqual([...INPUT_SIZES]);
		expect([...MARKDOWN_EDITOR_VARIANTS]).toEqual([...INPUT_VARIANTS]);
	});

	test("the toolbar has two looks", () => {
		expect([...MARKDOWN_TOOLBAR_VARIANTS]).toEqual(["bar", "pill"]);
	});

	test("eight rows by default", () => {
		expect(MARKDOWN_EDITOR_DEFAULT_ROWS).toBe(8);
	});

	test("each size steps the action button and the mode switch together", () => {
		for (const size of MARKDOWN_EDITOR_SIZES) {
			expect(BUTTON_ICON_SIZES).toContain(MARKDOWN_EDITOR_ACTION_SIZE[size]);
			expect(TABS_SIZES).toContain(MARKDOWN_EDITOR_TABS_SIZE[size]);
		}
		expect(MARKDOWN_EDITOR_ACTION_SIZE).toEqual({ sm: "icon-sm", md: "icon-md", lg: "icon-lg" });
	});
});

describe("toolbar actions", () => {
	test("every action has a spoken label", () => {
		for (const action of MARKDOWN_TOOLBAR_ACTIONS) {
			expect(MARKDOWN_ACTION_LABELS[action].length).toBeGreaterThan(0);
		}
	});

	test("the default set is every action, heading first", () => {
		expect(MARKDOWN_DEFAULT_TOOLBAR_ACTIONS[0]).toBe("heading");
		expect(new Set(MARKDOWN_DEFAULT_TOOLBAR_ACTIONS)).toEqual(new Set(MARKDOWN_TOOLBAR_ACTIONS));
	});

	test("a subset keeps the caller's order and drops repeats", () => {
		expect(resolveMarkdownToolbarActions(["link", "bold", "link"])).toEqual(["link", "bold"]);
		expect(resolveMarkdownToolbarActions(undefined)).toEqual(MARKDOWN_DEFAULT_TOOLBAR_ACTIONS);
		expect(resolveMarkdownToolbarActions([])).toEqual([]);
	});

	test("heading steps through the levels from the caret's line", () => {
		const caret = { end: 0, start: 0 };
		expect(resolveMarkdownActionCommand("heading", "plain", caret)).toEqual({ level: 1, type: "heading" });
		expect(resolveMarkdownActionCommand("heading", "# one", caret)).toEqual({ level: 2, type: "heading" });
		expect(resolveMarkdownActionCommand("heading", "## two", caret)).toEqual({ level: 3, type: "heading" });
		expect(resolveMarkdownActionCommand("heading", "### three", caret)).toEqual({ level: 3, type: "heading" });
	});

	test("every other action maps to the command of the same name", () => {
		const others = MARKDOWN_TOOLBAR_ACTIONS.filter(
			(action): action is Exclude<MarkdownToolbarAction, "heading"> => action !== "heading"
		);
		for (const action of others) {
			expect(resolveMarkdownActionCommand(action, "", { end: 0, start: 0 })).toEqual({ type: action });
		}
	});

	test("an action is lit when its command is active", () => {
		expect(resolveMarkdownActionIsActive("bold", ["bold", "heading"])).toBe(true);
		expect(resolveMarkdownActionIsActive("heading", ["heading"])).toBe(true);
		expect(resolveMarkdownActionIsActive("italic", ["bold"])).toBe(false);
	});

	test("the announcement says what the press did", () => {
		expect(resolveMarkdownAnnouncement("bold", false)).toBe("Bold applied");
		expect(resolveMarkdownAnnouncement("bulletList", true)).toBe("Bulleted list removed");
	});
});

describe("preview helpers", () => {
	test("list markers: a bullet, or the item's number from the list's start", () => {
		expect(resolveMarkdownListMarker(false, 1, 0)).toBe("•");
		expect(resolveMarkdownListMarker(true, 1, 0)).toBe("1.");
		expect(resolveMarkdownListMarker(true, 4, 2)).toBe("6.");
	});

	test("inline content flattens to its plain text", () => {
		const inline: MarkdownInline[] = [
			{ type: "text", value: "Read " },
			{
				children: [
					{ type: "text", value: "the " },
					{ children: [{ type: "text", value: "docs" }], type: "italic" },
				],
				type: "bold",
			},
			{ type: "code", value: " now" },
			{ children: [{ type: "text", value: "!" }], type: "link", url: "https://example.com" },
		];
		expect(markdownInlineToText(inline)).toBe("Read the docs now!");
	});
});

describe("panes", () => {
	test("a pane under a bar toolbar loses its top corners", () => {
		expect(resolveMarkdownPaneClass({ isAttached: true })).toContain("rounded-t-none");
		expect(resolveMarkdownPaneClass({ isAttached: false })).not.toContain("rounded-t-none");
	});

	test("a caller's class merges last", () => {
		expect(resolveMarkdownPaneClass({ className: "rounded-t-xl", isAttached: true })).toContain("rounded-t-xl");
		expect(resolveMarkdownPaneClass({ className: "rounded-t-xl", isAttached: true })).not.toContain("rounded-t-none");
	});

	test("the write pane is monospaced", () => {
		expect(markdownEditorVariants().input()).toContain("font-mono");
	});

	test("the preview restates Input's box for each variant", () => {
		const box = (variant: "primary" | "secondary"): string[] =>
			(inputVariants({ variant }).root() ?? "").split(" ").filter((cls) => /^(?:bg|border)-[a-z]/.test(cls));
		for (const variant of MARKDOWN_EDITOR_VARIANTS) {
			const preview = markdownEditorVariants({ variant }).preview() ?? "";
			for (const cls of box(variant)) expect(preview).toContain(cls);
		}
	});

	test("the mode switch has a definite width at every size", () => {
		for (const size of MARKDOWN_EDITOR_SIZES) {
			expect(markdownEditorVariants({ size }).modeSwitch()).toMatch(/(?:^|\s)w-\d+(?:\s|$)/);
		}
	});

	test("the bar is a card row and the pill a floating capsule", () => {
		expect(markdownEditorVariants({ toolbar: "bar" }).toolbar()).toContain("bg-card");
		const pill = markdownEditorVariants({ toolbar: "pill" }).actions() ?? "";
		expect(pill).toContain("rounded-full");
		expect(pill).toContain("bg-elevated");
	});
});

describe("tokens", () => {
	const slots = [
		...MARKDOWN_TOOLBAR_VARIANTS.flatMap((toolbar) =>
			MARKDOWN_EDITOR_VARIANTS.map((variant) => markdownEditorVariants({ toolbar, variant }))
		),
	];
	const classes = slots.flatMap((slot) => [
		slot.root(),
		slot.toolbar(),
		slot.actions(),
		slot.actionRow(),
		slot.inlineCode(),
		slot.modeSwitch(),
		slot.input(),
		slot.preview(),
		slot.quote(),
		slot.codeBlock(),
		slot.listItem(),
		slot.listMarker(),
	]);

	test("every colour class names a token both themes declare", () => {
		const light = declaredTokens("light");
		const dark = declaredTokens("dark");
		const names = new Set(classes.flatMap((cls) => colorTokens(cls ?? "")));
		expect(names.size).toBeGreaterThan(0);
		for (const name of names) {
			expect(light.has(name)).toBe(true);
			expect(dark.has(name)).toBe(true);
		}
	});
});
