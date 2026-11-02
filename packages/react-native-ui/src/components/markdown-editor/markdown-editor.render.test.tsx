import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Linking } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { MarkdownEditor } from "./markdown-editor";
import { useMarkdownEditor } from "./markdown-editor.context";
import type { MarkdownEditorHandle, MarkdownSelection } from "./markdown-editor.types";

async function select(start: number, end = start): Promise<void> {
	const selection: MarkdownSelection = { end, start };
	await fireEvent(screen.getByPlaceholderText("Write something"), "selectionChange", { nativeEvent: { selection } });
}

async function press(label: string): Promise<void> {
	await fireEvent(screen.getByLabelText(label), "accessibilityTap");
}

function isLit(label: string): boolean {
	return screen.getByLabelText(label).props.accessibilityState?.checked === true;
}

function silenceConsoleError(): () => void {
	const original = console.error;
	console.error = () => undefined;
	return () => {
		console.error = original;
	};
}

afterEach(() => {
	jest.restoreAllMocks();
	jest.clearAllMocks();
});

describe("MarkdownEditor", () => {
	test("renders a toolbar, a write pane and a mode switch with the default parts", async () => {
		await renderWithProviders(<MarkdownEditor placeholder="Write something" />);
		expect(screen.getByLabelText("Bold")).toBeOnTheScreen();
		expect(screen.getByPlaceholderText("Write something")).toBeOnTheScreen();
		expect(screen.getByLabelText("Bold")).toBeOnTheScreen();
		expect(screen.getByText("Write")).toBeOnTheScreen();
		expect(screen.getByText("Preview")).toBeOnTheScreen();
		expect(screen.queryByLabelText("Preview")).not.toBeOnTheScreen();
	});

	test("the write pane shows the value, with autocorrect off", async () => {
		await renderWithProviders(<MarkdownEditor defaultValue="hello" placeholder="Write something" />);
		const input = screen.getByPlaceholderText("Write something");
		expect(input).toHaveDisplayValue("hello");
		expect(input.props.autoCorrect).toBe(false);
		expect(input.props.spellCheck).toBe(false);
		expect(input.props.autoCapitalize).toBe("none");
	});

	describe("value", () => {
		test("uncontrolled: typing updates the text and reports it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<MarkdownEditor defaultValue="a" onValueChange={onValueChange} placeholder="Write something" />
			);
			await fireEvent.changeText(screen.getByPlaceholderText("Write something"), "ab");
			expect(onValueChange).toHaveBeenLastCalledWith("ab");
			expect(screen.getByPlaceholderText("Write something")).toHaveDisplayValue("ab");
		});

		test("controlled: reports the edit and waits for the prop", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<MarkdownEditor onValueChange={onValueChange} placeholder="Write something" value="a" />
			);
			await fireEvent.changeText(screen.getByPlaceholderText("Write something"), "ab");
			expect(onValueChange).toHaveBeenCalledWith("ab");
			expect(screen.getByPlaceholderText("Write something")).toHaveDisplayValue("a");

			await view.rerender(<MarkdownEditor onValueChange={onValueChange} placeholder="Write something" value="ab" />);
			expect(screen.getByPlaceholderText("Write something")).toHaveDisplayValue("ab");
		});

		test("Return on a list line continues the list, and not with continueLists off", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<MarkdownEditor defaultValue="- one" onValueChange={onValueChange} placeholder="Write something" />
			);
			await select(5);
			await fireEvent.changeText(screen.getByPlaceholderText("Write something"), "- one\n");
			expect(onValueChange).toHaveBeenLastCalledWith("- one\n- ");

			await view.rerender(
				<MarkdownEditor
					continueLists={false}
					defaultValue="- one"
					onValueChange={onValueChange}
					placeholder="Write something"
				/>
			);
			await fireEvent.changeText(screen.getByPlaceholderText("Write something"), "- one\n\n");
			expect(onValueChange).toHaveBeenLastCalledWith("- one\n\n");
		});
	});

	describe("toolbar actions", () => {
		test("every action is a labelled toggle, off at an empty caret", async () => {
			await renderWithProviders(<MarkdownEditor placeholder="Write something" />);
			for (const label of [
				"Bold",
				"Italic",
				"Strikethrough",
				"Inline code",
				"Link",
				"Heading",
				"Quote",
				"Code block",
				"Bulleted list",
				"Numbered list",
			]) {
				expect(isLit(label)).toBe(false);
			}
		});

		test("an action formats the selection, reports it and announces it", async () => {
			const onValueChange = jest.fn();
			const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
			await renderWithProviders(
				<MarkdownEditor defaultValue="hello" onValueChange={onValueChange} placeholder="Write something" />
			);
			await select(0, 5);
			await press("Bold");
			expect(onValueChange).toHaveBeenLastCalledWith("**hello**");
			expect(screen.getByPlaceholderText("Write something")).toHaveDisplayValue("**hello**");
			expect(announce).toHaveBeenLastCalledWith("Bold applied");
		});

		test("the button is lit by the caret, and pressing it again removes the format", async () => {
			const onValueChange = jest.fn();
			const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
			await renderWithProviders(
				<MarkdownEditor defaultValue="**hi**" onValueChange={onValueChange} placeholder="Write something" />
			);
			await select(3);
			expect(isLit("Bold")).toBe(true);
			expect(isLit("Italic")).toBe(false);

			await select(0, 6);
			await press("Bold");
			expect(onValueChange).toHaveBeenLastCalledWith("hi");
			expect(announce).toHaveBeenLastCalledWith("Bold removed");
		});

		test("a line action applies to the caret's line", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<MarkdownEditor defaultValue="item" onValueChange={onValueChange} placeholder="Write something" />
			);
			await select(0);
			await press("Bulleted list");
			expect(onValueChange).toHaveBeenLastCalledWith("- item");
		});

		test("actions limits and orders the buttons", async () => {
			await renderWithProviders(
				<MarkdownEditor placeholder="Write something">
					<MarkdownEditor.Toolbar actions={["link", "bold"]} />
					<MarkdownEditor.Input placeholder="Write something" />
				</MarkdownEditor>
			);
			expect(screen.getByLabelText("Link")).toBeOnTheScreen();
			expect(screen.getByLabelText("Bold")).toBeOnTheScreen();
			expect(screen.queryByLabelText("Italic")).not.toBeOnTheScreen();
			expect(screen.queryByLabelText("Quote")).not.toBeOnTheScreen();
		});

		test("showModeSwitch={false} drops the Write / Preview switch", async () => {
			await renderWithProviders(
				<MarkdownEditor>
					<MarkdownEditor.Toolbar showModeSwitch={false} />
					<MarkdownEditor.Input placeholder="Write something" />
				</MarkdownEditor>
			);
			expect(screen.queryByText("Preview")).not.toBeOnTheScreen();
			expect(screen.getByLabelText("Bold")).toBeOnTheScreen();
		});

		test("a pill toolbar is still a toolbar with the same actions", async () => {
			await renderWithProviders(
				<MarkdownEditor>
					<MarkdownEditor.Toolbar testID="bar" variant="pill" />
					<MarkdownEditor.Input placeholder="Write something" />
				</MarkdownEditor>
			);
			expect(screen.getByTestId("bar").props.accessibilityRole).toBe("toolbar");
			expect(screen.getByLabelText("Bold")).toBeOnTheScreen();
		});
	});

	describe("mode", () => {
		test("uncontrolled: the switch moves to the preview and back, reporting each", async () => {
			const onModeChange = jest.fn();
			await renderWithProviders(
				<MarkdownEditor defaultValue="# Title" onModeChange={onModeChange} placeholder="Write something" />
			);
			await fireEvent(screen.getByTestId("markdown-mode-preview"), "accessibilityTap");
			expect(onModeChange).toHaveBeenLastCalledWith("preview");
			expect(screen.queryByPlaceholderText("Write something")).not.toBeOnTheScreen();
			expect(screen.getByLabelText("Preview")).toBeOnTheScreen();

			await fireEvent(screen.getByTestId("markdown-mode-write"), "accessibilityTap");
			expect(onModeChange).toHaveBeenLastCalledWith("write");
			expect(screen.getByPlaceholderText("Write something")).toBeOnTheScreen();
		});

		test("defaultMode starts on the preview", async () => {
			await renderWithProviders(<MarkdownEditor defaultMode="preview" defaultValue="text" />);
			expect(screen.getByLabelText("Preview")).toBeOnTheScreen();
			expect(screen.queryByPlaceholderText("Write something")).not.toBeOnTheScreen();
		});

		test("controlled: reports the switch and waits for the prop", async () => {
			const onModeChange = jest.fn();
			const view = await renderWithProviders(
				<MarkdownEditor mode="write" onModeChange={onModeChange} placeholder="Write something" />
			);
			await fireEvent(screen.getByTestId("markdown-mode-preview"), "accessibilityTap");
			expect(onModeChange).toHaveBeenCalledWith("preview");
			expect(screen.getByPlaceholderText("Write something")).toBeOnTheScreen();

			await view.rerender(<MarkdownEditor mode="preview" onModeChange={onModeChange} placeholder="Write something" />);
			expect(screen.getByLabelText("Preview")).toBeOnTheScreen();
		});

		test("formatting is off while previewing", async () => {
			await renderWithProviders(<MarkdownEditor defaultMode="preview" defaultValue="text" />);
			expect(screen.getByLabelText("Bold")).toBeDisabled();
		});
	});

	describe("preview", () => {
		test("draws headings, lists, quotes and inline formats as accessible text", async () => {
			await renderWithProviders(
				<MarkdownEditor
					defaultMode="preview"
					defaultValue={
						"# Title\n\n## Sub\n\nSome **bold** and _italic_ text\n\n- one\n- two\n\n1. first\n\n> quoted\n\n```\ncode here\n```"
					}
				/>
			);
			expect(screen.getByRole("header", { name: "Title" })).toBeOnTheScreen();
			expect(screen.getByRole("header", { name: "Sub" })).toBeOnTheScreen();
			expect(screen.getByText("bold")).toBeOnTheScreen();
			expect(screen.getByText("italic")).toBeOnTheScreen();
			expect(screen.getByLabelText("bullet one")).toBeOnTheScreen();
			expect(screen.getByLabelText("bullet two")).toBeOnTheScreen();
			expect(screen.getByLabelText("1. first")).toBeOnTheScreen();
			expect(screen.getByText("quoted")).toBeOnTheScreen();
			expect(screen.getByLabelText("code here")).toBeOnTheScreen();
		});

		test("an empty document shows the default and a custom empty text", async () => {
			const view = await renderWithProviders(<MarkdownEditor defaultMode="preview" />);
			expect(screen.getByText("Nothing to preview")).toBeOnTheScreen();

			await view.rerender(
				<MarkdownEditor defaultMode="preview">
					<MarkdownEditor.Preview emptyText="Nothing yet" />
				</MarkdownEditor>
			);
			expect(screen.getByText("Nothing yet")).toBeOnTheScreen();
		});

		test("a safe link calls onLinkPress with its url", async () => {
			const onLinkPress = jest.fn();
			await renderWithProviders(
				<MarkdownEditor defaultMode="preview" defaultValue="[docs](https://example.com/a)" onLinkPress={onLinkPress} />
			);
			await fireEvent.press(screen.getByText("docs"));
			expect(onLinkPress).toHaveBeenCalledWith("https://example.com/a");
		});

		test("the default link handler opens a safe url with Linking", async () => {
			const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
			await renderWithProviders(<MarkdownEditor defaultMode="preview" defaultValue="[mail](mailto:a@b.co)" />);
			await fireEvent.press(screen.getByText("mail"));
			expect(openURL).toHaveBeenCalledWith("mailto:a@b.co");
		});

		test("an unsafe scheme is drawn as plain text with nothing to press", async () => {
			const onLinkPress = jest.fn();
			const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
			await renderWithProviders(
				<MarkdownEditor defaultMode="preview" defaultValue="[bad](javascript:void)" onLinkPress={onLinkPress} />
			);
			await fireEvent.press(screen.getByText("bad"));
			expect(onLinkPress).not.toHaveBeenCalled();
			expect(openURL).not.toHaveBeenCalled();
			expect(screen.getByText("bad").props.accessibilityHint).toBeUndefined();
		});
	});

	describe("disabled and read-only", () => {
		test("isDisabled disables the toolbar, the mode switch and the field, and ignores presses", async () => {
			const onValueChange = jest.fn();
			const onModeChange = jest.fn();
			await renderWithProviders(
				<MarkdownEditor
					defaultValue="hello"
					isDisabled
					onModeChange={onModeChange}
					onValueChange={onValueChange}
					placeholder="Write something"
				/>
			);
			expect(screen.getByLabelText("Bold")).toBeDisabled();
			await select(0, 5);
			await press("Bold");
			await fireEvent(screen.getByTestId("markdown-mode-preview"), "accessibilityTap");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(onModeChange).not.toHaveBeenCalled();
			expect(screen.getByPlaceholderText("Write something")).toBeOnTheScreen();
		});

		test("isReadOnly turns formatting off, locks the field and leaves the mode switch working", async () => {
			const onValueChange = jest.fn();
			const onModeChange = jest.fn();
			await renderWithProviders(
				<MarkdownEditor
					defaultValue="hello"
					isReadOnly
					onModeChange={onModeChange}
					onValueChange={onValueChange}
					placeholder="Write something"
				/>
			);
			expect(screen.getByPlaceholderText("Write something").props.editable).toBe(false);
			expect(screen.getByLabelText("Bold")).toBeDisabled();
			await select(0, 5);
			await press("Bold");
			expect(onValueChange).not.toHaveBeenCalled();

			await fireEvent(screen.getByTestId("markdown-mode-preview"), "accessibilityTap");
			expect(onModeChange).toHaveBeenCalledWith("preview");
		});

		test("an enclosing Field cascades disabled, and an explicit prop wins", async () => {
			const view = await renderWithProviders(
				<Field isDisabled>
					<MarkdownEditor placeholder="Write something" />
				</Field>
			);
			expect(screen.getByLabelText("Bold")).toBeDisabled();

			await view.rerender(
				<Field isDisabled>
					<MarkdownEditor isDisabled={false} placeholder="Write something" />
				</Field>
			);
			expect(screen.getByLabelText("Bold")).not.toBeDisabled();
		});
	});

	describe("handle and hook", () => {
		test("the ref applies a command, reports the active set and focuses the write pane", async () => {
			const ref: { current: MarkdownEditorHandle | null } = { current: null };
			const onValueChange = jest.fn();
			await renderWithProviders(
				<MarkdownEditor
					defaultValue="hi"
					onValueChange={onValueChange}
					placeholder="Write something"
					ref={(handle) => {
						ref.current = handle;
					}}
				/>
			);
			await select(0, 2);
			ref.current?.apply({ type: "bold" });
			expect(onValueChange).toHaveBeenLastCalledWith("**hi**");
			await select(3);
			expect(ref.current?.getActive()).toContain("bold");
			expect(() => ref.current?.focus()).not.toThrow();
		});

		test("useMarkdownEditor drives a custom control", async () => {
			const onValueChange = jest.fn();
			function ListButton() {
				const { apply, canFormat, setMode } = useMarkdownEditor();
				return (
					<>
						<MarkdownEditor.Toolbar actions={[]} showModeSwitch={false} />
						<Fake
							apply={() => apply({ type: "bulletList" })}
							canFormat={canFormat}
							setPreview={() => setMode("preview")}
						/>
					</>
				);
			}
			function Fake({
				apply,
				canFormat,
				setPreview,
			}: {
				apply: () => void;
				canFormat: boolean;
				setPreview: () => void;
			}) {
				const { Pressable, Text } = require("react-native") as typeof import("react-native");
				return (
					<>
						<Pressable accessibilityLabel="List" accessibilityState={{ disabled: !canFormat }} onPress={apply}>
							<Text>List</Text>
						</Pressable>
						<Pressable accessibilityLabel="Show preview" onPress={setPreview}>
							<Text>Show preview</Text>
						</Pressable>
					</>
				);
			}
			await renderWithProviders(
				<MarkdownEditor defaultValue="item" onValueChange={onValueChange}>
					<ListButton />
					<MarkdownEditor.Input placeholder="Write something" />
					<MarkdownEditor.Preview />
				</MarkdownEditor>
			);
			await select(0);
			await fireEvent.press(screen.getByLabelText("List"));
			expect(onValueChange).toHaveBeenLastCalledWith("- item");
			await fireEvent.press(screen.getByLabelText("Show preview"));
			expect(screen.getByLabelText("Preview")).toBeOnTheScreen();
		});

		test("useMarkdownEditor outside an editor throws its documented error", async () => {
			const restore = silenceConsoleError();
			function Orphan() {
				useMarkdownEditor();
				return null;
			}
			try {
				await expect(renderWithProviders(<Orphan />)).rejects.toThrow(
					"useMarkdownEditor must be called inside a <MarkdownEditor>."
				);
			} finally {
				restore();
			}
		});
	});

	describe("parts outside the root", () => {
		test.each([
			["MarkdownEditor.Toolbar", <MarkdownEditor.Toolbar key="t" />],
			["MarkdownEditor.Input", <MarkdownEditor.Input key="i" />],
			["MarkdownEditor.Preview", <MarkdownEditor.Preview key="p" />],
		])("%s throws", async (name, part) => {
			const restore = silenceConsoleError();
			try {
				await expect(renderWithProviders(part)).rejects.toThrow(`${name} must be rendered inside a <MarkdownEditor>.`);
			} finally {
				restore();
			}
		});
	});
});
