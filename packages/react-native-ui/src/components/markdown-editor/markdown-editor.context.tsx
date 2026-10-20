import { createContext, type ReactElement, type ReactNode, type RefObject, use } from "react";
import type { TextInputInstance } from "react-native";
import type { HapticFeedback } from "../pressable/pressable";
import type {
	MarkdownCommand,
	MarkdownCommandType,
	MarkdownMode,
	MarkdownSelection,
	MarkdownToolbarAction,
} from "./markdown-editor.types";
import type { MarkdownEditorSize, MarkdownEditorVariant, MarkdownToolbarVariant } from "./markdown-editor.variants";

/** What every part of an editor shares, and what `useMarkdownEditor()` hands a custom one. */
export type MarkdownEditorContextValue = {
	/** The source text. */
	value: string;
	/** Which pane is showing. */
	mode: MarkdownMode;
	/** Show a pane. Ignored when it is already showing. */
	setMode: (mode: MarkdownMode) => void;
	/** Run a command against the text and the selection. Does nothing while disabled, read-only or previewing. */
	apply: (command: MarkdownCommand) => void;
	/** Run a toolbar action — `apply` plus the heading step and the screen-reader announcement. */
	applyAction: (action: MarkdownToolbarAction) => void;
	/** The formats in effect at the caret, for lighting the toolbar. */
	active: readonly MarkdownCommandType[];
	size: MarkdownEditorSize;
	variant: MarkdownEditorVariant;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
	/** Whether formatting can be applied right now: editable, and on the write pane. */
	canFormat: boolean;
	haptic: false | HapticFeedback;
	/** Opens a link the preview's reader tapped. Only ever handed a url `isSafeUrl` passed. */
	onLinkPress: (url: string) => void;
	/** Lines tall the write pane is. */
	rows: number;
	/** The look of the toolbar inside, or `null` while there is none — a pane under a `bar` drops its top corners. */
	toolbarVariant: MarkdownToolbarVariant | null;
	/** A toolbar offers its look here, and `null` on unmount. */
	registerToolbar: (variant: MarkdownToolbarVariant | null) => void;
	/** Internal: the write pane's field, so `focus()` and the toolbar can reach it. */
	inputRef: RefObject<TextInputInstance | null>;
	/** Internal: a selection the editor is pushing into the field, or `undefined` once the field has taken it. */
	pendingSelection: MarkdownSelection | undefined;
	/** Internal: the field reports its text here. */
	onChangeText: (text: string) => void;
	/** Internal: the field reports its selection here. */
	onSelectionChange: (selection: MarkdownSelection) => void;
};

const MarkdownEditorContext = createContext<MarkdownEditorContextValue | null>(null);

/**
 * Supplies the editor's value, mode and state to its parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part
 * can read it without importing `./markdown-editor` and closing a cycle back
 * through the root. See AGENTS.md rule 3.
 */
export function MarkdownEditorProvider({
	value,
	children,
}: {
	value: MarkdownEditorContextValue;
	children: ReactNode;
}): ReactElement {
	return <MarkdownEditorContext value={value}>{children}</MarkdownEditorContext>;
}
MarkdownEditorProvider.displayName = "DelacourUI.MarkdownEditor.Provider";

/** The enclosing editor's context, or null outside one. */
export function useMarkdownEditorContext(): MarkdownEditorContextValue | null {
	return use(MarkdownEditorContext);
}

/**
 * Reads the enclosing `MarkdownEditor` — for a control of the caller's own
 * that formats the text or switches the pane. Throws outside one.
 *
 * @example
 * function TodoButton() {
 *   const { apply, canFormat } = useMarkdownEditor();
 *   return <Button isDisabled={!canFormat} onPress={() => apply({ type: "bulletList" })}>List</Button>;
 * }
 */
export function useMarkdownEditor(): MarkdownEditorContextValue {
	const context = useMarkdownEditorContext();
	if (!context) {
		throw new Error("useMarkdownEditor must be called inside a <MarkdownEditor>.");
	}
	return context;
}

/** The editor's context, for a part that cannot work without one. Internal. */
export function useMarkdownEditorPart(component: string): MarkdownEditorContextValue {
	const context = useMarkdownEditorContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <MarkdownEditor>.`);
	}
	return context;
}
