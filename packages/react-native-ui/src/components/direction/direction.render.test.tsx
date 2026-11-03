import { afterEach, describe, expect, test } from "@jest/globals";
import type { ReactElement } from "react";
import { I18nManager, Text } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { Direction } from "./direction";
import {
	DirectionProvider,
	directionContextValue,
	useDirection,
	useDirectionContext,
	useDirectionSign,
} from "./direction.context";

/** Prints what `useDirection()` and `useDirectionSign()` report, as one announced string. */
function Probe({ testID = "probe" }: { testID?: string }): ReactElement {
	const { dir, isRTL, sign } = useDirection();
	const signOnly = useDirectionSign();
	return <Text testID={testID}>{`${dir}|${String(isRTL)}|${sign}|${signOnly}`}</Text>;
}

function setAppRTL(value: boolean): void {
	Object.defineProperty(I18nManager, "isRTL", { value, configurable: true, writable: true });
}

const originalIsRTL = I18nManager.isRTL;

afterEach(() => {
	setAppRTL(originalIsRTL);
});

describe("Direction", () => {
	test("renders its children and forwards nothing else to a screen reader", async () => {
		await renderWithProviders(
			<Direction dir="rtl">
				<Text>مرحبا</Text>
			</Direction>
		);
		expect(screen.getByText("مرحبا")).toBeOnTheScreen();
	});

	test("dir=rtl publishes rtl through context", async () => {
		await renderWithProviders(
			<Direction dir="rtl">
				<Probe />
			</Direction>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("rtl|true|-1|-1");
	});

	test("dir=ltr publishes ltr through context, overriding an RTL app", async () => {
		setAppRTL(true);
		await renderWithProviders(
			<Direction dir="ltr">
				<Probe />
			</Direction>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("ltr|false|1|1");
	});

	test("omitted dir inherits the app's I18nManager.isRTL", async () => {
		setAppRTL(true);
		await renderWithProviders(
			<Direction>
				<Probe />
			</Direction>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("rtl|true|-1|-1");
	});

	test("omitted dir inherits the enclosing Direction over the app", async () => {
		setAppRTL(false);
		await renderWithProviders(
			<Direction dir="rtl">
				<Direction>
					<Probe />
				</Direction>
			</Direction>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("rtl|true|-1|-1");
	});

	test("a nested dir overrides its parent without changing the parent's subtree", async () => {
		await renderWithProviders(
			<Direction dir="rtl">
				<Probe testID="outer" />
				<Direction dir="ltr">
					<Probe testID="inner" />
				</Direction>
			</Direction>
		);
		expect(screen.getByTestId("outer")).toHaveTextContent("rtl|true|-1|-1");
		expect(screen.getByTestId("inner")).toHaveTextContent("ltr|false|1|1");
	});

	test("changing dir updates the subtree in place without remounting", async () => {
		const view = await renderWithProviders(
			<Direction dir="ltr">
				<Probe />
			</Direction>
		);
		const probe = screen.getByTestId("probe");
		expect(probe).toHaveTextContent("ltr|false|1|1");

		await view.rerender(
			<Direction dir="rtl">
				<Probe />
			</Direction>
		);
		expect(screen.getByTestId("probe")).toBe(probe);
		expect(probe).toHaveTextContent("rtl|true|-1|-1");
	});
});

describe("useDirection outside a Direction", () => {
	test("never throws and follows I18nManager.isRTL (ltr)", async () => {
		setAppRTL(false);
		await renderWithProviders(<Probe />);
		expect(screen.getByTestId("probe")).toHaveTextContent("ltr|false|1|1");
	});

	test("never throws and follows I18nManager.isRTL (rtl)", async () => {
		setAppRTL(true);
		await renderWithProviders(<Probe />);
		expect(screen.getByTestId("probe")).toHaveTextContent("rtl|true|-1|-1");
	});

	test("useDirectionContext is null outside a Direction", async () => {
		function Raw(): ReactElement {
			return <Text testID="raw">{String(useDirectionContext() === null)}</Text>;
		}
		await renderWithProviders(<Raw />);
		expect(screen.getByTestId("raw")).toHaveTextContent("true");
	});
});

describe("DirectionProvider", () => {
	test("republishes a value without a Direction box", async () => {
		await renderWithProviders(
			<DirectionProvider value={directionContextValue("rtl")}>
				<Probe />
			</DirectionProvider>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("rtl|true|-1|-1");
	});

	test("directionContextValue returns one stable object per direction", () => {
		expect(directionContextValue("rtl")).toBe(directionContextValue("rtl"));
		expect(directionContextValue("ltr")).not.toBe(directionContextValue("rtl"));
	});
});
