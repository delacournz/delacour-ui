import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { act, fireEvent, renderWithProviders, screen } from "../../test/render";
import { Text } from "../text";
import { Carousel, type CarouselProps } from "./index";

const SLIDES = ["One", "Two", "Three"] as const;

type TestCarouselProps = Partial<CarouselProps> & { withControls?: boolean };

function TestCarousel({ withControls = true, ...props }: TestCarouselProps): ReactElement {
	const root = { accessibilityLabel: "Featured", ...props } as CarouselProps;
	return (
		<Carousel {...root}>
			<Carousel.Content>
				{SLIDES.map((title) => (
					<Carousel.Item key={title}>
						<Text>{title}</Text>
						<Carousel.Caption>{`${title} caption`}</Carousel.Caption>
					</Carousel.Item>
				))}
			</Carousel.Content>
			{withControls ? (
				<Carousel.Controls>
					<Carousel.Previous />
					<Carousel.Dots testID="dots" />
					<Carousel.Next />
				</Carousel.Controls>
			) : null}
		</Carousel>
	);
}

const HIDDEN = { includeHiddenElements: true } as const;

function slide(title: string) {
	return screen.getByText(title, HIDDEN);
}

function viewport() {
	return screen.getByRole("adjustable", { name: "Featured" });
}

async function adjust(action: "increment" | "decrement") {
	await fireEvent(viewport(), "accessibilityAction", { nativeEvent: { actionName: action } });
}

async function press(name: string) {
	await fireEvent(screen.getByRole("button", { name }), "accessibilityTap");
}

describe("Carousel", () => {
	test("is an adjustable named by its label and read as 'n of count'", async () => {
		await renderWithProviders(<TestCarousel />);
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 3" });
		expect(viewport()).not.toBeDisabled();
	});

	test("mounts its slides", async () => {
		await renderWithProviders(<TestCarousel />);
		for (const title of SLIDES) expect(slide(title)).toBeOnTheScreen();
	});

	test("an assistive increment and decrement move a slide and report it", async () => {
		const onIndexChange = jest.fn();
		await renderWithProviders(<TestCarousel onIndexChange={onIndexChange} />);

		await adjust("increment");
		expect(viewport()).toHaveAccessibilityValue({ text: "2 of 3" });
		expect(onIndexChange).toHaveBeenLastCalledWith(1);

		await adjust("decrement");
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 3" });
		expect(onIndexChange).toHaveBeenLastCalledWith(0);
		expect(onIndexChange).toHaveBeenCalledTimes(2);
	});

	test("does not move past the ends unless looping", async () => {
		const onIndexChange = jest.fn();
		await renderWithProviders(<TestCarousel onIndexChange={onIndexChange} />);
		await adjust("decrement");
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 3" });
		expect(onIndexChange).not.toHaveBeenCalled();
	});

	test("loop wraps both ways", async () => {
		await renderWithProviders(<TestCarousel loop />);
		await adjust("decrement");
		expect(viewport()).toHaveAccessibilityValue({ text: "3 of 3" });
		await adjust("increment");
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 3" });
	});

	test("uncontrolled: defaultIndex seeds it", async () => {
		await renderWithProviders(<TestCarousel defaultIndex={2} />);
		expect(viewport()).toHaveAccessibilityValue({ text: "3 of 3" });
	});

	test("controlled: reports the change and waits for the prop", async () => {
		const onIndexChange = jest.fn();
		const view = await renderWithProviders(<TestCarousel index={0} onIndexChange={onIndexChange} />);

		await adjust("increment");
		expect(onIndexChange).toHaveBeenCalledWith(1);
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 3" });

		await view.rerender(<TestCarousel index={1} onIndexChange={onIndexChange} />);
		expect(viewport()).toHaveAccessibilityValue({ text: "2 of 3" });
	});

	test("a controlled index past the end is clamped and reported once", async () => {
		const onIndexChange = jest.fn();
		await renderWithProviders(<TestCarousel index={9} onIndexChange={onIndexChange} />);
		expect(viewport()).toHaveAccessibilityValue({ text: "3 of 3" });
		expect(onIndexChange).toHaveBeenCalledTimes(1);
		expect(onIndexChange).toHaveBeenCalledWith(2);
	});

	test("isDisabled is announced and ignores assistive adjustment", async () => {
		const onIndexChange = jest.fn();
		await renderWithProviders(<TestCarousel isDisabled onIndexChange={onIndexChange} />);
		expect(viewport()).toBeDisabled();
		await adjust("increment");
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 3" });
		expect(onIndexChange).not.toHaveBeenCalled();
	});

	test("Previous and Next are buttons that move a slide", async () => {
		const onIndexChange = jest.fn();
		await renderWithProviders(<TestCarousel onIndexChange={onIndexChange} />);

		await press("Next slide");
		expect(viewport()).toHaveAccessibilityValue({ text: "2 of 3" });
		expect(onIndexChange).toHaveBeenLastCalledWith(1);

		await press("Previous slide");
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 3" });
		expect(onIndexChange).toHaveBeenLastCalledWith(0);
	});

	test("Previous is disabled at the start and Next at the end, unless looping", async () => {
		const view = await renderWithProviders(<TestCarousel />);
		expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Next slide" })).not.toBeDisabled();

		await press("Next slide");
		await press("Next slide");
		expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Previous slide" })).not.toBeDisabled();

		await view.rerender(<TestCarousel loop />);
		expect(screen.getByRole("button", { name: "Next slide" })).not.toBeDisabled();
	});

	test("isDisabled disables both arrows and they do not fire", async () => {
		const onIndexChange = jest.fn();
		await renderWithProviders(<TestCarousel isDisabled onIndexChange={onIndexChange} />);
		expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
		await press("Next slide");
		expect(onIndexChange).not.toHaveBeenCalled();
	});

	test("an arrow's label can be replaced", async () => {
		await renderWithProviders(
			<Carousel accessibilityLabel="Featured">
				<Carousel.Content>
					<Carousel.Item>
						<Text>A</Text>
					</Carousel.Item>
					<Carousel.Item>
						<Text>B</Text>
					</Carousel.Item>
				</Carousel.Content>
				<Carousel.Next accessibilityLabel="Forward" />
			</Carousel>
		);
		expect(screen.getByRole("button", { name: "Forward" })).toBeOnTheScreen();
	});

	test("Dots are decoration hidden from assistive tech, and absent with one slide", async () => {
		const view = await renderWithProviders(<TestCarousel />);
		const dots = screen.getByTestId("dots", { includeHiddenElements: true });
		expect(dots).toHaveProp("accessibilityElementsHidden", true);

		await view.rerender(
			<Carousel accessibilityLabel="Featured">
				<Carousel.Content>
					<Carousel.Item>
						<Text>Only</Text>
					</Carousel.Item>
				</Carousel.Content>
				<Carousel.Dots testID="dots" />
			</Carousel>
		);
		expect(screen.queryByTestId("dots", { includeHiddenElements: true })).not.toBeOnTheScreen();
	});

	test("a single slide offers no assistive actions", async () => {
		await renderWithProviders(
			<Carousel accessibilityLabel="Featured">
				<Carousel.Content>
					<Carousel.Item>
						<Text>Only</Text>
					</Carousel.Item>
				</Carousel.Content>
			</Carousel>
		);
		expect(viewport()).toHaveAccessibilityValue({ text: "1 of 1" });
		expect(viewport()).not.toHaveProp("accessibilityActions");
	});

	test("only a window of slides is mounted around the active one", async () => {
		const titles = ["a", "b", "c", "d", "e", "f", "g", "h"];
		await renderWithProviders(
			<Carousel accessibilityLabel="Featured" windowSize={1}>
				<Carousel.Content>
					{titles.map((title) => (
						<Carousel.Item key={title}>
							<Text>{`slide-${title}`}</Text>
						</Carousel.Item>
					))}
				</Carousel.Content>
			</Carousel>
		);
		expect(screen.getByText("slide-a", HIDDEN)).toBeOnTheScreen();
		expect(screen.getByText("slide-b", HIDDEN)).toBeOnTheScreen();
		expect(screen.queryByText("slide-c", HIDDEN)).not.toBeOnTheScreen();
		expect(screen.queryByText("slide-h", HIDDEN)).not.toBeOnTheScreen();

		await adjust("increment");
		expect(screen.getByText("slide-c", HIDDEN)).toBeOnTheScreen();
		expect(screen.getByText("slide-a", HIDDEN)).toBeOnTheScreen();
	});

	test("a shrinking run clamps the index and reports it", async () => {
		const onIndexChange = jest.fn();
		const view = await renderWithProviders(<TestCarousel defaultIndex={2} onIndexChange={onIndexChange} />);
		await view.rerender(
			<Carousel accessibilityLabel="Featured" defaultIndex={2} onIndexChange={onIndexChange}>
				<Carousel.Content>
					<Carousel.Item>
						<Text>One</Text>
					</Carousel.Item>
					<Carousel.Item>
						<Text>Two</Text>
					</Carousel.Item>
				</Carousel.Content>
			</Carousel>
		);
		expect(viewport()).toHaveAccessibilityValue({ text: "2 of 2" });
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
	});

	describe("pan", () => {
		test("a drag past half a slide commits the next index", async () => {
			const onIndexChange = jest.fn();
			await renderWithProviders(<TestCarousel onIndexChange={onIndexChange} />);
			await act(async () => {
				fireGestureHandler(getByGestureTestId("carousel-pan"), [
					{ translationX: 0, velocityX: 0 },
					{ translationX: -5, velocityX: -500 },
					{ translationX: -200, velocityX: -500 },
					{ translationX: -200, velocityX: -500 },
				]);
			});
			expect(onIndexChange).toHaveBeenCalledTimes(1);
			expect(onIndexChange).toHaveBeenCalledWith(1);
		});

		test("isScrollEnabled false and isDisabled leave the pan off", async () => {
			await renderWithProviders(<TestCarousel isScrollEnabled={false} />);
			expect(getByGestureTestId("carousel-pan").config.enabled).toBe(false);
		});
	});

	describe("autoplay", () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});
		afterEach(() => {
			jest.useRealTimers();
		});

		test("advances on its interval", async () => {
			const onIndexChange = jest.fn();
			await renderWithProviders(<TestCarousel autoplay autoplayInterval={1000} onIndexChange={onIndexChange} />);
			await act(async () => {
				jest.advanceTimersByTime(1000);
			});
			expect(onIndexChange).toHaveBeenLastCalledWith(1);
		});

		test("stops for good after a manual move", async () => {
			const onIndexChange = jest.fn();
			await renderWithProviders(<TestCarousel autoplay autoplayInterval={1000} onIndexChange={onIndexChange} />);
			await press("Next slide");
			expect(onIndexChange).toHaveBeenCalledTimes(1);
			await act(async () => {
				jest.advanceTimersByTime(5000);
			});
			expect(onIndexChange).toHaveBeenCalledTimes(1);
		});

		test("does not run while disabled", async () => {
			const onIndexChange = jest.fn();
			await renderWithProviders(
				<TestCarousel autoplay autoplayInterval={1000} isDisabled onIndexChange={onIndexChange} />
			);
			await act(async () => {
				jest.advanceTimersByTime(5000);
			});
			expect(onIndexChange).not.toHaveBeenCalled();
		});
	});

	describe("outside its root", () => {
		const parts: ReadonlyArray<readonly [string, ReactElement]> = [
			["Carousel.Content", <Carousel.Content key="c">{null}</Carousel.Content>],
			["Carousel.Next", <Carousel.Next key="n" />],
			["Carousel.Previous", <Carousel.Previous key="p" />],
			["Carousel.Dots", <Carousel.Dots key="d" />],
		];

		for (const [name, element] of parts) {
			test(`${name} throws`, async () => {
				const original = console.error;
				console.error = () => undefined;
				try {
					await expect(renderWithProviders(element)).rejects.toThrow(`${name} must be rendered inside a <Carousel>.`);
				} finally {
					console.error = original;
				}
			});
		}

		test("Carousel.Item outside a Content throws", async () => {
			const original = console.error;
			console.error = () => undefined;
			try {
				await expect(
					renderWithProviders(
						<Carousel>
							<Carousel.Item>
								<Text>x</Text>
							</Carousel.Item>
						</Carousel>
					)
				).rejects.toThrow("must be rendered inside a <Carousel");
			} finally {
				console.error = original;
			}
		});
	});
});
