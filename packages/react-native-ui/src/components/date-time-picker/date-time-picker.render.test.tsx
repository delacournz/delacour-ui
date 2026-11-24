import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { BottomSheetProvider } from "../bottom-sheet";
import { OverlayProvider } from "../overlay";
import { DateTimePicker } from "./date-time-picker";
import type { DateTimePickerProps } from "./date-time-picker.types";
import type { DateTimeValue } from "./date-time-picker.value";

const OCT_5: DateTimeValue = { date: { day: 5, month: 10, year: 2026 }, time: { hour: 15, minute: 30 } };
const TODAY = { day: 14, month: 10, year: 2026 };

/** The sheet needs the overlay host and the engine's provider above it, in that order. */
function Hosts({ children }: { children: ReactNode }): ReactElement {
	return (
		<OverlayProvider>
			<BottomSheetProvider>{children}</BottomSheetProvider>
		</OverlayProvider>
	);
}

function Picker(props: DateTimePickerProps): ReactElement {
	return <DateTimePicker hourCycle={12} locale="en-US" testID="dtp" today={TODAY} {...props} />;
}

const tap = (element: ReturnType<typeof screen.getByTestId>) => fireEvent(element, "accessibilityTap");
const tapButton = (name: string) => tap(screen.getByRole("button", { name }));
const trigger = () => screen.getByTestId("dtp-trigger");

describe("DateTimePicker", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2026, 9, 14, 10, 7, 0));
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	describe("trigger", () => {
		test("is a button named by the label, valued 'not set' while empty", async () => {
			await renderWithProviders(<Picker accessibilityLabel="Starts" placeholder="Pick a time" />, { wrapper: Hosts });
			expect(screen.getByRole("button", { name: "Starts" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Starts" })).toHaveAccessibilityValue({ text: "not set" });
			expect(screen.getByText("Pick a time")).toBeOnTheScreen();
		});

		test("defaults its name to 'Date and time'", async () => {
			await renderWithProviders(<Picker />, { wrapper: Hosts });
			expect(screen.getByRole("button", { name: "Date and time" })).toBeOnTheScreen();
		});

		test("announces the long form of a value", async () => {
			await renderWithProviders(<Picker defaultValue={OCT_5} />, { wrapper: Hosts });
			const text = trigger().props.accessibilityValue.text as string;
			expect(text).toContain("Monday, October 5, 2026");
			expect(text).toMatch(/at 3:30\sPM$/);
		});

		test("shows a custom format", async () => {
			await renderWithProviders(<Picker defaultValue={OCT_5} format={(v) => `custom ${v.date.day}`} />, {
				wrapper: Hosts,
			});
			expect(screen.getByText("custom 5")).toBeOnTheScreen();
		});

		test("is collapsed while closed and expanded while open", async () => {
			await renderWithProviders(<Picker />, { wrapper: Hosts });
			expect(trigger()).not.toBeExpanded();
			await tap(trigger());
			expect(trigger()).toBeExpanded();
		});

		test("disabled and read-only triggers do not open", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<Picker isDisabled onOpenChange={onOpenChange} />, { wrapper: Hosts });
			expect(trigger()).toBeDisabled();
			await tap(trigger());
			expect(onOpenChange).not.toHaveBeenCalled();
			expect(screen.queryByText("Done")).not.toBeOnTheScreen();

			await renderWithProviders(<Picker isReadOnly onOpenChange={onOpenChange} testID="ro" />, { wrapper: Hosts });
			await tap(screen.getByTestId("ro-trigger"));
			expect(onOpenChange).not.toHaveBeenCalled();
		});

		test("inline presentation renders no trigger and no Done", async () => {
			await renderWithProviders(<Picker presentation="inline" />, { wrapper: Hosts });
			expect(screen.queryByTestId("dtp-trigger")).not.toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "Done" })).not.toBeOnTheScreen();
			expect(screen.getByTestId("dtp-calendar-day-2026-10-14")).toBeOnTheScreen();
		});
	});

	describe("open and close", () => {
		test("the sheet is absent until the trigger opens it, then reports both ways", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<Picker onOpenChange={onOpenChange} />, { wrapper: Hosts });
			expect(screen.queryByTestId("dtp-tab-date")).not.toBeOnTheScreen();

			await tap(trigger());
			expect(onOpenChange).toHaveBeenLastCalledWith(true);
			expect(screen.getByTestId("dtp-title")).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Done" })).toBeOnTheScreen();

			await tapButton("Done");
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
			expect(onOpenChange).toHaveBeenCalledTimes(2);
		});

		test("defaultOpen starts open with the default title", async () => {
			await renderWithProviders(<Picker defaultOpen />, { wrapper: Hosts });
			expect(screen.getByTestId("dtp-title")).toHaveTextContent("Select date and time");
		});

		test("a custom title and labels replace the defaults", async () => {
			await renderWithProviders(
				<Picker dateLabel="Day" defaultOpen doneLabel="Save" timeLabel="Clock" title="When?" />,
				{
					wrapper: Hosts,
				}
			);
			expect(screen.getByTestId("dtp-title")).toHaveTextContent("When?");
			expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();
			expect(screen.getByRole("tab", { name: "Day" })).toBeOnTheScreen();
			expect(screen.getByRole("tab", { name: "Clock" })).toBeOnTheScreen();
		});

		test("controlled isOpen: the trigger only asks, the prop decides", async () => {
			const onOpenChange = jest.fn();
			const { rerender } = await renderWithProviders(<Picker isOpen={false} onOpenChange={onOpenChange} />, {
				wrapper: Hosts,
			});
			await tap(trigger());
			expect(onOpenChange).toHaveBeenCalledWith(true);
			expect(screen.queryByTestId("dtp-title")).not.toBeOnTheScreen();

			await rerender(<Picker isOpen onOpenChange={onOpenChange} />);
			expect(screen.getByTestId("dtp-title")).toBeOnTheScreen();

			await tapButton("Done");
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
			expect(screen.getByTestId("dtp-title")).toBeOnTheScreen();
		});
	});

	describe("value", () => {
		test("picking a day on an empty value reports a whole value, with the time from the clock rounded up", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Picker defaultOpen minuteStep={15} onValueChange={onValueChange} />, {
				wrapper: Hosts,
			});
			await tap(screen.getByTestId("dtp-calendar-day-2026-10-20"));
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(onValueChange).toHaveBeenCalledWith({
				date: { day: 20, month: 10, year: 2026 },
				time: { hour: 10, minute: 15 },
			});
		});

		test("uncontrolled: a pick updates the trigger", async () => {
			await renderWithProviders(<Picker defaultOpen minuteStep={15} />, { wrapper: Hosts });
			expect(trigger()).toHaveAccessibilityValue({ text: "not set" });
			await tap(screen.getByTestId("dtp-calendar-day-2026-10-20"));
			expect(trigger().props.accessibilityValue.text).toContain("Tuesday, October 20, 2026");
		});

		test("picking a day keeps the time of an existing value", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} onValueChange={onValueChange} />, {
				wrapper: Hosts,
			});
			await tap(screen.getByTestId("dtp-calendar-day-2026-10-14"));
			expect(onValueChange).toHaveBeenCalledWith({
				date: { day: 14, month: 10, year: 2026 },
				time: { hour: 15, minute: 30 },
			});
		});

		test("controlled: reports the pick but waits for the prop", async () => {
			const onValueChange = jest.fn();
			const { rerender } = await renderWithProviders(
				<Picker defaultOpen onValueChange={onValueChange} value={OCT_5} />,
				{ wrapper: Hosts }
			);
			await tap(screen.getByTestId("dtp-calendar-day-2026-10-14"));
			expect(onValueChange).toHaveBeenCalledTimes(1);
			expect(trigger().props.accessibilityValue.text).toContain("October 5, 2026");

			const next: DateTimeValue = { date: { day: 14, month: 10, year: 2026 }, time: OCT_5.time };
			await rerender(<Picker defaultOpen onValueChange={onValueChange} value={next} />);
			expect(trigger().props.accessibilityValue.text).toContain("October 14, 2026");
		});

		test("a disabled day does not report", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(
				<Picker
					defaultOpen
					disabledDates={[{ date: { day: 20, month: 10, year: 2026 }, type: "date" }]}
					onValueChange={onValueChange}
				/>,
				{ wrapper: Hosts }
			);
			await tap(screen.getByTestId("dtp-calendar-day-2026-10-20"));
			expect(onValueChange).not.toHaveBeenCalled();
		});
	});

	describe("time section", () => {
		test("the first date pick on an empty value moves to the Time tab, showing its readout", async () => {
			await renderWithProviders(<Picker defaultOpen minuteStep={15} />, { wrapper: Hosts });
			expect(screen.getByRole("tab", { name: "Date" })).toBeSelected();
			await tap(screen.getByTestId("dtp-calendar-day-2026-10-20"));
			expect(screen.getByRole("tab", { name: "Time" })).toBeSelected();
			expect(screen.getByLabelText(/^Time, 10:15\sAM$/)).toBeOnTheScreen();
		});

		test("with a value set the sheet opens on Date and does not jump", async () => {
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} />, { wrapper: Hosts });
			expect(screen.getByRole("tab", { name: "Date" })).toBeSelected();
			await tap(screen.getByTestId("dtp-calendar-day-2026-10-14"));
			expect(screen.getByRole("tab", { name: "Date" })).toBeSelected();
		});

		test("the time row reads 'not set' while empty", async () => {
			await renderWithProviders(<Picker defaultOpen />, { wrapper: Hosts });
			await tap(screen.getByTestId("dtp-tab-time"));
			expect(screen.getByTestId("dtp-time-row")).toBeOnTheScreen();
			expect(screen.getByLabelText("Time, not set")).toBeOnTheScreen();
		});

		test("stacked: the time row is a button whose expanded state toggles", async () => {
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} layout="stacked" />, { wrapper: Hosts });
			const row = screen.getByTestId("dtp-time-row");
			expect(row).toBeOnTheScreen();
			expect(row).not.toBeExpanded();
			await tap(row);
			expect(screen.getByTestId("dtp-time-row")).toBeExpanded();
			await tap(screen.getByTestId("dtp-time-row"));
			expect(screen.getByTestId("dtp-time-row")).not.toBeExpanded();
		});

		test("stacked: a disabled picker's time row does not toggle", async () => {
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} isReadOnly layout="stacked" />, {
				wrapper: Hosts,
			});
			await tap(screen.getByTestId("dtp-time-row"));
			expect(screen.getByTestId("dtp-time-row")).not.toBeExpanded();
		});
	});

	describe("Done and Clear", () => {
		test("Done announces the composed value and closes", async () => {
			const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
			const onOpenChange = jest.fn();
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} onOpenChange={onOpenChange} />, {
				wrapper: Hosts,
			});
			await tapButton("Done");
			const messages = announce.mock.calls.map(([message]) => String(message));
			expect(messages.some((message) => /^Selected Monday, October 5, 2026 at 3:30\sPM$/.test(message))).toBe(true);
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
		});

		test("Done on an empty value announces that nothing is selected", async () => {
			const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
			await renderWithProviders(<Picker defaultOpen />, { wrapper: Hosts });
			await tapButton("Done");
			expect(announce).toHaveBeenCalledWith("No date and time selected");
		});

		test("Done keeps the value", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} onValueChange={onValueChange} />, {
				wrapper: Hosts,
			});
			await tapButton("Done");
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("Clear is absent unless isClearable", async () => {
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} />, { wrapper: Hosts });
			expect(screen.queryByRole("button", { name: "Clear" })).not.toBeOnTheScreen();
		});

		test("Clear is disabled while empty", async () => {
			const onValueChange = jest.fn();
			await renderWithProviders(<Picker defaultOpen isClearable onValueChange={onValueChange} />, {
				wrapper: Hosts,
			});
			expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
			await tapButton("Clear");
			expect(onValueChange).not.toHaveBeenCalled();
		});

		test("Clear reports null and stays open", async () => {
			const onValueChange = jest.fn();
			const onOpenChange = jest.fn();
			await renderWithProviders(
				<Picker
					defaultOpen
					defaultValue={OCT_5}
					isClearable
					onOpenChange={onOpenChange}
					onValueChange={onValueChange}
				/>,
				{ wrapper: Hosts }
			);
			await tapButton("Clear");
			expect(onValueChange).toHaveBeenCalledWith(null);
			expect(onOpenChange).not.toHaveBeenCalled();
			expect(trigger()).toHaveAccessibilityValue({ text: "not set" });
			expect(screen.getByRole("button", { name: "Done" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
		});

		test("Clear is disabled when the picker is read-only", async () => {
			await renderWithProviders(<Picker defaultOpen defaultValue={OCT_5} isClearable isReadOnly />, {
				wrapper: Hosts,
			});
			expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
		});
	});

	describe("compound parts", () => {
		test("custom children replace the default trigger", async () => {
			await renderWithProviders(
				<Picker>
					<DateTimePicker.Trigger testID="custom">
						<DateTimePicker.Value />
					</DateTimePicker.Trigger>
				</Picker>,
				{ wrapper: Hosts }
			);
			expect(screen.getByTestId("custom")).toBeOnTheScreen();
			expect(screen.queryByTestId("dtp-trigger")).not.toBeOnTheScreen();
		});

		test.each([
			["DateTimePicker.Trigger", <DateTimePicker.Trigger key="t" />],
			["DateTimePicker.Done", <DateTimePicker.Done key="d" />],
			["DateTimePicker.Clear", <DateTimePicker.Clear key="c" />],
			["DateTimePicker.Time", <DateTimePicker.Time key="m" />],
			["DateTimePicker.Content", <DateTimePicker.Content key="n" />],
		])("%s outside a root throws its documented error", async (name, element) => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(renderWithProviders(element, { wrapper: Hosts })).rejects.toThrow(
				`${name} must be rendered inside a <DateTimePicker>.`
			);
			spy.mockRestore();
		});
	});
});
