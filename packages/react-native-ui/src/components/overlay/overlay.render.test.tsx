import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { type ComponentRef, type ReactElement, type ReactNode, type RefObject, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler, Text, View } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { act, fireEvent, renderHook, renderWithProviders, screen, waitFor } from "../../test/render";
import { Overlay, OverlayProvider } from "./overlay";
import { useOptionalOverlay } from "./overlay.context";
import { OVERLAY_MOTION } from "./overlay.variants";
import { type OverlayLayer, zIndexOfOverlay } from "./overlay-registry";
import { TELEPORT_INLINE } from "./overlay-teleport";
import { useOverlayBackHandler } from "./use-overlay-back-handler";
import { useOverlayModalAccessibility } from "./use-overlay-modal-accessibility";
import { useOverlayPresence } from "./use-overlay-presence";

jest.mock("react-native-reanimated", () => {
	const actual = jest.requireActual<typeof import("react-native-reanimated")>("react-native-reanimated");
	return { ...actual, withTiming: jest.fn(actual.withTiming) };
});

const timing = jest.mocked(withTiming);

type DemoProps = {
	name: string;
	layer?: OverlayLayer;
	defaultOpen?: boolean;
	onDismiss?: () => void;
	onBack?: () => void;
	onExited?: () => void;
	isInline?: boolean;
	hostName?: string;
};

function Demo({
	name,
	layer = "modal",
	defaultOpen = true,
	onDismiss,
	onBack,
	onExited,
	isInline,
	hostName,
}: DemoProps): ReactElement | null {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const { isPresent, phase, progress } = useOverlayPresence({ isOpen, enterMs: 1, exitMs: 1, onExited });
	const close = () => {
		onDismiss?.();
		setIsOpen(false);
	};
	useOverlayBackHandler({
		id: name,
		isEnabled: isPresent,
		onBack: () => {
			onBack?.();
			setIsOpen(false);
		},
	});

	return (
		<>
			<Text onPress={() => setIsOpen(true)}>{`open ${name}`}</Text>
			{isPresent ? (
				<Overlay.Portal hostName={hostName} id={name} isExiting={phase === "exiting"} isInline={isInline} layer={layer}>
					<Overlay.Scrim onDismiss={close} progress={progress} testID={`${name}-scrim`} />
					<View testID={`${name}-panel`}>
						<Text>{`${name} panel`}</Text>
					</View>
				</Overlay.Portal>
			) : null}
		</>
	);
}

function Provider({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

function ZIndexProbe({ id }: { id: string }): ReactElement {
	const registry = useOptionalOverlay();
	const entry = registry?.state.open.find((candidate) => candidate.id === id);
	const zIndex = registry === null ? 0 : zIndexOfOverlay(registry.state, id);
	return <Text testID={`probe-${id}`}>{entry === undefined ? "absent" : `${entry.layer}:${zIndex}`}</Text>;
}

const scrim = (name: string) => screen.getByTestId(`${name}-scrim`, { includeHiddenElements: true });

/** The portal frame: the parent of the overlay's panel. */
function frame(name: string) {
	const node = screen.getByTestId(`${name}-panel`, { includeHiddenElements: true }).parent;
	if (node === null) throw new Error("no portal frame");
	return node;
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe("Overlay", () => {
	test("the provider renders its children", async () => {
		await renderWithProviders(
			<OverlayProvider>
				<Text>app</Text>
			</OverlayProvider>
		);
		expect(screen.getByText("app")).toBeOnTheScreen();
	});

	test("a portal mounts its children under the provider", async () => {
		await renderWithProviders(<Demo name="one" />, { wrapper: Provider });
		expect(screen.getByText("one panel")).toBeOnTheScreen();
	});

	test("a portal with no provider falls back to drawing its children inline", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderWithProviders(<Demo name="bare" />);
		expect(screen.getByText("bare panel")).toBeOnTheScreen();
		warn.mockRestore();
	});

	test("an inline portal draws its children where they are written", async () => {
		await renderWithProviders(
			<Overlay.Portal isInline layer="anchored">
				<Text>inline</Text>
			</Overlay.Portal>,
			{ wrapper: Provider }
		);
		expect(screen.getByText("inline")).toBeOnTheScreen();
	});

	test("a provider nested in another still renders its children", async () => {
		await renderWithProviders(
			<OverlayProvider>
				<Demo name="nested" />
			</OverlayProvider>,
			{ wrapper: Provider }
		);
		expect(screen.getByText("nested panel")).toBeOnTheScreen();
	});

	test("the portal registers its overlay in its layer while mounted and clears it on unmount", async () => {
		function Harness(): ReactElement {
			const [isMounted, setIsMounted] = useState(true);
			return (
				<>
					<Text onPress={() => setIsMounted(false)}>unmount</Text>
					{isMounted ? (
						<Overlay.Portal id="reg" layer="anchored">
							<Text>content</Text>
						</Overlay.Portal>
					) : null}
					<ZIndexProbe id="reg" />
				</>
			);
		}
		await renderWithProviders(<Harness />, { wrapper: Provider });
		expect(screen.getByTestId("probe-reg")).toHaveTextContent("anchored:2001");

		await fireEvent.press(screen.getByText("unmount"));
		expect(screen.getByTestId("probe-reg")).toHaveTextContent("absent");
		expect(screen.queryByText("content")).not.toBeOnTheScreen();
	});

	test("an overlay opened later draws over an earlier one in the same layer", async () => {
		await renderWithProviders(
			<>
				<Demo name="first" />
				<Demo name="second" />
				<ZIndexProbe id="first" />
				<ZIndexProbe id="second" />
			</>,
			{ wrapper: Provider }
		);
		const zIndexOf = (name: string): number => Number(screen.getByTestId(`probe-${name}`).props.children.split(":")[1]);
		expect(zIndexOf("second")).toBeGreaterThan(zIndexOf("first"));
	});
});

/** Runs `body` as on a device, where teleport moves an overlay out of the app's view. */
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

/** The provider's app content `View`: the parent of a demo's trigger text, hidden or not. */
function appContent(name: string): { props: { accessibilityElementsHidden?: boolean } } {
	const parent = screen.getByText(`open ${name}`, { includeHiddenElements: true }).parent;
	if (parent === null) throw new Error(`No app content around the ${name} trigger`);
	return parent;
}

describe("OverlayProvider and screen readers", () => {
	test("the test kit marks teleport inline, so an open modal and the app stay reachable", async () => {
		await renderWithProviders(<Demo name="kit" />, { wrapper: Provider });
		expect(screen.getByTestId("kit-panel")).toBeOnTheScreen();
		expect(screen.getByText("open kit")).toBeOnTheScreen();
	});

	test("an open modal hides the app content when teleport moves it out of the app", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<Demo name="device" />, { wrapper: Provider });
			expect(screen.queryByText("open device")).toBeNull();
			expect(screen.getByText("open device", { includeHiddenElements: true })).toBeOnTheScreen();
		});
	});

	test("a closed modal leaves the app content reachable", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<Demo name="closed" defaultOpen={false} />, { wrapper: Provider });
			expect(screen.getByText("open closed")).toBeOnTheScreen();
		});
	});

	test("the app content is reachable again when onExited fires, so focus can return to the trigger", async () => {
		await withTeleportOutOfTree(async () => {
			const reachableAtExit: boolean[] = [];
			await renderWithProviders(
				<Demo name="exit" onExited={() => reachableAtExit.push(screen.queryByText("open exit") !== null)} />,
				{ wrapper: Provider }
			);
			expect(screen.queryByText("open exit")).toBeNull();

			await fireEvent.press(scrim("exit"));
			expect(screen.getByText("open exit")).toBeOnTheScreen();
			await waitFor(() => expect(reachableAtExit).toEqual([true]));
		});
	});

	test("a dialog under another dialog is hidden and only the top one is modal", async () => {
		await renderWithProviders(
			<>
				<Demo name="lower" />
				<Demo name="upper" />
			</>,
			{ wrapper: Provider }
		);
		expect(frame("lower").props.accessibilityElementsHidden).toBe(true);
		expect(frame("lower").props.importantForAccessibility).toBe("no-hide-descendants");
		expect(frame("lower").props.accessibilityViewIsModal).toBe(false);
		expect(frame("upper").props.accessibilityElementsHidden).toBe(false);
		expect(frame("upper").props.accessibilityViewIsModal).toBe(true);
	});

	test("the lower dialog is reachable again once the top one starts to exit", async () => {
		await renderWithProviders(
			<>
				<Demo name="lower" />
				<Demo name="upper" />
			</>,
			{ wrapper: Provider }
		);
		await fireEvent.press(scrim("upper"));
		expect(frame("lower").props.accessibilityElementsHidden).toBe(false);
		expect(frame("lower").props.accessibilityViewIsModal).toBe(true);
	});

	test("an inline modal does not hide the app content that holds it", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<Demo isInline name="dialog" />, { wrapper: Provider });
			expect(appContent("dialog").props.accessibilityElementsHidden).toBe(false);
			expect(frame("dialog").props.accessibilityViewIsModal).toBe(true);
		});
	});

	test("a modal in a custom host does not hide the app content", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<Demo hostName="sheet" name="dialog" />, { wrapper: Provider });
			expect(appContent("dialog").props.accessibilityElementsHidden).toBe(false);
		});
	});

	test("a teleported modal still hides the app content beside an inline one", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(
				<>
					<Demo isInline name="inline" />
					<Demo name="teleported" />
				</>,
				{ wrapper: Provider }
			);
			expect(appContent("teleported").props.accessibilityElementsHidden).toBe(true);
		});
	});

	test("a toast does not hide the app content", async () => {
		await withTeleportOutOfTree(async () => {
			await renderWithProviders(<Demo name="toast" layer="toast" />, { wrapper: Provider });
			expect(screen.getByText("open toast")).toBeOnTheScreen();
		});
	});
});

describe("Overlay.Scrim", () => {
	test("is hidden from assistive technology", async () => {
		await renderWithProviders(<Demo name="one" />, { wrapper: Provider });
		expect(screen.queryByTestId("one-scrim")).not.toBeOnTheScreen();
		expect(scrim("one")).toBeOnTheScreen();
		expect(scrim("one").props.accessible).toBe(false);
		expect(scrim("one").props.accessibilityElementsHidden).toBe(true);
	});

	test("a press calls onDismiss once", async () => {
		const onDismiss = jest.fn();
		await renderWithProviders(<Demo name="one" onDismiss={onDismiss} />, { wrapper: Provider });
		await fireEvent.press(scrim("one"));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	test("a press without onDismiss does nothing and the scrim still takes the touch", async () => {
		function BareScrim(): ReactElement {
			const progress = useSharedValue(1);
			return (
				<Overlay.Portal layer="modal">
					<Overlay.Scrim progress={progress} testID="bare-scrim" />
				</Overlay.Portal>
			);
		}
		await renderWithProviders(<BareScrim />, { wrapper: Provider });
		await fireEvent.press(screen.getByTestId("bare-scrim", { includeHiddenElements: true }));
		expect(screen.getByTestId("bare-scrim", { includeHiddenElements: true })).toBeOnTheScreen();
	});
});

describe("useOverlayPresence", () => {
	test("keeps the overlay mounted through its exit, then unmounts it and reports onExited", async () => {
		const onExited = jest.fn();
		await renderWithProviders(<Demo name="one" onExited={onExited} />, { wrapper: Provider });

		await fireEvent.press(scrim("one"));
		await waitFor(() => expect(screen.queryByText("one panel")).not.toBeOnTheScreen());
		expect(onExited).toHaveBeenCalledTimes(1);
	});

	test("starts closed when isOpen is false and mounts on open", async () => {
		await renderWithProviders(<Demo defaultOpen={false} name="one" />, { wrapper: Provider });
		expect(screen.queryByText("one panel")).not.toBeOnTheScreen();

		await fireEvent.press(screen.getByText("open one"));
		expect(screen.getByText("one panel")).toBeOnTheScreen();
	});
});

const FRAME_MS = 16;

/**
 * Re-renders the owner with a new inline callback every frame for most of the
 * animation, then lets the rest of the original duration run. The timing must
 * start once per transition, and the finish land once, on time, and call the
 * latest callback.
 */
async function rerenderEveryFrame(durationMs: number, rerender: (tick: number) => Promise<void>): Promise<void> {
	let elapsed = 0;
	let tick = 0;
	while (elapsed + FRAME_MS < durationMs) {
		await act(() => jest.advanceTimersByTime(FRAME_MS));
		elapsed += FRAME_MS;
		tick += 1;
		await rerender(tick);
	}
	await act(() => jest.advanceTimersByTime(durationMs - elapsed + FRAME_MS * 2));
}

describe("useOverlayPresence with an owner that re-renders every frame", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		timing.mockClear();
	});
	afterEach(() => {
		jest.useRealTimers();
	});

	test("starts one entrance timing and enters on time with a new inline onEntered", async () => {
		const entered: number[] = [];
		const { result, rerender } = await renderHook(
			({ tick }: { tick: number }) =>
				useOverlayPresence({
					isOpen: true,
					onEntered: () => {
						entered.push(tick);
					},
				}),
			{ initialProps: { tick: 0 } }
		);

		await rerenderEveryFrame(OVERLAY_MOTION.enterMs, (tick) => rerender({ tick }));

		expect(result.current.phase).toBe("open");
		expect(timing).toHaveBeenCalledTimes(1);
		expect(entered).toHaveLength(1);
		expect(entered[0]).toBeGreaterThan(0);
	});

	test("starts one exit timing and exits on time with a new inline onExited", async () => {
		const exited: number[] = [];
		const { result, rerender } = await renderHook(
			({ isOpen, tick }: { isOpen: boolean; tick: number }) =>
				useOverlayPresence({
					isOpen,
					onExited: () => {
						exited.push(tick);
					},
				}),
			{ initialProps: { isOpen: true, tick: 0 } }
		);
		await act(() => jest.advanceTimersByTime(OVERLAY_MOTION.enterMs + FRAME_MS * 2));
		timing.mockClear();
		await rerender({ isOpen: false, tick: 0 });

		await rerenderEveryFrame(OVERLAY_MOTION.exitMs, (tick) => rerender({ isOpen: false, tick }));

		expect(result.current.phase).toBe("closed");
		expect(timing).toHaveBeenCalledTimes(1);
		expect(exited).toHaveLength(1);
		expect(exited[0]).toBeGreaterThan(0);
	});
});

describe("useOverlayBackHandler", () => {
	type BackPress = Parameters<typeof BackHandler.addEventListener>[1];
	const backEvent = { type: "hardwareBackPress", timeStamp: 0 };

	/** Every subscribed back handler, each callable with no argument. */
	function captureBackHandlers(): Array<() => boolean | undefined> {
		const subscribed: BackPress[] = [];
		const handlers: Array<() => boolean | undefined> = [];
		jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, handler) => {
			const call = () => handler(backEvent);
			subscribed.push(handler);
			handlers.push(call);
			return {
				remove: () => {
					const at = subscribed.indexOf(handler);
					if (at >= 0) {
						subscribed.splice(at, 1);
						handlers.splice(at, 1);
					}
				},
			};
		});
		return handlers;
	}

	test("the back button closes the overlay and is consumed", async () => {
		const handlers = captureBackHandlers();
		const onBack = jest.fn();
		await renderWithProviders(<Demo name="one" onBack={onBack} />, { wrapper: Provider });
		expect(handlers).toHaveLength(1);

		let consumed: boolean | undefined;
		await act(async () => {
			consumed = handlers[0]?.();
		});
		expect(onBack).toHaveBeenCalledTimes(1);
		expect(consumed).toBe(true);
		await waitFor(() => expect(screen.queryByText("one panel")).not.toBeOnTheScreen());
		expect(handlers).toHaveLength(0);
	});

	test("only the top overlay answers: a popover over a dialog closes first", async () => {
		const handlers = captureBackHandlers();
		const onDialogBack = jest.fn();
		const onPopoverBack = jest.fn();
		await renderWithProviders(
			<>
				<Demo layer="modal" name="dialog" onBack={onDialogBack} />
				<Demo layer="anchored" name="popover" onBack={onPopoverBack} />
			</>,
			{ wrapper: Provider }
		);
		await waitFor(() => expect(handlers).toHaveLength(1));

		await act(async () => {
			handlers[0]?.();
		});
		expect(onPopoverBack).toHaveBeenCalledTimes(1);
		expect(onDialogBack).not.toHaveBeenCalled();

		await waitFor(() => expect(screen.queryByText("popover panel")).not.toBeOnTheScreen());
		await waitFor(() => expect(handlers).toHaveLength(1));
		await act(async () => {
			handlers[0]?.();
		});
		expect(onDialogBack).toHaveBeenCalledTimes(1);
	});

	test("a toast never takes the back button", async () => {
		const handlers = captureBackHandlers();
		const onToastBack = jest.fn();
		await renderWithProviders(
			<>
				<Demo layer="modal" name="dialog" />
				<Demo layer="toast" name="toast" onBack={onToastBack} />
			</>,
			{ wrapper: Provider }
		);
		await waitFor(() => expect(handlers).toHaveLength(1));
		await act(async () => {
			handlers[0]?.();
		});
		expect(onToastBack).not.toHaveBeenCalled();
	});

	test("does not subscribe while disabled", async () => {
		const handlers = captureBackHandlers();
		function Disabled(): ReactElement {
			useOverlayBackHandler({ id: "off", isEnabled: false, onBack: () => undefined });
			return <Text>disabled</Text>;
		}
		await renderWithProviders(<Disabled />, { wrapper: Provider });
		expect(handlers).toHaveLength(0);
	});

	test("without a provider the overlay is its own top", async () => {
		const handlers = captureBackHandlers();
		function Bare(): ReactElement {
			useOverlayBackHandler({ id: "bare", isEnabled: true, onBack: () => undefined });
			return <Text>bare</Text>;
		}
		await renderWithProviders(<Bare />);
		expect(handlers).toHaveLength(1);
	});
});

describe("OverlayProvider touch fan-out", () => {
	test("hears a touch start beneath it without claiming it", async () => {
		const heard = jest.fn();
		function Listener(): ReactElement {
			const registry = useOptionalOverlay();
			registry?.subscribeTouchStart(heard);
			return <Text>target</Text>;
		}
		await renderWithProviders(<Listener />, { wrapper: Provider });
		await fireEvent(screen.getByText("target"), "touchStart");
		expect(heard).toHaveBeenCalledTimes(1);
	});
});

/** The refs a `ModalDemo` hands the hook, so a test can tell which one took focus. */
type ModalProbe = {
	trigger?: RefObject<ComponentRef<typeof View> | null>;
	title?: RefObject<ComponentRef<typeof Text> | null>;
	item?: RefObject<ComponentRef<typeof Text> | null>;
};

type ModalDemoProps = {
	name: string;
	layer?: OverlayLayer;
	hasTitle?: boolean;
	onEscape?: () => void;
	probe?: ModalProbe;
};

/** A modal wired through `useOverlayModalAccessibility`: trigger, title, first item. */
function ModalDemo({ name, layer = "modal", hasTitle = true, onEscape, probe }: ModalDemoProps): ReactElement | null {
	const [isOpen, setIsOpen] = useState(true);
	const triggerRef = useRef<ComponentRef<typeof View>>(null);
	const titleRef = useRef<ComponentRef<typeof Text>>(null);
	const itemRef = useRef<ComponentRef<typeof Text>>(null);
	if (probe !== undefined) {
		probe.trigger = triggerRef;
		probe.title = titleRef;
		probe.item = itemRef;
	}
	const modal = useOverlayModalAccessibility({
		id: name,
		isOpen,
		initialFocus: [titleRef, itemRef],
		returnFocus: triggerRef,
		onEscape,
	});
	const { isPresent, phase } = useOverlayPresence({
		isOpen,
		enterMs: 1,
		exitMs: 1,
		onEntered: modal.focusInitial,
		onExited: modal.restoreFocus,
	});

	return (
		<>
			<View ref={triggerRef} testID={`${name}-trigger`}>
				<Text onPress={() => setIsOpen((current) => !current)}>{`toggle ${name}`}</Text>
			</View>
			{isPresent ? (
				<Overlay.Portal id={name} isExiting={phase === "exiting"} layer={layer}>
					<View testID={`${name}-container`} {...modal.containerProps}>
						{hasTitle ? <Text ref={titleRef}>{`${name} title`}</Text> : null}
						<Text ref={itemRef}>{`${name} item`}</Text>
					</View>
				</Overlay.Portal>
			) : null}
		</>
	);
}

const container = (name: string) => screen.getByTestId(`${name}-container`, { includeHiddenElements: true });

/**
 * Which of this demo's parts `sendAccessibilityEvent` focused, in order.
 *
 * Filtered to the probe's refs: an earlier test's entrance can finish after it
 * unmounts and land in this test's spy.
 */
function focusSpy(probe: ModalProbe): () => string[] {
	const parts: string[] = [];
	jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation((target, event) => {
		if (event !== "focus") return;
		const part = (["trigger", "title", "item"] as const).find((key) => {
			const node = probe[key]?.current;
			return node !== null && node !== undefined && node === target;
		});
		if (part !== undefined) parts.push(part);
	});
	return () => [...parts];
}

describe("useOverlayModalAccessibility", () => {
	test("the open container is modal and escapes", async () => {
		const onEscape = jest.fn();
		await renderWithProviders(<ModalDemo name="a" onEscape={onEscape} />, { wrapper: Provider });
		expect(container("a").props.accessibilityViewIsModal).toBe(true);
		await act(() => container("a").props.onAccessibilityEscape());
		expect(onEscape).toHaveBeenCalledTimes(1);
	});

	test("a container with no onEscape is modal but has no escape", async () => {
		await renderWithProviders(<ModalDemo name="a" />, { wrapper: Provider });
		expect(container("a").props.accessibilityViewIsModal).toBe(true);
		expect(container("a").props.onAccessibilityEscape).toBeUndefined();
	});

	test("focus moves to the title once the container has entered", async () => {
		const probe: ModalProbe = {};
		const focused = focusSpy(probe);
		await renderWithProviders(<ModalDemo name="a" probe={probe} />, { wrapper: Provider });
		await waitFor(() => expect(focused()).toEqual(["title"]));
	});

	test("focus falls back to the first item when there is no title", async () => {
		const probe: ModalProbe = {};
		const focused = focusSpy(probe);
		await renderWithProviders(<ModalDemo hasTitle={false} name="a" probe={probe} />, { wrapper: Provider });
		await waitFor(() => expect(focused()).toEqual(["item"]));
	});

	test("the container lets go on close, and focus returns to the trigger once it has gone", async () => {
		const probe: ModalProbe = {};
		const focused = focusSpy(probe);
		await renderWithProviders(<ModalDemo name="a" onEscape={() => {}} probe={probe} />, { wrapper: Provider });
		await waitFor(() => expect(focused()).toEqual(["title"]));
		await fireEvent.press(screen.getByText("toggle a"));
		await waitFor(() => expect(screen.queryByTestId("a-container", { includeHiddenElements: true })).toBeNull());
		expect(focused()).toEqual(["title", "trigger"]);
	});

	test("a modal under an anchored overlay lets go, and the anchored one holds focus", async () => {
		await renderWithProviders(
			<>
				<ModalDemo name="dialog" onEscape={() => {}} />
				<ModalDemo layer="anchored" name="menu" onEscape={() => {}} />
			</>,
			{ wrapper: Provider }
		);
		expect(container("dialog").props.accessibilityViewIsModal).toBe(false);
		expect(container("dialog").props.onAccessibilityEscape).toBeUndefined();
		expect(container("menu").props.accessibilityViewIsModal).toBe(true);
	});
});
