import { type ReactElement, useMemo } from "react";
import type { ViewProps } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { Text } from "../text";
import { resolveTextareaRowsHeight } from "../textarea";
import { useMarkdownEditorPart } from "./markdown-editor.context";
import { parseMarkdown } from "./markdown-editor.parse";
import { markdownEditorVariants, resolveMarkdownPaneClass } from "./markdown-editor.variants";
import { MarkdownBlocks } from "./markdown-editor-render";

/** How long the preview takes to fade in when the pane swaps. Decorative, so calm motion skips it. */
const PREVIEW_FADE_MS = 120;

export type MarkdownEditorPreviewProps = Omit<ViewProps, "children"> & {
	/** Shown when there is nothing to render. Default "Nothing to preview". */
	emptyText?: string;
	className?: string;
};

/**
 * The preview pane — the text parsed and drawn on the library's type scale.
 *
 * Floored at the write pane's height, so flipping modes does not make the
 * screen jump on a short note. It is a plain view, never a scroller: a long
 * document grows the pane and the screen around it scrolls, so there is no
 * nested scroll to trap a thumb. Rendered only while the editor is on the
 * preview pane.
 */
export function MarkdownEditorPreview({
	emptyText = "Nothing to preview",
	className,
	style,
	...props
}: MarkdownEditorPreviewProps): ReactElement | null {
	const editor = useMarkdownEditorPart("MarkdownEditor.Preview");
	const isCalm = useCalmMotion();
	const blocks = useMemo(() => parseMarkdown(editor.value), [editor.value]);

	if (editor.mode !== "preview") return null;

	const slots = markdownEditorVariants({ variant: editor.variant });

	return (
		<Animated.View
			accessibilityLabel="Preview"
			className={resolveMarkdownPaneClass({
				className: [slots.preview(), className].join(" "),
				isAttached: editor.toolbarVariant === "bar",
			})}
			entering={isCalm ? undefined : FadeIn.duration(PREVIEW_FADE_MS)}
			style={[{ minHeight: resolveTextareaRowsHeight({ rows: editor.rows, size: editor.size }) }, style]}
			{...props}
		>
			{blocks.length === 0 ? (
				<Text.Caption>{emptyText}</Text.Caption>
			) : (
				<MarkdownBlocks blocks={blocks} onLinkPress={editor.onLinkPress} />
			)}
		</Animated.View>
	);
}
MarkdownEditorPreview.displayName = "DelacourUI.MarkdownEditor.Preview";
