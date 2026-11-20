import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Field } from "../field";
import { Pressable } from "../pressable";
import { Checkbox } from "./checkbox";
import { useCheckbox, useCheckboxGroup } from "./checkbox.context";

/** A custom control that flips two values in one handler, before a render. */
function ToggleBoth() {
	const group = useCheckboxGroup();
	return (
		<Pressable
			accessibilityLabel="Both"
			onPress={() => {
				group.toggle("email");
				group.toggle("sms");
			}}
		/>
	);
}

const tap = (element: Parameters<typeof fireEvent>[0]) => fireEvent(element, "accessibilityTap");

describe("Checkbox", () => {
	test("is a checkbox named by its label, unchecked by default", async () => {
		await renderWithProviders(<Checkbox>Remember me</Checkbox>);
		const control = screen.getByRole("checkbox", { name: "Remember me" });
		expect(control).toBeOnTheScreen();
		expect(control).not.toBeChecked();
		expect(screen.getByText("Remember me")).toBeOnTheScreen();
	});

	test("Checkbox.Label inside the root names it", async () => {
		await renderWithProviders(
			<Checkbox>
				<Checkbox.Label>Accept terms</Checkbox.Label>
			</Checkbox>
		);
		expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBeOnTheScreen();
	});

	test("uncontrolled: defaultChecked seeds it and an activation flips it", async () => {
		const onCheckedChange = jest.fn();
		await renderWithProviders(
			<Checkbox defaultChecked onCheckedChange={onCheckedChange}>
				Remember me
			</Checkbox>
		);
		const control = screen.getByRole("checkbox");
		expect(control).toBeChecked();

		await tap(control);
		expect(control).not.toBeChecked();
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);

		await tap(control);
		expect(control).toBeChecked();
		expect(onCheckedChange).toHaveBeenLastCalledWith(true);
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onCheckedChange = jest.fn();
		const view = await renderWithProviders(
			<Checkbox isChecked={false} onCheckedChange={onCheckedChange}>
				Remember me
			</Checkbox>
		);
		await tap(screen.getByRole("checkbox"));
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole("checkbox")).not.toBeChecked();

		await view.rerender(
			<Checkbox isChecked onCheckedChange={onCheckedChange}>
				Remember me
			</Checkbox>
		);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	test("isIndeterminate is announced as mixed and a press still reports a toggle", async () => {
		const onCheckedChange = jest.fn();
		await renderWithProviders(
			<Checkbox isChecked={false} isIndeterminate onCheckedChange={onCheckedChange}>
				Select all
			</Checkbox>
		);
		const control = screen.getByRole("checkbox");
		expect(control).toBePartiallyChecked();
		await tap(control);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});

	test("isDisabled is announced and ignores every activation", async () => {
		const onCheckedChange = jest.fn();
		await renderWithProviders(
			<Checkbox isDisabled onCheckedChange={onCheckedChange}>
				Remember me
			</Checkbox>
		);
		const control = screen.getByRole("checkbox");
		expect(control).toBeDisabled();
		await tap(control);
		expect(onCheckedChange).not.toHaveBeenCalled();
		expect(control).not.toBeChecked();
	});

	test("a press on an enclosing Field's row toggles the box", async () => {
		const onCheckedChange = jest.fn();
		await renderWithProviders(
			<Field testID="row">
				<Field.Label>Newsletter</Field.Label>
				<Checkbox onCheckedChange={onCheckedChange} />
			</Field>
		);
		await tap(screen.getByTestId("row"));
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	test("a disabled box ignores a press on its Field's row", async () => {
		const onCheckedChange = jest.fn();
		await renderWithProviders(
			<Field testID="row">
				<Field.Label>Newsletter</Field.Label>
				<Checkbox isDisabled onCheckedChange={onCheckedChange} />
			</Field>
		);
		await tap(screen.getByTestId("row"));
		expect(onCheckedChange).not.toHaveBeenCalled();
		expect(screen.getByRole("checkbox")).not.toBeChecked();
	});

	test("a disabled Field disables the box it holds", async () => {
		await renderWithProviders(
			<Field isDisabled>
				<Checkbox>Newsletter</Checkbox>
			</Field>
		);
		expect(screen.getByRole("checkbox")).toBeDisabled();
	});

	test("an explicit isDisabled={false} wins over a disabled Field", async () => {
		const onCheckedChange = jest.fn();
		await renderWithProviders(
			<Field isDisabled>
				<Checkbox isDisabled={false} onCheckedChange={onCheckedChange}>
					Newsletter
				</Checkbox>
			</Field>
		);
		await tap(screen.getByRole("checkbox"));
		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});

	test("a bare box is named by a sibling Field.Label", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Accept the terms</Field.Label>
				<Checkbox />
			</Field>
		);
		expect(screen.getByRole("checkbox", { name: "Accept the terms" })).toBeOnTheScreen();
	});

	test("a conditional label that renders nothing still lets the Field.Label name the box", async () => {
		const showInlineLabel = false as boolean;
		await renderWithProviders(
			<Field>
				<Field.Label>Accept the terms</Field.Label>
				<Checkbox>{showInlineLabel && <Checkbox.Label>Inline</Checkbox.Label>}</Checkbox>
			</Field>
		);
		expect(screen.getByRole("checkbox", { name: "Accept the terms" })).toBeOnTheScreen();
	});

	test("a caller's accessibilityState keeps the checked state", async () => {
		await renderWithProviders(
			<Checkbox accessibilityState={{ busy: true }} defaultChecked>
				Newsletter
			</Checkbox>
		);
		expect(screen.getByRole("checkbox").props.accessibilityState).toMatchObject({ busy: true, checked: true });
	});

	test("a caller's accessibilityState keeps the mixed state", async () => {
		await renderWithProviders(
			<Checkbox accessibilityState={{ busy: true }} isIndeterminate>
				Newsletter
			</Checkbox>
		);
		expect(screen.getByRole("checkbox").props.accessibilityState).toMatchObject({ busy: true, checked: "mixed" });
	});
});

describe("Checkbox.Group", () => {
	test("toggles made before the next render build on each other", async () => {
		const onChecked = jest.fn();
		await renderWithProviders(
			<Checkbox.Group onChecked={onChecked}>
				<ToggleBoth />
				<Checkbox value="email">Email</Checkbox>
				<Checkbox value="sms">SMS</Checkbox>
			</Checkbox.Group>
		);
		await tap(screen.getByRole("button", { name: "Both" }));
		expect(onChecked).toHaveBeenNthCalledWith(1, ["email"]);
		expect(onChecked).toHaveBeenNthCalledWith(2, ["email", "sms"]);
		expect(screen.getByRole("checkbox", { name: "Email" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "SMS" })).toBeChecked();
	});

	test("a change a controlled parent rejects does not carry into the next tap", async () => {
		const onChecked = jest.fn();
		await renderWithProviders(
			<Checkbox.Group checked={[]} onChecked={onChecked}>
				<Checkbox value="email">Email</Checkbox>
				<Checkbox value="sms">SMS</Checkbox>
			</Checkbox.Group>
		);
		await tap(screen.getByRole("checkbox", { name: "Email" }));
		expect(onChecked).toHaveBeenLastCalledWith(["email"]);
		await tap(screen.getByRole("checkbox", { name: "SMS" }));
		expect(onChecked).toHaveBeenLastCalledWith(["sms"]);
		expect(screen.getByRole("checkbox", { name: "Email" })).not.toBeChecked();
	});

	test("a grouped box still reports its own change", async () => {
		const onCheckedChange = jest.fn();
		await renderWithProviders(
			<Checkbox.Group defaultChecked={["email"]}>
				<Checkbox onCheckedChange={onCheckedChange} value="email">
					Email
				</Checkbox>
			</Checkbox.Group>
		);
		await tap(screen.getByRole("checkbox", { name: "Email" }));
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		await tap(screen.getByRole("checkbox", { name: "Email" }));
		expect(onCheckedChange).toHaveBeenLastCalledWith(true);
	});

	test("uncontrolled: defaultChecked ticks matching children and toggling reports the whole list", async () => {
		const onChecked = jest.fn();
		await renderWithProviders(
			<Checkbox.Group defaultChecked={["email"]} onChecked={onChecked}>
				<Checkbox value="email">Email</Checkbox>
				<Checkbox value="sms">SMS</Checkbox>
			</Checkbox.Group>
		);
		expect(screen.getByRole("checkbox", { name: "Email" })).toBeChecked();
		expect(screen.getByRole("checkbox", { name: "SMS" })).not.toBeChecked();

		await tap(screen.getByRole("checkbox", { name: "SMS" }));
		expect(onChecked).toHaveBeenLastCalledWith(["email", "sms"]);
		expect(screen.getByRole("checkbox", { name: "SMS" })).toBeChecked();

		await tap(screen.getByRole("checkbox", { name: "Email" }));
		expect(onChecked).toHaveBeenLastCalledWith(["sms"]);
		expect(screen.getByRole("checkbox", { name: "Email" })).not.toBeChecked();
	});

	test("controlled: reports the list and waits for the prop", async () => {
		const onChecked = jest.fn();
		const view = await renderWithProviders(
			<Checkbox.Group checked={[]} onChecked={onChecked}>
				<Checkbox value="email">Email</Checkbox>
			</Checkbox.Group>
		);
		await tap(screen.getByRole("checkbox"));
		expect(onChecked).toHaveBeenCalledWith(["email"]);
		expect(screen.getByRole("checkbox")).not.toBeChecked();

		await view.rerender(
			<Checkbox.Group checked={["email"]} onChecked={onChecked}>
				<Checkbox value="email">Email</Checkbox>
			</Checkbox.Group>
		);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	test("isDisabled cascades to children and blocks toggling", async () => {
		const onChecked = jest.fn();
		await renderWithProviders(
			<Checkbox.Group isDisabled onChecked={onChecked}>
				<Checkbox value="email">Email</Checkbox>
			</Checkbox.Group>
		);
		const control = screen.getByRole("checkbox");
		expect(control).toBeDisabled();
		await tap(control);
		expect(onChecked).not.toHaveBeenCalled();
	});

	test("a child's own isDisabled={false} overrides a disabled group", async () => {
		const onChecked = jest.fn();
		await renderWithProviders(
			<Checkbox.Group isDisabled onChecked={onChecked}>
				<Checkbox isDisabled={false} value="email">
					Email
				</Checkbox>
			</Checkbox.Group>
		);
		await tap(screen.getByRole("checkbox"));
		expect(onChecked).toHaveBeenCalledWith(["email"]);
	});

	describe("errors", () => {
		const original = console.error;
		beforeEach(() => {
			console.error = () => undefined;
		});
		afterEach(() => {
			console.error = original;
		});

		test("a grouped Checkbox without a value throws by name", async () => {
			await expect(
				renderWithProviders(
					<Checkbox.Group>
						<Checkbox>Email</Checkbox>
					</Checkbox.Group>
				)
			).rejects.toThrow("needs a `value`");
		});

		test("Checkbox.Label outside a Checkbox throws its documented error", async () => {
			await expect(renderWithProviders(<Checkbox.Label>Orphan</Checkbox.Label>)).rejects.toThrow(
				"Checkbox.Label must be rendered inside a <Checkbox>."
			);
		});

		test("useCheckbox outside a Checkbox throws", async () => {
			function Probe() {
				useCheckbox();
				return null;
			}
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useCheckbox must be called inside a <Checkbox>.");
		});

		test("useCheckboxGroup outside a group throws", async () => {
			function Probe() {
				useCheckboxGroup();
				return null;
			}
			await expect(renderWithProviders(<Probe />)).rejects.toThrow(
				"useCheckboxGroup must be called inside a <Checkbox.Group>."
			);
		});
	});

	describe("accessibility inside a Field", () => {
		test("a bare box is named by the field, required, with the error and description as its hint", async () => {
			await renderWithProviders(
				<Field isInvalid isRequired>
					<Field.Label>Terms</Field.Label>
					<Checkbox />
					<Field.Description>Read them first.</Field.Description>
					<Field.Error>Accept to continue</Field.Error>
				</Field>
			);
			const control = screen.getByRole("checkbox");
			expect(control).toHaveProp("accessibilityLabel", "Terms, required");
			expect(control).toHaveProp("accessibilityHint", "Invalid: Accept to continue. Read them first.");
		});

		test("inline text names the box and takes the required state; Field.Label stays visible to a reader", async () => {
			await renderWithProviders(
				<Field isRequired>
					<Field.Label>Terms</Field.Label>
					<Checkbox>Accept terms</Checkbox>
				</Field>
			);
			expect(screen.getByRole("checkbox")).toHaveProp("accessibilityLabel", "Accept terms, required");
			expect(screen.getByLabelText("Terms, required")).toBeOnTheScreen();
		});

		test("a group's isInvalid reaches each box's hint", async () => {
			await renderWithProviders(
				<Checkbox.Group isInvalid>
					<Checkbox value="a">Email</Checkbox>
				</Checkbox.Group>
			);
			expect(screen.getByRole("checkbox")).toHaveProp("accessibilityHint", "Invalid");
		});

		test("outside a Field the name and hint are the caller's own", async () => {
			await renderWithProviders(<Checkbox accessibilityHint="Toggles it">Remember me</Checkbox>);
			const control = screen.getByRole("checkbox", { name: "Remember me" });
			expect(control).toHaveProp("accessibilityHint", "Toggles it");
		});
	});
});
