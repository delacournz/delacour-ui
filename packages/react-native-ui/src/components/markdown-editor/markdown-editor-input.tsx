import { type ReactElement, useCallback } from "react";
import type { TextInputProps } from "react-native";
import { Textarea, type TextareaProps } from "../textarea";
import { useMarkdownEditorPart } from "./markdown-editor.context";
import { markdownEditorVariants, resolveMarkdownPaneClass } from "./markdown-editor.variants";

type SelectionChangeEvent = Parameters<NonNullable<TextInputProps["onSelectionChange"]>>[0];

/**
 * Everything the write pane owns is withheld: the text, the selection, the
 * height and the states all come from the editor, so a pane cannot disagree
 * with the toolbar about what it is editing.
 */
export type MarkdownEditorInputProps = Omit<
	TextareaProps,
	| "value"
	| "defaultValue"
	| "onChangeText"
	| "selection"
	| "onSelectionChange"
	| "rows"
	| "autoGrow"
	| "maxRows"
	| "showCount"
	| "maxLength"
	| "size"
	| "variant"
	| "isDisabled"
	| "isInvalid"
	| "editable"
	| "ref"
>;

/**
 * The write pane — a `Textarea` on the editor's text, in the monospaced face.
 *
 * Autocorrect, autocapitalisation and the spellchecker are off: each rewrites
 * markers as they are typed (`**` becomes a bullet, `_` a capital after it), and
 * in source text a correction is a corruption. Rendered only while the editor
 * is on the write pane.
 */
export function MarkdownEditorInput({ className, ...props }: MarkdownEditorInputProps): ReactElement | null {
	const editor = useMarkdownEditorPart("MarkdownEditor.Input");
	const { onSelectionChange } = editor;

	const handleSelectionChange = useCallback(
		(event: SelectionChangeEvent) => {
			onSelectionChange(event.nativeEvent.selection);
		},
		[onSelectionChange]
	);

	if (editor.mode !== "write") return null;

	const slots = markdownEditorVariants();

	return (
		<Textarea
			autoCapitalize="none"
			autoComplete="off"
			autoCorrect={false}
			spellCheck={false}
			{...props}
			className={resolveMarkdownPaneClass({
				className: [slots.input(), className].filter(Boolean).join(" "),
				isAttached: editor.toolbarVariant === "bar",
			})}
			editable={!editor.isReadOnly}
			isDisabled={editor.isDisabled}
			isInvalid={editor.isInvalid}
			onChangeText={editor.onChangeText}
			onSelectionChange={handleSelectionChange}
			ref={editor.inputRef}
			rows={editor.rows}
			selection={editor.pendingSelection}
			size={editor.size}
			value={editor.value}
			variant={editor.variant}
		/>
	);
}
MarkdownEditorInput.displayName = "DelacourUI.MarkdownEditor.Input";
