import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { createRef } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { TagInput } from "./tag-input";
import { useTagInput } from "./tag-input.context";
import type { TagInputHandle } from "./tag-input.types";
import { TagInputChip } from "./tag-input-chip";
import { TagInputSuffix } from "./tag-input-suffix";

const LABEL = "Recipients";

function field() {
	return screen.getByLabelText(LABEL);
}

function activate(element: ReturnType<typeof screen.getByLabelText>) {
	return fireEvent(element, "accessibilityTap");
}

describe("TagInput", () => {
	let consoleError: jest.SpiedFunction<typeof console.error>;

	beforeEach(() => {
		consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	describe("rendering", () => {
		test("is a text field named by its accessibilityLabel", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} placeholder="Add a name" />);
			expect(field()).toBeOnTheScreen();
			expect(screen.getByPlaceholderText("Add a name")).toBeOnTheScreen();
		});

		test("renders each default tag as a chip", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["design", "code"]} />);
			expect(screen.getByLabelText("design")).toBeOnTheScreen();
			expect(screen.getByLabelText("code")).toBeOnTheScreen();
		});

		test("the field's accessibilityValue carries the tag count", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["a", "b"]} />);
			expect(field()).toHaveAccessibilityValue({ text: "2 tags" });
		});

		test("the placeholder shows only while there are no tags", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["a"]} placeholder="Add a name" />);
			expect(screen.queryByPlaceholderText("Add a name")).not.toBeOnTheScreen();
		});

		test("showCount renders the counter, with the max when set", async () => {
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} defaultValue={["a", "b"]} max={5} showCount testID="tags" />
			);
			expect(screen.getByTestId("tags-count")).toHaveTextContent("2/5");
		});

		test("derives part testIDs from the root testID", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["a"]} testID="tags" />);
			expect(screen.getByTestId("tags")).toBeOnTheScreen();
			expect(screen.getByTestId("tags-input")).toBeOnTheScreen();
			expect(screen.getByTestId("tags-tag-0")).toBeOnTheScreen();
			expect(screen.getByTestId("tags-tag-0-remove")).toBeOnTheScreen();
		});
	});

	describe("adding a tag", () => {
		test("submitEditing commits the draft as a tag and clears the field", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} />);
			await fireEvent.changeText(field(), "design");
			expect(field()).toHaveDisplayValue("design");

			await fireEvent(field(), "submitEditing");
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenCalledWith(["design"]);
			expect(screen.getByLabelText("design")).toBeOnTheScreen();
			expect(field()).toHaveDisplayValue("");
		});

		test("a delimiter character commits the text before it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} />);
			await fireEvent.changeText(field(), "design,");
			expect(onValueChange).toHaveBeenCalledWith(["design"]);
			expect(field()).toHaveDisplayValue("");
		});

		test("a pasted text holding delimiters becomes several tags", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} />);
			await fireEvent.changeText(field(), "a,b,c,");
			expect(onValueChange).toHaveBeenLastCalledWith(["a", "b", "c"]);
		});

		test("a custom delimiters prop replaces the comma", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} delimiters={[";"]} onValueChange={onValueChange} />
			);
			await fireEvent.changeText(field(), "a,");
			expect(onValueChange).not.toHaveBeenCalled();
			await fireEvent.changeText(field(), "a;");
			expect(onValueChange).toHaveBeenCalledWith(["a"]);
		});

		test("tags are trimmed and run through transform", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} transform={(raw) => raw.toLowerCase()} />
			);
			await fireEvent.changeText(field(), "  Design  ");
			await fireEvent(field(), "submitEditing");
			expect(onValueChange).toHaveBeenCalledWith(["design"]);
		});

		test("submitting an empty draft adds nothing", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} />);
			await fireEvent(field(), "submitEditing");
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("announces an added tag through announce", async () => {
			const announce = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} announce={announce} />);
			await fireEvent.changeText(field(), "design,");
			expect(announce).toHaveBeenCalledTimes(1);
			expect(announce.mock.calls[0]?.[0]).toEqual(expect.stringContaining("design"));
		});

		test("announce={false} stays silent", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} announce={false} />);
			await fireEvent.changeText(field(), "design,");
			expect(screen.getByLabelText("design")).toBeOnTheScreen();
		});

		test("blur commits the leftover text by default", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} />);
			await fireEvent.changeText(field(), "design");
			await fireEvent(field(), "blur");
			expect(onValueChange).toHaveBeenCalledWith(["design"]);
		});

		test("blurBehavior clear throws the text away", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} blurBehavior="clear" onValueChange={onValueChange} />
			);
			await fireEvent.changeText(field(), "design");
			await fireEvent(field(), "blur");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(field()).toHaveDisplayValue("");
		});

		test("blurBehavior keep leaves the text in the field", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} blurBehavior="keep" onValueChange={onValueChange} />
			);
			await fireEvent.changeText(field(), "design");
			await fireEvent(field(), "blur");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(field()).toHaveDisplayValue("design");
		});

		test("onFocus and onBlur still reach the caller", async () => {
			const onFocus = jest.fn();
			const onBlur = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onBlur={onBlur} onFocus={onFocus} />);
			await fireEvent(field(), "focus");
			expect(onFocus).toHaveBeenCalledTimes(1);
			await fireEvent(field(), "blur");
			expect(onBlur).toHaveBeenCalledTimes(1);
		});
	});

	describe("rejections", () => {
		test("a duplicate is refused with onReject, case-insensitively", async () => {
			const onValueChange = jest.fn();
			const onReject = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultValue={["Design"]}
					onReject={onReject}
					onValueChange={onValueChange}
				/>
			);
			await fireEvent.changeText(field(), "design,");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(onReject).toHaveBeenCalledTimes(1);
			expect(onReject).toHaveBeenCalledWith({ reason: "duplicate", tag: "design" });
		});

		test("allowDuplicates accepts a tag already in the list", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} allowDuplicates defaultValue={["a"]} onValueChange={onValueChange} />
			);
			await fireEvent.changeText(field(), "a,");
			expect(onValueChange).toHaveBeenCalledWith(["a", "a"]);
		});

		test("caseSensitiveDuplicates treats differing case as a new tag", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					caseSensitiveDuplicates
					defaultValue={["Design"]}
					onValueChange={onValueChange}
				/>
			);
			await fireEvent.changeText(field(), "design,");
			expect(onValueChange).toHaveBeenCalledWith(["Design", "design"]);
		});

		test("max refuses a tag once the list is full, and hides the field", async () => {
			const onValueChange = jest.fn();
			const onReject = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} max={2} onReject={onReject} onValueChange={onValueChange} />
			);
			await fireEvent.changeText(field(), "a,b,");
			expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
			expect(screen.queryByLabelText(LABEL)).not.toBeOnTheScreen();
		});

		test("max refuses the overflowing piece of a paste with reason max", async () => {
			const onValueChange = jest.fn();
			const onReject = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} max={2} onReject={onReject} onValueChange={onValueChange} />
			);
			await fireEvent.changeText(field(), "a,b,c,");
			expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
			expect(onReject).toHaveBeenCalledWith({ reason: "max", tag: "c" });
		});

		test("allowOverflow accepts past max", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					allowOverflow
					max={1}
					onValueChange={onValueChange}
					showCount
					testID="tags"
				/>
			);
			await fireEvent.changeText(field(), "a,b,");
			expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
			expect(screen.getByTestId("tags-count")).toHaveTextContent("2/1");
		});

		test("validate refuses a tag as invalid and leaves it in the field", async () => {
			const onValueChange = jest.fn();
			const onReject = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					onReject={onReject}
					onValueChange={onValueChange}
					validate={(tag) => tag.includes("@")}
				/>
			);
			await fireEvent.changeText(field(), "nope");
			await fireEvent(field(), "submitEditing");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(onReject).toHaveBeenCalledWith({ reason: "invalid", tag: "nope" });
			expect(field()).toHaveDisplayValue("nope");
		});

		test("a refusal is announced with the reject message", async () => {
			const announce = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					announce={announce}
					defaultValue={["a"]}
					rejectMessages={{ duplicate: "Already added" }}
				/>
			);
			await fireEvent.changeText(field(), "a,");
			expect(announce).toHaveBeenCalledWith("Already added");
		});
	});

	describe("removing a tag", () => {
		test("each tag has a remove button named for it", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["design", "code"]} />);
			expect(screen.getByRole("button", { name: "Remove design" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Remove code" })).toBeOnTheScreen();
		});

		test("removeAccessibilityLabel renames the remove button", async () => {
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultValue={["design"]}
					removeAccessibilityLabel={(tag) => `Drop ${tag}`}
				/>
			);
			expect(screen.getByRole("button", { name: "Drop design" })).toBeOnTheScreen();
		});

		test("activating the remove button removes that tag and reports the rest", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} defaultValue={["a", "b", "c"]} onValueChange={onValueChange} />
			);
			await activate(screen.getByRole("button", { name: "Remove b" }));
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenCalledWith(["a", "c"]);
			expect(screen.queryByLabelText("b")).not.toBeOnTheScreen();
			expect(screen.getByLabelText("a")).toBeOnTheScreen();
			expect(screen.getByLabelText("c")).toBeOnTheScreen();
		});

		test("the chip's remove accessibility action removes the tag", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} defaultValue={["a", "b"]} onValueChange={onValueChange} testID="tags" />
			);
			await fireEvent(screen.getByTestId("tags-tag-0"), "accessibilityAction", {
				nativeEvent: { actionName: "remove" },
			});
			expect(onValueChange).toHaveBeenCalledWith(["b"]);
		});

		test("a removal is announced", async () => {
			const announce = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} announce={announce} defaultValue={["a"]} />);
			await activate(screen.getByRole("button", { name: "Remove a" }));
			expect(announce).toHaveBeenCalledTimes(1);
			expect(announce.mock.calls[0]?.[0]).toEqual(expect.stringContaining("a"));
		});

		test("isClearable shows a clear-all button that empties tags and draft", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultInputValue="half"
					defaultValue={["a", "b"]}
					isClearable
					onValueChange={onValueChange}
				/>
			);
			await activate(screen.getByRole("button", { name: "Clear all" }));
			expect(onValueChange).toHaveBeenCalledWith([]);
			expect(screen.queryByLabelText("a")).not.toBeOnTheScreen();
			expect(field()).toHaveDisplayValue("");
		});

		test("the clear button is absent when there is nothing to clear", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} isClearable />);
			expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeOnTheScreen();
		});

		test("clearAccessibilityLabel renames the clear button", async () => {
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} clearAccessibilityLabel="Reset" defaultValue={["a"]} isClearable />
			);
			expect(screen.getByRole("button", { name: "Reset" })).toBeOnTheScreen();
		});
	});

	describe("backspace on an empty field", () => {
		test("the first press arms the last tag and the second removes it", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} defaultValue={["a", "b"]} onValueChange={onValueChange} />
			);
			await fireEvent(field(), "keyPress", { nativeEvent: { key: "Backspace" } });
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.getByLabelText("b")).toBeOnTheScreen();

			await fireEvent(field(), "keyPress", { nativeEvent: { key: "Backspace" } });
			expect(onValueChange).toHaveBeenCalledWith(["a"]);
			expect(screen.queryByLabelText("b")).not.toBeOnTheScreen();
		});

		test("another key disarms, so the next Backspace only arms again", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} defaultValue={["a"]} onValueChange={onValueChange} />
			);
			await fireEvent(field(), "keyPress", { nativeEvent: { key: "Backspace" } });
			await fireEvent(field(), "keyPress", { nativeEvent: { key: "x" } });
			await fireEvent(field(), "keyPress", { nativeEvent: { key: "Backspace" } });
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("does nothing while the draft holds text", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} defaultInputValue="x" defaultValue={["a"]} onValueChange={onValueChange} />
			);
			await fireEvent(field(), "keyPress", { nativeEvent: { key: "Backspace" } });
			await fireEvent(field(), "keyPress", { nativeEvent: { key: "Backspace" } });
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("onKeyPress still reaches the caller", async () => {
			const onKeyPress = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onKeyPress={onKeyPress} />);
			await fireEvent(field(), "keyPress", { nativeEvent: { key: "a" } });
			expect(onKeyPress).toHaveBeenCalledTimes(1);
		});
	});

	describe("controlled and uncontrolled", () => {
		test("uncontrolled: defaultValue seeds the tags and adding updates them", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["a"]} />);
			expect(screen.getByLabelText("a")).toBeOnTheScreen();
			await fireEvent.changeText(field(), "b,");
			expect(screen.getByLabelText("b")).toBeOnTheScreen();
		});

		test("controlled: reports a change and waits for the rerender", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} value={["a"]} />
			);
			await fireEvent.changeText(field(), "b,");
			expect(onValueChange).toHaveBeenCalledWith(["a", "b"]);
			expect(screen.queryByLabelText("b")).not.toBeOnTheScreen();

			await view.rerender(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} value={["a", "b"]} />);
			expect(screen.getByLabelText("b")).toBeOnTheScreen();
		});

		test("controlled: removing reports and waits for the rerender", async () => {
			const onValueChange = jest.fn();
			const view = await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} value={["a", "b"]} />
			);
			await activate(screen.getByRole("button", { name: "Remove a" }));
			expect(onValueChange).toHaveBeenCalledWith(["b"]);
			expect(screen.getByLabelText("a")).toBeOnTheScreen();

			await view.rerender(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} value={["b"]} />);
			expect(screen.queryByLabelText("a")).not.toBeOnTheScreen();
		});

		test("controlled draft: inputValue is shown and typing reports onInputValueChange", async () => {
			const onInputValueChange = jest.fn();
			const view = await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} inputValue="ab" onInputValueChange={onInputValueChange} />
			);
			expect(field()).toHaveDisplayValue("ab");
			await fireEvent.changeText(field(), "abc");
			expect(onInputValueChange).toHaveBeenCalledWith("abc");

			await view.rerender(
				<TagInput accessibilityLabel={LABEL} inputValue="abc" onInputValueChange={onInputValueChange} />
			);
			expect(field()).toHaveDisplayValue("abc");
		});

		test("defaultInputValue seeds the draft", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultInputValue="seed" />);
			expect(field()).toHaveDisplayValue("seed");
		});
	});

	describe("ref handle", () => {
		test("add commits text and returns null, or the first rejection's reason", async () => {
			const ref = createRef<TagInputHandle>();
			const onValueChange = jest.fn();
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} onValueChange={onValueChange} ref={ref} />);

			await fireEvent(field(), "focus");
			expect(ref.current?.add("a")).toBeNull();
			expect(onValueChange).toHaveBeenLastCalledWith(["a"]);
			expect(ref.current?.add("")).toBe("empty");
		});

		test("clear empties the tags", async () => {
			const ref = createRef<TagInputHandle>();
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput accessibilityLabel={LABEL} defaultValue={["a"]} onValueChange={onValueChange} ref={ref} />
			);
			await fireEvent(field(), "focus");
			ref.current?.clear();
			expect(onValueChange).toHaveBeenCalledWith([]);
		});
	});

	describe("renderTag", () => {
		test("draws a custom tag and hands it a working remove", async () => {
			const onValueChange = jest.fn();
			const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultValue={["a", "b"]}
					onValueChange={onValueChange}
					renderTag={(tag, state) => (
						<Text accessibilityRole="button" accessibilityLabel={`Custom ${tag}`} onPress={state.remove}>
							{tag}
						</Text>
					)}
				/>
			);
			const custom = screen.getByRole("button", { name: "Custom a" });
			expect(custom).toBeOnTheScreen();
			await fireEvent.press(custom);
			expect(onValueChange).toHaveBeenCalledWith(["b"]);
		});

		test("isRemovable is false while disabled", async () => {
			const seen: boolean[] = [];
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultValue={["a"]}
					isDisabled
					renderTag={(_tag, state) => {
						seen.push(state.isRemovable);
						return null;
					}}
				/>
			);
			expect(seen.every((removable) => removable === false)).toBe(true);
			expect(seen.length).toBeGreaterThan(0);
		});
	});

	describe("disabled", () => {
		test("the field is not editable", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} isDisabled />);
			expect(field()).toBeDisabled();
			expect(field().props.editable).toBe(false);
		});

		test("with tags there are no remove buttons, and the field is hidden", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["a"]} isDisabled />);
			expect(screen.getByLabelText("a")).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "Remove a" })).not.toBeOnTheScreen();
			expect(screen.queryByLabelText(LABEL)).not.toBeOnTheScreen();
		});

		test("the chip's remove action does nothing", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultValue={["a"]}
					isDisabled
					onValueChange={onValueChange}
					testID="tags"
				/>
			);
			await fireEvent(screen.getByTestId("tags-tag-0"), "accessibilityAction", {
				nativeEvent: { actionName: "remove" },
			});
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.getByLabelText("a")).toBeOnTheScreen();
		});

		test("the clear button is hidden", async () => {
			await renderWithProviders(<TagInput accessibilityLabel={LABEL} defaultValue={["a"]} isClearable isDisabled />);
			expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeOnTheScreen();
		});

		test("inherits disabled from an enclosing Field", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Field.Label>Recipients</Field.Label>
					<TagInput />
				</Field>
			);
			expect(await screen.findByLabelText(LABEL)).toBeDisabled();
		});
	});

	describe("read-only", () => {
		test("shows the tags with no field and no remove or clear controls", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultValue={["a"]}
					isClearable
					isReadOnly
					onValueChange={onValueChange}
				/>
			);
			expect(screen.getByLabelText("a")).toBeOnTheScreen();
			expect(screen.queryByLabelText(LABEL)).not.toBeOnTheScreen();
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
			expect(onValueChange).not.toHaveBeenCalled();
		});
	});

	describe("inside a Field", () => {
		test("Field.Label becomes the field's accessible name", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Recipients</Field.Label>
					<TagInput />
				</Field>
			);
			expect(await screen.findByLabelText(LABEL)).toBeOnTheScreen();
		});
	});

	describe("parts outside a TagInput", () => {
		test("useTagInput throws outside a TagInput", async () => {
			function Reader() {
				useTagInput();
				return null;
			}
			await expect(renderWithProviders(<Reader />)).rejects.toThrow("useTagInput must be called inside a <TagInput>.");
		});

		test("the chip throws outside a TagInput", async () => {
			await expect(renderWithProviders(<TagInputChip index={0} tag="a" />)).rejects.toThrow(
				"TagInput.Chip must be rendered inside a <TagInput>."
			);
		});

		test("the suffix throws outside a TagInput", async () => {
			await expect(
				renderWithProviders(<TagInputSuffix clearAccessibilityLabel="Clear" isClearable showCount />)
			).rejects.toThrow("TagInput.Suffix must be rendered inside a <TagInput>.");
		});

		test("useTagInput inside a renderTag sees the live tags", async () => {
			const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
			function Probe() {
				const { tags } = useTagInput();
				return <Text>{`count:${tags.length}`}</Text>;
			}
			await renderWithProviders(
				<TagInput
					accessibilityLabel={LABEL}
					defaultValue={["a", "b"]}
					renderTag={(tag) => (tag === "a" ? <Probe /> : null)}
				/>
			);
			expect(screen.getByText("count:2")).toBeOnTheScreen();
		});
	});
});
