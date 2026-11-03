import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { useState } from "react";
import { fireEvent, renderWithProviders, screen, userEvent } from "../../test/render";
import { Field } from "../field";
import { Input } from "./input";

function ControlledInput({ onChangeText }: { onChangeText: (text: string) => void }) {
	const [value, setValue] = useState("");
	return (
		<Input
			accessibilityLabel="Email"
			onChangeText={(text) => {
				setValue(text);
				onChangeText(text);
			}}
			value={value}
		/>
	);
}

describe("Input", () => {
	test("is a text field named by its accessibilityLabel", async () => {
		await renderWithProviders(<Input accessibilityLabel="Email" placeholder="you@example.com" />);
		expect(screen.getByLabelText("Email")).toBeOnTheScreen();
		expect(screen.getByPlaceholderText("you@example.com")).toBeOnTheScreen();
	});

	test("uncontrolled: defaultValue seeds it and typing reports each change", async () => {
		const onChangeText = jest.fn();
		await renderWithProviders(<Input accessibilityLabel="Email" defaultValue="a" onChangeText={onChangeText} />);
		const input = screen.getByLabelText("Email");
		expect(input).toHaveDisplayValue("a");

		await fireEvent.changeText(input, "ab");
		expect(onChangeText).toHaveBeenLastCalledWith("ab");
		expect(screen.getByLabelText("Email")).toHaveDisplayValue("ab");
	});

	test("userEvent.type enters text and calls onChangeText per character", async () => {
		const onChangeText = jest.fn();
		await renderWithProviders(<ControlledInput onChangeText={onChangeText} />);
		const user = userEvent.setup();
		await user.type(screen.getByLabelText("Email"), "hi");
		expect(onChangeText).toHaveBeenCalledTimes(2);
		expect(onChangeText).toHaveBeenLastCalledWith("hi");
		expect(screen.getByLabelText("Email")).toHaveDisplayValue("hi");
	});

	test("controlled: shows the value prop and follows a rerender", async () => {
		const onChangeText = jest.fn();
		const view = await renderWithProviders(
			<Input accessibilityLabel="Email" onChangeText={onChangeText} value="one" />
		);
		expect(screen.getByLabelText("Email")).toHaveDisplayValue("one");

		await fireEvent.changeText(screen.getByLabelText("Email"), "two");
		expect(onChangeText).toHaveBeenCalledWith("two");

		await view.rerender(<Input accessibilityLabel="Email" onChangeText={onChangeText} value="two" />);
		expect(screen.getByLabelText("Email")).toHaveDisplayValue("two");
	});

	test("onFocus and onBlur receive the event", async () => {
		const onFocus = jest.fn();
		const onBlur = jest.fn();
		await renderWithProviders(<Input accessibilityLabel="Email" onBlur={onBlur} onFocus={onFocus} />);
		const input = screen.getByLabelText("Email");
		await fireEvent(input, "focus");
		expect(onFocus).toHaveBeenCalledTimes(1);
		await fireEvent(input, "blur");
		expect(onBlur).toHaveBeenCalledTimes(1);
	});

	test("isDisabled makes it not editable and announced disabled", async () => {
		await renderWithProviders(<Input accessibilityLabel="Email" isDisabled />);
		const input = screen.getByLabelText("Email");
		expect(input).toBeDisabled();
		expect(input.props.editable).toBe(false);
	});

	test("editable={false} is read-only", async () => {
		await renderWithProviders(<Input accessibilityLabel="Email" editable={false} />);
		expect(screen.getByLabelText("Email").props.editable).toBe(false);
	});

	test("an enabled input is editable", async () => {
		await renderWithProviders(<Input accessibilityLabel="Email" />);
		expect(screen.getByLabelText("Email")).not.toBeDisabled();
	});

	test("secureTextEntry is passed through", async () => {
		await renderWithProviders(<Input accessibilityLabel="Password" secureTextEntry />);
		expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true);
	});

	test("multiline is passed through", async () => {
		await renderWithProviders(<Input accessibilityLabel="Notes" multiline />);
		expect(screen.getByLabelText("Notes").props.multiline).toBe(true);
	});

	describe("inside a Field", () => {
		test("the Field.Label text becomes the accessible name", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Full name</Field.Label>
					<Input />
				</Field>
			);
			expect(await screen.findByLabelText("Full name")).toBeOnTheScreen();
		});

		test("an own accessibilityLabel beats the Field.Label", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Full name</Field.Label>
					<Input accessibilityLabel="Legal name" />
				</Field>
			);
			expect(await screen.findByLabelText("Legal name")).toBeOnTheScreen();
		});

		test("a disabled Field disables the input, and an own isDisabled={false} opts out", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Input accessibilityLabel="A" />
					<Input accessibilityLabel="B" isDisabled={false} />
				</Field>
			);
			expect(screen.getByLabelText("A")).toBeDisabled();
			expect(screen.getByLabelText("B")).not.toBeDisabled();
		});
	});

	describe("Input.Group", () => {
		test("renders the field with its prefix and suffix text", async () => {
			await renderWithProviders(
				<Input.Group>
					<Input.Group.Prefix>$</Input.Group.Prefix>
					<Input accessibilityLabel="Amount" />
					<Input.Group.Suffix>NZD</Input.Group.Suffix>
				</Input.Group>
			);
			expect(screen.getByLabelText("Amount")).toBeOnTheScreen();
			expect(screen.getByText("$", { includeHiddenElements: true })).toBeOnTheScreen();
			expect(screen.getByText("NZD", { includeHiddenElements: true })).toBeOnTheScreen();
		});

		test("a text affix is hidden from the accessibility tree", async () => {
			await renderWithProviders(
				<Input.Group>
					<Input.Group.Prefix>$</Input.Group.Prefix>
					<Input accessibilityLabel="Amount" />
				</Input.Group>
			);
			expect(screen.queryByText("$")).not.toBeOnTheScreen();
		});

		test("a decorator with a control inside stays reachable", async () => {
			await renderWithProviders(
				<Input.Group>
					<Input accessibilityLabel="Search" />
					<Input.Group.Suffix>
						<Input.Group.Button accessibilityLabel="Clear" onPress={() => {}}>
							Go
						</Input.Group.Button>
					</Input.Group.Suffix>
				</Input.Group>
			);
			expect(screen.getByRole("button", { name: "Clear" })).toBeOnTheScreen();
		});

		test("isDisabled on the group disables the field and its button", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Input.Group isDisabled>
					<Input accessibilityLabel="Search" />
					<Input.Group.Button accessibilityLabel="Clear" onPress={onPress}>
						Go
					</Input.Group.Button>
				</Input.Group>
			);
			expect(screen.getByLabelText("Search")).toBeDisabled();
			const button = screen.getByRole("button", { name: "Clear" });
			expect(button).toBeDisabled();
			await fireEvent(button, "accessibilityTap");
			expect(onPress).not.toHaveBeenCalled();
		});

		test("Input.Group.Button fires onPress when enabled", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Input.Group>
					<Input accessibilityLabel="Search" />
					<Input.Group.Button accessibilityLabel="Clear" onPress={onPress}>
						Go
					</Input.Group.Button>
				</Input.Group>
			);
			await fireEvent(screen.getByRole("button", { name: "Clear" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("the field still reports focus and blur inside a group", async () => {
			const onFocus = jest.fn();
			const onBlur = jest.fn();
			await renderWithProviders(
				<Input.Group>
					<Input accessibilityLabel="Search" onBlur={onBlur} onFocus={onFocus} />
				</Input.Group>
			);
			await fireEvent(screen.getByLabelText("Search"), "focus");
			await fireEvent(screen.getByLabelText("Search"), "blur");
			expect(onFocus).toHaveBeenCalledTimes(1);
			expect(onBlur).toHaveBeenCalledTimes(1);
		});

		describe("parts outside a group", () => {
			let original: typeof console.error;
			beforeEach(() => {
				original = console.error;
				console.error = () => {};
			});
			afterEach(() => {
				console.error = original;
			});

			test("Prefix throws", async () => {
				await expect(renderWithProviders(<Input.Group.Prefix>$</Input.Group.Prefix>)).rejects.toThrow(
					"Input.Group.Prefix must be rendered inside an <Input.Group>."
				);
			});

			test("Suffix throws", async () => {
				await expect(renderWithProviders(<Input.Group.Suffix>$</Input.Group.Suffix>)).rejects.toThrow(
					"Input.Group.Suffix must be rendered inside an <Input.Group>."
				);
			});

			test("Button throws", async () => {
				await expect(
					renderWithProviders(<Input.Group.Button accessibilityLabel="x">Go</Input.Group.Button>)
				).rejects.toThrow("Input.Group.Button must be rendered inside an <Input.Group>.");
			});
		});
	});
});
