import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { AccessibilityInfo, BackHandler } from "react-native";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Icon, type IconComponent } from "../icon";
import { Fab } from "./fab";

const TestGlyph: IconComponent = () => null;

async function activate(element: Parameters<typeof fireEvent>[0]): Promise<void> {
	await fireEvent(element, "accessibilityTap");
}

describe("Fab", () => {
	test("is a button named by its accessibilityLabel", async () => {
		await renderWithProviders(
			<Fab accessibilityLabel="New note">
				<Icon icon={TestGlyph} />
			</Fab>
		);
		expect(screen.getByRole("button", { name: "New note" })).toBeOnTheScreen();
	});

	test("an extended fab is named by its label text", async () => {
		await renderWithProviders(
			<Fab isExtended>
				<Icon icon={TestGlyph} />
				<Fab.Label>Write</Fab.Label>
			</Fab>
		);
		expect(screen.getByRole("button", { name: "Write" })).toBeOnTheScreen();
		expect(screen.getByText("Write")).toBeOnTheScreen();
	});

	test("bare text children are wrapped as a label", async () => {
		await renderWithProviders(<Fab isExtended>Compose</Fab>);
		expect(screen.getByText("Compose")).toBeOnTheScreen();
	});

	describe("round fab without a label", () => {
		let warn: jest.SpiedFunction<typeof console.warn>;

		beforeEach(() => {
			warn = jest.spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			warn.mockRestore();
		});

		test("warns in development", async () => {
			await renderWithProviders(
				<Fab>
					<Icon icon={TestGlyph} />
				</Fab>
			);
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("accessibilityLabel"));
		});

		test("does not warn when labelled or extended", async () => {
			await renderWithProviders(
				<>
					<Fab accessibilityLabel="New note" />
					<Fab isExtended>Write</Fab>
				</>
			);
			expect(warn).not.toHaveBeenCalled();
		});
	});

	test("an activation calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Fab accessibilityLabel="New note" onPress={onPress} />);
		await activate(screen.getByRole("button", { name: "New note" }));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("isDisabled is announced and ignores activation", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Fab accessibilityLabel="New note" isDisabled onPress={onPress} />);
		const button = screen.getByRole("button", { name: "New note" });
		expect(button).toBeDisabled();
		await activate(button);
		expect(onPress).not.toHaveBeenCalled();
	});

	test("an enabled fab is not announced as disabled", async () => {
		await renderWithProviders(<Fab accessibilityLabel="New note" />);
		expect(screen.getByRole("button", { name: "New note" })).not.toBeDisabled();
	});

	test("a pinned fab is still a reachable button", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Fab accessibilityLabel="New note" onPress={onPress} placement="bottom-end" />);
		await activate(screen.getByRole("button", { name: "New note" }));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("Fab.Label outside a Fab throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(renderWithProviders(<Fab.Label>Write</Fab.Label>)).rejects.toThrow(
				"Fab.Label must be rendered inside a <Fab>."
			);
		} finally {
			spy.mockRestore();
		}
	});
});

describe("Fab.Group", () => {
	function Dial(props: {
		onOpenChange?: (isOpen: boolean) => void;
		isOpen?: boolean;
		defaultOpen?: boolean;
		isDisabled?: boolean;
		onPhoto?: () => void;
		onDrafts?: () => void;
	}) {
		const { onPhoto = () => {}, onDrafts = () => {}, ...group } = props;
		return (
			<Fab.Group accessibilityLabel="Add something" icon={TestGlyph} isSafeAreaAware={false} {...group}>
				<Fab.Action icon={TestGlyph} label="Photo" onPress={onPhoto} />
				<Fab.Action icon={TestGlyph} isDisabled label="Locked" onPress={() => {}} />
				<Fab.Action icon={TestGlyph} isDestructive label="Empty drafts" onPress={onDrafts} />
			</Fab.Group>
		);
	}

	test("renders a collapsed trigger with no actions mounted", async () => {
		await renderWithProviders(<Dial />);
		const trigger = screen.getByRole("button", { name: "Add something" });
		expect(trigger).toBeOnTheScreen();
		expect(trigger).not.toBeExpanded();
		expect(screen.queryByRole("button", { name: "Photo" })).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Close" })).not.toBeOnTheScreen();
	});

	test("uncontrolled: an activation opens the dial and announces it expanded", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Dial onOpenChange={onOpenChange} />);
		await activate(screen.getByRole("button", { name: "Add something" }));
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
		expect(screen.getByRole("button", { name: "Add something" })).toBeExpanded();
		expect(screen.getByRole("button", { name: "Photo" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Empty drafts" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Close" })).toBeOnTheScreen();
	});

	test("defaultOpen seeds an open dial", async () => {
		await renderWithProviders(<Dial defaultOpen />);
		expect(screen.getByRole("button", { name: "Add something" })).toBeExpanded();
		expect(screen.getByRole("button", { name: "Photo" })).toBeOnTheScreen();
	});

	test("the trigger toggles the dial closed again", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Dial defaultOpen onOpenChange={onOpenChange} />);
		await activate(screen.getByRole("button", { name: "Add something" }));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.getByRole("button", { name: "Add something" })).not.toBeExpanded();
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onOpenChange = jest.fn();
		const view = await renderWithProviders(<Dial isOpen={false} onOpenChange={onOpenChange} />);
		await activate(screen.getByRole("button", { name: "Add something" }));
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.getByRole("button", { name: "Add something" })).not.toBeExpanded();
		expect(screen.queryByRole("button", { name: "Photo" })).not.toBeOnTheScreen();

		await view.rerender(<Dial isOpen onOpenChange={onOpenChange} />);
		expect(screen.getByRole("button", { name: "Add something" })).toBeExpanded();
		expect(screen.getByRole("button", { name: "Photo" })).toBeOnTheScreen();
	});

	test("an action runs its onPress, then closes the dial", async () => {
		const onPhoto = jest.fn();
		const onOpenChange = jest.fn();
		await renderWithProviders(<Dial defaultOpen onOpenChange={onOpenChange} onPhoto={onPhoto} />);
		await activate(screen.getByRole("button", { name: "Photo" }));
		expect(onPhoto).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.getByRole("button", { name: "Add something" })).not.toBeExpanded();
	});

	test("a destructive action is still an ordinary pressable button", async () => {
		const onDrafts = jest.fn();
		await renderWithProviders(<Dial defaultOpen onDrafts={onDrafts} />);
		await activate(screen.getByRole("button", { name: "Empty drafts" }));
		expect(onDrafts).toHaveBeenCalledTimes(1);
	});

	test("a disabled action is announced disabled and ignores activation", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Dial defaultOpen onOpenChange={onOpenChange} />);
		const locked = screen.getByRole("button", { name: "Locked" });
		expect(locked).toBeDisabled();
		await activate(locked);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("action label chips are hidden from assistive technology", async () => {
		await renderWithProviders(<Dial defaultOpen />);
		expect(screen.getAllByRole("button", { name: "Photo" })).toHaveLength(1);
	});

	test("the scrim closes the dial", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Dial defaultOpen onOpenChange={onOpenChange} />);
		await activate(screen.getByRole("button", { name: "Close" }));
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(screen.getByRole("button", { name: "Add something" })).not.toBeExpanded();
	});

	test("isDisabled is announced and the trigger ignores activation", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Dial isDisabled onOpenChange={onOpenChange} />);
		const trigger = screen.getByRole("button", { name: "Add something" });
		expect(trigger).toBeDisabled();
		await activate(trigger);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	test("an extended group shows its label while closed and drops it when open", async () => {
		await renderWithProviders(
			<Fab.Group accessibilityLabel="Add something" icon={TestGlyph} isSafeAreaAware={false} label="Create">
				<Fab.Action icon={TestGlyph} label="Photo" onPress={() => {}} />
			</Fab.Group>
		);
		expect(screen.getByText("Create")).toBeOnTheScreen();
		await activate(screen.getByRole("button", { name: "Add something" }));
		expect(screen.queryByText("Create")).not.toBeOnTheScreen();
	});

	test("testID lands on the trigger and an action's on its button", async () => {
		await renderWithProviders(
			<Fab.Group accessibilityLabel="Add" icon={TestGlyph} isSafeAreaAware={false} testID="dial" defaultOpen>
				<Fab.Action icon={TestGlyph} label="Photo" onPress={() => {}} testID="dial-photo" />
			</Fab.Group>
		);
		expect(screen.getByTestId("dial")).toBeExpanded();
		expect(screen.getByTestId("dial-photo")).toBeOnTheScreen();
	});

	describe("Android back", () => {
		test("closes an open dial and is not subscribed while closed", async () => {
			const remove = jest.fn();
			const add = jest.spyOn(BackHandler, "addEventListener").mockReturnValue({ remove });
			try {
				const onOpenChange = jest.fn();
				await renderWithProviders(<Dial onOpenChange={onOpenChange} />);
				expect(add).not.toHaveBeenCalled();

				await activate(screen.getByRole("button", { name: "Add something" }));
				expect(add).toHaveBeenCalledWith("hardwareBackPress", expect.any(Function));
				const handler = add.mock.calls[0]?.[1] as (() => boolean | null | undefined) | undefined;
				expect(handler).toBeDefined();
				await act(async () => {
					expect(handler?.()).toBe(true);
				});
				expect(onOpenChange).toHaveBeenLastCalledWith(false);
			} finally {
				add.mockRestore();
			}
		});
	});

	describe("accessibility", () => {
		function layer() {
			let node = screen.getByRole("button", { name: "Add something" }).parent;
			while (node && node.props.accessibilityViewIsModal === undefined) node = node.parent;
			return node;
		}

		test("the layer is modal only while open", async () => {
			await renderWithProviders(<Dial />);
			const closed = screen.getByRole("button", { name: "Add something" });
			expect(closed).toBeOnTheScreen();
			expect(layer()?.props.accessibilityViewIsModal).toBe(false);
			await activate(closed);
			expect(layer()?.props.accessibilityViewIsModal).toBe(true);
		});

		test("the escape scrub closes the dial", async () => {
			const onOpenChange = jest.fn();
			await renderWithProviders(<Dial defaultOpen onOpenChange={onOpenChange} />);
			const onEscape = layer()?.props.onAccessibilityEscape as (() => void) | undefined;
			expect(onEscape).toBeDefined();
			await act(async () => {
				onEscape?.();
			});
			expect(onOpenChange).toHaveBeenLastCalledWith(false);
		});

		test("focus returns to the trigger when the dial closes", async () => {
			const spy = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => {});
			try {
				await renderWithProviders(<Dial defaultOpen />);
				spy.mockClear();
				await activate(screen.getByRole("button", { name: "Add something" }));
				const targets = spy.mock.calls.filter(([, event]) => event === "focus").map(([target]) => target);
				expect(targets).toHaveLength(1);
				expect((targets[0] as unknown as { props: { accessibilityLabel: string } }).props.accessibilityLabel).toBe(
					"Add something"
				);
			} finally {
				spy.mockRestore();
			}
		});
	});

	test("Fab.Action outside a Fab.Group throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(
				renderWithProviders(<Fab.Action icon={TestGlyph} label="Photo" onPress={() => {}} />)
			).rejects.toThrow("Fab.Action must be rendered inside a <Fab.Group>.");
		} finally {
			spy.mockRestore();
		}
	});
});
