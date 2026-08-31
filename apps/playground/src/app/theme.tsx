import { Button } from "@delacour/native-ui/button";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, type ReactNode, useState } from "react";
import { View } from "react-native";
import { useUniwind } from "uniwind";
import type { AxisSheetControlProps } from "@/components/theme/axis-sheet";
import { BaseColorStrip } from "@/components/theme/base-color-strip";
import { ChartColorStrip } from "@/components/theme/chart-color-strip";
import { FontBottomSheet } from "@/components/theme/font.bottom-sheet";
import { HeadingBottomSheet } from "@/components/theme/heading.bottom-sheet";
import { IconLibraryBottomSheet } from "@/components/theme/icon-library.bottom-sheet";
import { FontPreview } from "@/components/theme/previews";
import { RadiusStrip } from "@/components/theme/radius-strip";
import { StyleStrip } from "@/components/theme/style-strip";
import { ThemePreview } from "@/components/theme/theme-preview";
import { ThemeStrip } from "@/components/theme/theme-strip";
import { useAxisPreview } from "@/components/theme/use-axis-preview";
import { fontByName } from "@/design-system/fonts";
import { resetConfig, setThemeMode, THEME_MODES, type ThemeMode } from "@/design-system/store";

/**
 * The axes that still open a sheet.
 *
 * The other five are strips above — they are the axes whose options are
 * compared against each other, where a sheet hides the thing being restyled
 * behind its own scrim. These three are read by name, so a list is right.
 * `iconLibrary` has a sheet and writes nothing.
 */
type AxisKey = "font" | "fontHeading" | "iconLibrary";

/**
 * The design-system customizer, as a screen.
 *
 * Modelled on <https://ui.shadcn.com/create>: eight orthogonal axes the user
 * combines themselves, persisted across restarts. It exists because a component
 * library is judged on whether it holds up under someone else's brand, and
 * until there was a second palette in this app nothing here proved the tokens
 * were doing the work.
 *
 * **A route rather than a sheet, and one sheet per axis rather than one sheet
 * with panes.** The old shape put the axis list and every option list in a
 * single `BottomSheet` that swapped its body, because nesting a second sheet
 * inside the first would stack two scrims and two gesture handlers over the
 * same content. A screen removes that constraint: the list is behind the
 * sheets, permanently, so eight sheets can be plain siblings.
 *
 * **Which sheet is open is one nullable key, not eight booleans.** That makes
 * "only one sheet at a time" structural rather than something eight handlers
 * have to agree about — and it is what makes the never-nest-two-sheets rule
 * impossible to break here.
 *
 * **All eight stay mounted, with `isOpen` deciding which presents.** Rendering
 * only the open one would unmount gorhom's modal the instant the key goes
 * `null`, so the sheet would vanish rather than slide down. It is affordable
 * because gorhom renders nothing until presented and because the swatch
 * resolution is memoised on `[config, mode]` — see `useAxisPreview`.
 *
 * **No `ThemeToggle` in this navbar**, alone among the app's screens. The
 * Appearance row below is the same setting with three states instead of two,
 * and a two-state toggle above it would be two controls disagreeing about how
 * many states exist.
 */
export default function ThemeRoute(): ReactElement {
	const router = useRouter();
	const [open, setOpen] = useState<AxisKey | null>(null);

	const sheet = (key: AxisKey): AxisSheetControlProps => ({
		isOpen: open === key,
		onOpenChange: (next: boolean) => setOpen(next ? key : null),
	});

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<View className="min-w-0 flex-1">
						<Screen.Navbar.Title>Theme</Screen.Navbar.Title>
						<Screen.Navbar.Subtitle>8 axes</Screen.Navbar.Subtitle>
					</View>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-6">
				<Text.Paragraph color="muted">
					Every axis repaints the same tokens, so nothing below is restyled by hand.
				</Text.Paragraph>

				<StyleStrip />
				<RadiusStrip />
				<BaseColorStrip />
				<ThemeStrip />
				<ChartColorStrip />
				<AxisRows onOpen={setOpen} />
				<AppearanceControls />

				<ThemePreview />

				<Button onPress={resetConfig} size="sm" testID="theme-reset" variant="ghost">
					Reset to Vega / Neutral
				</Button>
			</Screen.ScrollArea>

			<HeadingBottomSheet {...sheet("fontHeading")} />
			<FontBottomSheet {...sheet("font")} />
			<IconLibraryBottomSheet {...sheet("iconLibrary")} />
		</Screen>
	);
}

/** One row: the axis's name, its current value, and what that value looks like. */
function AxisRow({
	axis,
	label,
	value,
	preview,
	onOpen,
}: {
	axis: AxisKey;
	label: string;
	value: string;
	preview?: ReactNode;
	onOpen: (axis: AxisKey) => void;
}): ReactElement {
	return (
		<ListGroup.Item haptic="selection" onPress={() => onOpen(axis)} testID={`theme-axis-${axis}`}>
			<ListGroup.ItemContent>
				<ListGroup.ItemDescription>{label}</ListGroup.ItemDescription>
				<ListGroup.ItemTitle>{value}</ListGroup.ItemTitle>
			</ListGroup.ItemContent>
			{preview ? <ListGroup.ItemSuffix>{preview}</ListGroup.ItemSuffix> : null}
		</ListGroup.Item>
	);
}
AxisRow.displayName = "Playground.Theme.AxisRow";

/**
 * The eight axes, each showing what it is set to.
 *
 * Grouped the way shadcn groups them — palette, type, then the two that are
 * neither — rather than in one flat list, because eight rows with no seam reads
 * as a settings screen instead of a set of related decisions.
 *
 * Split out of the screen so both stay under Biome's cognitive-complexity cap;
 * the old single-component customizer scored 34 against a limit of 15.
 */
function AxisRows({ onOpen }: { onOpen: (axis: AxisKey) => void }): ReactElement {
	const { config } = useAxisPreview();

	const bodyFont = fontByName(config.font);
	const headingFont = config.fontHeading === "inherit" ? bodyFont : fontByName(config.fontHeading);

	return (
		<>
			<ListGroup>
				<AxisRow
					axis="fontHeading"
					label="Heading"
					onOpen={onOpen}
					preview={<FontPreview family={headingFont?.family ?? ""} />}
					value={headingFont?.title ?? "Inherit"}
				/>
				<AxisRow
					axis="font"
					label="Font"
					onOpen={onOpen}
					preview={<FontPreview family={bodyFont?.family ?? ""} />}
					value={bodyFont?.title ?? config.font}
				/>
			</ListGroup>

			<ListGroup>
				<AxisRow axis="iconLibrary" label="Icon Library" onOpen={onOpen} value="Central" />
			</ListGroup>
		</>
	);
}
AxisRows.displayName = "Playground.Theme.AxisRows";

/**
 * Light, dark, or whatever the OS is doing.
 *
 * Inline rather than a ninth sheet: three states already fully visible, where
 * every other axis has between five and twenty-nine and has to be opened to be
 * read. It is also the one control here that does not write
 * `DesignSystemConfig` — Uniwind owns the theme, and the store persists the
 * choice beside the configuration because Uniwind does not persist its own.
 */
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
						testID={`theme-mode-${name}`}
						variant={activeMode === name ? "primary" : "outline"}
					>
						{name}
					</Button>
				))}
			</View>
		</View>
	);
}
AppearanceControls.displayName = "Playground.Theme.AppearanceControls";
