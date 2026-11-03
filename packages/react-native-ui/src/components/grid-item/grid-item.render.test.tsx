import { describe, expect, jest, test } from "@jest/globals";
import { Platform, Text, View } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { GridItem } from "./grid-item";
import { useGridItem, useGridItemGroup } from "./grid-item.context";

/**
 * Cell placement and measurement need `onLayout`, which Jest never fires, and the
 * press scale / relayout glide are animation, so neither is asserted here. The
 * group's list role is read from the prop because the container is not `accessible`.
 */

async function silenced(run: () => Promise<void>): Promise<void> {
	const original = console.error;
	console.error = () => {};
	try {
		await run();
	} finally {
		console.error = original;
	}
}

function activate(element: Parameters<typeof fireEvent>[0]) {
	return fireEvent(element, "accessibilityTap");
}

describe("GridItem", () => {
	test("a static tile is one accessible element labelled from title, value and description", async () => {
		await renderWithProviders(
			<GridItem>
				<GridItem.Title>Storage</GridItem.Title>
				<GridItem.Value>74 GB</GridItem.Value>
				<GridItem.Description>of 100 GB</GridItem.Description>
			</GridItem>
		);
		expect(screen.getByLabelText("Storage, 74 GB, of 100 GB")).toBeOnTheScreen();
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
	});

	test("an accessibilityLabel replaces the joined label", async () => {
		await renderWithProviders(
			<GridItem accessibilityLabel="Disk usage">
				<GridItem.Title>Storage</GridItem.Title>
				<GridItem.Value>74 GB</GridItem.Value>
			</GridItem>
		);
		expect(screen.getByLabelText("Disk usage")).toBeOnTheScreen();
		expect(screen.queryByLabelText("Storage, 74 GB")).not.toBeOnTheScreen();
	});

	test("a changed part re-registers the label", async () => {
		const view = await renderWithProviders(
			<GridItem onPress={() => {}}>
				<GridItem.Title>Front door</GridItem.Title>
				<GridItem.Description>Locked</GridItem.Description>
			</GridItem>
		);
		expect(screen.getByRole("button", { name: "Front door, Locked" })).toBeOnTheScreen();
		await view.rerender(
			<GridItem onPress={() => {}}>
				<GridItem.Title>Front door</GridItem.Title>
				<GridItem.Description>Unlocked</GridItem.Description>
			</GridItem>
		);
		expect(screen.getByRole("button", { name: "Front door, Unlocked" })).toBeOnTheScreen();
	});

	test("every part renders its content inside the tile", async () => {
		await renderWithProviders(
			<GridItem>
				<GridItem.Media>
					<Text>media</Text>
				</GridItem.Media>
				<GridItem.Title>Title</GridItem.Title>
				<GridItem.Value>Value</GridItem.Value>
				<GridItem.Description>Description</GridItem.Description>
				<GridItem.Footer>
					<Text>footer</Text>
				</GridItem.Footer>
				<GridItem.Actions>
					<Text>actions</Text>
				</GridItem.Actions>
			</GridItem>
		);
		for (const text of ["media", "Title", "Value", "Description", "footer", "actions"]) {
			expect(screen.getByText(text)).toBeOnTheScreen();
		}
	});

	test("a Background is hidden from assistive technology and out of the label", async () => {
		await renderWithProviders(
			<GridItem>
				<GridItem.Title>Storage</GridItem.Title>
				<GridItem.Background testID="bg">
					<Text>decoration</Text>
				</GridItem.Background>
			</GridItem>
		);
		const background = screen.getByTestId("bg", { includeHiddenElements: true });
		expect(background.props.accessibilityElementsHidden).toBe(true);
		expect(background.props.importantForAccessibility).toBe("no-hide-descendants");
		expect(background.props.pointerEvents).toBe("none");
		expect(screen.getByLabelText("Storage")).toBeOnTheScreen();
	});

	test("a part outside a tile throws its documented error", async () => {
		await silenced(async () => {
			await expect(renderWithProviders(<GridItem.Title>Orphan</GridItem.Title>)).rejects.toThrow(
				"GridItem.Title must be rendered inside a <GridItem>."
			);
			await expect(renderWithProviders(<GridItem.Media />)).rejects.toThrow(
				"GridItem.Media must be rendered inside a <GridItem>."
			);
		});
	});

	test("useGridItem and useGridItemGroup throw outside their roots", async () => {
		function ReadTile() {
			useGridItem();
			return null;
		}
		function ReadGroup() {
			useGridItemGroup();
			return null;
		}
		await silenced(async () => {
			await expect(renderWithProviders(<ReadTile />)).rejects.toThrow(
				"useGridItem must be called inside a <GridItem>."
			);
			await expect(renderWithProviders(<ReadGroup />)).rejects.toThrow(
				"useGridItemGroup must be called inside a <GridItem.Group>."
			);
		});
	});

	describe("pressable tile", () => {
		test("an onPress makes it a button and an activation calls it", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<GridItem onPress={onPress}>
					<GridItem.Title>Lights</GridItem.Title>
				</GridItem>
			);
			const tile = screen.getByRole("button", { name: "Lights" });
			await activate(tile);
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("an onLongPress alone also makes it a button; TalkBack's longpress action fires it", async () => {
			const platform = Platform.OS;
			Platform.OS = "android";
			try {
				const onLongPress = jest.fn();
				await renderWithProviders(
					<GridItem onLongPress={onLongPress}>
						<GridItem.Title>Lights</GridItem.Title>
					</GridItem>
				);
				const tile = screen.getByRole("button", { name: "Lights" });
				await fireEvent(tile, "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
				expect(onLongPress).toHaveBeenCalledTimes(1);
			} finally {
				Platform.OS = platform;
			}
		});

		test("isDisabled is announced and blocks onPress", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<GridItem isDisabled onPress={onPress}>
					<GridItem.Title>Camera</GridItem.Title>
				</GridItem>
			);
			const tile = screen.getByRole("button", { name: "Camera" });
			expect(tile).toBeDisabled();
			await activate(tile);
			expect(onPress).not.toHaveBeenCalled();
		});

		test("busy is announced and blocks onPress", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<GridItem busy onPress={onPress}>
					<GridItem.Title>Sync</GridItem.Title>
				</GridItem>
			);
			const tile = screen.getByRole("button", { name: "Sync" });
			expect(tile).toBeBusy();
			await activate(tile);
			expect(onPress).not.toHaveBeenCalled();
		});
	});

	describe("static tile state", () => {
		test("isDisabled and busy are announced without a button role", async () => {
			await renderWithProviders(
				<GridItem busy isDisabled>
					<GridItem.Title>Camera</GridItem.Title>
				</GridItem>
			);
			const tile = screen.getByLabelText("Camera");
			expect(tile).toBeDisabled();
			expect(tile).toBeBusy();
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
		});

		test("accessibilityState from the caller is kept alongside disabled", async () => {
			await renderWithProviders(
				<GridItem accessibilityState={{ selected: true }}>
					<GridItem.Title>Pinned</GridItem.Title>
				</GridItem>
			);
			expect(screen.getByLabelText("Pinned")).toBeSelected();
		});

		test("accessible={false} releases the tile so its own controls are reachable", async () => {
			await renderWithProviders(
				<GridItem accessible={false}>
					<GridItem.Title>Thermostat</GridItem.Title>
					<GridItem.Actions>
						<View accessibilityLabel="More" accessibilityRole="button" accessible />
					</GridItem.Actions>
				</GridItem>
			);
			expect(screen.getByRole("button", { name: "More" })).toBeOnTheScreen();
		});

		test("asChild renders the caller's child as the tile", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<GridItem asChild onPress={onPress}>
					<View accessibilityLabel="Custom" testID="custom" />
				</GridItem>
			);
			expect(screen.getByTestId("custom")).toBeOnTheScreen();
		});
	});

	describe("GridItem.Group", () => {
		test("is a list whose children render in writing order", async () => {
			await renderWithProviders(
				<GridItem.Group columns={2} testID="group">
					<GridItem colSpan={2}>
						<GridItem.Title>First</GridItem.Title>
					</GridItem>
					<GridItem>
						<GridItem.Title>Second</GridItem.Title>
					</GridItem>
					<GridItem>
						<GridItem.Title>Third</GridItem.Title>
					</GridItem>
				</GridItem.Group>
			);
			expect(screen.getByTestId("group").props.accessibilityRole).toBe("list");
			const labels = screen.getAllByLabelText(/^(First|Second|Third)$/).map((node) => node.props.accessibilityLabel);
			expect(labels).toEqual(["First", "Second", "Third"]);
		});

		test("a non-GridItem direct child is placed too", async () => {
			await renderWithProviders(
				<GridItem.Group>
					<View accessibilityLabel="Plain" accessible />
					<GridItem>
						<GridItem.Title>Tile</GridItem.Title>
					</GridItem>
				</GridItem.Group>
			);
			expect(screen.getByLabelText("Plain")).toBeOnTheScreen();
			expect(screen.getByLabelText("Tile")).toBeOnTheScreen();
		});

		test("tiles inside it keep their own press behaviour", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<GridItem.Group>
					<GridItem onPress={onPress}>
						<GridItem.Title>Lock</GridItem.Title>
					</GridItem>
					<GridItem isDisabled onPress={onPress}>
						<GridItem.Title>Camera</GridItem.Title>
					</GridItem>
				</GridItem.Group>
			);
			await activate(screen.getByRole("button", { name: "Camera" }));
			expect(onPress).not.toHaveBeenCalled();
			await activate(screen.getByRole("button", { name: "Lock" }));
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("a tile reads the group's variant and size unless it sets its own", async () => {
			const seen: Array<{ variant: string; size: string }> = [];
			function Probe() {
				const { variant, size } = useGridItem();
				seen.push({ size, variant });
				return null;
			}
			await renderWithProviders(
				<GridItem.Group size="sm" variant="outline">
					<GridItem>
						<Probe />
					</GridItem>
					<GridItem size="default" variant="muted">
						<Probe />
					</GridItem>
				</GridItem.Group>
			);
			expect(seen[0]).toEqual({ size: "sm", variant: "outline" });
			expect(seen[seen.length - 1]).toEqual({ size: "default", variant: "muted" });
		});

		test("useGridItemGroup reports columns and gap inside a group", async () => {
			let reported: { columns: number; gap: number } | undefined;
			function Probe() {
				const { columns, gap } = useGridItemGroup();
				reported = { columns, gap };
				return null;
			}
			await renderWithProviders(
				<GridItem.Group columns={3} gap={8}>
					<Probe />
				</GridItem.Group>
			);
			expect(reported).toEqual({ columns: 3, gap: 8 });
		});
	});
});
