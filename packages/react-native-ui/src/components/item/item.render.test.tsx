import { describe, expect, jest, test } from "@jest/globals";
import { Platform } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { ListGroup } from "../list-group";
import { Item } from "./item";
import { useItem } from "./item.context";

/**
 * Not testable under Jest: press feedback (scale / fade), the surface and the
 * group-inset metrics. Those are class strings and animation, covered by
 * `item.variants.test.ts` and the playground.
 */
function silenceConsoleError(): () => void {
	const original = console.error;
	console.error = () => {};
	return () => {
		console.error = original;
	};
}

describe("Item", () => {
	test("bare text is wrapped in a title", async () => {
		await renderWithProviders(<Item>Wi-Fi</Item>);
		expect(screen.getByText("Wi-Fi")).toBeOnTheScreen();
	});

	test("without a handler it is a static row with no button role", async () => {
		await renderWithProviders(
			<Item>
				<Item.Title>Wi-Fi</Item.Title>
			</Item>
		);
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
		expect(screen.getByText("Wi-Fi")).toBeOnTheScreen();
	});

	test("with onPress it is a button named from its text", async () => {
		await renderWithProviders(
			<Item onPress={() => {}}>
				<Item.Content>
					<Item.Title>Wi-Fi</Item.Title>
					<Item.Description>Connected</Item.Description>
				</Item.Content>
			</Item>
		);
		expect(screen.getByRole("button", { name: /Wi-Fi/ })).toBeOnTheScreen();
	});

	test("an assistive activation calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Item onPress={onPress}>
				<Item.Title>Wi-Fi</Item.Title>
			</Item>
		);
		await fireEvent(screen.getByRole("button"), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("on Android the longpress action calls onLongPress, never onPress", async () => {
		const original = Platform.OS;
		Platform.OS = "android";
		try {
			const onLongPress = jest.fn();
			const onPress = jest.fn();
			await renderWithProviders(
				<Item onLongPress={onLongPress} onPress={onPress}>
					<Item.Title>Wi-Fi</Item.Title>
				</Item>
			);
			await fireEvent(screen.getByRole("button"), "accessibilityAction", {
				nativeEvent: { actionName: "longpress" },
			});
			expect(onLongPress).toHaveBeenCalledTimes(1);
			expect(onPress).not.toHaveBeenCalled();
		} finally {
			Platform.OS = original;
		}
	});

	test("isDisabled keeps the role, reports disabled and ignores activation", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Item isDisabled onPress={onPress}>
				<Item.Title>Wi-Fi</Item.Title>
			</Item>
		);
		const row = screen.getByRole("button");
		expect(row).toBeDisabled();
		await fireEvent(row, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});

	test("a disabled static row reports disabled", async () => {
		await renderWithProviders(
			<Item isDisabled testID="row">
				<Item.Title>Wi-Fi</Item.Title>
			</Item>
		);
		expect(screen.getByTestId("row").props.accessibilityState).toMatchObject({ disabled: true });
	});

	test("busy is announced and ignores activation", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Item busy onPress={onPress}>
				<Item.Title>Wi-Fi</Item.Title>
			</Item>
		);
		const row = screen.getByRole("button");
		expect(row).toBeBusy();
		await fireEvent(row, "accessibilityTap");
		expect(onPress).not.toHaveBeenCalled();
	});

	test("isSelected is announced as selected on a pressable and a static row", async () => {
		await renderWithProviders(
			<>
				<Item isSelected onPress={() => {}}>
					<Item.Title>Yearly</Item.Title>
				</Item>
				<Item testID="static">
					<Item.Title>Monthly</Item.Title>
				</Item>
			</>
		);
		expect(screen.getByRole("button", { name: /Yearly/ })).toBeSelected();
		expect(screen.getByTestId("static")).not.toBeSelected();
	});

	test("isSelected updates when the parent rerenders it", async () => {
		const view = await renderWithProviders(
			<Item onPress={() => {}}>
				<Item.Title>Yearly</Item.Title>
			</Item>
		);
		expect(screen.getByRole("button")).not.toBeSelected();
		await view.rerender(
			<Item isSelected onPress={() => {}}>
				<Item.Title>Yearly</Item.Title>
			</Item>
		);
		expect(screen.getByRole("button")).toBeSelected();
	});

	test("a caller role and state pass through to the row", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Item accessibilityRole="switch" accessibilityState={{ checked: true }} onPress={onPress}>
				<Item.Title>Wi-Fi</Item.Title>
			</Item>
		);
		const row = screen.getByRole("switch", { name: /Wi-Fi/ });
		expect(row.props.accessibilityState).toMatchObject({ checked: true });
		await fireEvent(row, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("every part renders inside the root", async () => {
		await renderWithProviders(
			<Item>
				<Item.Header>
					<Item.Description>Header strip</Item.Description>
				</Item.Header>
				<Item.Media>
					<Item.Description>Media slot</Item.Description>
				</Item.Media>
				<Item.Content>
					<Item.Title>Title</Item.Title>
					<Item.Description>Description</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Item.Description>Actions slot</Item.Description>
				</Item.Actions>
				<Item.Footer>
					<Item.Description>Footer strip</Item.Description>
				</Item.Footer>
			</Item>
		);
		for (const text of ["Header strip", "Media slot", "Title", "Description", "Actions slot", "Footer strip"]) {
			expect(screen.getByText(text)).toBeOnTheScreen();
		}
	});

	test("Item.Media renders for every variant", async () => {
		await renderWithProviders(
			<Item>
				<Item.Media variant="default">
					<Item.Description>default</Item.Description>
				</Item.Media>
				<Item.Media variant="icon">
					<Item.Description>icon</Item.Description>
				</Item.Media>
				<Item.Media variant="image">
					<Item.Description>image</Item.Description>
				</Item.Media>
			</Item>
		);
		for (const text of ["default", "icon", "image"]) {
			expect(screen.getByText(text)).toBeOnTheScreen();
		}
	});

	// RNTL role queries need an accessible element; a list container is not one,
	// so the role is asserted on the prop.
	test("Item.Group is announced as a list of its items", async () => {
		await renderWithProviders(
			<Item.Group testID="group">
				<Item>
					<Item.Title>One</Item.Title>
				</Item>
				<Item.Separator />
				<Item>
					<Item.Title>Two</Item.Title>
				</Item>
			</Item.Group>
		);
		expect(screen.getByTestId("group").props.accessibilityRole).toBe("list");
		expect(screen.getByText("One")).toBeOnTheScreen();
		expect(screen.getByText("Two")).toBeOnTheScreen();
	});

	test("an item works as a row in a ListGroup", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<ListGroup>
				<Item onPress={onPress}>
					<Item.Title>Wi-Fi</Item.Title>
				</Item>
			</ListGroup>
		);
		const row = screen.getByRole("button", { name: /Wi-Fi/ });
		await fireEvent(row, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("useItem reads the resolved context inside an item", async () => {
		function Probe() {
			const { isSelected, orientation, size } = useItem();
			return <Item.Description>{`${size}-${orientation}-${String(isSelected)}`}</Item.Description>;
		}
		await renderWithProviders(
			<Item isSelected orientation="vertical" size="lg">
				<Probe />
			</Item>
		);
		expect(screen.getByText("lg-vertical-true")).toBeOnTheScreen();
	});

	test.each([
		["Item.Title", () => <Item.Title>x</Item.Title>],
		["Item.Description", () => <Item.Description>x</Item.Description>],
		["Item.Media", () => <Item.Media />],
		["Item.Actions", () => <Item.Actions />],
	])("%s outside an Item throws its documented error", async (name, part) => {
		const restore = silenceConsoleError();
		try {
			await expect(renderWithProviders(part())).rejects.toThrow(`${name} must be rendered inside an <Item>.`);
		} finally {
			restore();
		}
	});

	test("useItem outside an Item throws", async () => {
		function Probe() {
			useItem();
			return null;
		}
		const restore = silenceConsoleError();
		try {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useItem must be called inside an <Item>.");
		} finally {
			restore();
		}
	});
});
