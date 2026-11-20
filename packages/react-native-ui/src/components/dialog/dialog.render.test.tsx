import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement, ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";
import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../test/render";
import { Button } from "../button";
import { Overlay, OverlayProvider } from "../overlay";
import { Dialog, type DialogProps } from "./dialog";

function Overlays({ children }: { children: ReactNode }): ReactElement {
	return <OverlayProvider>{children}</OverlayProvider>;
}

function DeleteDialog(props: Omit<DialogProps, "children">): ReactElement {
	return (
		<Dialog {...props}>
			<Dialog.Trigger asChild>
				<Button>Delete</Button>
			</Dialog.Trigger>
			<Dialog.Content testID="card">
				<Dialog.Header>
					<Dialog.Title>Delete file?</Dialog.Title>
					<Dialog.Description>This cannot be undone.</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<Dialog.Close asChild>
						<Button>Cancel</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog>
	);
}

const press = (name: string) => fireEvent(screen.getByRole("button", { name }), "accessibilityTap");

describe("Dialog", () => {
	test("renders nothing until opened", async () => {
		await renderWithProviders(<DeleteDialog />, { wrapper: Overlays });
		expect(screen.queryByRole("header", { name: "Delete file?" })).not.toBeOnTheScreen();
	});

	test("the trigger opens it and Close shuts it, reporting both", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<DeleteDialog onOpenChange={onOpenChange} />, { wrapper: Overlays });

		await press("Delete");
		expect(screen.getByRole("header", { name: "Delete file?" })).toBeOnTheScreen();
		expect(screen.getByText("This cannot be undone.")).toBeOnTheScreen();
		expect(onOpenChange).toHaveBeenLastCalledWith(true);

		await press("Cancel");
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
		expect(await screen.findByRole("button", { name: "Delete" })).toBeOnTheScreen();
	});

	test("controlled: isOpen decides, the trigger only asks", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<DeleteDialog isOpen={false} onOpenChange={onOpenChange} />, { wrapper: Overlays });
		await press("Delete");
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(screen.queryByRole("header", { name: "Delete file?" })).not.toBeOnTheScreen();
	});

	test("defaultOpen starts it open", async () => {
		await renderWithProviders(<DeleteDialog defaultOpen />, { wrapper: Overlays });
		expect(screen.getByRole("header", { name: "Delete file?" })).toBeOnTheScreen();
	});

	test("the trigger reports expanded while the dialog is open", async () => {
		await renderWithProviders(<DeleteDialog />, { wrapper: Overlays });
		expect(screen.getByRole("button", { name: "Delete" }).props.accessibilityState.expanded).toBe(false);
		await press("Delete");
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Delete", includeHiddenElements: true }).props.accessibilityState.expanded
			).toBe(true)
		);
	});
});

const card = () => screen.getByTestId("card", { includeHiddenElements: true });

describe("Dialog accessibility", () => {
	test("the card is modal and the escape scrub closes a dismissible dialog", async () => {
		const onOpenChange = jest.fn();
		await renderWithProviders(<DeleteDialog defaultOpen onOpenChange={onOpenChange} />, { wrapper: Overlays });
		expect(card().props.accessibilityViewIsModal).toBe(true);
		await act(() => card().props.onAccessibilityEscape());
		expect(onOpenChange).toHaveBeenLastCalledWith(false);
	});

	test("a dialog that is not dismissible is modal with no escape", async () => {
		await renderWithProviders(<DeleteDialog defaultOpen isDismissible={false} />, { wrapper: Overlays });
		expect(card().props.accessibilityViewIsModal).toBe(true);
		expect(card().props.onAccessibilityEscape).toBeUndefined();
	});

	test("focus lands on the title once entered and returns to the trigger once gone", async () => {
		const targets: unknown[] = [];
		jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation((target, event) => {
			if (event === "focus") targets.push(target);
		});
		await renderWithProviders(<DeleteDialog />, { wrapper: Overlays });
		await press("Delete");
		await waitFor(() => expect(targets).toHaveLength(1));
		expect(targets[0]).not.toBeNull();
		await press("Cancel");
		await waitFor(() => expect(targets).toHaveLength(2));
		expect(targets[1]).not.toBe(targets[0]);
	});

	test("the card lets go of VoiceOver while a popover opened from it is on top", async () => {
		function WithPopover(): ReactElement {
			return (
				<Dialog defaultOpen>
					<Dialog.Content testID="card">
						<Dialog.Title>Title</Dialog.Title>
					</Dialog.Content>
					<Overlay.Portal id="popover" layer="anchored">
						<View testID="popover-panel" />
					</Overlay.Portal>
				</Dialog>
			);
		}
		await renderWithProviders(<WithPopover />, { wrapper: Overlays });
		expect(card().props.accessibilityViewIsModal).toBe(false);
		expect(card().props.onAccessibilityEscape).toBeUndefined();
	});
});
