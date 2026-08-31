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
import { ACCENT_THEMES } from "@/design-system/themes";

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
	const config = useDesignSystem();
	const { theme, hasAdaptiveThemes } = useUniwind();
	const [isOpen, setOpen] = useState(false);
	const [pane, setPane] = useState<Pane>("root");

	const mode = theme === "dark" ? "dark" : "light";
	const activeMode: ThemeMode = hasAdaptiveThemes ? "system" : mode;

	if (pathname === CAPTURE_ROUTE) return null;

	const open = (next: boolean) => {
		setOpen(next);
		if (!next) setPane("root");
	};

	const choose = <Key extends keyof DesignSystemConfig>(key: Key, value: DesignSystemConfig[Key]) => {
		setAxis(key, value);
		setPane("root");
	};

	const preview = (candidate: Partial<DesignSystemConfig>) => resolveTokens({ ...config, ...candidate })[mode];

	const bodyFont = fontByName(config.font);
	const headingFont = config.fontHeading === "inherit" ? bodyFont : fontByName(config.fontHeading);
	const style = styleByName(config.style);
	const radius = radiusByName(config.radius);
	const palettes = palettesForBaseColor(config.baseColor);
	const resolved = resolveTokens(config)[mode];

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
								<View className="gap-4">
									<View className="gap-1">
										<BottomSheet.Title>Customize</BottomSheet.Title>
										<BottomSheet.Description>
											Every axis repaints the same tokens, so nothing below is restyled by hand.
										</BottomSheet.Description>
									</View>

									<ListGroup>
										<ListGroup.Item haptic="selection" onPress={() => setPane("style")}>
											<ListGroup.ItemContent>
												<ListGroup.ItemDescription>Style</ListGroup.ItemDescription>
												<ListGroup.ItemTitle>{style?.title ?? config.style}</ListGroup.ItemTitle>
											</ListGroup.ItemContent>
											<ListGroup.ItemSuffix>
												<RadiusPreview radius={style?.geometry.radius ?? 0} />
											</ListGroup.ItemSuffix>
										</ListGroup.Item>

										<ListGroup.Item haptic="selection" onPress={() => setPane("baseColor")}>
											<ListGroup.ItemContent>
												<ListGroup.ItemDescription>Base Color</ListGroup.ItemDescription>
												<ListGroup.ItemTitle>
													{BASE_COLORS.find((base) => base.name === config.baseColor)?.title ?? config.baseColor}
												</ListGroup.ItemTitle>
											</ListGroup.ItemContent>
											<ListGroup.ItemSuffix>
												<ColorPreview tokens={SWATCH_TOKENS} values={resolved as Record<string, string>} />
											</ListGroup.ItemSuffix>
										</ListGroup.Item>

										<ListGroup.Item haptic="selection" onPress={() => setPane("theme")}>
											<ListGroup.ItemContent>
												<ListGroup.ItemDescription>Theme</ListGroup.ItemDescription>
												<ListGroup.ItemTitle>
													{palettes.find((palette) => palette.name === config.theme)?.title ?? config.theme}
												</ListGroup.ItemTitle>
											</ListGroup.ItemContent>
											<ListGroup.ItemSuffix>
												<ColorPreview tokens={["primary"]} values={resolved as Record<string, string>} />
											</ListGroup.ItemSuffix>
										</ListGroup.Item>

										<ListGroup.Item haptic="selection" onPress={() => setPane("chartColor")}>
											<ListGroup.ItemContent>
												<ListGroup.ItemDescription>Chart Color</ListGroup.ItemDescription>
												<ListGroup.ItemTitle>
													{palettes.find((palette) => palette.name === config.chartColor)?.title ?? config.chartColor}
												</ListGroup.ItemTitle>
											</ListGroup.ItemContent>
											<ListGroup.ItemSuffix>
												<ColorPreview tokens={CHART_TOKENS} values={resolved as Record<string, string>} />
											</ListGroup.ItemSuffix>
										</ListGroup.Item>
									</ListGroup>

									<ListGroup>
										<ListGroup.Item haptic="selection" onPress={() => setPane("fontHeading")}>
											<ListGroup.ItemContent>
												<ListGroup.ItemDescription>Heading</ListGroup.ItemDescription>
												<ListGroup.ItemTitle>
													{config.fontHeading === "inherit"
														? `${bodyFont?.title ?? "Inherit"}`
														: (headingFont?.title ?? "")}
												</ListGroup.ItemTitle>
											</ListGroup.ItemContent>
											<ListGroup.ItemSuffix>
												<FontPreview family={headingFont?.family ?? ""} />
											</ListGroup.ItemSuffix>
										</ListGroup.Item>

										<ListGroup.Item haptic="selection" onPress={() => setPane("font")}>
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

										<ListGroup.Item haptic="selection" onPress={() => setPane("radius")}>
											<ListGroup.ItemContent>
												<ListGroup.ItemDescription>Radius</ListGroup.ItemDescription>
												<ListGroup.ItemTitle>{radius?.title ?? config.radius}</ListGroup.ItemTitle>
											</ListGroup.ItemContent>
											<ListGroup.ItemSuffix>
												<RadiusPreview radius={Number(resolved.radius ?? 0)} />
											</ListGroup.ItemSuffix>
										</ListGroup.Item>
									</ListGroup>

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

									<Button onPress={resetConfig} size="sm" variant="ghost">
										Reset to Vega / Neutral
									</Button>
								</View>
							) : (
								<View className="gap-3">
									<View className="flex-row items-center gap-2">
										<Button
											accessibilityLabel="Back"
											haptic="selection"
											isIconOnly
											onPress={() => setPane("root")}
											size="sm"
											variant="ghost"
										>
											<Icon icon={IconArrowLeft} />
										</Button>
										<BottomSheet.Title>{PANE_TITLES[pane]}</BottomSheet.Title>
									</View>

									<View className="gap-3">
										{pane === "style" ? (
											<ListGroup>
												{STYLES.map((candidate) => (
													<ListGroup.Item
														haptic="selection"
														key={candidate.name}
														onPress={() => choose("style", candidate.name)}
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
										) : null}

										{pane === "baseColor" ? (
											<ListGroup>
												{BASE_COLORS.map((candidate) => (
													<ListGroup.Item
														haptic="selection"
														key={candidate.name}
														onPress={() => choose("baseColor", candidate.name)}
													>
														<ListGroup.ItemContent>
															<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
														</ListGroup.ItemContent>
														<ListGroup.ItemSuffix>
															<ColorPreview
																tokens={SWATCH_TOKENS}
																values={preview({ baseColor: candidate.name }) as Record<string, string>}
															/>
														</ListGroup.ItemSuffix>
													</ListGroup.Item>
												))}
											</ListGroup>
										) : null}

										{pane === "theme" || pane === "chartColor" ? (
											<ListGroup>
												{palettes.map((candidate) => (
													<ListGroup.Item
														haptic="selection"
														key={candidate.name}
														onPress={() =>
															pane === "theme" ? choose("theme", candidate.name) : choose("chartColor", candidate.name)
														}
													>
														<ListGroup.ItemContent>
															<ListGroup.ItemTitle>{candidate.title}</ListGroup.ItemTitle>
														</ListGroup.ItemContent>
														<ListGroup.ItemSuffix>
															<ColorPreview
																tokens={pane === "theme" ? ["primary"] : CHART_TOKENS}
																values={
																	preview(
																		pane === "theme" ? { theme: candidate.name } : { chartColor: candidate.name }
																	) as Record<string, string>
																}
															/>
														</ListGroup.ItemSuffix>
													</ListGroup.Item>
												))}
											</ListGroup>
										) : null}

										{pane === "font" || pane === "fontHeading" ? (
											<>
												{pane === "fontHeading" ? (
													<ListGroup>
														<ListGroup.Item haptic="selection" onPress={() => choose("fontHeading", "inherit")}>
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
																	onPress={() =>
																		pane === "font"
																			? choose("font", candidate.name)
																			: choose("fontHeading", candidate.name)
																	}
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
											</>
										) : null}

										{pane === "radius" ? (
											<ListGroup>
												{RADII.map((candidate) => (
													<ListGroup.Item
														haptic="selection"
														key={candidate.name}
														onPress={() => choose("radius", candidate.name)}
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
										) : null}
									</View>
								</View>
							)}
						</BottomSheet.ScrollView>
					</BottomSheet.Container>
				</BottomSheet.Portal>
			</BottomSheet>
		</View>
	);
}
Customizer.displayName = "Playground.Customizer";

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
