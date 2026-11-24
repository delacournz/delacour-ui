import { describe, expect, test } from "@jest/globals";
import type { ReactElement } from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import { render, screen } from "../../test/render";
import { Button } from "../button";
import { DelacourProvider } from "./provider";

function CalmProbe(): ReactElement {
	return <Text>{useCalmMotion() ? "calm" : "moving"}</Text>;
}

function InsetsProbe(): ReactElement {
	const insets = useSafeAreaInsets();
	return <Text>{`top:${insets.top}`}</Text>;
}

describe("DelacourProvider", () => {
	test("renders its children", async () => {
		await render(
			<DelacourProvider>
				<Text>Hello</Text>
			</DelacourProvider>
		);
		expect(screen.getByText("Hello")).toBeOnTheScreen();
	});

	test("mounts the gesture root, so a Pressable-based control renders and is announced", async () => {
		await render(
			<DelacourProvider>
				<Button>Save</Button>
			</DelacourProvider>
		);
		expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();
	});

	test("isMotionCalm defaults to false", async () => {
		await render(
			<DelacourProvider>
				<CalmProbe />
			</DelacourProvider>
		);
		expect(screen.getByText("moving")).toBeOnTheScreen();
	});

	test("isMotionCalm reaches useCalmMotion beneath it", async () => {
		await render(
			<DelacourProvider isMotionCalm>
				<CalmProbe />
			</DelacourProvider>
		);
		expect(screen.getByText("calm")).toBeOnTheScreen();
	});

	test("isMotionCalm follows a rerender", async () => {
		const view = await render(
			<DelacourProvider isMotionCalm>
				<CalmProbe />
			</DelacourProvider>
		);
		await view.rerender(
			<DelacourProvider isMotionCalm={false}>
				<CalmProbe />
			</DelacourProvider>
		);
		expect(screen.getByText("moving")).toBeOnTheScreen();
	});

	test("initialMetrics seeds the safe-area insets for the first frame", async () => {
		await render(
			<DelacourProvider
				initialMetrics={{
					frame: { x: 0, y: 0, width: 390, height: 844 },
					insets: { top: 47, left: 0, right: 0, bottom: 34 },
				}}
			>
				<InsetsProbe />
			</DelacourProvider>
		);
		expect(screen.getByText("top:47")).toBeOnTheScreen();
	});

	test("initialMetrics={null} is accepted and children still mount", async () => {
		await render(
			<DelacourProvider initialMetrics={null}>
				<Text>Measured</Text>
			</DelacourProvider>
		);
		expect(screen.getByText("Measured")).toBeOnTheScreen();
	});

	test("style reaches the outermost view", async () => {
		await render(
			<DelacourProvider style={{ flex: 2 }}>
				<Text>Styled</Text>
			</DelacourProvider>
		);
		expect(screen.root).toHaveStyle({ flex: 2 });
	});
});
