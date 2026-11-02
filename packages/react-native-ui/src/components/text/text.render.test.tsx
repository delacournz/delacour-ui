import { describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Text } from "./text";
import { TextClassProvider, useTextClass } from "./text.context";
import { TEXT_MAX_FONT_SIZE_MULTIPLIER } from "./text.variants";

function ClassProbe(): ReactElement {
	const cascade = useTextClass();
	return <Text testID="probe">{cascade === undefined ? "none" : cascade}</Text>;
}

describe("Text", () => {
	test("renders its string child as readable text", async () => {
		await renderWithProviders(<Text>Hello</Text>);
		expect(screen.getByText("Hello")).toBeOnTheScreen();
	});

	test("forwards testID and accessibilityLabel", async () => {
		await renderWithProviders(
			<Text accessibilityLabel="Greeting" testID="greeting">
				Hello
			</Text>
		);
		expect(screen.getByTestId("greeting")).toHaveTextContent("Hello");
		expect(screen.getByLabelText("Greeting")).toBeOnTheScreen();
	});

	test("a bare Text has no heading or link role", async () => {
		await renderWithProviders(<Text>Plain</Text>);
		expect(screen.queryByRole("header")).not.toBeOnTheScreen();
		expect(screen.queryByRole("link")).not.toBeOnTheScreen();
	});

	test.each([
		["Display", Text.Display],
		["Title", Text.Title],
		["Header", Text.Header],
	] as const)("%s is announced as a heading", async (name, Preset) => {
		await renderWithProviders(<Preset>{name} copy</Preset>);
		expect(screen.getByRole("header", { name: `${name} copy` })).toBeOnTheScreen();
	});

	test.each([
		["Subheader", Text.Subheader],
		["Paragraph", Text.Paragraph],
		["Label", Text.Label],
		["Caption", Text.Caption],
		["Overline", Text.Overline],
		["Kicker", Text.Kicker],
		["Strong", Text.Strong],
		["Emphasis", Text.Emphasis],
		["Code", Text.Code],
	] as const)("%s is not announced as a heading or link", async (name, Preset) => {
		await renderWithProviders(<Preset>{name} copy</Preset>);
		expect(screen.getByText(`${name} copy`)).toBeOnTheScreen();
		expect(screen.queryByRole("header")).not.toBeOnTheScreen();
		expect(screen.queryByRole("link")).not.toBeOnTheScreen();
	});

	test("Link is announced as a link and calls onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(<Text.Link onPress={onPress}>Docs</Text.Link>);
		const link = screen.getByRole("link", { name: "Docs" });
		await fireEvent.press(link);
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("a preset's accessibilityRole can be overridden by the caller", async () => {
		await renderWithProviders(<Text.Title accessibilityRole="text">Quiet</Text.Title>);
		expect(screen.queryByRole("header")).not.toBeOnTheScreen();
		expect(screen.getByRole("text", { name: "Quiet" })).toBeOnTheScreen();
	});

	test("nested Text renders inline inside its parent's content", async () => {
		await renderWithProviders(
			<Text testID="outer">
				Run <Text.Code>npm test</Text.Code> now
			</Text>
		);
		expect(screen.getByTestId("outer")).toHaveTextContent("Run npm test now");
		expect(screen.getByText("npm test")).toBeOnTheScreen();
	});

	test("a nested Link inside prose stays a link and fires onPress", async () => {
		const onPress = jest.fn();
		await renderWithProviders(
			<Text.Paragraph>
				See <Text.Link onPress={onPress}>the docs</Text.Link> for more
			</Text.Paragraph>
		);
		await fireEvent.press(screen.getByRole("link", { name: "the docs" }));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("maxFontSizeMultiplier defaults to the cap and stays overridable", async () => {
		await renderWithProviders(
			<>
				<Text testID="default">a</Text>
				<Text maxFontSizeMultiplier={3} testID="custom">
					b
				</Text>
			</>
		);
		expect(screen.getByTestId("default").props.maxFontSizeMultiplier).toBe(TEXT_MAX_FONT_SIZE_MULTIPLIER);
		expect(screen.getByTestId("custom").props.maxFontSizeMultiplier).toBe(3);
	});

	test("allowFontScaling is left to React Native unless the caller sets it", async () => {
		await renderWithProviders(
			<>
				<Text testID="default">a</Text>
				<Text allowFontScaling={false} testID="fixed">
					b
				</Text>
			</>
		);
		expect(screen.getByTestId("default").props.allowFontScaling).toBeUndefined();
		expect(screen.getByTestId("fixed").props.allowFontScaling).toBe(false);
	});

	test("accessibility props pass through to the host text", async () => {
		await renderWithProviders(
			<Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="hidden">
				Decorative
			</Text>
		);
		const host = screen.getByTestId("hidden", { hidden: true });
		expect(host.props.accessibilityElementsHidden).toBe(true);
		expect(host.props.importantForAccessibility).toBe("no-hide-descendants");
		expect(screen.queryByText("Decorative")).not.toBeOnTheScreen();
	});

	test("numbers render as text", async () => {
		await renderWithProviders(<Text>{42}</Text>);
		expect(screen.getByText("42")).toBeOnTheScreen();
	});

	describe("class cascade context", () => {
		test("useTextClass is undefined outside any Text", async () => {
			await renderWithProviders(<ClassProbe />);
			expect(screen.getByTestId("probe")).toHaveTextContent("none");
		});

		test("a Text with element children publishes its resolved class to the subtree", async () => {
			await renderWithProviders(
				<Text variant="title">
					<ClassProbe />
				</Text>
			);
			const published = screen.getByTestId("probe").props.children;
			expect(typeof published).toBe("string");
			expect(published).not.toBe("none");
		});

		test("a TextClassProvider's value reaches useTextClass", async () => {
			await renderWithProviders(
				<TextClassProvider value="text-red-500">
					<ClassProbe />
				</TextClassProvider>
			);
			expect(screen.getByTestId("probe").props.children).toContain("text-red-500");
		});

		test("a TextClassProvider with undefined resets the cascade", async () => {
			await renderWithProviders(
				<TextClassProvider value="text-red-500">
					<TextClassProvider value={undefined}>
						<ClassProbe />
					</TextClassProvider>
				</TextClassProvider>
			);
			expect(screen.getByTestId("probe")).toHaveTextContent("none");
		});
	});

	test("every part carries a DelacourUI display name", () => {
		expect(Text.displayName).toBe("DelacourUI.Text");
		for (const part of [
			Text.Display,
			Text.Title,
			Text.Header,
			Text.Subheader,
			Text.Paragraph,
			Text.Label,
			Text.Caption,
			Text.Overline,
			Text.Kicker,
			Text.Strong,
			Text.Emphasis,
			Text.Link,
			Text.Code,
		]) {
			expect(part.displayName).toMatch(/^DelacourUI\.Text\./);
		}
	});
});
