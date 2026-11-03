import { describe, expect, test } from "@jest/globals";
import { Text } from "react-native";
import { renderWithProviders, screen } from "../../test/render";
import { Surface } from "./surface";
import { type SurfaceContextValue, useSurface, useSurfaceContext } from "./surface.context";

/** Writes the surface context it reads into a Text, so a test can assert on it. */
function Probe({ id }: { id: string }) {
	const context = useSurfaceContext();
	return <Text testID={id}>{context ? `${context.variant}|${context.plane}|${context.material}` : "none"}</Text>;
}

function StrictProbe() {
	const context: SurfaceContextValue = useSurface();
	return <Text testID="strict">{context.variant}</Text>;
}

describe("Surface", () => {
	test("renders its children and forwards View props", async () => {
		await renderWithProviders(
			<Surface testID="card" accessibilityLabel="Account">
				<Text>Signed in</Text>
			</Surface>
		);
		expect(screen.getByTestId("card")).toBeOnTheScreen();
		expect(screen.getByLabelText("Account")).toBeOnTheScreen();
		expect(screen.getByText("Signed in")).toBeOnTheScreen();
	});

	test("adds no role of its own, and a caller can set one", async () => {
		const view = await renderWithProviders(<Surface testID="card" />);
		expect(screen.getByTestId("card").props.accessibilityRole).toBeUndefined();

		await view.rerender(<Surface accessibilityRole="summary" accessible testID="card" />);
		expect(screen.getByRole("summary")).toBeOnTheScreen();
	});

	test("a top-level surface publishes the default fill", async () => {
		await renderWithProviders(
			<Surface>
				<Probe id="probe" />
			</Surface>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("default|default|flat");
	});

	test("an explicit variant is published", async () => {
		await renderWithProviders(
			<Surface variant="tertiary">
				<Probe id="probe" />
			</Surface>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("tertiary|tertiary|flat");
	});

	test("a nested surface steps off the fill it sits on", async () => {
		await renderWithProviders(
			<Surface>
				<Surface>
					<Probe id="second" />
					<Surface>
						<Probe id="third" />
					</Surface>
				</Surface>
			</Surface>
		);
		expect(screen.getByTestId("second")).toHaveTextContent("secondary|secondary|flat");
		expect(screen.getByTestId("third")).toHaveTextContent("tertiary|tertiary|flat");
	});

	test("an explicit variant wins over the step", async () => {
		await renderWithProviders(
			<Surface>
				<Surface variant="default">
					<Probe id="probe" />
				</Surface>
			</Surface>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("default|default|flat");
	});

	test("a transparent surface passes its parent's plane through", async () => {
		await renderWithProviders(
			<Surface variant="secondary">
				<Surface variant="transparent">
					<Probe id="probe" />
				</Surface>
			</Surface>
		);
		expect(screen.getByTestId("probe")).toHaveTextContent("transparent|secondary|flat");
	});

	test("a tray resets the plane, so a panel inside it takes the card fill", async () => {
		await renderWithProviders(
			<Surface material="tray">
				<Probe id="tray" />
				<Surface>
					<Probe id="panel" />
				</Surface>
			</Surface>
		);
		expect(screen.getByTestId("tray")).toHaveTextContent("default|null|tray");
		expect(screen.getByTestId("panel")).toHaveTextContent("default|default|flat");
	});

	test("useSurfaceContext is null outside a surface", async () => {
		await renderWithProviders(<Probe id="probe" />);
		expect(screen.getByTestId("probe")).toHaveTextContent("none");
	});

	test("useSurface reads the enclosing surface and throws outside one", async () => {
		await renderWithProviders(
			<Surface variant="secondary">
				<StrictProbe />
			</Surface>
		);
		expect(screen.getByTestId("strict")).toHaveTextContent("secondary");

		const original = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(<StrictProbe />)).rejects.toThrow(
				"useSurface must be called inside a <Surface>."
			);
		} finally {
			console.error = original;
		}
	});
});
