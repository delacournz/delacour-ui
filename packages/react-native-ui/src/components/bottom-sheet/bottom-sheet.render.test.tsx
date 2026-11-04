import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Fragment, type ReactElement, type ReactNode } from "react";
import { BackHandler } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { Overlay, OverlayProvider } from "../overlay";
import { Text } from "../text";
import { BottomSheet, type BottomSheetProps } from "./bottom-sheet";
import { BottomSheetProvider } from "./bottom-sheet-provider";

function Providers({ children }: { children: ReactNode }): ReactElement {
	return (
		<OverlayProvider>
			<BottomSheetProvider>{children}</BottomSheetProvider>
		</OverlayProvider>
	);
}

function FilterSheet(props: Omit<BottomSheetProps, "children">): ReactElement {
	return (
		<BottomSheet {...props}>
			<BottomSheet.Trigger asChild>
				<Button>Filters</Button>
			</BottomSheet.Trigger>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container>
					<BottomSheet.Content>
						<BottomSheet.Close />
						<BottomSheet.Title>Filter results</BottomSheet.Title>
						<BottomSheet.Description>Narrow the list down.</BottomSheet.Description>
					</BottomSheet.Content>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}

const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");

/*
 * Not reachable under Jest: the pan-down-to-close gesture, snap-point settling and the keyboard
 * lift all run on the UI thread from shared values, so `onClose` (which fires on the settle at the
 * closed height), `onIndexChange` and a scrim press (the scrim takes touches only while the animated
 * index is open, and Jest's index stays closed) are not asserted here. Opening and closing through the
 * trigger and Close go through `isOpen`, which is plain React state and is covered.
 */
describe("BottomSheet", () => {
	test("renders nothing of the portal until opened", async () => {
		await renderWithProviders(<FilterSheet />, { wrapper: Providers });
		expect(screen.getByRole("button", { name: "Filters" })).toBeOnTheScreen();
		expect(screen.queryByRole("header", { name: "Filter results" })).not.toBeOnTheScreen();
	});

	test("the trigger opens it and Close shuts it, reporting both", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<FilterSheet onOpenChange={onOpenChange} />, { wrapper: Providers });

		await press("Filters");
		expect(screen.getByRole("header", { name: "Filter results" })).toBeOnTheScreen();
		expect(screen.getByText("Narrow the list down.")).toBeOnTheScreen();
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		await press("Close");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("defaultOpen starts it open", async () => {
		await renderWithProviders(<FilterSheet defaultOpen />, { wrapper: Providers });
		expect(screen.getByRole("header", { name: "Filter results" })).toBeOnTheScreen();
	});

	test("controlled: isOpen decides, the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<FilterSheet isOpen={false} onOpenChange={onOpenChange} />, {
			wrapper: Providers,
		});
		await press("Filters");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("header", { name: "Filter results" })).not.toBeOnTheScreen();

		await rerender(<FilterSheet isOpen onOpenChange={onOpenChange} />);
		expect(screen.getByRole("header", { name: "Filter results" })).toBeOnTheScreen();

		await press("Close");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.getByRole("header", { name: "Filter results" })).toBeOnTheScreen();
	});

	test("the trigger and Close run the caller's own onPress", async () => {
		const onTrigger = jest.fn();
		const onClose = jest.fn();
		await renderWithProviders(
			<BottomSheet>
				<BottomSheet.Trigger onPress={onTrigger}>
					<Text>Open</Text>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Container>
						<BottomSheet.Content>
							<BottomSheet.Close onPress={onClose} />
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>,
			{ wrapper: Providers }
		);
		await press("Open");
		expect(onTrigger).toHaveBeenCalledTimes(1);
		await press("Close");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	test("Close is named 'Close' unless relabelled", async () => {
		await renderWithProviders(
			<BottomSheet defaultOpen>
				<BottomSheet.Portal>
					<BottomSheet.Container>
						<BottomSheet.Content>
							<BottomSheet.Close accessibilityLabel="Dismiss filters" />
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>,
			{ wrapper: Providers }
		);
		expect(screen.getByRole("button", { name: "Dismiss filters" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Close" })).not.toBeOnTheScreen();
	});

	test("the handle is the sheet's one adjustable element", async () => {
		await renderWithProviders(<FilterSheet defaultOpen />, { wrapper: Providers });
		expect(screen.getByRole("adjustable", { name: "Bottom sheet" })).toBeOnTheScreen();
	});

	test("an escape gesture on the handle closes the sheet", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<FilterSheet defaultOpen onOpenChange={onOpenChange} />, { wrapper: Providers });
		await fireEvent(screen.getByRole("adjustable", { name: "Bottom sheet" }), "accessibilityEscape");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("the title labels the panel", async () => {
		await renderWithProviders(<FilterSheet defaultOpen />, { wrapper: Providers });
		expect(screen.getByRole("header", { name: "Filter results" })).toHaveTextContent("Filter results");
	});

	test("an overlay with pressBehavior none is not interactive", async () => {
		await renderWithProviders(
			<BottomSheet defaultOpen>
				<BottomSheet.Portal>
					<BottomSheet.Overlay accessibilityLabel="Scrim" pressBehavior="none" />
					<BottomSheet.Container>
						<BottomSheet.Content>
							<BottomSheet.Title>Locked</BottomSheet.Title>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>,
			{ wrapper: Providers }
		);
		expect(screen.queryByRole("button", { name: "Scrim", includeHiddenElements: true })).not.toBeOnTheScreen();
	});

	describe("outside its root", () => {
		let spy: ReturnType<typeof jest.spyOn>;
		beforeEach(() => {
			spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		});
		afterEach(() => {
			spy.mockRestore();
		});

		test("Trigger throws", async () => {
			await expect(
				renderWithProviders(
					<BottomSheet.Trigger>
						<Text>Open</Text>
					</BottomSheet.Trigger>,
					{ wrapper: Providers }
				)
			).rejects.toThrow("outside <BottomSheet>");
		});

		test("Close throws", async () => {
			await expect(renderWithProviders(<BottomSheet.Close />, { wrapper: Providers })).rejects.toThrow(
				"outside <BottomSheet>"
			);
		});
	});
});

describe("BottomSheet.Container", () => {
	test("a Handle inside a fragment counts as written, so no second one is added", async () => {
		const showHandle = true;
		await renderWithProviders(
			<BottomSheet defaultOpen>
				<BottomSheet.Portal>
					<BottomSheet.Container>
						<Fragment key="surface">{showHandle && <BottomSheet.Handle />}</Fragment>
						<BottomSheet.Content>
							<BottomSheet.Title>One handle</BottomSheet.Title>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>,
			{ wrapper: Providers }
		);
		expect(screen.getAllByRole("adjustable")).toHaveLength(1);
	});
});

describe("BottomSheet and Android back", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	function countBackSubscriptions(): { count: () => number } {
		let count = 0;
		jest.spyOn(BackHandler, "addEventListener").mockImplementation(() => {
			count++;
			return { remove: () => undefined };
		});
		return { count: () => count };
	}

	test("an open sheet answers back on its own", async () => {
		const subscriptions = countBackSubscriptions();
		await renderWithProviders(<FilterSheet defaultOpen />, { wrapper: Providers });
		expect(subscriptions.count()).toBeGreaterThan(0);
	});

	test("a parent render with a new inline onOpenChange does not re-subscribe", async () => {
		const subscriptions = countBackSubscriptions();
		const { rerender } = await renderWithProviders(<FilterSheet defaultOpen onOpenChange={() => undefined} />, {
			wrapper: Providers,
		});
		const before = subscriptions.count();
		await rerender(<FilterSheet defaultOpen onOpenChange={() => undefined} />);
		expect(subscriptions.count()).toBe(before);
	});

	test("a sheet under an open modal overlay leaves back to the overlay", async () => {
		const subscriptions = countBackSubscriptions();
		await renderWithProviders(
			<>
				<FilterSheet defaultOpen />
				<Overlay.Portal layer="modal">
					<Text>dialog</Text>
				</Overlay.Portal>
			</>,
			{ wrapper: Providers }
		);
		expect(screen.getByText("dialog")).toBeOnTheScreen();
		expect(subscriptions.count()).toBe(0);
	});
});
