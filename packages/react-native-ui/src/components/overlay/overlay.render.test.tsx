import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { type ReactElement, type ReactNode, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { Overlay, OverlayProvider } from "./overlay";
import { useOptionalOverlay } from "./overlay.context";
import { type OverlayLayer, zIndexOfOverlay } from "./overlay-registry";
import { TELEPORT_INLINE } from "./overlay-teleport";
import { useOverlayBackHandler } from "./use-overlay-back-handler";
import { useOverlayPresence } from "./use-overlay-presence";

type DemoProps = {
	name: string;
	layer?: OverlayLayer;
	defaultOpen?: boolean;
	onDismiss?: () => void;
	onBack?: () => void;
	onExited?: () => void;
};

function Demo({
	name,
	layer = "modal",
	defaultOpen = true,
	onDismiss,
	onBack,
	onExited,
}: DemoProps): ReactElement | null {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const { isPresent, progress } = useOverlayPresence({ isOpen, enterMs: 1, exitMs: 1, onExited });
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
				<Overlay.Portal id={name} layer={layer}>
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
