import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { Button } from "@delacour/native-ui/button";
import { Icon } from "@delacour/native-ui/icon";
import { IconArrowLeft, IconColorSwatch } from "@delacour/native-ui/icons/central";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Text } from "@delacour/native-ui/text";
import { usePathname } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUniwind } from "uniwind";
import { ColorPreview, FontPreview, RadiusPreview } from "@/components/customizer/previews";
import { BASE_COLORS } from "@/design-system/base-colors";
import { type DesignSystemConfig, palettesForBaseColor } from "@/design-system/config";
import { FONT_GROUPS, fontByName } from "@/design-system/fonts";
import { RADII, radiusByName } from "@/design-system/radii";
import { resolveTokens } from "@/design-system/resolve";
import {
	resetConfig,
	setAxis,
	setThemeMode,
	THEME_MODES,
	type ThemeMode,
	useDesignSystem,
} from "@/design-system/store";
import { STYLES, styleByName } from "@/design-system/styles";

/**
 * The route the capture pipeline photographs.
 *
 * `bun run previews` deep-links here for every demo in both themes, so anything
 * floating over the app lands in every published media file. The gate is a
 * pathname check rather than a prop because this mounts once in `_layout.tsx`,
 * above the `Stack` that owns the route.
 */
const CAPTURE_ROUTE = "/preview";

/** The four tokens that tell two palettes apart at a glance. */
const SWATCH_TOKENS = ["background", "primary", "accent", "destructive"] as const;
const CHART_TOKENS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;

/**
 * A fixed height, because the body has to scroll inside it.
 *
 * `BottomSheet.ScrollView` needs a height to scroll within: with dynamic sizing
 * left on the sheet grows to whatever the content measures and there is nothing
 * to scroll, so a twenty-six-row font list simply runs off the top of the
 * screen. See the component's own doc comment.
 */
const SNAP_POINTS = ["86%"];

type Pane = "root" | keyof DesignSystemConfig | "appearance";

const PANE_TITLES: Record<Pane, string> = {
	root: "Customize",
	style: "Style",
	baseColor: "Base Color",
	theme: "Theme",
	chartColor: "Chart Color",
	font: "Font",
	fontHeading: "Heading",
	radius: "Radius",
	appearance: "Appearance",
};

function chooseAxis<Key extends keyof DesignSystemConfig>(
	key: Key,
	value: DesignSystemConfig[Key],
	onBack: () => void
): void {
	setAxis(key, value);
	onBack();
}

function previewTokens(
	config: DesignSystemConfig,
	mode: "light" | "dark",
	candidate: Partial<DesignSystemConfig>
): Record<string, string> {
	return resolveTokens({ ...config, ...candidate })[mode] as Record<string, string>;
}

/**
 * The design-system customizer: a floating trigger, and one sheet behind it.
 *
 * Modelled on <https://ui.shadcn.com/create>. Mounted once in `_layout.tsx`
 * rather than per screen, which is the point — a look is worth judging while
 * looking at the component you care about, not on a settings page you have to
 * navigate away to.
 *
 * **One sheet, two panes, not two sheets.** Pressing an axis swaps the body for
 * that axis's options and back. Nesting a second `BottomSheet` inside the first
 * would stack two scrims and two gesture handlers over the same content, and
 * the inner one's dismissal would race the outer's.
 *
 * Choosing an option returns to the axis list rather than closing: a customizer
 * is nine decisions, and dismissing after each one would mean nine trips back.
 *
 * `pb-safe` and friends are unavailable here — they need `Uniwind.updateInsets`
 * fed by a `SafeAreaListener`, which this app does not wire up — so the inset
 * comes from `react-native-safe-area-context` directly.
 */
export function Customizer(): ReactElement | null {
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const [isOpen, setOpen] = useState(false);
	const [pane, setPane] = useState<Pane>("root");

	if (pathname === CAPTURE_ROUTE) return null;

	const open = (next: boolean) => {
		setOpen(next);
		if (!next) setPane("root");
	};

	return (
		<View className="absolute right-5 bottom-0 z-50" style={{ marginBottom: insets.bottom + 20 }}>
			<BottomSheet isOpen={isOpen} onOpenChange={open}>
				<BottomSheet.Trigger asChild>
					<Button accessibilityLabel="Customize" haptic="selection" isIconOnly variant="secondary">
						<Icon icon={IconColorSwatch} />
					</Button>
				</BottomSheet.Trigger>
				<BottomSheet.Portal>
					<BottomSheet.Overlay />
					<BottomSheet.Container enableDynamicSizing={false} snapPoints={SNAP_POINTS}>
						<BottomSheet.ScrollView contentContainerClassName="pb-6">
							{pane === "root" ? (
								<RootPane onSelect={setPane} />
							) : (
								<AxisPane onBack={() => setPane("root")} pane={pane} />
							)}
						</BottomSheet.ScrollView>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
Customizer.displayName = "Playground.Customizer";

/** The axis list, appearance toggle, and reset — the sheet's home pane. */
function RootPane({ onSelect }: { onSelect: (pane: Pane) => void }): ReactElement {
	const config = useDesignSystem();
	const { theme } = useUniwind();
	const mode = theme === "dark" ? "dark" : "light";

	const bodyFont = fontByName(config.font);
	const headingFont = config.fontHeading === "inherit" ? bodyFont : fontByName(config.fontHeading);
	const style = styleByName(config.style);
	const radius = radiusByName(config.radius);
	const palettes = palettesForBaseColor(config.baseColor);
	const resolved = resolveTokens(config)[mode] as Record<string, string>;

	return (
		<View className="gap-4">
			<View className="gap-1">
				<BottomSheet.Title>Customize</BottomSheet.Title>
				<BottomSheet.Description>
					Every axis repaints the same tokens, so nothing below is restyled by hand.
				</BottomSheet.Description>
			</View>

			<ListGroup>
				<ListGroup.Item haptic="selection" onPress={() => onSelect("style")}>
					<ListGroup.ItemContent>
						<ListGroup.ItemDescription>Style</ListGroup.ItemDescription>
						<ListGroup.ItemTitle>{style?.title ?? config.style}</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<RadiusPreview radius={style?.geometry.radius ?? 0} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>

				<ListGroup.Item haptic="selection" onPress={() => onSelect("baseColor")}>
					<ListGroup.ItemContent>
						<ListGroup.ItemDescription>Base Color</ListGroup.ItemDescription>
						<ListGroup.ItemTitle>
							{BASE_COLORS.find((base) => base.name === config.baseColor)?.title ?? config.baseColor}
						</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ColorPreview tokens={SWATCH_TOKENS} values={resolved} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>

				<ListGroup.Item haptic="selection" onPress={() => onSelect("theme")}>
					<ListGroup.ItemContent>
						<ListGroup.ItemDescription>Theme</ListGroup.ItemDescription>
						<ListGroup.ItemTitle>
							{palettes.find((palette) => palette.name === config.theme)?.title ?? config.theme}
						</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ColorPreview tokens={["primary"]} values={resolved} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>

				<ListGroup.Item haptic="selection" onPress={() => onSelect("chartColor")}>
					<ListGroup.ItemContent>
						<ListGroup.ItemDescription>Chart Color</ListGroup.ItemDescription>
						<ListGroup.ItemTitle>
							{palettes.find((palette) => palette.name === config.chartColor)?.title ?? config.chartColor}
						</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ColorPreview tokens={CHART_TOKENS} values={resolved} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			</ListGroup>

			<ListGroup>
				<ListGroup.Item haptic="selection" onPress={() => onSelect("fontHeading")}>
					<ListGroup.ItemContent>
						<ListGroup.ItemDescription>Heading</ListGroup.ItemDescription>
						<ListGroup.ItemTitle>
							{config.fontHeading === "inherit" ? `${bodyFont?.title ?? "Inherit"}` : (headingFont?.title ?? "")}
						</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<FontPreview family={headingFont?.family ?? ""} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>

				<ListGroup.Item haptic="selection" onPress={() => onSelect("font")}>
					<ListGroup.ItemContent>
						<ListGroup.ItemDescription>Font</ListGroup.ItemDescription>
						<ListGroup.ItemTitle>{bodyFont?.title ?? config.font}</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<FontPreview family={bodyFont?.family ?? ""} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			</ListGroup>

			<ListGroup>
				<IconLibraryRow />

				<ListGroup.Item haptic="selection" onPress={() => onSelect("radius")}>
					<ListGroup.ItemContent>
						<ListGroup.ItemDescription>Radius</ListGroup.ItemDescription>
						<ListGroup.ItemTitle>{radius?.title ?? config.radius}</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<RadiusPreview radius={Number(resolved.radius ?? 0)} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			</ListGroup>

			<AppearanceControls />

			<Button onPress={resetConfig} size="sm" variant="ghost">
				Reset to Vega / Neutral
			</Button>
		</View>
	);
}
RootPane.displayName = "Playground.Customizer.RootPane";

/** Light / dark / system — lives outside RootPane so that pane stays under the complexity cap. */
function AppearanceControls(): ReactElement {
	const { theme, hasAdaptiveThemes } = useUniwind();
	const mode = theme === "dark" ? "dark" : "light";
	const activeMode: ThemeMode = hasAdaptiveThemes ? "system" : mode;

	return (
		<View className="gap-2">
			<Text.Label>Appearance</Text.Label>
			<View className="flex-row gap-2">
				{THEME_MODES.map((name) => (
					<Button
						key={name}
						onPress={() => setThemeMode(name)}
						size="sm"
						variant={activeMode === name ? "primary" : "outline"}
					>
						{name}
					</Button>
				))}
			</View>
		</View>
	);
}
AppearanceControls.displayName = "Playground.Customizer.AppearanceControls";

/** Back chrome plus the options for one design-system axis. */
function AxisPane({ pane, onBack }: { pane: Exclude<Pane, "root">; onBack: () => void }): ReactElement {
	return (
		<View className="gap-3">
			<View className="flex-row items-center gap-2">
				<Button accessibilityLabel="Back" haptic="selection" isIconOnly onPress={onBack} size="sm" variant="ghost">
					<Icon icon={IconArrowLeft} />
				</Button>
				<BottomSheet.Title>{PANE_TITLES[pane]}</BottomSheet.Title>
			</View>
			<AxisOptions onBack={onBack} pane={pane} />
		</View>
	);
}
AxisPane.displayName = "Playground.Customizer.AxisPane";

/** Dispatches an axis pane to the matching option list. */
function AxisOptions({ pane, onBack }: { pane: Exclude<Pane, "root">; onBack: () => void }): ReactElement | null {
	switch (pane) {
		case "style":
			return <StyleOptions onBack={onBack} />;
		case "baseColor":
			return <BaseColorOptions onBack={onBack} />;
		case "theme":
		case "chartColor":
			return <PaletteOptions axis={pane} onBack={onBack} />;
		case "font":
		case "fontHeading":
			return <FontOptions axis={pane} onBack={onBack} />;
		case "radius":
			return <RadiusOptions onBack={onBack} />;
		case "appearance":
			return null;
	}
}
AxisOptions.displayName = "Playground.Customizer.AxisOptions";

function StyleOptions({ onBack }: { onBack: () => void }): ReactElement {
	return (
		<ListGroup>
			{STYLES.map((candidate) => (
				<ListGroup.Item
					haptic="selection"
					key={candidate.name}
					onPress={() => chooseAxis("style", candidate.name, onBack)}
				>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>{candidate.description}</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<RadiusPreview radius={candidate.geometry.radius} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			))}
		</ListGroup>
	);
}
StyleOptions.displayName = "Playground.Customizer.StyleOptions";

function BaseColorOptions({ onBack }: { onBack: () => void }): ReactElement {
	const config = useDesignSystem();
	const { theme } = useUniwind();
	const mode = theme === "dark" ? "dark" : "light";

	return (
		<ListGroup>
			{BASE_COLORS.map((candidate) => (
				<ListGroup.Item
					haptic="selection"
					key={candidate.name}
					onPress={() => chooseAxis("baseColor", candidate.name, onBack)}
				>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ColorPreview tokens={SWATCH_TOKENS} values={previewTokens(config, mode, { baseColor: candidate.name })} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			))}
		</ListGroup>
	);
}
BaseColorOptions.displayName = "Playground.Customizer.BaseColorOptions";

function PaletteOptions({ axis, onBack }: { axis: "theme" | "chartColor"; onBack: () => void }): ReactElement {
	const config = useDesignSystem();
	const { theme } = useUniwind();
	const mode = theme === "dark" ? "dark" : "light";
	const palettes = palettesForBaseColor(config.baseColor);
	const tokens = axis === "theme" ? (["primary"] as const) : CHART_TOKENS;

	return (
		<ListGroup>
			{palettes.map((candidate) => (
				<ListGroup.Item
					haptic="selection"
					key={candidate.name}
					onPress={() => chooseAxis(axis, candidate.name, onBack)}
				>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ColorPreview tokens={tokens} values={previewTokens(config, mode, { [axis]: candidate.name })} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			))}
		</ListGroup>
	);
}
PaletteOptions.displayName = "Playground.Customizer.PaletteOptions";

function FontOptions({ axis, onBack }: { axis: "font" | "fontHeading"; onBack: () => void }): ReactElement {
	return (
		<View className="gap-3">
			{axis === "fontHeading" ? (
				<ListGroup>
					<ListGroup.Item haptic="selection" onPress={() => chooseAxis("fontHeading", "inherit", onBack)}>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Inherit</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>Follows the body font</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
					</ListGroup.Item>
				</ListGroup>
			) : null}

			{FONT_GROUPS.map((group) => (
				<View className="gap-2" key={group.type}>
					<Text.Overline>{group.label}</Text.Overline>
					<ListGroup>
						{group.fonts.map((candidate) => (
							<ListGroup.Item
								haptic="selection"
								key={candidate.name}
								onPress={() => chooseAxis(axis, candidate.name, onBack)}
							>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix>
									<FontPreview family={candidate.family} />
								</ListGroup.ItemSuffix>
							</ListGroup.Item>
						))}
					</ListGroup>
				</View>
			))}
		</View>
	);
}
FontOptions.displayName = "Playground.Customizer.FontOptions";

function RadiusOptions({ onBack }: { onBack: () => void }): ReactElement {
	const config = useDesignSystem();
	const style = styleByName(config.style);

	return (
		<ListGroup>
			{RADII.map((candidate) => (
				<ListGroup.Item
					haptic="selection"
					key={candidate.name}
					onPress={() => chooseAxis("radius", candidate.name, onBack)}
				>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
						{candidate.value === null ? (
							<ListGroup.ItemDescription>Whatever the style chose</ListGroup.ItemDescription>
						) : null}
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<RadiusPreview radius={candidate.value ?? style?.geometry.radius ?? 0} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			))}
		</ListGroup>
	);
}
RadiusOptions.displayName = "Playground.Customizer.RadiusOptions";

/**
 * The one axis shadcn offers that this library cannot.
 *
 * `native-ui` rule 5 is "Central Icons only — never Lucide, Hugeicons, or
 * anything else", and rule 7 allows a single `withUniwind` wrapper, already
 * spent on the Central Icons proxy that covers the whole two-thousand-icon set.
 * A second icon set would cost both rules to gain a control this library has no
 * use for. The row is kept, and not pressable, so the customizer reads the same
 * as the reference and the omission is stated rather than silently missing.
 */
function IconLibraryRow(): ReactElement {
	return (
		<ListGroup.Item>
			<ListGroup.ItemContent>
				<ListGroup.ItemDescription>Icon Library</ListGroup.ItemDescription>
				<ListGroup.ItemTitle>Central</ListGroup.ItemTitle>
			</ListGroup.ItemContent>
		</ListGroup.Item>
	);
}
IconLibraryRow.displayName = "Playground.Customizer.IconLibraryRow";
