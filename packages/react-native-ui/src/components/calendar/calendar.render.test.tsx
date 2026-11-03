import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Calendar } from "./calendar";
import type { CalendarDate } from "./calendar.date";

const day = (year: number, month: number, d: number): CalendarDate => ({ day: d, month, year });

/** Opens on October 2026 through `defaultMonth`; the ids come from the root testID. */
const OCT = day(2026, 10, 1);
const press = (id: string) => fireEvent(screen.getByTestId(`cal-day-${id}`), "accessibilityTap");

describe("Calendar", () => {
	beforeEach(() => {
		jest.useFakeTimers({ advanceTimers: true });
		jest.setSystemTime(new Date(2026, 9, 14, 12, 0, 0));
	});
	afterEach(() => {
		jest.useRealTimers();
	});

	describe("render", () => {
		test("names the visible month on the caption, with the arrows", async () => {
			await renderWithProviders(<Calendar locale="en" testID="cal" />);
			expect(screen.getByRole("button", { name: "October 2026" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "October 2026" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Previous month" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Next month" })).toBeOnTheScreen();
		});

		test("opens on today's month by the fake clock and marks today in the label", async () => {
			await renderWithProviders(<Calendar locale="en" testID="cal" />);
			const today = screen.getByTestId("cal-day-2026-10-14");
			expect(today.props.accessibilityLabel).toMatch(/, Today$/);
			expect(screen.getByTestId("cal-day-2026-10-15").props.accessibilityLabel).not.toMatch(/Today/);
		});

		test("a day is a button named by its full date", async () => {
			await renderWithProviders(<Calendar locale="en" testID="cal" />);
			expect(screen.getByRole("button", { name: /October 5, 2026/ })).toBeOnTheScreen();
		});

		test("always draws six weeks, with outside days as buttons by default", async () => {
			await renderWithProviders(<Calendar locale="en" testID="cal" weekStartsOn={1} />);
			expect(screen.getByTestId("cal-day-2026-09-28")).toBeOnTheScreen();
			expect(screen.getByTestId("cal-day-2026-11-08")).toBeOnTheScreen();
		});

		test("showOutsideDays={false} leaves outside cells empty", async () => {
			await renderWithProviders(<Calendar locale="en" showOutsideDays={false} testID="cal" weekStartsOn={1} />);
			expect(screen.queryByTestId("cal-day-2026-09-28")).not.toBeOnTheScreen();
			expect(screen.getByTestId("cal-day-2026-10-05")).toBeOnTheScreen();
		});

		test("no root testID, no part ids", async () => {
			await renderWithProviders(<Calendar locale="en" />);
			expect(screen.queryByTestId("cal-day-2026-10-05")).not.toBeOnTheScreen();
		});

		test("the today prop overrides the clock", async () => {
			await renderWithProviders(<Calendar locale="en" testID="cal" today={day(2027, 3, 9)} />);
			expect(screen.getByRole("button", { name: "March 2027" })).toBeOnTheScreen();
			expect(screen.getByTestId("cal-day-2027-03-09").props.accessibilityLabel).toMatch(/, Today$/);
		});
	});

	describe("single selection", () => {
		test("defaultSelected is announced selected and a tap selects another", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(
				<Calendar defaultSelected={day(2026, 10, 5)} locale="en" onSelect={onSelect} testID="cal" />
			);
			expect(screen.getByTestId("cal-day-2026-10-05")).toBeSelected();
			await press("2026-10-06");
			expect(onSelect).toHaveBeenLastCalledWith(day(2026, 10, 6));
			expect(screen.getByTestId("cal-day-2026-10-06")).toBeSelected();
			expect(screen.getByTestId("cal-day-2026-10-05")).not.toBeSelected();
		});

		test("a tap on the selected day clears it to null", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(
				<Calendar defaultSelected={day(2026, 10, 5)} locale="en" onSelect={onSelect} testID="cal" />
			);
			await press("2026-10-05");
			expect(onSelect).toHaveBeenLastCalledWith(null);
			expect(screen.getByTestId("cal-day-2026-10-05")).not.toBeSelected();
		});

		test("opens on the selection's month", async () => {
			await renderWithProviders(<Calendar defaultSelected={day(2026, 12, 25)} locale="en" testID="cal" />);
			expect(screen.getByRole("button", { name: "December 2026" })).toBeOnTheScreen();
		});

		test("controlled: reports the tap and waits for the prop", async () => {
			const onSelect = jest.fn();
			const view = await renderWithProviders(
				<Calendar locale="en" onSelect={onSelect} selected={day(2026, 10, 5)} testID="cal" />
			);
			await press("2026-10-07");
			expect(onSelect).toHaveBeenCalledWith(day(2026, 10, 7));
			expect(screen.getByTestId("cal-day-2026-10-07")).not.toBeSelected();
			expect(screen.getByTestId("cal-day-2026-10-05")).toBeSelected();

			await view.rerender(<Calendar locale="en" onSelect={onSelect} selected={day(2026, 10, 7)} testID="cal" />);
			expect(screen.getByTestId("cal-day-2026-10-07")).toBeSelected();
			expect(screen.getByTestId("cal-day-2026-10-05")).not.toBeSelected();
		});

		test("tapping an outside day only selects it when selectOutsideDays, and pages to its month", async () => {
			const onSelect = jest.fn();
			const view = await renderWithProviders(
				<Calendar defaultMonth={OCT} locale="en" onSelect={onSelect} testID="cal" weekStartsOn={1} />
			);
			expect(screen.getByTestId("cal-day-2026-09-28")).toBeDisabled();
			await press("2026-09-28");
			expect(onSelect).not.toHaveBeenCalled();

			await view.rerender(
				<Calendar defaultMonth={OCT} locale="en" onSelect={onSelect} selectOutsideDays testID="cal" weekStartsOn={1} />
			);
			await press("2026-09-28");
			expect(onSelect).toHaveBeenLastCalledWith(day(2026, 9, 28));
			expect(screen.getByRole("button", { name: "September 2026" })).toBeOnTheScreen();
		});
	});

	describe("multiple selection", () => {
		test("toggles days in and out, reporting a sorted list", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(<Calendar locale="en" mode="multiple" onSelect={onSelect} testID="cal" />);
			await press("2026-10-09");
			await press("2026-10-03");
			expect(onSelect).toHaveBeenLastCalledWith([day(2026, 10, 3), day(2026, 10, 9)]);
			expect(screen.getByTestId("cal-day-2026-10-03")).toBeSelected();
			expect(screen.getByTestId("cal-day-2026-10-09")).toBeSelected();

			await press("2026-10-09");
			expect(onSelect).toHaveBeenLastCalledWith([day(2026, 10, 3)]);
			expect(screen.getByTestId("cal-day-2026-10-09")).not.toBeSelected();
		});

		test("defaultSelected seeds the list", async () => {
			await renderWithProviders(
				<Calendar defaultSelected={[day(2026, 10, 2), day(2026, 10, 20)]} locale="en" mode="multiple" testID="cal" />
			);
			expect(screen.getByTestId("cal-day-2026-10-02")).toBeSelected();
			expect(screen.getByTestId("cal-day-2026-10-20")).toBeSelected();
		});
	});

	describe("range selection", () => {
		test("the first tap reports a start, the second completes the range", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(<Calendar locale="en" mode="range" onSelect={onSelect} testID="cal" />);
			await press("2026-10-05");
			expect(onSelect).toHaveBeenLastCalledWith({ end: null, start: day(2026, 10, 5) });
			await press("2026-10-09");
			expect(onSelect).toHaveBeenLastCalledWith({ end: day(2026, 10, 9), start: day(2026, 10, 5) });
			expect(screen.getByTestId("cal-day-2026-10-05").props.accessibilityLabel).toMatch(/, Range start$/);
			expect(screen.getByTestId("cal-day-2026-10-09").props.accessibilityLabel).toMatch(/, Range end$/);
		});

		test("tapping an earlier day second makes it the start", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(<Calendar locale="en" mode="range" onSelect={onSelect} testID="cal" />);
			await press("2026-10-20");
			await press("2026-10-12");
			expect(onSelect).toHaveBeenLastCalledWith({ end: day(2026, 10, 20), start: day(2026, 10, 12) });
		});

		test("a tap after a complete range starts a new one", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(
				<Calendar
					defaultSelected={{ end: day(2026, 10, 9), start: day(2026, 10, 5) }}
					locale="en"
					mode="range"
					onSelect={onSelect}
					testID="cal"
				/>
			);
			await press("2026-10-22");
			expect(onSelect).toHaveBeenLastCalledWith({ end: null, start: day(2026, 10, 22) });
		});

		test("a range spanning a disabled day restarts at the tapped day", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(
				<Calendar
					disabled={[{ date: day(2026, 10, 7), type: "date" }]}
					locale="en"
					mode="range"
					onSelect={onSelect}
					testID="cal"
				/>
			);
			await press("2026-10-05");
			await press("2026-10-09");
			expect(onSelect).toHaveBeenLastCalledWith({ end: null, start: day(2026, 10, 9) });
		});
	});

	describe("disabled dates", () => {
		test("minDate and maxDate disable days outside them and ignore taps", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(
				<Calendar
					locale="en"
					maxDate={day(2026, 10, 20)}
					minDate={day(2026, 10, 10)}
					onSelect={onSelect}
					testID="cal"
				/>
			);
			expect(screen.getByTestId("cal-day-2026-10-09")).toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-21")).toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-10")).not.toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-20")).not.toBeDisabled();
			await press("2026-10-09");
			expect(onSelect).not.toHaveBeenCalled();
			await press("2026-10-15");
			expect(onSelect).toHaveBeenCalledTimes(1);
		});

		test("matchers: weekday, span and predicate each disable their days", async () => {
			await renderWithProviders(
				<Calendar
					disabled={[
						{ days: [0, 6], type: "weekday" },
						{ from: day(2026, 10, 12), to: day(2026, 10, 13), type: "span" },
						{ test: (d) => d.day === 21, type: "predicate" },
					]}
					locale="en"
					testID="cal"
				/>
			);
			expect(screen.getByTestId("cal-day-2026-10-03")).toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-04")).toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-12")).toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-13")).toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-21")).toBeDisabled();
			expect(screen.getByTestId("cal-day-2026-10-14")).not.toBeDisabled();
		});

		test("isDisabled makes every day and arrow inert", async () => {
			const onSelect = jest.fn();
			await renderWithProviders(<Calendar isDisabled locale="en" onSelect={onSelect} testID="cal" />);
			expect(screen.getByTestId("cal-day-2026-10-14")).toBeDisabled();
			expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
			await press("2026-10-14");
			expect(onSelect).not.toHaveBeenCalled();
		});

		test("isReadOnly ignores day taps but paging still works", async () => {
			const onSelect = jest.fn();
			const onMonthChange = jest.fn();
			await renderWithProviders(
				<Calendar isReadOnly locale="en" onMonthChange={onMonthChange} onSelect={onSelect} testID="cal" />
			);
			await press("2026-10-14");
			expect(onSelect).not.toHaveBeenCalled();
			expect(screen.getByRole("button", { name: "Next month" })).not.toBeDisabled();
			await fireEvent(screen.getByRole("button", { name: "Next month" }), "accessibilityTap");
			expect(onMonthChange).toHaveBeenCalledWith(day(2026, 11, 1));
		});
	});

	describe("month navigation", () => {
		test("the arrows page a month and report the first of it", async () => {
			const onMonthChange = jest.fn();
			await renderWithProviders(<Calendar locale="en" onMonthChange={onMonthChange} testID="cal" />);
			await fireEvent(screen.getByRole("button", { name: "Next month" }), "accessibilityTap");
			expect(onMonthChange).toHaveBeenLastCalledWith(day(2026, 11, 1));
			expect(screen.getByRole("button", { name: "November 2026" })).toBeOnTheScreen();

			await fireEvent(screen.getByRole("button", { name: "Previous month" }), "accessibilityTap");
			await fireEvent(screen.getByRole("button", { name: "Previous month" }), "accessibilityTap");
			expect(onMonthChange).toHaveBeenLastCalledWith(day(2026, 9, 1));
			expect(screen.getByRole("button", { name: "September 2026" })).toBeOnTheScreen();
		});

		test("paging across a year boundary", async () => {
			await renderWithProviders(<Calendar defaultMonth={day(2026, 12, 1)} locale="en" testID="cal" />);
			await fireEvent(screen.getByRole("button", { name: "Next month" }), "accessibilityTap");
			expect(screen.getByRole("button", { name: "January 2027" })).toBeOnTheScreen();
		});

		test("the arrows disable at the minDate and maxDate months", async () => {
			await renderWithProviders(
				<Calendar locale="en" maxDate={day(2026, 11, 30)} minDate={day(2026, 10, 1)} testID="cal" />
			);
			expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Next month" })).not.toBeDisabled();
			await fireEvent(screen.getByRole("button", { name: "Next month" }), "accessibilityTap");
			expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Previous month" })).not.toBeDisabled();
		});

		test("startMonth and endMonth bound paging without bounding selection", async () => {
			await renderWithProviders(
				<Calendar endMonth={day(2026, 10, 1)} locale="en" startMonth={day(2026, 10, 1)} testID="cal" />
			);
			expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
		});

		test("the caption's increment and decrement actions page for assistive tech", async () => {
			const onMonthChange = jest.fn();
			await renderWithProviders(<Calendar locale="en" onMonthChange={onMonthChange} testID="cal" />);
			const caption = screen.getByTestId("cal-caption");
			await fireEvent(caption, "accessibilityAction", { nativeEvent: { actionName: "increment" } });
			expect(onMonthChange).toHaveBeenLastCalledWith(day(2026, 11, 1));
			await fireEvent(caption, "accessibilityAction", { nativeEvent: { actionName: "decrement" } });
			expect(onMonthChange).toHaveBeenLastCalledWith(day(2026, 10, 1));
		});

		test("controlled month: reports the change and waits for the prop", async () => {
			const onMonthChange = jest.fn();
			const view = await renderWithProviders(
				<Calendar locale="en" month={day(2026, 10, 17)} onMonthChange={onMonthChange} testID="cal" />
			);
			await fireEvent(screen.getByRole("button", { name: "Next month" }), "accessibilityTap");
			expect(onMonthChange).toHaveBeenCalledWith(day(2026, 11, 1));
			expect(screen.getByRole("button", { name: "October 2026" })).toBeOnTheScreen();

			await view.rerender(<Calendar locale="en" month={day(2026, 11, 1)} onMonthChange={onMonthChange} testID="cal" />);
			expect(screen.getByRole("button", { name: "November 2026" })).toBeOnTheScreen();
		});

		test("the caption picker jumps through months and years", async () => {
			const onMonthChange = jest.fn();
			await renderWithProviders(<Calendar locale="en" onMonthChange={onMonthChange} testID="cal" />);
			await fireEvent(screen.getByRole("button", { name: "October 2026" }), "accessibilityTap");
			expect(screen.getByRole("button", { name: "2026" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Previous year" })).toBeOnTheScreen();

			await fireEvent(screen.getByTestId("cal-month-3"), "accessibilityTap");
			expect(onMonthChange).toHaveBeenLastCalledWith(day(2026, 3, 1));
		});

		test('captionLayout="label" is an adjustable text, not a button', async () => {
			await renderWithProviders(<Calendar captionLayout="label" locale="en" testID="cal" />);
			expect(screen.getByRole("adjustable", { name: "October 2026" })).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "October 2026" })).not.toBeOnTheScreen();
		});
	});

	describe("compound parts", () => {
		test("a custom anatomy renders the parts it is given", async () => {
			await renderWithProviders(
				<Calendar locale="en" testID="cal">
					<Calendar.Header>
						<Calendar.Caption />
						<Calendar.Nav direction="next" label="Later" />
					</Calendar.Header>
					<Calendar.Weekdays />
					<Calendar.Grid />
				</Calendar>
			);
			expect(screen.getByRole("button", { name: "Later" })).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: "Previous month" })).not.toBeOnTheScreen();
		});

		test("Calendar.Day renders custom content in place of the number", async () => {
			await renderWithProviders(
				<Calendar locale="en" testID="cal">
					<Calendar.Day date={day(2026, 10, 5)}>{() => <Text>$120</Text>}</Calendar.Day>
				</Calendar>
			);
			expect(screen.getByText("$120")).toBeOnTheScreen();
		});

		test.each([
			["Calendar.Day", () => <Calendar.Day date={day(2026, 10, 5)} />],
			["Calendar.Nav", () => <Calendar.Nav direction="next" />],
			["Calendar.Caption", () => <Calendar.Caption />],
			["Calendar.Grid", () => <Calendar.Grid />],
		])("%s outside a Calendar throws its documented error", async (name, part) => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			try {
				await expect(renderWithProviders(part())).rejects.toThrow(`${name} must be rendered inside a <Calendar>.`);
			} finally {
				spy.mockRestore();
			}
		});
	});
});
