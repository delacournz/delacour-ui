import { BottomSheet } from "@delacour/native-ui/bottom-sheet";
import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { Dimensions, View } from "react-native";
import type { DesignSystemConfig } from "@/design-system/config";
import { setAxis } from "@/design-system/store";

/** Roughly what one single-line row occupies, for sizing a sheet to its content. */
const AXIS_ROW_HEIGHT = 52;
/** The title block above the rows, plus the sheet's own padding. */
const AXIS_CHROME_HEIGHT = 96;
const MIN_FRACTION = 0.32;
const MAX_FRACTION = 0.85;

/** The fill that marks the option currently applied. */
export const AXIS_SELECTED_ROW_CLASS = "rounded-lg bg-secondary";

/** What `/theme` hands every sheet, and the whole of what a sheet is told. */
export type AxisSheetControlProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

export type AxisSheetProps = AxisSheetControlProps & {
	title: string;
	description?: string;
	/** Rows the body draws, for sizing the sheet to its own content. */
	rowCount: number;
	/** Points one row occupies. Raise it for two-line rows. @default AXIS_ROW_HEIGHT */
	rowHeight?: number;
	children: ReactNode;
};

/**
 * The shell every axis sheet wears: a title, and its options scrolling under it.
 *
 * One sheet per axis, all of them siblings on `/theme` — never nested. Two
 * `BottomSheet`s inside one another stack two scrims and two gesture handlers
 * over the same content, and the inner one's dismissal races the outer's, which
 * is what the customizer's old pane swap existed to avoid. A screen behind the
 * sheets removes the reason for the swap entirely.
 *
 * **Sized to its own content, capped.** A fixed percentage is wrong at both ends
 * of this set: Radius has five rows and would open onto half a screen of
 * nothing, Font has twenty-nine and would open already needing a scroll. The
 * same computed snap point `DemoIndexSheet` uses, for the same reason — the
 * four fractions are deliberately duplicated there rather than shared, because
 * the two sheets size different content and are meant to drift apart.
 *
 * Three things here are load-bearing, and each is a silent failure:
 *
 * - `enableDynamicSizing={false}` with an explicit snap point is what
 *   `BottomSheet.ScrollView` needs. A dynamically sized sheet grows to whatever
 *   its content measures and has no height for its scrollable to fill, so a
 *   twenty-nine-row font list simply runs off the top of the screen.
 * - The title block and the scroll view are **siblings**. `BottomSheet.Content`
 *   is a static padded box, so a scroll view inside one inherits no bounded
 *   height and quietly stops scrolling partway down the list.
 * - The title block is a plain `View` rather than `Content` for a second
 *   reason: `Content` pays the sheet's safe-area bottom inset, which under a
 *   title opens a home-indicator-sized hole between the heading and the first
 *   row. The scroll view owns that inset, and owning it once is the point.
 *
 * Children need no gutter of their own — the scroll view's content container is
 * already `gap-4 px-screen-gutter pt-2`.
 */
export function AxisSheet({
	title,
	description,
	rowCount,
	rowHeight,
	isOpen,
	onOpenChange,
	children,
}: AxisSheetProps): ReactElement {
	// Memoised, unlike DemoIndexSheet's: an axis sheet re-renders on every
	// config change, and a fresh array identity makes gorhom re-derive its snap
	// points underneath a sheet that is open at the time.
	const snapPoints = useMemo(() => {
		const wanted = (AXIS_CHROME_HEIGHT + rowCount * (rowHeight ?? AXIS_ROW_HEIGHT)) / Dimensions.get("window").height;
		const fraction = Math.min(Math.max(wanted, MIN_FRACTION), MAX_FRACTION);
		return [`${Math.round(fraction * 100)}%`];
	}, [rowCount, rowHeight]);

	return (
		<BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Container enableDynamicSizing={false} snapPoints={snapPoints}>
					<View className="gap-1 px-screen-gutter pt-2 pb-2">
						<BottomSheet.Title>{title}</BottomSheet.Title>
						{description ? <BottomSheet.Description>{description}</BottomSheet.Description> : null}
					</View>
					<BottomSheet.ScrollView className="flex-1">{children}</BottomSheet.ScrollView>
				</BottomSheet.Container>
			</BottomSheet.Portal>
		</BottomSheet>
	);
}
AxisSheet.displayName = "Playground.AxisSheet";

/**
 * Applying one axis, and closing the sheet that chose it.
 *
 * **Choosing dismisses, where the old sheet returned to the axis list.** That
 * rule existed because the list was the sheet's other pane: not returning to it
 * meant nine trips back through the trigger. The list is a screen now, sitting
 * permanently behind every sheet, so the next axis is one tap away either way —
 * and dismissing is what lets you see the summary row you just changed repaint.
 *
 * Closing before writing, rather than after, so the dismissal animates against
 * the palette that was on screen when the row was tapped.
 */
export function useAxisChoice<Key extends keyof DesignSystemConfig>(
	key: Key,
	onOpenChange: (isOpen: boolean) => void
): (value: DesignSystemConfig[Key]) => void {
	return useCallback(
		(value: DesignSystemConfig[Key]) => {
			onOpenChange(false);
			setAxis(key, value);
		},
		[key, onOpenChange]
	);
}
