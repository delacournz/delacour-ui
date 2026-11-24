import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { BottomSheetProvider } from "../bottom-sheet";
import { OverlayProvider } from "../overlay";
import { type HourCycle, TimePicker, TimePickerWheel, type TimeValue } from "./index";

function Sheets({ children }: { children: ReactNode }): ReactElement {
	return (
		<OverlayProvider>
			<BottomSheetProvider>{children}</BottomSheetProvider>
		</OverlayProvider>
	);
}

const sheets = { wrapper: Sheets };
const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");
const step = (column: string, actionName: "increment" | "decrement") =>
	fireEvent(screen.getByRole("adjustable", { name: column }), "accessibilityAction", { nativeEvent: { actionName } });

// Touches and drags on the wheel are native scroll events Jest cannot produce, so a
// settle is driven through the column's accessibility increment / decrement — the
// same path a screen reader takes. Haptics, snapping and the sheet's animation are
// not asserted.
describe("TimePicker", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2026, 5, 15, 9, 7, 30));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("trigger", () => {
		test("is a button named Time, collapsed, valued 'not set' with the placeholder", async () => {
			await renderWithProviders(<TimePicker />, sheets);
			const trigger = screen.getByRole("button", { name: "Time" });
			expect(trigger).toBeOnTheScreen();
			expect(trigger).toBeEnabled();
			expect(trigger).not.toBeExpanded();
			expect(trigger).toHaveAccessibilityValue({ text: "not set" });
			expect(screen.getByText("Select time")).toBeOnTheScreen();
		});

		test("accessibilityLabel and placeholder are honoured", async () => {
			await renderWithProviders(<TimePicker accessibilityLabel="Alarm" placeholder="Pick one" />, sheets);
			expect(screen.getByRole("button", { name: "Alarm" })).toBeOnTheScreen();
			expect(screen.getByText("Pick one")).toBeOnTheScreen();
		});

		test("shows the value on a 12-hour clock", async () => {
			await renderWithProviders(
				<TimePicker defaultValue={{ hour: 18, minute: 45 }} hourCycle={12} locale="en-US" />,
				sheets
			);
			expect(screen.getByText(/^6:45\sPM$/)).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Time" })).toHaveAccessibilityValue({
				text: /^6:45\sPM$/,
			});
		});

		test("shows the same value on a 24-hour clock", async () => {
			await renderWithProviders(
				<TimePicker defaultValue={{ hour: 18, minute: 45 }} hourCycle={24} locale="en-GB" />,
				sheets
			);
			expect(screen.getByText("18:45")).toBeOnTheScreen();
		});

		test("format replaces the reading, handed the resolved locale and cycle", async () => {
			const format = jest.fn(
				(time: TimeValue, _context: { locale: string; hourCycle: HourCycle }) => `at ${time.hour}h`
			);
			await renderWithProviders(
				<TimePicker defaultValue={{ hour: 18, minute: 45 }} format={format} hourCycle={24} locale="en-GB" />,
				sheets
			);
			expect(screen.getByText("at 18h")).toBeOnTheScreen();
			expect(format).toHaveBeenCalledWith({ hour: 18, minute: 45 }, { locale: "en-GB", hourCycle: 24 });
		});

		test("disabled: marked disabled and a press does not open", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<TimePicker isDisabled onOpenChange={onOpenChange} />, sheets);
			const trigger = screen.getByRole("button", { name: "Time" });
			expect(trigger).toBeDisabled();
			await fireEvent(trigger, "accessibilityTap");
			expect(onOpenChange).not.toHaveBeenCalled();
			expect(trigger).not.toBeExpanded();
		});

		test("read-only: shows the value but a press does not open", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(
				<TimePicker defaultValue={{ hour: 9, minute: 0 }} isReadOnly locale="en-GB" onOpenChange={onOpenChange} />,
				sheets
			);
			expect(screen.getByText("09:00")).toBeOnTheScreen();
			await press("Time");
			expect(onOpenChange).not.toHaveBeenCalled();
			expect(screen.getByRole("button", { name: "Time" })).not.toBeExpanded();
		});
	});

	describe("sheet", () => {
		test("is closed until the trigger is pressed, then reports it and expands", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(
				<TimePicker defaultValue={{ hour: 9, minute: 7 }} onOpenChange={onOpenChange} title="Wake me at" />,
				sheets
			);
			expect(screen.queryByText("Wake me at")).not.toBeOnTheScreen();
			expect(screen.queryByRole("adjustable", { name: "Hour" })).not.toBeOnTheScreen();

			await press("Time");
			expect(onOpenChange).toHaveBeenLastCalledWith(true);
			expect(screen.getByRole("button", { name: "Time" })).toBeExpanded();
			expect(screen.getByText("Wake me at")).toBeOnTheScreen();
			expect(screen.getByRole("adjustable", { name: "Hour" })).toBeOnTheScreen();
			expect(screen.getByRole("adjustable", { name: "Minute" })).toBeOnTheScreen();
		});

		test("defaultOpen starts it open", async () => {
			await renderWithProviders(<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 7 }} />, sheets);
			expect(screen.getByRole("adjustable", { name: "Hour" })).toBeOnTheScreen();
		});

		test("controlled isOpen decides: the trigger only asks", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<TimePicker isOpen={false} onOpenChange={onOpenChange} />, sheets);
			await press("Time");
			expect(onOpenChange).toHaveBeenCalledWith(true);
			expect(screen.queryByRole("adjustable", { name: "Hour" })).not.toBeOnTheScreen();
		});

		test("Done closes and reports it; an already-set value is not re-reported", async () => {
			const onOpenChange = jest.fn();
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker defaultValue={{ hour: 9, minute: 7 }} onOpenChange={onOpenChange} onValueChange={onValueChange} />,
				sheets
			);
			await press("Time");
			await press("Done");
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("Done on an untouched empty picker commits the time the wheel opened on", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TimePicker onValueChange={onValueChange} />, sheets);
			await press("Time");
			await press("Done");
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenCalledWith({ hour: 9, minute: 7 });
		});

		test("an empty wheel opens on now, snapped to minuteStep, without committing", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TimePicker minuteStep={15} onValueChange={onValueChange} />, sheets);
			await press("Time");
			expect(screen.getByRole("adjustable", { name: "Hour" })).toHaveAccessibilityValue({ text: "9 o'clock" });
			expect(screen.getByRole("adjustable", { name: "Minute" })).toHaveAccessibilityValue({ text: "0 minutes" });
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("doneLabel renames Done", async () => {
			await renderWithProviders(<TimePicker defaultOpen doneLabel="Save" />, sheets);
			expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "Done" })).not.toBeOnTheScreen();
		});

		test("Clear is absent unless clearable", async () => {
			await renderWithProviders(<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 7 }} />, sheets);
			expect(screen.queryByRole("button", { name: "Clear" })).not.toBeOnTheScreen();
		});

		test("Clear empties the value to null, closes, and the trigger shows the placeholder", async () => {
			const onValueChange = jest.fn();
			const onOpenChange = jest.fn();
			await renderWithProviders(
				<TimePicker
					clearable
					defaultValue={{ hour: 9, minute: 7 }}
					locale="en-GB"
					onOpenChange={onOpenChange}
					onValueChange={onValueChange}
				/>,
				sheets
			);
			await press("Time");
			await press("Clear");
			expect(onValueChange).toHaveBeenCalledWith(null);
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
			expect(screen.getByRole("button", { name: "Time" })).toHaveAccessibilityValue({ text: "not set" });
			expect(screen.getByText("Select time")).toBeOnTheScreen();
		});

		test("clearLabel renames Clear", async () => {
			await renderWithProviders(<TimePicker clearLabel="Reset" clearable defaultOpen />, sheets);
			expect(screen.getByRole("button", { name: "Reset" })).toBeOnTheScreen();
		});
	});

	describe("wheel columns", () => {
		test("hour and minute are adjustable and announce their value", async () => {
			await renderWithProviders(
				<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 1 }} hourCycle={24} />,
				sheets
			);
			expect(screen.getByRole("adjustable", { name: "Hour" })).toHaveAccessibilityValue({ text: "9 o'clock" });
			expect(screen.getByRole("adjustable", { name: "Minute" })).toHaveAccessibilityValue({ text: "1 minute" });
		});

		test("increment on the minute column commits the next minute", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 7 }} onValueChange={onValueChange} />,
				sheets
			);
			await step("Minute", "increment");
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenCalledWith({ hour: 9, minute: 8 });
		});

		test("decrement on the hour column commits the previous hour, minutes kept", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 7 }} hourCycle={24} onValueChange={onValueChange} />,
				sheets
			);
			await step("Hour", "decrement");
			expect(onValueChange).toHaveBeenCalledWith({ hour: 8, minute: 7 });
		});

		test("uncontrolled: the picker follows the wheel, trigger included", async () => {
			await renderWithProviders(
				<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 7 }} hourCycle={24} locale="en-GB" />,
				sheets
			);
			await step("Minute", "increment");
			expect(screen.getByRole("adjustable", { name: "Minute" })).toHaveAccessibilityValue({ text: "8 minutes" });
			expect(screen.getByText("09:08")).toBeOnTheScreen();
		});

		test("controlled: reports the step but waits for the prop", async () => {
			const onValueChange = jest.fn();
			const ui = (value: TimeValue) => (
				<TimePicker defaultOpen hourCycle={24} locale="en-GB" onValueChange={onValueChange} value={value} />
			);
			const { rerender } = await renderWithProviders(ui({ hour: 9, minute: 7 }), sheets);
			await step("Minute", "increment");
			expect(onValueChange).toHaveBeenCalledWith({ hour: 9, minute: 8 });
			expect(screen.getByText("09:07")).toBeOnTheScreen();

			await rerender(ui({ hour: 9, minute: 8 }));
			expect(screen.getByText("09:08")).toBeOnTheScreen();
			expect(screen.getByRole("adjustable", { name: "Minute" })).toHaveAccessibilityValue({ text: "8 minutes" });
		});

		test("a column cannot step past its first or last row", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker defaultOpen defaultValue={{ hour: 23, minute: 59 }} hourCycle={24} onValueChange={onValueChange} />,
				sheets
			);
			await step("Hour", "increment");
			await step("Minute", "increment");
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("minuteStep sets the minute wheel's granularity", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 0 }} minuteStep={15} onValueChange={onValueChange} />,
				sheets
			);
			await step("Minute", "increment");
			expect(onValueChange).toHaveBeenLastCalledWith({ hour: 9, minute: 15 });
		});

		test("a step onto a dimmed row is pulled back inside the bounds and not reported", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker
					defaultOpen
					defaultValue={{ hour: 9, minute: 30 }}
					minTime={{ hour: 9, minute: 30 }}
					onValueChange={onValueChange}
				/>,
				sheets
			);
			await step("Minute", "decrement");
			expect(onValueChange).not.toHaveBeenCalled();
			expect(screen.getByRole("adjustable", { name: "Minute" })).toHaveAccessibilityValue({ text: "30 minutes" });
		});

		test("showSeconds adds a Second column", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker
					defaultOpen
					defaultValue={{ hour: 9, minute: 7, second: 1 }}
					onValueChange={onValueChange}
					showSeconds
				/>,
				sheets
			);
			expect(screen.getByRole("adjustable", { name: "Second" })).toHaveAccessibilityValue({ text: "1 second" });
			await step("Second", "increment");
			expect(onValueChange).toHaveBeenCalledWith({ hour: 9, minute: 7, second: 2 });
		});

		test("without showSeconds there is no Second column", async () => {
			await renderWithProviders(<TimePicker defaultOpen defaultValue={{ hour: 9, minute: 7 }} />, sheets);
			expect(screen.queryByRole("adjustable", { name: "Second" })).not.toBeOnTheScreen();
		});

		test("12-hour adds an AM or PM column that flips the stored 24-hour value", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker
					defaultOpen
					defaultValue={{ hour: 9, minute: 7 }}
					hourCycle={12}
					locale="en-US"
					onValueChange={onValueChange}
				/>,
				sheets
			);
			expect(screen.getByRole("adjustable", { name: "AM or PM" })).toHaveAccessibilityValue({ text: "AM" });
			await step("AM or PM", "increment");
			expect(onValueChange).toHaveBeenCalledWith({ hour: 21, minute: 7 });
			expect(screen.getByRole("adjustable", { name: "AM or PM" })).toHaveAccessibilityValue({ text: "PM" });
		});

		test("12-hour: the hour column steps in 12-hour labels but stores 24-hour", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker
					defaultOpen
					defaultValue={{ hour: 18, minute: 0 }}
					hourCycle={12}
					locale="en-US"
					onValueChange={onValueChange}
				/>,
				sheets
			);
			expect(screen.getByRole("adjustable", { name: "Hour" })).toHaveAccessibilityValue({ text: "6 o'clock" });
			await step("Hour", "increment");
			expect(onValueChange).toHaveBeenCalledWith({ hour: 19, minute: 0 });
		});

		test("24-hour has no AM or PM column", async () => {
			await renderWithProviders(
				<TimePicker defaultOpen defaultValue={{ hour: 18, minute: 0 }} hourCycle={24} />,
				sheets
			);
			expect(screen.queryByRole("adjustable", { name: "AM or PM" })).not.toBeOnTheScreen();
		});

		test("a disabled picker's columns are marked disabled", async () => {
			await renderWithProviders(<TimePicker defaultValue={{ hour: 9, minute: 7 }} isDisabled isOpen />, sheets);
			expect(screen.getByRole("adjustable", { name: "Minute" })).toBeDisabled();
		});
	});

	describe("inline", () => {
		test("draws the wheel with no trigger and no footer", async () => {
			await renderWithProviders(<TimePicker defaultValue={{ hour: 7, minute: 0 }} presentation="inline" />, sheets);
			expect(screen.queryByRole("button", { name: "Time" })).not.toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "Done" })).not.toBeOnTheScreen();
			expect(screen.getByRole("adjustable", { name: "Hour" })).toBeOnTheScreen();
		});

		test("commits each settle", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<TimePicker
					hourCycle={24}
					onValueChange={onValueChange}
					presentation="inline"
					value={{ hour: 7, minute: 0 }}
				/>,
				sheets
			);
			await step("Hour", "increment");
			expect(onValueChange).toHaveBeenCalledWith({ hour: 8, minute: 0 });
		});

		test("testID lands on the wheel", async () => {
			await renderWithProviders(<TimePicker presentation="inline" testID="wheel" />, sheets);
			expect(screen.getByTestId("wheel")).toBeOnTheScreen();
		});
	});

	describe("TimePickerWheel", () => {
		test("a null value starts at now but reports nothing until a column settles", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<TimePickerWheel hourCycle={24} onValueChange={onValueChange} value={null} />);
			expect(screen.getByRole("adjustable", { name: "Hour" })).toHaveAccessibilityValue({ text: "9 o'clock" });
			expect(screen.getByRole("adjustable", { name: "Minute" })).toHaveAccessibilityValue({ text: "7 minutes" });
			expect(onValueChange).not.toHaveBeenCalled();

			await step("Minute", "increment");
			expect(onValueChange).toHaveBeenCalledWith({ hour: 9, minute: 8 });
		});

		test("works with no TimePicker around it, and isDisabled disables every column", async () => {
			await renderWithProviders(
				<TimePickerWheel
					hourCycle={12}
					isDisabled
					locale="en-US"
					onValueChange={jest.fn()}
					value={{ hour: 9, minute: 0 }}
				/>
			);
			for (const name of ["Hour", "Minute", "AM or PM"]) {
				expect(screen.getByRole("adjustable", { name })).toBeDisabled();
			}
		});
	});

	describe("compound parts", () => {
		let errorSpy: ReturnType<typeof jest.spyOn>;
		beforeEach(() => {
			errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		});
		afterEach(() => {
			errorSpy.mockRestore();
		});

		test.each([
			["Trigger", <TimePicker.Trigger key="t" />],
			["Value", <TimePicker.Value key="v" />],
			["Content", <TimePicker.Content key="c" />],
			["Wheel", <TimePicker.Wheel key="w" />],
			["Done", <TimePicker.Done key="d" />],
			["Clear", <TimePicker.Clear key="x" />],
		])("TimePicker.%s outside a TimePicker throws", async (name, element) => {
			await expect(renderWithProviders(element, sheets)).rejects.toThrow(
				`TimePicker.${name} must be rendered inside a <TimePicker>.`
			);
		});

		test("custom anatomy renders: own trigger, own footer", async () => {
			await renderWithProviders(
				<TimePicker defaultValue={{ hour: 9, minute: 0 }} locale="en-GB">
					<TimePicker.Trigger>
						<TimePicker.Value />
					</TimePicker.Trigger>
					<TimePicker.Content footer={<TimePicker.Clear />} title="Custom">
						<TimePicker.Wheel />
					</TimePicker.Content>
				</TimePicker>,
				sheets
			);
			await press("Time");
			expect(screen.getByText("Custom")).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Clear" })).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "Done" })).not.toBeOnTheScreen();
		});
	});
});
