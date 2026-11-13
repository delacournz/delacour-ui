import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, Platform, Text } from "react-native";
import { resetAnnouncer } from "../../hooks/use-announce";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Checkbox } from "../checkbox";
import { Slider } from "../slider";
import { Switch } from "../switch";
import { Field } from "./field";
import { useField } from "./field.context";

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
		expect(screen.getByText("Notifications")).toBeOnTheScreen();
		expect(screen.getByText("Push alerts for new messages.")).toBeOnTheScreen();
		expect(screen.getByRole("switch")).toBeOnTheScreen();
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

		describe("announcing the error", () => {
			const originalOS = Platform.OS;
			const setPlatform = (os: typeof Platform.OS) =>
				Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
			let announce: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibility>;
			let announceWithOptions: jest.SpiedFunction<typeof AccessibilityInfo.announceForAccessibilityWithOptions>;

			beforeEach(() => {
				resetAnnouncer();
				announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
				announceWithOptions = jest
					.spyOn(AccessibilityInfo, "announceForAccessibilityWithOptions")
					.mockImplementation(() => {});
				announce.mockClear();
				announceWithOptions.mockClear();
			});
			afterEach(() => {
				setPlatform(originalOS);
				announce.mockRestore();
				announceWithOptions.mockRestore();
			});

			const Form = ({ error, announceIt = true }: { error: string; announceIt?: boolean }) => (
				<Field isInvalid>
					<Field.Label>Email</Field.Label>
					<Field.Error announce={announceIt}>{error}</Field.Error>
				</Field>
			);

			test("it is an alert with no live region beside its announcement", async () => {
				setPlatform("android");
				await renderWithProviders(<Form error="Enter a valid email." />);
				const error = screen.getByRole("alert");
				expect(error).toHaveTextContent("Enter a valid email.");
				expect(error).toHaveProp("accessibilityLiveRegion", "none");
			});

			test("Android: spoken once when it appears, and again only when the text changes", async () => {
				jest.useFakeTimers();
				setPlatform("android");
				const view = await renderWithProviders(<Form error="Enter a valid email." />);
				expect(announce).toHaveBeenCalledTimes(1);
				expect(announce).toHaveBeenCalledWith("Enter a valid email.");
				await view.rerender(<Form error="Enter a valid email." />);
				expect(announce).toHaveBeenCalledTimes(1);
				await view.rerender(<Form error="That email is taken." />);
				await act(async () => {
					jest.advanceTimersByTime(600);
				});
				expect(announce).toHaveBeenLastCalledWith("That email is taken.");
				jest.useRealTimers();
			});

			test("iOS: announced when it appears, which a live region never did", async () => {
				setPlatform("ios");
				await renderWithProviders(<Form error="Enter a valid email." />);
				expect(announceWithOptions).toHaveBeenCalledTimes(1);
				expect(announceWithOptions).toHaveBeenCalledWith("Enter a valid email.", { queue: true });
			});

			test("announce={false} stays silent", async () => {
				setPlatform("ios");
				await renderWithProviders(<Form announceIt={false} error="Enter a valid email." />);
				expect(announceWithOptions).not.toHaveBeenCalled();
				expect(announce).not.toHaveBeenCalled();
			});
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
			expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
		});

		test("an error appears and clears as its message changes", async () => {
			const view = await renderWithProviders(
				<Field isInvalid>
					<Field.Error>Too short.</Field.Error>
				</Field>
			);
			expect(screen.getByRole("alert")).toBeOnTheScreen();
			await view.rerender(
				<Field>
					<Field.Error>{undefined}</Field.Error>
				</Field>
			);
			expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
		});

		test("an error is shown even when the field is not marked invalid", async () => {
			await renderWithProviders(
				<Field>
					<Field.Error>Required.</Field.Error>
				</Field>
			);
			expect(screen.getByRole("alert")).toHaveTextContent("Required.");
		});

		test("the description and the label are plain text, not controls", async () => {
			await renderWithProviders(
				<Field>
					<Field.Label>Name</Field.Label>
					<Field.Description>Shown on invoices.</Field.Description>
				</Field>
			);
			expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
			expect(screen.getByText("Shown on invoices.")).toBeOnTheScreen();
		});
	});

	describe("compound parts", () => {
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
			expect(screen.getByRole("alert")).toBeOnTheScreen();
		});
	});
});
