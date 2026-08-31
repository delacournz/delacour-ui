import { Button } from "@delacour/native-ui/button";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Screen } from "@delacour/native-ui/screen";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, type ReactNode, useState } from "react";
import type { AxisSheetControlProps } from "@/components/theme/axis-sheet";
import { BaseColorStrip } from "@/components/theme/base-color-strip";
import { ChartColorStrip } from "@/components/theme/chart-color-strip";
import { FontBottomSheet } from "@/components/theme/font.bottom-sheet";
import { HeadingBottomSheet } from "@/components/theme/heading.bottom-sheet";
import { IconLibraryBottomSheet } from "@/components/theme/icon-library.bottom-sheet";
import { FontPreview } from "@/components/theme/previews";
import { RadiusStrip } from "@/components/theme/radius-strip";
import { StyleStrip } from "@/components/theme/style-strip";
import { ThemeStrip } from "@/components/theme/theme-strip";
import { useAxisPreview } from "@/components/theme/use-axis-preview";
import { fontByName } from "@/design-system/fonts";
import { resetConfig } from "@/design-system/store";

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
 * The first tab: every axis, and the sheets three of them still open.
 *
 * Modelled on <https://ui.shadcn.com/create>: eight orthogonal axes the user
 * combines themselves, persisted across restarts. It exists because a component
 * library is judged on whether it holds up under someone else's brand, and
 * until there was a second palette in this app nothing here proved the tokens
 * were doing the work.
 *
 * **Five axes are strips, three are sheets**, and the split is which question
 * the axis asks: a style, a ramp or a palette is judged against its neighbours,
 * where a sheet would hide the thing being restyled behind its own scrim; a
 * typeface or a library is read by name, where a list is right.
 *
 * The three sheets are plain siblings rather than panes of one sheet. That is
 * what the route bought: while the axis list lived *inside* a sheet, a second
 * one could not open over it — two scrims and two gesture handlers over the
 * same content, with the inner one's dismissal racing the outer's.
 *
 * **Which sheet is open is one nullable key, not three booleans**, so "only one
 * at a time" is structural rather than something three handlers have to agree
 * about — and it is what makes the never-nest-two-sheets rule impossible to
 * break here. **All three stay mounted**, with `isOpen` deciding which
 * presents: rendering only the open one would unmount gorhom's modal the
 * instant the key goes `null`, and the sheet would vanish rather than slide
 * down. It is affordable because gorhom renders nothing until presented.
 *
 * The tab bar, the navbar and the `Screen` around them live in `_layout.tsx`,
 * because they are chrome both tabs share and neither should move when a page
 * slides under them. This owns one scroll area and the sheets it opens.
 */
export default function ThemeDesignTab(): ReactElement {
	const [open, setOpen] = useState<AxisKey | null>(null);

	const sheet = (key: AxisKey): AxisSheetControlProps => ({
		isOpen: open === key,
		onOpenChange: (next: boolean) => setOpen(next ? key : null),
	});

	return (
		<>
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

				<Button onPress={resetConfig} size="sm" testID="theme-reset" variant="ghost">
					Reset to Vega / Neutral
				</Button>
			</Screen.ScrollArea>

			<HeadingBottomSheet {...sheet("fontHeading")} />
			<FontBottomSheet {...sheet("font")} />
			<IconLibraryBottomSheet {...sheet("iconLibrary")} />
		</>
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
