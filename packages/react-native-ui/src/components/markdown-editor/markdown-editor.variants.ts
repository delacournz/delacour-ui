import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { ButtonIconSize } from "../button/button.variants";
import { INPUT_VARIANTS, type InputSize, type InputVariant, inputVariants } from "../input/input.variants";
import type { TabsSize } from "../tabs/tabs.variants";
import { getNextHeadingLevel } from "./markdown-editor.commands";
import type { MarkdownInline } from "./markdown-editor.parse";
import type {
	MarkdownCommand,
	MarkdownCommandType,
	MarkdownSelection,
	MarkdownToolbarAction,
} from "./markdown-editor.types";

export const MARKDOWN_EDITOR_SIZES = ["sm", "md", "lg"] as const satisfies readonly InputSize[];
/**
 * The fill, edge and shadow utilities Input draws for a variant, read from
 * `inputVariants` itself so an `etched` (or any later) variant follows Input.
 */
function inputSurface(variant: InputVariant): string {
	return inputVariants({ variant })
		.root()
		.split(/\s+/)
		.filter((cls) => /^(dark:)?(bg|border|shadow)-/.test(cls))
		.join(" ");
}

/**
 * The corner utilities a multiline Input draws at a size, read from
 * `inputVariants` itself so the preview's corners follow the write pane's.
 */
function inputRadius(size: InputSize): string {
	return inputVariants({ isMultiline: true, size })
		.root()
		.split(/\s+/)
		.filter((cls) => cls.startsWith("rounded"))
		.join(" ");
}

export const MARKDOWN_EDITOR_VARIANTS = INPUT_VARIANTS;
export const MARKDOWN_TOOLBAR_VARIANTS = ["bar", "pill"] as const;

export type MarkdownEditorSize = (typeof MARKDOWN_EDITOR_SIZES)[number];
export type MarkdownEditorVariant = (typeof MARKDOWN_EDITOR_VARIANTS)[number];
export type MarkdownToolbarVariant = (typeof MARKDOWN_TOOLBAR_VARIANTS)[number];

/** How many lines tall the write pane is when `rows` is not named — a note, not a one-liner. */
export const MARKDOWN_EDITOR_DEFAULT_ROWS = 8;

/** Every action a toolbar can hold, in the order the default toolbar shows them. */
export const MARKDOWN_TOOLBAR_ACTIONS = [
	"heading",
	"bold",
	"italic",
	"strikethrough",
	"link",
	"code",
	"codeBlock",
	"quote",
	"bulletList",
	"orderedList",
] as const satisfies readonly MarkdownToolbarAction[];

/** What a toolbar shows when it names no `actions`: all of them. A phone's row scrolls past the edge. */
export const MARKDOWN_DEFAULT_TOOLBAR_ACTIONS: readonly MarkdownToolbarAction[] = MARKDOWN_TOOLBAR_ACTIONS;

/** The spoken name of each action — its accessibility label, and the subject of its announcement. */
export const MARKDOWN_ACTION_LABELS: Record<MarkdownToolbarAction, string> = {
	bold: "Bold",
	bulletList: "Bulleted list",
	code: "Inline code",
	codeBlock: "Code block",
	heading: "Heading",
	italic: "Italic",
	link: "Link",
	orderedList: "Numbered list",
	quote: "Quote",
	strikethrough: "Strikethrough",
};

/** The square button an action draws at each editor size — the button's own `icon-*` step, never a number. */
export const MARKDOWN_EDITOR_ACTION_SIZE: Record<MarkdownEditorSize, ButtonIconSize> = {
	sm: "icon-sm",
	md: "icon-md",
	lg: "icon-lg",
};

/** The mode switch's step at each editor size. The two scales share names, so this is an identity, pinned. */
export const MARKDOWN_EDITOR_TABS_SIZE: Record<MarkdownEditorSize, TabsSize> = { sm: "sm", md: "md", lg: "lg" };

/**
 * Styling for every part the editor draws.
 *
 * The write pane's box is `Textarea`'s — `Input`'s, really — and is not
 * restated: `input` adds only the monospaced face. `preview` is the one
 * surface the editor paints itself, and it restates `Input`'s two boxes so
 * flipping modes does not change what kind of box is on screen: outlined on
 * `bg-card` for `primary`, filled `bg-secondary` for `secondary`.
 *
 * Its corners are the write pane's too, per size, and it takes its box as
 * `base` in {@link resolveMarkdownPaneClass} rather than as a className, so a
 * `bar` toolbar's square top corners are not overridden by its own radius.
 *
 * `inlineCode` lifts `Text.Code`'s muted run to `bg-card` on the filled
 * `secondary` preview, where muted on secondary would draw no run at all.
 *
 * `modeSwitch` is a definite width, per size: its triggers are `flex-1` in a
 * bar that does not scroll, so with no width of its own the switch collapses
 * to its padding beside an action row that takes every point it is offered.
 *
 * `toolbar` picks the bar's look. A `bar` is a card row sitting on the pane's
 * top edge — the pane drops its top corners to meet it, see
 * {@link resolveMarkdownPaneClass}. A `pill` is a floating capsule centred
 * above the pane, icon-only.
 *
 * Free of React Native imports so it stays unit-testable. See AGENTS.md.
 */
export const markdownEditorVariants = tv({
	slots: {
		root: "gap-2",
		toolbar: "flex-row items-center gap-2",
		actions: "",
		actionRow: "flex-row items-center",
		input: "font-mono",
		pane: "",
		preview: "gap-3 px-3 py-3",
		quote: "gap-2 border-l-2 border-border pl-3",
		codeBlock: "rounded-md border border-border bg-card p-3",
		listItem: "flex-row gap-2",
		listMarker: "min-w-5 text-muted-foreground tabular-nums",
		modeSwitch: "shrink-0",
		inlineCode: "",
	},
	variants: {
		size: {
			sm: { modeSwitch: "w-40", preview: inputRadius("sm") },
			md: { modeSwitch: "w-52", preview: inputRadius("md") },
			lg: { modeSwitch: "w-60", preview: inputRadius("lg") },
		},
		toolbar: {
			bar: {
				root: "gap-0",
				toolbar: "rounded-t-lg border border-b-0 border-border bg-card px-1 py-1",
				actions: "flex-1",
				actionRow: "gap-0.5",
			},
			pill: {
				toolbar: "justify-center",
				actions: "shrink grow-0 overflow-hidden rounded-full border border-border bg-elevated",
				actionRow: "px-1 py-1",
			},
		},
		variant: {
			primary: { preview: "border border-input bg-card" },
			secondary: { preview: "border border-transparent bg-secondary", inlineCode: "bg-card" },
			etched: { preview: `border ${inputSurface("etched")}` },
		},
	},
	defaultVariants: {
		size: "md",
		toolbar: "bar",
		variant: "primary",
	},
});

export type MarkdownEditorVariantProps = VariantProps<typeof markdownEditorVariants>;

/**
 * The class for a pane — the write field or the preview box.
 *
 * Under a `bar` toolbar the pane drops its top corners so the two read as one
 * box, the bar its lid. `base` is the pane's own box, merged first so its
 * radius cannot win over the lid's square corners. A caller's className is
 * merged last and still wins.
 */
export function resolveMarkdownPaneClass({
	isAttached,
	base,
	className,
}: {
	isAttached: boolean;
	base?: string;
	className?: string;
}): string {
	return markdownEditorVariants().pane({ class: [base, isAttached ? "rounded-t-none" : undefined, className] }) ?? "";
}

/**
 * A toolbar's actions: the caller's subset in the caller's order, repeats dropped.
 *
 * Omitted, every action — see {@link MARKDOWN_DEFAULT_TOOLBAR_ACTIONS}.
 */
export function resolveMarkdownToolbarActions(
	actions: readonly MarkdownToolbarAction[] | undefined
): readonly MarkdownToolbarAction[] {
	if (actions === undefined) return MARKDOWN_DEFAULT_TOOLBAR_ACTIONS;
	return [...new Set(actions)];
}

/**
 * The command a toolbar action runs against the current text.
 *
 * Every action is the command of the same name except `heading`, which is one
 * button stepping one, two, three, off — the level comes from the caret's line.
 */
export function resolveMarkdownActionCommand(
	action: MarkdownToolbarAction,
	text: string,
	selection: MarkdownSelection
): MarkdownCommand {
	if (action === "heading") return { level: getNextHeadingLevel(text, selection), type: "heading" };
	return { type: action };
}

/** Whether an action's button is lit, given the commands active at the caret. */
export function resolveMarkdownActionIsActive(
	action: MarkdownToolbarAction,
	active: readonly MarkdownCommandType[]
): boolean {
	return active.includes(action);
}

/**
 * What a screen reader hears after a toolbar press.
 *
 * The action toggles, so the state it was in before the press says which way
 * it went: lit before means it has just been removed.
 */
export function resolveMarkdownAnnouncement(action: MarkdownToolbarAction, wasActive: boolean): string {
	return `${MARKDOWN_ACTION_LABELS[action]} ${wasActive ? "removed" : "applied"}`;
}

/** The marker drawn beside a list item: a bullet, or its number counted from the list's `start`. */
export function resolveMarkdownListMarker(ordered: boolean, start: number, index: number): string {
	return ordered ? `${start + index}.` : "•";
}

/** Inline content as the plain text it reads as — for an accessibility label that skips the markup. */
export function markdownInlineToText(inline: readonly MarkdownInline[]): string {
	let out = "";
	for (const node of inline) {
		switch (node.type) {
			case "text":
			case "code":
				out += node.value;
				break;
			case "bold":
			case "italic":
			case "strikethrough":
			case "link":
				out += markdownInlineToText(node.children);
				break;
			default: {
				const exhaustive: never = node;
				return exhaustive;
			}
		}
	}
	return out;
}
