import { BottomSheetProvider } from "@delacour/react-native-bottom-sheet";
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { act, fireEvent, renderWithProviders, screen, within } from "../../test/render";
import type { CalendarDate, CalendarDateRange } from "../calendar/calendar.date";
import { OverlayProvider } from "../overlay";
import { DatePicker } from "./date-picker";
import { useDatePicker } from "./date-picker.context";
import type { DatePickerProps } from "./date-picker.types";

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };
const OCT_12: CalendarDate = { year: 2026, month: 10, day: 12 };
const OCT_14: CalendarDate = { year: 2026, month: 10, day: 14 };
const OCT_20: CalendarDate = { year: 2026, month: 10, day: 20 };

function Providers({ children }: { children: ReactNode }): ReactElement {
	return (
		<OverlayProvider>
			<BottomSheetProvider>{children}</BottomSheetProvider>
		</OverlayProvider>
	);
}

/** The root with the fixed locale, today and test id every case shares. */
function Picker(props: DatePickerProps): ReactElement {
	return <DatePicker locale="en-NZ" testID="stay" today={TODAY} {...props} />;
}

const tap = (el: ReturnType<typeof screen.getByTestId>) => fireEvent(el, "accessibilityTap");
const day = (iso: string) => screen.getByTestId(`stay-calendar-day-${iso}`);
const trigger = () => screen.getByRole("button", { name: "Date" });
const settle = () => act(async () => void jest.advanceTimersByTime(500));

beforeEach(() => {
	jest.useFakeTimers();
	jest.setSystemTime(new Date(2026, 9, 5, 12, 0, 0));
});

afterEach(() => {
	jest.useRealTimers();
});

describe("DatePicker trigger", () => {
	test("renders a collapsed button with the placeholder and a 'not set' value", async () => {
		await renderWithProviders(<Picker />, { wrapper: Providers });
		expect(trigger()).toBeOnTheScreen();
		expect(trigger()).not.toBeExpanded();
		expect(trigger()).toHaveAccessibilityValue({ text: "not set" });
		expect(screen.getByText("Select date")).toBeOnTheScreen();
	});

	test("accessibilityLabel and placeholder override the defaults", async () => {
		await renderWithProviders(<Picker accessibilityLabel="Check in" placeholder="Pick a day" />, {
			wrapper: Providers,
		});
		expect(screen.getByRole("button", { name: "Check in" })).toBeOnTheScreen();
		expect(screen.getByText("Pick a day")).toBeOnTheScreen();
	});

	test("shows the formatted value and announces it long-form to assistive tech", async () => {
		await renderWithProviders(<Picker defaultValue={OCT_12} />, { wrapper: Providers });
		expect(screen.queryByText("Select date")).not.toBeOnTheScreen();
		expect(trigger().props.accessibilityValue.text).toContain("12");
		expect(trigger().props.accessibilityValue.text).toContain("2026");
	});

	test("a custom format replaces the day formatter", async () => {
		await renderWithProviders(<Picker defaultValue={OCT_12} format={(d) => `D${d.day}`} />, { wrapper: Providers });
		expect(screen.getByText("D12")).toBeOnTheScreen();
	});

	test("the trigger is expanded while the sheet is open", async () => {
		await renderWithProviders(<Picker defaultOpen />, { wrapper: Providers });
		expect(trigger()).toBeExpanded();
	});

	test("disabled and read-only triggers never open", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Picker isDisabled onOpenChange={onOpenChange} />, {
			wrapper: Providers,
		});
		expect(trigger()).toBeDisabled();
		await tap(trigger());
		expect(onOpenChange).not.toHaveBeenCalled();

		await rerender(<Picker isReadOnly onOpenChange={onOpenChange} />);
		await tap(screen.getByTestId("stay-trigger"));
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.getByTestId("stay-trigger")).not.toBeExpanded();
	});

	test("a read-only trigger reads as text, not a button it cannot press", async () => {
		await renderWithProviders(<Picker isReadOnly />, { wrapper: Providers });
		expect(screen.queryByRole("button", { name: "Date" })).not.toBeOnTheScreen();
		expect(screen.getByRole("text", { name: "Date" })).toBeEnabled();
	});

	test("a disabled trigger keeps the button role", async () => {
		await renderWithProviders(<Picker isDisabled />, { wrapper: Providers });
		expect(trigger()).toBeDisabled();
	});
});

describe("DatePicker sheet", () => {
	test("renders no calendar until opened; the trigger opens it and reports onOpenChange", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Picker onOpenChange={onOpenChange} />, { wrapper: Providers });
		expect(screen.queryByText("Select date", { hidden: true })).toBeOnTheScreen();
		expect(screen.queryByTestId("stay-calendar-day-2026-10-12")).not.toBeOnTheScreen();

		await tap(trigger());
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(trigger()).toBeExpanded();
		expect(screen.getByTestId("stay-calendar-day-2026-10-12")).toBeOnTheScreen();
		expect(screen.getByTestId("stay-title")).toHaveTextContent("Select date");
	});

	test("the title prop names the sheet", async () => {
		await renderWithProviders(<Picker defaultOpen title="Check in" />, { wrapper: Providers });
		expect(screen.getByTestId("stay-title")).toHaveTextContent("Check in");
	});

	test("the close control dismisses the sheet and reports onOpenChange(false)", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Picker defaultOpen onOpenChange={onOpenChange} />, { wrapper: Providers });
		await tap(screen.getByTestId("stay-close"));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(trigger()).not.toBeExpanded();
	});

	test("controlled isOpen decides; the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Picker isOpen={false} onOpenChange={onOpenChange} />, {
			wrapper: Providers,
		});
		await tap(trigger());
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(trigger()).not.toBeExpanded();

		await rerender(<Picker isOpen onOpenChange={onOpenChange} />);
		expect(trigger()).toBeExpanded();
		expect(screen.getByTestId("stay-calendar-day-2026-10-12")).toBeOnTheScreen();
	});

	// The sheet reports `onClose` from a UI-thread settle at the closed index, scheduled through
	// worklets; Jest runs no UI runtime, so the settle never lands and "fires once the slide has
	// finished" cannot be driven here. What can be pinned is that starting a close does not call it.
	test("onClose is not called when a close merely starts", async () => {
		const onClose = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Picker defaultOpen onClose={onClose} onOpenChange={onOpenChange} />, {
			wrapper: Providers,
		});
		await tap(screen.getByTestId("stay-close"));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(onClose).not.toHaveBeenCalled();
	});
});

describe("DatePicker single mode", () => {
	test("picking a day reports it once, shows it, and closes after the pause", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Picker defaultOpen format={(d) => `D${d.day}`} onOpenChange={onOpenChange} onValueChange={onValueChange} />,
			{ wrapper: Providers }
		);

		await tap(day("2026-10-12"));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith(OCT_12);
		expect(screen.getByText("D12")).toBeOnTheScreen();
		expect(onOpenChange).not.toHaveBeenCalled();

		await settle();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(trigger()).not.toBeExpanded();
	});

	test("a re-tap on the shown day keeps it, reports nothing and closes", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Picker defaultOpen defaultValue={OCT_12} onOpenChange={onOpenChange} onValueChange={onValueChange} />,
			{ wrapper: Providers }
		);

		await tap(day("2026-10-12"));
		expect(day("2026-10-12")).toBeSelected();
		expect(onValueChange).not.toHaveBeenCalled();

		await settle();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(trigger()).toHaveAccessibilityValue({ text: "12 October 2026" });
	});

	test("the picked day is announced as selected", async () => {
		await renderWithProviders(<Picker defaultOpen defaultValue={OCT_12} />, { wrapper: Providers });
		expect(day("2026-10-12")).toBeSelected();
		expect(day("2026-10-13")).not.toBeSelected();
	});

	test("a disabled day cannot be picked", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Picker defaultOpen minDate={OCT_12} onValueChange={onValueChange} />, {
			wrapper: Providers,
		});
		await tap(day("2026-10-06"));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test("controlled value waits for the prop", async () => {
		const onValueChange = jest.fn();
		const { rerender } = await renderWithProviders(
			<Picker defaultOpen onValueChange={onValueChange} value={OCT_12} />,
			{ wrapper: Providers }
		);
		await tap(day("2026-10-14"));
		expect(onValueChange).toHaveBeenCalledWith(OCT_14);
		expect(day("2026-10-12")).toBeSelected();
		expect(day("2026-10-14")).not.toBeSelected();

		await rerender(<Picker defaultOpen onValueChange={onValueChange} value={OCT_14} />);
		expect(day("2026-10-14")).toBeSelected();
		expect(day("2026-10-12")).not.toBeSelected();
	});

	test("passing value keeps it controlled when a form resets it to undefined", async () => {
		const { rerender } = await renderWithProviders(<Picker isOpen value={undefined} />, { wrapper: Providers });
		await tap(day("2026-10-12"));
		expect(day("2026-10-12")).not.toBeSelected();

		await rerender(<Picker isOpen value={OCT_12} />);
		expect(day("2026-10-12")).toBeSelected();

		await rerender(<Picker isOpen value={undefined} />);
		expect(day("2026-10-12")).not.toBeSelected();
		expect(trigger()).toHaveAccessibilityValue({ text: "not set" });
	});

	test("is not clearable by default; isClearable adds Clear, which empties, reports and stays open", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Picker defaultOpen defaultValue={OCT_12} />, {
			wrapper: Providers,
		});
		expect(screen.queryByRole("button", { name: "Clear" })).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Done" })).not.toBeOnTheScreen();

		await rerender(
			<Picker defaultOpen defaultValue={OCT_12} isClearable onOpenChange={onOpenChange} onValueChange={onValueChange} />
		);
		await tap(screen.getByRole("button", { name: "Clear" }));
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(within(trigger()).getByText("Select date")).toBeOnTheScreen();
		await settle();
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(trigger()).toBeExpanded();
	});

	test("Clear is disabled while nothing is picked", async () => {
		await renderWithProviders(<Picker defaultOpen isClearable />, { wrapper: Providers });
		expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
	});

	test("clearLabel and doneLabel rename the footer", async () => {
		await renderWithProviders(
			<Picker clearLabel="Reset" defaultOpen doneLabel="Confirm" isClearable mode="multiple" />,
			{
				wrapper: Providers,
			}
		);
		expect(screen.getByRole("button", { name: "Reset" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Confirm" })).toBeOnTheScreen();
	});

	test("uncontrolled defaultValue seeds the selection", async () => {
		await renderWithProviders(<Picker defaultOpen defaultValue={OCT_20} />, { wrapper: Providers });
		expect(day("2026-10-20")).toBeSelected();
	});
});

describe("DatePicker month bounds", () => {
	test("defaultMonth, startMonth and endMonth reach the default calendar", async () => {
		const june1990: CalendarDate = { year: 1990, month: 6, day: 1 };
		await renderWithProviders(
			<Picker defaultMonth={june1990} defaultOpen endMonth={june1990} startMonth={june1990} />,
			{ wrapper: Providers }
		);
		expect(day("1990-06-15")).toBeOnTheScreen();
		expect(screen.getByTestId("stay-calendar-prev")).toBeDisabled();
		expect(screen.getByTestId("stay-calendar-next")).toBeDisabled();
	});
});

describe("DatePicker range mode", () => {
	test("the first tap is held, only the complete range is reported, then it closes", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Picker defaultOpen mode="range" onOpenChange={onOpenChange} onValueChange={onValueChange} />,
			{ wrapper: Providers }
		);

		await tap(day("2026-10-12"));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(trigger().props.accessibilityValue.text).toContain("no end chosen");
		await settle();
		expect(trigger()).toBeExpanded();

		await tap(day("2026-10-14"));
		const expected: CalendarDateRange = { start: OCT_12, end: OCT_14 };
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith(expected);
		await settle();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("Done drops a half-picked range and reports nothing", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(<Picker defaultOpen mode="range" onValueChange={onValueChange} />, {
			wrapper: Providers,
		});
		await tap(day("2026-10-12"));
		await tap(screen.getByRole("button", { name: "Done" }));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(trigger()).not.toBeExpanded();
		expect(trigger().props.accessibilityValue.text).toBe("not set");
	});

	test("Clear reports an empty range and keeps the sheet open", async () => {
		const onValueChange = jest.fn();
		await renderWithProviders(
			<Picker defaultOpen defaultValue={{ start: OCT_12, end: OCT_14 }} mode="range" onValueChange={onValueChange} />,
			{ wrapper: Providers }
		);
		await tap(screen.getByRole("button", { name: "Clear" }));
		expect(onValueChange).toHaveBeenCalledWith({ start: null, end: null });
		expect(trigger()).toBeExpanded();
	});
});

describe("DatePicker multiple mode", () => {
	test("reports every toggle, sorted, and stays open until Done", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Picker defaultOpen mode="multiple" onOpenChange={onOpenChange} onValueChange={onValueChange} />,
			{ wrapper: Providers }
		);

		await tap(day("2026-10-14"));
		await tap(day("2026-10-12"));
		expect(onValueChange).toHaveBeenNthCalledWith(1, [OCT_14]);
		expect(onValueChange).toHaveBeenNthCalledWith(2, [OCT_12, OCT_14]);
		await settle();
		expect(trigger()).toBeExpanded();

		await tap(day("2026-10-14"));
		expect(onValueChange).toHaveBeenLastCalledWith([OCT_12]);

		await tap(screen.getByRole("button", { name: "Done" }));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(trigger()).not.toBeExpanded();
	});
});

describe("DatePicker inline", () => {
	test("draws the calendar with no trigger and never closes or opens", async () => {
		const onValueChange = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Picker onOpenChange={onOpenChange} onValueChange={onValueChange} presentation="inline" />,
			{ wrapper: Providers }
		);
		expect(screen.queryByRole("button", { name: "Date" })).not.toBeOnTheScreen();
		await tap(day("2026-10-12"));
		expect(onValueChange).toHaveBeenCalledWith(OCT_12);
		await settle();
		expect(onOpenChange).not.toHaveBeenCalled();
	});
});

describe("DatePicker parts", () => {
	test("a custom anatomy renders its own trigger and content", async () => {
		await renderWithProviders(
			<Picker defaultOpen>
				<DatePicker.Trigger>
					<DatePicker.Value />
				</DatePicker.Trigger>
				<DatePicker.Content title="Dates" />
			</Picker>,
			{ wrapper: Providers }
		);
		expect(screen.getByTestId("stay-title")).toHaveTextContent("Dates");
	});

	test.each([
		["DatePicker.Trigger", <DatePicker.Trigger key="t" />],
		["DatePicker.Value", <DatePicker.Value key="v" />],
		["DatePicker.Icon", <DatePicker.Icon key="i" />],
		["DatePicker.Calendar", <DatePicker.Calendar key="c" />],
		["DatePicker.Done", <DatePicker.Done key="d" />],
		["DatePicker.Clear", <DatePicker.Clear key="x" />],
	])("%s outside a DatePicker throws its documented error", async (name, part) => {
		const original = console.error;
		console.error = () => {};
		try {
			await expect(renderWithProviders(part, { wrapper: Providers })).rejects.toThrow(
				`${name} must be rendered inside a <DatePicker>.`
			);
		} finally {
			console.error = original;
		}
	});

	test("useDatePicker outside a DatePicker throws", async () => {
		function Probe(): ReactElement | null {
			useDatePicker();
			return null;
		}
		const original = console.error;
		console.error = () => {};
		try {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow(
				"useDatePicker must be called inside a <DatePicker>."
			);
		} finally {
			console.error = original;
		}
	});
});
