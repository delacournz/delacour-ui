import { type ReactElement, useCallback } from "react";
import {
	IconBold,
	IconBulletList,
	IconChainLink1,
	IconCode,
	IconCodeLines,
	IconH1,
	IconItalic,
	IconNumberedList,
	IconOpenQuote1,
	IconStrikeThrough,
} from "../../icons/central";
import { Icon, type IconComponent } from "../icon";
import { ToggleButton } from "../toggle-button";
import { useMarkdownEditorPart } from "./markdown-editor.context";
import type { MarkdownToolbarAction } from "./markdown-editor.types";
import {
	MARKDOWN_ACTION_LABELS,
	MARKDOWN_EDITOR_ACTION_SIZE,
	resolveMarkdownActionIsActive,
} from "./markdown-editor.variants";

/** The glyph each action draws. One heading glyph: the one button steps through every level. */
const ACTION_ICONS: Record<MarkdownToolbarAction, IconComponent> = {
	bold: IconBold,
	bulletList: IconBulletList,
	code: IconCode,
	codeBlock: IconCodeLines,
	heading: IconH1,
	italic: IconItalic,
	link: IconChainLink1,
	orderedList: IconNumberedList,
	quote: IconOpenQuote1,
	strikethrough: IconStrikeThrough,
};

export type MarkdownEditorActionProps = {
	action: MarkdownToolbarAction;
	testID?: string;
};

/**
 * One toolbar button — a square ghost `ToggleButton`, lit while its format is
 * in effect at the caret.
 *
 * It is a toggle because the action is one: pressing bold on bold text removes
 * it, so the button announces itself as a toggle that is on or off rather than
 * as a plain button whose state is only drawn. It is controlled by the caret,
 * never by its own press — the press runs the command, and the command moving
 * the caret is what lights it.
 */
export function MarkdownEditorAction({ action, testID }: MarkdownEditorActionProps): ReactElement {
	const editor = useMarkdownEditorPart("MarkdownEditor.Action");
	const { applyAction } = editor;
	const handlePress = useCallback(() => applyAction(action), [action, applyAction]);
	const isSelected = editor.canFormat && resolveMarkdownActionIsActive(action, editor.active);

	return (
		<ToggleButton
			accessibilityLabel={MARKDOWN_ACTION_LABELS[action]}
			haptic={editor.haptic}
			isDisabled={!editor.canFormat}
			isSelected={isSelected}
			onPress={handlePress}
			size={MARKDOWN_EDITOR_ACTION_SIZE[editor.size]}
			testID={testID ?? `markdown-action-${action}`}
			variant="ghost"
		>
			<Icon icon={ACTION_ICONS[action]} />
		</ToggleButton>
	);
}
MarkdownEditorAction.displayName = "DelacourUI.MarkdownEditor.Action";
