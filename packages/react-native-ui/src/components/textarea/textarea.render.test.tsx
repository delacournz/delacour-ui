import { describe, expect, jest, test } from "@jest/globals";
import { useState } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { Input } from "../input";
import { Textarea } from "./textarea";

function ControlledTextarea({ onChangeText }: { onChangeText: (text: string) => void }) {
	const [value, setValue] = useState("");
	return (
		<Textarea
			accessibilityLabel="Notes"
			maxLength={10}
			onChangeText={(text) => {
				setValue(text);
				onChangeText(text);
			}}
			showCount
			value={value}
		/>
	);
}

describe("Textarea", () => {
	test("is a multiline text field named by its accessibilityLabel", async () => {
		await renderWithProviders(<Textarea accessibilityLabel="Notes" placeholder="Anything?" />);
		const field = screen.getByLabelText("Notes");
		expect(field).toBeOnTheScreen();
		expect(field.props.multiline).toBe(true);
		expect(screen.getByPlaceholderText("Anything?")).toBeOnTheScreen();
	});

	test("uncontrolled: defaultValue seeds it and typing reports each change", async () => {
		const onChangeText = jest.fn();
		await renderWithProviders(<Textarea accessibilityLabel="Notes" defaultValue="a" onChangeText={onChangeText} />);
		expect(screen.getByLabelText("Notes")).toHaveDisplayValue("a");

		await fireEvent.changeText(screen.getByLabelText("Notes"), "ab");
		expect(onChangeText).toHaveBeenLastCalledWith("ab");
		expect(screen.getByLabelText("Notes")).toHaveDisplayValue("ab");
	});

	test("controlled: shows the value prop, reports changes and follows a rerender", async () => {
		const onChangeText = jest.fn();
		const view = await renderWithProviders(
			<Textarea accessibilityLabel="Notes" onChangeText={onChangeText} value="one" />
		);
		expect(screen.getByLabelText("Notes")).toHaveDisplayValue("one");

		await fireEvent.changeText(screen.getByLabelText("Notes"), "two");
		expect(onChangeText).toHaveBeenCalledWith("two");

		await view.rerender(<Textarea accessibilityLabel="Notes" onChangeText={onChangeText} value="two" />);
		expect(screen.getByLabelText("Notes")).toHaveDisplayValue("two");
	});

	test("onFocus and onBlur receive the event", async () => {
		const onFocus = jest.fn();
		const onBlur = jest.fn();
		await renderWithProviders(<Textarea accessibilityLabel="Notes" onBlur={onBlur} onFocus={onFocus} />);
		await fireEvent(screen.getByLabelText("Notes"), "focus");
		expect(onFocus).toHaveBeenCalledTimes(1);
		await fireEvent(screen.getByLabelText("Notes"), "blur");
		expect(onBlur).toHaveBeenCalledTimes(1);
	});

	test("isDisabled makes it not editable and announced disabled", async () => {
		await renderWithProviders(<Textarea accessibilityLabel="Notes" isDisabled />);
		const field = screen.getByLabelText("Notes");
		expect(field).toBeDisabled();
		expect(field.props.editable).toBe(false);
	});

	test("editable={false} is read-only", async () => {
		await renderWithProviders(<Textarea accessibilityLabel="Notes" editable={false} />);
		expect(screen.getByLabelText("Notes").props.editable).toBe(false);
	});

	test("an enabled textarea is editable", async () => {
		await renderWithProviders(<Textarea accessibilityLabel="Notes" />);
		expect(screen.getByLabelText("Notes")).not.toBeDisabled();
	});

	describe("maxLength and the character count", () => {
		test("maxLength reaches the field", async () => {
			await renderWithProviders(<Textarea accessibilityLabel="Notes" maxLength={20} />);
			expect(screen.getByLabelText("Notes").props.maxLength).toBe(20);
		});

		test("no count is shown unless showCount is set", async () => {
			await renderWithProviders(<Textarea accessibilityLabel="Notes" defaultValue="abc" maxLength={10} />);
			expect(screen.queryByText("3/10")).not.toBeOnTheScreen();
		});

		test("showCount shows used of limit with a spoken label, seeded from defaultValue", async () => {
			await renderWithProviders(<Textarea accessibilityLabel="Notes" defaultValue="abc" maxLength={10} showCount />);
			expect(screen.getByText("3/10")).toBeOnTheScreen();
			expect(screen.getByLabelText("3 of 10 characters")).toBeOnTheScreen();
		});

		test("the count is a polite live region", async () => {
			await renderWithProviders(<Textarea accessibilityLabel="Notes" maxLength={10} showCount />);
			expect(screen.getByLabelText("0 of 10 characters").props.accessibilityLiveRegion).toBe("polite");
		});

		test("uncontrolled: the count follows typing", async () => {
			await renderWithProviders(<Textarea accessibilityLabel="Notes" maxLength={10} showCount />);
			expect(screen.getByText("0/10")).toBeOnTheScreen();
			await fireEvent.changeText(screen.getByLabelText("Notes"), "hello");
			expect(screen.getByText("5/10")).toBeOnTheScreen();
		});

		test("controlled: the count reads the value prop and waits for the rerender", async () => {
			const view = await renderWithProviders(
				<Textarea accessibilityLabel="Notes" maxLength={10} onChangeText={() => {}} showCount value="ab" />
			);
			expect(screen.getByText("2/10")).toBeOnTheScreen();
			await view.rerender(
				<Textarea accessibilityLabel="Notes" maxLength={10} onChangeText={() => {}} showCount value="abcd" />
			);
			expect(screen.getByText("4/10")).toBeOnTheScreen();
		});

		test("a stateful parent keeps the count and the field in step", async () => {
			const onChangeText = jest.fn();
			await renderWithProviders(<ControlledTextarea onChangeText={onChangeText} />);
			await fireEvent.changeText(screen.getByLabelText("Notes"), "hi");
			expect(onChangeText).toHaveBeenLastCalledWith("hi");
			expect(screen.getByLabelText("Notes")).toHaveDisplayValue("hi");
			expect(screen.getByText("2/10")).toBeOnTheScreen();
		});

		test("at the limit the count reads full", async () => {
			await renderWithProviders(
				<Textarea accessibilityLabel="Notes" defaultValue="0123456789" maxLength={10} showCount />
			);
			expect(screen.getByLabelText("10 of 10 characters")).toBeOnTheScreen();
		});
	});

	describe("inside a Field", () => {
		test("the Field.Label text becomes the accessible name", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Notes</Field.Label>
					<Textarea />
				</Field>
			);
			expect(await screen.findByLabelText("Notes")).toBeOnTheScreen();
		});

		test("an own accessibilityLabel beats the Field.Label", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Notes</Field.Label>
					<Textarea accessibilityLabel="Extra notes" />
				</Field>
			);
			expect(await screen.findByLabelText("Extra notes")).toBeOnTheScreen();
		});

		test("a disabled Field disables it, and an own isDisabled={false} opts out", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Textarea accessibilityLabel="A" />
					<Textarea accessibilityLabel="B" isDisabled={false} />
				</Field>
			);
			expect(screen.getByLabelText("A")).toBeDisabled();
			expect(screen.getByLabelText("B")).not.toBeDisabled();
		});
	});

	describe("Input.Group", () => {
		test("renders as the group's field and still reports changes", async () => {
			const onChangeText = jest.fn();
			await renderWithProviders(
				<Input.Group>
					<Textarea accessibilityLabel="Message" onChangeText={onChangeText} />
					<Input.Group.Block position="end">
						<Input.Group.Button accessibilityLabel="Send" onPress={() => {}}>
							Send
						</Input.Group.Button>
					</Input.Group.Block>
				</Input.Group>
			);
			await fireEvent.changeText(screen.getByLabelText("Message"), "hey");
			expect(onChangeText).toHaveBeenCalledWith("hey");
			expect(screen.getByRole("button", { name: "Send" })).toBeOnTheScreen();
		});
	});
});
