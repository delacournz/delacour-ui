import { type ReactElement, useEffect } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import { Tabs } from "../tabs";
import { useMarkdownEditorPart } from "./markdown-editor.context";
import type { MarkdownMode, MarkdownToolbarAction } from "./markdown-editor.types";
import {
	MARKDOWN_EDITOR_TABS_SIZE,
	type MarkdownToolbarVariant,
	markdownEditorVariants,
	resolveMarkdownToolbarActions,
} from "./markdown-editor.variants";
import { MarkdownEditorAction } from "./markdown-editor-action";

export type MarkdownEditorToolbarProps = Omit<ViewProps, "children"> & {
	/** A card row on the pane's top edge, or a floating icon-only capsule above it. Default `bar`. */
	variant?: MarkdownToolbarVariant;
	/** Which actions, in which order. Default: every one. */
	actions?: readonly MarkdownToolbarAction[];
	/** Show the Write / Preview switch at the end of the row. Default true. */
	showModeSwitch?: boolean;
	className?: string;
};

const MODE_LABELS: Record<MarkdownMode, string> = { preview: "Preview", write: "Write" };

/**
 * Claims the touch for React Native's responder system.
 *
 * The actions are Gesture Handler taps, which the JS responder system never
 * sees. A `ScrollView` with `keyboardShouldPersistTaps="handled"` above the
 * editor — every `Screen.ScrollArea` — finds the touch unclaimed, takes it and
 * blurs the field on release. Claiming it here keeps the keyboard up while a
 * format is applied.
 */
const claimTouch = (): boolean => true;

/**
 * The formatting row, and the switch between the two panes.
 *
 * Actions scroll sideways when they outrun the screen; the mode switch stays
 * pinned at the end. The switch is a `Tabs` bar with no panels — the editor
 * owns the mode and renders the active pane itself, so the field is never
 * inside a pager whose swipe would fight a text selection.
 */
export function MarkdownEditorToolbar({
	variant = "bar",
	actions,
	showModeSwitch = true,
	className,
	...props
}: MarkdownEditorToolbarProps): ReactElement {
	const editor = useMarkdownEditorPart("MarkdownEditor.Toolbar");
	const { registerToolbar, setMode } = editor;
	const slots = markdownEditorVariants({ size: editor.size, toolbar: variant });
	const resolved = resolveMarkdownToolbarActions(actions);

	useEffect(() => {
		registerToolbar(variant);
		return () => registerToolbar(null);
	}, [registerToolbar, variant]);

	return (
		<View
			accessibilityRole="toolbar"
			className={slots.toolbar({ className })}
			onStartShouldSetResponder={claimTouch}
			{...props}
		>
			{resolved.length > 0 ? (
				<ScrollView
					className={slots.actions()}
					contentContainerClassName={slots.actionRow()}
					horizontal
					keyboardShouldPersistTaps="always"
					showsHorizontalScrollIndicator={false}
				>
					{resolved.map((action) => (
						<MarkdownEditorAction action={action} key={action} />
					))}
				</ScrollView>
			) : null}
			{showModeSwitch ? (
				<Tabs
					className={slots.modeSwitch()}
					isDisabled={editor.isDisabled}
					isSwipeable={false}
					onValueChange={(value) => setMode(value === "preview" ? "preview" : "write")}
					size={MARKDOWN_EDITOR_TABS_SIZE[editor.size]}
					value={editor.mode}
					variant="primary"
				>
					<Tabs.List>
						<Tabs.Indicator />
						<Tabs.Trigger testID="markdown-mode-write" value="write">
							{MODE_LABELS.write}
						</Tabs.Trigger>
						<Tabs.Trigger testID="markdown-mode-preview" value="preview">
							{MODE_LABELS.preview}
						</Tabs.Trigger>
					</Tabs.List>
				</Tabs>
			) : null}
		</View>
	);
}
MarkdownEditorToolbar.displayName = "DelacourUI.MarkdownEditor.Toolbar";
