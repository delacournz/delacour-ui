import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { createRef } from "react";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { SearchBar } from "./search-bar";
import type { SearchBarHandle } from "./search-bar.types";

const TOKENS = [
	{ id: "a", label: "Open" },
	{ id: "b", label: "Mine" },
] as const;

/** Reports the Cancel's measuring frame so the bar swaps it for the real, revealed row. */
async function settleCancel(testID: string): Promise<void> {
	const cancel = screen.getByTestId(testID, { includeHiddenElements: true });
	let node = cancel.parent;
	while (node) {
		if (typeof node.props.onLayout === "function") {
			await fireEvent(node, "layout", { nativeEvent: { layout: { height: 40, width: 80, x: 0, y: 0 } } });
			return;
		}
		node = node.parent;
	}
}

describe("SearchBar", () => {
	test("is a search field named by its placeholder", async () => {
		await renderWithProviders(<SearchBar />);
		const input = screen.getByLabelText("Search");
		expect(input).toBeOnTheScreen();
		expect(input.props.accessibilityRole).toBe("search");
		expect(screen.getByPlaceholderText("Search")).toBeOnTheScreen();
	});

	test("an accessibilityLabel beats the placeholder as the name", async () => {
		await renderWithProviders(<SearchBar accessibilityLabel="Find people" placeholder="Name" />);
		expect(screen.getByLabelText("Find people")).toBeOnTheScreen();
	});

	test("a Field.Label names the field", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Directory</Field.Label>
				<SearchBar />
			</Field>
		);
		expect(await screen.findByLabelText("Directory")).toBeOnTheScreen();
	});

	test("inside an invalid, required Field it reads the label, the error and the description", async () => {
		await renderWithProviders(
			<Field isInvalid isRequired>
				<Field.Label>Directory</Field.Label>
				<SearchBar defaultValue="ab" />
				<Field.Description>Names only.</Field.Description>
				<Field.Error>Too short</Field.Error>
			</Field>
		);
		const input = await screen.findByLabelText("Directory, required");
		expect(input).toHaveProp("accessibilityHint", "Invalid: Too short. Names only.");
		expect(screen.getByRole("button", { name: "Clear search" }).props.accessibilityHint).toBeUndefined();
		expect(screen.getByText("Directory", { exact: false, includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("Field.Label is hidden from assistive tech once the bar takes its name", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Directory</Field.Label>
				<SearchBar />
			</Field>
		);
		expect(screen.queryByText("Directory")).not.toBeOnTheScreen();
	});

	test("an own accessibilityLabel still beats the Field and keeps Field.Label readable", async () => {
		await renderWithProviders(
			<Field isRequired>
				<Field.Label>Directory</Field.Label>
				<SearchBar accessibilityLabel="Find people" />
			</Field>
		);
		expect(screen.getByLabelText("Find people")).toBeOnTheScreen();
		expect(screen.getByText("Directory", { exact: false })).toBeOnTheScreen();
	});

	test("outside a Field it has no hint", async () => {
		await renderWithProviders(<SearchBar />);
		expect(screen.getByLabelText("Search").props.accessibilityHint).toBeUndefined();
	});

	test("search keyboard defaults are set and overridable", async () => {
		await renderWithProviders(<SearchBar returnKeyType="done" />);
		const input = screen.getByLabelText("Search");
		expect(input.props.returnKeyType).toBe("done");
		expect(input.props.autoCorrect).toBe(false);
		expect(input.props.autoCapitalize).toBe("none");
	});

	test("isLoading reports busy and swaps the clear button for a spinner", async () => {
		const view = await renderWithProviders(<SearchBar defaultValue="abc" />);
		expect(screen.getByLabelText("Search")).not.toBeBusy();
		expect(screen.getByRole("button", { name: "Clear search" })).toBeOnTheScreen();

		await view.rerender(<SearchBar defaultValue="abc" isLoading />);
		expect(screen.getByLabelText("Search")).toBeBusy();
		expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeOnTheScreen();
	});

	describe("typing", () => {
		test("uncontrolled: defaultValue seeds it, typing updates it and reports onValueChange", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<SearchBar defaultValue="a" onValueChange={onValueChange} />);
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("a");

			await fireEvent.changeText(screen.getByLabelText("Search"), "ab");
			expect(onValueChange).toHaveBeenLastCalledWith("ab");
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("ab");
		});

		test("controlled: reports the change and waits for the value prop", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(<SearchBar onValueChange={onValueChange} value="one" />);
			await fireEvent.changeText(screen.getByLabelText("Search"), "two");
			expect(onValueChange).toHaveBeenCalledWith("two");
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("one");

			await view.rerender(<SearchBar onValueChange={onValueChange} value="two" />);
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("two");
		});

		test("onSubmit receives the text and onSubmitEditing the event", async () => {
			const onSubmit = jest.fn();
			const onSubmitEditing = jest.fn();
			await renderWithProviders(
				<SearchBar defaultValue="cats" onSubmit={onSubmit} onSubmitEditing={onSubmitEditing} />
			);
			await fireEvent(screen.getByLabelText("Search"), "submitEditing", { nativeEvent: { text: "cats" } });
			expect(onSubmit).toHaveBeenCalledWith("cats");
			expect(onSubmitEditing).toHaveBeenCalledTimes(1);
		});

		test("onFocusChange and onFocus/onBlur follow focus", async () => {
			const onFocusChange = jest.fn();
			const onFocus = jest.fn();
			const onBlur = jest.fn();
			await renderWithProviders(<SearchBar onBlur={onBlur} onFocus={onFocus} onFocusChange={onFocusChange} />);
			const input = screen.getByLabelText("Search");
			await fireEvent(input, "focus");
			expect(onFocusChange).toHaveBeenLastCalledWith(true);
			expect(onFocus).toHaveBeenCalledTimes(1);
			await fireEvent(input, "blur");
			expect(onFocusChange).toHaveBeenLastCalledWith(false);
			expect(onBlur).toHaveBeenCalledTimes(1);
		});
	});

	describe("debounce", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});
		afterEach(() => {
			jest.useRealTimers();
		});

		test("with no debounce, onDebouncedChange fires at once", async () => {
			const onDebouncedChange = jest.fn();
			await renderWithProviders(<SearchBar onDebouncedChange={onDebouncedChange} />);
			await fireEvent.changeText(screen.getByLabelText("Search"), "a");
			expect(onDebouncedChange).toHaveBeenCalledWith("a");
		});

		test("waits for the pause, then reports the last text once", async () => {
			const onDebouncedChange = jest.fn();
			await renderWithProviders(<SearchBar debounce={300} onDebouncedChange={onDebouncedChange} />);
			const input = screen.getByLabelText("Search");
			await fireEvent.changeText(input, "a");
			await fireEvent.changeText(input, "ab");
			expect(onDebouncedChange).not.toHaveBeenCalled();

			await jest.advanceTimersByTimeAsync(300);
			expect(onDebouncedChange).toHaveBeenCalledTimes(1);
			expect(onDebouncedChange).toHaveBeenCalledWith("ab");
		});

		test("the search key flushes a pending debounce first", async () => {
			const onDebouncedChange = jest.fn();
			const onSubmit = jest.fn();
			await renderWithProviders(<SearchBar debounce={300} onDebouncedChange={onDebouncedChange} onSubmit={onSubmit} />);
			const input = screen.getByLabelText("Search");
			await fireEvent.changeText(input, "dog");
			await fireEvent(input, "submitEditing", { nativeEvent: { text: "dog" } });
			expect(onDebouncedChange).toHaveBeenCalledWith("dog");
			expect(onSubmit).toHaveBeenCalledWith("dog");
		});

		test("clear reports an empty string at once and drops the pending text", async () => {
			const onDebouncedChange = jest.fn();
			await renderWithProviders(<SearchBar debounce={300} onDebouncedChange={onDebouncedChange} />);
			await fireEvent.changeText(screen.getByLabelText("Search"), "dog");
			await fireEvent(screen.getByRole("button", { name: "Clear search" }), "accessibilityTap");
			expect(onDebouncedChange).toHaveBeenCalledTimes(1);
			expect(onDebouncedChange).toHaveBeenCalledWith("");

			await jest.advanceTimersByTimeAsync(300);
			expect(onDebouncedChange).toHaveBeenCalledTimes(1);
		});
	});

	describe("clear button", () => {
		test("is absent while the field is empty and appears with text", async () => {
			await renderWithProviders(<SearchBar />);
			expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeOnTheScreen();

			await fireEvent.changeText(screen.getByLabelText("Search"), "a");
			expect(screen.getByRole("button", { name: "Clear search" })).toBeOnTheScreen();
		});

		test("empties the field, reports it and fires onClear", async () => {
			const onClear = jest.fn();
			const onValueChange = jest.fn();
			await renderWithProviders(<SearchBar defaultValue="abc" onClear={onClear} onValueChange={onValueChange} />);
			await fireEvent(screen.getByRole("button", { name: "Clear search" }), "accessibilityTap");

			expect(onClear).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenLastCalledWith("");
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("");
			expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeOnTheScreen();
		});

		test("controlled: asks for an empty value and waits for the rerender", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(<SearchBar onValueChange={onValueChange} value="abc" />);
			await fireEvent(screen.getByRole("button", { name: "Clear search" }), "accessibilityTap");
			expect(onValueChange).toHaveBeenCalledWith("");
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("abc");

			await view.rerender(<SearchBar onValueChange={onValueChange} value="" />);
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("");
		});

		test("clearAccessibilityLabel renames it", async () => {
			await renderWithProviders(<SearchBar clearAccessibilityLabel="Erase" defaultValue="a" />);
			expect(screen.getByRole("button", { name: "Erase" })).toBeOnTheScreen();
		});

		test("is absent when disabled or read-only", async () => {
			const view = await renderWithProviders(<SearchBar defaultValue="a" isDisabled />);
			expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeOnTheScreen();

			await view.rerender(<SearchBar defaultValue="a" readOnly />);
			expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeOnTheScreen();
		});
	});

	describe("cancel", () => {
		test("focus mode: hidden from assistive tech until the field is focused", async () => {
			await renderWithProviders(<SearchBar testID="bar" />);
			await settleCancel("bar-cancel");
			expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeOnTheScreen();

			await fireEvent(screen.getByLabelText("Search"), "focus");
			expect(screen.getByRole("button", { name: "Cancel" })).toBeOnTheScreen();

			await fireEvent(screen.getByLabelText("Search"), "blur");
			expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeOnTheScreen();
		});

		test("never mode: renders no Cancel", async () => {
			await renderWithProviders(<SearchBar cancel="never" testID="bar" />);
			expect(screen.queryByTestId("bar-cancel", { includeHiddenElements: true })).not.toBeOnTheScreen();
		});

		test("always mode: Cancel is available without focus", async () => {
			await renderWithProviders(<SearchBar cancel="always" testID="bar" />);
			await settleCancel("bar-cancel");
			expect(screen.getByRole("button", { name: "Cancel" })).toBeOnTheScreen();
		});

		test("pressing it empties the text and fires onCancel", async () => {
			const onCancel = jest.fn();
			const onValueChange = jest.fn();
			await renderWithProviders(
				<SearchBar cancel="always" defaultValue="abc" onCancel={onCancel} onValueChange={onValueChange} testID="bar" />
			);
			await settleCancel("bar-cancel");
			await fireEvent(screen.getByRole("button", { name: "Cancel" }), "accessibilityTap");

			expect(onCancel).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenLastCalledWith("");
			expect(screen.getByLabelText("Search")).toHaveDisplayValue("");
		});

		test("on an empty field it still fires onCancel but reports no value change", async () => {
			const onCancel = jest.fn();
			const onValueChange = jest.fn();
			await renderWithProviders(
				<SearchBar cancel="always" onCancel={onCancel} onValueChange={onValueChange} testID="bar" />
			);
			await settleCancel("bar-cancel");
			await fireEvent(screen.getByRole("button", { name: "Cancel" }), "accessibilityTap");
			expect(onCancel).toHaveBeenCalledTimes(1);
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("cancelLabel renames it", async () => {
			await renderWithProviders(<SearchBar cancel="always" cancelLabel="Close" testID="bar" />);
			await settleCancel("bar-cancel");
			expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen();
		});

		test("a SearchBar.Cancel child replaces the default and runs its own onPress before cancelling", async () => {
			const onPress = jest.fn();
			const onCancel = jest.fn();
			await renderWithProviders(
				<SearchBar cancel="always" onCancel={onCancel} testID="bar">
					<SearchBar.Cancel onPress={onPress}>Done</SearchBar.Cancel>
				</SearchBar>
			);
			await settleCancel("bar-cancel");
			await fireEvent(screen.getByRole("button", { name: "Done" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
			expect(onCancel).toHaveBeenCalledTimes(1);
		});
	});

	describe("disabled", () => {
		test("isDisabled makes the field not editable and announced disabled", async () => {
			await renderWithProviders(<SearchBar isDisabled />);
			const input = screen.getByLabelText("Search");
			expect(input).toBeDisabled();
			expect(input.props.editable).toBe(false);
		});

		test("a disabled Field disables it and an own isDisabled={false} opts out", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<SearchBar accessibilityLabel="A" />
					<SearchBar accessibilityLabel="B" isDisabled={false} />
				</Field>
			);
			expect(screen.getByLabelText("A")).toBeDisabled();
			expect(screen.getByLabelText("B")).not.toBeDisabled();
		});

		test("a disabled bar shows no Cancel even when always", async () => {
			await renderWithProviders(<SearchBar cancel="always" isDisabled testID="bar" />);
			await settleCancel("bar-cancel");
			expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeOnTheScreen();
		});

		test("Backspace on an empty disabled bar removes no token", async () => {
			const onTokenRemove = jest.fn();
			await renderWithProviders(<SearchBar isDisabled onTokenRemove={onTokenRemove} tokens={TOKENS} />);
			await fireEvent(screen.getByLabelText("Search"), "keyPress", { nativeEvent: { key: "Backspace" } });
			expect(onTokenRemove).not.toHaveBeenCalled();
		});
	});

	describe("tokens", () => {
		test("renders each token's label", async () => {
			await renderWithProviders(<SearchBar tokens={TOKENS} />);
			expect(screen.getByText("Open")).toBeOnTheScreen();
			expect(screen.getByText("Mine")).toBeOnTheScreen();
		});

		test("a token's remove control is named for it and calls onTokenRemove", async () => {
			const onTokenRemove = jest.fn();
			await renderWithProviders(<SearchBar onTokenRemove={onTokenRemove} tokens={TOKENS} />);
			await fireEvent(screen.getByRole("button", { name: "Remove Open" }), "accessibilityTap");
			expect(onTokenRemove).toHaveBeenCalledWith(TOKENS[0]);
		});

		test("Backspace on an empty field removes the last token", async () => {
			const onTokenRemove = jest.fn();
			await renderWithProviders(<SearchBar onTokenRemove={onTokenRemove} tokens={TOKENS} />);
			await fireEvent(screen.getByLabelText("Search"), "keyPress", { nativeEvent: { key: "Backspace" } });
			expect(onTokenRemove).toHaveBeenCalledWith(TOKENS[1]);
		});

		test("Backspace with text edits the text and removes no token", async () => {
			const onTokenRemove = jest.fn();
			await renderWithProviders(<SearchBar defaultValue="a" onTokenRemove={onTokenRemove} tokens={TOKENS} />);
			await fireEvent(screen.getByLabelText("Search"), "keyPress", { nativeEvent: { key: "Backspace" } });
			expect(onTokenRemove).not.toHaveBeenCalled();
		});
	});

	describe("handle", () => {
		test("ref.clear empties the field like the clear button", async () => {
			const ref = createRef<SearchBarHandle>();
			const onClear = jest.fn();
			await renderWithProviders(<SearchBar defaultValue="abc" onClear={onClear} ref={ref} />);
			await fireEvent(screen.getByLabelText("Search"), "focus");
			await act(async () => {
				ref.current?.clear();
			});
			expect(onClear).toHaveBeenCalledTimes(1);
			expect(await screen.findByDisplayValue("")).toBeOnTheScreen();
		});
	});

	describe("parts outside the root", () => {
		let errorSpy: typeof console.error;
		beforeEach(() => {
			errorSpy = console.error;
			console.error = () => undefined;
		});
		afterEach(() => {
			console.error = errorSpy;
		});

		test("SearchBar.Cancel throws outside a SearchBar", async () => {
			await expect(renderWithProviders(<SearchBar.Cancel />)).rejects.toThrow(
				"SearchBar.Cancel must be rendered inside a <SearchBar>."
			);
		});
	});
});
