import { describe, expect, jest, test } from "@jest/globals";
import { createRef } from "react";
import { Platform, Pressable, Text } from "react-native";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { FlipCard, type FlipCardHandle, type FlipCardProps } from "./flip-card";
import { useFlipCard } from "./flip-card.context";

const activate = { nativeEvent: { actionName: "activate" } };

function flipButton() {
	return screen.getByRole("button", { name: "Flip card" });
}

async function withPlatform(os: "ios" | "android", run: () => Promise<void>) {
	const original = Platform.OS;
	Platform.OS = os;
	try {
		await run();
	} finally {
		Platform.OS = original;
	}
}

function Faces() {
	return (
		<>
			<FlipCard.Front>
				<Text>Bonjour</Text>
			</FlipCard.Front>
			<FlipCard.Back>
				<Text>Hello</Text>
			</FlipCard.Back>
		</>
	);
}

function Card(props: Partial<FlipCardProps>) {
	return (
		<FlipCard accessibilityLabel="Flashcard" {...(props as FlipCardProps)}>
			<Faces />
		</FlipCard>
	);
}

function expectFront() {
	expect(screen.getByText("Bonjour")).toBeOnTheScreen();
	expect(screen.queryByText("Hello")).not.toBeOnTheScreen();
}

function expectBack() {
	expect(screen.getByText("Hello")).toBeOnTheScreen();
	expect(screen.queryByText("Bonjour")).not.toBeOnTheScreen();
}

describe("FlipCard", () => {
	test("renders both faces, the card named and the back hidden from assistive tech", async () => {
		await renderWithProviders(<Card />);
		expect(screen.getByLabelText("Flashcard")).toBeOnTheScreen();
		expectFront();
		expect(screen.getByText("Hello", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("defaultFace=back starts on the back and hides the front", async () => {
		await renderWithProviders(<Card defaultFace="back" />);
		expectBack();
	});

	test("press: the Flip card button turns the card on Android's activate", async () => {
		const onFaceChange = jest.fn();
		await withPlatform("android", async () => {
			await renderWithProviders(<Card onFaceChange={onFaceChange} />);
			expect(flipButton()).toHaveProp("accessibilityActions", [{ name: "activate" }]);
			expect(flipButton()).not.toHaveProp("onAccessibilityTap");
			expect(flipButton()).toHaveProp("accessibilityHint", "Shows the back");

			await fireEvent(flipButton(), "accessibilityAction", activate);
			expectBack();
			expect(onFaceChange).toHaveBeenLastCalledWith("back");

			await fireEvent(flipButton(), "accessibilityAction", activate);
			expectFront();
			expect(onFaceChange).toHaveBeenCalledTimes(2);
		});
	});

	test("press: VoiceOver's double-tap on the Flip card button turns the card on iOS", async () => {
		const onFaceChange = jest.fn();
		await withPlatform("ios", async () => {
			await renderWithProviders(<Card onFaceChange={onFaceChange} />);
			expect(flipButton()).not.toHaveProp("accessibilityActions", expect.arrayContaining([{ name: "activate" }]));
			await fireEvent(flipButton(), "accessibilityTap");
			expectBack();
			expect(onFaceChange).toHaveBeenCalledWith("back");
		});
	});

	test("press: the root and the face stay containers; only the button is a new element", async () => {
		const view = await renderWithProviders(<Card />);
		const root = screen.getByLabelText("Flashcard");
		expect(root).toHaveProp("accessible", false);
		expect(root).not.toHaveProp("accessibilityActions");
		expect(flipButton()).toHaveProp("pointerEvents", "none");

		await view.rerender(<Card trigger="manual" />);
		expect(screen.queryByRole("button", { name: "Flip card" })).not.toBeOnTheScreen();
	});

	test("press: a control on a face is still its own element, and only the visible face has the button", async () => {
		const onCopy = jest.fn();
		await renderWithProviders(
			<FlipCard accessibilityLabel="Flashcard" defaultFace="back">
				<FlipCard.Front>
					<Text>Bonjour</Text>
				</FlipCard.Front>
				<FlipCard.Back>
					<Pressable accessibilityRole="button" onPress={onCopy}>
						<Text>Copy</Text>
					</Pressable>
				</FlipCard.Back>
			</FlipCard>
		);
		expect(screen.getByRole("button", { name: "Copy" })).toBeOnTheScreen();
		expect(screen.getAllByRole("button")).toHaveLength(2);
		expect(flipButton()).toHaveProp("accessibilityHint", "Shows the front");
	});

	test("controlled: reports the turn and waits for the face prop", async () => {
		const onFaceChange = jest.fn();
		const view = await renderWithProviders(<Card face="front" onFaceChange={onFaceChange} />);

		await fireEvent(flipButton(), "accessibilityTap");
		expect(onFaceChange).toHaveBeenCalledWith("back");
		expectFront();

		await view.rerender(<Card face="back" onFaceChange={onFaceChange} />);
		expectBack();
	});

	test("isDisabled is announced and the Flip card button consumes Android's activate without flipping", async () => {
		const onFaceChange = jest.fn();
		await withPlatform("android", async () => {
			await renderWithProviders(<Card isDisabled onFaceChange={onFaceChange} />);
			expect(flipButton()).toBeDisabled();
			await fireEvent(flipButton(), "accessibilityAction", activate);
		});
		expect(onFaceChange).not.toHaveBeenCalled();
		expectFront();
	});

	test("a disabled card consumes VoiceOver's double-tap without flipping", async () => {
		const onFaceChange = jest.fn();
		await withPlatform("ios", async () => {
			await renderWithProviders(<Card isDisabled onFaceChange={onFaceChange} />);
			await fireEvent(flipButton(), "accessibilityTap");
		});
		expect(onFaceChange).not.toHaveBeenCalled();
		expectFront();
	});

	test("the ref turns a disabled card, flipTo is a no-op on the showing face", async () => {
		const ref = createRef<FlipCardHandle>();
		const onFaceChange = jest.fn();
		await renderWithProviders(
			<FlipCard isDisabled onFaceChange={onFaceChange} ref={ref}>
				<Faces />
			</FlipCard>
		);

		await act(async () => ref.current?.flipTo("front"));
		expect(onFaceChange).not.toHaveBeenCalled();

		await act(async () => ref.current?.flip());
		expectBack();
		expect(onFaceChange).toHaveBeenCalledWith("back");

		await act(async () => ref.current?.flipTo("front"));
		expectFront();
	});

	test("swipe: the visible face is one element carrying the Flip card action", async () => {
		const onFaceChange = jest.fn();
		await renderWithProviders(<Card trigger="swipe" onFaceChange={onFaceChange} />);

		const [root, front, ...others] = screen.getAllByLabelText("Flashcard");
		expect(root).toHaveProp("accessible", false);
		expect(others).toHaveLength(0);
		expect(front).toHaveProp("accessible", true);
		await fireEvent(front, "accessibilityAction", activate);
		expect(onFaceChange).toHaveBeenCalledWith("back");
		expectBack();
	});

	test("FlipCard.Trigger turns to the other face and names itself", async () => {
		const onFaceChange = jest.fn();
		await renderWithProviders(
			<FlipCard trigger="manual" onFaceChange={onFaceChange}>
				<Faces />
				<FlipCard.Trigger />
			</FlipCard>
		);
		const trigger = screen.getByRole("button", { name: "Flip card" });
		expect(trigger).toHaveProp("accessibilityHint", "Shows the back");

		await fireEvent(trigger, "accessibilityTap");
		expectBack();
		expect(onFaceChange).toHaveBeenCalledWith("back");
		expect(screen.getByRole("button", { name: "Flip card" })).toHaveProp("accessibilityHint", "Shows the front");
	});

	test("FlipCard.Trigger to=front is a no-op on the front, to=back turns", async () => {
		const onFaceChange = jest.fn();
		await renderWithProviders(
			<FlipCard trigger="manual" onFaceChange={onFaceChange}>
				<Faces />
				<FlipCard.Trigger to="front">
					<Text>Front</Text>
				</FlipCard.Trigger>
				<FlipCard.Trigger to="back">
					<Text>Back</Text>
				</FlipCard.Trigger>
			</FlipCard>
		);
		await fireEvent(screen.getByRole("button", { name: "Front" }), "accessibilityTap");
		expect(onFaceChange).not.toHaveBeenCalled();

		await fireEvent(screen.getByRole("button", { name: "Back" }), "accessibilityTap");
		expect(onFaceChange).toHaveBeenCalledWith("back");
		expectBack();
	});

	test("FlipCard.Trigger is blocked by the card's isDisabled and its own disabled", async () => {
		const onFaceChange = jest.fn();
		const view = await renderWithProviders(
			<FlipCard trigger="manual" isDisabled onFaceChange={onFaceChange}>
				<Faces />
				<FlipCard.Trigger />
			</FlipCard>
		);
		expect(screen.getByRole("button", { name: "Flip card" })).toBeDisabled();
		await fireEvent(screen.getByRole("button", { name: "Flip card" }), "accessibilityTap");

		await view.rerender(
			<FlipCard trigger="manual" onFaceChange={onFaceChange}>
				<Faces />
				<FlipCard.Trigger disabled />
			</FlipCard>
		);
		expect(screen.getByRole("button", { name: "Flip card" })).toBeDisabled();
		await fireEvent(screen.getByRole("button", { name: "Flip card" }), "accessibilityTap");
		expect(onFaceChange).not.toHaveBeenCalled();
	});

	test("useFlipCard follows the face and turns the card from a custom child", async () => {
		function Reader() {
			const { face, flip } = useFlipCard();
			return <Text onPress={flip}>{`showing ${face}`}</Text>;
		}
		await renderWithProviders(
			<FlipCard trigger="manual">
				<Faces />
				<Reader />
			</FlipCard>
		);
		expect(screen.getByText("showing front")).toBeOnTheScreen();
		await fireEvent.press(screen.getByText("showing front"));
		expect(screen.getByText("showing back")).toBeOnTheScreen();
	});

	test("parts outside a FlipCard throw their documented errors", async () => {
		const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			await expect(
				renderWithProviders(
					<FlipCard.Front>
						<Text>x</Text>
					</FlipCard.Front>
				)
			).rejects.toThrow("FlipCard.Front must be rendered inside a <FlipCard>.");
			await expect(
				renderWithProviders(
					<FlipCard.Back>
						<Text>x</Text>
					</FlipCard.Back>
				)
			).rejects.toThrow("FlipCard.Back must be rendered inside a <FlipCard>.");
			await expect(renderWithProviders(<FlipCard.Trigger />)).rejects.toThrow(
				"FlipCard.Trigger must be rendered inside a <FlipCard>."
			);
			function Orphan() {
				useFlipCard();
				return null;
			}
			await expect(renderWithProviders(<Orphan />)).rejects.toThrow("useFlipCard must be called inside a <FlipCard>.");
		} finally {
			spy.mockRestore();
		}
	});

	test("a transparent back warns that the front shows through", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		try {
			await renderWithProviders(
				<FlipCard>
					<FlipCard.Front>
						<Text>Bonjour</Text>
					</FlipCard.Front>
					<FlipCard.Back variant="transparent">
						<Text>Hello</Text>
					</FlipCard.Back>
				</FlipCard>
			);
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("FlipCard.Back"));
		} finally {
			warn.mockRestore();
		}
	});
});
