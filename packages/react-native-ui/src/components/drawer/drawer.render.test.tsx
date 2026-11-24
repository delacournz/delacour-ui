import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { type ReactElement, type ReactNode, useState } from "react";
import { Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Button } from "../button";
import { OverlayProvider } from "../overlay";
import { Drawer, type DrawerProps, useDrawer } from "./index";

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

type MenuProps = Omit<DrawerProps, "children"> & {
	isHeaderCloseHidden?: boolean;
	isSwipeDismissible?: boolean;
};

function Menu({ isHeaderCloseHidden = false, isSwipeDismissible, ...props }: MenuProps): ReactElement {
	return (
		<Drawer {...props}>
			<Drawer.Trigger asChild>
				<Button>Open menu</Button>
			</Drawer.Trigger>
			<Drawer.Content isSwipeDismissible={isSwipeDismissible} testID="panel">
				<Drawer.Header isCloseHidden={isHeaderCloseHidden}>
					<Drawer.Title>Menu</Drawer.Title>
					<Drawer.Description>Signed in as aria</Drawer.Description>
				</Drawer.Header>
				<Drawer.Body>
					<Text>Inbox</Text>
				</Drawer.Body>
				<Drawer.Footer>
					<Drawer.Close asChild>
						<Button>Sign out</Button>
					</Drawer.Close>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer>
	);
}

const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");

const silenceConsoleError = () => {
	const original = console.error;
	console.error = () => undefined;
	return () => {
		console.error = original;
	};
};

// The panel is a role="dialog" view that is deliberately not `accessible` (that would group its
// children on iOS), so it is found by testID. The swipe-to-dismiss pan, the slide and the scrim tap are not reachable under Jest (no touch
// system, the scrim is hidden from assistive technology and carries no role); the accessibility
// escape action and the back handler take the same `close` path and stand in for them.
describe("Drawer", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("renders nothing until opened", async () => {
		await renderWithProviders(<Menu />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Open menu" })).toBeOnTheScreen();
		expect(screen.queryByTestId("panel")).not.toBeOnTheScreen();
		expect(screen.queryByText("Inbox")).not.toBeOnTheScreen();
	});

	test("defaultOpen starts it open", async () => {
		await renderWithProviders(<Menu defaultOpen />, { wrapper: Overlays });
		expect(screen.getByTestId("panel")).toBeOnTheScreen();
		expect(screen.getByRole("header", { name: "Menu" })).toBeOnTheScreen();
		expect(screen.getByText("Signed in as aria")).toBeOnTheScreen();
		expect(screen.getByText("Inbox")).toBeOnTheScreen();
	});

	test("the panel is a modal dialog labelled by its title", async () => {
		await renderWithProviders(<Menu defaultOpen />, { wrapper: Overlays });
		const panel = screen.getByTestId("panel");
		expect(panel.props.role).toBe("dialog");
		expect(panel.props.accessibilityViewIsModal).toBe(true);
		expect(panel.props.accessibilityLabelledBy).toBe(screen.getByRole("header", { name: "Menu" }).props.nativeID);
	});

	test("the trigger opens it and reports onOpenChange(true)", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Menu onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await press("Open menu");

		expect(screen.getByTestId("panel")).toBeOnTheScreen();
		expect(onOpenChange).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(true);
	});

	test("the header's labelled close button shuts it and reports onOpenChange(false)", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Menu defaultOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await press("Close");

		expect(onOpenChange).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(await screen.findByRole("button", { name: "Open menu" })).toBeOnTheScreen();
	});

	test("isCloseHidden drops the header's close button", async () => {
		await renderWithProviders(<Menu defaultOpen isHeaderCloseHidden />, { wrapper: Overlays });
		expect(screen.queryByRole("button", { name: "Close" })).not.toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Sign out" })).toBeOnTheScreen();
	});

	test("Close asChild donates the close to its child and still runs the child's onPress", async () => {
		const onOpenChange = jest.fn();
		const onPress = jest.fn();
		await renderWithProviders(
			<Drawer defaultOpen onOpenChange={onOpenChange}>
				<Drawer.Content testID="panel">
					<Drawer.Title>Menu</Drawer.Title>
					<Drawer.Close asChild>
						<Button onPress={onPress}>Done</Button>
					</Drawer.Close>
				</Drawer.Content>
			</Drawer>,
			{ wrapper: Overlays }
		);

		await press("Done");

		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("Close accepts a custom accessibilityLabel", async () => {
		await renderWithProviders(
			<Drawer defaultOpen>
				<Drawer.Content testID="panel">
					<Drawer.Title>Menu</Drawer.Title>
					<Drawer.Close accessibilityLabel="Dismiss menu" />
				</Drawer.Content>
			</Drawer>,
			{ wrapper: Overlays }
		);
		expect(screen.getByRole("button", { name: "Dismiss menu" })).toBeOnTheScreen();
	});

	test("the trigger calls its own onPress after opening", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Drawer>
				<Drawer.Trigger onPress={onPress}>
					<Text>Open</Text>
				</Drawer.Trigger>
				<Drawer.Content testID="panel">
					<Drawer.Title>Menu</Drawer.Title>
				</Drawer.Content>
			</Drawer>,
			{ wrapper: Overlays }
		);

		await fireEvent(screen.getByRole("button"), "accessibilityTap");

		expect(onPress).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("panel")).toBeOnTheScreen();
	});

	test("controlled: isOpen decides, the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Menu isOpen={false} onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await press("Open menu");

		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByTestId("panel")).not.toBeOnTheScreen();
	});

	test("controlled: it opens when the prop follows", async () => {
		const { rerender } = await renderWithProviders(<Menu isOpen={false} />, { wrapper: Overlays });
		expect(screen.queryByTestId("panel")).not.toBeOnTheScreen();

		await rerender(<Menu isOpen />);

		expect(screen.getByTestId("panel")).toBeOnTheScreen();
	});

	test("controlled: closing asks and the drawer stays until the prop changes", async () => {
		const onOpenChange = jest.fn();
		const { rerender } = await renderWithProviders(<Menu isOpen onOpenChange={onOpenChange} />, {
			wrapper: Overlays,
		});

		await press("Sign out");

		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(screen.getByTestId("panel")).toBeOnTheScreen();

		await rerender(<Menu isOpen={false} onOpenChange={onOpenChange} />);

		expect(await screen.findByRole("button", { name: "Open menu" })).toBeOnTheScreen();
	});

	test("the accessibility escape gesture closes a dismissible drawer", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Menu defaultOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await fireEvent(screen.getByTestId("panel"), "accessibilityEscape");

		expect(onOpenChange).toHaveBeenCalledTimes(1);
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("isDismissible={false} ignores the escape gesture but Close still closes it", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Menu defaultOpen isDismissible={false} onOpenChange={onOpenChange} />, {
			wrapper: Overlays,
		});

		await fireEvent(screen.getByTestId("panel"), "accessibilityEscape");
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(screen.getByTestId("panel")).toBeOnTheScreen();

		await press("Sign out");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("a second close while exiting reports once", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<Menu defaultOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await press("Sign out");
		await fireEvent(screen.getByTestId("panel"), "accessibilityEscape");

		expect(onOpenChange).toHaveBeenCalledTimes(1);
	});

	test("useDrawer exposes the open state and a setter to custom rows", async () => {
		function Row(): ReactElement {
			const { isOpen, setOpen, side, edge } = useDrawer();
			return <Button onPress={() => setOpen(false)}>{`row ${isOpen ? "open" : "closed"} ${side} ${edge}`}</Button>;
		}
		const onOpenChange = jest.fn();
		await renderWithProviders(
			<Drawer defaultOpen onOpenChange={onOpenChange}>
				<Drawer.Content side="end" testID="panel">
					<Drawer.Title>Menu</Drawer.Title>
					<Row />
				</Drawer.Content>
			</Drawer>,
			{ wrapper: Overlays }
		);

		await press("row open end right");

		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("useDrawer throws outside a Drawer", async () => {
		function Orphan(): ReactElement {
			useDrawer();
			return <Text>never</Text>;
		}
		const restore = silenceConsoleError();
		try {
			await expect(renderWithProviders(<Orphan />)).rejects.toThrow("useDrawer must be called inside a <Drawer>.");
		} finally {
			restore();
		}
	});

	test.each([
		["Drawer.Trigger", <Drawer.Trigger key="t" />],
		["Drawer.Content", <Drawer.Content key="c" testID="panel" />],
		["Drawer.Title", <Drawer.Title key="ti">x</Drawer.Title>],
		["Drawer.Close", <Drawer.Close key="cl" />],
	])("%s outside a Drawer throws its documented error", async (name, part) => {
		const restore = silenceConsoleError();
		try {
			await expect(renderWithProviders(part, { wrapper: Overlays })).rejects.toThrow(
				`${name} must be rendered inside a <Drawer>.`
			);
		} finally {
			restore();
		}
	});

	test("Body renders a non-scrolling column with isScrollable={false}", async () => {
		await renderWithProviders(
			<Drawer defaultOpen>
				<Drawer.Content testID="panel">
					<Drawer.Title>Filters</Drawer.Title>
					<Drawer.Body isScrollable={false}>
						<Text>Chips</Text>
					</Drawer.Body>
				</Drawer.Content>
			</Drawer>,
			{ wrapper: Overlays }
		);
		expect(screen.getByText("Chips")).toBeOnTheScreen();
	});

	test("each side opens a dialog with the title in it", async () => {
		for (const side of ["start", "end", "top", "bottom"] as const) {
			const view = await renderWithProviders(
				<Drawer defaultOpen>
					<Drawer.Content side={side} testID="panel">
						<Drawer.Title>{`Panel ${side}`}</Drawer.Title>
					</Drawer.Content>
				</Drawer>,
				{ wrapper: Overlays }
			);
			expect(screen.getByRole("header", { name: `Panel ${side}` })).toBeOnTheScreen();
			await view.unmount();
		}
	});

	test("useState-driven controlled usage round-trips", async () => {
		function Controlled(): ReactElement {
			const [isOpen, setIsOpen] = useState(false);
			return (
				<Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
					<Drawer.Trigger asChild>
						<Button>Open</Button>
					</Drawer.Trigger>
					<Drawer.Content testID="panel">
						<Drawer.Title>Controlled</Drawer.Title>
						<Drawer.Close asChild>
							<Button>Done</Button>
						</Drawer.Close>
					</Drawer.Content>
				</Drawer>
			);
		}
		await renderWithProviders(<Controlled />, { wrapper: Overlays });

		await press("Open");
		expect(screen.getByTestId("panel")).toBeOnTheScreen();

		await press("Done");
		expect(await screen.findByRole("button", { name: "Open" })).toBeOnTheScreen();
	});
});
