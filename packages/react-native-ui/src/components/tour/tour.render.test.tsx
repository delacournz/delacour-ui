import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { Tour, type TourProps } from "./tour";
import { useTour } from "./tour.context";

function StartButton(): ReactElement {
	const tour = useTour();
	return <Button onPress={() => tour.start()}>Start tour</Button>;
}

function StatusReader(): ReactElement {
	const tour = useTour();
	return <Button onPress={() => tour.goTo(3)}>{`Step ${tour.step} index ${tour.index} of ${tour.total}`}</Button>;
}

function Steps(props: Omit<TourProps, "children">): ReactElement {
	return (
		<Tour testID="tour" {...props}>
			<StartButton />
			<StatusReader />
			<Tour.Step description="Find anything." order={1} title="Search">
				<Button>Search</Button>
			</Tour.Step>
			<Tour.Step description="Start writing." order={2} title="New note">
				<Button>Compose</Button>
			</Tour.Step>
			<Tour.Step order={3} title="Profile">
				<Button>Account</Button>
			</Tour.Step>
		</Tour>
	);
}

const press = (testID: string) => fireEvent(screen.getByTestId(testID), "accessibilityTap");

// Each Tour.Step is measured with measureInWindow, which never resolves under Jest, so the hole and
// card placement are never computed here. The card, its text and its actions still mount as soon as
// the tour is open, so these tests drive the start/next/back/skip/finish flows through them and
// leave hole geometry to the pure resolver suite and the playground.
describe("Tour", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test("shows no card while closed", async () => {
		await renderWithProviders(<Steps />);
		expect(screen.queryByTestId("tour-card")).not.toBeOnTheScreen();
	});

	test("defaultOpen shows the first step announced as a header with position, title and description", async () => {
		await renderWithProviders(<Steps defaultOpen />);
		expect(screen.getByTestId("tour-card")).toBeOnTheScreen();
		expect(screen.getByRole("header", { name: "Step 1 of 3. Search. Find anything." })).toBeOnTheScreen();
		expect(screen.getByText("1 of 3")).toBeOnTheScreen();
		expect(screen.getByText("Find anything.")).toBeOnTheScreen();
	});

	test("useTour().start opens the tour from inside", async () => {
		await renderWithProviders(<Steps />);
		await fireEvent(screen.getByRole("button", { name: "Start tour" }), "accessibilityTap");
		expect(screen.getByRole("header", { name: /^Step 1 of 3/ })).toBeOnTheScreen();
	});

	test("Next and Back move through the steps, Back is absent on the first", async () => {
		const onStepChange = jest.fn();
		await renderWithProviders(<Steps defaultOpen onStepChange={onStepChange} />);
		expect(screen.queryByTestId("tour-back")).not.toBeOnTheScreen();

		await press("tour-next");
		expect(screen.getByRole("header", { name: "Step 2 of 3. New note. Start writing." })).toBeOnTheScreen();
		expect(screen.getByText("2 of 3")).toBeOnTheScreen();
		expect(onStepChange).toHaveBeenLastCalledWith(2);

		await press("tour-back");
		expect(screen.getByRole("header", { name: /^Step 1 of 3/ })).toBeOnTheScreen();
		expect(onStepChange).toHaveBeenLastCalledWith(1);
	});

	test("the last step offers Done instead of Next and no Skip, and Done finishes", async () => {
		const onFinish = jest.fn();
		const onSkip = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Steps defaultOpen defaultStep={3} onFinish={onFinish} onOpenChange={onOpenChange} onSkip={onSkip} />
		);
		expect(screen.getByRole("button", { name: "Done" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Next" })).not.toBeOnTheScreen();
		expect(screen.queryByTestId("tour-skip")).not.toBeOnTheScreen();

		await press("tour-next");
		expect(onFinish).toHaveBeenCalledTimes(1);
		expect(onSkip).not.toHaveBeenCalled();
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.queryByTestId("tour-card")).not.toBeOnTheScreen();
	});

	test("Skip closes the tour and calls onSkip, not onFinish", async () => {
		const onFinish = jest.fn();
		const onSkip = jest.fn();
		await renderWithProviders(<Steps defaultOpen onFinish={onFinish} onSkip={onSkip} />);
		await press("tour-skip");
		expect(onSkip).toHaveBeenCalledTimes(1);
		expect(onFinish).not.toHaveBeenCalled();
		expect(screen.queryByTestId("tour-card")).not.toBeOnTheScreen();
	});

	test("hasSkip={false} and hasProgress={false} drop Skip and the visible position", async () => {
		await renderWithProviders(<Steps defaultOpen hasProgress={false} hasSkip={false} />);
		expect(screen.queryByTestId("tour-skip")).not.toBeOnTheScreen();
		expect(screen.queryByText("1 of 3")).not.toBeOnTheScreen();
		expect(screen.getByRole("header", { name: /^Step 1 of 3/ })).toBeOnTheScreen();
	});

	test("labels replace the action text and the announcement", async () => {
		await renderWithProviders(
			<Steps
				defaultOpen
				labels={{ next: "Continue", skip: "Not now", announcement: (current, total) => `Stop ${current}/${total}` }}
			/>
		);
		expect(screen.getByRole("button", { name: "Continue" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Not now" })).toBeOnTheScreen();
		expect(screen.getByRole("header", { name: /^Stop 1\/3\. Search\./ })).toBeOnTheScreen();
	});

	test("defaultStep opens on that step", async () => {
		await renderWithProviders(<Steps defaultOpen defaultStep={2} />);
		expect(screen.getByRole("header", { name: /^Step 2 of 3\. New note/ })).toBeOnTheScreen();
	});

	test("uncontrolled open: onOpenChange reports start and skip", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Steps onOpenChange={onOpenChange} />);
		await fireEvent(screen.getByRole("button", { name: "Start tour" }), "accessibilityTap");
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		await press("tour-skip");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("controlled isOpen: Skip asks, but the card stays until the parent rerenders", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Steps isOpen onOpenChange={onOpenChange} />);
		await press("tour-skip");
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.getByTestId("tour-card")).toBeOnTheScreen();

		await rerender(<Steps isOpen={false} onOpenChange={onOpenChange} />);
		expect(screen.queryByTestId("tour-card")).not.toBeOnTheScreen();
	});

	test("controlled step: Next asks, the card moves only when step changes", async () => {
		const onStepChange = jest.fn();
		const { rerender } = await renderWithProviders(<Steps isOpen onStepChange={onStepChange} step={1} />);
		await press("tour-next");
		expect(onStepChange).toHaveBeenCalledWith(2);
		expect(screen.getByRole("header", { name: /^Step 1 of 3/ })).toBeOnTheScreen();

		await rerender(<Steps isOpen onStepChange={onStepChange} step={2} />);
		expect(screen.getByRole("header", { name: /^Step 2 of 3/ })).toBeOnTheScreen();
	});

	test("useTour exposes step, index and total, and goTo jumps to a registered order", async () => {
		await renderWithProviders(<Steps />);
		expect(screen.getByRole("button", { name: "Step 1 index 0 of 3" })).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "Step 1 index 0 of 3" }), "accessibilityTap");
		expect(screen.getByRole("button", { name: "Step 3 index 2 of 3" })).toBeOnTheScreen();
	});

	test("a non-interactive tour hides the app beneath from assistive technology", async () => {
		await renderWithProviders(<Steps />);
		expect(screen.getByRole("button", { name: "Search" })).toBeOnTheScreen();
		await fireEvent(screen.getByRole("button", { name: "Start tour" }), "accessibilityTap");
		expect(screen.queryByRole("button", { name: "Search" })).not.toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Next" })).toBeOnTheScreen();
	});

	test("an interactive tour keeps the app reachable", async () => {
		await renderWithProviders(<Steps defaultOpen isInteractive />);
		expect(screen.getByRole("button", { name: "Search" })).toBeOnTheScreen();
	});

	test("an interactive tour draws its card inside the root", async () => {
		await renderWithProviders(<Steps defaultOpen isInteractive />);
		expect(screen.getByTestId("tour-card")).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Next" })).toBeOnTheScreen();
	});

	test("Tour.Step outside a Tour throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(
				renderWithProviders(
					<Tour.Step order={1} title="Lonely">
						<Button>Orphan</Button>
					</Tour.Step>
				)
			).rejects.toThrow("Tour.Step must be rendered inside a <Tour>.");
		} finally {
			spy.mockRestore();
		}
	});

	test("useTour outside a Tour throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(renderWithProviders(<StartButton />)).rejects.toThrow("useTour must be called inside a <Tour>.");
		} finally {
			spy.mockRestore();
		}
	});
});
