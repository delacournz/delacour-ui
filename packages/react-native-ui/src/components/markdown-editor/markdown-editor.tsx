import {
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { AccessibilityInfo, Linking, type TextInput, View, type ViewProps } from "react-native";
import { useControllableState } from "../../hooks/use-controllable-state";
import { useFieldContext } from "../field/field.context";
import type { HapticFeedback } from "../pressable/pressable";
import { applyMarkdownCommand, continueMarkdownList, getActiveMarkdownCommands } from "./markdown-editor.commands";
import { type MarkdownEditorContextValue, MarkdownEditorProvider } from "./markdown-editor.context";
import { isSafeUrl } from "./markdown-editor.parse";
import type {
	MarkdownCommand,
	MarkdownEditorHandle,
	MarkdownMode,
	MarkdownSelection,
	MarkdownToolbarAction,
} from "./markdown-editor.types";
import {
	MARKDOWN_EDITOR_DEFAULT_ROWS,
	type MarkdownEditorSize,
	type MarkdownEditorVariant,
	type MarkdownToolbarVariant,
	markdownEditorVariants,
	resolveMarkdownActionCommand,
	resolveMarkdownActionIsActive,
	resolveMarkdownAnnouncement,
} from "./markdown-editor.variants";
import { MarkdownEditorInput } from "./markdown-editor-input";
import { MarkdownEditorPreview } from "./markdown-editor-preview";
import { MarkdownEditorToolbar } from "./markdown-editor-toolbar";

export type MarkdownEditorProps = Omit<ViewProps, "children"> & {
	/** The source text, controlled. */
	value?: string;
	/** The source text to start from, uncontrolled. */
	defaultValue?: string;
	/** Called with the new text on every edit — typed, formatted or list-continued. */
	onValueChange?: (value: string) => void;
	/** The pane showing, controlled. */
	mode?: MarkdownMode;
	/** The pane to start on, uncontrolled. Default `write`. */
	defaultMode?: MarkdownMode;
	/** Called when the reader switches panes. */
	onModeChange?: (mode: MarkdownMode) => void;
	/** Placeholder for the write pane of a bare `<MarkdownEditor />`. Composed, give it to `MarkdownEditor.Input`. */
	placeholder?: string;
	/** How many lines tall the write pane is, and the floor of the preview. Default 8. */
	rows?: number;
	/** The field's type step, the toolbar's button size and the mode switch's step, on one axis. */
	size?: MarkdownEditorSize;
	/** Filled or outlined — the write field and the preview box together. */
	variant?: MarkdownEditorVariant;
	/** Blocks editing, the toolbar and the mode switch. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Reports an invalid value. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** The text can be read and previewed but not changed; formatting is off, the mode switch still works. */
	isReadOnly?: boolean;
	/** Return on a list or quote line starts the next item. Default true. */
	continueLists?: boolean;
	/** The tick each toolbar press plays. `false` for none. Default `selection`. */
	haptic?: false | HapticFeedback;
	/** Opens a link tapped in the preview. Default `Linking.openURL`. Only ever called with an http, https, mailto or tel url. */
	onLinkPress?: (url: string) => void;
	ref?: Ref<MarkdownEditorHandle>;
	className?: string;
	/** The parts, composed. Omitted: a toolbar, the write pane and the preview. */
	children?: ReactNode;
};

function openLink(url: string): void {
	if (isSafeUrl(url)) void Linking.openURL(url);
}

function isSameSelection(a: MarkdownSelection, b: MarkdownSelection): boolean {
	return a.start === b.start && a.end === b.end;
}

function MarkdownEditorRoot({
	value: valueProp,
	defaultValue,
	onValueChange,
	mode: modeProp,
	defaultMode = "write",
	onModeChange,
	placeholder,
	rows = MARKDOWN_EDITOR_DEFAULT_ROWS,
	size = "md",
	variant = "primary",
	isDisabled: isDisabledProp,
	isInvalid: isInvalidProp,
	isReadOnly = false,
	continueLists = true,
	haptic = "selection",
	onLinkPress,
	ref,
	className,
	children,
	...props
}: MarkdownEditorProps): ReactElement {
	const field = useFieldContext();
	const isDisabled = isDisabledProp ?? field?.isDisabled ?? false;
	const isInvalid = isInvalidProp ?? field?.isInvalid ?? false;

	const [value, setValue] = useControllableState<string>({
		defaultValue: defaultValue ?? "",
		onChange: onValueChange,
		value: valueProp,
	});
	const [mode, setModeState] = useControllableState<MarkdownMode>({
		defaultValue: defaultMode,
		onChange: onModeChange,
		value: modeProp,
	});

	// The field reports its selection after every keystroke and tap; the root
	// keeps it twice. State lights the toolbar. The refs are what a command
	// reads, because a press can land between a change and the render it
	// schedules, and a command run against the render's copy would format text
	// that is no longer there.
	const [selection, setSelection] = useState<MarkdownSelection>({ end: 0, start: 0 });
	const selectionRef = useRef(selection);
	const valueRef = useRef(value);
	valueRef.current = value;

	// A selection the editor is pushing into the field. React Native's controlled
	// `selection` fights typing, so it is held only until the field reports that
	// exact range back — or for a frame, if the range was already where it is —
	// and then released to `undefined`, handing the caret back to the user.
	const [pendingSelection, setPendingSelection] = useState<MarkdownSelection | undefined>(undefined);
	useEffect(() => {
		if (pendingSelection === undefined) return;
		const frame = requestAnimationFrame(() => setPendingSelection(undefined));
		return () => cancelAnimationFrame(frame);
	}, [pendingSelection]);

	const [toolbarVariant, setToolbarVariant] = useState<MarkdownToolbarVariant | null>(null);
	const inputRef = useRef<TextInput | null>(null);

	const canFormat = !isDisabled && !isReadOnly && mode === "write";
	const canFormatRef = useRef(canFormat);
	canFormatRef.current = canFormat;

	const active = useMemo(() => getActiveMarkdownCommands(value, selection), [value, selection]);

	const commit = useCallback(
		(text: string, next: MarkdownSelection) => {
			valueRef.current = text;
			selectionRef.current = next;
			setValue(text);
			setSelection(next);
			setPendingSelection(next);
		},
		[setValue]
	);

	const apply = useCallback(
		(command: MarkdownCommand) => {
			if (!canFormatRef.current) return;
			const edit = applyMarkdownCommand(valueRef.current, selectionRef.current, command);
			commit(edit.text, edit.selection);
		},
		[commit]
	);

	const applyAction = useCallback(
		(action: MarkdownToolbarAction) => {
			if (!canFormatRef.current) return;
			const text = valueRef.current;
			const current = selectionRef.current;
			const wasActive = resolveMarkdownActionIsActive(action, getActiveMarkdownCommands(text, current));
			apply(resolveMarkdownActionCommand(action, text, current));
			AccessibilityInfo.announceForAccessibility(resolveMarkdownAnnouncement(action, wasActive));
		},
		[apply]
	);

	const onChangeText = useCallback(
		(next: string) => {
			const prev = valueRef.current;
			const edit = continueLists ? continueMarkdownList(prev, next, selectionRef.current.start) : null;
			if (edit) {
				commit(edit.text, edit.selection);
				return;
			}
			valueRef.current = next;
			setValue(next);
		},
		[commit, continueLists, setValue]
	);

	const onSelectionChange = useCallback((next: MarkdownSelection) => {
		selectionRef.current = next;
		setSelection(next);
		setPendingSelection((pending) => (pending && isSameSelection(pending, next) ? undefined : pending));
	}, []);

	const setMode = useCallback(
		(next: MarkdownMode) => {
			if (isDisabled) return;
			setModeState(next);
		},
		[isDisabled, setModeState]
	);

	const focus = useCallback(() => {
		if (mode !== "write") {
			setModeState("write");
			requestAnimationFrame(() => inputRef.current?.focus());
			return;
		}
		inputRef.current?.focus();
	}, [mode, setModeState]);

	useImperativeHandle(ref, () => ({ apply, focus, getActive: () => active }), [active, apply, focus]);

	const context = useMemo<MarkdownEditorContextValue>(
		() => ({
			active,
			apply,
			applyAction,
			canFormat,
			haptic,
			inputRef,
			isDisabled,
			isInvalid,
			isReadOnly,
			mode,
			onChangeText,
			onLinkPress: onLinkPress ?? openLink,
			onSelectionChange,
			pendingSelection,
			registerToolbar: setToolbarVariant,
			rows,
			setMode,
			size,
			toolbarVariant,
			value,
			variant,
		}),
		[
			active,
			apply,
			applyAction,
			canFormat,
			haptic,
			isDisabled,
			isInvalid,
			isReadOnly,
			mode,
			onChangeText,
			onLinkPress,
			onSelectionChange,
			pendingSelection,
			rows,
			setMode,
			size,
			toolbarVariant,
			value,
			variant,
		]
	);

	const content = children ?? (
		<>
			<MarkdownEditorToolbar />
			<MarkdownEditorInput placeholder={placeholder} />
			<MarkdownEditorPreview />
		</>
	);

	return (
		<MarkdownEditorProvider value={context}>
			<View className={markdownEditorVariants({ toolbar: toolbarVariant ?? "pill" }).root({ className })} {...props}>
				{content}
			</View>
		</MarkdownEditorProvider>
	);
}

/**
 * A Markdown field: a formatting toolbar, a monospaced write pane and a
 * rendered preview, one at a time.
 *
 * With a selection, an inline action wraps it and keeps it selected; with a
 * caret, it inserts the markers and puts the caret between them. Pressing the
 * same action again removes it. Heading, quote and the lists apply to every
 * line the selection touches. Return on a list or quote line starts the next
 * item, and Return on an empty one ends the list.
 *
 * The preview draws the same small subset the toolbar writes — headings one to
 * three, bold, italic, strikethrough, code, links, quotes, lists and fenced
 * blocks — on the library's own `Text` presets. A link opens only for http,
 * https, mailto and tel; anything else is drawn as its label.
 *
 * Inside a `Field` it takes the field's invalid and disabled states with
 * nothing said at the call site. Formatting is plain JavaScript —
 * `applyMarkdownCommand` and `parseMarkdown` are exported for use without the
 * component.
 *
 * @example
 * <MarkdownEditor defaultValue="# Release notes" onValueChange={setNotes} />
 *
 * @example
 * <Field>
 *   <Field.Label>Description</Field.Label>
 *   <MarkdownEditor rows={6} value={doc} onValueChange={setDoc}>
 *     <MarkdownEditor.Toolbar actions={["bold", "italic", "link", "bulletList"]} />
 *     <MarkdownEditor.Input placeholder="Write something…" />
 *     <MarkdownEditor.Preview emptyText="Nothing to preview" />
 *   </MarkdownEditor>
 * </Field>
 */
export const MarkdownEditor = Object.assign(MarkdownEditorRoot, {
	/** The formatting row and the Write / Preview switch — a `bar` or a floating `pill`. */
	Toolbar: MarkdownEditorToolbar,
	/** The write pane — a monospaced `Textarea` on the editor's text. */
	Input: MarkdownEditorInput,
	/** The preview pane — the text drawn on the library's type scale. */
	Preview: MarkdownEditorPreview,
	displayName: "DelacourUI.MarkdownEditor",
});
