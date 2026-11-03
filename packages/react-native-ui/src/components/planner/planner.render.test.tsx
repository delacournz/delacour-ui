import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { AccessibilityInfo, Text } from "react-native";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { BottomSheetProvider } from "../bottom-sheet";
import { OverlayProvider } from "../overlay";
import { Planner, type PlannerProps } from "./planner";
import { usePlanner } from "./planner.context";
import type { PlannerCategory, PlannerEntry } from "./planner.types";

const TODAY = new Date(2026, 9, 14, 12, 0, 0);

const categories: PlannerCategory[] = [
	{ id: "run", label: "Run", colorIndex: 1 },
	{ id: "strength", label: "Strength", colorIndex: 2 },
];

const entries: PlannerEntry[] = [
	{ id: "a", date: "2026-10-14", label: "Easy run", category: "run" },
	{ id: "b", date: "2026-10-14", label: "Squats", category: "strength" },
	{ id: "c", date: "2026-10-20", label: "Long run", category: "run" },
	{ id: "d", date: "2026-11-03", label: "Tempo", category: "run" },
];

function Sheets({ children }: { children: ReactNode }): ReactElement {
	return (
		<OverlayProvider>
			<BottomSheetProvider>{children}</BottomSheetProvider>
		</OverlayProvider>
	);
}

function Demo(props: PlannerProps): ReactElement {
	return (
		<Planner categories={categories} entries={entries} locale="en-US" weekStartsOn={1} {...props}>
			<Planner.Header>
				<Planner.Title />
				<Planner.Today />
				<Planner.Nav />
				<Planner.Action accessibilityLabel="Add entry" />
			</Planner.Header>
			<Planner.Grid />
			<Planner.Legend counts>
				<Planner.Summary />
			</Planner.Legend>
			<Planner.Footer>
				<Text>Footer note</Text>
			</Planner.Footer>
		</Planner>
	);
}

const day = (pattern: RegExp) => screen.getByRole("button", { name: pattern });
const press = (name: string | RegExp) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");

beforeEach(() => {
	jest.useFakeTimers();
	jest.setSystemTime(TODAY);
});

afterEach(() => {
	jest.useRealTimers();
	jest.restoreAllMocks();
});

describe("Planner", () => {
	test("opens on the month holding today, with its title as a heading", async () => {
		await renderWithProviders(<Demo />);
		expect(screen.getByRole("header", { name: "October 2026" })).toBeOnTheScreen();
	});

	test("defaultMonth opens on another month", async () => {
		await renderWithProviders(<Demo defaultMonth={new Date(2026, 1, 10)} />);
		expect(screen.getByRole("header", { name: "February 2026" })).toBeOnTheScreen();
	});

	test("each day is one button naming its date, count, categories and today", async () => {
		await renderWithProviders(<Demo />);
		expect(day(/^Wednesday, October 14, 2 entries, Run, Strength, today$/)).toBeOnTheScreen();
		expect(day(/^Tuesday, October 20, 1 entry, Run$/)).toBeOnTheScreen();
		expect(day(/^Thursday, October 15, no entries$/)).toBeOnTheScreen();
	});

	test("an entry without a category is named by its own label", async () => {
		await renderWithProviders(<Demo entries={[{ id: "x", date: "2026-10-05", label: "Dentist" }]} />);
		expect(day(/^Monday, October 5, 1 entry, Dentist$/)).toBeOnTheScreen();
	});

	test("a day outside the month is still a button when outside days show", async () => {
		await renderWithProviders(<Demo />);
		expect(day(/^Monday, November 2, no entries$/)).toBeOnTheScreen();
	});

	test("showOutsideDays={false} leaves the neighbouring months' days out of the tree", async () => {
		await renderWithProviders(<Demo showOutsideDays={false} />);
		expect(screen.queryByRole("button", { name: /^Monday, November 2/ })).not.toBeOnTheScreen();
		expect(day(/^Monday, October 5/)).toBeOnTheScreen();
	});

	test("the Header, Footer and Action parts render inside the root", async () => {
		await renderWithProviders(<Demo />);
		expect(screen.getByText("Footer note")).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Add entry" })).toBeOnTheScreen();
	});

	test("isFramed={false} still renders the parts", async () => {
		await renderWithProviders(<Demo isFramed={false} />);
		expect(screen.getByRole("header", { name: "October 2026" })).toBeOnTheScreen();
	});

	describe("selecting a day", () => {
		test("pressing a day selects it and announces it as selected", async () => {
			await renderWithProviders(<Demo />);
			const target = day(/^Thursday, October 15/);
			expect(target).not.toBeSelected();
			await fireEvent(target, "accessibilityTap");
			expect(day(/^Thursday, October 15/)).toBeSelected();
		});

		test("pressing the selected day clears it", async () => {
			const onSelectedChange = jest.fn();
			await renderWithProviders(<Demo onSelectedChange={onSelectedChange} />);
			await press(/^Thursday, October 15/);
			await press(/^Thursday, October 15/);
			expect(day(/^Thursday, October 15/)).not.toBeSelected();
			expect(onSelectedChange).toHaveBeenLastCalledWith(null);
		});

		test("selecting another day moves the selection", async () => {
			await renderWithProviders(<Demo />);
			await press(/^Thursday, October 15/);
			await press(/^Friday, October 16/);
			expect(day(/^Thursday, October 15/)).not.toBeSelected();
			expect(day(/^Friday, October 16/)).toBeSelected();
		});

		test("defaultSelected seeds the selection", async () => {
			await renderWithProviders(<Demo defaultSelected={new Date(2026, 9, 20)} />);
			expect(day(/^Tuesday, October 20/)).toBeSelected();
		});

		test("onDayPress receives the day and its entries, even with none", async () => {
			const onDayPress = jest.fn();
			await renderWithProviders(<Demo onDayPress={onDayPress} />);
			await press(/^Wednesday, October 14/);
			const [date, dayEntries] = onDayPress.mock.calls[0] as [Date, PlannerEntry[]];
			expect(date.getFullYear()).toBe(2026);
			expect(date.getMonth()).toBe(9);
			expect(date.getDate()).toBe(14);
			expect(dayEntries.map((entry) => entry.id)).toEqual(["a", "b"]);

			await press(/^Thursday, October 15/);
			expect(onDayPress.mock.calls[1]?.[1]).toEqual([]);
		});

		test("onDayPress fires again when the selected day is pressed to clear it", async () => {
			const onDayPress = jest.fn();
			await renderWithProviders(<Demo onDayPress={onDayPress} />);
			await press(/^Thursday, October 15/);
			await press(/^Thursday, October 15/);
			expect(onDayPress).toHaveBeenCalledTimes(2);
		});

		test("a controlled selection reports the change and waits for the prop", async () => {
			const onSelectedChange = jest.fn();
			const view = await renderWithProviders(<Demo onSelectedChange={onSelectedChange} selected={null} />);
			await press(/^Thursday, October 15/);
			expect(onSelectedChange).toHaveBeenCalledTimes(1);
			const [picked] = onSelectedChange.mock.calls[0] as [Date];
			expect(picked.getDate()).toBe(15);
			expect(day(/^Thursday, October 15/)).not.toBeSelected();

			await view.rerender(<Demo onSelectedChange={onSelectedChange} selected={new Date(2026, 9, 15)} />);
			expect(day(/^Thursday, October 15/)).toBeSelected();
		});
	});

	describe("month navigation", () => {
		test("Next and Previous page the month", async () => {
			await renderWithProviders(<Demo />);
			await press("Next month");
			expect(screen.getByRole("header", { name: "November 2026" })).toBeOnTheScreen();
			await press("Previous month");
			await press("Previous month");
			expect(screen.getByRole("header", { name: "September 2026" })).toBeOnTheScreen();
		});

		test("onMonthChange gets the 1st of the new month", async () => {
			const onMonthChange = jest.fn();
			await renderWithProviders(<Demo onMonthChange={onMonthChange} />);
			await press("Next month");
			expect(onMonthChange).toHaveBeenCalledTimes(1);
			const [next] = onMonthChange.mock.calls[0] as [Date];
			expect([next.getFullYear(), next.getMonth(), next.getDate()]).toEqual([2026, 10, 1]);
		});

		test("a custom previousLabel and nextLabel name the buttons", async () => {
			await renderWithProviders(
				<Planner locale="en-US">
					<Planner.Header>
						<Planner.Nav nextLabel="Forward" previousLabel="Back" />
					</Planner.Header>
				</Planner>
			);
			expect(screen.getByRole("button", { name: "Back" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Forward" })).toBeOnTheScreen();
		});

		test("an accepted month change is announced", async () => {
			const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
			announce.mockClear();
			await renderWithProviders(<Demo />);
			await press("Next month");
			expect(announce).toHaveBeenCalledWith("November 2026");
		});

		test("a controlled parent that refuses the month is neither followed nor announced", async () => {
			const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
			announce.mockClear();
			const onMonthChange = jest.fn();
			await renderWithProviders(<Demo month={new Date(2026, 9, 1)} onMonthChange={onMonthChange} />);
			await press("Next month");
			expect(onMonthChange).toHaveBeenCalledTimes(1);
			expect(screen.getByRole("header", { name: "October 2026" })).toBeOnTheScreen();
			expect(announce).not.toHaveBeenCalled();
		});

		test("a controlled month follows the prop", async () => {
			const view = await renderWithProviders(<Demo month={new Date(2026, 9, 20)} />);
			expect(screen.getByRole("header", { name: "October 2026" })).toBeOnTheScreen();
			await view.rerender(<Demo month={new Date(2026, 0, 31)} />);
			expect(screen.getByRole("header", { name: "January 2026" })).toBeOnTheScreen();
		});

		test("Title takes children in place of the month's name", async () => {
			await renderWithProviders(
				<Planner locale="en-US">
					<Planner.Header>
						<Planner.Title>My plan</Planner.Title>
					</Planner.Header>
				</Planner>
			);
			expect(screen.getByRole("header", { name: "My plan" })).toBeOnTheScreen();
		});
	});

	describe("Today", () => {
		test("is disabled on the current month", async () => {
			await renderWithProviders(<Demo />);
			expect(screen.getByRole("button", { name: "Today" })).toBeDisabled();
		});

		test("is enabled elsewhere and returns to the current month", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Planner locale="en-US">
					<Planner.Header>
						<Planner.Title />
						<Planner.Today onPress={onPress} />
						<Planner.Nav />
					</Planner.Header>
				</Planner>
			);
			await press("Next month");
			const today = screen.getByRole("button", { name: "Today" });
			expect(today).not.toBeDisabled();
			await fireEvent(today, "accessibilityTap");
			expect(screen.getByRole("header", { name: "October 2026" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Today" })).toBeDisabled();
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("moves with the clock: crossing midnight changes which day is today", async () => {
			await renderWithProviders(<Demo />);
			expect(day(/^Wednesday, October 14.*, today$/)).toBeOnTheScreen();
			await act(async () => {
				await jest.advanceTimersByTimeAsync(13 * 60 * 60 * 1000);
			});
			expect(day(/^Thursday, October 15.*, today$/)).toBeOnTheScreen();
			expect(screen.queryByRole("button", { name: /^Wednesday, October 14.*today/ })).not.toBeOnTheScreen();
		});
	});

	describe("Legend and Summary", () => {
		test("lists every category, with this month's counts", async () => {
			await renderWithProviders(<Demo />);
			expect(screen.getByLabelText("Run, 2")).toBeOnTheScreen();
			expect(screen.getByLabelText("Strength, 1")).toBeOnTheScreen();
		});

		test("counts follow the displayed month, and a zero is still listed", async () => {
			await renderWithProviders(<Demo />);
			await press("Next month");
			expect(screen.getByLabelText("Run, 1")).toBeOnTheScreen();
			expect(screen.getByLabelText("Strength, 0")).toBeOnTheScreen();
		});

		test("without counts a row is just the category's name", async () => {
			await renderWithProviders(
				<Planner categories={categories} entries={entries} locale="en-US">
					<Planner.Legend />
				</Planner>
			);
			expect(screen.getByLabelText("Run")).toBeOnTheScreen();
			expect(screen.getByLabelText("Strength")).toBeOnTheScreen();
		});

		test("Summary totals the month", async () => {
			await renderWithProviders(<Demo />);
			expect(screen.getByText("3 entries in October")).toBeOnTheScreen();
			await press("Next month");
			expect(screen.getByText("1 entry in November")).toBeOnTheScreen();
		});

		test("Summary says so when the month is empty, and takes children", async () => {
			await renderWithProviders(
				<Planner defaultMonth={new Date(2026, 5, 1)} entries={entries} locale="en-US">
					<Planner.Legend>
						<Planner.Summary />
						<Planner.Summary>Custom</Planner.Summary>
					</Planner.Legend>
				</Planner>
			);
			expect(screen.getByText("No entries in June")).toBeOnTheScreen();
			expect(screen.getByText("Custom")).toBeOnTheScreen();
		});
	});

	describe("variants and renderDay", () => {
		test("the calendar variant draws each entry's name, and the day's label is unchanged", async () => {
			await renderWithProviders(<Demo fill variant="calendar" />);
			expect(screen.getByText("Easy run")).toBeOnTheScreen();
			expect(day(/^Wednesday, October 14, 2 entries, Run, Strength, today$/)).toBeOnTheScreen();
		});

		test("calendar overflow becomes a +N more line", async () => {
			const many: PlannerEntry[] = ["1", "2", "3", "4"].map((id) => ({ id, date: "2026-10-14", label: `Item ${id}` }));
			await renderWithProviders(<Demo entries={many} fill variant="calendar" />);
			expect(screen.getByText("+2 more")).toBeOnTheScreen();
		});

		test("the tiles variant keeps the same accessible day", async () => {
			await renderWithProviders(<Demo variant="tiles" />);
			expect(day(/^Wednesday, October 14, 2 entries, Run, Strength, today$/)).toBeOnTheScreen();
		});

		test("renderDay replaces the content but the button keeps its label, state and press", async () => {
			const onDayPress = jest.fn();
			await renderWithProviders(
				<Planner entries={entries} locale="en-US" onDayPress={onDayPress}>
					<Planner.Grid
						renderDay={({ date, isSelected }) => <Text>{`d${date.getDate()}${isSelected ? "!" : ""}`}</Text>}
					/>
				</Planner>
			);
			expect(screen.getByText("d14")).toBeOnTheScreen();
			await press(/^Wednesday, October 14/);
			expect(onDayPress).toHaveBeenCalledTimes(1);
			expect(screen.getByText("d14!")).toBeOnTheScreen();
			expect(day(/^Wednesday, October 14/)).toBeSelected();
		});
	});

	describe("Details", () => {
		test("is closed until a day is selected, then shows the day and its entries", async () => {
			await renderWithProviders(
				<Planner entries={entries} locale="en-US">
					<Planner.Grid />
					<Planner.Details description="Plan">
						{(_date, dayEntries) => <Text>{dayEntries.map((entry) => entry.label).join(" + ")}</Text>}
					</Planner.Details>
				</Planner>,
				{ wrapper: Sheets }
			);
			expect(screen.queryByText("Easy run + Squats")).not.toBeOnTheScreen();
			await press(/^Wednesday, October 14/);
			expect(screen.getByText("Easy run + Squats")).toBeOnTheScreen();
			expect(screen.getByText("Wednesday, October 14")).toBeOnTheScreen();
			expect(screen.getByText("Plan")).toBeOnTheScreen();
		});

		test("title and description can be functions of the day", async () => {
			await renderWithProviders(
				<Planner defaultSelected={new Date(2026, 9, 14)} entries={entries} locale="en-US">
					<Planner.Details description={(_d, es) => `${es.length} planned`} title={(d) => `Day ${d.getDate()}`}>
						{() => <Text>body</Text>}
					</Planner.Details>
				</Planner>,
				{ wrapper: Sheets }
			);
			expect(screen.getByText("Day 14")).toBeOnTheScreen();
			expect(screen.getByText("2 planned")).toBeOnTheScreen();
		});

		test("without Details, pressing a day opens nothing but still selects", async () => {
			await renderWithProviders(<Demo />, { wrapper: Sheets });
			await press(/^Wednesday, October 14/);
			expect(day(/^Wednesday, October 14/)).toBeSelected();
		});
	});

	describe("parts outside a Planner", () => {
		test.each([
			["Planner.Title", <Planner.Title key="t" />],
			["Planner.Today", <Planner.Today key="d" />],
			["Planner.Nav", <Planner.Nav key="n" />],
			["Planner.Grid", <Planner.Grid key="g" />],
			["Planner.Day", <Planner.Day date={new Date(2026, 9, 14)} key="y" />],
			["Planner.Legend", <Planner.Legend key="l" />],
			["Planner.Summary", <Planner.Summary key="s" />],
			["Planner.Footer", <Planner.Footer key="f" />],
			["Planner.Header", <Planner.Header key="h" />],
		])("%s throws its documented error", async (name, element) => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			await expect(renderWithProviders(element)).rejects.toThrow(`${name} must be rendered inside a <Planner>.`);
			spy.mockRestore();
		});

		test("usePlanner throws outside a Planner", async () => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
			function Probe(): ReactElement {
				usePlanner();
				return <Text>never</Text>;
			}
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("usePlanner must be called inside a <Planner>.");
			spy.mockRestore();
		});
	});
});
