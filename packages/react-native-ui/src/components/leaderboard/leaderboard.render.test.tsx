import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Leaderboard } from "./leaderboard";
import type { LeaderboardEntry, RankedEntry } from "./leaderboard.types";
import { LeaderboardRow } from "./leaderboard-row";

const ENTRIES: readonly LeaderboardEntry[] = [
	{ id: "aria", name: "Aria", value: 980 },
	{ id: "ngaio", name: "Ngaio", value: 1240 },
	{ id: "mihi", name: "Mihi", value: 1105 },
	{ id: "rawiri", name: "Rawiri", value: 860 },
	{ id: "lena", name: "Lena", value: 815 },
];

describe("Leaderboard", () => {
	test("ranks entries handed in any order, one labelled element per place", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} testID="board" unit="points" />);
		expect(screen.getByLabelText("Rank 1, Ngaio, 1,240 points")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 2, Mihi, 1,105 points")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 3, Aria, 980 points")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 4, Rawiri, 860 points")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 5, Lena, 815 points")).toBeOnTheScreen();
	});

	test("the label is a bare number without a unit", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} />);
		expect(screen.getByLabelText("Rank 1, Ngaio, 1,240")).toBeOnTheScreen();
	});

	test("ties share a rank, are announced tied, and the next rank skips", async () => {
		await renderWithProviders(
			<Leaderboard
				data={[
					{ id: "a", name: "A", value: 10 },
					{ id: "b", name: "B", value: 8 },
					{ id: "c", name: "C", value: 8 },
					{ id: "d", name: "D", value: 5 },
				]}
				podium="none"
				unit="points"
			/>
		);
		expect(screen.getByLabelText("Rank 2, tied, B, 8 points")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 2, tied, C, 8 points")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 4, D, 5 points")).toBeOnTheScreen();
	});

	test("order asc ranks the smallest first", async () => {
		await renderWithProviders(
			<Leaderboard
				data={[
					{ id: "slow", name: "Slow", value: 90 },
					{ id: "fast", name: "Fast", value: 60 },
				]}
				order="asc"
				unit="seconds"
			/>
		);
		expect(screen.getByLabelText("Rank 1, Fast, 60 seconds")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 2, Slow, 90 seconds")).toBeOnTheScreen();
	});

	test("formatValue changes the drawn and spoken value", async () => {
		await renderWithProviders(
			<Leaderboard data={[{ id: "a", name: "A", value: 65 }]} formatValue={(v) => `${v}s!`} unit="lap" />
		);
		expect(screen.getByLabelText("Rank 1, A, 65s! lap")).toBeOnTheScreen();
		expect(screen.getByText("65s!")).toBeOnTheScreen();
	});

	test("subtitle and movement are spoken in the same sentence", async () => {
		await renderWithProviders(
			<Leaderboard
				data={[
					{ id: "a", name: "A", value: 10, subtitle: "Team Kiwi", change: 3 },
					{ id: "b", name: "B", value: 9, change: -1 },
					{ id: "c", name: "C", value: 8, change: 0 },
					{ id: "d", name: "D", value: 7 },
				]}
				podium="none"
				unit="points"
			/>
		);
		expect(screen.getByLabelText("Rank 1, A, Team Kiwi, 10 points, up 3 places")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 2, B, 9 points, down 1 place")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 3, C, 8 points, no change")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 4, D, 7 points")).toBeOnTheScreen();
	});

	test("an empty board shows the default line, and emptyText replaces it", async () => {
		const view = await renderWithProviders(<Leaderboard data={[]} />);
		expect(screen.getByText("No entries yet")).toBeOnTheScreen();
		await view.rerender(<Leaderboard data={[]} emptyText="Nobody has scored" />);
		expect(screen.getByText("Nobody has scored")).toBeOnTheScreen();
		expect(screen.queryByText("No entries yet")).not.toBeOnTheScreen();
	});

	test("a podium needs three entries on show; fewer is all rows", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES.slice(0, 2)} testID="board" />);
		expect(screen.queryByTestId("board-podium")).not.toBeOnTheScreen();
		expect(screen.getByTestId("board-row-ngaio")).toBeOnTheScreen();
	});

	test("the top three stand on the podium and the rest are rows, in either style", async () => {
		const view = await renderWithProviders(<Leaderboard data={ENTRIES} podium="bars" testID="board" />);
		expect(screen.getByTestId("board-podium")).toBeOnTheScreen();
		expect(screen.getByTestId("board-podium-place-1")).toBeOnTheScreen();
		expect(screen.getByTestId("board-podium-place-3")).toBeOnTheScreen();
		expect(screen.getByTestId("board-row-rawiri")).toBeOnTheScreen();
		expect(screen.queryByTestId("board-row-ngaio")).not.toBeOnTheScreen();

		await view.rerender(<Leaderboard data={ENTRIES} podium="cards" testID="board" />);
		expect(screen.getByTestId("board-podium-place-2")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 1, Ngaio, 1,240")).toBeOnTheScreen();
	});

	test("podium none draws every place as a row", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} podium="none" testID="board" />);
		expect(screen.queryByTestId("board-podium")).not.toBeOnTheScreen();
		expect(screen.getByTestId("board-row-ngaio")).toBeOnTheScreen();
	});

	test("limit counts the podium", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} limit={4} testID="board" />);
		expect(screen.getByLabelText("Rank 4, Rawiri, 860")).toBeOnTheScreen();
		expect(screen.queryByLabelText("Rank 5, Lena, 815")).not.toBeOnTheScreen();
	});

	test("a highlight cut by limit is pinned with its true rank", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} highlightId="lena" limit={3} testID="board" />);
		expect(screen.getByTestId("board-pinned")).toBeOnTheScreen();
		expect(screen.getByLabelText("Rank 5, Lena, 815")).toBeOnTheScreen();
		expect(screen.queryByLabelText("Rank 4, Rawiri, 860")).not.toBeOnTheScreen();
	});

	test("a highlight already on show is not pinned twice", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} highlightId="rawiri" limit={4} testID="board" />);
		expect(screen.queryByTestId("board-pinned")).not.toBeOnTheScreen();
		expect(screen.getAllByLabelText("Rank 4, Rawiri, 860")).toHaveLength(1);
	});

	test("the separator before a pinned row is hidden from assistive technology", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} highlightId="lena" limit={3} />);
		expect(screen.getByText("…", { includeHiddenElements: true })).toBeOnTheScreen();
		expect(screen.queryByText("…")).not.toBeOnTheScreen();
	});

	test("renderMedia receives the entry and its rank", async () => {
		const renderMedia = jest.fn((entry: LeaderboardEntry, rank: number) => <Text>{`media-${entry.id}-${rank}`}</Text>);
		await renderWithProviders(<Leaderboard data={ENTRIES} renderMedia={renderMedia} />);
		expect(screen.getByText("media-ngaio-1")).toBeOnTheScreen();
		expect(screen.getByText("media-lena-5")).toBeOnTheScreen();
		expect(renderMedia).toHaveBeenCalledWith(expect.objectContaining({ id: "ngaio" }), 1);
	});

	test("without onPressEntry no place is a button", async () => {
		await renderWithProviders(<Leaderboard data={ENTRIES} />);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
	});

	test("onPressEntry makes every place a button and reports the entry and rank", async () => {
		const onPressEntry = jest.fn();
		await renderWithProviders(<Leaderboard data={ENTRIES} onPressEntry={onPressEntry} unit="points" />);
		expect(screen.getAllByRole("button")).toHaveLength(5);

		await fireEvent(screen.getByRole("button", { name: "Rank 1, Ngaio, 1,240 points" }), "accessibilityTap");
		expect(onPressEntry).toHaveBeenLastCalledWith(expect.objectContaining({ id: "ngaio", name: "Ngaio" }), 1);

		await fireEvent(screen.getByRole("button", { name: "Rank 5, Lena, 815 points" }), "accessibilityTap");
		expect(onPressEntry).toHaveBeenLastCalledWith(expect.objectContaining({ id: "lena" }), 5);
		expect(onPressEntry).toHaveBeenCalledTimes(2);
	});

	test("cards podium places are buttons with onPressEntry", async () => {
		const onPressEntry = jest.fn();
		await renderWithProviders(<Leaderboard data={ENTRIES} onPressEntry={onPressEntry} podium="cards" />);
		await fireEvent(screen.getByRole("button", { name: "Rank 2, Mihi, 1,105" }), "accessibilityTap");
		expect(onPressEntry).toHaveBeenCalledWith(expect.objectContaining({ id: "mihi" }), 2);
	});
});

describe("Leaderboard parts", () => {
	const originalError = console.error;
	beforeEach(() => {
		console.error = () => undefined;
	});
	afterEach(() => {
		console.error = originalError;
	});

	test("a Row outside a Leaderboard throws its documented error", async () => {
		const ranked: RankedEntry = { entry: { id: "a", name: "A", value: 1 }, rank: 1, isTied: false };
		await expect(renderWithProviders(<LeaderboardRow ranked={ranked} />)).rejects.toThrow(
			"<Leaderboard.Row> must be rendered inside a <Leaderboard>."
		);
	});
});
