/** The three heading levels the editor writes and the preview draws. Four hashes or more is a paragraph. */
export type MarkdownHeadingLevel = 1 | 2 | 3;

/**
 * One formatting action, as data.
 *
 * A union with one member per action so `applyMarkdownCommand` can switch on
 * `type` exhaustively, and so the two actions that carry a parameter say so in
 * the type rather than in a loose options bag.
 */
export type MarkdownCommand =
	| { type: "bold" }
	| { type: "italic" }
	| { type: "code" }
	| { type: "strikethrough" }
	| { type: "codeBlock" }
	| { type: "quote" }
	| { type: "bulletList" }
	| { type: "orderedList" }
	| { type: "heading"; level: MarkdownHeadingLevel }
	/** `url` omitted inserts a `url` placeholder and selects it, so typing replaces it. */
	| { type: "link"; url?: string };

export type MarkdownCommandType = MarkdownCommand["type"];

/** A selection in the text, as UTF-16 offsets — what `TextInput` reports. `start === end` is a caret. */
export type MarkdownSelection = { start: number; end: number };

/** The text after an edit, and where the selection lands in it. */
export type MarkdownEdit = { text: string; selection: MarkdownSelection };

/** Which pane is showing: the source being written, or what it renders to. */
export type MarkdownMode = "write" | "preview";

/**
 * One button a toolbar can hold.
 *
 * `heading` is a single button that steps through the levels — one, two,
 * three, off — rather than three buttons, because a phone's toolbar is one row
 * and three near-identical glyphs would crowd out everything else on it.
 */
export type MarkdownToolbarAction =
	| "heading"
	| "bold"
	| "italic"
	| "strikethrough"
	| "code"
	| "codeBlock"
	| "link"
	| "quote"
	| "bulletList"
	| "orderedList";

/** What a ref on `MarkdownEditor` reaches — for a control of the caller's own that formats the text. */
export type MarkdownEditorHandle = {
	/** Run a command against the current text and selection. Does nothing while disabled or read-only. */
	apply: (command: MarkdownCommand) => void;
	/** Focus the write pane, switching to it first if the preview is showing. */
	focus: () => void;
	/** The formats in effect at the caret, as `getActiveMarkdownCommands` reports them. */
	getActive: () => readonly MarkdownCommandType[];
};
