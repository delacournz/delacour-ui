import { Text } from "@delacour/native-ui/text";
import { type ReactElement, type ReactNode, useCallback, useRef } from "react";
import { ScrollView, View } from "react-native";

/** The gap between tiles, as a number because the alignment maths needs it. */
const STRIP_GAP = 12;
/** What most tiles are wide. Theme's discs are narrower and say so. */
const DEFAULT_ITEM_WIDTH = 80;

export type AxisStripProps = {
	label: string;
	/**
	 * A line under the strip describing the current selection. Omit it where the
	 * tiles already carry their own names and a caption would only repeat one.
	 */
	caption?: string;
	/** Where the applied option sits, so the strip can open showing it. */
	selectedIndex: number;
	/** Tile width, for that same alignment. @default DEFAULT_ITEM_WIDTH */
	itemWidth?: number;
	children: ReactNode;
};

/**
 * An axis as a row of tiles rather than a row that opens a sheet.
 *
 * The five axes that use it are the ones whose options are judged *against each
 * other* rather than read one at a time. A sheet is the wrong instrument for
 * that comparison: it shows one screenful at a time with the app it is
 * restyling hidden behind its own scrim, so every comparison costs an open and
 * a close. Inline, a tap repaints everything under the strip and the axis can
 * be walked end to end with nothing opening.
 *
 * **It opens scrolled to the applied option.** A sheet always showed you the
 * current row; a strip that starts at zero hides it behind eighteen accents,
 * which is strictly worse than the control it replaced. The alignment runs once
 * per mount, on `onContentSizeChange` rather than in an effect — the offset is
 * meaningless until the content has been measured — and never again, because
 * re-aligning on every tap would yank the row out from under the finger that
 * just chose something.
 *
 * The selected tile is parked one slot in from the left rather than flush, so
 * it reads as a position in a row that continues in both directions instead of
 * as the first item.
 *
 * The scroller bleeds into the screen's gutter so a tile is cut by the edge
 * rather than stopping short of it — the cheapest honest signal that the row
 * continues. Its content keeps the gutter as padding, so the first tile still
 * lines up with the cards below.
 */
export function AxisStrip({ label, caption, selectedIndex, itemWidth, children }: AxisStripProps): ReactElement {
	const scrollRef = useRef<ScrollView>(null);
	const hasAlignedRef = useRef(false);

	const alignToSelection = useCallback(() => {
		if (hasAlignedRef.current || selectedIndex < 1) return;
		hasAlignedRef.current = true;
		const width = itemWidth ?? DEFAULT_ITEM_WIDTH;
		scrollRef.current?.scrollTo({ animated: false, x: (selectedIndex - 1) * (width + STRIP_GAP) });
	}, [itemWidth, selectedIndex]);

	return (
		<View className="gap-2">
			<Text.Label>{label}</Text.Label>
			<ScrollView
				className="-mx-screen-gutter"
				contentContainerClassName="gap-3 px-screen-gutter"
				horizontal
				onContentSizeChange={alignToSelection}
				ref={scrollRef}
				showsHorizontalScrollIndicator={false}
			>
				{children}
			</ScrollView>
			{caption ? <Text.Caption color="muted">{caption}</Text.Caption> : null}
		</View>
	);
}
AxisStrip.displayName = "Playground.AxisStrip";
