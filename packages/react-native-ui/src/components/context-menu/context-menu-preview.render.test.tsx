import { describe, expect, jest, test } from "@jest/globals";
import { Text } from "react-native";
import { CalmMotionProvider } from "../../hooks/use-calm-motion";
import { renderWithProviders, screen } from "../../test/render";
import { ContextMenuProvider } from "./context-menu.context";
import { ContextMenuPreview } from "./context-menu-preview";

const rect = { height: 40, width: 100, x: 10, y: 20 };

const mockWithTiming = jest.fn();
jest.mock("react-native-reanimated", () => {
	const actual = jest.requireActual<typeof import("react-native-reanimated")>("react-native-reanimated");
	return {
		__esModule: true,
		...actual,
		withTiming: (...args: Parameters<typeof actual.withTiming>) => {
			mockWithTiming();
			return actual.withTiming(...args);
		},
	};
});
jest.mock("../menu/menu.context", () => ({
	useMenuPart: () => ({ anchor: { height: 40, width: 100, x: 10, y: 20 } }),
}));

function Harness({ isMotionCalm }: { isMotionCalm: boolean }) {
	return (
		<CalmMotionProvider isMotionCalm={isMotionCalm}>
			<ContextMenuProvider
				value={{ content: null, invocation: null, invoke: () => undefined, registerContent: () => undefined }}
			>
				<ContextMenuPreview testID="preview">
					<Text>{`${rect.width}`}</Text>
				</ContextMenuPreview>
			</ContextMenuProvider>
		</CalmMotionProvider>
	);
}

describe("ContextMenu.Preview under calm motion", () => {
	test("isMotionCalm keeps the preview at rest scale", async () => {
		mockWithTiming.mockClear();
		const view = await renderWithProviders(<Harness isMotionCalm />);
		expect(screen.getByTestId("preview")).toBeOnTheScreen();
		expect(mockWithTiming).not.toHaveBeenCalled();
		await view.unmount();
	});

	test("without calm motion the preview lifts", async () => {
		mockWithTiming.mockClear();
		const view = await renderWithProviders(<Harness isMotionCalm={false} />);
		expect(mockWithTiming).toHaveBeenCalledTimes(1);
		await view.unmount();
	});
});
