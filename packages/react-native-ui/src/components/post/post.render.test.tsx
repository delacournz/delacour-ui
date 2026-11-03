import { describe, expect, jest, test } from "@jest/globals";
import { Platform } from "react-native";
import { IconBubble2, IconHeart } from "../../icons/central";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Post } from "./post";
import { usePost } from "./post.context";

/** Runs `body` with `console.error` silenced, since React logs a thrown render before rethrowing it. */
async function withSilencedErrors(body: () => Promise<void>): Promise<void> {
	const original = console.error;
	console.error = () => undefined;
	try {
		await body();
	} finally {
		console.error = original;
	}
}

describe("Post", () => {
	test("renders its parts and the title is a header", async () => {
		await renderWithProviders(
			<Post variant="vote">
				<Post.Header>
					<Post.Community meta="5h ago" name="r/reactnative" />
				</Post.Header>
				<Post.Title>Reanimated 4 is out</Post.Title>
				<Post.Body>Plain text</Post.Body>
				<Post.Footer>
					<Post.Stat icon={IconBubble2} label="Reply" value={12} />
				</Post.Footer>
			</Post>
		);
		expect(screen.getByRole("header", { name: "Reanimated 4 is out" })).toBeOnTheScreen();
		expect(screen.getByText("Plain text")).toBeOnTheScreen();
		expect(screen.getByLabelText("r/reactnative, 5h ago")).toBeOnTheScreen();
	});

	test("a card with onPress reports it, and not when disabled", async () => {
		const onPress = jest.fn();
		const onLongPress = jest.fn();
		const view = await renderWithProviders(
			<Post onLongPress={onLongPress} onPress={onPress} testID="card">
				<Post.Body>Hi</Post.Body>
			</Post>
		);
		const card = screen.getByTestId("card");
		await fireEvent(card, "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);

		await view.rerender(
			<Post disabled onLongPress={onLongPress} onPress={onPress} testID="card">
				<Post.Body>Hi</Post.Body>
			</Post>
		);
		await fireEvent(screen.getByTestId("card"), "accessibilityTap");
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("on Android the card answers activate and longpress, and ignores them when disabled", async () => {
		const platform = Platform.OS;
		Platform.OS = "android";
		try {
			const onPress = jest.fn();
			const onLongPress = jest.fn();
			const view = await renderWithProviders(
				<Post onLongPress={onLongPress} onPress={onPress} testID="card">
					<Post.Body>Hi</Post.Body>
				</Post>
			);
			await fireEvent(screen.getByTestId("card"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
			await fireEvent(screen.getByTestId("card"), "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
			expect(onPress).toHaveBeenCalledTimes(1);
			expect(onLongPress).toHaveBeenCalledTimes(1);

			await view.rerender(
				<Post disabled onLongPress={onLongPress} onPress={onPress} testID="card">
					<Post.Body>Hi</Post.Body>
				</Post>
			);
			await fireEvent(screen.getByTestId("card"), "accessibilityAction", { nativeEvent: { actionName: "activate" } });
			await fireEvent(screen.getByTestId("card"), "accessibilityAction", { nativeEvent: { actionName: "longpress" } });
			expect(onPress).toHaveBeenCalledTimes(1);
			expect(onLongPress).toHaveBeenCalledTimes(1);
		} finally {
			Platform.OS = platform;
		}
	});

	test("a pressable card does not swallow its children", async () => {
		const onLike = jest.fn();
		await renderWithProviders(
			<Post onPress={jest.fn()}>
				<Post.Footer>
					<Post.Stat icon={IconHeart} label="Like" onPress={onLike} tone="like" value={3} />
				</Post.Footer>
			</Post>
		);
		await fireEvent(screen.getByRole("button", { name: "Like, 3" }), "accessibilityTap");
		expect(onLike).toHaveBeenCalledTimes(1);
	});

	test("usePost reads the variant and size, and throws outside a Post", async () => {
		function Probe() {
			const { variant, size } = usePost();
			return <Post.Title>{`${variant}-${size}`}</Post.Title>;
		}
		await renderWithProviders(
			<Post size="sm" variant="compact">
				<Probe />
			</Post>
		);
		expect(screen.getByText("compact-sm")).toBeOnTheScreen();

		await withSilencedErrors(async () => {
			await expect(renderWithProviders(<Probe />)).rejects.toThrow("usePost must be called inside a <Post>.");
		});
	});

	test.each([
		["Post.Header", () => <Post.Header />],
		["Post.Author", () => <Post.Author name="Aria" />],
		["Post.Community", () => <Post.Community name="r/rn" />],
		["Post.Action", () => <Post.Action accessibilityLabel="More" />],
		["Post.Title", () => <Post.Title>T</Post.Title>],
		["Post.Body", () => <Post.Body>B</Post.Body>],
		["Post.Media", () => <Post.Media alt="x" />],
		["Post.Footer", () => <Post.Footer />],
		["Post.Stat", () => <Post.Stat icon={IconHeart} label="Like" />],
		["Post.Votes", () => <Post.Votes score={1} />],
	])("%s outside a Post throws its documented error", async (name, part) => {
		await withSilencedErrors(async () => {
			await expect(renderWithProviders(part())).rejects.toThrow(`${name} must be rendered inside a <Post>.`);
		});
	});

	describe("Author", () => {
		const now = new Date("2026-01-01T12:00:00Z");
		const date = new Date("2026-01-01T11:57:00Z");

		test("is one static stop with a spoken label", async () => {
			await renderWithProviders(
				<Post>
					<Post.Author date={date} handle="@aria" name="Aria Whitlock" now={now} verified />
				</Post>
			);
			const author = screen.getByLabelText("Aria Whitlock, @aria, verified, 3 minutes ago");
			expect(author).toBeOnTheScreen();
			expect(author.props.accessible).toBe(true);
		});

		test("timestamp wins over date and accessibilityLabel wins over both", async () => {
			await renderWithProviders(
				<Post>
					<Post.Author date={date} name="Aria" now={now} timestamp="yesterday" />
					<Post.Author accessibilityLabel="Custom" name="Bo" />
				</Post>
			);
			expect(screen.getByLabelText("Aria, yesterday")).toBeOnTheScreen();
			expect(screen.getByLabelText("Custom")).toBeOnTheScreen();
		});

		test("with onPress it is a button that opens the profile", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Post>
					<Post.Author name="Aria" onPress={onPress} />
				</Post>
			);
			await fireEvent(screen.getByRole("button", { name: "Aria" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});
	});

	describe("Community", () => {
		test("joins a string meta into its label, or uses the name alone", async () => {
			await renderWithProviders(
				<Post variant="vote">
					<Post.Community meta="u/aria" name="r/rn" />
					<Post.Community meta={<Post.Title>node</Post.Title>} name="r/other" />
				</Post>
			);
			expect(screen.getByLabelText("r/rn, u/aria")).toBeOnTheScreen();
			expect(screen.getByLabelText("r/other")).toBeOnTheScreen();
		});

		test("with onPress it is a button", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Post variant="vote">
					<Post.Community name="r/rn" onPress={onPress} />
				</Post>
			);
			await fireEvent(screen.getByRole("button", { name: "r/rn" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});
	});

	describe("Action", () => {
		test("is a named button that fires onPress and not when disabled", async () => {
			const onPress = jest.fn();
			const view = await renderWithProviders(
				<Post>
					<Post.Action accessibilityLabel="More" onPress={onPress} />
				</Post>
			);
			await fireEvent(screen.getByRole("button", { name: "More" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);

			await view.rerender(
				<Post>
					<Post.Action accessibilityLabel="More" disabled onPress={onPress} />
				</Post>
			);
			expect(screen.getByRole("button", { name: "More" })).toBeDisabled();
			await fireEvent(screen.getByRole("button", { name: "More" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});
	});

	describe("Body", () => {
		test("a tag, mention and link are links only with a handler, and report their values", async () => {
			const onTagPress = jest.fn();
			const onMentionPress = jest.fn();
			const onLinkPress = jest.fn();
			await renderWithProviders(
				<Post>
					<Post.Body onLinkPress={onLinkPress} onMentionPress={onMentionPress} onTagPress={onTagPress}>
						Ship #reactnative with @aria at https://delacour.co.nz
					</Post.Body>
				</Post>
			);
			await fireEvent.press(screen.getByRole("link", { name: "#reactnative" }));
			await fireEvent.press(screen.getByRole("link", { name: "@aria" }));
			await fireEvent.press(screen.getByRole("link", { name: "https://delacour.co.nz" }));
			expect(onTagPress).toHaveBeenCalledWith("reactnative");
			expect(onMentionPress).toHaveBeenCalledWith("aria");
			expect(onLinkPress).toHaveBeenCalledWith("https://delacour.co.nz");
		});

		test("without handlers the tokens are text, not links", async () => {
			await renderWithProviders(
				<Post>
					<Post.Body>Ship #reactnative</Post.Body>
				</Post>
			);
			expect(screen.getByText("#reactnative")).toBeOnTheScreen();
			expect(screen.queryByRole("link")).not.toBeOnTheScreen();
		});

		test("a node body is rendered as-is", async () => {
			await renderWithProviders(
				<Post>
					<Post.Body>
						<Post.Title>custom #notatag</Post.Title>
					</Post.Body>
				</Post>
			);
			expect(screen.getByText("custom #notatag")).toBeOnTheScreen();
		});

		test("expandable offers more only once the body overflows, then toggles", async () => {
			await renderWithProviders(
				<Post>
					<Post.Body expandable numberOfLines={2} testID="body">
						A long body of text
					</Post.Body>
				</Post>
			);
			expect(screen.queryByTestId("body-more")).not.toBeOnTheScreen();

			const lines = (count: number) => ({
				nativeEvent: { lines: Array.from({ length: count }, () => ({ text: "x" })) },
			});
			const twin = screen
				.getAllByText("A long body of text", { includeHiddenElements: true })
				.find((node) => typeof node.props.onTextLayout === "function");
			if (!twin) throw new Error("the measuring twin did not render");
			await fireEvent(twin, "textLayout", lines(1));
			expect(screen.queryByTestId("body-more")).not.toBeOnTheScreen();

			await fireEvent(twin, "textLayout", lines(4));
			expect(screen.getByRole("button", { name: "more" })).toBeOnTheScreen();

			await fireEvent.press(screen.getByRole("button", { name: "more" }));
			expect(screen.getByRole("button", { name: "less" })).toBeOnTheScreen();

			await fireEvent.press(screen.getByRole("button", { name: "less" }));
			expect(screen.getByRole("button", { name: "more" })).toBeOnTheScreen();
		});
	});

	describe("Media", () => {
		test("is an image named by alt", async () => {
			await renderWithProviders(
				<Post>
					<Post.Media alt="The analytical engine" source={{ uri: "https://example.com/a.png" }} />
				</Post>
			);
			expect(screen.getByRole("image", { name: "The analytical engine" })).toBeOnTheScreen();
		});

		test("alt of empty string is decorative and hidden from assistive technology", async () => {
			await renderWithProviders(
				<Post>
					<Post.Media alt="" source={{ uri: "https://example.com/a.png" }} testID="media" />
				</Post>
			);
			expect(screen.queryByRole("image")).not.toBeOnTheScreen();
			expect(screen.getByTestId("media", { includeHiddenElements: true }).props.accessible).toBe(false);
		});

		test("with onPress it is an image button", async () => {
			const onPress = jest.fn();
			await renderWithProviders(
				<Post>
					<Post.Media alt="Open photo" onPress={onPress} source={{ uri: "https://example.com/a.png" }} />
				</Post>
			);
			await fireEvent(screen.getByRole("imagebutton", { name: "Open photo" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("children replace the picture", async () => {
			await renderWithProviders(
				<Post>
					<Post.Media alt="Gallery">
						<Post.Title>slot</Post.Title>
					</Post.Media>
				</Post>
			);
			expect(screen.getByText("slot")).toBeOnTheScreen();
		});

		test("renders nothing in the compact variant and warns", async () => {
			const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
			try {
				await renderWithProviders(
					<Post variant="compact">
						<Post.Media alt="Hidden" source={{ uri: "https://example.com/a.png" }} />
					</Post>
				);
				expect(screen.queryByRole("image")).not.toBeOnTheScreen();
				expect(warn).toHaveBeenCalledWith(expect.stringContaining('"compact"'));
			} finally {
				warn.mockRestore();
			}
		});
	});

	describe("Stat", () => {
		test("announces the full number and the lit state", async () => {
			const view = await renderWithProviders(
				<Post>
					<Post.Stat icon={IconHeart} label="Like" tone="like" value={1234} />
				</Post>
			);
			const stat = screen.getByRole("button", { name: "Like, 1,234" });
			expect(stat).not.toBeSelected();

			await view.rerender(
				<Post>
					<Post.Stat active icon={IconHeart} label="Like" tone="like" value={1234} />
				</Post>
			);
			expect(screen.getByRole("button", { name: "Like, 1,234" })).toBeSelected();
		});

		test("fires onPress, and not when disabled", async () => {
			const onPress = jest.fn();
			const view = await renderWithProviders(
				<Post>
					<Post.Stat icon={IconHeart} label="Like" onPress={onPress} value={1} />
				</Post>
			);
			await fireEvent(screen.getByRole("button", { name: "Like, 1" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);

			await view.rerender(
				<Post>
					<Post.Stat disabled icon={IconHeart} label="Like" onPress={onPress} value={1} />
				</Post>
			);
			expect(screen.getByRole("button", { name: "Like, 1" })).toBeDisabled();
			await fireEvent(screen.getByRole("button", { name: "Like, 1" }), "accessibilityTap");
			expect(onPress).toHaveBeenCalledTimes(1);
		});

		test("accessibilityLabel overrides the built label; a glyph-only stat is still named", async () => {
			await renderWithProviders(
				<Post>
					<Post.Stat accessibilityLabel="Custom like" icon={IconHeart} label="Like" value={2} />
					<Post.Stat icon={IconBubble2} label="Reply" />
				</Post>
			);
			expect(screen.getByRole("button", { name: "Custom like" })).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Reply" })).toBeOnTheScreen();
		});
	});

	describe("Votes", () => {
		test("reads the score in full and names both arrows", async () => {
			await renderWithProviders(
				<Post variant="vote">
					<Post.Votes score={1240} />
				</Post>
			);
			expect(screen.getByLabelText("Score 1,240")).toBeOnTheScreen();
			expect(screen.getByRole("button", { name: "Upvote" })).not.toBeSelected();
			expect(screen.getByRole("button", { name: "Downvote" })).not.toBeSelected();
		});

		test("marks the cast arrow selected", async () => {
			await renderWithProviders(
				<Post variant="vote">
					<Post.Votes score={5} vote="down" />
				</Post>
			);
			expect(screen.getByRole("button", { name: "Downvote" })).toBeSelected();
			expect(screen.getByRole("button", { name: "Upvote" })).not.toBeSelected();
		});

		test("reports the next vote, and null when the cast arrow is pressed again", async () => {
			const onVote = jest.fn();
			const view = await renderWithProviders(
				<Post variant="vote">
					<Post.Votes onVote={onVote} score={5} />
				</Post>
			);
			await fireEvent(screen.getByRole("button", { name: "Upvote" }), "accessibilityTap");
			expect(onVote).toHaveBeenLastCalledWith("up");
			await fireEvent(screen.getByRole("button", { name: "Downvote" }), "accessibilityTap");
			expect(onVote).toHaveBeenLastCalledWith("down");

			await view.rerender(
				<Post variant="vote">
					<Post.Votes onVote={onVote} score={5} vote="up" />
				</Post>
			);
			await fireEvent(screen.getByRole("button", { name: "Upvote" }), "accessibilityTap");
			expect(onVote).toHaveBeenLastCalledWith(null);
		});

		test("isDisabled blocks both arrows", async () => {
			const onVote = jest.fn();
			await renderWithProviders(
				<Post variant="vote">
					<Post.Votes isDisabled onVote={onVote} score={5} />
				</Post>
			);
			expect(screen.getByRole("button", { name: "Upvote" })).toBeDisabled();
			await fireEvent(screen.getByRole("button", { name: "Upvote" }), "accessibilityTap");
			await fireEvent(screen.getByRole("button", { name: "Downvote" }), "accessibilityTap");
			expect(onVote).not.toHaveBeenCalled();
		});
	});
});
