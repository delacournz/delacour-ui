import { describe, expect, test } from "@jest/globals";
import { Text } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { Separator } from "./separator";

describe("Separator", () => {
	test("renders its host view, forwarding testID", async () => {
		await renderWithProviders(<Separator testID="rule" />);
		expect(screen.getByTestId("rule", { includeHiddenElements: true })).toBeOnTheScreen();
	});

	test("is hidden from a screen reader: absent from the default accessible query", async () => {
		await renderWithProviders(<Separator testID="rule" />);
		expect(screen.queryByTestId("rule")).not.toBeOnTheScreen();
	});

	test("is not an accessibility element and hides itself on both platforms", async () => {
		await renderWithProviders(<Separator testID="rule" />);
		const rule = screen.getByTestId("rule", { includeHiddenElements: true });
		expect(rule.props.accessible).toBe(false);
		expect(rule.props.accessibilityElementsHidden).toBe(true);
		expect(rule.props.importantForAccessibility).toBe("no-hide-descendants");
	});

	test.each(["horizontal", "vertical"] as const)("%s stays hidden from assistive technology", async (orientation) => {
		await renderWithProviders(<Separator orientation={orientation} testID="rule" />);
		const rule = screen.getByTestId("rule", { includeHiddenElements: true });
		expect(rule.props.accessibilityElementsHidden).toBe(true);
		expect(rule.props.accessible).toBe(false);
	});

	test("siblings stay readable around it", async () => {
		await renderWithProviders(
			<>
				<Text>Above</Text>
				<Separator />
				<Text>Below</Text>
			</>
		);
		expect(screen.getByText("Above")).toBeOnTheScreen();
		expect(screen.getByText("Below")).toBeOnTheScreen();
	});
});
