import { useBottomSheetInternal } from "@delacour/react-native-bottom-sheet";
import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Fragment, type ReactElement, type ReactNode, useState } from "react";
import { BackHandler } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { Overlay, OverlayProvider } from "../overlay";
import { TELEPORT_INLINE } from "../overlay/overlay-teleport";
import { Text } from "../text";
import { BottomSheet, type BottomSheetProps } from "./bottom-sheet";
import { teleportsToRoot } from "./bottom-sheet-portal";
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

/** Runs `body` as on a device, where teleport moves the sheet out of the app's view. */
async function withTeleportOutOfTree(body: () => Promise<void>): Promise<void> {
	const flags = globalThis as unknown as Record<symbol, unknown>;
	const previous = flags[TELEPORT_INLINE];
	delete flags[TELEPORT_INLINE];
	try {
		await body();
	} finally {
		flags[TELEPORT_INLINE] = previous;
	}
}

describe("BottomSheetProvider and screen readers", () => {
	function App({ overlay, inline }: { overlay: boolean; inline?: boolean }): ReactElement {
		return (
			<>
				<Text>app behind</Text>
				<BottomSheet defaultOpen>
					<BottomSheet.Portal inline={inline}>
						{overlay ? <BottomSheet.Overlay /> : null}
						<BottomSheet.Container>
							<BottomSheet.Content>
								<BottomSheet.Title>Sheet</BottomSheet.Title>
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</>
		);
	}

	test("an open sheet with a scrim hides the app when teleport moves it out of the app", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<App overlay />, { wrapper: Providers });
			expect(screen.queryByText("app behind")).toBeNull();
			expect(screen.getByText("app behind", { includeHiddenElements: true })).toBeOnTheScreen();
		});
	});

	test("a modal sheet with no scrim still hides the app", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<App overlay={false} />, { wrapper: Providers });
			expect(screen.queryByText("app behind")).toBeNull();
		});
	});

	test("a touch-through overlay leaves the app reachable and the panel non-modal", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(
				<>
					<Text>app behind</Text>
					<BottomSheet defaultOpen>
						<BottomSheet.Portal>
							<BottomSheet.Overlay enableTouchThrough />
							<BottomSheet.Container testID="tt-panel">
								<BottomSheet.Content>
									<BottomSheet.Title>Sheet</BottomSheet.Title>
								</BottomSheet.Content>
							</BottomSheet.Container>
						</BottomSheet.Portal>
					</BottomSheet>
				</>,
				{ wrapper: Providers }
			);
			expect(screen.getByText("app behind")).toBeOnTheScreen();
			expect(screen.getByTestId("tt-panel")).toHaveProp("accessibilityViewIsModal", false);
		});
	});

	test("a non-modal sheet leaves the app reachable", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(
				<>
					<Text>app behind</Text>
					<BottomSheet defaultOpen modal={false}>
						<BottomSheet.Portal>
							<BottomSheet.Overlay />
							<BottomSheet.Container>
								<BottomSheet.Content>
									<BottomSheet.Title>Sheet</BottomSheet.Title>
								</BottomSheet.Content>
							</BottomSheet.Container>
						</BottomSheet.Portal>
					</BottomSheet>
				</>,
				{ wrapper: Providers }
			);
			expect(screen.getByText("app behind")).toBeOnTheScreen();
		});
	});

	test("an inline sheet leaves the app reachable", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<App inline overlay />, { wrapper: Providers });
			expect(screen.getByText("app behind")).toBeOnTheScreen();
		});
	});

	test("only a portal teleported to the root host counts", () => {
		expect(teleportsToRoot({ inline: false, hostName: undefined, nearest: "root" })).toBe(true);
		expect(teleportsToRoot({ inline: true, hostName: undefined, nearest: "root" })).toBe(false);
		expect(teleportsToRoot({ inline: false, hostName: undefined, nearest: null })).toBe(false);
		expect(teleportsToRoot({ inline: false, hostName: "modal", nearest: "root" })).toBe(false);
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

describe("BottomSheet modal accessibility", () => {
	function Sheet(props: Omit<BottomSheetProps, "children"> & { overlay?: boolean }): ReactElement {
		const { overlay = false, ...rest } = props;
		return (
			<BottomSheet {...rest}>
				<BottomSheet.Trigger asChild>
					<Button>Filters</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					{overlay ? <BottomSheet.Overlay /> : null}
					<BottomSheet.Container testID="panel">
						<BottomSheet.Content>
							<BottomSheet.Title>Filter results</BottomSheet.Title>
							<Text>A row inside the sheet</Text>
						</BottomSheet.Content>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		);
	}

	test("the panel is modal while open, with or without a scrim", async () => {
		await renderWithProviders(<Sheet defaultOpen />, { wrapper: Providers });
		expect(screen.getByTestId("panel")).toHaveProp("accessibilityViewIsModal", true);
	});

	test("a non-modal sheet's panel is not modal and does not answer escape", async () => {
		await renderWithProviders(<Sheet defaultOpen modal={false} />, { wrapper: Providers });
		const panel = screen.getByTestId("panel");
		expect(panel).toHaveProp("accessibilityViewIsModal", false);
		expect(panel.props.onAccessibilityEscape).toBeUndefined();
	});

	test("the escape gesture on the panel closes a dismissible sheet", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Sheet defaultOpen onOpenChange={onOpenChange} />, { wrapper: Providers });
		await fireEvent(screen.getByTestId("panel"), "accessibilityEscape");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("a sheet that cannot be pan-dismissed ignores escape on the panel and the handle", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Sheet defaultOpen enablePanDownToClose={false} onOpenChange={onOpenChange} />, {
			wrapper: Providers,
		});
		expect(screen.getByTestId("panel").props.onAccessibilityEscape).toBeUndefined();
		expect(screen.getByTestId("panel")).toHaveProp("accessibilityViewIsModal", true);
		await fireEvent(screen.getByRole("adjustable", { name: "Bottom sheet" }), "accessibilityEscape");
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("the title and the trigger hand their nodes to the engine for focus", async () => {
		let nodes: { title: unknown; trigger: unknown } | null = null;
		function Probe(): ReactElement {
			const { accessibilityRefs } = useBottomSheetInternal();
			nodes = { title: accessibilityRefs.title.current, trigger: accessibilityRefs.trigger.current };
			return <Text>probe</Text>;
		}
		function WithProbe(): ReactElement {
			const [, force] = useState(0);
			return (
				<BottomSheet defaultOpen>
					<BottomSheet.Trigger asChild>
						<Button onPress={() => force((n) => n + 1)}>Filters</Button>
					</BottomSheet.Trigger>
					<BottomSheet.Portal>
						<BottomSheet.Container>
							<BottomSheet.Content>
								<BottomSheet.Title>Filter results</BottomSheet.Title>
								<Probe />
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			);
		}
		await renderWithProviders(<WithProbe />, { wrapper: Providers });
		await press("Filters");
		expect((nodes as { title: unknown; trigger: unknown } | null)?.title).not.toBeNull();
		expect((nodes as { title: unknown; trigger: unknown } | null)?.trigger).not.toBeNull();
	});

	test("a closed sheet's panel is not modal", async () => {
		await renderWithProviders(<Sheet />, { wrapper: Providers });
		expect(screen.queryByTestId("panel")).not.toBeOnTheScreen();
	});

	test("the trigger reports expanded while the sheet is open", async () => {
		await renderWithProviders(<Sheet />, { wrapper: Providers });
		expect(screen.getByRole("button", { name: "Filters" })).toHaveProp("accessibilityState", {
			busy: false,
			disabled: false,
			expanded: false,
		});
		await press("Filters");
		expect(screen.getByRole("button", { name: "Filters" })).toBeExpanded();
	});

	test("the second sheet is the only modal one while two are open", async () => {
		await renderWithProviders(
			<>
				<Sheet defaultOpen />
				<BottomSheet defaultOpen>
					<BottomSheet.Portal>
						<BottomSheet.Container testID="top-panel">
							<BottomSheet.Content>
								<BottomSheet.Title>Top</BottomSheet.Title>
							</BottomSheet.Content>
						</BottomSheet.Container>
					</BottomSheet.Portal>
				</BottomSheet>
			</>,
			{ wrapper: Providers }
		);
		expect(screen.getByTestId("top-panel")).toHaveProp("accessibilityViewIsModal", true);
		expect(screen.getByTestId("panel")).toHaveProp("accessibilityViewIsModal", false);
	});
});
