import { describe, expect, jest, test } from "@jest/globals";
import { Platform, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Marker } from "./marker";
import { useMarker } from "./marker.context";

function Probe() {
	const { variant, isDisabled, isBusy } = useMarker();
	return <Text testID="probe">{`${variant}|${isDisabled}|${isBusy}`}</Text>;
}

function activateAndroid(element: Parameters<typeof fireEvent>[0], actionName: string) {
	return fireEvent(element, "accessibilityAction", { nativeEvent: { actionName } });
}

/**
 * VoiceOver reaches a long press through a held touch, which Jest cannot send;
 * TalkBack lists a `longpress` action, which it can. So the long press runs on Android.
 */
async function renderOnAndroid(ui: React.ReactElement) {
	const platform = Platform.OS;
	Platform.OS = "android";
	try {
		return await renderWithProviders(ui);
	} finally {
		Platform.OS = platform;
	}
}

describe("Marker", () => {
	test("a static marker is one text element holding its words", async () => {
		await renderWithProviders(<Marker testID="root">Yesterday</Marker>);
		const root = screen.getByTestId("root");
		expect(root).toHaveProp("accessibilityRole", "text");
		expect(root).toHaveProp("accessible", true);
		expect(root).toHaveTextContent("Yesterday");
		expect(screen.queryByRole("button")).not.toBeOnTheScreen();
	});

	test("an accessibilityLabel overrides the words", async () => {
		await renderWithProviders(<Marker accessibilityLabel="Searched files">Searched 128 files</Marker>);
		expect(screen.getByLabelText("Searched files")).toBeOnTheScreen();
	});

	test("consecutive string and number children collapse into one Marker.Content", async () => {
		await renderWithProviders(<Marker>{128} files</Marker>);
		expect(screen.getByText("128 files")).toBeOnTheScreen();
	});

	test("explicit parts render", async () => {
		await renderWithProviders(
			<Marker>
				<Marker.Icon testID="glyph">
					<Text>*</Text>
				</Marker.Icon>
				<Marker.Content>Read config.ts</Marker.Content>
			</Marker>
		);
		expect(screen.getByText("Read config.ts")).toBeOnTheScreen();
	});

	test("Marker.Icon is hidden from assistive technology", async () => {
		await renderWithProviders(
			<Marker>
				<Marker.Icon testID="glyph">
					<Text>glyph</Text>
				</Marker.Icon>
				<Marker.Content>Read config.ts</Marker.Content>
			</Marker>
		);
		expect(screen.queryByTestId("glyph")).not.toBeOnTheScreen();
		expect(screen.getByTestId("glyph", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("the separator variant renders its label between two hidden rules", async () => {
		await renderWithProviders(
			<Marker testID="root" variant="separator">
				Yesterday
			</Marker>
		);
		expect(screen.getByText("Yesterday")).toBeOnTheScreen();
		expect(screen.getByTestId("root")).toBeOnTheScreen();
	});

	test.each(["default", "border", "separator"] as const)(
		"the %s variant stays a static text element",
		async (variant) => {
			await renderWithProviders(
				<Marker testID="root" variant={variant}>
					Done
				</Marker>
			);
			expect(screen.getByTestId("root")).toBeOnTheScreen();
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
		}
	);

	test("a static marker is not busy by default", async () => {
		await renderWithProviders(<Marker testID="root">Done</Marker>);
		expect(screen.getByTestId("root")).not.toBeBusy();
	});

	test("a shimmering Marker.Content announces the static marker busy", async () => {
		await renderWithProviders(
			<Marker testID="root">
				<Marker.Content shimmer>Searching files</Marker.Content>
			</Marker>
		);
		expect(screen.getByTestId("root")).toBeBusy();
	});

	test("dropping shimmer clears busy", async () => {
		const tree = (shimmer: boolean) => (
			<Marker testID="root">
				<Marker.Content shimmer={shimmer}>Searching files</Marker.Content>
			</Marker>
		);
		const view = await renderWithProviders(tree(true));
		expect(screen.getByTestId("root")).toBeBusy();
		await view.rerender(tree(false));
		expect(screen.getByTestId("root")).not.toBeBusy();
	});

	test("useMarker hands a custom child the variant and state", async () => {
		await renderWithProviders(
			<Marker isDisabled variant="border">
				<Probe />
				<Marker.Content shimmer>Running</Marker.Content>
			</Marker>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("border|true|true");
	});

	test("a marker with onPress is a button and fires on an assistive tap", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Marker accessibilityHint="Shows the files" onPress={onPress}>
				Searched files
			</Marker>
		);
		const button = screen.getByRole("button", { name: "Searched files" });
		expect(button.props.accessibilityHint).toBe("Shows the files");
		await fireEvent(button, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("on Android a marker with only onLongPress is a button and fires on the longpress action", async () => {
		const onLongPress = jest.fn();
		await renderOnAndroid(<Marker onLongPress={onLongPress}>Searched files</Marker>);
		const button = screen.getByRole("button", { name: "Searched files" });
		await activateAndroid(button, "longpress");
		expect(onLongPress).toHaveBeenCalledTimes(1);
	});

	test("on Android the activate action calls onPress", async () => {
		const onPress = jest.fn();
		await renderOnAndroid(<Marker onPress={onPress}>Searched files</Marker>);
		await activateAndroid(screen.getByRole("button", { name: "Searched files" }), "activate");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a disabled interactive marker is announced disabled and does not fire", async () => {
		const onPress = jest.fn();
		const onLongPress = jest.fn();
		await renderOnAndroid(
			<Marker isDisabled onLongPress={onLongPress} onPress={onPress}>
				Searched files
			</Marker>
		);
		const button = screen.getByRole("button", { name: "Searched files" });
		expect(button).toBeDisabled();
		await fireEvent(button, "accessibilityTap");
		await activateAndroid(button, "activate");
		await activateAndroid(button, "longpress");
		expect(onPress).not.toHaveBeenCalled();
		expect(onLongPress).not.toHaveBeenCalled();
	});

	test("a running interactive marker is announced busy and still takes its press", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Marker onPress={onPress}>
				<Marker.Content shimmer>Searching files</Marker.Content>
			</Marker>
		);
		const button = screen.getByRole("button", { name: "Searching files" });
		expect(button).toBeBusy();
		expect(button).not.toBeDisabled();
		await fireEvent(button, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a disabled static marker stays a text element", async () => {
		await renderWithProviders(
			<Marker isDisabled testID="root">
				Done
			</Marker>
		);
		expect(screen.getByTestId("root")).toBeOnTheScreen();
	});

	test("Marker.Icon outside a Marker throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(renderWithProviders(<Marker.Icon />)).rejects.toThrow(
				"Marker.Icon must be rendered inside a <Marker>."
			);
		} finally {
			spy.mockRestore();
		}
	});

	test("Marker.Content outside a Marker throws its documented error", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(renderWithProviders(<Marker.Content>x</Marker.Content>)).rejects.toThrow(
				"Marker.Content must be rendered inside a <Marker>."
			);
		} finally {
			spy.mockRestore();
		}
	});

	test("useMarker outside a Marker throws", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => {});
		try {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("useMarker must be called inside a <Marker>.");
		} finally {
			spy.mockRestore();
		}
	});
});
