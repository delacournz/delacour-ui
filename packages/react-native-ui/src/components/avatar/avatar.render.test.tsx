import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Platform, Text } from "react-native";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Avatar } from "./avatar";
import { useAvatar } from "./avatar.context";

const PHOTO = { uri: "https://example.com/aria.png" };
const OTHER_PHOTO = { uri: "https://example.com/other.png" };

function ContextProbe() {
	const { size, variant, color, isDisabled } = useAvatar();
	return <Text testID="probe">{`${size}|${variant}|${color}|${isDisabled}`}</Text>;
}

function SizeProbe({ testID }: { testID: string }) {
	const { size } = useAvatar();
	return <Text testID={testID}>{size}</Text>;
}

describe("Avatar", () => {
	describe("as content", () => {
		test("is announced as an image named by name", async () => {
			await renderWithProviders(<Avatar name="Aria Whitlock" />);
			expect(screen.getByRole("image", { name: "Aria Whitlock" })).toBeOnTheScreen();
		});

		test("an explicit accessibilityLabel beats name", async () => {
			await renderWithProviders(<Avatar accessibilityLabel="Aria Whitlock, online" name="Aria Whitlock" />);
			expect(screen.getByRole("image", { name: "Aria Whitlock, online" })).toBeOnTheScreen();
		});

		test("falls back to the fallback text for its name", async () => {
			await renderWithProviders(<Avatar fallback="+3" />);
			expect(screen.getByRole("image", { name: "+3" })).toBeOnTheScreen();
		});

		test("with nothing to say it is not announced at all", async () => {
			await renderWithProviders(<Avatar testID="avatar" />);
			expect(screen.getByTestId("avatar")).toHaveProp("accessible", false);
			expect(screen.queryByRole("image")).not.toBeOnTheScreen();
		});

		test("a blank name is treated as absent", async () => {
			await renderWithProviders(<Avatar name="   " testID="avatar" />);
			expect(screen.queryByRole("image")).not.toBeOnTheScreen();
		});

		test("with no handler it is not a control", async () => {
			await renderWithProviders(<Avatar name="Aria Whitlock" />);
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
		});

		test("forwards testID to the root", async () => {
			await renderWithProviders(<Avatar name="Aria Whitlock" testID="avatar" />);
			expect(screen.getByTestId("avatar")).toHaveProp("accessibilityLabel", "Aria Whitlock");
		});
	});

	describe("fallback", () => {
		test("draws the first and last initials of name", async () => {
			await renderWithProviders(<Avatar name="Anahera Rose Tui" />);
			expect(screen.getByText("AT")).toBeOnTheScreen();
		});

		test("a single word gives one initial", async () => {
			await renderWithProviders(<Avatar name="Mihi" />);
			expect(screen.getByText("M")).toBeOnTheScreen();
		});

		test("fallback overrides the drawn text but not what is announced", async () => {
			await renderWithProviders(<Avatar fallback="??" name="Aria Whitlock" />);
			expect(screen.getByText("??")).toBeOnTheScreen();
			expect(screen.queryByText("AR")).not.toBeOnTheScreen();
			expect(screen.getByRole("image", { name: "Aria Whitlock" })).toBeOnTheScreen();
		});

		test("with no name or fallback no text is drawn", async () => {
			await renderWithProviders(<Avatar testID="avatar" />);
			expect(screen.getByTestId("avatar")).not.toHaveTextContent(/\S/);
		});
	});

	describe("image", () => {
		test("keeps the initials painted under a picture", async () => {
			await renderWithProviders(<Avatar imageProps={{ testID: "photo" }} name="Aria Whitlock" source={PHOTO} />);
			expect(screen.getByTestId("photo")).toBeOnTheScreen();
			expect(screen.getByText("AW")).toBeOnTheScreen();
		});

		test("no source mounts no image", async () => {
			await renderWithProviders(<Avatar imageProps={{ testID: "photo" }} name="Aria Whitlock" />);
			expect(screen.queryByTestId("photo")).not.toBeOnTheScreen();
		});

		test("imageProps are forwarded to the image", async () => {
			await renderWithProviders(
				<Avatar imageProps={{ accessibilityLabel: "portrait", testID: "photo" }} name="Aria Whitlock" source={PHOTO} />
			);
			expect(screen.getByTestId("photo")).toHaveProp("accessibilityLabel", "portrait");
		});

		test("a failed load unmounts the image and still calls imageProps.onError", async () => {
			const onError = jest.fn();
			await renderWithProviders(
				<Avatar imageProps={{ onError, testID: "photo" }} name="Aria Whitlock" source={PHOTO} />
			);
			await fireEvent(screen.getByTestId("photo"), "error", { nativeEvent: { error: "404" } });
			expect(onError).toHaveBeenCalledTimes(1);
			expect(screen.queryByTestId("photo")).not.toBeOnTheScreen();
			expect(screen.getByText("AW")).toBeOnTheScreen();
		});

		test("an equal source passed as a new object does not retry a dead URL", async () => {
			const view = await renderWithProviders(
				<Avatar imageProps={{ testID: "photo" }} name="Aria Whitlock" source={{ uri: PHOTO.uri }} />
			);
			await fireEvent(screen.getByTestId("photo"), "error", { nativeEvent: { error: "404" } });
			await view.rerender(<Avatar imageProps={{ testID: "photo" }} name="Aria Whitlock" source={{ uri: PHOTO.uri }} />);
			expect(screen.queryByTestId("photo")).not.toBeOnTheScreen();
		});

		test("a different source is tried again", async () => {
			const view = await renderWithProviders(
				<Avatar imageProps={{ testID: "photo" }} name="Aria Whitlock" source={PHOTO} />
			);
			await fireEvent(screen.getByTestId("photo"), "error", { nativeEvent: { error: "404" } });
			expect(screen.queryByTestId("photo")).not.toBeOnTheScreen();
			await view.rerender(<Avatar imageProps={{ testID: "photo" }} name="Aria Whitlock" source={OTHER_PHOTO} />);
			expect(screen.getByTestId("photo")).toBeOnTheScreen();
		});
	});

	describe("interactive", () => {
		test("onPress makes the root a button named by name", async () => {
			const onPress = jest.fn();
			await renderWithProviders(<Avatar name="Aria Whitlock" onPress={onPress} />);
			await fireEvent(screen.getByRole("button", { name: "Aria Whitlock" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
			expect(screen.queryByRole("image")).not.toBeOnTheScreen();
		});

		test("onLongPress makes the root a button and fires on TalkBack's longpress action", async () => {
			const original = Platform.OS;
			Platform.OS = "android";
			try {
				const onLongPress = jest.fn();
				await renderWithProviders(<Avatar name="Aria Whitlock" onLongPress={onLongPress} />);
				await fireEvent(screen.getByRole("button", { name: "Aria Whitlock" }), "accessibilityAction", {
					nativeEvent: { actionName: "longpress" },
				});
				expect(onLongPress).toHaveBeenCalledTimes(1);
			} finally {
				Platform.OS = original;
			}
		});

		test("isDisabled is announced and blocks onPress and onLongPress", async () => {
			const onPress = jest.fn();
			const onLongPress = jest.fn();
			await renderWithProviders(<Avatar isDisabled name="Aria Whitlock" onLongPress={onLongPress} onPress={onPress} />);
			const button = screen.getByRole("button", { name: "Aria Whitlock" });
			expect(button).toBeDisabled();
			await fireEvent(button, "accessibilityTap");
			expect(onPress).not.toHaveBeenCalled();
			expect(onLongPress).not.toHaveBeenCalled();
		});
	});

	describe("compound parts", () => {
		test("children read the avatar's size, paint and state through useAvatar", async () => {
			await renderWithProviders(
				<Avatar color="success" isDisabled size="xl" variant="solid">
					<ContextProbe />
				</Avatar>
			);
			expect(screen.getByTestId("probe")).toHaveTextContent("xl|solid|success|true");
		});

		test("defaults are md, soft, default and enabled", async () => {
			await renderWithProviders(
				<Avatar>
					<ContextProbe />
				</Avatar>
			);
			expect(screen.getByTestId("probe")).toHaveTextContent("md|soft|default|false");
		});

		test("the whole avatar is one accessible element, so a badge is not focusable alone", async () => {
			await renderWithProviders(
				<Avatar accessibilityLabel="Aria Whitlock, online" name="Aria Whitlock" testID="avatar">
					<Avatar.Badge testID="dot" />
				</Avatar>
			);
			expect(screen.getByTestId("avatar")).toHaveProp("accessible", true);
			expect(screen.getByTestId("dot")).not.toHaveProp("accessible", true);
		});

		test("an empty Avatar.Badge is a dot that ignores touches", async () => {
			await renderWithProviders(
				<Avatar name="Aria Whitlock">
					<Avatar.Badge testID="dot" />
				</Avatar>
			);
			expect(screen.getByTestId("dot")).toHaveProp("pointerEvents", "none");
		});

		test("Avatar.Badge with children pins them and lets touches through", async () => {
			await renderWithProviders(
				<Avatar name="Aria Whitlock">
					<Avatar.Badge placement="bottom-right" testID="pin">
						<Text>3</Text>
					</Avatar.Badge>
				</Avatar>
			);
			expect(screen.getByText("3")).toBeOnTheScreen();
			expect(screen.getByTestId("pin")).toHaveProp("pointerEvents", "box-none");
		});

		test("Avatar.Badge reads its size from the avatar", async () => {
			await renderWithProviders(
				<Avatar size="2xl">
					<Avatar.Badge>
						<SizeProbe testID="size" />
					</Avatar.Badge>
				</Avatar>
			);
			expect(screen.getByTestId("size")).toHaveTextContent("2xl");
		});
	});

	describe("Avatar.Group", () => {
		function people(count: number) {
			return Array.from({ length: count }, (_, index) => (
				<Avatar key={`person-${index}`} name={`Person${index} Name`} />
			));
		}

		test("is a list of listitems in written order", async () => {
			await renderWithProviders(<Avatar.Group testID="group">{people(3)}</Avatar.Group>);
			const group = screen.getByTestId("group");
			expect(group).toHaveProp("role", "list");
			expect(group.children).toHaveLength(3);
			for (const item of group.children) {
				expect(item).toHaveProp("role", "listitem");
			}
			expect(screen.getAllByRole("image").map((node) => node.props.accessibilityLabel)).toEqual([
				"Person0 Name",
				"Person1 Name",
				"Person2 Name",
			]);
		});

		test("max caps the faces and counts the rest", async () => {
			await renderWithProviders(<Avatar.Group max={3}>{people(5)}</Avatar.Group>);
			expect(screen.getAllByRole("image", { name: /Person/ })).toHaveLength(3);
			expect(screen.getByText("+2")).toBeOnTheScreen();
			expect(screen.getByLabelText("2 more")).toBeOnTheScreen();
		});

		test("total counts people never passed", async () => {
			await renderWithProviders(<Avatar.Group total={40}>{people(3)}</Avatar.Group>);
			expect(screen.getAllByRole("image", { name: /Person/ })).toHaveLength(3);
			expect(screen.getByText("+37")).toBeOnTheScreen();
		});

		test("no overflow tile when everyone fits", async () => {
			await renderWithProviders(
				<Avatar.Group max={5} testID="group">
					{people(3)}
				</Avatar.Group>
			);
			expect(screen.queryByText(/^\+/)).not.toBeOnTheScreen();
			expect(screen.getByTestId("group").children).toHaveLength(3);
		});

		test("a total below the child count is ignored", async () => {
			await renderWithProviders(<Avatar.Group total={1}>{people(3)}</Avatar.Group>);
			expect(screen.queryByText(/^\+/)).not.toBeOnTheScreen();
		});

		test("the overflow tile draws 99+ and reads the real number", async () => {
			await renderWithProviders(<Avatar.Group total={1234}>{people(2)}</Avatar.Group>);
			expect(screen.getByText("99+")).toBeOnTheScreen();
			expect(screen.getByLabelText("1232 more")).toBeOnTheScreen();
		});

		test("the overflow tile is content without onOverflowPress", async () => {
			await renderWithProviders(<Avatar.Group max={1}>{people(3)}</Avatar.Group>);
			expect(screen.queryByRole("button")).not.toBeOnTheScreen();
		});

		test("onOverflowPress turns the tile into a button and fires", async () => {
			const onOverflowPress = jest.fn();
			await renderWithProviders(
				<Avatar.Group max={1} onOverflowPress={onOverflowPress}>
					{people(3)}
				</Avatar.Group>
			);
			await fireEvent(screen.getByRole("button", { name: "2 more" }), "accessibilityTap");
			expect(onOverflowPress).toHaveBeenCalledTimes(1);
		});

		test("the group's size reaches its avatars, and a child's own size wins", async () => {
			await renderWithProviders(
				<Avatar.Group size="lg">
					<Avatar>
						<SizeProbe testID="inherited" />
					</Avatar>
					<Avatar size="sm">
						<SizeProbe testID="own" />
					</Avatar>
				</Avatar.Group>
			);
			expect(screen.getByTestId("inherited")).toHaveTextContent("lg");
			expect(screen.getByTestId("own")).toHaveTextContent("sm");
		});

		test("non-element children are skipped", async () => {
			await renderWithProviders(
				<Avatar.Group testID="group">
					{null}
					{false}
					<Avatar name="Aria Whitlock" />
				</Avatar.Group>
			);
			expect(screen.getByTestId("group").children).toHaveLength(1);
		});
	});

	describe("outside an Avatar", () => {
		let errorSpy: ReturnType<typeof jest.spyOn>;

		beforeEach(() => {
			errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		});

		afterEach(() => {
			errorSpy.mockRestore();
		});

		test("Avatar.Badge throws its documented error", async () => {
			await expect(renderWithProviders(<Avatar.Badge />)).rejects.toThrow(
				"Avatar.Badge must be rendered inside an <Avatar>."
			);
		});

		test("useAvatar throws its documented error", async () => {
			await expect(renderWithProviders(<ContextProbe />)).rejects.toThrow(
				"useAvatar must be called inside an <Avatar>."
			);
		});
	});
});
