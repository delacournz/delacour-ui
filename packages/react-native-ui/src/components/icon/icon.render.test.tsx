import { describe, expect, test } from "@jest/globals";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";
import { renderWithProviders, screen } from "../../test/render";
import { Icon, type IconComponent } from "./icon";
import { IconDefaultsProvider, useIconDefaults } from "./icon.context";

/** A glyph that surfaces the props `Icon` hands it, the way a Central Icon receives them. */
const Glyph: IconComponent = ({ size, color, ...rest }: SvgProps & { size?: number | string }) => (
	<View
		{...rest}
		accessibilityLabel={rest.accessibilityLabel}
		testID={rest.testID ?? "glyph"}
		{...({ "data-size": size, "data-color": color } as Record<string, unknown>)}
	/>
);

function DefaultsProbe() {
	const defaults = useIconDefaults();
	return <View accessibilityLabel={defaults ? `${defaults.className}|${defaults.color}` : "none"} testID="probe" />;
}

describe("Icon", () => {
	test("renders the glyph it is given", async () => {
		await renderWithProviders(<Icon icon={Glyph} />);
		expect(screen.getByTestId("glyph")).toBeOnTheScreen();
	});

	test("forwards testID and accessibilityLabel to the glyph", async () => {
		await renderWithProviders(<Icon accessibilityLabel="Add" icon={Glyph} testID="add-icon" />);
		const glyph = screen.getByTestId("add-icon");
		expect(glyph).toHaveProp("accessibilityLabel", "Add");
		expect(screen.getByLabelText("Add")).toBe(glyph);
	});

	test("a numeric size reaches the glyph as its size prop", async () => {
		await renderWithProviders(<Icon icon={Glyph} size={28} />);
		expect(screen.getByTestId("glyph")).toHaveProp("data-size", 28);
	});

	test("a named size is a class, so the glyph gets no size prop of its own", async () => {
		await renderWithProviders(<Icon icon={Glyph} size="md" />);
		expect(screen.getByTestId("glyph").props["data-size"]).toBeUndefined();
	});

	test("the sizing className never reaches the glyph", async () => {
		await renderWithProviders(<Icon className="size-8" icon={Glyph} />);
		expect(screen.getByTestId("glyph")).not.toHaveProp("className");
	});

	test("a literal colour passes straight through to the glyph", async () => {
		await renderWithProviders(<Icon color="#EC4899" icon={Glyph} />);
		expect(screen.getByTestId("glyph")).toHaveProp("data-color", "#EC4899");
	});

	test("an unresolved theme token leaves the glyph colour unset rather than bogus", async () => {
		await renderWithProviders(<Icon color="muted-foreground" icon={Glyph} />);
		expect(screen.getByTestId("glyph").props["data-color"]).toBeUndefined();
	});

	test("a literal colour beats the colour inherited from a provider", async () => {
		await renderWithProviders(
			<IconDefaultsProvider value={{ className: "size-4", color: "primary-foreground" }}>
				<Icon color="#00FF00" icon={Glyph} />
			</IconDefaultsProvider>
		);
		expect(screen.getByTestId("glyph")).toHaveProp("data-color", "#00FF00");
	});

	test("a numeric size beats the size inherited from a provider", async () => {
		await renderWithProviders(
			<IconDefaultsProvider value={{ className: "size-4", color: "foreground" }}>
				<Icon icon={Glyph} size={30} />
			</IconDefaultsProvider>
		);
		expect(screen.getByTestId("glyph")).toHaveProp("data-size", 30);
	});

	test("extra SVG props such as opacity are forwarded", async () => {
		await renderWithProviders(<Icon icon={Glyph} opacity={0.5} />);
		expect(screen.getByTestId("glyph")).toHaveProp("opacity", 0.5);
	});

	describe("IconDefaultsProvider", () => {
		test("children read the nearest provider through useIconDefaults", async () => {
			await renderWithProviders(
				<IconDefaultsProvider value={{ className: "size-4.5", color: "primary-foreground" }}>
					<IconDefaultsProvider value={{ className: "size-6", color: "destructive" }}>
						<DefaultsProbe />
					</IconDefaultsProvider>
				</IconDefaultsProvider>
			);
			expect(screen.getByLabelText("size-6|destructive")).toBeOnTheScreen();
		});

		test("useIconDefaults is null outside a provider", async () => {
			await renderWithProviders(<DefaultsProbe />);
			expect(screen.getByLabelText("none")).toBeOnTheScreen();
		});

		test("an Icon renders inside a provider", async () => {
			await renderWithProviders(
				<IconDefaultsProvider value={{ className: "size-4", color: "foreground" }}>
					<Icon icon={Glyph} />
				</IconDefaultsProvider>
			);
			expect(screen.getByTestId("glyph")).toBeOnTheScreen();
		});
	});
});
