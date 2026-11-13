import { describe, expect, jest, test } from "@jest/globals";
import { Text, View } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Checkbox } from "../checkbox";
import { Slider } from "../slider";
import { Switch } from "../switch";
import { Field } from "./field";
import { useField } from "./field.context";
import { useFieldControlAccessibility } from "./field-control";

/**
 * The smallest control that wires a field's accessibility the documented way,
 * so the parts are tested against the hook rather than against one component.
 */
function ProbeControl({ accessibilityLabel }: { accessibilityLabel?: string }) {
	const a11y = useFieldControlAccessibility({ accessibilityLabel });
	return (
		<View
			accessibilityHint={a11y.accessibilityHint}
			accessibilityLabel={a11y.accessibilityLabel}
			accessibilityRole="button"
			accessible
			testID="probe"
		/>
	);
}

/**
 * Touches go through Gesture Handler, which Jest cannot drive, so the label
 * press is exercised through the row's accessibility tap — the same path a
 * screen reader's activation takes. The visual feedback of the row is not
 * asserted.
 */
function VolumeSlider() {
	return (
		<Slider defaultValue={30}>
			<Slider.Track>
				<Slider.Fill />
				<Slider.Thumb index={0} />
			</Slider.Track>
		</Slider>
	);
}

describe("Field", () => {
	test("renders its label, control and description", async () => {
		await renderWithProviders(
			<Field>
				<Field.Label>Notifications</Field.Label>
				<Switch />
				<Field.Description>Push alerts for new messages.</Field.Description>
			</Field>
		);
		expect(screen.getByText("Notifications", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.getByText("Push alerts for new messages.")).toBeOnTheScreen();
		expect(screen.getByRole("switch", { name: "Notifications" })).toBeOnTheScreen();
	});

	test("a field of static text is layout, not an interactive row", async () => {
		await renderWithProviders(
			<Field testID="row">
				<Field.Label>Name</Field.Label>
				<Field.Description>Shown on invoices.</Field.Description>
			</Field>
		);
		expect(screen.getByTestId("row")).not.toHaveProp("onAccessibilityTap");
	});

	describe("label press", () => {
		test("an activation on the row toggles a Switch", async () => {
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Notifications</Field.Label>
					<Switch onSelectedChange={onSelectedChange} />
				</Field>
			);
			expect(screen.getByRole("switch")).not.toBeChecked();

			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			expect(onSelectedChange).toHaveBeenCalledTimes(1);
			expect(onSelectedChange).toHaveBeenLastCalledWith(true);
			expect(screen.getByRole("switch")).toBeChecked();

			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			expect(onSelectedChange).toHaveBeenLastCalledWith(false);
			expect(screen.getByRole("switch")).not.toBeChecked();
		});

		test("an activation on the row ticks a Checkbox", async () => {
			const onCheckedChange = jest.fn();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Accept the terms</Field.Label>
					<Checkbox onCheckedChange={onCheckedChange} />
				</Field>
			);
			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			expect(onCheckedChange).toHaveBeenCalledTimes(1);
			expect(onCheckedChange).toHaveBeenLastCalledWith(true);
			expect(screen.getByRole("checkbox")).toBeChecked();
		});

		test("the row stays out of the accessibility tree; the control is the element", async () => {
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Notifications</Field.Label>
					<Switch />
				</Field>
			);
			expect(screen.getByTestId("row")).toHaveProp("accessible", false);
			expect(screen.getAllByRole("switch")).toHaveLength(1);
		});

		test("a disabled Field does not fire the Switch", async () => {
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Field isDisabled testID="row">
					<Field.Label>Notifications</Field.Label>
					<Switch onSelectedChange={onSelectedChange} />
				</Field>
			);
			expect(screen.getByRole("switch")).toBeDisabled();
			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			await fireEvent(screen.getByTestId("row"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
			expect(onSelectedChange).not.toHaveBeenCalled();
			expect(screen.getByRole("switch")).not.toBeChecked();
		});

		test("a disabled Field does not fire the Checkbox", async () => {
			const onCheckedChange = jest.fn();
			await renderWithProviders(
				<Field isDisabled testID="row">
					<Field.Label>Accept the terms</Field.Label>
					<Checkbox onCheckedChange={onCheckedChange} />
				</Field>
			);
			expect(screen.getByRole("checkbox")).toBeDisabled();
			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			expect(onCheckedChange).not.toHaveBeenCalled();
		});

		test("a disabled Switch inside an enabled Field ignores the label press", async () => {
			const onSelectedChange = jest.fn();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Notifications</Field.Label>
					<Switch isDisabled onSelectedChange={onSelectedChange} />
				</Field>
			);
			expect(screen.getByRole("switch")).toBeDisabled();
			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			expect(onSelectedChange).not.toHaveBeenCalled();
			expect(screen.getByRole("switch")).not.toBeChecked();
		});

		test("a disabled Checkbox inside an enabled Field ignores the label press", async () => {
			const onCheckedChange = jest.fn();
			await renderWithProviders(
				<Field testID="row">
					<Field.Label>Accept the terms</Field.Label>
					<Checkbox isDisabled onCheckedChange={onCheckedChange} />
				</Field>
			);
			expect(screen.getByRole("checkbox")).toBeDisabled();
			await fireEvent(screen.getByTestId("row"), "accessibilityTap");
			expect(onCheckedChange).not.toHaveBeenCalled();
			expect(screen.getByRole("checkbox")).not.toBeChecked();
		});

		test("the row stops driving a control once it unmounts", async () => {
			const onSelectedChange = jest.fn();
			const view = await renderWithProviders(
				<Field testID="row">
					<Field.Label>Notifications</Field.Label>
					<Switch onSelectedChange={onSelectedChange} />
				</Field>
			);
			await view.rerender(
				<Field testID="row">
					<Field.Label>Notifications</Field.Label>
				</Field>
			);
			expect(screen.queryByRole("switch")).not.toBeOnTheScreen();
			expect(screen.getByTestId("row")).not.toHaveProp("onAccessibilityTap");
			expect(onSelectedChange).not.toHaveBeenCalled();
		});
	});

	describe("state cascade", () => {
		test("isDisabled disables the control inside", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Field.Label>Notifications</Field.Label>
					<Switch />
				</Field>
			);
			expect(screen.getByRole("switch")).toBeDisabled();
		});

		test("an explicit isDisabled={false} on the control wins", async () => {
			await renderWithProviders(
				<Field isDisabled>
					<Field.Label>Notifications</Field.Label>
					<Switch isDisabled={false} />
				</Field>
			);
			expect(screen.getByRole("switch")).toHaveProp("accessibilityState", { checked: false, disabled: false });
		});

		test("useField reads isInvalid, isDisabled and orientation", async () => {
			function Probe() {
				const field = useField();
				return (
					<Text testID="probe">{`${field.isInvalid}|${field.isDisabled}|${field.orientation}|${field.label}`}</Text>
				);
			}
			await renderWithProviders(
				<Field isDisabled isInvalid orientation="horizontal">
					<Field.Label>Email</Field.Label>
					<Probe />
				</Field>
			);
			expect(screen.getByTestId("probe")).toHaveTextContent("true|true|horizontal|Email");
		});

		test("useField outside a Field throws its documented error", async () => {
			function Probe() {
				useField();
				return null;
			}
			const original = console.error;
			console.error = () => {};
			try {
				await expect(renderWithProviders(<Probe />)).rejects.toThrow("useField must be called inside a <Field>.");
			} finally {
				console.error = original;
			}
		});
	});

	describe("label, description and error wiring", () => {
		test("a string label becomes a Slider thumb's accessible name", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Volume</Field.Label>
					<VolumeSlider />
				</Field>
			);
			expect(screen.getByRole("adjustable", { name: "Volume" })).toBeOnTheScreen();
		});

		test("the control drops the name when the label unmounts", async () => {
			const view = await renderWithProviders(
				<Field>
					<Field.Label>Volume</Field.Label>
					<VolumeSlider />
				</Field>
			);
			await view.rerender(
				<Field>
					<VolumeSlider />
				</Field>
			);
			expect(screen.queryByRole("adjustable", { name: "Volume" })).not.toBeOnTheScreen();
			expect(screen.getByRole("adjustable")).toBeOnTheScreen();
		});

		test("an element label lends no name to the control", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>
						<Text>Volume</Text>
					</Field.Label>
					<VolumeSlider />
				</Field>
			);
			expect(screen.queryByRole("adjustable", { name: "Volume" })).not.toBeOnTheScreen();
		});

		test("the error is announced through one mechanism: a polite live region, no alert role", async () => {
			await renderWithProviders(
				<Field isInvalid>
					<Field.Label>Email</Field.Label>
					<Field.Error>Enter a valid email.</Field.Error>
				</Field>
			);
			const error = screen.getByText("Enter a valid email.");
			expect(error).toHaveProp("accessibilityLiveRegion", "polite");
			expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
		});

		test("an error with no children renders nothing", async () => {
			await renderWithProviders(
				<Field isInvalid>
					<Field.Label>Email</Field.Label>
					<Field.Error>{""}</Field.Error>
					<Field.Error>{null}</Field.Error>
					<Field.Error>{false}</Field.Error>
				</Field>
			);
			expect(screen.getAllByText(/./)).toHaveLength(1);
		});

		test("an error appears and clears as its message changes", async () => {
			const view = await renderWithProviders(
				<Field isInvalid>
					<Field.Error>Too short.</Field.Error>
				</Field>
			);
			expect(screen.getByText("Too short.")).toBeOnTheScreen();
			await view.rerender(
				<Field>
					<Field.Error>{undefined}</Field.Error>
				</Field>
			);
			expect(screen.queryByText("Too short.")).not.toBeOnTheScreen();
		});

		test("an error is shown even when the field is not marked invalid", async () => {
			await renderWithProviders(
				<Field>
					<Field.Error>Required.</Field.Error>
				</Field>
			);
			expect(screen.getByText("Required.")).toBeOnTheScreen();
		});

		test("the description and the label are plain text, not controls", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Name</Field.Label>
					<Field.Description>Shown on invoices.</Field.Description>
				</Field>
			);
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
			expect(screen.getByText("Shown on invoices.")).toBeOnTheScreen();
		});
	});

	describe("validity reaching the control", () => {
		test("a control reads the label, the required state, the error and the description", async () => {
			await renderWithProviders(
				<Field isInvalid isRequired>
					<Field.Label>Email</Field.Label>
					<ProbeControl />
					<Field.Description>We never share it.</Field.Description>
					<Field.Error>Enter a valid email</Field.Error>
				</Field>
			);
			const control = screen.getByTestId("probe");
			expect(control).toHaveProp("accessibilityLabel", "Email, required");
			expect(control).toHaveProp("accessibilityHint", "Invalid: Enter a valid email. We never share it.");
		});

		test("the hint follows the error as it clears", async () => {
			const view = await renderWithProviders(
				<Field isInvalid>
					<Field.Label>Email</Field.Label>
					<ProbeControl />
					<Field.Error>Enter a valid email</Field.Error>
				</Field>
			);
			await view.rerender(
				<Field>
					<Field.Label>Email</Field.Label>
					<ProbeControl />
					<Field.Error>{null}</Field.Error>
				</Field>
			);
			expect(screen.getByTestId("probe").props.accessibilityHint).toBeUndefined();
		});

		test("the label leaves the accessibility tree once a control takes its name", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Email</Field.Label>
					<ProbeControl />
				</Field>
			);
			const label = screen.getByText("Email", { includeHiddenElements: true });
			expect(label).toHaveProp("importantForAccessibility", "no-hide-descendants");
			expect(label).toHaveProp("accessibilityElementsHidden", true);
		});

		test("the label stays readable when the control names itself", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Email</Field.Label>
					<ProbeControl accessibilityLabel="Work email" />
				</Field>
			);
			expect(screen.getByText("Email")).toHaveProp("importantForAccessibility", "auto");
		});

		test("the label carries the field's nativeID", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Email</Field.Label>
				</Field>
			);
			expect(screen.getByText("Email").props.nativeID).toMatch(/^delacour-field-label-/);
		});

		test("a required field's label draws the asterisk and is read as required", async () => {
			await renderWithProviders(
				<Field isRequired>
					<Field.Label>Email</Field.Label>
				</Field>
			);
			const label = screen.getByLabelText("Email, required");
			expect(label).toHaveTextContent("Email\u00a0*");
		});
	});

	describe("compound parts", () => {
		test("Legend is a header", async () => {
			await renderWithProviders(
				<Field.Set>
					<Field.Legend>Profile</Field.Legend>
					<Field.Legend variant="label">Address</Field.Legend>
				</Field.Set>
			);
			expect(screen.getByRole("header", { name: "Profile" })).toBeOnTheScreen();
			expect(screen.getByRole("header", { name: "Address" })).toBeOnTheScreen();
		});
		test("Set, Legend, Group, Content and Separator render without a Field", async () => {
			await renderWithProviders(
				<Field.Set>
					<Field.Legend>Profile</Field.Legend>
					<Field.Legend variant="label">Nested</Field.Legend>
					<Field.Description>Shown on invoices and emails.</Field.Description>
					<Field.Group>
						<Field orientation="horizontal">
							<Field.Content>
								<Field.Label>Username</Field.Label>
							</Field.Content>
						</Field>
						<Field.Separator>or</Field.Separator>
					</Field.Group>
				</Field.Set>
			);
			expect(screen.getByText("Profile")).toBeOnTheScreen();
			expect(screen.getByText("Nested")).toBeOnTheScreen();
			expect(screen.getByText("Shown on invoices and emails.")).toBeOnTheScreen();
			expect(screen.getByText("Username")).toBeOnTheScreen();
			expect(screen.getByText("or")).toBeOnTheScreen();
		});

		test("Label, Description and Error work outside a Field with default state", async () => {
			await renderWithProviders(
				<>
					<Field.Label>Loose</Field.Label>
					<Field.Description>Described.</Field.Description>
					<Field.Error>Broken.</Field.Error>
				</>
			);
			expect(screen.getByText("Loose")).toBeOnTheScreen();
			expect(screen.getByText("Described.")).toBeOnTheScreen();
			expect(screen.getByText("Broken.")).toBeOnTheScreen();
		});
	});
});
